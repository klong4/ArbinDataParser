const dataWorker = new Worker('static/js/dataWorker.js');

function fetchAndUpdate(url, callback, options = {}) {
  fetch(url, options)
    .then(response => response.json())
    .then(callback)
    .catch(error => console.error('Error:', error));
}

function createOption(value, parentElement) {
  const option = document.createElement('option');
  option.value = value;
  option.text = value;
  parentElement.appendChild(option);
}

function createRecordLink(record, partNumber, parentElement) {
  const listItem = document.createElement("a");
  listItem.textContent = record;
  listItem.href = `/show_graph/${partNumber}/${record}`;
  parentElement.appendChild(listItem);
}

//#document.addEventListener('DOMContentLoaded', () => {
//#  fetchAndUpdate('/api/extract_part_number', data => {
//#    const partNumberSelect = document.getElementById('partNumberSelect');
//#    data.partNumbers.forEach(partNumber => createOption(partNumber, partNumberSelect));
//#  });

  document.getElementById('submitButton').addEventListener('click', () => {
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

  document.getElementById('searchButton').addEventListener('click', () => {
    const partNumber = document.getElementById("partNumberInput").value;

    fetchAndUpdate(`/api/get_records_for_part?part_number=${partNumber}`, data => {
      const recordList = document.getElementById("recordList");
      recordList.innerHTML = '';
      data.records.forEach(record => createRecordLink(record, partNumber, recordList));
    });
  });

  const graphContainer = document.getElementById('graphContainer');
  graphContainer.addEventListener('scroll', () => {
    if (graphContainer.scrollTop + graphContainer.clientHeight >= graphContainer.scrollHeight) {
      dataWorker.postMessage({ type: 'LAZY_LOAD' });
    }
  });
});

dataWorker.onmessage = e => {
  const { type, payload } = e.data;
  const graphContainer = document.getElementById('graphContainer');
  
  if (type === 'INITIAL_LOAD') {
    const img = document.createElement('img');
    img.src = payload.graphURL;
    graphContainer.innerHTML = '';
    graphContainer.appendChild(img);
  } else if (type === 'LAZY_LOAD') {
    // Update graph logic here
  }
};
