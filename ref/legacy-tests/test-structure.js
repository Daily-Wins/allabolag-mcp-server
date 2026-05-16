import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function analyzeStructure(query) {
  const searchUrl = `https://www.allabolag.se/what/${encodeURIComponent(query)}`;
  console.log('Analyzing structure for URL:', searchUrl);

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Look for the H2 elements and their parent structure
    console.log('\n=== Analyzing H2 elements and their parents ===\n');

    $('h2').slice(0, 3).each((i, el) => {
      const $h2 = $(el);
      console.log(`\nCompany ${i+1}:`);
      console.log(`  H2 text: "${$h2.text().trim()}"`);

      // Check if H2 contains a link
      const $link = $h2.find('a');
      if ($link.length > 0) {
        console.log(`  Link href: "${$link.attr('href')}"`);
      }

      // Check parent element
      const $parent = $h2.parent();
      console.log(`  Parent tag: ${$parent.prop('tagName')}`);
      console.log(`  Parent class: "${$parent.attr('class') || 'none'}"`);

      // Check grandparent element
      const $grandparent = $parent.parent();
      console.log(`  Grandparent tag: ${$grandparent.prop('tagName')}`);
      console.log(`  Grandparent class: "${$grandparent.attr('class') || 'none'}"`);

      // Look for org number in sibling or parent elements
      const parentText = $parent.text();
      const orgNumberMatch = parentText.match(/\d{6}-\d{4}|\d{10}/);
      if (orgNumberMatch) {
        console.log(`  Org number found: ${orgNumberMatch[0]}`);
      }

      // Look for address
      const $address = $parent.find('span, div').filter((_, elem) => {
        const text = $(elem).text();
        return text.includes(',') || text.includes('Stockholm') || text.includes('Göteborg') || text.includes('Malmö');
      });
      if ($address.length > 0) {
        console.log(`  Address: "${$address.first().text().trim()}"`);
      }
    });

    // Check for any links in the H2s
    console.log('\n=== Checking for links in H2 elements ===\n');
    $('h2 a').slice(0, 5).each((i, el) => {
      console.log(`${i+1}. Text: "${$(el).text().trim()}", Href: "${$(el).attr('href')}"`);
    });

    // Check the actual div structure
    console.log('\n=== Checking DIV structure ===\n');
    const $searchResults = $('div[class*="SEARCHSTYLE"]');
    console.log(`Found ${$searchResults.length} divs with SEARCHSTYLE in class`);

    // List unique SEARCHSTYLE classes
    const searchStyleClasses = new Set();
    $searchResults.each((_, el) => {
      const classes = $(el).attr('class').split(' ');
      classes.forEach(c => {
        if (c.includes('SEARCHSTYLE')) {
          searchStyleClasses.add(c);
        }
      });
    });

    console.log('\nUnique SEARCHSTYLE classes found:');
    Array.from(searchStyleClasses).forEach(cls => {
      console.log(`  - ${cls} (count: ${$(`.${cls}`).length})`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

await analyzeStructure('Spotify');