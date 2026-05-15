import { searchCompany } from './build/scrapers.js';

console.log('Testing direct search for "Raion"...\n');

try {
  const results = await searchCompany('Raion');
  console.log('Results:', JSON.stringify(results, null, 2));

  if (results.length === 0) {
    console.log('\nNo companies found with "Raion" in the name.');
  }
} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}