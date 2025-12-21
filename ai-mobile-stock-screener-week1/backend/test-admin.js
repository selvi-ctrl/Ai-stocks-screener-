/**
 * Admin Test Script
 * Tests admin creation, login, and admin-protected endpoints
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';
const ADMIN_SETUP_KEY = process.env.ADMIN_SETUP_KEY || 'admin-setup-2025';

// Helper function to make HTTP requests
function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Admin Test Suite\n');
    console.log('=' .repeat(60));

    let adminToken = null;
    const testAdmin = {
        email: 'admin@test.com',
        password: 'Admin@123456',
        name: 'Test Admin',
        adminKey: ADMIN_SETUP_KEY
    };

    // Test 1: Create Admin User
    try {
        console.log('\n[1/5] Testing admin creation...');
        const response = await request('POST', '/api/auth/create-admin', testAdmin);
        
        if (response.status === 201) {
            console.log('✅ Admin created successfully');
            console.log(`   Email: ${testAdmin.email}`);
            console.log(`   Role: ${response.data.user?.role}`);
        } else if (response.status === 500 && response.data.error?.includes('duplicate key')) {
            console.log('ℹ️  Admin already exists (using existing admin)');
        } else {
            console.log(`❌ Failed: ${response.data.error || 'Unknown error'}`);
            console.log(`   Status: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }

    // Test 2: Admin Login
    try {
        console.log('\n[2/5] Testing admin login...');
        const response = await request('POST', '/api/auth/login', {
            email: testAdmin.email,
            password: testAdmin.password
        });

        if (response.status === 200 && response.data.token) {
            adminToken = response.data.token;
            console.log('✅ Admin login successful');
            console.log(`   Token: ${adminToken.substring(0, 20)}...`);
            console.log(`   User: ${response.data.user?.name}`);
            console.log(`   Role: ${response.data.user?.role}`);
        } else {
            console.log(`❌ Login failed: ${response.data.error || 'Unknown error'}`);
            console.log(`   Status: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }

    if (!adminToken) {
        console.log('\n⚠️  Cannot continue tests without admin token');
        return;
    }

    // Test 3: Get Admin Profile
    try {
        console.log('\n[3/5] Testing admin profile access...');
        const url = new URL('/api/auth/profile', BASE_URL);
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        };

        const response = await new Promise((resolve, reject) => {
            const req = http.request(url, options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, data: JSON.parse(body) });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: body });
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });

        if (response.status === 200) {
            console.log('✅ Profile retrieved successfully');
            console.log(`   Email: ${response.data.user?.email}`);
            console.log(`   Name: ${response.data.user?.name}`);
            console.log(`   Role: ${response.data.user?.role}`);
        } else {
            console.log(`❌ Failed: ${response.data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }

    // Test 4: Access Admin-Protected Endpoint (Scheduler Status)
    try {
        console.log('\n[4/5] Testing scheduler status access...');
        const url = new URL('/api/scheduler/status', BASE_URL);
        const options = {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${adminToken}`
            }
        };

        const response = await new Promise((resolve, reject) => {
            const req = http.request(url, options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        resolve({ status: res.statusCode, data: JSON.parse(body) });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: body });
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });

        if (response.status === 200) {
            console.log('✅ Scheduler status retrieved');
            console.log(`   Is running: ${response.data.data?.isRunning}`);
            console.log(`   Last run: ${response.data.data?.lastRun || 'Never'}`);
            console.log(`   Run count: ${response.data.data?.runCount || 0}`);
        } else {
            console.log(`❌ Failed: ${response.data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }

    // Test 5: Test Regular User Cannot Access Admin Endpoint
    try {
        console.log('\n[5/5] Testing regular user access restriction...');
        
        // First create a regular user
        const regularUser = {
            email: 'user@test.com',
            password: 'User@123456',
            name: 'Test User'
        };

        const createResponse = await request('POST', '/api/auth/register', regularUser);
        
        let userToken = null;
        if (createResponse.status === 201 || createResponse.status === 500) {
            // Try to login
            const loginResponse = await request('POST', '/api/auth/login', {
                email: regularUser.email,
                password: regularUser.password
            });
            
            if (loginResponse.status === 200) {
                userToken = loginResponse.data.token;
            }
        }

        if (userToken) {
            // Try to access admin endpoint
            const url = new URL('/api/scheduler/trigger', BASE_URL);
            const options = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${userToken}`
                }
            };

            const response = await new Promise((resolve, reject) => {
                const req = http.request(url, options, (res) => {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        try {
                            resolve({ status: res.statusCode, data: JSON.parse(body) });
                        } catch (e) {
                            resolve({ status: res.statusCode, data: body });
                        }
                    });
                });
                req.on('error', reject);
                req.end();
            });

            if (response.status === 403) {
                console.log('✅ Regular user correctly denied admin access');
                console.log(`   Status: 403 Forbidden`);
            } else {
                console.log(`⚠️  Unexpected status: ${response.status}`);
                console.log(`   Expected: 403, Got: ${response.status}`);
            }
        } else {
            console.log('⚠️  Could not create/login regular user for testing');
        }
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Admin tests completed!\n');
    console.log('Admin credentials for manual testing:');
    console.log(`   Email: ${testAdmin.email}`);
    console.log(`   Password: ${testAdmin.password}`);
    console.log(`   Login at: ${BASE_URL}/login.html\n`);
}

// Run tests
console.log('Waiting for server to be ready...\n');
setTimeout(() => {
    runTests().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
}, 1000);
