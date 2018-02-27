var promise = require('bluebird');

var options = {
  // Initialization Options
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var db = pgp(process.env.DB_CONNECTION);

/**
 * Check that a value matches the provided Shemu type signature.
 *
 * This returns the position in the type string where checking finished, or
 * zero if the type is not valid.
 */
function typeCheck(type, value) {
  switch(type.charAt(0)) {
    case 'i':
      return typeof(value) === 'number' ? 1 : 0;
    case 's':
      return typeof(value) === 'string' ? 1 : 0;
    case 'd':
      return typeof(value) === 'string' ? 1 : 0; // This is intentional
    case 'b':
      return typeof(value) === 'boolean' ? 1 : 0;
    case 'a':
      if (!Array.isArray(value)) {
         return 0;
      }
      var result = Math.min.apply(null, value.map(child => typeCheck(type.substr(1), child)));
      return result === 0 ? 0 : (result + 1);
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
      if (count != value.length) {
        return 0;
      }
      for (var index = 0; index < count; index++) {
        const inner = typeCheck(match[2].substr(offset), value[index]);
        if (inner === 0) {
          return 0;
        }
        offset += inner;
      }
      return offset;
    default:
      return 0;
  }
}

// add query functions
  
function getAllReports(req, res, next) {
  db.any('select * from report')
    .then(function (data) {
      res.status(200)
        .json(data);
    })
    .catch(function (err) {
      return next(err);
    });
}

function getSingleReport(req, res, next) {
  var reportID = parseInt(req.params.id);
  db.one('select * from report where report_id = $1', reportID)
    .then(function (data) {
      res.status(200)
        .json(data);
    })
    .catch(function (err) {
      return next(err);
    });
}

function getAllreports_by_name (req, res, next) {
  var name = req.query.name;
  db.any('select * from report where name = $1', name)
    .then(function (data) {
      res.status(200)
        .json(data);
    })
    .catch(function (err) {
      return next(err);
    });
}


function createReport(req, res, next) {
  db.one('insert into report(name, version, category, permitted_parameters)' +
      'values(${name}, ${version}, ${category}, ${permitted_parameters})' +
      'returning report_id',
    req.body)
    .then(function (data) {
      res.status(200)
        .json(data);
    })
    .catch(function (err) {
      return next(err);
    });
}

function getAllReportrecords(req, res, next) {
  db.any('select * from report_record')
    .then(function (data) {
      res.status(200)
        .json(data);
    })
    .catch(function (err) {
      return next(err);
    });
}


function getAllreportrecords_by_notification_done (req, res, next) {
  var done = req.query.notification_done;
  db.any('select * from report_record where notification_done = $1', done)
    .then(function (data) {
      res.status(200)
        .json(data);
    })
    .catch(function (err) {
      return next(err);
    });
}

function getSingleReportrecord(req, res, next) {
  var report_record_ID = parseInt(req.params.id);
  db.one('select * from report_record where report_record_id = $1', report_record_ID)
    .then(function (data) {
      res.status(200)
        .json(data);
    })
    .catch(function (err) {
      return next(err);
    });
}

function createReportrecord(req, res, next) {
  var reportID = parseInt(req.body.report_id);
  req.body.report_id = reportID;
  db.one('select * from report where report_id = $1', reportID)
    .then(function (report) {
      var permittedNames = Object.keys(report.permitted_parameters);
      for (var nameIndex = 0; nameIndex < permittedNames.length; nameIndex++) {
        var name = permittedNames[nameIndex];
        if (req.body.parameters.hasOwnProperty(name)) {
          let type = report.permitted_parameters[name].type;
          if (typeCheck(type, req.body.parameters[name]) !== type.length) {
            res.status(400).send('Invalid value for parameter ' + name + '. Expected type ' + report.permitted_parameters[name].type + '.');
            return;
          }
        } else if (report.permitted_parameters[name].required) {
          res.status(400).send('Report requires ' + name + ', but paramter not supplied.');
          return;
        }
      }
      var providedNames = Object.keys(req.body.parameters);
      for (nameIndex = 0; nameIndex < providedNames.length; nameIndex++) {
        name = providedNames[nameIndex];
        if (!report.permitted_parameters.hasOwnProperty(name)) {
          res.status(400).send('Invalid parameter ' + name + ' provided.');
          return;
        }
      }

      db.one('insert into report_record(report_id, date_generated, freshest_input_date, files_in, report_path, notification_targets, notification_message, parameters)' +
          'values(${report_id}, ${date_generated}, ${freshest_input_date}, ${files_in}, ${report_path}, ${notification_targets}, ${notification_message}, ${parameters})' +
          'returning report_record_id',
        req.body)
        .then(function (data) {
          res.status(200)
            .json(data);
        })
        .catch(function (err) {
          return next(err);
        });

    })
    .catch(function (err) {
      return next(err);
    });
}

function updateReportrecord_notification_done(req, res, next) {
  db.none('update report_record set notification_done=$1 where report_record_id=$2',
    [req.query.notification_done, parseInt(req.query.report_record_id)])
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Updated report record'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function findReportrecord_files_in (req, res, next) {
  
  db.any('select rr.* from report_record rr, report r  where r.report_id=rr.report_id and r.name = $1 and r.version = $2 and rr.files_in= $3',
   [req.query.name, req.query.version, req.body.files_in])
    .then(function (data) {
      res.status(200)
        .json(data);
    })
    .catch(function (err) {
      return next(err);
    });
}

function findReportrecord_parameters (req, res, next) {

  db.any('select rr.* from report_record rr, report r  where r.report_id=rr.report_id and r.name = $1 and r.version = $2 and rr.parameters= $3',
   [req.query.name, req.query.version, req.body.parameters])
    .then(function (data) {
      res.status(200)
        .json(data);
    })
    .catch(function (err) {
      return next(err);
    });
}


module.exports = {
  getAllReports: getAllReports,
  getSingleReport: getSingleReport,
  getAllreports_by_name:getAllreports_by_name,
  createReport: createReport,
  getAllReportrecords: getAllReportrecords,
  getSingleReportrecord: getSingleReportrecord,
  createReportrecord: createReportrecord,
  updateReportrecord_notification_done: updateReportrecord_notification_done,
  getAllreportrecords_by_notification_done: getAllreportrecords_by_notification_done,
  findReportrecord_files_in: findReportrecord_files_in,
  findReportrecord_parameters: findReportrecord_parameters
};
