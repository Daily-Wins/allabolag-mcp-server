import { getCompanyDetails, getCompanyFinancials } from './build/scrapers.js';

const orgNumber = '556954-3068';

console.log('Hämtar ekonomiska data för Raion AB (556954-3068)...\n');

try {
  // Hämta grundläggande detaljer
  console.log('=== Företagsdetaljer ===');
  const details = await getCompanyDetails(orgNumber);
  console.log(JSON.stringify(details, null, 2));

  // Hämta ekonomiska uppgifter
  console.log('\n=== Ekonomiska uppgifter ===');
  const financials = await getCompanyFinancials(orgNumber);
  console.log(JSON.stringify(financials, null, 2));

  // Om vi har finansiella data, beräkna CAGR
  if (financials && financials.length > 1) {
    console.log('\n=== CAGR-beräkning ===');

    // Sortera efter år
    const sortedYears = financials.sort((a, b) => a.year - b.year);
    const firstYear = sortedYears[0];
    const lastYear = sortedYears[sortedYears.length - 1];

    console.log(`Första året med data: ${firstYear.year}`);
    console.log(`Senaste året med data: ${lastYear.year}`);

    // Beräkna CAGR för omsättning
    if (firstYear.revenue && lastYear.revenue) {
      const years = lastYear.year - firstYear.year;
      const cagr = (Math.pow(lastYear.revenue / firstYear.revenue, 1 / years) - 1) * 100;

      console.log(`\nOmsättning ${firstYear.year}: ${firstYear.revenue} tkr`);
      console.log(`Omsättning ${lastYear.year}: ${lastYear.revenue} tkr`);
      console.log(`CAGR Omsättning: ${cagr.toFixed(2)}%`);
    }

    // Visa alla års data
    console.log('\n=== Årlig utveckling ===');
    sortedYears.forEach(year => {
      console.log(`År ${year.year}: Omsättning ${year.revenue || 'N/A'} tkr, Resultat ${year.result || 'N/A'} tkr`);
    });
  }

} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}