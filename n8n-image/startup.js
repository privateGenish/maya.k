const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Initialize n8n environment
function initializeN8n() {
    const n8nFolder = '/tmp/.n8n';
    const workflowsFolder = path.join(n8nFolder, 'workflows');
    
    // Ensure directories exist
    if (!fs.existsSync(n8nFolder)) {
        fs.mkdirSync(n8nFolder, { recursive: true });
    }
    
    if (!fs.existsSync(workflowsFolder)) {
        fs.mkdirSync(workflowsFolder, { recursive: true });
    }
    
    console.log('n8n environment initialized');
    return true;
}

// Import workflow into n8n
async function importWorkflow() {
    return new Promise((resolve, reject) => {
        const workflowPath = '/tmp/.n8n/workflows/echo-workflow.json';
        
        // Copy workflow file if it doesn't exist
        if (!fs.existsSync(workflowPath)) {
            const sourceWorkflow = path.join(__dirname, 'echo-workflow.json');
            if (fs.existsSync(sourceWorkflow)) {
                fs.copyFileSync(sourceWorkflow, workflowPath);
                console.log('Workflow copied to n8n folder');
            }
        }
        
        resolve(true);
    });
}

module.exports = {
    initializeN8n,
    importWorkflow
};