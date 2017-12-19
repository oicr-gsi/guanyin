var promise = require('bluebird');

var options = {
  // Initialization Options
  promiseLib: promise
};

var pgp = require('pg-promise')(options);
var db = pgp(process.env.DB_CONNECTION);

// add query functions
  
function getAllReports(req, res, next) {
  db.any('select * from report')
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ALL reports'
        });
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
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ONE report'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function createReport(req, res, next) {
  db.none('insert into report(name, version, category, permitted_parameters)' +
      'values(${name}, ${version}, ${category}, ${permitted_parameters})',
    req.body)
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Inserted one report'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function updateReport(req, res, next) {
  db.none('update report set name=$1, version=$2, category=$3, permitted_parameters=$4 where report_id=$5',
    [req.body.name, req.body.version, req.body.category,
      req.body.permitted_parameters, parseInt(req.params.id)])
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Updated report'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function getAllReportrecords(req, res, next) {
  db.any('select * from report_record')
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ALL report records'
        });
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
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved report records'
        });
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
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved ONE report record'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function createReportrecord(req, res, next) {
  req.body.report_id = parseInt(req.body.report_id);
  db.none('insert into report_record(report_id, files_in, report_path, notification_targets, notification_message, parameters)' +
      'values(${report_id}, ${files_in}, ${report_path}, ${notification_targets}, ${notification_message}, ${parameters})',
    req.body)
    .then(function () {
      res.status(200)
        .json({
          status: 'success',
          message: 'Inserted one report record'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}


function updateReportrecord(req, res, next) {
  db.none('update report_record set report_id=$1, files_in=$2, report_path=$3, notification_targets=$4, notification_message=$5,notification_done=$6, parameters=$7 where report_record_id=$8',
    [parseInt(req.body.report_id), req.body.files_in, req.body.report_path,
      req.body.notification_targets, req.body.notification_message, req.body.notification_done, req.body.parameters, parseInt(req.params.id)])
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

function updateReportrecord_notification_done(req, res, next) {
  db.none('update report_record set notification_done=$1 where report_record_id=$2',
    [req.body.notification_done, parseInt(req.params.id)])
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
  
  db.one('select rr.* from report_record rr, report r  where r.report_id=rr.report_id and r.name = $1 and r.version = $2 and rr.files_in= $3',
   [req.query.name, req.query.version, req.body.files_in])
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved report records'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}

function findReportrecord_parameters (req, res, next) {

  db.one('select rr.* from report_record rr, report r  where r.report_id=rr.report_id and r.name = $1 and r.version = $2 and rr.parameters= $3',
   [req.query.name, req.query.version, req.body.parameters])
    .then(function (data) {
      res.status(200)
        .json({
          status: 'success',
          data: data,
          message: 'Retrieved report records'
        });
    })
    .catch(function (err) {
      return next(err);
    });
}


module.exports = {
  getAllReports: getAllReports,
  getSingleReport: getSingleReport,
  createReport: createReport,
  updateReport: updateReport,
  getAllReportrecords: getAllReportrecords,
  getSingleReportrecord: getSingleReportrecord,
  createReportrecord: createReportrecord,
  updateReportrecord: updateReportrecord,
  updateReportrecord_notification_done: updateReportrecord_notification_done,
  getAllreportrecords_by_notification_done: getAllreportrecords_by_notification_done,
  findReportrecord_files_in: findReportrecord_files_in,
  findReportrecord_parameters: findReportrecord_parameters
};
