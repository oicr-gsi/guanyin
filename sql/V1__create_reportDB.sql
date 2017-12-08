DROP TABLE IF EXISTS ReportRecord;
DROP SEQUENCE IF EXISTS ReportRecord_reportRecordId_seq;

DROP TABLE IF EXISTS Report;
DROP SEQUENCE IF EXISTS report_reportId_seq;

CREATE SEQUENCE report_reportId_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE Report (
	reportId integer DEFAULT nextval('report_reportId_seq'::regclass) NOT NULL,
	name text,
	version text,
	category text,
	permitted_parameters json,
	PRIMARY KEY (reportId)
);

CREATE SEQUENCE ReportRecord_reportRecordId_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE ReportRecord (
	reportRecordId integer DEFAULT nextval('ReportRecord_reportRecordId_seq'::regclass) NOT NULL,
	reportId integer REFERENCEs Report (reportId),
	date_generated timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	freshest_input_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	files_in json,
	report_path text NOT NULL,
	notification_targets json,
	message text,
	notification_done boolean DEFAULT FALSE,
	parameters json,
	PRIMARY KEY (reportRecordId)
);

