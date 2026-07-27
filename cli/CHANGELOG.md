# Changelog

All notable changes to the CloudGuardian CLI tool will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-03-08

### Added
- Initial release of the CloudGuardian CLI tool.
- `scan` command to scan individual files or entire directories.
- Support for auto-detecting scan types (`secrets`, `terraform`).
- Concurrent scanning using `ThreadPoolExecutor` for improved performance.
- Filtering options to include (`-p`, `--patterns`) or exclude (`-e`, `--exclude`) specific files.
- `config` command to manage API URL and Token settings.
- `health` command to verify API connectivity.
- Report generation in JSON, HTML, and SARIF formats.
- Integration with the CloudGuardian backend API (`/api/v1/scans`, `/api/v1/health`).
- Comprehensive test suite using `pytest`.
- GitHub Actions workflow for automated testing.
- Documentation including `README.md` and `DEVELOPMENT.md`.

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A
