import unittest
from server.database_operations import (
    insert_record,
    update_record,
    delete_record,
    get_record_by_part_number_and_date,
)

class TestDatabaseOperations(unittest.TestCase):

    def setUp(self):
        # Code to initialize a test database
        pass

    def tearDown(self):
        # Code to clean up the test database
        pass

    def test_insert_record(self):
        data = {
            'part_number': 'XYZ123',
            'test_date': '2023-09-06',
            'current': '5.0',
            'voltage': '220'
        }
        result = insert_record(data)
        self.assertTrue(result)

    def test_update_record(self):
        data = {
            'part_number': 'XYZ123',
            'test_date': '2023-09-06',
            'current': '6.0',
            'voltage': '230'
        }
        result = update_record('XYZ123', '2023-09-06', data)
        self.assertTrue(result)

    def test_delete_record(self):
        result = delete_record('XYZ123', '2023-09-06')
        self.assertTrue(result)

    def test_get_record_by_part_number_and_date(self):
        result = get_record_by_part_number_and_date('XYZ123', '2023-09-06')
        self.assertIsNotNone(result)
        self.assertEqual(result['part_number'], 'XYZ123')
        self.assertEqual(result['test_date'], '2023-09-06')

if __name__ == "__main__":
    unittest.main()
