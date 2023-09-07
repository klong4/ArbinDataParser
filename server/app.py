from contextlib import closing
from flask import Flask, jsonify, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename
from database_operations import save_to_db, get_records, delete_record
from excel_parser import parse_excel_file
import os
import sqlite3
import logging

# Initialize Flask and configurations
app = Flask(__name__)
UPLOAD_FOLDER = './server/uploads'
DATABASE = 'my_database.db'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def get_records_by_part_number(part_number):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        logging.debug(f"Executing query for part_number: {part_number}")
        c.execute('SELECT * FROM tests WHERE part_number = ?', (part_number,))
        records = c.fetchall()
        logging.debug(f"Query results: {records}")
        records_list = [{"test_time": r[2], "current": r[3], "voltage": r[4]} for r in records]
    return records_list

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        return redirect(request.url)

    if file and file.filename.endswith(('.xlsx', '.csv')):
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)

        selected_columns, _ = parse_excel_file(filepath)  # Ignore the date, if it was returned before
        test_time = extract_test_time(selected_columns)  # New line
        url_friendly_test_time = test_time.replace(":", "-")
        
        part_number = extract_part_number(filepath)  # Assuming you've a function to extract part_number

        save_to_db(part_number, test_time, selected_columns)  # Adjust the function save_to_db accordingly

        return redirect(url_for('show_graph', part_number=part_number, test_time=url_friendly_test_time))

    return "File type not supported"

@app.route('/show_graph/<part_number>/<test_date>')
def show_graph(part_number, test_date):
    standard_date = test_date.replace("-", "/")
    data = get_records(part_number, standard_date)
    if not data:
        return redirect(url_for('index'))
    
    extracted_data = list(zip(*data))
    context = {
        'part_number': part_number,
        'test_date': standard_date,
        'test_time': extracted_data[0],
        'currentA': extracted_data[1],
        'voltageV': extracted_data[2],
        'step_indices': extracted_data[3],
        'cycle_indices': extracted_data[4]
    }
    return render_template('graph.html', **context)

@app.route('/delete_record/<part_number>/<test_date>', methods=['POST'])
def delete_record_route(part_number, test_date):
    standard_date = test_date.replace("-", "/")
    delete_record(part_number, standard_date)
    return redirect(url_for('index'))

@app.route('/api/get_records_for_part')
def get_records_for_part():
    part_number = request.args.get('part_number')
    if not part_number:
        return jsonify({'error': 'Part number is required'}), 400
    
    records = get_records_by_part_number(part_number)
    print(f"Debug: Records for part_number {part_number}: {records}")  # Debug line
    
    if not records:
        return jsonify({'error': 'No records found'}), 404
    
    return jsonify({'records': records})

@app.route('/api/debug', methods=['POST'])
def debug():
    message = request.json.get('message', '')
    with open('debug.log', 'a') as f:
        f.write(message + '\n')
    return jsonify({'status': 'ok'})

if __name__ == '__main__':
    app.run(debug=True)
