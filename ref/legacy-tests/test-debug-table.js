import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function debugTable(orgNumber) {
  const cleanOrgNumber = orgNumber.replace(/\D/g, '');
  const url = `https://www.allabolag.se/${cleanOrgNumber}/bokslut`;

  console.log('Hämtar från:', url);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = await response.text();
    const $ = cheerio.load(html);

    // Hitta resultaträkningstabellen
    const tables = $('table');

    tables.each((i, table) => {
      const $table = $(table);
      const firstHeader = $table.find('th').first().text().trim();

      if (firstHeader === 'RESULTATRÄKNING') {
        console.log('\n=== RESULTATRÄKNING TABELL ===\n');

        // Visa alla rader i tabellen
        $table.find('tr').each((rowIndex, tr) => {
          const cells = [];

          // Hantera både th och td
          $(tr).find('th, td').each((cellIndex, cell) => {
            const text = $(cell).text().trim();
            cells.push(text || '-');
          });

          if (cells.length > 0) {
            // För rubrikraden
            if (rowIndex === 0) {
              console.log('HEADERS:', cells);
            }
            // För data-rader, visa bara de intressanta
            else if (cells[0] === 'Nettoomsättning' ||
                     cells[0] === 'Omsättning' ||
                     cells[0] === 'Årets resultat' ||
                     cells[0] === 'Rörelseresultat efter avskrivningar' ||
                     cells[0] === 'Resultat efter finansnetto') {
              console.log(`\n${cells[0]}:`);
              for (let i = 1; i < cells.length && i <= 6; i++) {
                const header = $table.find('th').eq(i).text().trim();
                if (header.includes('-')) {
                  console.log(`  ${header}: ${cells[i]}`);
                }
              }
            }
          }
        });
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

await debugTable('556954-3068');