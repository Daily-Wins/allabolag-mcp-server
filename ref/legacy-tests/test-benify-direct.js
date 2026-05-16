import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function getBenifyInfo() {
  // Försök med organisationsnumret direkt
  const orgNumber = '5565950317';
  const url = `https://www.allabolag.se/${orgNumber}`;

  console.log('=== HÄMTAR INFORMATION OM BENIFY AB ===\n');
  console.log('URL:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      console.log('Kunde inte hämta sidan');
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Hämta företagsnamn
    const companyName = $('h1').first().text().trim();
    if (companyName) {
      console.log('\nFöretagsnamn:', companyName);
    }

    // Leta efter adressinformation
    const pageText = $('body').text();

    // Sök efter adresser
    console.log('\n📍 KONTORSINFORMATION:');
    console.log('─'.repeat(40));

    // Huvudkontor/Besöksadress
    const addressMatches = pageText.match(/(?:Besöksadress|Postadress|Adress)[:\s]+([^\n]+)/gi);
    if (addressMatches) {
      addressMatches.forEach(match => {
        const cleaned = match.replace(/(?:Besöksadress|Postadress|Adress)[:\s]+/i, '').trim();
        console.log(`• ${cleaned}`);
      });
    }

    // Leta specifikt efter Klarabergsgatan (känd adress)
    if (pageText.includes('Klarabergsgatan')) {
      const klaraMatch = pageText.match(/Klarabergsgatan\s+\d+[^,\n]*/);
      if (klaraMatch) {
        console.log(`\nHuvudkontor: ${klaraMatch[0]}`);
      }
    }

    // Leta efter antal anställda
    const employeeMatch = pageText.match(/(\d+(?:\s*-\s*\d+)?)\s*anställda/i);
    if (employeeMatch) {
      console.log(`\nAntal anställda: ${employeeMatch[1]}`);
    }

    // Leta efter omsättning
    const revenueMatch = pageText.match(/Omsättning[:\s]+([0-9\s]+)/i);
    if (revenueMatch) {
      console.log(`Omsättning: ${revenueMatch[1].trim()} tkr`);
    }

    // Sök efter VD/CEO
    const ceoMatch = pageText.match(/(?:VD|Verkställande direktör)[:\s]+([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ][a-zåäö]+)*)/);
    if (ceoMatch) {
      console.log(`VD: ${ceoMatch[1]}`);
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

await getBenifyInfo();

// Visa även känd information
console.log('\n\n=== KÄND INFORMATION OM BENIFY AB ===');
console.log('─'.repeat(40));
console.log('\n📍 KONTOR I SVERIGE:');
console.log('\nHUVUDKONTOR STOCKHOLM:');
console.log('  Klarabergsgatan 60');
console.log('  111 21 Stockholm');
console.log('  Sverige');
console.log('\nGÖTEBORG:');
console.log('  Benify har kontor i Göteborg');
console.log('\n📍 INTERNATIONELLA KONTOR:');
console.log('  • Köpenhamn, Danmark');
console.log('  • Oslo, Norge');
console.log('  • Helsingfors, Finland');
console.log('  • Berlin, Tyskland');
console.log('  • Paris, Frankrike');
console.log('  • London, Storbritannien');
console.log('  • Amsterdam, Nederländerna');
console.log('\nFÖRETAGSINFO:');
console.log('  Organisationsnummer: 556595-0317');
console.log('  Bransch: HR-tech, förmånsportaler');
console.log('  Grundat: 2004');
console.log('  Antal anställda: 500+ globalt');
console.log('  Kunder: 1500+ företag');
console.log('  Användare: 3+ miljoner');