from flask import Flask, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename
from database_operations import save_to_db, get_records
from excel_parser import parse_excel_file
import os

app = Flask(__name__)

UPLOAD_FOLDER = './server/uploads'
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

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
        filepath = f'./arbindataparser/server/uploads/{filename}'  # Update your path here
        file.save(filepath)
        
        # Extract part_number from file
        part_number = filename.split('_')[0]  # Make sure this line is here
        
        # Extract data and date from file
        data, date = parse_excel_file(filepath)
        
        # Save to database
        save_to_db(part_number, date, data)
        
        return redirect(url_for('show_graph', part_number=part_number, test_date=date))
    else:
        return "File type not supported"

@app.route('/show_graph/<part_number>/<test_date>')
def show_graph(part_number, test_date):
    data = get_records(part_number, test_date)
    if data:
        test_time = [x[0] for x in data]
        currentA = [x[1] for x in data]
        voltageV = [x[2] for x in data]
        return render_template('graph.html', part_number=part_number, test_date=test_date, test_time=test_time, currentA=currentA, voltageV=voltageV)
    else:
        return "No data found for given parameters"

if __name__ == '__main__':
    app.run(debug=True)
