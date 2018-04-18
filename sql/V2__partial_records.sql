ALTER TABLE report_record ADD COLUMN finished boolean NOT NULL DEFAULT true;
ALTER TABLE report_record ALTER COLUMN report_path DROP NOT NULL
