/**
 * Vercel Deployment Test Script
 * 
 * This script helps test if your Vercel deployment is working correctly.
 * It checks the API endpoints and reports their status.
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Make an HTTPS request
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Test API endpoints
async function testEndpoints(baseUrl) {
  console.log(`${colors.bright}${colors.cyan}Testing API endpoints at ${baseUrl}...${colors.reset}\n`);
  
  // Test health endpoint
  try {
    console.log(`Testing health endpoint...`);
    const healthResult = await makeRequest(`${baseUrl}/api/health`);
    
    if (healthResult.statusCode === 200) {
      console.log(`${colors.bright}${colors.green}✓ Health endpoint is working!${colors.reset}`);
      console.log(`Response: ${healthResult.data}\n`);
    } else {
      console.log(`${colors.bright}${colors.red}✗ Health endpoint returned status ${healthResult.statusCode}${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`${colors.bright}${colors.red}✗ Error testing health endpoint:${colors.reset}`, error.message, '\n');
  }
  
  // Test surveys endpoint
  try {
    console.log(`Testing surveys endpoint...`);
    const surveysResult = await makeRequest(`${baseUrl}/api/surveys`);
    
    if (surveysResult.statusCode === 200) {
      console.log(`${colors.bright}${colors.green}✓ Surveys endpoint is working!${colors.reset}`);
      console.log(`Response contains ${JSON.parse(surveysResult.data).length} surveys\n`);
    } else {
      console.log(`${colors.bright}${colors.red}✗ Surveys endpoint returned status ${surveysResult.statusCode}${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`${colors.bright}${colors.red}✗ Error testing surveys endpoint:${colors.reset}`, error.message, '\n');
  }
  
  // Test if frontend is accessible
  try {
    console.log(`Testing frontend...`);
    const frontendResult = await makeRequest(baseUrl);
    
    if (frontendResult.statusCode === 200) {
      console.log(`${colors.bright}${colors.green}✓ Frontend is accessible!${colors.reset}\n`);
    } else {
      console.log(`${colors.bright}${colors.red}✗ Frontend returned status ${frontendResult.statusCode}${colors.reset}\n`);
    }
  } catch (error) {
    console.error(`${colors.bright}${colors.red}✗ Error testing frontend:${colors.reset}`, error.message, '\n');
  }
}

// Main function
async function main() {
  console.log(`${colors.bright}${colors.cyan}=== Vercel Deployment Test ===${colors.reset}\n`);
  
  // Get deployment URL from command line or prompt
  let deploymentUrl = process.argv[2];
  
  if (!deploymentUrl) {
    rl.question(`${colors.bright}Enter your Vercel deployment URL (e.g., https://your-app.vercel.app):${colors.reset} `, async (answer) => {
      deploymentUrl = answer.trim();
      
      if (!deploymentUrl) {
        console.log(`${colors.bright}${colors.red}No URL provided. Exiting.${colors.reset}`);
        process.exit(1);
      }
      
      // Ensure URL has https:// prefix
      if (!deploymentUrl.startsWith('https://')) {
        deploymentUrl = `https://${deploymentUrl}`;
      }
      
      // Remove trailing slash if present
      if (deploymentUrl.endsWith('/')) {
        deploymentUrl = deploymentUrl.slice(0, -1);
      }
      
      await testEndpoints(deploymentUrl);
      rl.close();
    });
  } else {
    // Ensure URL has https:// prefix
    if (!deploymentUrl.startsWith('https://')) {
      deploymentUrl = `https://${deploymentUrl}`;
    }
    
    // Remove trailing slash if present
    if (deploymentUrl.endsWith('/')) {
      deploymentUrl = deploymentUrl.slice(0, -1);
    }
    
    await testEndpoints(deploymentUrl);
    rl.close();
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.bright}${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});