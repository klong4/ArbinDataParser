document.addEventListener('DOMContentLoaded', () => {
  initPage();
});

function initPage() {
  const dataWorker = new Worker('static/js/dataWorker.js');
  
  const partNumberInput = document.getElementById("partNumberInput");
  const recordList = document.getElementById("recordList");
  const submitButton = document.getElementById('submitButton');
  const searchButton = document.getElementById('searchButton');
  const graphContainer = document.getElementById('graphContainer');
  const backButton = document.getElementById('backButton');
  
  attachInputEventListener(partNumberInput, recordList);
  attachClickEventListener(submitButton, 'submitButton');
  attachClickEventListener(searchButton, 'searchButton');
  attachScrollEventListener(graphContainer, dataWorker);
  attachClickEventListener(backButton, 'backButton');
  
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
  switch (buttonType) {
    case 'submitButton':
      // Implement submit button logic here
      break;
    case 'searchButton':
      const partNumber = document.getElementById("partNumberInput").value;
      fetchAndUpdate(`/api/get_records_for_part?part_number=${partNumber}`, data => {
        const searchResultsDiv = document.getElementById("searchResults");
        if (searchResultsDiv) {
          searchResultsDiv.innerHTML = ''; // Clear previous results
          const seenCombinations = new Set(); // Track unique date-part combos
          if (data.records && data.records.length > 0) {
            data.records.forEach(record => {
              const date = record.test_time; // Replace with the actual date property
              const uniqueKey = `${date}-${partNumber}`;
              if (!seenCombinations.has(uniqueKey)) {
                createRecordLink(record, partNumber, searchResultsDiv);
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

function fetchAndUpdate(url, callback, options = {}) {
  fetch(url, options)
    .then(response => response.json())
    .then(data => {
      console.log('Data from server:', data);  // Debug line
      callback(data);
    })
    .catch(error => console.error('Error:', error));
}

function createRecordLink(record, partNumber, parentElement) {
  if (!record.test_time) { 
    console.log(`Skipping record due to missing test_time: ${JSON.stringify(record)}`);
    return;
  }
  const formattedDate = record.test_time.split('/').join('-'); // Replace forward slashes with dashes
  const listItem = document.createElement("a");
  listItem.textContent = `${record.test_time}`; 
  listItem.href = `/show_graph/${partNumber}/${formattedDate}`; // Use formatted date
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

function createRecordLink(record, partNumber, parentElement) {
  if (!record.test_time) { 
    console.log(`Skipping record due to missing test_time: ${JSON.stringify(record)}`);
    return;
  }
  const formattedDate = record.test_time.split('/').join('-'); // Replace forward slashes with dashes
  const listItem = document.createElement("a");
  listItem.textContent = `${record.test_time}`; 
  listItem.href = `/show_graph/${partNumber}/${formattedDate}`; // Use formatted date
  listItem.className = "record-button";  // Updated class name
  parentElement.appendChild(listItem);
}
