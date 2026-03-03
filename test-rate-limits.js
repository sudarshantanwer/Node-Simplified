#!/usr/bin/env node

/**
 * Rate Limiting Test Script
 * 
 * This script demonstrates various rate limiting techniques by making
 * requests to different endpoints and showing the responses.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(url, method = 'GET', data = null) {
    try {
        const config = {
            method,
            url: `${BASE_URL}${url}`,
            timeout: 5000
        };
        
        if (data) {
            config.data = data;
        }

        const start = Date.now();
        const response = await axios(config);
        const duration = Date.now() - start;

        return {
            success: true,
            status: response.status,
            duration,
            headers: response.headers,
            data: response.data
        };
    } catch (error) {
        const duration = Date.now() - start;
        return {
            success: false,
            status: error.response?.status || 0,
            duration,
            headers: error.response?.headers || {},
            error: error.response?.data || error.message
        };
    }
}

function logResult(testName, result, requestNum = null) {
    const prefix = requestNum ? `Request ${requestNum}:` : '';
    const status = result.success ? '✅' : '❌';
    const statusCode = result.status;
    const duration = `${result.duration}ms`;
    
    console.log(`${prefix} ${status} ${statusCode} (${duration}) - ${testName}`);
    
    // Log rate limit headers if present
    const headers = result.headers;
    if (headers['x-ratelimit-remaining']) {
        console.log(`   Remaining: ${headers['x-ratelimit-remaining']}`);
    }
    if (headers['x-delay-applied']) {
        console.log(`   Delay Applied: ${headers['x-delay-applied']}`);
    }
    if (headers['retry-after']) {
        console.log(`   Retry After: ${headers['retry-after']}s`);
    }
    if (headers['x-ratelimit-tier']) {
        console.log(`   IP Tier: ${headers['x-ratelimit-tier']}`);
    }
    
    if (!result.success && result.error) {
        console.log(`   Error: ${result.error.message || result.error}`);
    }
}

async function testBasicRateLimit() {
    console.log('\n🧪 Testing Basic Rate Limiting');
    console.log('Making 15 requests to /api/todo (lenient limit)...\n');
    
    for (let i = 1; i <= 15; i++) {
        const result = await makeRequest('/api/todo');
        logResult('Basic Rate Limit', result, i);
        await sleep(100); // Small delay between requests
    }
}

async function testSlidingWindow() {
    console.log('\n🧪 Testing Sliding Window Rate Limiting');
    console.log('Making 20 requests to sliding window endpoint...\n');
    
    for (let i = 1; i <= 20; i++) {
        const result = await makeRequest('/api/rate-limit-demo/demo/sliding-window');
        logResult('Sliding Window', result, i);
        await sleep(150);
    }
}

async function testTokenBucket() {
    console.log('\n🧪 Testing Token Bucket Rate Limiting');
    console.log('Making rapid requests to exhaust token bucket...\n');
    
    // Make rapid requests to test burst capacity
    for (let i = 1; i <= 25; i++) {
        const result = await makeRequest('/api/rate-limit-demo/demo/token-bucket');
        logResult('Token Bucket', result, i);
        
        // Vary delay to show burst behavior
        if (i <= 10) {
            await sleep(50); // Rapid requests first
        } else {
            await sleep(200); // Slower requests later
        }
    }
}

async function testProgressiveDelay() {
    console.log('\n🧪 Testing Progressive Delay Rate Limiting');
    console.log('Making requests to observe increasing delays...\n');
    
    for (let i = 1; i <= 15; i++) {
        const result = await makeRequest('/api/rate-limit-demo/demo/progressive-delay');
        logResult('Progressive Delay', result, i);
        await sleep(100);
    }
}

async function testIPBasedLimiting() {
    console.log('\n🧪 Testing IP-based Rate Limiting');
    console.log('Checking IP tier and limits...\n');
    
    const result = await makeRequest('/api/rate-limit-demo/demo/ip-based');
    logResult('IP-based Limiting', result);
    
    if (result.success && result.data.ipInfo) {
        console.log(`   Your IP Tier: ${result.data.ipInfo.tier}`);
        console.log(`   Remaining Requests: ${result.data.ipInfo.remaining}`);
    }
}

async function testStrictEndpoints() {
    console.log('\n🧪 Testing Strict Rate Limiting (Write Operations)');
    console.log('Testing create, update, and delete operations...\n');
    
    // Test create endpoint
    console.log('Testing POST /api/todo (strict limits):');
    for (let i = 1; i <= 8; i++) {
        const result = await makeRequest('/api/todo', 'POST', {
            task: `Test task ${i}`,
            status: false
        });
        logResult('Create Todo', result, i);
        await sleep(200);
    }
    
    // Test delete endpoint (very strict)
    console.log('\nTesting DELETE /api/todo/1 (very strict limits):');
    for (let i = 1; i <= 6; i++) {
        const result = await makeRequest('/api/todo/1', 'DELETE');
        logResult('Delete Todo', result, i);
        await sleep(300);
    }
}

async function testMultiLayerProtection() {
    console.log('\n🧪 Testing Multi-layer Protection');
    console.log('Testing endpoint with multiple rate limiting techniques...\n');
    
    for (let i = 1; i <= 10; i++) {
        const result = await makeRequest('/api/rate-limit-demo/protected/multi-layer', 'POST', {
            message: 'Testing multi-layer protection'
        });
        logResult('Multi-layer Protection', result, i);
        await sleep(200);
    }
}

async function checkStats() {
    console.log('\n📊 Rate Limiting Statistics');
    console.log('Getting current statistics...\n');
    
    const result = await makeRequest('/api/rate-limit-demo/stats');
    if (result.success) {
        console.log('✅ Statistics retrieved successfully');
        console.log('📈 IP-based Stats:', JSON.stringify(result.data.ipBasedStats, null, 2));
    } else {
        console.log('❌ Failed to retrieve statistics');
    }
}

async function runAllTests() {
    console.log('🚀 Starting Rate Limiting Tests');
    console.log('===============================================');
    
    try {
        // Check if server is running
        console.log('\n🔍 Checking server status...');
        const healthCheck = await makeRequest('/api/rate-limit-demo/health');
        if (!healthCheck.success) {
            console.log('❌ Server is not running. Please start the server with: npm start');
            return;
        }
        console.log('✅ Server is running');

        // Run all tests
        await testBasicRateLimit();
        await testSlidingWindow();
        await testTokenBucket();
        await testProgressiveDelay();
        await testIPBasedLimiting();
        await testStrictEndpoints();
        await testMultiLayerProtection();
        await checkStats();
        
        console.log('\n🎉 All tests completed!');
        console.log('===============================================');
        console.log('Visit http://localhost:3000/api/rate-limit-demo for more endpoints');
        console.log('Visit http://localhost:3000/api/rate-limit-demo/stats for real-time statistics');
        
    } catch (error) {
        console.error('\n💥 Test execution failed:', error.message);
        console.log('\nMake sure the server is running: npm start');
    }
}

// Run tests if script is executed directly
if (require.main === module) {
    // Check if axios is available
    try {
        require('axios');
        runAllTests();
    } catch (error) {
        console.log('❌ axios is required for testing. Install it with: npm install axios');
        console.log('Or test manually using curl or your preferred HTTP client.');
    }
}

module.exports = {
    makeRequest,
    testBasicRateLimit,
    testSlidingWindow,
    testTokenBucket,
    testProgressiveDelay,
    testIPBasedLimiting,
    testStrictEndpoints,
    testMultiLayerProtection,
    checkStats,
    runAllTests
};
