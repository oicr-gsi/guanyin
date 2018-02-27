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
        files_in text[],
        report_path text NOT NULL,
        notification_targets jsonb,
        notification_message text,
        notification_done boolean DEFAULT FALSE,
        parameters jsonb,
        PRIMARY KEY (report_record_id)
);


Insert INTO report (name, version, category, permitted_parameters)
VALUES ('jsonReport', '1.0', 'report', '{"Instrument":{"type":"s", "required":"false"}, "runName":{"type":"s", "required":"false"}}');

Insert INTO report_record (report_id, files_in, report_path, notification_targets, notification_message, parameters)
VALUES (1, '{"p1"}', '/oicr/data/archive/r1', '{"email":"xluo@oicr.on.ca"}', 'here is the run report', '{"runName":"170623_D00331_0244_BCB1LMANXX", "instrument":"HiSeq"}');

Insert INTO report (name, version, category, permitted_parameters)
VALUES ('jsonReport', '1.1', 'report', '{"Instrument":{"type":"s", "required":"false"}, "runName":{"type":"s", "required":"false"}}');

Insert INTO report_record (report_id, files_in, report_path, notification_targets, notification_message, parameters)
VALUES (2, '{"p1", "p2"}' ,'/oicr/data/archive/r2','{"email":"xluo@oicr.on.ca"}', 'here is the run report', '{"runName":"161017_M00146_0050_000000000-AW48L", "instrument":"MiSeq"}');

Insert INTO report (name, version, category, permitted_parameters)
VALUES ('coveragereport', '1.0', 'report', '{"project":{"type":"s", "required":"true"}, "instrument":{"type":"s", "required":"false"}}');

Insert INTO report_record (report_id, files_in, report_path, notification_targets, notification_message, parameters)
VALUES (3, '{"p1", "p2", "p3"}', '/oicr/data/archive/r3','{"email":"xluo@oicr.on.ca"}', 'here is the coverage report for PCSI', '{"project":"PCSI", "instrument":"HiSeq"}');

Insert INTO report (name, version, category, permitted_parameters)
VALUES ('coveragereport', '1.1', 'report', '{"project":{"type":"s", "required":"true"}, "instrument":{"type":"s", "required":"false"}}');

Insert INTO report_record (report_id, files_in, report_path, notification_targets, notification_message, parameters)
VALUES (4, '{"p1", "p2", "p3", "p4"}', '/oicr/data/archive/r4','{"email":"xluo@oicr.on.ca"}', 'Here is the voverage report for HALT', '{"project":"HALT", "instrument":"MiSeq"}');


