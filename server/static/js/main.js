// Create a Web Worker
const dataWorker = new Worker('static/js/dataWorker.js');

// Function to update part numbers
function updatePartNumbers() {
  fetch('/api/extract_part_number')
    .then(response => response.json())
    .then(data => {
      const partNumberSelect = document.getElementById('partNumberSelect');
      data.partNumbers.forEach(partNumber => {
        const option = document.createElement('option');
        option.value = partNumber;
        option.text = partNumber;
        partNumberSelect.appendChild(option);
      });
    });
}

// Function to submit the form data
function submitData() {
  const partNumber = document.getElementById('partNumberSelect').value;
  const testDate = document.getElementById('testDate').value;

  fetch('/api/get_graph_data', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ partNumber, testDate })
  })
  .then(response => response.json())
  .then(data => {
    // Send data to the Web Worker for computation
    dataWorker.postMessage({ type: 'INITIAL_LOAD', data });
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Function to handle lazy loading
function lazyLoadData() {
  // You can define logic here to decide which data to load next
  // For now, this function just sends a message to the worker to fetch more data
  dataWorker.postMessage({ type: 'LAZY_LOAD' });
}

// Receive computed data from the Web Worker
dataWorker.onmessage = function(e) {
  const { type, payload } = e.data;
  
  if (type === 'INITIAL_LOAD') {
    // Handle initial data load here
    renderGraph(payload.graphURL);
  } else if (type === 'LAZY_LOAD') {
    // Handle lazy-loaded data here
    updateGraph(payload.graphURL);
  }
};

// Function to render the graph
function renderGraph(graphURL) {
  const graphContainer = document.getElementById('graphContainer');
  const img = document.createElement('img');
  img.src = graphURL;
  graphContainer.innerHTML = ''; // Clear previous graphs
  graphContainer.appendChild(img);
}

// Function to update the graph with lazy-loaded data
function updateGraph(graphURL) {
  // Logic to update the existing graph
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updatePartNumbers();
  
  const submitButton = document.getElementById('submitButton');
  submitButton.addEventListener('click', submitData);
  
  // Add an event listener to initiate lazy loading when user scrolls to the end of the graph
  const graphContainer = document.getElementById('graphContainer');
  graphContainer.addEventListener('scroll', function() {
    if (graphContainer.scrollTop + graphContainer.clientHeight >= graphContainer.scrollHeight) {
      lazyLoadData();
    }
  });
});
