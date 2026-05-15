import { searchCompany, getCompanyDetails, getCompanyFinancials } from './build/scrapers.js';

console.log('Hämtar information om Raion AB...\n');

try {
  // Först söka efter Raion AB för att få URL
  const searchResults = await searchCompany('Raion AB');
  console.log('Sökresultat:', JSON.stringify(searchResults, null, 2));

  const raionAB = searchResults.find(c => c.name === 'Raion AB');

  if (raionAB) {
    // Extrahera organisationsnummer från URL eller söka på detaljsidan
    // URL-formatet verkar vara /foretag/[namn]/[stad]/[bransch]/[id]
    // Vi behöver hämta organisationsnumret från detaljsidan

    const urlParts = raionAB.url.split('/');
    const companyId = urlParts[urlParts.length - 1];

    console.log('\nFörsöker hämta detaljer baserat på URL...');
    console.log('Company ID från URL:', companyId);

    // Vi behöver först hämta detaljsidan för att få organisationsnumret
    // eftersom det inte returneras i sökresultatet

    // För nu, låt oss testa med ett hårdkodat organisationsnummer
    // eller försöka extrahera från detaljsidan
  }

} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}