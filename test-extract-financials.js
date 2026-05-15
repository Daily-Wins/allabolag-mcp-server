import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

async function extractFinancials(orgNumber) {
  const cleanOrgNumber = orgNumber.replace(/\D/g, '');
  const url = `https://www.allabolag.se/${cleanOrgNumber}/bokslut`;

  console.log('Hämtar finansiell data från:', url);

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

    // Hitta resultaträkningstabellen
    const tables = $('table');
    let resultatTable = null;

    tables.each((i, table) => {
      const $table = $(table);
      const firstHeader = $table.find('th').first().text().trim();
      if (firstHeader === 'RESULTATRÄKNING') {
        resultatTable = $table;
      }
    });

    if (!resultatTable) {
      console.log('Kunde inte hitta resultaträkningstabell');
      return;
    }

    // Extrahera år från headers
    const years = [];
    resultatTable.find('thead th').each((i, th) => {
      const text = $(th).text().trim();
      // Matcha år i format YYYY-MM
      const match = text.match(/(\d{4})-\d{2}/);
      if (match) {
        years.push({
          period: text,
          year: parseInt(match[1])
        });
      }
    });

    console.log('\nHittade perioder:', years);

    // Extrahera finansiella värden
    const financialData = [];

    // För varje år, skapa ett objekt
    years.forEach((yearInfo, index) => {
      financialData.push({
        year: yearInfo.year,
        period: yearInfo.period,
        revenue: null,
        result: null
      });
    });

    // Hitta raderna för omsättning och resultat
    resultatTable.find('tbody tr').each((i, tr) => {
      const $tr = $(tr);
      const firstCell = $tr.find('td').first().text().trim();

      if (firstCell === 'Omsättning' || firstCell === 'Nettoomsättning') {
        $tr.find('td').each((j, td) => {
          if (j > 0 && j <= years.length) {
            const value = $(td).text().trim();
            const numValue = parseInt(value.replace(/\s/g, ''));
            if (!isNaN(numValue)) {
              financialData[j - 1].revenue = numValue;
            }
          }
        });
      }

      if (firstCell === 'Årets resultat') {
        $tr.find('td').each((j, td) => {
          if (j > 0 && j <= years.length) {
            const value = $(td).text().trim();
            const numValue = parseInt(value.replace(/\s/g, '').replace('−', '-'));
            if (!isNaN(numValue)) {
              financialData[j - 1].result = numValue;
            }
          }
        });
      }
    });

    console.log('\n=== Ekonomiska uppgifter för Raion AB ===');
    financialData.forEach(data => {
      console.log(`\nPeriod: ${data.period}`);
      console.log(`  Omsättning: ${data.revenue !== null ? data.revenue.toLocaleString('sv-SE') + ' tkr' : 'Ingen data'}`);
      console.log(`  Resultat: ${data.result !== null ? data.result.toLocaleString('sv-SE') + ' tkr' : 'Ingen data'}`);
    });

    // Beräkna CAGR om vi har minst två år med omsättningsdata
    const yearsWithRevenue = financialData.filter(d => d.revenue !== null && d.revenue > 0);

    if (yearsWithRevenue.length >= 2) {
      // Sortera efter år
      yearsWithRevenue.sort((a, b) => a.year - b.year);

      const firstYear = yearsWithRevenue[0];
      const lastYear = yearsWithRevenue[yearsWithRevenue.length - 1];

      const years = lastYear.year - firstYear.year;
      const cagr = (Math.pow(lastYear.revenue / firstYear.revenue, 1 / years) - 1) * 100;

      console.log('\n=== CAGR-beräkning för omsättning ===');
      console.log(`Första året: ${firstYear.year} - ${firstYear.revenue.toLocaleString('sv-SE')} tkr`);
      console.log(`Senaste året: ${lastYear.year} - ${lastYear.revenue.toLocaleString('sv-SE')} tkr`);
      console.log(`Antal år: ${years}`);
      console.log(`\nCAGR: ${cagr.toFixed(2)}%`);

      // Visa årlig tillväxt
      console.log('\n=== Årlig tillväxt ===');
      for (let i = 1; i < yearsWithRevenue.length; i++) {
        const growth = ((yearsWithRevenue[i].revenue - yearsWithRevenue[i-1].revenue) / yearsWithRevenue[i-1].revenue) * 100;
        console.log(`${yearsWithRevenue[i-1].year} -> ${yearsWithRevenue[i].year}: ${growth.toFixed(1)}%`);
      }
    } else {
      console.log('\nKan inte beräkna CAGR - otillräcklig data');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Kör för Raion AB
await extractFinancials('556954-3068');