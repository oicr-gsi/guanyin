const promise = require('bluebird');

const options = {
  // Initialization Options
  promiseLib: promise
};

const pgp = require('pg-promise')(options);
const db = pgp(process.env.DB_CONNECTION);

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

/** set up custom error if bad params are given */
function ValidationError(message) {
  this.name = 'ValidationError';
  this.message = message || '';
}
ValidationError.prototype = Error.prototype;

/**
 * validate parameters against permitted parameters
 */
function throwIfHasInvalidParams(req, permitted_parameters) {
  const permittedNames = Object.keys(permitted_parameters);
  for (let nameIndex = 0; nameIndex < permittedNames.length; nameIndex++) {
    const name = permittedNames[nameIndex];
    if (req.body.parameters.hasOwnProperty(name)) {
      let type = parseShesmuType(permitted_parameters[name].type);
      if (!type.check(req.body.parameters[name])) {
        throw new ValidationError(
          'Invalid value for parameter ' +
            name +
            '. Expected type ' +
            permitted_parameters[name].type +
            '.'
        );
      }
      req.body.parameters[name] = type.canonicalise(req.body.parameters[name]);
    } else if (permitted_parameters[name].required) {
      throw new ValidationError(
        'Report requires parameter "' + name + '", but it was not supplied.'
      );
    }
  }
  const providedNames = Object.keys(req.body.parameters);
  for (let nameIndex = 0; nameIndex < providedNames.length; nameIndex++) {
    const name = providedNames[nameIndex];
    if (!permitted_parameters.hasOwnProperty(name)) {
      throw new ValidationError('Invalid parameter "' + name + '" provided.');
    }
  }
  return 1;
}

// add query functions

async function getAllReports(req, res, next) {
  try {
    const reports = await db.any('select * from report');
    return res.status(200).json(reports);
  } catch (err) {
    return next(err);
  }
}

async function getSingleReport(req, res, next) {
  try {
    const report = await getReportById(req.params.id);
    return res.status(200).json(report);
  } catch (err) {
    returnIfNotFound(err, res, 'report');
    return next(err);
  }
}

async function getAllreports_by_name(req, res, next) {
  try {
    const reports = await db.any(
      'select * from report where name = $1',
      req.query.name
    );
    return res.status(200).json(reports);
  } catch (err) {
    return next(err);
  }
}

function checkTypeDefinitionValidity(parameters) {
  return Object.values(parameters).every(p => {
    const type = parseShesmuType(p.type);
    return type != null && type.rest === '';
  });
}

async function createReport(req, res, next) {
  try {
    if (!req.body.hasOwnProperty('lims_entity')) {
      // property may be null if it is not associated with a LIMS entity (Project, Library, Run, Pool)
      req.body.lims_entity = null;
    }
    if (!checkTypeDefinitionValidity(req.body.permitted_parameters)) {
      throw new ValidationError('Invalid type signature on parameter.');
    }
    const reportData = { ...req.body };
    const insert = await db.one(
      'insert into report(name, version, category, permitted_parameters, lims_entity)' +
        'values(${name}, ${version}, ${category}, ${permitted_parameters}, ${lims_entity})' +
        'returning report_id',
      reportData
    );
    return res.status(201).json(insert);
  } catch (err) {
    return next(err);
  }
}

async function getAllReportrecords(req, res, next) {
  try {
    const records = await db.any('select * from report_record');
    return res.status(200).json(records);
  } catch (err) {
    return next(err);
  }
}

async function getAllreportrecords_by_notification_done(req, res, next) {
  try {
    const records = await db.any(
      'select * from report_record where notification_done = $1',
      req.query.notification_done
    );
    return res.status(200).json(records);
  } catch (err) {
    return next(err);
  }
}

async function getSingleReportrecord(req, res, next) {
  try {
    const record = await db.one(
      'select * from report_record where report_record_id = $1',
      parseInt(req.params.id)
    );
    return res.status(200).json(record);
  } catch (err) {
    returnIfNotFound(err, res, 'report record');
    return next(err);
  }
}

async function createReportrecord(req, res, next) {
  try {
    const reportID = parseInt(req.body.report_id);
    const report = await getReportById(reportID);
    confirmReportParametersAreValid(req, report, reportID);
    const recordData = { ...req.body };
    recordData.report_id = reportID;
    const insert = await db.one(
      'insert into report_record(report_id, finished, date_generated, freshest_input_date, files_in, report_path, notification_targets, notification_message, parameters)' +
        'values(${report_id}, true, ${date_generated}, ${freshest_input_date}, ${files_in}, ${report_path}, ${notification_targets}, ${notification_message}, ${parameters})' +
        'returning report_record_id',
      recordData
    );
    return res.status(201).json(insert);
  } catch (err) {
    returnIfNotFound(err, res, 'report'); // only getReportById will throw a not found error
    return next(err);
  }
}

