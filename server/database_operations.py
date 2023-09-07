import sqlite3
from contextlib import closing
import pandas as pd
import numpy as np

DATABASE = 'my_database.db'  # Feel free to change this if needed

# Initialize the database
def init_db():
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS tests (
                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                     part_number TEXT,
                     Date_Time TEXT,
                     "Test_Time(s)" REAL,
                     "Current(A)" REAL,
                     "Voltage(V)" REAL
                     );''')
        conn.commit()

# Insert a new record (now handles multiple records)
def insert_record(records):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.executemany('INSERT INTO tests (part_number, Date_Time, "Test_Time(s)", "Current(A)", "Voltage(V)") VALUES (?, ?, ?, ?, ?)',
                      records)
        conn.commit()

# Update a record (if needed)
def update_record(id, part_number, date_time, test_time, current, voltage):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.execute('UPDATE tests SET part_number = ?, Date_Time = ?, "Test_Time(s)" = ?, "Current(A)" = ?, "Voltage(V)" = ? WHERE id = ?',
                  (part_number, date_time, test_time, current, voltage, id))
        conn.commit()

# Save data to the database (now prepares all data for a bulk insert)
def save_to_db(part_number, date, df):
    records = []
    for index, row in df.iterrows():
        test_time = row['Test_Time(s)']
        current = row['Current(A)']
        voltage = row['Voltage(V)']

        # Prepare the record
        record = (part_number, date, test_time, current, voltage)
        records.append(record)

    # Bulk insert all the records
    insert_record(records)

# Retrieve records by part_number and date
def get_records(part_number, test_date):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.execute('SELECT "Test_Time(s)", "Current(A)", "Voltage(V)", "Cycle_Index", "Step_Index" FROM tests WHERE part_number = ? AND Date_Time = ?',
                  (part_number, test_date))
        records = c.fetchall()
        
        if not records:
            return None  # indicate that no records were found
        
    return records

def delete_record(part_number, test_date):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.execute('DELETE FROM tests WHERE part_number = ? AND Date_Time = ?', (part_number, test_date))
        conn.commit()

# Call init_db to create the database table if it doesn't exist
init_db()
