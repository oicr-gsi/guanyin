# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and as of version 1.0.0, follows semantic versioning.

## [1.1.0]  2019-02-21
### Added:
  * Prometheus monitoring
  * Logging
  * API data validation
  * API endpoint for creating minimal report records and filling in details later
  * Support for Shesmu paths, objects
### Changed:
  * Updated API endpoints
    * Removed `/reportdb/record_notification`
      * Replaced with `/reportdb/record/{report_record_id}/notification`
    * Added ability to search for report records with matching report ID and parameters
  * Tests now run using Flyway Docker container