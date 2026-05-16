import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function debugFinancials(orgNumber) {
  const cleanOrgNumber = orgNumber.replace(/\D/g, '');
  const url = `https://www.allabolag.se/${cleanOrgNumber}/bokslut`;

  console.log('Fetching financial data from:', url);

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

    console.log('\n=== Letar efter tabeller med ekonomisk data ===');

    // Leta efter tabeller
    const tables = $('table');
    console.log(`Hittade ${tables.length} tabeller på sidan`);

    // Kolla varje tabell
    tables.each((i, table) => {
      const $table = $(table);
      console.log(`\nTabell ${i + 1}:`);

      // Kolla headers
      const headers = [];
      $table.find('th').each((j, th) => {
        headers.push($(th).text().trim());
      });

      if (headers.length > 0) {
        console.log('Headers:', headers);
      }

      // Visa första raden med data
      const firstRow = $table.find('tbody tr').first();
      if (firstRow.length > 0) {
        const cells = [];
        firstRow.find('td').each((j, td) => {
          cells.push($(td).text().trim());
        });
        console.log('Första raden:', cells);
      }
    });

    // Leta efter divs med finansiell information
    console.log('\n=== Letar efter nyckeltal ===');

    // Leta efter element som innehåller "Omsättning", "Resultat", etc.
    $('div, span').each((i, elem) => {
      const text = $(elem).text();
      if (text.includes('Omsättning') || text.includes('Resultat') || text.includes('tkr')) {
        if (i < 20) { // Visa första 20 träffar
          const shortText = text.trim().substring(0, 100);
          console.log(`- ${shortText}${text.length > 100 ? '...' : ''}`);
        }
      }
    });

    // Leta specifikt efter årtal och belopp
    console.log('\n=== Letar efter årtal (2019-2024) ===');
    for (let year = 2019; year <= 2024; year++) {
      const yearElements = $(`*:contains(${year})`).filter((i, elem) => {
        const text = $(elem).text();
        return text.includes(year.toString()) && (text.includes('tkr') || text.includes('Omsättning') || text.includes('Resultat'));
      });

      if (yearElements.length > 0 && yearElements.length < 10) {
        console.log(`\nÅr ${year}:`);
        yearElements.slice(0, 3).each((i, elem) => {
          console.log(`  - ${$(elem).text().trim().substring(0, 100)}`);
        });
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Testa med Raion AB
await debugFinancials('556954-3068');