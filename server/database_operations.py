import sqlite3
from contextlib import closing

DATABASE = 'my_database.db'

# Initialize database
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

# Insert a new record
def insert_record(part_number, date_time, test_time, current, voltage):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.execute('INSERT INTO tests (part_number, Date_Time, "Test_Time(s)", "Current(A)", "Voltage(V)") VALUES (?, ?, ?, ?, ?)',
                  (part_number, date_time, test_time, current, voltage))
        conn.commit()

# Retrieve records by part_number and date
def get_records(part_number, test_date):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.execute('SELECT "Test_Time(s)", "Current(A)", "Voltage(V)" FROM tests WHERE part_number = ? AND Date_Time = ?',
                  (part_number, test_date))
        return c.fetchall()

# Update a record (if needed)
def update_record(id, part_number, date_time, test_time, current, voltage):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.execute('UPDATE tests SET part_number = ?, Date_Time = ?, "Test_Time(s)" = ?, "Current(A)" = ?, "Voltage(V)" = ? WHERE id = ?',
                  (part_number, date_time, test_time, current, voltage, id))
        conn.commit()

# Save to db
def save_to_db(part_number, date, df):
    if df is None:
        print("Error: Data is None. Cannot save to DB.")
        return

    for index, row in df.iterrows():
        test_time = row['Test_Time(s)']
        current = row['Current(A)']
        voltage = row['Voltage(V)']
        insert_record(part_number, date, test_time, current, voltage)

# Call init_db to create the database table if it doesn't exist
init_db()
