const https = require('https');
const fs = require('fs');
const path = require('path');

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1T4JhPFdWBoSxrBQ2LnPS6CM6h9mPPe4CLgUs2_ea1GU/gviz/tq?tqx=out:csv&gid=0';
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'products.json');

function fetchSheet() {
  return new Promise((resolve, reject) => {
    https.get(SHEET_URL, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * A simple but robust CSV line parser.
 * It correctly handles fields enclosed in double quotes,
 * and converts the CSV escaped quote (two double quotes "") into a single double quote character (").
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        // This is an escaped quote ("")
        current += '"';
        i += 2;
        continue;
      }
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
    i++;
  }
  result.push(current);
  return result.map(field => field.trim());
}

function parseCSV(csvContent) {
  const lines = csvContent.trim().split(/\r?\n/);
  const dataLines = lines.slice(1); // Skip header row

  const products = [];
  for (const line of dataLines) {
    if (!line.trim()) continue;
    const fields = parseCSVLine(line);
    const sku = fields[0];
    const name = fields[1];
    if (sku && name) {
      products.push({ sku, name });
    }
  }
  return products;
}

async function main() {
  try {
    console.log('Fetching Google Sheet...');
    const csv = await fetchSheet();

    console.log('Parsing data...');
    const products = parseCSV(csv);

    console.log(`Found ${products.length} products`);

    const jsonContent = JSON.stringify(products, null, 2);
    fs.writeFileSync(OUTPUT_PATH, jsonContent, 'utf8');

    console.log(`Successfully wrote ${products.length} products to ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();