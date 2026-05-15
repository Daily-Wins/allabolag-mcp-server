import { getCompanyUrls } from './build/scrapers.js';
import { fetchPage } from './build/utils.js';

const orgNumber = '556954-3068';
const urls = await getCompanyUrls(orgNumber);

console.log('URLs found:', urls);

if (urls.handelser) {
  console.log('\nFetching events from:', urls.handelser);
  const $ = await fetchPage(urls.handelser);

  // Visa sidans titel
  console.log('\nPage title:', $('title').text());

  // Visa huvudinnehåll
  console.log('\n=== Main content ===');
  const mainText = $('main').text().substring(0, 500);
  console.log(mainText);

  // Sök efter tabeller
  console.log('\n=== Tables found ===');
  $('table').each((i, el) => {
    console.log(`Table ${i + 1}:`, $(el).find('tr').length, 'rows');
    // Visa första raden
    const firstRow = $(el).find('tr').first().text().substring(0, 100);
    console.log('  First row:', firstRow);
  });

  // Sök efter listor
  console.log('\n=== Lists found ===');
  $('ul, ol').each((i, el) => {
    const items = $(el).find('li');
    if (items.length > 0) {
      console.log(`List ${i + 1}:`, items.length, 'items');
      const firstItem = items.first().text().substring(0, 100);
      console.log('  First item:', firstItem);
    }
  });
}