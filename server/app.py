# Import necessary modules
import sqlite3
from contextlib import closing
from flask import Flask, jsonify, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename
from database_operations import save_to_db, get_records, delete_record, init_db
from excel_parser import parse_excel_file
import os, logging

# Initialize Flask and configurations
app = Flask(__name__)
UPLOAD_FOLDER = './server/uploads'
DATABASE = 'my_database.db'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def get_records_by_part_number(part_number):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.execute('SELECT * FROM tests WHERE part_number = ?', (part_number,))
        records = c.fetchall()
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
        
        selected_columns, date, test_time, part_number, cycle_index, step_index = parse_excel_file(filepath)

        url_friendly_date = date.replace("/", "-")

        save_to_db(part_number, date, test_time, selected_columns, cycle_index, step_index)
        return redirect(url_for('show_graph', part_number=part_number, test_date=url_friendly_date, test_time=test_time))

    return "File type not supported"

@app.route('/show_graph/<part_number>/<test_date>/')
def show_graph(part_number, test_date):
    data = get_records(part_number, test_date.replace("-", "/"))
    
    if not data:
        return redirect(url_for('index'))
    
    extracted_data = list(zip(*data))
    
    context = {
        'part_number': part_number,
        'test_date': test_date.replace("-", "/"),
        'test_time': extracted_data[0],
        'currentA': extracted_data[1],
        'voltageV': extracted_data[2],
        'cycle_indices': extracted_data[3],
        'step_indices': extracted_data[4]
    }

    return render_template('graph.html', **context)

@app.route('/delete_record/<part_number>/<test_date>', methods=['POST'])
def delete_record_route(part_number, test_date):
    delete_record(part_number, test_date.replace("-", "/"))
    return redirect(url_for('index'))

@app.route('/api/get_records_for_part')
def get_records_for_part():
    part_number = request.args.get('part_number')
    if not part_number:
        return jsonify({'error': 'Part number is required'}), 400
    
    records = get_records_by_part_number(part_number)
    if not records:
        return jsonify({'error': 'No records found'}), 404
    
    return jsonify({'records': records})

@app.route('/api/debug', methods=['POST'])
def debug():
    message = request.json.get('message', '')
    with open('app.log', 'a') as f:
        f.write(message + '\n')
    return jsonify({'status': 'ok'})

# Define the function to query the database for channel information
def query_database_for_channel_info(part_number):
    try:
        conn = sqlite3.connect('my_database.db')
        cursor = conn.cursor()
        cursor.execute('SELECT channel_info FROM channel_info WHERE part_number = ?', (part_number,))
        channel_info = cursor.fetchone()

        if channel_info:
            return channel_info[0]
        else:
            return None

    except sqlite3.Error as e:
        print(f"Database error: {e}")
        return None

@app.route('/get_channel_info/<part_number>')
def get_channel_info(part_number):
    channel_info = query_database_for_channel_info(part_number)
    
    if channel_info:
        return jsonify({"channel_info": channel_info})
    else:
        return jsonify({"error": "Channel info not found"}), 404
    
@app.route('/log', methods=['POST'])
def log_message():
    data = request.json
    message = data.get('message', '')
    with open('app.log', 'a') as f:
        f.write(f"{message}\n")
    return jsonify({"status": "success"}), 200

if __name__ == '__main__':
    init_db()
    app.run(debug=True)
