'use strict';
var express = require('express');
var router = express.Router();

var db = require('../queries');
const Joi = require('joi');
const expressJoi = require('express-joi-validator');

/**
 * @swagger
 * definitions:
 *   report:
 *     properties:
 *       report_id:
 *         type: integer
 *         description: The report ID
 *         readOnly: true
 *       name:
 *         type: string
 *         description: The name of the report
 *       version:
 *         type: string
 *         description: The version number of the report
 *       category:
 *         type: string
 *         description: The report category
 *       permitted_parameters:
 *         type: object
 *         additionalProperties:
 *           type: object
 *           properties:
 *             required:
 *               type: boolean
 *               description: Whether this parameter must be provided
 *               readOnly: true
 *             type:
 *               type: string
 *               description: The Shesmu type signature of this parameter
 *               readOnly: true
 *   report_record:
 *     properties:
 *       report_record_id:
 *         type: integer
 *         description: The report record ID
 *         readOnly: true
 *       report_id:
 *         type: integer
 *         description: The report ID
 *       date_generated:
 *         type: string
 *         format: date-time
 *         description: The date when the report was generated
 *       freshest_input_date:
 *         type: string
 *         format: date-time
 *         description: The last modified date of the newest file
 *       files_in:
 *         type: array
 *         description: The list of input file paths which generated the report. The array should be sorted.
 *       report_path:
 *         type: string
 *         description: The report file path
 *       notification_targets:
 *         type: object
 *         description: The json object. The targets such as email and Slack that receive the notice about the report
 *       notification_message:
 *         type: string
 *         description: The message sent out to the notification targets
 *       notification_done:
 *         type: boolean
 *         description: The report has been notified or not
 *       parameters:
 *         type: object
 *         description: The json object. The parameters used when generating the report. It complies with the permitted parameter json schema.
 */

/**
 * @swagger
 * /reportdb/reports:
 *   get:
 *     tags:
 *       - report
 *     description: Returns all reports
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: An array of reports
 *         schema:
 *           $ref: '#/definitions/report'
 */

router.get('/reportdb/reports', db.getAllReports);

/**
 * @swagger
 * /reportdb/report/{report_id}:
 *   get:
 *     tags:
 *       - report
 *     description: Returns a single report
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: report_id
 *         description: report id
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: A report with the given report_id
 *         schema:
 *           $ref: '#/definitions/report'
 */

const paramsSchema = {
  params: {
    id: Joi.number().required()
  }
};

router.get(
  '/reportdb/report/:id',
  expressJoi(paramsSchema),
  db.getSingleReport
);

/**
 * @swagger
 * /reportdb/report?name={name}:
 *   get:
 *     tags:
 *       - report
 *     description: Returns an array of reports
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: name
 *         description: the name of the report
 *         in: query
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: A list of reports with the given report name
 *         schema:
 *           $ref: '#/definitions/report'
 */

const querySchema_report = {
  query: {
    name: Joi.string().required()
  }
};
router.get(
  '/reportdb/report',
  expressJoi(querySchema_report),
  db.getAllreports_by_name
);

/**
 * @swagger
 * /reportdb/report:
 *   post:
 *     tags:
 *       - report
 *     description: Creates a new report
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: report
 *         description: report object
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/report'
 *     responses:
 *       200:
 *         description: Successfully created
 *         schema:
 *           type: object
 *           properties:
 *             report_id:
 *               type: integer
 *               description: The report id generated when creating the new report
 */

const bodySchema_report = {
  body: {
    name: Joi.string().required(),
    version: Joi.string().required(),
    category: Joi.string().required(),
    permitted_parameters: Joi.object().pattern(
      /^\w+$/,
      Joi.object().keys({
        type: Joi.string().required(),
        required: Joi.boolean().required()
      })
    )
  }
};
router.post(
  '/reportdb/report',
  expressJoi(bodySchema_report, { convert: false }),
  db.createReport
);

/**
 * @swagger
 * /reportdb/records:
 *   get:
 *     tags:
 *       - report_record
 *     description: Returns all report records
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: An array of report records
 *         schema:
 *           $ref: '#/definitions/report_record'
 */
router.get('/reportdb/records', db.getAllReportrecords);

/**
 * @swagger
 * /reportdb/record/{report_record_id}:
 *   get:
 *     tags:
 *       - report_record
 *     description: Returns a single report record
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: report_record_id
 *         description: the id for report_record
 *         in: path
 *         required: true
 *         type: integer
 *     responses:
 *       200:
 *         description: A report record with the given report_record_id
 *         schema:
 *           $ref: '#/definitions/report_record'
 */
