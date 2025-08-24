const { spawn, execSync } = require('child_process');
const http = require('http');
const fs = require('fs');

let n8nProcess = null;
let serverReady = false;

function waitForServer(maxAttempts = 60, interval = 1000) {
    return new Promise((resolve, reject) => {
        let attempts = 0;
        
        const checkServer = () => {
            attempts++;
            console.log(`Checking if n8n server is ready... (${attempts}/${maxAttempts})`);
            
            // Check if n8n process is still alive
            if (n8nProcess && !n8nProcess.killed) {
                console.log('n8n process is still running (PID:', n8nProcess.pid, ')');
            } else {
                console.log('WARNING: n8n process appears to have died');
            }
            
            const req = http.request({
                hostname: 'localhost',
                port: 5678,
                path: '/',
                method: 'GET',
                timeout: 2000
            }, (res) => {
                console.log('n8n server is fully ready and responding!');
                serverReady = true;
                resolve(true);
            });
            
            req.on('error', (err) => {
                console.log(`Health check attempt ${attempts} failed:`, err.code);
                if (attempts >= maxAttempts) {
                    console.error('n8n server failed to start after maximum attempts');
                    reject(new Error('Server startup timeout'));
                } else {
                    setTimeout(checkServer, interval);
                }
            });
            
            req.end();
        };
        
        checkServer();
    });
}

function testEchoWebhook(prompt) {
    return new Promise(async (resolve, reject) => {
        console.log('Testing echo webhook with prompt:', prompt);
        
        const postData = JSON.stringify({ prompt: prompt });
        console.log('POST data being sent to webhook:', postData);
        const webhookPaths = ['/webhook/echo', '/webhook-test/echo', '/echo'];
        
        for (const webhookPath of webhookPaths) {
            try {
                console.log('Trying webhook path:', webhookPath);
                
                const result = await new Promise((resolveRequest, rejectRequest) => {
                    const req = http.request({
                        hostname: 'localhost',
                        port: 5678,
                        path: webhookPath,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Content-Length': Buffer.byteLength(postData)
                        },
                        timeout: 10000
                    }, (res) => {
                        console.log(`Echo webhook response status for ${webhookPath}: ${res.statusCode}`);
                        
                        let data = '';
                        res.on('data', (chunk) => {
                            data += chunk;
                        });
                        
                        res.on('end', () => {
                            console.log(`Echo webhook response for ${webhookPath}:`, data);
                            try {
                                const responseData = JSON.parse(data);
                                resolveRequest({ path: webhookPath, status: res.statusCode, data: responseData });
                            } catch (parseError) {
                                resolveRequest({ path: webhookPath, status: res.statusCode, data: data });
                            }
                        });
                    });
                    
                    req.on('error', (err) => {
                        console.error(`Echo webhook error for ${webhookPath}:`, err.message);
                        rejectRequest(err);
                    });
                    
                    req.write(postData);
                    req.end();
                });
                
                // If we get a successful response (not 404), return it
                if (result.status === 200) {
                    console.log('Successful webhook response from:', result.path);
                    resolve(result.data);
                    return;
                }
                
            } catch (error) {
                console.log(`Failed to test ${webhookPath}:`, error.message);
            }
        }
        
        // If all paths failed, return the last error response
        console.log('All webhook paths failed, returning last attempt result');
        resolve({ error: 'All webhook paths failed' });
    });
}

