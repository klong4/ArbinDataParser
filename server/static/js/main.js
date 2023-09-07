// Create a Web Worker
const dataWorker = new Worker('static/dataWorker.js');

// Function to update part numbers (assuming you have an API to fetch them)
function updatePartNumbers() {
  fetch('/api/get_part_numbers')
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
    // Send data to your Web Worker for computation
    dataWorker.postMessage(data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
}

// Receive computed data from your Web Worker
dataWorker.onmessage = function(e) {
  const { graphURL } = e.data;
  // Render the graph
  if (graphURL) {
    renderGraph(graphURL);
  } else {
    alert('No data found for the selected part number and date.');
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updatePartNumbers();

  const submitButton = document.getElementById('submitButton');
  submitButton.addEventListener('click', submitData);
});
