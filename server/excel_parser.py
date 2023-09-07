import os
import pandas as pd

def parse_excel_file(file_path):
    part_number = extract_part_number(file_path)
    
    # Initialize df to None
    df = read_file(file_path)
    date = None
    test_time = None
    selected_columns = None
    cycle_index = None
    step_index = None
    
    if df is not None:
        print("Available columns:", df.columns)
        selected_columns = extract_columns(df)
        date = extract_date(df, 'Date_Time')
        test_time = extract_test_time(df, 'Test_Time(s)')
        cycle_index = df['Cycle_Index']
        step_index = df['Step_Index']
    
    return selected_columns, date, test_time, part_number, cycle_index, step_index  # Return new columns as well

def extract_part_number(file_path):
    part_number = os.path.basename(file_path).split('_')[0]
    return part_number

def read_file(file_path):
    file_extension = os.path.splitext(file_path)[1].lower()
    if file_extension == '.xlsx':
        df = pd.read_excel(file_path, sheet_name=1)
    elif file_extension == '.csv':
        df = pd.read_csv(file_path)
    else:
        print(f"Unsupported file format: {file_extension}")
        return None
    return df

def extract_columns(df):
    columns = ['Date_Time', 'Test_Time(s)', 'Current(A)', 'Voltage(V)', 'Cycle_Index', 'Step_Index']  # Added 'Cycle_Index' and 'Step_Index'
    try:
        return df[columns]
    except KeyError as e:
        print(f"Column not found: {e}")
        return None

def extract_date(df, date_column='Date_Time'):
    try:
        first_date_entry = df[date_column].iloc[1]  # Fetching the first entry from line 2
        date = first_date_entry.split(' ')[0]
        print(f"Debug: Extracted date: {date}")
        return date
    except Exception as e:
        print(f"An error occurred while extracting the date: {e}")
        return None

def extract_test_time(df, test_time_column='Test_Time(s)'):
    try:
        first_test_time_entry = df[test_time_column].iloc[0]
        print(f"Debug: First test_time entry: {first_test_time_entry}")
        return first_test_time_entry
    except Exception as e:
        print(f"An error occurred while extracting the test_time: {e}")
        return None

# Example usage
if __name__ == "__main__":
    file_path = "path/to/your/excel_file.xlsx"
    selected_columns, date, test_time, part_number = parse_excel_file(file_path)
    print(f"Extracted Part Number: {part_number}")
    print(f"Extracted Date: {date}")
    print(f"Extracted Test Time: {test_time}")
    print("Extracted Columns Data:")
    print(selected_columns.head())
