document.addEventListener('DOMContentLoaded', () => {
  initPage();
});

function initPage() {
  const dataWorker = new Worker('static/js/dataWorker.js');

  // Initialize DOM elements
  const partNumberInput = document.getElementById("partNumberInput");
  const searchResultsDiv = document.getElementById("searchResults"); // For search results
  const submitButton = document.getElementById('submitButton');
  const searchButton = document.getElementById('searchButton');
  const graphContainer = document.getElementById('graphContainer');
  const backButton = document.getElementById('backButton');

  // Event Listeners
  attachInputEventListener(partNumberInput, searchResultsDiv);
  attachClickEventListener(submitButton, 'submitButton');
  attachClickEventListener(searchButton, 'searchButton');
  attachScrollEventListener(graphContainer, dataWorker);
  attachClickEventListener(backButton, 'backButton');

  // Data Worker Message Handling
  dataWorker.onmessage = handleDataWorkerMessages;
}

function attachInputEventListener(inputElement, outputElement) {
  inputElement.addEventListener('input', () => {
    const partNumber = inputElement.value;
    if (partNumber.length > 2) {
      fetchAndUpdate(`/api/get_records_for_part?part_number=${partNumber}`, data => {
        outputElement.innerHTML = '';
        data.records.forEach(record => createRecordLink(record, partNumber, outputElement));
      });
    } else {
      outputElement.innerHTML = '';
    }
  });
}

function attachClickEventListener(buttonElement, buttonType) {
  if (buttonElement) {
    buttonElement.addEventListener('click', () => {
      handleClickEvents(buttonType);
    });
  }
}

function attachScrollEventListener(containerElement, dataWorker) {
  if (containerElement) {
    containerElement.addEventListener('scroll', () => {
      if (containerElement.scrollTop + containerElement.clientHeight >= containerElement.scrollHeight) {
        dataWorker.postMessage({ type: 'LAZY_LOAD' });
      }
    });
  }
}

function handleClickEvents(buttonType) {
  switch(buttonType) {
    case 'submitButton':
      // Here, you can add the logic for the submit button if needed
      break;
    case 'searchButton':
      const partNumber = document.getElementById("partNumberInput").value;
      const searchResultsDiv = document.getElementById("searchResults");
      fetchAndUpdate(`/api/get_records_for_part?part_number=${partNumber}`, data => {
        searchResultsDiv.innerHTML = '';  // Clear previous results

        if (data.records && data.records.length > 0) {
          data.records.forEach(record => createRecordLink(record, partNumber, searchResultsDiv));
        } else {
          searchResultsDiv.innerHTML = 'No records found';
        }
      });
      break;
    case 'backButton':
      window.history.back();
      break;
  }
}

function fetchAndUpdate(url, callback, options = {}) {
  fetch(url, options)
    .then(response => response.json())
    .then(data => {
      console.log("Debug: Data Type:", typeof data);
      console.log("Debug: Full Data Object:", data);

      const debugMessage = `Debug: Received Data Length ${data?.length || 'N/A'}, Type: ${typeof data}`;
      fetch('/api/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: debugMessage })
      });

      callback(data);
    })
    .catch(error => console.error('Error:', error));
}

function createRecordLink(record, partNumber, parentElement) {
  if (!record.test_time) { // Changed from test_date to test_time
    console.log(`Skipping record due to missing test_time: ${JSON.stringify(record)}`);
    return;
  }
  const listItem = document.createElement("a");
  listItem.textContent = `${record.test_time} - ${record.other_identifier}`; // Changed from test_date to test_time
  listItem.href = `/show_graph/${partNumber}/${record.test_time}`; // Changed from test_date to test_time
  listItem.className = "record-link";
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
