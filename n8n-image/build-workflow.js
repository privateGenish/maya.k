const fs = require('fs');
const path = require('path');

// Read the echo processor JavaScript code
const echoProcessorCode = fs.readFileSync('/opt/echo-processor.js', 'utf8');

// Read the echo workflow template
const echoWorkflow = JSON.parse(fs.readFileSync('/opt/echo.json', 'utf8'));

// Find the code node and update its jsCode parameter
echoWorkflow.nodes.forEach(node => {
  if (node.type === 'n8n-nodes-base.code') {
    node.parameters.jsCode = echoProcessorCode;
  }
});

// Write the updated workflow back
fs.writeFileSync('/opt/echo-updated.json', JSON.stringify(echoWorkflow, null, 2));
console.log('Echo workflow updated with external JavaScript code');