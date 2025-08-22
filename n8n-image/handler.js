const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

exports.lambdaHandler = async (event) => {
    try {
        const prompt = event.body ? JSON.parse(event.body).prompt : event.prompt || "Hello World";
        
        console.log('Received prompt:', prompt);
        
        // Execute n8n workflow with the prompt
        const command = `n8n execute --id echo-workflow --input '{"prompt": "${prompt}"}'`;
        
        const { stdout, stderr } = await execPromise(command, {
            env: {
                ...process.env,
                N8N_USER_FOLDER: '/tmp/.n8n'
            }
        });
        
        if (stderr) {
            console.error('n8n stderr:', stderr);
        }
        
        console.log('n8n stdout:', stdout);
        
        // Parse n8n output and return the echoed response
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Echo successful',
                input: prompt,
                output: prompt, // Echo the input back
                n8n_output: stdout
            }),
        };
        
        return response;
        
    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Error processing request',
                error: error.message
            }),
        };
    }
};