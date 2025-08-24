const http = require('http');

async function waitForN8n() {
    const maxWaitTime = 180000; // 3 minutes (180 seconds)
    const interval = 1000; // 1 second
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
        try {
            const response = await new Promise((resolve, reject) => {
                const req = http.request({
                    hostname: 'localhost',
                    port: 5678,
                    path: '/healthz',
                    method: 'GET',
                    timeout: 2000
                }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve({ statusCode: res.statusCode, data }));
                });
                
                req.on('error', reject);
                req.on('timeout', () => reject(new Error('Request timeout')));
                req.end();
            });
            
            if (response.statusCode === 200) {
                console.log('n8n is ready!');
                return true;
            }
        } catch (error) {
            // n8n not ready yet, continue waiting
        }
        
        await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error('n8n failed to start within 3 minutes');
}

exports.handler = async (event) => {
    try {
        console.log('Received event:', JSON.stringify(event, null, 2));
        
        // Wait for n8n to be ready
        await waitForN8n();

        const postData = JSON.stringify(event);
        const options = {
            hostname: 'localhost',
            port: 5678,
            path: '/webhook/echo', 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData),
            },
        };

        return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseBody = '';
            res.on('data', (chunk) => {
                responseBody += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('Successfully triggered n8n workflow.');
                    resolve({
                        statusCode: 200,
                        body: JSON.stringify({ message: 'Workflow triggered successfully', data: JSON.parse(responseBody) }),
                    });
                } else {
                    console.error('Failed to trigger n8n workflow. Status:', res.statusCode, 'Response:', responseBody);
                    resolve({
                        statusCode: 200,
                        body: JSON.stringify({
                            success: false,
                            error: `Failed to trigger workflow. Status: ${res.statusCode}`,
                            response: responseBody
                        })
                    });
                }
            });
        });

        req.on('error', (e) => {
            console.error('Error triggering n8n workflow:', e.message);
            resolve({
                statusCode: 200,
                body: JSON.stringify({
                    success: false,
                    error: e.message,
                    message: 'Network error connecting to n8n'
                })
            });
        });

            req.write(postData);
            req.end();
        });
    } catch (error) {
        console.error('Lambda handler error:', error);
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: false,
                error: error.message,
                message: 'Failed to process event through n8n'
            })
        };
    }
};