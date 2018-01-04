DROP TABLE IF EXISTS ReportRecord;
DROP TABLE IF EXISTS Report;

CREATE TABLE report (
        report_id Serial,
        name text,
        version text,
        category text,
        permitted_parameters jsonb,
        PRIMARY KEY (report_id)
);


CREATE TABLE report_record (
        report_record_id Serial,
        report_id integer REFERENCEs report (report_id),
        date_generated timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        freshest_input_date timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        files_in jsonb,
        report_path text NOT NULL,
        notification_targets jsonb,
        notification_message text,
        notification_done boolean DEFAULT FALSE,
        parameters jsonb,
        PRIMARY KEY (report_record_id)
);

