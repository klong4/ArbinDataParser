MyExcelParser
Overview
MyExcelParser is a desktop application that serves as a web server. It allows users to upload Excel files, extract specific data, and view it in graphical form. The application is designed to help engineers quickly visualize test results based on part numbers and test dates.

Features
Web-based user interface for easy interaction.
Excel file parsing to extract specific columns.
Database storage for quick access to parsed data.
Interactive graphs with crosshairs at specified points.
Technology Stack
Backend: Python (Flask)
Frontend: HTML, CSS, JavaScript
Database: SQLite
Excel Parsing: pandas
Graphing: Chart.js
Installation
Prerequisites
Python 3.x
pip
Steps
Clone the repository


git clone https://github.com/yourusername/MyExcelParser.git
Navigate to the project folder

cd MyExcelParser
Install the required packages

pip install -r requirements.txt
Run the application

python server/app.py
Open your web browser and go to http://localhost:5000

Usage
Upload Excel File: Use the upload button to select an Excel file.
Select Part Number and Date: Use the dropdowns to select the part number and test date.
View Graph: Click the "Generate Graph" button to view the graph based on your selections.
Contributing
If you find a bug or have a feature request, please create an issue or submit a pull request.

License
MIT License. See LICENSE for more information.

ArbinDataParser/
|-- server/
|   |-- app.py                  # Main Flask application
|   |-- database_operations.py  # Database interactions
|   |-- excel_parser.py         # Excel file parsing logic
|-- static/
|   |-- css/
|   |   |-- main.css            # Stylesheets
|   |-- js/
|   |   |-- main.js             # JavaScript files for interactivity
|-- templates/
|   |-- index.html              # Main webpage
|   |-- graph.html              # Graph rendering page
|-- tests/
|   |-- test_excel_parser.py    # Tests for the Excel parser
|   |-- test_database_ops.py    # Tests for database operations
|-- requirements.txt            # List of Python dependencies
|-- README.md                   # Project description and setup instructions
