let fullData = null;  // Store the full dataset
let thinnedData = null;  // Store the thinned dataset

// Function to dynamically thin data based on the data length
function dynamicThinData(data) {
  // Determine the thinning step dynamically.
  // If data length is less than 100, we take the whole data; otherwise, we divide it into 100 parts.
  const step = data.length < 100 ? 1 : Math.floor(data.length / 100);
  
  const thinnedData = [];
  
  for (let i = 0; i < data.length; i += step) {
    // Skip points that are NaN or undefined
    if (data[i] === undefined || isNaN(data[i])) {
      continue;
    }
    
    // Add the data point to the thinned array
    thinnedData.push(data[i]);
  }
  
  return thinnedData;
}

// Function to aggregate data dynamically based on the data length
function dynamicAggregateData(data) {
  // Determine the aggregation step dynamically.
  // If data length is less than 100, we take the whole data; otherwise, we divide it into 100 parts.
  const step = data.length < 100 ? 1 : Math.floor(data.length / 100);
  
  const aggregatedData = [];
  
  for (let i = 0; i < data.length; i += step) {
    const slice = data.slice(i, i + step);
    
    // Skip slices that have insufficient data points or contain NaN or undefined
    if (slice.length < step || slice.some(val => val === undefined || isNaN(val))) {
      continue;
    }
    
    // Calculate the average
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
