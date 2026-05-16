import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function debugSearch(query) {
  const searchUrl = `https://www.allabolag.se/what/${encodeURIComponent(query)}`;
  console.log('Fetching URL:', searchUrl);

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers.raw());

    const html = await response.text();
    console.log('\nHTML length:', html.length);
    console.log('\nFirst 1000 characters of HTML:');
    console.log(html.substring(0, 1000));

    const $ = cheerio.load(html);

    // Check for various potential selectors
    console.log('\n--- Checking various selectors ---');
    console.log('.search-hit count:', $('.search-hit').length);
    console.log('.company-row count:', $('.company-row').length);
    console.log('.search-result-item count:', $('.search-result-item').length);
    console.log('article count:', $('article').length);
    console.log('.company-card count:', $('.company-card').length);

    // Look for any links that might contain company info
    console.log('\nLinks containing "/5" (typical company URL pattern):');
    $('a[href*="/5"]').each((i, el) => {
      if (i < 5) {  // Just show first 5
        console.log(`  - Text: "${$(el).text().trim()}", Href: "${$(el).attr('href')}"`);
      }
    });

    // Check for any h2 or h3 tags
    console.log('\nH2 tags:', $('h2').length);
    console.log('\nH3 tags:', $('h3').length);

    // Show first few h2/h3 contents
    console.log('\nFirst few H2 contents:');
    $('h2').slice(0, 3).each((i, el) => {
      console.log(`  ${i+1}. "${$(el).text().trim()}"`);
    });

    console.log('\nFirst few H3 contents:');
    $('h3').slice(0, 3).each((i, el) => {
      console.log(`  ${i+1}. "${$(el).text().trim()}"`);
    });

    // Look for divs with class containing 'company' or 'result'
    console.log('\nDivs with class containing "company":');
    $('div[class*="company"]').slice(0, 3).each((i, el) => {
      console.log(`  ${i+1}. Class: "${$(el).attr('class')}", Text: "${$(el).text().trim().substring(0, 100)}..."`);
    });

    console.log('\nDivs with class containing "result":');
    $('div[class*="result"]').slice(0, 3).each((i, el) => {
      console.log(`  ${i+1}. Class: "${$(el).attr('class')}", Text: "${$(el).text().trim().substring(0, 100)}..."`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Test with Spotify
await debugSearch('Spotify');