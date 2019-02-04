'use strict';
const express = require('express');
const router = express.Router();

const db = require('../queries');
const Joi = require('joi');
const expressJoi = require('../utils/express-joi-validator');

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
 *       lims_entity:
 *         type:
 *           - string
 *         required: false
 *         description: indicates which LIMS entity (if any) is associated with the report
 *         enum: [Project, Library, Pool, Run]
 *   report_record_post:
 *     properties:
 *       report_id:
 *         type: integer
 *         description: ID of the report that is being recorded
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
 *       parameters:
 *         type: object
 *         description: The json object. The parameters used when generating the report. It complies with the permitted parameter json schema. *
 *   report_record_start:
 *     properties:
 *       parameters:
 *         type: object
 *         description: The json object. The parameters used when generating the report. It complies with the permitted parameter json schema. *
 *   report_record_patch:
 *     properties:
 *       files_in:
 *         type: array
 *         description: The list of input file paths which generated the report. The array should be sorted.
 *       freshest_input_date:
 *         type: string
 *         description: The most recent modification time of the report's inputs.
 *       report_path:
 *         type: string
 *         description: The report file path
 *       notification_targets:
 *         type: object
 *         description: The json object. The targets such as email and Slack that receive the notice about the report
 *       notification_message:
 *         type: string
 *         description: The message sent out to the notification targets
 *   report_record_complete:
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
 *         description: the name of the report (one of name or lims_entity must be specified)
 *         in: query
 *         required: false
 *         type: string
 *       - name: lims_entity
 *         description: the type of LIMS entity associated with the report (one of name or lims_entity must be specified)
 *         in: query
 *         enum: [Project, Library, Pool, Run]
 *         required: false
 *         type: string
 *     responses:
 *       200:
 *         description: A list of reports with the given report name or associated with the given LIMS entity
 *         schema:
 *           $ref: '#/definitions/report'
 */

const querySchema_report = Joi.object().keys({
  query: Joi.object()
    .keys({
      name: Joi.string().required(),
      lims_entity: Joi.string()
        .valid('Project', 'Library', 'Pool', 'Run')
        .required()
    })
    .xor('name', 'lims_entity')
});

router.get(
  '/reportdb/report',
  expressJoi(querySchema_report),
  db.getAllreports_by_name
  // TODO: Fix to search separately by lims_entity (doesn't work!!)
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
 *       201:
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
    permitted_parameters: Joi.object()
      .pattern(
        /^\w+$/,
        Joi.object().keys({
          type: Joi.string().required(),
          required: Joi.boolean().required()
        })
      )
      .required(),
    lims_entity: Joi.string()
      .valid('Run', 'Pool', 'Library', 'Project')
      .optional()
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
 *           $ref: '#/definitions/report_record_complete'
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
 *           $ref: '#/definitions/report_record_complete'
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
 *           $ref: '#/definitions/report_record_complete'
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
 *           $ref: '#/definitions/report_record_post'
 *     responses:
 *       201:
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
      email: Joi.array()
        .allow(null)
        .items(Joi.string().email()),
      slack: Joi.array()
        .allow(null)
        .items(Joi.string())
    }),
    notification_message: Joi.string().allow(''),
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
 * /reportdb/record_start/{report_id}:
 *   post:
 *     tags:
 *       - report_record
 *     description: Creates a new report record with most fields to be provided later
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: report_id
 *         description: report ID
 *         in: query
 *         required: true
 *         type: integer
 *       - name: parameters
 *         description: parameter used to run the report
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/report_record_start'
 *     responses:
 *       201:
 *         description: Successfully created
 *         schema:
 *           type: object
 *           properties:
 *             report_record_id:
 *               type: integer
 *               description: The report record id generated when creating the new report record
 */

const bodySchema_record_start = {
  query: {
    report_id: Joi.number().required()
  },
  body: {
    parameters: Joi.object().pattern(/^\w+$/, Joi.any().required())
  }
};
router.post(
  '/reportdb/record_start/',
  expressJoi(bodySchema_record_start),
  db.createReportrecordStart
);

/**
 * @swagger
 * /reportdb/record/{report_record_id}:
 *   patch:
 *     tags:
 *       - report_record
 *     description: Updates fields in a record
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: report_record_id
 *         description: ID of the report record to update
 *         in: path
 *         required: true
 *         type: integer
 *       - name: report_record
 *         description: report record data to add or update
 *         in: body
 *         required: true
 *         schema:
 *           $ref: '#/definitions/report_record_patch'
 *     responses:
 *       200:
 *         description: Successfully update
 *         schema:
 *           $ref: '#/definitions/report_record_complete'
 *       404:
 *         description: No unfinished report record found for given report_record_id.
 */

const bodySchema_record_patch = {
  params: {
    id: Joi.number().required()
  },
  body: {
    freshest_input_date: Joi.date(),
    files_in: Joi.array().items(Joi.string().required()),
    report_path: Joi.string().required(),
    notification_targets: Joi.object().keys({
      email: Joi.array().items(Joi.string().email()),
      slack: Joi.array().items(Joi.string())
    }),
    notification_message: Joi.string().allow('')
  }
};
router.patch(
  '/reportdb/record/:id',
  expressJoi(bodySchema_record_patch),
  db.patchReportrecord
);

/**
 * @swagger
 * /reportdb/record/{report_record_id}/notification:
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
 *     responses:
 *       200:
 *         description: Successfully updated
 */

const querySchema_update_record_notification = {
  params: {
    id: Joi.number().required()
  }
};
router.put(
  '/reportdb/record/:id/notification',
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
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *
 *     responses:
 *       200:
 *         description: A list of report records with the given report name, version and files_in
 *         schema:
 *           $ref: '#/definitions/report_record_complete'
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
 *       - name: report ID
 *         description: the id of the report (as an alternative to name and version)
 *         in: query
 *         required: false
 *       - name: name
 *         description: the name of the report
 *         in: query
 *         required: false
 *       - name: version
 *         description: the version of the report
 *         in: query
 *         required: false
 *       - name: parameters
 *         description: parameters used for generating the report
 *         in: body
 *         required: true
 *         schema:
 *           type: object
 *     responses:
 *       200:
 *         description: A list of report records with the given report name, version and parameters
 *         schema:
 *           $ref: '#/definitions/report_record_complete'
 */

const Schema_record_parameters = {
  query: {
    report: Joi.number().optional(),
    name: Joi.string().optional(),
    version: Joi.string().optional()
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
