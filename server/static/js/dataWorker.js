self.addEventListener('message', function(e) {
    const inputData = e.data;
    // For now, just pass through the data. You can add computation logic here later.
    const outputData = inputData;
    self.postMessage(outputData);
  }, false);
  