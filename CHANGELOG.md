# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and as of version 1.0.0, follows semantic versioning.

## Unreleased
### Added
  * Support for Node v14+ (Recommended Node v18)

### Removed
  * Support for Node v12 and earlier


## [1.4.0] 2021-10-28
### Added
  * Search report records by report ID

### Changed
  * Use streaming for getAllReports and getAllReportrecords

## [1.3.0] 2021-04-09
### Added
  * Increased allowable request body size
  * Added logging of which Shesmu parameters fail validation

## [1.2.0] 2021-04-09
### Added
  * Allow deleting reports without report records
  * Allow building using Docker

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
