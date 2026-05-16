import { searchCompany } from './build/scrapers.js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

console.log('=== SÖKER EFTER LOVABLE ===\n');

try {
  // Sök efter Lovable med olika varianter
  const searchTerms = ['Lovable', 'Lovable AB', 'Lovables'];

  for (const term of searchTerms) {
    console.log(`Söker efter: "${term}"`);
    console.log('─'.repeat(40));

    const searchResults = await searchCompany(term);

    if (searchResults.length === 0) {
      console.log('Inga resultat hittades\n');
      continue;
    }

    console.log(`Hittade ${searchResults.length} företag:\n`);

    for (const company of searchResults) {
      console.log(`📍 ${company.name}`);
      if (company.address) {
        console.log(`   Adress: ${company.address}`);
      }
      console.log(`   URL: ${company.url}`);

      // Hämta detaljerad information för företag som verkar vara Lovable
      if (company.name.toLowerCase().includes('lovable')) {
        console.log('\n   Hämtar detaljerad information...');

        try {
          const response = await fetch(company.url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          if (response.ok) {
            const html = await response.text();
            const $ = cheerio.load(html);
            const pageText = $('body').text();

            // Leta efter organisationsnummer
            const orgNumberMatch = pageText.match(/\d{6}-\d{4}/);
            if (orgNumberMatch) {
              console.log(`   Organisationsnummer: ${orgNumberMatch[0]}`);
            }

            // Leta efter fullständig adress
            const addressPattern = /([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ]?[a-zåäö]+)*(?:\s+\d+[A-Z]?)?)\s*,?\s*(\d{3}\s?\d{2})\s+([A-ZÅÄÖ][a-zåäö]+)/g;
            const addressMatches = pageText.match(addressPattern);

            if (addressMatches) {
              console.log('   Fullständiga adresser:');
              const uniqueAddresses = [...new Set(addressMatches)];
              uniqueAddresses.slice(0, 3).forEach(addr => {
                console.log(`     • ${addr}`);
              });
            }

            // Leta efter antal anställda
            const employeeMatch = pageText.match(/(\d+(?:\s*-\s*\d+)?)\s*anställda/i);
            if (employeeMatch) {
              console.log(`   Antal anställda: ${employeeMatch[1]}`);
            }

            // Leta efter bransch
            const industryMatch = pageText.match(/Bransch[:\s]+([^\n]+)/i);
            if (industryMatch) {
              console.log(`   Bransch: ${industryMatch[1].trim()}`);
            }
          }
        } catch (error) {
          console.log(`   Kunde inte hämta detaljer: ${error.message}`);
        }
      }
      console.log('');
    }
  }

  // Kolla också närliggande namn
  console.log('\nSöker också efter liknande namn...\n');
  const similarSearches = ['Loveable', 'Love'];

  for (const term of similarSearches) {
    const results = await searchCompany(term);
    if (results.length > 0) {
      console.log(`Resultat för "${term}":`);
      results.slice(0, 3).forEach(company => {
        console.log(`  • ${company.name} (${company.address || 'ingen adress'})`);
      });
      console.log('');
    }
  }

} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}