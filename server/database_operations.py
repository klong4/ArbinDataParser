import sqlite3
from contextlib import closing

DATABASE = 'my_database.db'

def init_db():
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.execute('''CREATE TABLE IF NOT EXISTS tests (
                     id INTEGER PRIMARY KEY AUTOINCREMENT,
                     part_number TEXT,
                     Date_Time TEXT,
                     "Test_Time(s)" REAL,
                     "Current(A)" REAL,
                     "Voltage(V)" REAL,
                     "Cycle_Index" INTEGER,
                     "Step_Index" INTEGER
                     );''')
        conn.commit()

def insert_record(records):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.executemany('INSERT INTO tests (part_number, Date_Time, "Test_Time(s)", "Current(A)", "Voltage(V)", "Cycle_Index", "Step_Index") VALUES (?, ?, ?, ?, ?, ?, ?)',
                      records)
        conn.commit()

def update_record(id, part_number, date_time, test_time, current, voltage, cycle_index, step_index):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.execute('UPDATE tests SET part_number = ?, Date_Time = ?, "Test_Time(s)" = ?, "Current(A)" = ?, "Voltage(V)" = ?, "Cycle_Index" = ?, "Step_Index" = ? WHERE id = ?',
                  (part_number, date_time, test_time, current, voltage, cycle_index, step_index, id))
        conn.commit()

def save_to_db(part_number, date, test_time, selected_columns, cycle_index, step_index):
    try:
        with closing(sqlite3.connect(DATABASE)) as conn:
            c = conn.cursor()
            
            records = []
            for index, row in selected_columns.iterrows():
                # Assume the DataFrame columns align with your SQL table
                records.append((part_number, date, row['Test_Time(s)'], row['Current(A)'], row['Voltage(V)'], row['Cycle_Index'], row['Step_Index']))

            insert_record(records)  # Assuming you've a function to insert records
            conn.commit()

    except sqlite3.Error as e:
        print(f"Database error: {e}")

def get_records(part_number, test_date):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        query = 'SELECT "Test_Time(s)", "Current(A)", "Voltage(V)", "Cycle_Index", "Step_Index" FROM tests WHERE part_number = ? AND Date_Time = ?'
        c.execute(query, (part_number, test_date))
        records = c.fetchall()
        
        if not records:
            return None  # indicate that no records were found
        
    return records

def delete_record(part_number, test_date):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.execute('DELETE FROM tests WHERE part_number = ? AND Date_Time = ?', (part_number, test_date))
        conn.commit()

init_db()
