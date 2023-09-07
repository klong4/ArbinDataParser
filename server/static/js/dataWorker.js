let fullData = null;  // Store the full dataset
let thinnedData = null;  // Store the thinned dataset

// Function to thin data
function thinData(data) {
  // Implement your data-thinning algorithm here.
  // For simplicity, let's take every 100th data point.
  return data.filter((_, index) => index % 100 === 0);
}

// Function to aggregate data
function aggregateData(data) {
  // Implement your data aggregation algorithm here.
  // For example, you can average every 100 points.
  const aggregatedData = [];
  for (let i = 0; i < data.length; i += 100) {
    const slice = data.slice(i, i + 100);
    const avg = slice.reduce((acc, val) => acc + val, 0) / slice.length;
    aggregatedData.push(avg);
  }
  return aggregatedData;
}

// Message handler for the Web Worker
self.addEventListener('message', (e) => {
  const { type, data } = e.data;

  if (type === 'INITIAL_LOAD') {
    fullData = data;
    thinnedData = thinData(fullData);
    const aggregatedData = aggregateData(thinnedData);

    // Generate the graph URL or data here. For this example, let's assume a URL is generated.
    const graphURL = 'some_url_based_on_aggregated_data';

    // Post back the initial data to the main thread
    self.postMessage({ type: 'INITIAL_LOAD', payload: { graphURL } });
  }
  
  else if (type === 'LAZY_LOAD') {
    // Implement your logic to lazy-load more data points here.

    // Generate the graph URL or data based on the newly loaded data
    const graphURL = 'some_new_url_based_on_lazy_loaded_data';

    // Post back the lazy-loaded data to the main thread
    self.postMessage({ type: 'LAZY_LOAD', payload: { graphURL } });
  }
});
