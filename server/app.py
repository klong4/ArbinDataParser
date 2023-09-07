from flask import Flask, jsonify, render_template, request, redirect, url_for
from werkzeug.utils import secure_filename
from database_operations import save_to_db, get_records, delete_record  # Assuming this is where your save_to_db and get_records functions are
from excel_parser import parse_excel_file # Assuming this is where your parse_excel_file function is
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
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        part_number = filename.split('_')[0]
        data, date = parse_excel_file(filepath)
        
        # Convert date to URL-friendly format
        url_friendly_date = date.replace("/", "-")

        # Save to database
        save_to_db(part_number, date, data)
        
        # Generate the redirect URL
        redirect_url = url_for('show_graph', part_number=part_number, test_date=url_friendly_date)
        print(f"Redirecting to: {redirect_url}")

        # Perform the redirect
        return redirect(redirect_url)
    else:
        return "File type not supported"

@app.route('/show_graph/<part_number>/<test_date>')
def show_graph(part_number, test_date):
    # Convert the URL-friendly date back to your standard date format, if needed
    standard_date = test_date.replace("-", "/")

    data = get_records(part_number, standard_date)
    if data is None:
        return redirect(url_for('index'))
    if data:
        test_time = [x[0] for x in data]
        currentA = [x[1] for x in data]
        voltageV = [x[2] for x in data]
        step_indices = [x[3] for x in data]
        cycle_indices = [x[4] for x in data]
        
        return render_template('graph.html', 
                       part_number=part_number, 
                       test_date=standard_date, 
                       test_time=test_time, 
                       currentA=currentA, 
                       voltageV=voltageV,
                       step_indices=step_indices,
                       cycle_indices=cycle_indices)
    else:
        return "No data found for given parameters"

@app.route('/delete_record/<part_number>/<test_date>', methods=['POST'])
def delete_record_route(part_number, test_date):
    print("Inside delete_record_route")  # Debugging line

    # Convert the URL-friendly date back to your standard date format, if needed
    standard_date = test_date.replace("-", "/")
    
    # Delete the record (assuming you have a function named `delete_from_db` to do this)
    delete_record(part_number, standard_date)
    
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
