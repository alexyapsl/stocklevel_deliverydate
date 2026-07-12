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
 * Parse CSV line properly.
 * Google Sheets exports " inside a field as "".
 * We convert "" → " during parsing.
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let insideQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // CSV escaped quote: "" → single "
        current += '"';
        i += 2;
        continue;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
    i++;
  }

  result.push(current);
  return result.map(s => s.trim());
}

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const dataLines = lines.slice(1); // skip header

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

    const json = JSON.stringify(products, null, 2);
    fs.writeFileSync(OUTPUT_PATH, json, 'utf8');

    console.log(`Successfully wrote ${products.length} products to data/products.json`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();