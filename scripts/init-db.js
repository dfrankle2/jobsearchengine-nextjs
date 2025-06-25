// This script initializes the database schema
// It's safe to run multiple times
const { execSync } = require('child_process');

console.log('Initializing database...');

try {
  // Generate Prisma Client
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Push schema to database
  console.log('Pushing schema to database...');
  execSync('npx prisma db push --skip-seed', { stdio: 'inherit' });
  
  console.log('Database initialization complete!');
} catch (error) {
  console.error('Database initialization failed:', error.message);
  // Don't exit with error to allow build to continue
  console.log('Continuing with build...');
}