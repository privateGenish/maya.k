// Debug and parse Lambda input for n8n echo workflow
console.log('=== N8N ECHO WORKFLOW STARTED ===');

// Get the raw webhook input
const webhookInput = $input.first();
console.log('Raw webhook input type:', typeof webhookInput);
console.log('Webhook input keys:', Object.keys(webhookInput));

// Get JSON data
const inputData = webhookInput.json;
console.log('Input data type:', typeof inputData);
console.log('Input data:', JSON.stringify(inputData, null, 2));

// Try to extract message from various locations
let extractedMessage = 'No message found';
let debugInfo = {
  input_type: typeof inputData,
  input_keys: Object.keys(inputData || {}),
  raw_input: inputData
};

// Extract prompt from body.prompt
if (inputData && inputData.body && inputData.body.prompt) {
  extractedMessage = inputData.body.prompt;
  debugInfo.found_in = 'body.prompt';
} else {
  // Fallback to full input for debugging
  extractedMessage = JSON.stringify(inputData);
  debugInfo.found_in = 'fallback_full_input';
}

console.log('Extracted message:', extractedMessage);
console.log('Debug info:', JSON.stringify(debugInfo, null, 2));

const result = {
  response: extractedMessage,
  timestamp: new Date().toISOString(),
  webhook_path: '/echo',
  debug: debugInfo,
  n8n_execution_id: $execution.id,
  workflow_name: 'Echo Debug Workflow'
};

console.log('Final result:', JSON.stringify(result, null, 2));
console.log('=== N8N ECHO WORKFLOW COMPLETED ===');

return [{ json: result }];