/**
 * Vercel Deployment Script
 * 
 * This script helps automate the deployment process to Vercel.
 * It checks for prerequisites and guides the user through the deployment steps.
 */

const { execSync } = require('child_process');
const fs = require('fs');
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

// Check if Vercel CLI is installed
function checkVercelCLI() {
  try {
    execSync('vercel --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Check if user is logged in to Vercel
function checkVercelLogin() {
  try {
    const result = execSync('vercel whoami', { encoding: 'utf8' }).trim();
    return result.length > 0 && !result.includes('Error');
  } catch (error) {
    return false;
  }
}

// Check if MongoDB URI is set
function checkMongoURI() {
  try {
    const envContent = fs.readFileSync('.env', 'utf8');
    return envContent.includes('MONGO_URI=');
  } catch (error) {
    return false;
  }
}

// Deploy to Vercel
function deployToVercel(isProd = false) {
  console.log(`${colors.bright}${colors.cyan}Deploying to Vercel...${colors.reset}`);
  
  try {
    const command = isProd ? 'vercel --prod' : 'vercel';
    execSync(command, { stdio: 'inherit' });
    
    console.log(`\n${colors.bright}${colors.green}Deployment successful!${colors.reset}`);
    
    if (!isProd) {
      console.log(`\n${colors.yellow}This was a preview deployment. To deploy to production, run:${colors.reset}`);
      console.log(`${colors.bright}node deploy.js --prod${colors.reset}`);
    }
  } catch (error) {
    console.error(`\n${colors.bright}${colors.red}Deployment failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  console.log(`${colors.bright}${colors.cyan}=== Vercel Deployment Helper ===${colors.reset}\n`);
  
  // Check for production flag
  const isProd = process.argv.includes('--prod');
  
  // Check prerequisites
  if (!checkVercelCLI()) {
    console.log(`${colors.bright}${colors.red}Vercel CLI is not installed.${colors.reset}`);
    console.log(`Run: ${colors.bright}npm install -g vercel${colors.reset}`);
    process.exit(1);
  }
  
  if (!checkVercelLogin()) {
    console.log(`${colors.bright}${colors.yellow}You are not logged in to Vercel.${colors.reset}`);
    console.log(`Run: ${colors.bright}vercel login${colors.reset}`);
    process.exit(1);
  }
  
  if (!checkMongoURI()) {
    console.log(`${colors.bright}${colors.yellow}Warning: MONGO_URI not found in .env file.${colors.reset}`);
    console.log(`Make sure to set it in Vercel environment variables.`);
    
    rl.question(`${colors.bright}Continue anyway? (y/n)${colors.reset} `, (answer) => {
      if (answer.toLowerCase() !== 'y') {
        console.log(`Deployment cancelled.`);
        process.exit(0);
      }
      rl.close();
      deployToVercel(isProd);
    });
  } else {
    deployToVercel(isProd);
    rl.close();
  }
}

// Run the main function
main().catch(error => {
  console.error(`${colors.bright}${colors.red}Error:${colors.reset}`, error);
  process.exit(1);
});