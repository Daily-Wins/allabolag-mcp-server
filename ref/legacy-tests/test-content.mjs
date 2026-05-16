import { getCompanyUrls } from './build/scrapers.js';
import { fetchPage } from './build/utils.js';

const orgNumber = '556954-3068';
const urls = await getCompanyUrls(orgNumber);

// Test organisation (för ägare)
if (urls.organisation) {
  console.log('\n=== ORGANISATION PAGE ===');
  console.log('URL:', urls.organisation);
  const $ = await fetchPage(urls.organisation);

  // Hitta allt som kan vara ägarinformation
  const possibleOwnerSelectors = [
    '.owner', '.agare', '.shareholder', '.mother-company', '.subsidiary',
    '[class*="owner"]', '[class*="agare"]', '[class*="koncern"]',
    'h2:contains("Äg"), h3:contains("Äg"), h2:contains("Moder"), h3:contains("Dotter")'
  ];

  for (const selector of possibleOwnerSelectors) {
    const found = $(selector);
    if (found.length > 0) {
      console.log(`Found with ${selector}:`, found.length);
      found.each((i, el) => {
        if (i < 3) console.log('  -', $(el).text().substring(0, 100));
      });
    }
  }

  // Kolla efter koncernstruktur
  console.log('\n=== Koncerninfo ===');
  $('section, div').each((i, el) => {
    const text = $(el).text();
    if (text.includes('Moderbolag') || text.includes('Dotterbolag') || text.includes('Koncern') || text.includes('Del av')) {
      console.log('Found:', text.substring(0, 200));
      return false; // Avbryt efter första träffen
    }
  });
}

// Test händelser
if (urls.handelser) {
  console.log('\n=== HÄNDELSER PAGE ===');
  console.log('URL:', urls.handelser);
  const $ = await fetchPage(urls.handelser);

  // Kolla om det finns någon text om att inga händelser finns
  const pageText = $('body').text();
  if (pageText.includes('inga händelser') || pageText.includes('Inga händelser')) {
    console.log('Sidan säger att inga händelser finns');
  }

  // Sök efter alla möjliga händelse-element
  const eventSelectors = [
    '.event', '.timeline', '.history', '.handelse',
    '[class*="event"]', '[class*="timeline"]', '[class*="history"]',
    'article', '.card', '.list-item'
  ];

  for (const selector of eventSelectors) {
    const found = $(selector);
    if (found.length > 0) {
      console.log(`Found with ${selector}:`, found.length);
      found.each((i, el) => {
        if (i < 2) {
          const text = $(el).text().trim();
          if (text.length > 10) {
            console.log('  Content:', text.substring(0, 150));
          }
        }
      });
    }
  }
}

// Test befattningar
if (urls.befattningar) {
  console.log('\n=== BEFATTNINGAR PAGE ===');
  console.log('URL:', urls.befattningar);
  const $ = await fetchPage(urls.befattningar);

  // Sök efter personer
  const personSelectors = [
    '.person', '.official', '.befattning',
    '[class*="person"]', '[class*="official"]', '[class*="befattning"]',
    'table tr', '.card', '.list-item'
  ];

  for (const selector of personSelectors) {
    const found = $(selector);
    if (found.length > 0 && found.text().length > 10) {
      console.log(`Found with ${selector}:`, found.length);
      found.each((i, el) => {
        if (i < 2) {
          const text = $(el).text().trim();
          if (text.length > 10 && !text.includes('Befattningar') && !text.includes('Översikt')) {
            console.log('  Person:', text.substring(0, 150));
          }
        }
      });
      break; // Avbryt efter första fungerande selektor
    }
  }
}