document.addEventListener('DOMContentLoaded', () => {
  initPage();
  preventFormSubmissionIfNoFileSelected();
});

function preventFormSubmissionIfNoFileSelected() {
  const uploadForm = document.getElementById('uploadForm');
  uploadForm.addEventListener('submit', function(event) {
    const fileInput = this.querySelector('input[type="file"]');
    if (!fileInput.files.length) {
      event.preventDefault();
      alert('Please select a file');
    }
  });
}

function initPage() {
  const dataWorker = new Worker('static/js/dataWorker.js');
  const elements = fetchElementsById([
    "partNumberInput", "channelInput", "recordList",
    "submitButton", "searchButton", "graphContainer", "backButton"
  ]);

  attachEventListeners(elements, dataWorker);
}

function fetchElementsById(ids) {
  return ids.reduce((acc, id) => {
    acc[id] = document.getElementById(id);
    return acc;
  }, {});
}

function attachEventListeners(elements, dataWorker) {
  attachClickEventListener(elements.submitButton, 'submitButton');
  attachClickEventListener(elements.searchButton, 'searchButton');
  attachScrollEventListener(elements.graphContainer, dataWorker);
  attachClickEventListener(elements.backButton, 'backButton');

  dataWorker.onmessage = handleDataWorkerMessages;
}

function attachInputEventListener(partNumberInput, channelInput, recordList) {
  if (!partNumberInput || !channelInput || !recordList) {
    console.error('One of the elements is missing. Cannot attach event listener.');
    return;
  }

  partNumberInput.addEventListener('input', () => {
    const partNumber = partNumberInput?.value?.trim();
    const channel = channelInput?.value?.trim();

    if (partNumber && channel) {
      fetchAndUpdate(`/api/get_records_for_part?part_number=${partNumber}&channel=${channel}`, data => {
        updateOutputElement(recordList, data.records, partNumber, channel);
      });
    } else {
      clearOutputElement(recordList);
    }
  });
}

function attachClickEventListener(element, eventType, partNumberInput) {
  if (element) {
    element.addEventListener('click', () => handleClickEvents(eventType, partNumberInput));
  }
}

function attachScrollEventListener(element, dataWorker) {
  if (element) {
    element.addEventListener('scroll', () => {
      if (isElementScrolledToBottom(element)) {
        dataWorker.postMessage({ type: 'LAZY_LOAD' });
      }
    });
  }
}

function handleClickEvents(eventType) {
  switch (eventType) {
    case 'submitButton':
      break;
    case 'searchButton':
      const partNumberInput = document.getElementById('partNumberInput');
      const partNumber = partNumberInput?.value?.trim(); // Get the part number
      const channelInput = document.getElementById('channelInput');
      const channel = channelInput?.value?.trim(); // Get the channel (make sure this is correct)
      fetchAndUpdate(`/api/get_records_for_part?part_number=${partNumber}`, data => {
        const searchResultsDiv = document.getElementById("searchResults");
        if (searchResultsDiv) {
          searchResultsDiv.innerHTML = '';
          const seenCombinations = new Set();
          if (data.records && data.records.length > 0) {
            data.records.forEach(record => {
              const date = record.Date_Time; // Use Date_Time as the date
              const formattedDate = formatDateForURL(date); // Format the date
              const uniqueKey = `${formattedDate}-${partNumber}`;
              if (!seenCombinations.has(uniqueKey)) {
                createRecordLink(record, partNumber, searchResultsDiv, formattedDate, channel);
                seenCombinations.add(uniqueKey);
              }
            });
          } else {
            searchResultsDiv.innerHTML = 'No records found';
          }
        }
      });
      break;
    case 'backButton':
      window.history.back();
      break;
  }
}

// Function to format date as "mm-dd-yyyy"
function formatDateForURL(dateString) {
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${month}-${day}-${year}`;
  }
  return null; // Invalid date format
}

function fetchAndUpdate(url, callback, options = {}) {
  fetch(url, options)
    .then(response => response.json())
    .then(data => callback(data))
    .catch(error => console.error('Error:', error));
}

function isElementScrolledToBottom(element) {
  return element.scrollTop + element.clientHeight >= element.scrollHeight;
}

function updateOutputElement(element, records, partNumber, channel) {
  if (element) {
    element.innerHTML = '';
    records.forEach(record => createRecordLink(record, partNumber, element, channel));
  }
}

function clearOutputElement(element) {
  if (element) {
    element.innerHTML = '';
  }
}

function isEmpty(value) {
  return value === null || value === undefined || value === '';
}

function normalizeKey(key) {
  return key.toLowerCase().replace(/[\s_()]/g, '');
}

function createRecordLink(record, partNumber, parentElement, formattedDate, channelInfo) {
  // Define the required fields for each record
  const requiredFields = [
    "Test_Time(s)", "channel_info", "part_number", "Date_Time",
    "Current(A)", "Voltage(V)", "Cycle_Index", "Step_Index"
  ];

  // Initialize an array to track missing fields
  let missingFields = [];

  // Create a normalized record object for easier field access
  const normalizedRecord = {};
  for (const key in record) {
    normalizedRecord[normalizeKey(key)] = record[key];
  }

  // Check if any required fields are missing
  for (const field of requiredFields) {
    if (normalizedRecord[normalizeKey(field)] === null || normalizedRecord[normalizeKey(field)] === undefined) {
      missingFields.push(field);
    }
  }

  // If any required fields are missing, log and skip the record
  if (missingFields.length > 0) {
    const missingFieldsString = missingFields.join(", ");
    const message = `Skipping record due to missing ${missingFieldsString}: ${JSON.stringify(record)}`;

    // Log the missing fields to the server
    fetch('/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    }).then(response => {
      if (response.ok) {
        console.log('Logged missing fields to app.log on the server.');
      } else {
        console.error('Failed to log missing fields to app.log on the server.');
      }
    }).catch(error => {
      console.error(`Error logging missing fields to app.log: ${error}`);
    });

    // Skip processing this record
    return;
  }

  // If all required fields are present, create a link to display the record
  const listItem = document.createElement("a");
  listItem.textContent = `${formattedDate} : ${channelInfo}`;
  listItem.href = `/show_graph/${partNumber}/${formattedDate}`;
  listItem.className = "record-button";
  parentElement.appendChild(listItem);
}

function handleDataWorkerMessages(e) {
  const { type, payload } = e.data;
  const graphContainer = document.getElementById('graphContainer');
  if (type === 'INITIAL_LOAD') {
    const img = document.createElement('img');
    img.src = payload.graphURL;
    graphContainer.innerHTML = '';
    graphContainer.appendChild(img);
  } else if (type === 'LAZY_LOAD') {
    console.log("Received lazy-load data:", payload);
  }
}
