import unittest
from server.excel_parser import (
    extract_part_number_from_filename,
    extract_date_from_file,
    extract_columns_for_graph,
)

class TestExcelParser(unittest.TestCase):
    
    def test_extract_part_number_from_filename(self):
        self.assertEqual(extract_part_number_from_filename("part123_test.xlsx"), "part123")
        self.assertEqual(extract_part_number_from_filename("partXYZ_testfile.xlsx"), "partXYZ")
    
    def test_extract_date_from_file(self):
        # Assuming you've got a test Excel file with a known date in the Date_Time column
        self.assertEqual(extract_date_from_file("test_files/test_date_file.xlsx"), "2023-09-06")
        
    def test_extract_columns_for_graph(self):
        # Assuming you've got a test Excel file with known values in relevant columns
        columns = extract_columns_for_graph("test_files/test_columns_file.xlsx")
        
        # Check the size of the DataFrame and if it has the correct columns
        self.assertEqual(columns.shape[1], 3)
        self.assertTrue("Test_Time" in columns.columns)
        self.assertTrue("Current(A)" in columns.columns)
        self.assertTrue("Voltage(V)" in columns.columns)

if __name__ == '__main__':
    unittest.main()
