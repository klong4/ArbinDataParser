document.addEventListener('DOMContentLoaded', () => {
  initPage();

  // Prevent form submission if no file is selected
  const uploadForm = document.getElementById('uploadForm');
  uploadForm.addEventListener('submit', function(event) {
    const fileInput = this.querySelector('input[type="file"]');
    if (!fileInput.files.length) {
      event.preventDefault();
      alert('Please select a file');
    }
  });
});

function initPage() {
  const dataWorker = new Worker('static/js/dataWorker.js');
  
  const partNumberInput = document.getElementById("partNumberInput");
  const channelInput = document.getElementById("channelInput"); // Add this line
  const recordList = document.getElementById("recordList");
  const submitButton = document.getElementById('submitButton');
  const searchButton = document.getElementById('searchButton');
  const graphContainer = document.getElementById('graphContainer');
  const backButton = document.getElementById('backButton');
  
  attachInputEventListener(partNumberInput, channelInput, recordList); // Pass channelInput
  attachClickEventListener(submitButton, 'submitButton');
  attachClickEventListener(searchButton, 'searchButton');
  attachScrollEventListener(graphContainer, dataWorker);
  attachClickEventListener(backButton, 'backButton');
  
  dataWorker.onmessage = handleDataWorkerMessages;
}

function attachInputEventListener(inputElement, channelInput, outputElement) { // Add channelInput parameter
  inputElement.addEventListener('input', () => {
    const partNumber = inputElement.value;
    const channel = channelInput.value; // Get the channel input value
    if (partNumber.length > 2 && channel.length > 0) { // Check both partNumber and channel
      fetchAndUpdate(`/api/get_records_for_part?part_number=${partNumber}&channel=${channel}`, data => {
        if (outputElement) { // Check if outputElement exists
          outputElement.innerHTML = '';
          data.records.forEach(record => createRecordLink(record, partNumber, outputElement, channel)); // Pass channel
        }
      });
    } else {
      if (outputElement) { // Check if outputElement exists
        outputElement.innerHTML = '';
      }
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

function createRecordLink(record, partNumber, parentElement, channelInfo) {
  if (!record.test_time || !channelInfo) { 
    fetch('/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: `Skipping record due to missing test_time or channelInfo: ${JSON.stringify(record)}` })
    }).then(response => {
      if (response.ok) {
        console.log('Logged channelInfo to app.log on the server.');
      } else {
        console.error('Failed to log channelInfo to app.log on the server.');
      }
    }).catch(error => {
      console.error(`Error logging channelInfo to app.log: ${error}`);
    });
        return;
  }
  
  // Extract the properties you want to display
  const formattedDate = record.test_time;
  const channel = channelInfo; // Extracted channel info

  // Log the extracted information for verification
  console.log(`Extracted Information: Date: ${formattedDate}, Channel: ${channel}`);
  
  const listItem = document.createElement("a");
  
  // Construct the button's text content with the extracted properties
  listItem.textContent = `${formattedDate} - Channel: ${channel}`;
  
  // Add the appropriate href based on your requirements
  listItem.href = `/show_graph/${partNumber}/${formattedDate}`;
  listItem.className = "record-button";
  
  parentElement.appendChild(listItem);
  console.log(`Link Populated: ${listItem.textContent}, Href: ${listItem.href}`);
  
  // Log to the server's app.log file
  fetch('/api/debug', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      message: `Link Populated: ${listItem.textContent}, Href: ${listItem.href}`,
    }),
  })
    .then(response => response.json())
    .then(result => {
      if (result.status === 'ok') {
        console.log('Logged link population to app.log on the server.');
      } else {
        console.error('Failed to log link population to app.log on the server.');
      }
    })
    .catch(error => {
      console.error(`Error logging link population to app.log: ${error}`);
    });
}


// Retrieve channel info based on the partNumber
fetch(`/get_channel_info/${partNumber}`)
  .then(response => response.json())
  .then(channelInfo => {
    console.log(`Fetched channelInfo: ${JSON.stringify(channelInfo)}`); // Log to console for debugging
    // Log to the server's app.log file
    fetch('/api/debug', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: `Fetched channelInfo: ${JSON.stringify(channelInfo)}` }),
    })
      .then(response => response.json())
      .then(result => {
        if (result.status === 'ok') {
          console.log('Logged channelInfo to app.log on the server.');
        } else {
          console.error('Failed to log channelInfo to app.log on the server.');
        }
        if (channelInfo) {
          createRecordLink(record, partNumber, parentElement, channelInfo); // Include channel info
        } else {
          console.log(`No channel info found for partNumber: ${partNumber}`);
        }
      })
      .catch(error => {
        console.error(`Error logging channelInfo to app.log: ${error}`);
      });
  })
  .catch(error => {
    console.error(`Error fetching channel info: ${error}`);
  });


// Function to extract channel number from the fileName
function extractChannelNumber(fileName) {
  const match = fileName.match(/_Channel_(\d+)_/);
  return match ? match[1] : 'Unknown'; // Return the channel number or 'Unknown' if not found
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
