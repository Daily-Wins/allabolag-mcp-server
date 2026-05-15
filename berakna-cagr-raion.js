// Ekonomiska data för Raion AB (tkr)
const financialData = [
  { year: 2020, period: '2020-08', revenue: 13010, result: 970 },
  { year: 2021, period: '2021-08', revenue: 9820, result: 653 },
  { year: 2022, period: '2022-08', revenue: 13990, result: 853 },
  { year: 2023, period: '2023-12', revenue: 22264, result: 1567 },
  { year: 2024, period: '2024-12', revenue: 8899, result: -1074 }
];

console.log('=== RAION AB - EKONOMISK ANALYS ===\n');

// Visa alla års data
console.log('Ekonomisk utveckling:');
console.log('År\t\tOmsättning (tkr)\tResultat (tkr)\t\tTillväxt');
console.log('─'.repeat(70));

for (let i = 0; i < financialData.length; i++) {
  const year = financialData[i];
  let growthText = '';

  if (i > 0) {
    const growth = ((year.revenue - financialData[i-1].revenue) / financialData[i-1].revenue) * 100;
    growthText = `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`;
  }

  console.log(
    `${year.period}\t${year.revenue.toLocaleString('sv-SE')}\t\t${year.result.toLocaleString('sv-SE')}\t\t${growthText}`
  );
}

console.log('\n=== CAGR-BERÄKNING ===\n');

// CAGR för omsättning 2020-2024
const firstYear = financialData[0];
const lastYear = financialData[financialData.length - 1];
const years = lastYear.year - firstYear.year;

const cagr2020_2024 = (Math.pow(lastYear.revenue / firstYear.revenue, 1 / years) - 1) * 100;

console.log('CAGR Omsättning 2020-2024:');
console.log(`  Startvärde (2020): ${firstYear.revenue.toLocaleString('sv-SE')} tkr`);
console.log(`  Slutvärde (2024): ${lastYear.revenue.toLocaleString('sv-SE')} tkr`);
console.log(`  Antal år: ${years}`);
console.log(`  CAGR: ${cagr2020_2024.toFixed(2)}%`);

// CAGR för omsättning 2020-2023 (exklusive 2024 som är svagare)
const data2023 = financialData[3];
const years2023 = data2023.year - firstYear.year;
const cagr2020_2023 = (Math.pow(data2023.revenue / firstYear.revenue, 1 / years2023) - 1) * 100;

console.log('\nCAGR Omsättning 2020-2023:');
console.log(`  Startvärde (2020): ${firstYear.revenue.toLocaleString('sv-SE')} tkr`);
console.log(`  Slutvärde (2023): ${data2023.revenue.toLocaleString('sv-SE')} tkr`);
console.log(`  Antal år: ${years2023}`);
console.log(`  CAGR: ${cagr2020_2023.toFixed(2)}%`);

// Beräkna genomsnittlig årlig tillväxt
console.log('\n=== ÅRLIG TILLVÄXT ===\n');
let totalGrowth = 0;
let growthCount = 0;

for (let i = 1; i < financialData.length; i++) {
  const growth = ((financialData[i].revenue - financialData[i-1].revenue) / financialData[i-1].revenue) * 100;
  console.log(`${financialData[i-1].year} -> ${financialData[i].year}: ${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`);
  totalGrowth += growth;
  growthCount++;
}

const avgGrowth = totalGrowth / growthCount;
console.log(`\nGenomsnittlig årlig tillväxt: ${avgGrowth.toFixed(1)}%`);

// Analys
console.log('\n=== ANALYS ===\n');
console.log('Observationer:');
console.log('• Stark tillväxt 2022-2023 (+59.2%)');
console.log('• Kraftig nedgång 2024 (-60.0%)');
console.log('• Volatil omsättningsutveckling');
console.log('• Negativt resultat 2024 för första gången');

// Not om period
console.log('\n⚠️ OBS: Notera att räkenskapsåret ändrades från augusti till december mellan 2022 och 2023.');
console.log('Detta kan påverka jämförbarheten mellan perioderna.');