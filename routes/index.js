var express = require('express');
var router = express.Router();

var db = require('../queries');

router.get('/reportdb/reports', db.getAllReports);
router.get('/reportdb/report/:id', db.getSingleReport);
router.post('/reportdb/report', db.createReport);
router.put('/reportdb/report/:id', db.updateReport);
router.get('/reportdb/reportrecords', db.getAllReportrecords);
router.get('/reportdb/reportrecord/:id', db.getSingleReportrecord);
router.get('/reportdb/reportrecord', db.getAllreportrecords_by_notification_done);
router.post('/reportdb/reportrecord', db.createReportrecord);
router.put('/reportdb/reportrecord/:id', db.updateReportrecord);
router.put('/reportdb/reportrecord/:id/notification_done', db.updateReportrecord_notification_done);
router.post('/reportdb/files_in', db.findReportrecord_files_in);
router.post('/reportdb/parameters', db.findReportrecord_parameters);
module.exports = router;