function checkWorkflowStatus(workflowId) {
    try {
        console.log('Checking workflow status for:', workflowId);
        
        const statusCommand = `npm exec n8n list:workflow`;
        const result = execSync(statusCommand, {
            env: {
                ...process.env,
                N8N_USER_FOLDER: '/tmp/.n8n',
                N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: 'false',
                NODE_ENV: 'production',
                N8N_DISABLE_UI: 'true',
                N8N_RUNNERS_ENABLED: 'true'
            },
            encoding: 'utf8'
        });
        
        console.log('Workflow list result:', result);
        
        // Also try to get specific workflow info
        try {
            const workflowInfoCommand = `npm exec n8n list:workflow --filter=${workflowId}`;
            const workflowInfo = execSync(workflowInfoCommand, {
                env: {
                    ...process.env,
                    N8N_USER_FOLDER: '/tmp/.n8n',
                    N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: 'false',
                    NODE_ENV: 'production',
                    N8N_DISABLE_UI: 'true',
                    N8N_RUNNERS_ENABLED: 'true'
                },
                encoding: 'utf8'
            });
            
            console.log('Specific workflow info:', workflowInfo);
        } catch (filterError) {
            console.log('Could not get specific workflow info:', filterError.message);
        }
        
        return result;
    } catch (error) {
        console.error('Error checking workflow status:', error);
        return null;
    }
}

function loadWorkflowFromFile() {
    try {
        const workflowPath = '/var/task/echo-workflow.json';
        console.log('Loading workflow from:', workflowPath);
        
        const workflowData = fs.readFileSync(workflowPath, 'utf8');
        const workflow = JSON.parse(workflowData);
        
        console.log('Workflow loaded successfully:', workflow.name);
        return workflow;
    } catch (error) {
        console.error('Error loading workflow file:', error);
        throw error;
    }
}

function importWorkflow(workflowId) {
    try {
        console.log('Importing workflow using n8n CLI...');
        
        // Verify the workflow file exists at runtime
        const inputPath = '/var/task/echo-workflow.json';
        const exists = fs.existsSync(inputPath);
        console.log('Verifying workflow file path:', inputPath, 'exists:', exists);
        // print the content of the file
        console.log('Workflow file content:', fs.readFileSync(inputPath, 'utf8'));
        
        // Use npm exec with `--` to ensure subsequent flags go to n8n, not npm
        const importCommand = `npm exec n8n import:workflow -- --input=echo-workflow.json`;
        const result = execSync(importCommand, {
            env: {
                ...process.env,
                N8N_USER_FOLDER: '/tmp/.n8n',
                N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: 'false',
                NODE_ENV: 'production',
                N8N_DISABLE_UI: 'true',
                DB_SQLITE_POOL_SIZE: '1',
                N8N_RUNNERS_ENABLED: 'true'
            },
            encoding: 'utf8'
        });
        
        console.log('Workflow import result:', result);
        return result;
    } catch (error) {
        console.error('Error importing workflow:', error);
        throw error;
    }
}

function activateWorkflow(workflowId) {
    try {
        console.log('Activating workflow:', workflowId);
        
        const activateCommand = `npm exec n8n update:workflow -- --id=${workflowId} --active=true`;
        const result = execSync(activateCommand, {
            env: {
                ...process.env,
                N8N_USER_FOLDER: '/tmp/.n8n',
                N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: 'false',
                NODE_ENV: 'production',
                N8N_DISABLE_UI: 'true',
                DB_SQLITE_POOL_SIZE: '1',
                    N8N_RUNNERS_ENABLED: 'true'
            },
            encoding: 'utf8'
        });
        
        console.log('Workflow activation result:', result);
        return result;
    } catch (error) {
        console.error('Error activating workflow:', error);
        throw error;
    }
}

