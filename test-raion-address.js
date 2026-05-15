import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function getCompanyAddress(orgNumber) {
  const cleanOrgNumber = orgNumber.replace(/\D/g, '');
  const url = `https://www.allabolag.se/${cleanOrgNumber}`;

  console.log('Hämtar adressinformation från:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      console.log('Response status:', response.status);
      return;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    console.log('\n=== RAION AB - KONTORSINFORMATION ===\n');

    // Leta efter adressinformation
    // Vanligtvis finns detta i en sektion med adressuppgifter

    // Sök efter "Besöksadress", "Postadress" etc.
    $('h2, h3, h4').each((i, elem) => {
      const heading = $(elem).text().trim();
      if (heading.includes('adress') || heading.includes('Adress')) {
        console.log(`${heading}:`);
        const nextElement = $(elem).next();
        if (nextElement.length) {
          console.log(`  ${nextElement.text().trim()}\n`);
        }
      }
    });

    // Leta efter adress i div eller span element
    $('div, span').each((i, elem) => {
      const text = $(elem).text().trim();
      if (text.includes('Besöksadress:') || text.includes('Postadress:')) {
        console.log(text.replace(/\s+/g, ' '));
      }
    });

    // Sök efter strukturerad adressdata
    const addressElements = $('address, [itemprop="address"], .address, .company-address');
    if (addressElements.length > 0) {
      console.log('Adressinformation:');
      addressElements.each((i, elem) => {
        console.log(`  ${$(elem).text().trim().replace(/\s+/g, ' ')}`);
      });
    }

    // Leta efter Google Maps länkar eller koordinater
    const mapLinks = $('a[href*="maps"], a[href*="google.com/maps"]');
    if (mapLinks.length > 0) {
      console.log('\nKartlänk hittad:');
      mapLinks.each((i, elem) => {
        if (i < 2) { // Visa max 2 länkar
          console.log(`  ${$(elem).attr('href')}`);
        }
      });
    }

    // Leta efter kontaktsektion
    const contactInfo = $('.contact, .kontakt, [class*="contact"]');
    if (contactInfo.length > 0) {
      console.log('\nKontaktinformation:');
      contactInfo.slice(0, 2).each((i, elem) => {
        const text = $(elem).text().trim().replace(/\s+/g, ' ');
        if (text.length < 200) { // Visa bara kortare text
          console.log(`  ${text}`);
        }
      });
    }

    // Specifik sökning efter gata, postnummer, ort
    const pageText = $('body').text();

    // Sök efter typiska Göteborgsadresser
    const addressPattern = /([A-ZÅÄÖ][a-zåäö]+(?:\s+[A-ZÅÄÖ]?[a-zåäö]+)*\s+\d+[A-Z]?)\s*,?\s*(\d{3}\s?\d{2})\s+([A-ZÅÄÖ][a-zåäö]+)/g;
    const matches = pageText.match(addressPattern);

    if (matches) {
      console.log('\nMöjliga adresser:');
      const uniqueAddresses = [...new Set(matches)];
      uniqueAddresses.slice(0, 3).forEach(addr => {
        console.log(`  ${addr}`);
      });
    }

    // Leta efter Göteborg-specifik information
    if (pageText.includes('Göteborg')) {
      const gothenburgContext = pageText.match(/.{0,50}Göteborg.{0,50}/g);
      if (gothenburgContext) {
        console.log('\nGöteborg omnämns:');
        [...new Set(gothenburgContext)].slice(0, 3).forEach(context => {
          console.log(`  ...${context.trim()}...`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Hämta adress för Raion AB
await getCompanyAddress('556954-3068');