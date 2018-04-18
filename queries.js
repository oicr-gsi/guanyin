var promise = require('bluebird');

var options = {
  // Initialization Options
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var db = pgp(process.env.DB_CONNECTION);

/**
 * Check that a value matches the provided Shesmu type signature.
 *
 * This returns the position in the type string where checking finished, or
 * zero if the type is not valid.
 */
function typeCheck(type, value) {
  switch (type.charAt(0)) {
    case 'i':
      return typeof value === 'number' ? 1 : 0;
    case 's':
      return typeof value === 'string' ? 1 : 0;
    case 'd':
      return typeof value === 'string' ? 1 : 0; // This is intentional
    case 'b':
      return typeof value === 'boolean' ? 1 : 0;
    case 'a':
      if (!Array.isArray(value)) {
        return 0;
      }
      var result = Math.min.apply(
        null,
        value.map(child => typeCheck(type.substr(1), child))
      );
      return result === 0 ? 0 : result + 1;
    case 't':
      if (!Array.isArray(value)) {
        return 0;
      }
      var match;
      if ((match = /^([0-9]*)([^0-9].*)$/.exec(type.substr(1))) === null) {
        return 0;
      }
      var offset = 0;
      var count = parseInt(match[1]);
      for (var index = 0; index < count; index++) {
        const inner = typeCheck(match[2].substr(offset), value[index]);
        if (inner === 0) {
          return 0;
        }
        offset += inner;
      }
      return offset + match[1].length + 1;
    default:
      return 0;
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
      let type = permitted_parameters[name].type;
      if (typeCheck(type, req.body.parameters[name]) !== type.length) {
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
  db
    .one(
      'insert into report(name, version, category, permitted_parameters)' +
        'values(${name}, ${version}, ${category}, ${permitted_parameters})' +
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
