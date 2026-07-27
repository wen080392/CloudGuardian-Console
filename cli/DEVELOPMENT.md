# CloudGuardian CLI Development Guide

This guide provides instructions for developers who want to contribute to the CloudGuardian CLI tool.

## Architecture

The CLI is built using standard Python libraries to minimize external dependencies and ensure broad compatibility.

### Core Components

- **`cloudguardian_cli.py`**: The main entry point containing the CLI logic, configuration management, scanning engine, and report generation.
- **`CloudGuardianConfig`**: Handles loading, saving, and managing API credentials and URLs.
- **`CloudGuardianScanner`**: Manages the interaction with the backend API, file reading, and concurrent scanning.
- **`ReportGenerator`**: Responsible for formatting scan results into JSON, HTML, or SARIF.
- **`ScanResult`**: A dataclass representing the outcome of a single file scan.

## Setup Development Environment

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/cloudguardian/cloudguardian.git
    cd cloudguardian/cli
    ```

2.  **Create a virtual environment (recommended):**
    ```bash
    python3 -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3.  **Install dependencies in editable mode:**
    ```bash
    pip install -e .
    pip install -r requirements.txt
    ```

## Running Tests

We use `pytest` for unit testing.

1.  **Run all tests:**
    ```bash
    pytest
    ```

2.  **Run tests with verbose output:**
    ```bash
    pytest -v
    ```

3.  **Run specific test file:**
    ```bash
    pytest test_cli.py
    ```

## Adding New Features

### 1. Adding a New Command

To add a new command to the CLI, modify the `main()` function in `cloudguardian_cli.py` and add a new subparser using `argparse`.

```python
# Example: Adding a 'version' command
version_parser = subparsers.add_parser("version", help="Show CLI version")

# In the execution block:
elif args.command == "version":
    print("CloudGuardian CLI v1.0.0")
    sys.exit(0)
```

### 2. Adding a New Report Format

To support a new report format (e.g., CSV):

1.  Add a new static method to the `ReportGenerator` class in `cloudguardian_cli.py`.
    ```python
    @staticmethod
    def generate_csv(results: List[ScanResult], output_file: str):
        # Implementation logic here
        pass
    ```
2.  Update the `scan_parser.add_argument("-f", "--format", ...)` choices to include the new format.
3.  Add the corresponding `elif` block in the `main()` function under the `args.output` check.

### 3. Modifying the Scanner

If you need to change how files are scanned or how the CLI interacts with the backend API, modify the `CloudGuardianScanner` class.

-   **`scan_file`**: Handles individual file scanning and API requests.
-   **`scan_directory`**: Handles directory traversal, pattern matching, and concurrent execution.

## Code Style

-   Follow PEP 8 guidelines for Python code.
-   Use type hints (`typing` module) for function arguments and return values.
-   Write clear and concise docstrings for classes and methods.

## Publishing a New Release

1.  Update the version number in `setup.py`.
2.  Update `CHANGELOG.md` with the new release details.
3.  Commit the changes and create a new git tag.
4.  Build the distribution packages:
    ```bash
    python setup.py sdist bdist_wheel
    ```
5.  Upload to PyPI (requires appropriate credentials):
    ```bash
    twine upload dist/*
    ```
