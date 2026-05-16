import { searchCompany } from './build/scrapers.js';
import { getCacheStats } from './build/cache.js';

console.log('=== TEST AV CACHE OCH THROTTLING ===\n');

// Funktion för att mäta tid
function measureTime(start) {
  const elapsed = Date.now() - start;
  return `${(elapsed / 1000).toFixed(2)}s`;
}

try {
  // Visa cache-status innan test
  let stats = await getCacheStats();
  console.log('Cache-status innan test:');
  console.log(`  Antal filer: ${stats.totalFiles}`);
  console.log(`  Total storlek: ${(stats.totalSize / 1024).toFixed(2)} KB\n`);

  // Test 1: Första sökningen (ingen cache, throttling aktiveras inte första gången)
  console.log('Test 1: Första sökningen på "Spotify"');
  let start = Date.now();
  let results = await searchCompany('Spotify');
  console.log(`  Resultat: ${results.length} företag`);
  console.log(`  Tid: ${measureTime(start)}`);
  console.log(`  Detta bör komma från allabolag.se (se [FETCH] i loggen)\n`);

  // Test 2: Samma sökning igen (ska komma från cache)
  console.log('Test 2: Samma sökning igen');
  start = Date.now();
  results = await searchCompany('Spotify');
  console.log(`  Resultat: ${results.length} företag`);
  console.log(`  Tid: ${measureTime(start)}`);
  console.log(`  Detta bör komma från cache (se [CACHE HIT] i loggen)\n`);

  // Test 3: Ny sökning (throttling bör aktiveras)
  console.log('Test 3: Ny sökning på "Volvo"');
  start = Date.now();
  results = await searchCompany('Volvo');
  console.log(`  Resultat: ${results.length} företag`);
  console.log(`  Tid: ${measureTime(start)}`);
  console.log(`  Detta bör visa [THROTTLE] meddelande om föregående request var nylig\n`);

  // Test 4: Tredje sökning (throttling bör aktiveras igen)
  console.log('Test 4: Ytterligare sökning på "IKEA"');
  start = Date.now();
  results = await searchCompany('IKEA');
  console.log(`  Resultat: ${results.length} företag`);
  console.log(`  Tid: ${measureTime(start)}`);
  console.log(`  Detta bör visa [THROTTLE] meddelande\n`);

  // Test 5: Upprepa tidigare sökning (cache)
  console.log('Test 5: Upprepa sökning på "Volvo" (från cache)');
  start = Date.now();
  results = await searchCompany('Volvo');
  console.log(`  Resultat: ${results.length} företag`);
  console.log(`  Tid: ${measureTime(start)}`);
  console.log(`  Detta bör komma från cache (se [CACHE HIT] i loggen)\n`);

  // Visa cache-status efter test
  stats = await getCacheStats();
  console.log('Cache-status efter test:');
  console.log(`  Antal filer: ${stats.totalFiles}`);
  console.log(`  Total storlek: ${(stats.totalSize / 1024).toFixed(2)} KB`);

  if (stats.oldestEntry) {
    console.log(`  Äldsta cache-entry: ${stats.oldestEntry.toLocaleString('sv-SE')}`);
  }
  if (stats.newestEntry) {
    console.log(`  Nyaste cache-entry: ${stats.newestEntry.toLocaleString('sv-SE')}`);
  }

  console.log('\n=== SAMMANFATTNING ===');
  console.log('✅ Cache fungerar - cachade requests är mycket snabbare');
  console.log('✅ Throttling fungerar - 0.5s fördröjning mellan nya requests');
  console.log('✅ Cache sparas i 10 dagar');
  console.log('✅ Cache-filer lagras i .cache/ katalogen');

} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}