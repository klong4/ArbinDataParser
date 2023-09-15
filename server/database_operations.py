import sqlite3, logging
from contextlib import closing

logging.basicConfig(filename='app.log', level=logging.DEBUG)
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
                     "Step_Index" INTEGER,
                     channel_info INTEGER
                     );''')
        conn.commit()

def insert_record(records):
    with closing(sqlite3.connect(DATABASE)) as conn:
        c = conn.cursor()
        c.executemany('INSERT INTO tests (part_number, Date_Time, "Test_Time(s)", "Current(A)", "Voltage(V)", "Cycle_Index", "Step_Index", channel_info) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                      records)
        conn.commit()

def save_to_db(part_number, date, test_time, selected_columns, cycle_index, step_index, channel_info):
    try:
        with closing(sqlite3.connect(DATABASE)) as conn:
            c = conn.cursor()
            
            records = []
            for index, row in selected_columns.iterrows():
                record = (part_number, date, row['Test_Time(s)'], row['Current(A)'], row['Voltage(V)'], row['Cycle_Index'], row['Step_Index'], channel_info)
                records.append(record)
                
                # Debug: Print the first record
                if index == 0:
                    print(f"Debug: First record: {record}")

            insert_record(records)
            conn.commit()

    except sqlite3.Error as e:
        print(f"Database error: {e}")

def get_records(part_number, Date_Time, channel_info):
    try:
        with closing(sqlite3.connect(DATABASE)) as conn:
            c = conn.cursor()
            query = 'SELECT "Test_Time(s)", "Current(A)", "Voltage(V)", "Cycle_Index", "Step_Index", channel_info FROM tests WHERE part_number = ? AND Date_Time = ? AND channel_info = ?'
            
            logging.debug(f"Executing SQL Query: {query} with part_number={part_number}, Date_Time={Date_Time}, channel_info={channel_info}")
            
            c.execute(query, (part_number, Date_Time, channel_info))
            records = c.fetchall()
            
            logging.debug(f"Number of records fetched: {len(records)}")
            
            if not records:
                logging.warning(f"No records found for part_number={part_number}, Date_Time={Date_Time}, channel_info={channel_info}")
                return None  # indicate that no records were found
            
        return records
    
    except sqlite3.Error as error:
        logging.error(f"SQLite Error: {error}")
        return None

# Update the delete_record function to accept channel_info
def delete_record(part_number, Date_Time, channel_info):
    try:
        with closing(sqlite3.connect(DATABASE)) as conn:
            c = conn.cursor()
            c.execute('DELETE FROM tests WHERE part_number = ? AND Date_Time = ? AND channel_info = ?', (part_number, Date_Time, channel_info))
            conn.commit()
    except sqlite3.Error as e:
        print(f"Database error: {e}")

def get_channel_info(part_number):
    try:
        with closing(sqlite3.connect(DATABASE)) as conn:
            c = conn.cursor()
            query = 'SELECT channel_info FROM channel_info WHERE part_number = ?'
            
            logging.debug(f"Executing SQL Query: {query} with part_number={part_number}")
            
            c.execute(query, (part_number,))
            channel_info = c.fetchone()
            
            logging.debug(f"Channel info fetched: {channel_info}")
            
            if not channel_info:
                logging.warning(f"No channel info found for part_number={part_number}")
                return None  # indicate that no channel info was found
            
        return channel_info[0] if channel_info else None
    
    except sqlite3.Error as error:
        logging.error(f"SQLite Error: {error}")
        return None

if __name__ == "__main__":
    # Example usage to retrieve channel info
    part_number = "Your_Part_Number"  # Replace with the actual part number
    channel_info = get_channel_info(part_number)
    if channel_info:
        print(f"Channel Info for Part Number {part_number}: {channel_info}")
    else:
        print(f"No Channel Info found for Part Number {part_number}")

init_db()
