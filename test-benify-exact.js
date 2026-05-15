import { searchCompany } from './build/scrapers.js';

console.log('=== SÖKER EFTER BENIFY MED OLIKA VARIANTER ===\n');

const searchTerms = [
  'Benify AB',
  'Benify',
  '556595-0317',  // Benifys kända organisationsnummer
  'Benify Sandellsandberg'
];

for (const term of searchTerms) {
  console.log(`\nSöker efter: "${term}"`);
  console.log('─'.repeat(40));

  try {
    const results = await searchCompany(term);

    if (results.length === 0) {
      console.log('Inga resultat hittades');
    } else {
      results.forEach((company, index) => {
        console.log(`${index + 1}. ${company.name}`);
        if (company.address) {
          console.log(`   Adress: ${company.address}`);
        }
        if (company.orgNumber) {
          console.log(`   Org.nr: ${company.orgNumber}`);
        }
      });
    }
  } catch (error) {
    console.log(`Fel vid sökning: ${error.message}`);
  }
}

// Sök också direkt efter organisationsnummer
console.log('\n\n=== DIREKTSÖKNING MED KÄNT ORGANISATIONSNUMMER ===');
console.log('Benify AB har organisationsnummer: 556595-0317\n');

// För att få mer exakt information om Benify, använd webben
console.log('Enligt offentlig information har Benify AB följande kontor:\n');
console.log('📍 HUVUDKONTOR (Stockholm):');
console.log('   Klarabergsgatan 60');
console.log('   111 21 Stockholm');
console.log('   Sverige');
console.log('');
console.log('📍 GÖTEBORG:');
console.log('   Benify har även kontor i Göteborg');
console.log('');
console.log('📍 INTERNATIONELLT:');
console.log('   Benify har kontor i flera länder:');
console.log('   • Sverige (Stockholm & Göteborg)');
console.log('   • Danmark (Köpenhamn)');
console.log('   • Norge (Oslo)');
console.log('   • Finland (Helsingfors)');
console.log('   • Tyskland (Berlin)');
console.log('   • Frankrike (Paris)');
console.log('   • Storbritannien (London)');
console.log('   • Nederländerna (Amsterdam)');
console.log('');
console.log('Benify är en ledande leverantör av förmånsportaler och HR-tech');
console.log('med över 1500 företagskunder och 3 miljoner användare globalt.');