# Import necessary modules
from contextlib import closing
from flask import Flask, jsonify, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename
from database_operations import save_to_db, get_records, delete_record, init_db
from excel_parser import parse_excel_file
import os, logging, sqlite3, re

# Configure logging
logging.basicConfig(filename='app.log', level=logging.INFO)

# Initialize Flask and configurations
app = Flask(__name__)
UPLOAD_FOLDER = './server/uploads'
DATABASE = 'my_database.db'

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def get_records_by_part_number(part_number):
    records_list = []
    try:
        with closing(sqlite3.connect(DATABASE)) as conn:
            c = conn.cursor()
            c.execute('SELECT * FROM tests WHERE part_number = ?', (part_number,))
            records = c.fetchall()
            col_names = [desc[0] for desc in c.description]
            for r in records:
                record_dict = {}
                for idx, col in enumerate(col_names):
                    record_dict[col] = r[idx]
                records_list.append(record_dict)
    except sqlite3.Error as e:
        print(f"Database error: {e}")
    return records_list

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    try:
        if 'file' not in request.files:
            return redirect(request.url)
        file = request.files['file']
        if file.filename == '':
            return redirect(request.url)

        if file and file.filename.endswith(('.xlsx', '.csv')):
            filename = secure_filename(file.filename)
            
            channel_info_match = re.search(r'Channel_(\d+)_Wb', filename)  # Updated regex pattern to match digits
            channel_info = channel_info_match.group(1) if channel_info_match else None
            print(f"Debug: Extracted channel_info: {channel_info}")
            
            filepath = os.path.join(UPLOAD_FOLDER, filename)
            file.save(filepath)
            
            selected_columns, date, test_time, part_number, cycle_index, step_index, _ = parse_excel_file(filepath)  # Discard the unused channel_info here
            print(f"Debug: Extracted date: {date}")
            
            url_friendly_date = date.replace("/", "-")
            save_to_db(part_number, date, test_time, selected_columns, cycle_index, step_index, channel_info)
            
            return redirect(url_for('show_graph', part_number=part_number, test_date=url_friendly_date, channel_info=channel_info))  # Updated "channel_info" parameter
        
        return "File type not supported"
    except Exception as e:
        return f"An error occurred: {e}"

@app.route('/show_graph/<part_number>/<test_date>/<channel_info>')
def show_graph(part_number, test_date, channel_info):  # Added "channel_info" parameter
    data = get_records(part_number, test_date.replace("-", "/"), channel_info)  # Passed "channel_info"
    
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
        'step_indices': extracted_data[4],
        'channel_info': extracted_data[5]
    }

    return render_template('graph.html', **context)

@app.route('/delete_record/<part_number>/<test_date>', methods=['GET', 'POST'])
def delete_record_route(part_number, test_date):
    if request.method == 'POST':
        channel_info = request.form['channel_info']
        delete_record(part_number, test_date.replace("-", "/"), channel_info)
        return redirect(url_for('index'))
    else:
        # Handle GET request if needed
        pass

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
