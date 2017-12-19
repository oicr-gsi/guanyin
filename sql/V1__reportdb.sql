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

Insert INTO report (name, version, category, permitted_parameters)
VALUES ('jsonReport', '1.0', 'report', '{"runName":"2017", "instrument":"HiSeq"}');

Insert INTO report_record (report_id, files_in, report_path, notification_targets, notification_message, parameters)
VALUES (1, '{"file_id":"a1", "file_path":"p1"}','/oicr/data/archive','{"email":"xluo@oicr.on.ca"}', 'here is the run report', '{"runName":"2017", "instrument":"HiSeq"}');

