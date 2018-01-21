create user reporter;
alter role reporter with password 'test';
grant all on database test_report_db to reporter;