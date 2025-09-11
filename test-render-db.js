#!/usr/bin/env node

/**
 * Test Render Database Connection
 * Diagnose and fix connection issues
 */

const { PrismaClient } = require('./server/node_modules/@prisma/client');

async function diagnoseConnection() {
  console.log('🔍 DIAGNOSING RENDER DATABASE CONNECTION');
  console.log('==========================================');

  try {
    // Load environment variables
    require('./server/node_modules/dotenv').config({ path: './server/.env' });
    
    console.log('📋 Current DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@'));
    
    console.log('\n🔌 Testing database connection...');
    const prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Query test successful:', result);
    
    // Test user count
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);
    
    await prisma.$disconnect();
    console.log('\n🎉 Database is working properly!');
    
  } catch (error) {
    console.error('\n❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'P1001') {
      console.log('\n🔧 P1001 Error - Database server unreachable');
      console.log('Possible causes:');
      console.log('1. Database server is down or sleeping');
      console.log('2. Network connectivity issues');
      console.log('3. Firewall blocking connection');
      console.log('4. Database URL is incorrect');
      console.log('5. SSL/TLS configuration issues');
      console.log('6. Render free tier database may be paused');
    }
    
    // Try different connection approaches
    await tryAlternativeConnections();
  }
}

async function tryAlternativeConnections() {
  console.log('\n🔄 Trying alternative connection methods...');
  
  const originalUrl = process.env.DATABASE_URL;
  
  // Test 1: Without SSL requirement
  try {
    console.log('\n1️⃣ Testing without SSL requirement...');
    const testUrl1 = originalUrl?.replace('?sslmode=require', '');
    console.log('   URL:', testUrl1?.replace(/:[^:@]*@/, ':****@'));
    
    const prisma1 = new PrismaClient({
      datasources: {
        db: {
          url: testUrl1
        }
      }
    });
    
    await prisma1.$connect();
    console.log('   ✅ Connection without SSL works!');
    await prisma1.$disconnect();
    
    // Update .env file to remove SSL requirement
    console.log('\n🔧 Updating .env to remove SSL requirement...');
    const fs = require('fs');
    const envContent = fs.readFileSync('.env', 'utf8');
    const updatedContent = envContent.replace(
      /DATABASE_URL="([^"]*)\?sslmode=require"/,
      'DATABASE_URL="$1"'
    );
    fs.writeFileSync('.env', updatedContent);
    console.log('   ✅ .env updated - SSL requirement removed');
    
    return;
    
  } catch (error1) {
    console.error('   ❌ Connection without SSL failed:', error1.message);
  }
  
  // Test 2: With different SSL mode
  try {
    console.log('\n2️⃣ Testing with sslmode=prefer...');
    const testUrl2 = originalUrl?.replace('?sslmode=require', '?sslmode=prefer');
    console.log('   URL:', testUrl2?.replace(/:[^:@]*@/, ':****@'));
    
    const prisma2 = new PrismaClient({
      datasources: {
        db: {
          url: testUrl2
        }
      }
    });
    
    await prisma2.$connect();
    console.log('   ✅ Connection with sslmode=prefer works!');
    await prisma2.$disconnect();
    
    // Update .env file
    console.log('\n🔧 Updating .env to use sslmode=prefer...');
    const fs = require('fs');
    const envContent = fs.readFileSync('.env', 'utf8');
    const updatedContent = envContent.replace(
      /DATABASE_URL="([^"]*)\?sslmode=require"/,
      'DATABASE_URL="$1?sslmode=prefer"'
    );
    fs.writeFileSync('.env', updatedContent);
    console.log('   ✅ .env updated - using sslmode=prefer');
    
    return;
    
  } catch (error2) {
    console.error('   ❌ Connection with sslmode=prefer failed:', error2.message);
  }
  
  // Test 3: Check if it's a Render free tier issue
  console.log('\n3️⃣ Checking Render database status...');
  console.log('   💡 If this is a Render free tier database, it may be paused due to inactivity');
  console.log('   💡 Try accessing your Render dashboard to wake up the database');
  console.log('   💡 Free tier databases pause after 15 minutes of inactivity');
  
  // Test 4: Network connectivity
  console.log('\n4️⃣ Testing network connectivity...');
  try {
    const url = new URL(originalUrl);
    const host = url.hostname;
    const port = url.port || 5432;
    
    console.log(`   Testing connection to ${host}:${port}...`);
    
    // Simple network test using Node.js net module
    const net = require('net');
    const socket = new net.Socket();
    
    await new Promise((resolve, reject) => {
      socket.setTimeout(5000);
      
      socket.on('connect', () => {
        console.log('   ✅ Network connection to database server successful');
        socket.destroy();
        resolve();
      });
      
      socket.on('timeout', () => {
        console.log('   ❌ Network connection timeout');
        socket.destroy();
        reject(new Error('Timeout'));
      });
      
      socket.on('error', (err) => {
        console.log('   ❌ Network connection failed:', err.message);
        reject(err);
      });
      
      socket.connect(port, host);
    });
    
  } catch (netError) {
    console.error('   ❌ Network test failed:', netError.message);
  }
}

async function fixRenderConnection() {
  console.log('\n🔧 ATTEMPTING TO FIX RENDER CONNECTION');
  console.log('=====================================');
  
  try {
    // Try to wake up the database by making a simple connection
    console.log('1. Attempting to wake up Render database...');
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL?.replace('?sslmode=require', '')
        }
      }
    });
    
    // Multiple connection attempts with delays
    for (let i = 1; i <= 3; i++) {
      try {
        console.log(`   Attempt ${i}/3...`);
        await prisma.$connect();
        console.log('   ✅ Database is awake and responding!');
        
        // Test with a simple query
        await prisma.$queryRaw`SELECT 1`;
        console.log('   ✅ Database queries working!');
        
        await prisma.$disconnect();
        return true;
        
      } catch (error) {
        console.log(`   ❌ Attempt ${i} failed:`, error.message);
        if (i < 3) {
          console.log('   ⏳ Waiting 5 seconds before retry...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
    }
    
    await prisma.$disconnect();
    return false;
    
  } catch (error) {
    console.error('❌ Failed to fix connection:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const fixed = await fixRenderConnection();
  
  if (!fixed) {
    await diagnoseConnection();
  } else {
    console.log('\n🎉 RENDER DATABASE CONNECTION FIXED!');
    console.log('The database is now accessible and ready for use.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { diagnoseConnection, fixRenderConnection };
