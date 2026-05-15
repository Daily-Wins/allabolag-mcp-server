import { fetchPage } from './build/utils.js';

async function test() {
  try {
    const url = 'https://www.allabolag.se/5569543068';
    console.error('Fetching:', url);
    const $ = await fetchPage(url);

    console.log('=== Page Analysis ===');
    console.log('Title:', $('title').text());
    console.log('Company name:', $('h1').first().text());

    console.log('\n=== Links found ===');
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && href.includes('5569543068') && text) {
        console.log(`${text}: ${href}`);
      }
    });

    console.log('\n=== Navigation tabs ===');
    $('.nav-link, .tab-link, [role="tab"]').each((i, el) => {
      const text = $(el).text().trim();
      const href = $(el).attr('href');
      if (text && i < 10) {
        console.log(`${text}: ${href || 'no href'}`);
      }
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

test();