exports.lambdaHandler = async (event) => {
    try {
        let echoResponse = null;
        
        // Start n8n server using npm command if not already running
        if (!n8nProcess) {
            console.log('Starting n8n server using npm...');
            
            // Clean up any existing n8n data to avoid database conflicts
            execSync('rm -rf /tmp/.n8n', { encoding: 'utf8' });
            execSync('mkdir -p /tmp/.n8n', { encoding: 'utf8' });
            
            n8nProcess = spawn('npm', ['exec', 'n8n', 'start'], {
                env: {
                    ...process.env,
                    N8N_USER_FOLDER: '/tmp/.n8n',
                    N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: 'false',
                    NODE_ENV: 'production',
                    N8N_DISABLE_UI: 'true',
                    DB_SQLITE_POOL_SIZE: '1',
                    N8N_RUNNERS_ENABLED: 'true',
                    N8N_HOST: '0.0.0.0',
                    N8N_PORT: '5678',
                    N8N_PROTOCOL: 'http'
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            n8nProcess.stdout.on('data', (data) => {
                console.log('n8n stdout:', data.toString());
            });
            
            n8nProcess.stderr.on('data', (data) => {
                console.log('n8n stderr:', data.toString());
            });
            
            n8nProcess.on('error', (error) => {
                console.error('Failed to start n8n:', error);
            });
            
            n8nProcess.on('exit', (code, signal) => {
                console.log(`n8n process exited with code ${code} and signal ${signal}`);
            });
            
            console.log('n8n process spawned with PID:', n8nProcess.pid);
            
            // Check if npm and n8n are available first
            try {
                const npmVersion = execSync('npm --version', { encoding: 'utf8' });
                console.log('npm version:', npmVersion.trim());
                const n8nVersion = execSync('npm exec n8n -- --version', { encoding: 'utf8' });
                console.log('n8n version:', n8nVersion.trim());
            } catch (versionError) {
                console.error('Error checking versions:', versionError.message);
            }
            
            console.log('Waiting for server to be ready...');
            
            // Wait for server to be fully ready
            await waitForServer();
            
            // Load and import workflow after server is ready
            const workflow = loadWorkflowFromFile();
            await importWorkflow(workflow.id);
            await activateWorkflow(workflow.id);
            
            // Wait 5 seconds before restart to ensure workflow is properly activated
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Check workflow status after activation
            console.log('Checking workflow status after activation...');
            const workflowStatus = checkWorkflowStatus(workflow.id);
            
            console.log('Workflow loaded and activated, restarting n8n server...');
            
            // Kill the current n8n process
            n8nProcess.kill();
            n8nProcess = null;
            serverReady = false;
            
            // Wait a moment for process to fully terminate
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Start n8n server again
            console.log('Restarting n8n server with activated workflows...');
            
            n8nProcess = spawn('npm', ['exec', 'n8n', 'start'], {
                env: {
                    ...process.env,
                    N8N_USER_FOLDER: '/tmp/.n8n',
                    N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS: 'false',
                    NODE_ENV: 'production',
                    N8N_DISABLE_UI: 'true',
                    DB_SQLITE_POOL_SIZE: '1',
                    N8N_RUNNERS_ENABLED: 'true'
                },
                stdio: ['ignore', 'pipe', 'pipe']
            });
            
            n8nProcess.stdout.on('data', (data) => {
                console.log('n8n stdout:', data.toString());
            });
            
            n8nProcess.stderr.on('data', (data) => {
                console.log('n8n stderr:', data.toString());
            });
            
            n8nProcess.on('error', (error) => {
                console.error('Failed to restart n8n:', error);
            });
            
            console.log('n8n restarted, waiting for server to be ready...');
            
            // Wait for server to be ready again
            await waitForServer();
            
            console.log('n8n server restarted successfully, waiting for webhooks to register...');
            
            // Wait additional time for webhooks to register
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log('n8n server ready, checking workflow status after restart...');
            
            // Check workflow status after server restart
            const postRestartStatus = checkWorkflowStatus('echo-workflow');
            
            console.log('n8n server ready with workflows');
            
            // Extract prompt from event and test echo webhook
            let prompt = 'Hello from Lambda!'; // Default prompt
            
            if (event && event.body) {
                try {
                    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
                    prompt = body.prompt || body.message || prompt;
                } catch (parseError) {
                    console.log('Could not parse event body, using default prompt');
                }
            } else if (event && event.prompt) {
                prompt = event.prompt;
            }
            
            console.log('Testing echo webhook with extracted prompt:', prompt);
            console.log('Event received:', JSON.stringify(event, null, 2));
            echoResponse = await testEchoWebhook(prompt);
            
            console.log('Echo test completed successfully');
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'n8n server started and ready',
                status: 'running',
                echoResponse: echoResponse || 'Echo test not performed'
            }),
        };
        
    } catch (error) {
        console.error('Error:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Error starting n8n server',
                error: error.message
            }),
        };
    }
};

