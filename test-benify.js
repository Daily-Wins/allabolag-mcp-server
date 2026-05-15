import { searchCompany } from './build/scrapers.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

console.log('=== SÖKER EFTER BENIFY ===\n');

try {
  // Sök efter Benify
  const searchResults = await searchCompany('Benify');

  console.log(`Hittade ${searchResults.length} företag med namnet Benify:\n`);

  searchResults.forEach((company, index) => {
    console.log(`${index + 1}. ${company.name}`);
    console.log(`   Adress: ${company.address || 'Ingen adress i sökresultatet'}`);
    console.log(`   URL: ${company.url}\n`);
  });

  // För varje Benify-företag, hämta detaljerad adressinformation
  console.log('=== DETALJERAD KONTORSINFORMATION ===\n');

  for (const company of searchResults) {
    if (company.name.toLowerCase().includes('benify')) {
      console.log(`\n📍 ${company.name}:`);
      console.log('─'.repeat(40));

      try {
        const response = await fetch(company.url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });

        const html = await response.text();
        const $ = cheerio.load(html);

        // Leta efter organisationsnummer
        const pageText = $('body').text();
        const orgNumberMatch = pageText.match(/\d{6}-\d{4}/);
        if (orgNumberMatch) {
          console.log(`Organisationsnummer: ${orgNumberMatch[0]}`);
        }

        // Leta efter adressinformation - olika möjliga mönster
        const addressPatterns = [
          /([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ]?[a-zåäö]+)*(?:\s+\d+[A-Z]?)?)\s*,?\s*(\d{3}\s?\d{2})\s+([A-ZÅÄÖ][a-zåäö]+)/g,
          /Besöksadress[:\s]+([^\n]+)/i,
          /Postadress[:\s]+([^\n]+)/i,
          /Adress[:\s]+([^\n]+)/i
        ];

        const addresses = new Set();

        // Sök efter adresser med olika mönster
        addressPatterns.forEach(pattern => {
          const matches = pageText.match(pattern);
          if (matches) {
            matches.forEach(match => {
              // Rensa upp adressen
              const cleaned = match
                .replace(/Besöksadress[:\s]+/i, '')
                .replace(/Postadress[:\s]+/i, '')
                .replace(/Adress[:\s]+/i, '')
                .trim();

              // Lägg till om det verkar vara en riktig adress
              if (cleaned.length > 5 && cleaned.length < 100 &&
                  (cleaned.match(/\d{3}\s?\d{2}/) || cleaned.includes('gatan') ||
                   cleaned.includes('vägen') || cleaned.includes('torget'))) {
                addresses.add(cleaned);
              }
            });
          }
        });

        // Visa unika adresser
        if (addresses.size > 0) {
          console.log('Adresser:');
          Array.from(addresses).slice(0, 3).forEach(addr => {
            console.log(`  • ${addr}`);
          });
        }

        // Leta efter stad/ort information
        const cities = ['Stockholm', 'Göteborg', 'Malmö', 'Uppsala', 'Linköping',
                       'Västerås', 'Örebro', 'Helsingborg', 'Norrköping', 'Jönköping'];

        const foundCities = new Set();
        cities.forEach(city => {
          if (pageText.includes(city)) {
            foundCities.add(city);
          }
        });

        if (foundCities.size > 0) {
          console.log('Städer där företaget finns:');
          Array.from(foundCities).forEach(city => {
            console.log(`  • ${city}`);
          });
        }

        // Leta efter antal anställda
        const employeeMatch = pageText.match(/(\d+(?:\s*-\s*\d+)?)\s*anställda/i);
        if (employeeMatch) {
          console.log(`Antal anställda: ${employeeMatch[1]}`);
        }

        // Leta efter omsättning
        const revenueMatch = pageText.match(/Omsättning[:\s]+([0-9\s]+)/i);
        if (revenueMatch) {
          console.log(`Omsättning: ${revenueMatch[1].trim()} tkr`);
        }

      } catch (error) {
        console.log(`Kunde inte hämta detaljer: ${error.message}`);
      }
    }
  }

} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}