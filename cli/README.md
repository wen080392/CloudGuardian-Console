# CloudGuardian CLI

Command Line Interface for CloudGuardian DevSecOps Platform.

The CloudGuardian CLI allows developers to scan their codebase for security vulnerabilities, secrets, and Infrastructure as Code (IaC) misconfigurations directly from their terminal or CI/CD pipelines.

## Features

- **Secret Scanning**: Detect hardcoded secrets, API keys, and passwords.
- **IaC Scanning**: Identify misconfigurations in Terraform files.
- **Flexible Reporting**: Generate reports in JSON, HTML, or SARIF formats.
- **CI/CD Integration**: Easy to integrate into GitHub Actions, GitLab CI, etc.
- **Concurrency**: Fast scanning using multi-threading.

## Installation

### Prerequisites

- Python 3.8 or higher
- `pip` package manager

### Install from Source

```bash
git clone https://github.com/cloudguardian/cloudguardian.git
cd cloudguardian/cli
pip install -e .
```

## Configuration

Before using the CLI, you need to configure it with your CloudGuardian API URL and Token.

```bash
cloudguardian-cli config --api-url http://localhost:3000/api/v1 --token YOUR_API_TOKEN
```

Alternatively, you can use environment variables:

```bash
export CLOUDGUARDIAN_API_URL="http://localhost:3000/api/v1"
export CLOUDGUARDIAN_TOKEN="YOUR_API_TOKEN"
```

To verify your configuration and API connectivity:

```bash
cloudguardian-cli health
```

## Usage

### Scanning a Single File

```bash
cloudguardian-cli scan path/to/your/file.tf
```

### Scanning a Directory

```bash
cloudguardian-cli scan ./infra
```

### Specifying Scan Type

By default, the CLI tries to auto-detect the file type. You can force a specific scan type (`secrets` or `terraform`):

```bash
cloudguardian-cli scan ./src -t secrets
```

### Filtering Files

You can include or exclude specific file patterns:

```bash
# Only scan .tf and .json files
cloudguardian-cli scan ./infra -p "*.tf" "*.json"

# Exclude test directories
cloudguardian-cli scan ./src -e "*/tests/*" "*.md"
```

### Generating Reports

You can output the scan results to a file in various formats (`json`, `html`, `sarif`):

```bash
# Generate a JSON report
cloudguardian-cli scan ./src -f json -o report.json

# Generate an HTML report
cloudguardian-cli scan ./src -f html -o report.html

# Generate a SARIF report (useful for GitHub Advanced Security)
cloudguardian-cli scan ./src -f sarif -o results.sarif
```

### Concurrency

Adjust the number of concurrent workers for faster scanning of large directories:

```bash
cloudguardian-cli scan ./large-repo -w 8
```

## CI/CD Integration

The CLI exits with code `1` if any vulnerabilities are found, making it perfect for CI/CD pipelines.

### GitHub Actions Example

```yaml
name: CloudGuardian Scan
on: [push, pull_request]

jobs:
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          
      - name: Install CloudGuardian CLI
        run: pip install -e ./cli
        
      - name: Run Scan
        env:
          CLOUDGUARDIAN_API_URL: ${{ secrets.CG_API_URL }}
          CLOUDGUARDIAN_TOKEN: ${{ secrets.CG_TOKEN }}
        run: |
          cloudguardian-cli scan . -f sarif -o cloudguardian-results.sarif
          
      - name: Upload SARIF file
        uses: github/codeql-action/upload-sarif@v3
        if: always()
        with:
          sarif_file: cloudguardian-results.sarif
```
