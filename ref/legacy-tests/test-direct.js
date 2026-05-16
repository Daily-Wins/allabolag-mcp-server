import { searchCompany } from './build/scrapers.js';

console.log('Testing direct search for "Spotify"...\n');

try {
  const results = await searchCompany('Spotify');
  console.log('Results:', JSON.stringify(results, null, 2));
} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}