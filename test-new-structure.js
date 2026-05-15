import { fetchPage, normalizeOrgNumber } from './build/utils.js';

async function findCompanyUrl(orgNumber) {
  const normalized = normalizeOrgNumber(orgNumber);

  // Först, försök att hämta företaget direkt via orgnummer
  const $ = await fetchPage(`https://www.allabolag.se/${normalized}`);

  // Hitta korrekta URL:er från navigationen
  const urls = {
    base: null,
    bokslut: null,
    nyckeltal: null,
    befattningar: null,
    organisation: null,
    handelser: null
  };

  // Hitta navigations-länkar
  $('.nav-link, .tab-link, [role="tab"] a').each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const text = $el.text().trim().toLowerCase();

    if (!href) return;

    if (text.includes('översikt')) {
      urls.base = 'https://www.allabolag.se' + href;
    } else if (text.includes('bokslut')) {
      urls.bokslut = 'https://www.allabolag.se' + href;
    } else if (text.includes('nyckeltal')) {
      urls.nyckeltal = 'https://www.allabolag.se' + href;
    } else if (text.includes('befattning')) {
      urls.befattningar = 'https://www.allabolag.se' + href;
    } else if (text.includes('organisation')) {
      urls.organisation = 'https://www.allabolag.se' + href;
    } else if (text.includes('händelse')) {
      urls.handelser = 'https://www.allabolag.se' + href;
    }
  });

  return urls;
}

async function testEvents(orgNumber) {
  const urls = await findCompanyUrl(orgNumber);
  console.log('URLs found:', urls);

  if (urls.handelser) {
    console.log('\nFetching events from:', urls.handelser);
    const $ = await fetchPage(urls.handelser);

    console.log('\nSearching for events...');

    // Försök olika selektorer
    const selectors = [
      '.event-item',
      '.timeline-item',
      '.history-item',
      '.handelse',
      'table tr',
      '.table-row',
      '[class*="event"]',
      '[class*="timeline"]'
    ];

    for (const selector of selectors) {
      const found = $(selector).length;
      if (found > 0) {
        console.log(`Found ${found} elements with selector: ${selector}`);
        $(selector).first().each((i, el) => {
          console.log('  Sample content:', $(el).text().substring(0, 100));
        });
      }
    }

    // Visa all text på sidan för debugging
    console.log('\n=== Main content text ===');
    const mainContent = $('main, .main-content, .content, [role="main"]').text().substring(0, 500);
    console.log(mainContent);
  }
}

// Test med Raion AB
testEvents('556954-3068').catch(console.error);