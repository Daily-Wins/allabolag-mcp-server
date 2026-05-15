import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function getOrgNumberFromCompanyPage(url) {
  console.log('Fetching:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Leta efter organisationsnummer på sidan
    // Vanligtvis finns det i format XXXXXX-XXXX eller 10 siffror

    // Sök i hela texten efter organisationsnummer-mönster
    const pageText = $('body').text();
    const orgNumberMatch = pageText.match(/\d{6}-\d{4}/);

    if (orgNumberMatch) {
      console.log('Hittade organisationsnummer:', orgNumberMatch[0]);
      return orgNumberMatch[0];
    }

    // Alternativ: leta i specifika element
    console.log('\nLetar efter organisationsnummer i olika element...');

    // Kolla h1, h2, span med text som innehåller siffror
    $('h1, h2, span, div').each((i, elem) => {
      const text = $(elem).text();
      const match = text.match(/\d{6}-\d{4}/);
      if (match && i < 10) { // Visa första 10 träffar
        console.log(`  Hittade i ${elem.tagName}: ${match[0]}`);
      }
    });

    // Kolla också efter meta-taggar eller strukturerad data
    const ldJson = $('script[type="application/ld+json"]').html();
    if (ldJson) {
      console.log('\nHittade strukturerad data (LD+JSON)');
      try {
        const data = JSON.parse(ldJson);
        console.log(JSON.stringify(data, null, 2).substring(0, 500));
      } catch (e) {
        console.log('Kunde inte parsa LD+JSON');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Testa med Raion AB
const raionUrl = 'https://www.allabolag.se/foretag/raion-ab/g%C3%B6teborg/konsulter/2K3YMXOI5YF3I';
await getOrgNumberFromCompanyPage(raionUrl);