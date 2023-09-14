document.addEventListener('DOMContentLoaded', () => {
  logToServer('DOM fully loaded and parsed');
  initPage();
  preventFormSubmissionIfNoFileSelected();
});

function logToServer(message) {
  fetch('/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: message })
  });
}

function preventFormSubmissionIfNoFileSelected() {
  logToServer('Entering preventFormSubmissionIfNoFileSelected');
  const uploadForm = document.getElementById('uploadForm');
  uploadForm.addEventListener('submit', function(event) {
    const fileInput = this.querySelector('input[type="file"]');
    if (!fileInput.files.length) {
      event.preventDefault();
      alert('Please select a file');
      logToServer('File not selected. Preventing form submission.');
    }
  });
}

function initPage() {
  logToServer('Initializing page');
  const dataWorker = new Worker('static/js/dataWorker.js');
  const elements = fetchElementsById([
    "partNumberInput", "channelInput", "recordList",
    "submitButton", "searchButton", "graphContainer", "backButton"
  ]);
  attachEventListeners(elements, dataWorker);
}

function fetchElementsById(ids) {
  logToServer('Fetching elements by ID');
  return ids.reduce((acc, id) => {
    acc[id] = document.getElementById(id);
    return acc;
  }, {});
}

function attachEventListeners(elements, dataWorker) {
  logToServer('Attaching event listeners');
  attachClickEventListener(elements.submitButton, 'submitButton');
  attachClickEventListener(elements.searchButton, 'searchButton');
  attachScrollEventListener(elements.graphContainer, dataWorker);
  attachClickEventListener(elements.backButton, 'backButton');
  dataWorker.onmessage = handleDataWorkerMessages;
}

function attachClickEventListener(element, eventType) {
  logToServer(`Attaching click event listener for ${eventType}`);
  if (element) {
    element.addEventListener('click', () => handleClickEvents(eventType));
  }
}

function handleClickEvents(eventType) {
  logToServer(`Handling click event: ${eventType}`);
  switch (eventType) {
    case 'submitButton':
      logToServer('Submit button clicked');
      // Your existing logic for 'submitButton'
      break;
    case 'searchButton':
      logToServer('Search button clicked');
      const partNumberInput = document.getElementById('partNumberInput');
      if (partNumberInput) {
        const partNumber = partNumberInput.value.trim();
        if (partNumber) {
          fetchAndUpdate(`/api/get_records_for_part?part_number=${partNumber}`, data => {
            const searchResultsDiv = document.getElementById("searchResults");
            if (searchResultsDiv) {
              searchResultsDiv.innerHTML = '';
              
              const seenCombinations = new Set(); // Set to keep track of unique combinations
              
              data.records.forEach(record => {
                const date = formatDateForURL(record.Date_Time); // Assuming Date_Time field in your record
                const channel = record.channel_info; // Assuming channel_info field in your record
                const uniqueKey = `${date}-${partNumber}-${channel}`;
                
                if (!seenCombinations.has(uniqueKey)) {
                  // Logic to create button
                  const btn = document.createElement("button");
                  btn.innerHTML = `Date: ${date}, Channel: ${channel}`;
                  btn.className = "button";  // Assign the class name for styling
                  btn.onclick = function() {
                    window.location.href = `/show_graph/${partNumber}/${date}/${channel}`;
                  };
                  searchResultsDiv.appendChild(btn);
                  
                  seenCombinations.add(uniqueKey); // Add the unique combination to the set
                }
              });
            }
          });
        } else {
          logToServer("Part number is empty");
        }
      } else {
        logToServer("Part number input element not found");
      }
      break;
    case 'backButton':
      logToServer('Back button clicked');
      window.history.back();
      break;
  }
}

function generateLinks(data) {
  const linkContainer = document.getElementById("searchResults");
  linkContainer.innerHTML = ""; // Clear existing links

  data.records.forEach(record => {
    const partNumber = record.part_number || "N/A";
    const formattedDate = formatDateForURL(record.Date_Time) || "N/A";
    const channel = record.channel_info || "N/A";

    const link = document.createElement("a");
    link.href = `/show_graph/${partNumber}/${formattedDate}/${channel}`;
    link.textContent = `Show Graph for ${partNumber} on ${formattedDate} (Channel ${channel})`;
    link.className = "record-button"; // Add a class if you want to style it

    linkContainer.appendChild(link);
    linkContainer.appendChild(document.createElement("br")); // Line break after each link
  });
}

// Utility function to format date
function formatDateForURL(dateString) {
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    return `${month}-${day}-${year}`;
  }
  return null;
}

// Utility function to handle fetch and update
function fetchAndUpdate(url, callback, options = {}) {
  fetch(url, options)
    .then(response => response.json())
    .then(data => callback(data))
    .catch(error => logToServer(`Error: ${error}`));
}

// Utility function to check if an element is scrolled to the bottom
function isElementScrolledToBottom(element) {
  return element.scrollTop + element.clientHeight >= element.scrollHeight;
}

// Utility function to update an output element with records
function updateOutputElement(element, records, partNumber, channel) {
  if (element) {
    element.innerHTML = '';
    records.forEach(record => createRecordLink(record, partNumber, element, channel));
  }
}

// Utility function to clear an output element
function clearOutputElement(element) {
  if (element) {
    element.innerHTML = '';
  }
}

// Utility function to normalize keys in records
function normalizeKey(key) {
  return key.toLowerCase().replace(/[\s_()]/g, '');
}

// Function to handle messages from the DataWorker
function handleDataWorkerMessages(e) {
  logToServer('Entering handleDataWorkerMessages function');
  
  const { type, payload } = e.data;
  const graphContainer = document.getElementById('graphContainer');
  
  if (type === 'INITIAL_LOAD') {
    logToServer('Received INITIAL_LOAD message from dataWorker');
    
    const img = document.createElement('img');
    img.src = payload.graphURL;
    graphContainer.innerHTML = '';
    graphContainer.appendChild(img);
  } 
  else if (type === 'LAZY_LOAD') {
    logToServer('Received LAZY_LOAD message from dataWorker');
    logToServer(`Received lazy-load data: ${JSON.stringify(payload)}`);
  }
}
