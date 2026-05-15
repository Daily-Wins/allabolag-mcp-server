import { fetchPage } from './build/utils.js';

const $ = await fetchPage('https://www.allabolag.se/5569543068');

console.log('=== Navigation Links ===');

// Test olika sätt att hitta navigeringen
const navSelectors = [
  'nav a',
  '.nav-item a',
  '.nav-link',
  '.tab-link',
  '[role="tab"]',
  'ul.nav a',
  '.tabs a'
];

const foundLinks = new Set();

for (const selector of navSelectors) {
  $(selector).each((i, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href');
    if (text && href) {
      foundLinks.add(`${text}: ${href}`);
    }
  });
}

Array.from(foundLinks).forEach(link => console.log(link));