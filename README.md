# Stock Level Check

Internal tool to check live stock levels and shipping ETAs from Samsung HK shop API.

## Features
- Password-protected (preset: `samsunghk2026`)
- Clean table showing SKU, Product Name, Stock Level, Shipping ETA
- Manual refresh button (no auto-refresh)
- Batch API calls (max 4 SKUs per call — Samsung API hard limit)
- 100% static — works on GitHub Pages

## Project Structure
```
stocklevelcheck/
├── index.html
├── data/
│   └── products.json
├── test-api.js
└── README.md
```

## Deployment (GitHub Pages)

1. Push this repo to `https://github.ecodesamsung.com/alex-yap/stocklevelcheck`
2. Go to **Settings → Pages**
3. Set Source to **Deploy from a branch** → `main` /root
4. The site will be live at: `https://alex-yap.github.ecodesamsung.com/stocklevelcheck`

## Local Testing

**Do NOT open `index.html` directly** (file:// URLs block fetch requests due to CORS).

Instead, run a local HTTP server:

```bash
# Option 1: Using npx (recommended if you have Node.js)
npx serve .

# Option 2: Using Python
python -m http.server 8000
```

Then open: `http://localhost:3000` (or `http://localhost:8000` for Python).

Once running, enter password `samsunghk2026` to access the dashboard.

For API testing outside the browser:
```bash
node test-api.js
```

## Notes
- All data is fetched client-side → no server required
- The password check is client-side only (light gate, not security)
- API source: `https://shop.samsung.com/hk/servicesv2/getSimpleProductsInfo`

--- 
Built for internal Samsung HK operations.