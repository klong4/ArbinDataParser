const dataWorker = new Worker('static/js/dataWorker.js');

// Fetch data and update the DOM
function fetchAndUpdate(url, callback, options = {}) {
  fetch(url, options)
    .then(response => response.json())
    .then(data => {
      console.log("Debug: Data Type:", typeof data);
      console.log("Debug: Full Data Object:", data);

      // Send debug message to server
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

// Create a dropdown option
function createOption(value, parentElement) {
  const option = document.createElement('option');
  option.value = value;
  option.text = value;
  parentElement.appendChild(option);
}

// Create a record link
function createRecordLink(record, partNumber, parentElement) {
  if (!record.test_date) {
    console.log(`Skipping record due to missing test_date: ${JSON.stringify(record)}`);
    return;
  }
  const listItem = document.createElement("a");
  listItem.textContent = `${record.test_date} - ${record.other_identifier}`;
  listItem.href = `/show_graph/${partNumber}/${record.test_date}`;
  listItem.className = "record-link";
  parentElement.appendChild(listItem);
}

document.addEventListener('DOMContentLoaded', () => {
  const submitButton = document.getElementById('submitButton');
  const searchButton = document.getElementById('searchButton');
  const graphContainer = document.getElementById('graphContainer');
  const backButton = document.getElementById('backButton');

  if (submitButton) {
    submitButton.addEventListener('click', () => {
      const partNumber = document.getElementById('partNumberSelect').value;
      const testDate = document.getElementById('testDate').value;
      fetchAndUpdate('/api/get_graph_data', data => {
        dataWorker.postMessage({ type: 'INITIAL_LOAD', data });
      }, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partNumber, testDate })
      });
    });
  }

  if (searchButton) {
    searchButton.addEventListener('click', () => {
      const partNumber = document.getElementById("partNumberInput").value;
      fetchAndUpdate(`/api/get_records_for_part?part_number=${partNumber}`, data => {
        const recordList = document.getElementById("recordList");
        recordList.innerHTML = '';
        data.records.forEach(record => createRecordLink(record, partNumber, recordList));
      });
    });
  }

  if (graphContainer) {
    graphContainer.addEventListener('scroll', () => {
      if (graphContainer.scrollTop + graphContainer.clientHeight >= graphContainer.scrollHeight) {
        dataWorker.postMessage({ type: 'LAZY_LOAD' });
      }
    });
  }

  if (backButton) {
    backButton.addEventListener('click', () => {
      window.history.back();
    });
  }
});

// Handle messages from the data worker
dataWorker.onmessage = e => {
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
};
