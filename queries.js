var promise = require('bluebird');

var options = {
  // Initialization Options
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var db = pgp(process.env.DB_CONNECTION);

/**
 * Parse a Shesmu type signature and return an object that can check and sort values.
 *
 * This returns an object with three properties: check (checks if object
 * matches signature), compare (compares two values and determines canonicalise
 * order), canonicalise ("sort" a value), rest (the unparsed type string; this
 * should be empty for a valid string). Null is returned if the type is not
 * valid.
 */
function parseShesmuType(type) {
  switch (type.charAt(0)) {
    case 'i':
    case 'd': // This is intentional; dates are millis since the epoch
      return {
        check: value => typeof value === 'number',
        compare: (a, b) => a - b,
        canonicalise: value => value,
        rest: type.substring(1)
      };
    case 's':
    case 'p': // This is intentional; paths are still strings
      return {
        check: value => typeof value === 'string',
        compare: (a, b) => a.localeCompare(b),
        canonicalise: value => value,
        rest: type.substring(1)
      };
    case 'b':
      return {
        check: value => typeof value === 'boolean',
        compare: (a, b) => a - b,
        canonicalise: value => value,
        rest: type.substring(1)
      };
    case 'a':
      return (() => {
        const inner = parseShesmuType(type.substr(1));
        if (inner == null) {
          return null;
        }
        return {
          check: value =>
            Array.isArray(value) && value.every(child => inner.check(child)),
          compare: (a, b) =>
            a.length - b.length ||
            a.reduce(
              (acc, avalue, index) => acc || inner.compare(avalue, b[index]),
              0
            ),
          canonicalise: value =>
            value.map(inner.canonicalise).sort(inner.compare),
          rest: inner.rest
        };
      })();
    case 't':
    case 'o':
      return (() => {
        let match;
        if ((match = /^([0-9]*)([^0-9].*)$/.exec(type.substr(1))) === null) {
          return null;
        }
        let rest = match[2];
        const count = parseInt(match[1]);
        if (type.charAt(0) == 't') {
          const types = [];
          for (let index = 0; index < count; index++) {
            const type = parseShesmuType(rest);
            if (type == null) {
              return null;
            }
            rest = type.rest;
            types.push(type);
          }
          return {
            check: value =>
              Array.isArray(value) &&
              value.length == types.length &&
              value.every((child, index) => types[index].check(child)),
            compare: (a, b) =>
              types.reduce(
                (acc, type, index) => acc || type.compare(a[index], b[index]),
                0
              ),
            canonicalise: value =>
              value.map((child, index) => types[index].canonicalise(child)),
            rest: rest
          };
        } else {
          const fields = [];
          for (let index = 0; index < count; index++) {
            if ((match = /^([^$]*)\$(.*)$/.exec(rest)) === null) {
              return null;
            }
            rest = match[2];
            const type = parseShesmuType(rest);
            if (type == null) {
              return null;
            }
            rest = type.rest;
            fields.push({ name: match[1], type: type });
          }
          return {
            check: value =>
              value !== null &&
              typeof value == 'object' &&
              !Array.isArray(value) &&
              Object.keys(value).length == fields.length &&
              fields.every(
                field =>
                  value.hasOwnProperty(field.name) &&
                  field.type.check(value[field.name])
              ),
            compare: (a, b) =>
              fields.reduce(
                (acc, field) =>
                  acc || field.type.compare(a[field.name], b[field.name]),
                0
              ),
            canonicalise: value => {
              const result = {};
              fields.forEach(
                field =>
                  (result[field.name] = field.type.canonicalise(
                    value[field.name]
                  ))
              );

              return result;
            },
            rest: rest
          };
        }
      })();
    default:
      return null;
  }
}

/**
 * validate parameters against permitted parameters
 */
function validateParameters(req, res, permitted_parameters) {
  var permittedNames = Object.keys(permitted_parameters);
  for (var nameIndex = 0; nameIndex < permittedNames.length; nameIndex++) {
    var name = permittedNames[nameIndex];
    if (req.body.parameters.hasOwnProperty(name)) {
      let type = parseShesmuType(permitted_parameters[name].type);
      if (!type.check(req.body.parameters[name])) {
        res
          .status(400)
          .send(
            'Invalid value for parameter ' +
              name +
              '. Expected type ' +
              permitted_parameters[name].type +
              '.'
          );
        return 0;
      }
      req.body.parameters[name] = type.canonicalise(req.body.parameters[name]);
    } else if (permitted_parameters[name].required) {
      res
        .status(400)
        .send('Report requires ' + name + ', but paramter not supplied.');
      return 0;
    }
  }
  var providedNames = Object.keys(req.body.parameters);
  for (nameIndex = 0; nameIndex < providedNames.length; nameIndex++) {
    name = providedNames[nameIndex];
    if (!permitted_parameters.hasOwnProperty(name)) {
      res.status(400).send('Invalid parameter ' + name + ' provided.');
      return 0;
    }
  }
  return 1;
}

// add query functions

function getAllReports(req, res, next) {
  db
    .any('select * from report')
    .then(function(data) {
      res.status(200).json(data);
    })
    .catch(function(err) {
      return next(err);
    });
}

function getSingleReport(req, res, next) {
  var reportID = parseInt(req.params.id);
  db
    .one('select * from report where report_id = $1', reportID)
    .then(function(data) {
      res.status(200).json(data);
    })
    .catch(function(err) {
      return next(err);
    });
}

function getAllreports_by_name(req, res, next) {
  var name = req.query.name;
  db
    .any('select * from report where name = $1', name)
    .then(function(data) {
      res.status(200).json(data);
    })
    .catch(function(err) {
      return next(err);
    });
}

function createReport(req, res, next) {
  if (!req.body.hasOwnProperty('lims_entity')) {
    // property may be null if it is not associated with a LIMS entity (Project, Library, Run, Pool)
    req.body.lims_entity = null;
  }
  if (
    !Object.values(req.body.permitted_parameters).every(p => {
      const type = parseShesmuType(p.type);
      return type != null && type.rest === '';
    })
  ) {
    res.status(400).send('Invalid type signature on parameter.');
  }
  db
    .one(
      'insert into report(name, version, category, permitted_parameters, lims_entity)' +
        'values(${name}, ${version}, ${category}, ${permitted_parameters}, ${lims_entity})' +
        'returning report_id',
      req.body
    )
    .then(function(data) {
      res.status(200).json(data);
    })
    .catch(function(err) {
      return next(err);
    });
}

function getAllReportrecords(req, res, next) {
  db
    .any('select * from report_record')
    .then(function(data) {
      res.status(200).json(data);
    })
    .catch(function(err) {
      return next(err);
    });
}

function getAllreportrecords_by_notification_done(req, res, next) {
  var done = req.query.notification_done;
  db
    .any('select * from report_record where notification_done = $1', done)
    .then(function(data) {
      res.status(200).json(data);
    })
    .catch(function(err) {
      return next(err);
    });
}

function getSingleReportrecord(req, res, next) {
  var report_record_ID = parseInt(req.params.id);
  db
    .one(
      'select * from report_record where report_record_id = $1',
      report_record_ID
    )
    .then(function(data) {
      res.status(200).json(data);
    })
    .catch(function(err) {
      return next(err);
    });
}

function createReportrecord(req, res, next) {
  var reportID = parseInt(req.body.report_id);
  req.body.report_id = reportID;
  db
    .one('select * from report where report_id = $1', reportID)
    .then(function(report) {
      var permitted_parameters = report.permitted_parameters;
      if (!validateParameters(req, res, permitted_parameters)) {
        return;
      }
      db
        .one(
          'insert into report_record(report_id, finished, date_generated, freshest_input_date, files_in, report_path, notification_targets, notification_message, parameters)' +
            'values(${report_id}, true, ${date_generated}, ${freshest_input_date}, ${files_in}, ${report_path}, ${notification_targets}, ${notification_message}, ${parameters})' +
            'returning report_record_id',
          req.body
        )
        .then(function(data) {
          res.status(200).json(data);
        })
        .catch(function(err) {
          return next(err);
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function createReportrecordStart(req, res, next) {
  var reportID = parseInt(req.query.report);
  req.body.report_id = reportID;
  db
    .one('select * from report where report_id = $1', reportID)
    .then(function(report) {
      var permitted_parameters = report.permitted_parameters;
      if (!validateParameters(req, res, permitted_parameters)) {
        return;
      }
      db
        .one(
          'insert into report_record(report_id, finished, date_generated, parameters)' +
            'values(${report_id}, false, NOW(), ${parameters})' +
            'returning report_record_id',
          req.body
        )
        .then(function(data) {
          res.status(200).json(data);
        })
        .catch(function(err) {
          return next(err);
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

function patchReportrecord(req, res, next) {
  req.body.report_record_id = parseInt(req.params.id);
  db
    .one(
      'update report_record set finished=true, freshest_input_date=${freshest_input_date}, files_in=${files_in}, report_path=${report_path}, notification_targets=${notification_targets}, notification_message=${notification_message} where report_record_id=${report_record_id} and finished=false returning report_record_id',
      req.body
    )
    .then(function() {
      res.status(200).json({
        status: 'success',
        message: 'Updated report record'
      });
    })
    .catch(function(err) {
      return next(err);
    });
}

function updateReportrecord_notification_done(req, res, next) {
  db
    .one(
      'update report_record set notification_done=true where report_record_id=$1 returning report_record_id',
      [parseInt(req.params.id)]
    )
    .then(function() {
      res.status(200).json({
        status: 'success',
        message: 'Updated report record'
      });
    })
    .catch(function(err) {
      return next(err);
    });
}

function findReportrecord_files_in(req, res, next) {
  db
    .any(
      'select rr.* from report_record rr, report r  where r.report_id=rr.report_id and r.name = $1 and r.version = $2 and rr.files_in= $3',
      [req.query.name, req.query.version, req.body.files_in]
    )
    .then(function(data) {
      res.status(200).json(data);
    })
    .catch(function(err) {
      return next(err);
    });
}

function findReportrecord_parameters(req, res, next) {
  let promise;
  if (req.query.hasOwnProperty('report')) {
    promise = db.one('select * from report where report_id = $1', [
      parseInt(req.query.report)
    ]);
  } else {
    promise = db.one('select * from report where name = $1 and version = $2', [
      req.query.name,
      req.query.version
    ]);
  }

  promise
    .then(function(report) {
      var reportID = report.report_id;
      var permitted_parameters = report.permitted_parameters;
      if (!validateParameters(req, res, permitted_parameters)) {
        return;
      }
      db
        .any(
          'select rr.* from report_record rr where rr.report_id=$1 and rr.parameters= $2',
          [reportID, req.body.parameters]
        )
        .then(function(data) {
          res.status(200).json(data);
        })
        .catch(function(err) {
          return next(err);
        });
    })
    .catch(function(err) {
      return next(err);
    });
}

module.exports = {
  getAllReports: getAllReports,
  getSingleReport: getSingleReport,
  getAllreports_by_name: getAllreports_by_name,
  createReport: createReport,
  getAllReportrecords: getAllReportrecords,
  getSingleReportrecord: getSingleReportrecord,
  createReportrecord: createReportrecord,
  createReportrecordStart: createReportrecordStart,
  patchReportrecord: patchReportrecord,
  updateReportrecord_notification_done: updateReportrecord_notification_done,
  getAllreportrecords_by_notification_done: getAllreportrecords_by_notification_done,
  findReportrecord_files_in: findReportrecord_files_in,
  findReportrecord_parameters: findReportrecord_parameters
};
