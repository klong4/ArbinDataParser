import os
import pandas as pd

def parse_excel_file(file_path):
    part_number = extract_part_number(file_path)
    
    # Initialize df to None
    df = read_file(file_path)
    date = None
    selected_columns = None
    
    if df is not None:
        print("Available columns:", df.columns)  # Debug line to show available columns
        selected_columns = extract_columns(df)
        date = extract_date(df, 'Date_Time')  # Date_Time is the column for date
    
    return selected_columns, date

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

def extract_columns(df, columns=['Date_Time', 'Test_Time(s)', 'Current(A)', 'Voltage(V)']):
    try:
        return df[columns]
    except KeyError as e:
        print(f"Column not found: {e}")
        return None

def extract_test_time(df, time_column='Test_Time(s)'):
    try:
        first_test_time_entry = df[time_column].iloc[0]
        print(f"Debug: First test time entry: {first_test_time_entry}")  # Debug log
        return first_test_time_entry
    except Exception as e:
        print(f"An error occurred while extracting the test_time: {e}")
        return None

# Example usage
if __name__ == "__main__":
    file_path = "path/to/your/excel_file.xlsx"
    part_number = extract_part_number(file_path)
    print(f"Extracted Part Number: {part_number}")

    df = read_file(file_path)
    if df is not None:
        selected_columns = extract_columns(df)
        print("Extracted Columns Data:")
        print(selected_columns.head())
        date = extract_date(df)
        print(f"Extracted Date: {date}")
