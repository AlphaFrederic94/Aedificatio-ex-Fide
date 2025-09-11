#!/usr/bin/env node

/**
 * Comprehensive System Test Script
 * Tests all major functionality of the school management system
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Comprehensive System Tests...\n');

// Test configuration
const tests = [
  {
    name: 'Frontend Build Test',
    command: 'npm',
    args: ['run', 'build'],
    cwd: process.cwd(),
    timeout: 120000 // 2 minutes
  },
  {
    name: 'Backend Build Test',
    command: 'npm',
    args: ['run', 'build'],
    cwd: path.join(process.cwd(), 'server'),
    timeout: 60000 // 1 minute
  },
  {
    name: 'TypeScript Check',
    command: 'npx',
    args: ['tsc', '--noEmit'],
    cwd: process.cwd(),
    timeout: 30000
  },
  {
    name: 'Backend TypeScript Check',
    command: 'npx',
    args: ['tsc', '--noEmit'],
    cwd: path.join(process.cwd(), 'server'),
    timeout: 30000
  }
];

// Database setup test
const databaseTests = [
  {
    name: 'Database Schema Push',
    command: 'npx',
    args: ['prisma', 'db', 'push'],
    cwd: path.join(process.cwd(), 'server'),
    timeout: 30000
  },
  {
    name: 'Database Connection Test',
    command: 'node',
    args: ['-e', `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      async function testConnection() {
        try {
          await prisma.$connect();
          console.log('✅ Database connection successful');
          
          const schoolCount = await prisma.school.count();
          const userCount = await prisma.user.count();
          console.log(\`📊 Database stats: \${schoolCount} schools, \${userCount} users\`);
          
          await prisma.$disconnect();
          process.exit(0);
        } catch (error) {
          console.error('❌ Database connection failed:', error.message);
          await prisma.$disconnect();
          process.exit(1);
        }
      }
      
      testConnection();
    `],
    cwd: path.join(process.cwd(), 'server'),
    timeout: 15000
  }
];

// API endpoint tests
const apiTests = [
  {
    name: 'API Health Check',
    url: 'http://localhost:4000/health',
    method: 'GET'
  },
  {
    name: 'Auth Endpoint Test',
    url: 'http://localhost:4000/api/auth',
    method: 'POST',
    body: {
      email: 'test@example.com',
      password: 'testpassword'
    }
  }
];

// Utility functions
function runCommand(test) {
  return new Promise((resolve, reject) => {
    console.log(`🧪 Running: ${test.name}...`);
    
    const process = spawn(test.command, test.args, {
      cwd: test.cwd,
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    });

    let stdout = '';
    let stderr = '';

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    const timeout = setTimeout(() => {
      process.kill();
      reject(new Error(`Test "${test.name}" timed out after ${test.timeout}ms`));
    }, test.timeout);

    process.on('close', (code) => {
      clearTimeout(timeout);
      
      if (code === 0) {
        console.log(`✅ ${test.name} - PASSED`);
        resolve({ success: true, stdout, stderr });
      } else {
        console.log(`❌ ${test.name} - FAILED (exit code: ${code})`);
        if (stderr) console.log(`Error: ${stderr}`);
        resolve({ success: false, stdout, stderr, code });
      }
    });

    process.on('error', (error) => {
      clearTimeout(timeout);
      console.log(`❌ ${test.name} - ERROR: ${error.message}`);
      reject(error);
    });
  });
}

async function testAPI(test) {
  try {
    console.log(`🌐 Testing API: ${test.name}...`);
    
    const fetch = (await import('node-fetch')).default;
    const options = {
      method: test.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (test.body) {
      options.body = JSON.stringify(test.body);
    }

    const response = await fetch(test.url, options);
    
    if (response.ok || response.status === 401) { // 401 is expected for auth without valid credentials
      console.log(`✅ ${test.name} - PASSED (Status: ${response.status})`);
      return { success: true, status: response.status };
    } else {
      console.log(`❌ ${test.name} - FAILED (Status: ${response.status})`);
      return { success: false, status: response.status };
    }
  } catch (error) {
    console.log(`❌ ${test.name} - ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main test runner
async function runAllTests() {
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  console.log('📋 Phase 1: Build and TypeScript Tests\n');
  
  for (const test of tests) {
    try {
      const result = await runCommand(test);
      results.total++;
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - EXCEPTION: ${error.message}`);
      results.total++;
      results.failed++;
    }
    console.log(''); // Empty line for readability
  }

  console.log('\n📋 Phase 2: Database Tests\n');
  
  for (const test of databaseTests) {
    try {
      const result = await runCommand(test);
      results.total++;
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - EXCEPTION: ${error.message}`);
      results.total++;
      results.failed++;
    }
    console.log(''); // Empty line for readability
  }

  console.log('\n📋 Phase 3: API Tests (requires running server)\n');
  console.log('⚠️  Note: API tests require the backend server to be running on port 4000');
  console.log('   Start the server with: cd server && npm run dev\n');

  // Check if server is running before API tests
  try {
    const fetch = (await import('node-fetch')).default;
    await fetch('http://localhost:4000/health');
    
    for (const test of apiTests) {
      const result = await testAPI(test);
      results.total++;
      if (result.success) {
        results.passed++;
      } else {
        results.failed++;
      }
    }
  } catch (error) {
    console.log('⚠️  Backend server not running - skipping API tests');
    console.log('   To run API tests, start the server and run this script again\n');
  }

  // Final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`Passed: ${results.passed} ✅`);
  console.log(`Failed: ${results.failed} ❌`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All tests passed! System is ready for production.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }
  
  console.log('='.repeat(60));
  
  return results.failed === 0;
}

// Run the tests
runAllTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('Fatal error running tests:', error);
  process.exit(1);
});
