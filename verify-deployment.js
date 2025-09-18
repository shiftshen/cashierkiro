#!/usr/bin/env node

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

console.log('🔍 DAMO Cashier - Deployment Verification');
console.log('==========================================\n');

// Configuration
const LOCAL_SERVER = 'http://localhost:8091';
const API_SERVER = 'https://www.vdamo.com';
const REQUIRED_FILES = [
    'index.html',
    'main.js',
    'App.vue',
    'manifest.json',
    'pages.json',
    'package.json',
    'custom/siteroot.js',
    'api/index.js',
    'common/request.js'
];

// Test results
let testResults = {
    files: 0,
    localServer: false,
    apiServer: false,
    configuration: false
};

// Helper function to make HTTP requests
function makeRequest(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        
        // Parse URL to handle localhost properly
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname === 'localhost' ? '127.0.0.1' : urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            timeout: timeout
        };
        
        const req = client.get(options, (res) => {
            resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                ok: res.statusCode >= 200 && res.statusCode < 300
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

// Test 1: Check required files
console.log('📁 Checking required files...');
REQUIRED_FILES.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`   ✅ ${file}`);
        testResults.files++;
    } else {
        console.log(`   ❌ ${file} - Missing`);
    }
});
console.log(`   📊 Files found: ${testResults.files}/${REQUIRED_FILES.length}\n`);

// Test 2: Check local server
async function testLocalServer() {
    console.log('🌐 Testing local development server...');
    try {
        const response = await makeRequest(`${LOCAL_SERVER}/index.html`);
        if (response.ok) {
            console.log(`   ✅ Local server is running on ${LOCAL_SERVER}`);
            testResults.localServer = true;
        } else {
            console.log(`   ⚠️  Local server responded with status: ${response.statusCode}`);
        }
    } catch (error) {
        console.log(`   ❌ Local server is not accessible: ${error.message}`);
        console.log(`   💡 Try running: npm run serve`);
    }
    console.log('');
}

// Test 3: Check API server connectivity
async function testApiServer() {
    console.log('🔗 Testing API server connectivity...');
    try {
        const response = await makeRequest(`${API_SERVER}/channel/profix`);
        console.log(`   ✅ API server is accessible (Status: ${response.statusCode})`);
        testResults.apiServer = true;
    } catch (error) {
        console.log(`   ❌ API server is not accessible: ${error.message}`);
        console.log(`   💡 Check your internet connection and firewall settings`);
    }
    console.log('');
}

// Test 4: Validate configuration
function testConfiguration() {
    console.log('⚙️  Validating configuration...');
    
    try {
        // Check siteroot.js
        const siterootPath = 'custom/siteroot.js';
        if (fs.existsSync(siterootPath)) {
            const content = fs.readFileSync(siterootPath, 'utf8');
            if (content.includes('https://www.vdamo.com')) {
                console.log('   ✅ API endpoint configuration is correct');
            } else {
                console.log('   ⚠️  API endpoint might not be configured correctly');
            }
        }
        
        // Check package.json
        const packagePath = 'package.json';
        if (fs.existsSync(packagePath)) {
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            if (pkg.scripts && pkg.scripts.serve) {
                console.log('   ✅ npm scripts are configured');
            } else {
                console.log('   ⚠️  npm scripts might be missing');
            }
        }
        
        // Check manifest.json (uni-app format with comments)
        const manifestPath = 'manifest.json';
        if (fs.existsSync(manifestPath)) {
            try {
                const content = fs.readFileSync(manifestPath, 'utf8');
                // Remove JavaScript-style comments for JSON parsing
                const cleanContent = content.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
                const manifest = JSON.parse(cleanContent);
                if (manifest.h5 && manifest.h5.devServer) {
                    console.log('   ✅ H5 development server configuration found');
                    testResults.configuration = true;
                } else {
                    console.log('   ⚠️  H5 development server configuration might be missing');
                }
            } catch (error) {
                // If JSON parsing fails, just check for h5 configuration text
                const content = fs.readFileSync(manifestPath, 'utf8');
                if (content.includes('"h5"') && content.includes('devServer')) {
                    console.log('   ✅ H5 development server configuration found');
                    testResults.configuration = true;
                } else {
                    console.log('   ⚠️  H5 development server configuration might be missing');
                }
            }
        }
        
    } catch (error) {
        console.log(`   ❌ Configuration validation failed: ${error.message}`);
    }
    console.log('');
}

// Generate report
function generateReport() {
    console.log('📊 Deployment Verification Report');
    console.log('=================================');
    
    const totalTests = 4;
    let passedTests = 0;
    
    if (testResults.files === REQUIRED_FILES.length) {
        console.log('✅ File Structure: PASS');
        passedTests++;
    } else {
        console.log('❌ File Structure: FAIL');
    }
    
    if (testResults.localServer) {
        console.log('✅ Local Server: PASS');
        passedTests++;
    } else {
        console.log('❌ Local Server: FAIL');
    }
    
    if (testResults.apiServer) {
        console.log('✅ API Connectivity: PASS');
        passedTests++;
    } else {
        console.log('❌ API Connectivity: FAIL');
    }
    
    if (testResults.configuration) {
        console.log('✅ Configuration: PASS');
        passedTests++;
    } else {
        console.log('❌ Configuration: FAIL');
    }
    
    console.log(`\n📈 Overall Score: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
        console.log('🎉 Deployment verification completed successfully!');
        console.log('🚀 Your DAMO Cashier system is ready for development.');
    } else {
        console.log('⚠️  Some issues were found. Please review the results above.');
    }
    
    console.log('\n📖 Next Steps:');
    console.log('   1. Start development server: npm run serve');
    console.log('   2. Open browser: http://localhost:8091/index.html');
    console.log('   3. Test API connectivity: http://localhost:8091/test-api.html');
}

// Run all tests
async function runTests() {
    testConfiguration();
    await testLocalServer();
    await testApiServer();
    generateReport();
}

runTests().catch(console.error);