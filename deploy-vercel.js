/**
 * Vercel Deployment Helper Script
 * 
 * This script helps deploy the application to Vercel with the correct configuration.
 * It ensures that the client build directory is included in the deployment.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

console.log(`${colors.bright}${colors.cyan}Vercel Deployment Helper${colors.reset}\n`);

// Check if client/build directory exists
const clientBuildPath = path.join(__dirname, 'client', 'build');
if (!fs.existsSync(clientBuildPath)) {
  console.log(`${colors.yellow}Client build directory not found. Building client...${colors.reset}`);
  try {
    execSync('cd client && npm run build', { stdio: 'inherit' });
    console.log(`${colors.green}Client build completed successfully.${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error building client:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Check if index.html exists in client/build
const indexHtmlPath = path.join(clientBuildPath, 'index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error(`${colors.red}index.html not found in client/build directory.${colors.reset}`);
  process.exit(1);
}

// Check if vercel.json exists
const vercelJsonPath = path.join(__dirname, 'vercel.json');
if (!fs.existsSync(vercelJsonPath)) {
  console.error(`${colors.red}vercel.json not found.${colors.reset}`);
  process.exit(1);
}

// Deploy to Vercel
console.log(`${colors.bright}${colors.cyan}Deploying to Vercel...${colors.reset}`);
try {
  const isProd = process.argv.includes('--prod');
  const command = isProd ? 'vercel --prod' : 'vercel';
  execSync(command, { stdio: 'inherit' });
  console.log(`${colors.green}Deployment completed successfully.${colors.reset}`);
} catch (error) {
  console.error(`${colors.red}Error deploying to Vercel:${colors.reset}`, error.message);
  process.exit(1);
}