async function getReportById(reportID) {
  return await db.one('select * from report where report_id = $1', reportID);
}

function confirmReportParametersAreValid(req, report, reportID) {
  if (report == null)
    throw new ValidationError('Could not find report for ID ' + reportID);
  if (req.body == null || !req.body.hasOwnProperty('parameters'))
    throw new ValidationError(
      'Could not validate parameters because no "parameters" object was provided'
    );
  throwIfHasInvalidParams(req, report.permitted_parameters);
}

async function deleteReport(req, res, next) {
  try {
    if (!req.params.hasOwnProperty('id')) {
      throw new ValidationError('Must include an id of the report to delete');
    }
    const relatedReportRecords = await db.any(
      'select * from report_record where report_id = $1',
      req.params.id
    );
    if (relatedReportRecords.length) {
      throw new ValidationError(
        'Cannot delete report ' +
          req.params.id +
          ' as it has ' +
          relatedReportRecords.length +
          ' associated report record(s)'
      );
    }
    const report = await db.any(
      'select * from report where report_id = $1',
      req.params.id
    );
    if (!report.length) {
      // report was not found
      return res.sendStatus(404);
    }

    await db.result('delete from report where report_id = $1', req.params.id);
    return res.sendStatus(204);
  } catch (err) {
    return next(err);
  }
}

async function createReportrecordStart(req, res, next) {
  try {
    const reportID = parseInt(req.query.report);
    const report = await getReportById(reportID);
    confirmReportParametersAreValid(req, report, reportID);
    const recordData = { ...req.body };
    recordData.report_id = reportID;
    const insert = await db.one(
      'insert into report_record(report_id, finished, date_generated, parameters)' +
        'values(${report_id}, false, NOW(), ${parameters})' +
        'returning report_record_id',
      recordData
    );
    return res.status(201).json(insert);
  } catch (err) {
    return next(err);
  }
}

async function patchReportrecord(req, res, next) {
  try {
    const recordData = { ...req.body };
    recordData.report_record_id = parseInt(req.params.id);
    await db.one(
      'update report_record set finished=true, freshest_input_date=${freshest_input_date}, files_in=${files_in}, report_path=${report_path}, notification_targets=${notification_targets}, notification_message=${notification_message} where report_record_id=${report_record_id} and finished=false returning report_record_id',
      recordData
    );
    return res.status(200).json({
      status: 'success',
      message: 'Updated report record'
    });
  } catch (err) {
    returnIfNotFound(err, res, 'unfinished report record');
    return next(err);
  }
}

async function updateReportrecord_notification_done(req, res, next) {
  try {
    await db.one(
      'update report_record set notification_done=true where report_record_id=$1 returning report_record_id',
      [parseInt(req.params.id)]
    );
    return res.status(200).json({
      status: 'success',
      message: 'Updated report record'
    });
  } catch (err) {
    returnIfNotFound(err, res, 'report record');
    return next(err);
  }
}

async function findReportrecord_files_in(req, res, next) {
  try {
    const record = await db.any(
      'select rr.* from report_record rr, report r  where r.report_id=rr.report_id and r.name = $1 and r.version = $2 and rr.files_in= $3',
      [req.query.name, req.query.version, req.body.files_in]
    );
    return res.status(200).json(record);
  } catch (err) {
    return next(err);
  }
}

async function findReportrecord_parameters(req, res, next) {
  if (!req.body.hasOwnProperty('parameters')) {
    throw new ValidationError('Parameters must be provided');
  }
  let report;
  try {
    if (req.query.hasOwnProperty('report')) {
      report = await getReportById(parseInt(req.query.report));
    } else {
      report = await db.one(
        'select * from report where name = $1 and version = $2',
        [req.query.name, req.query.version]
      );
    }
  } catch (err) {
    returnIfNotFound(err, res, 'report');
    return next(err);
  }
  if (report == null || report.report_id == null) {
    send404(res, 'report');
  }
  try {
    confirmReportParametersAreValid(req, report, report.report_id);
    const record = await db.any(
      'select rr.* from report_record rr where rr.report_id=$1 and rr.parameters= $2',
      [report.report_id, req.body.parameters]
    );
    return res.status(200).json(record);
  } catch (err) {
    returnIfNotFound(err, res, 'report record');
    return next(err);
  }
}

/** Catches errors thrown by `db.one` calls which returned no items */
function returnIfNotFound(err, res, itemName) {
  if (err.result != null && err.result.rowCount == 0) {
    send404(res, itemName);
  }
}

function send404(res, itemName) {
  return res.status(404).json({
    status: 'not found',
    message: `The ${itemName} you requested could not be found`
  });
}

module.exports = {
  getAllReports: getAllReports,
  getSingleReport: getSingleReport,
  getAllreports_by_name: getAllreports_by_name,
  createReport: createReport,
  deleteReport: deleteReport,
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