router.get(
  '/reportdb/record/:id',
  expressJoi(paramsSchema),
  db.getSingleReportrecord
);

/**
 * @swagger
 * /reportdb/record?notification_done={notification_done}:
 *   get:
 *     tags:
 *       - report_record
 *     description: Returns an array of report records with a given notification_done
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: notification_done
 *         description: the report has been notified or not
 *         in: query
 *         required: true
 *         type: boolean
 *     responses:
 *       200:
 *         description: A list of report records with the given notification_done
 *         schema:
 *           $ref: '#/definitions/report_record'
 */

const querySchema_record = {
  query: {
    notification_done: Joi.boolean().required()
  }
};
router.get(
  '/reportdb/record',
  expressJoi(querySchema_record),
  db.getAllreportrecords_by_notification_done
);

/**
 * @swagger
 * /reportdb/record:
 *   post:
 *     tags:
 *       - report_record
 *     description: Creates a new report record
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: report_record
 *         description: report record object
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/report_record'
 *     responses:
 *       200:
 *         description: Successfully created
 *         schema:
 *           type: object
 *           properties:
 *             report_record_id:
 *               type: integer
 *               description: The report record id generated when creating the new report record
 */

const bodySchema_record = {
  body: {
    report_id: Joi.number().required(),
    date_generated: Joi.date(),
    freshest_input_date: Joi.date(),
    files_in: Joi.array().items(Joi.string().required()),
    report_path: Joi.string().required(),
    notification_targets: Joi.object().keys({
      email: Joi.array().items(Joi.string().email()),
      slack: Joi.array().items(Joi.string())
    }),
    notification_message: Joi.string(),
    notification_done: Joi.boolean(),
    parameters: Joi.object().pattern(/^\w+$/, Joi.any().required())
  }
};
router.post(
  '/reportdb/record',
  expressJoi(bodySchema_record),
  db.createReportrecord
);

/**
 * @swagger
 * /reportdb/record_notification?report_record_id={report_record_id}&notification_done={notification_done}:
 *   put:
 *     tags:
 *       - report_record
 *     description: update the notification_done for a given report record
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: report_record_id
 *         description: report record id
 *         in: query
 *         required: true
 *         type: integer
 *       - name: notification_done
 *         description: the report has been notified or not
 *         in: query
 *         required: true
 *         type: boolean
 *     responses:
 *       200:
 *         description: Successfully updated
 */

const querySchema_update_record_notification = {
  query: {
    report_record_id: Joi.number().required(),
    notification_done: Joi.boolean().required()
  }
};
router.put(
  '/reportdb/record_notification',
  expressJoi(querySchema_update_record_notification),
  db.updateReportrecord_notification_done
);

/**
 * @swagger
 * /reportdb/record_files?name={name}&version={version}:
 *   post:
 *     tags:
 *       - report_record
 *     description: find report records by the given report name, version and files_in
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: name
 *         description: the name of the report
 *         in: query
 *         required: true
 *       - name: version
 *         description: the version of the report
 *         in: query
 *         required: true
 *       - name: files_in
 *         description: the list of input files which generate the report
 *         in: body
 *         required: true
 *     responses:
 *       200:
 *         description: A list of report records with the given report name, version and files_in
 *         schema:
 *           $ref: '#/definitions/report_record'
 */

const Schema_record_files_in = {
  query: {
    name: Joi.string().required(),
    version: Joi.string().required()
  },
  body: {
    files_in: Joi.array().items(Joi.string().required())
  }
};
router.post(
  '/reportdb/record_files',
  expressJoi(Schema_record_files_in),
  db.findReportrecord_files_in
);

/**
 * @swagger
 * /reportdb/record_parameters?name={name}&version={version}:
 *   post:
 *     tags:
 *       - report_record
 *     description: find reportrecords by the given report name, version and parameters
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: name
 *         description: the name of the report
 *         in: query
 *         required: true
 *       - name: version
 *         description: the version of the report
 *         in: query
 *         required: true
 *       - name: parameters
 *         description: parameters used for generating the report
 *         in: body
 *         required: true
 *     responses:
 *       200:
 *         description: A list of report records with the given report name, version and parameters
 *         schema:
 *           $ref: '#/definitions/report_record'
 */

const Schema_record_parameters = {
  query: {
    name: Joi.string().required(),
    version: Joi.string().required()
  },
  body: {
    parameters: Joi.object().pattern(/^\w+$/, Joi.any().required())
  }
};
router.post(
  '/reportdb/record_parameters',
  expressJoi(Schema_record_parameters),
  db.findReportrecord_parameters
);

module.exports = router;
