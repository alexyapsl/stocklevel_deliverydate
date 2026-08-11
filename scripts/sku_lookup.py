#!/usr/bin/env python3
"""sku_lookup.py — Look up live stock level + shipping ETA for one or more SKUs
from the Samsung HK shop API (same source as the Stock Level Check dashboard).

Usage:
    python scripts/sku_lookup.py SM-F9760ZKPTGY [MORE_SKUS...]

Output: one block per SKU with product name (if known from data/products.json),
stock level and shipping ETA. Designed to be pasted straight into chat.
"""
import json
import sys
import urllib.request
from pathlib import Path

# Windows consoles default to cp1252 — force UTF-8 so Chinese ETA text prints cleanly
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

API_BASE = "https://p1-sms-api-cdn.shop.samsung.com/hk/servicesv2/getSimpleProductsInfo"
MAX_SKUS_PER_CALL = 4  # Samsung API hard limit
PRODUCTS_JSON = Path(__file__).resolve().parent.parent / "data" / "products.json"


def load_product_names():
    try:
        with open(PRODUCTS_JSON, encoding="utf-8") as f:
            return {p["sku"]: p["name"] for p in json.load(f)}
    except Exception:
        return {}


def fetch_batch(skus):
    params = "&".join(f"productCodes={s}" for s in skus)
    req = urllib.request.Request(
        f"{API_BASE}?{params}",
        headers={"User-Agent": "Mozilla/5.0", "Cache-Control": "no-cache"},
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    return {item["productCode"]: item for item in data.get("productDatas", [])}


def fmt_stock(item):
    raw = item.get("stockLevel")
    if raw is None:
        status = item.get("stockLevelStatusDisplay") or item.get("stockLevelStatus") or "unknown"
        return f"unknown ({status})"
    level = int(raw)
    return "OUT OF STOCK" if level == 0 else str(level)


def fmt_eta(item):
    eta = (item.get("shippingETA") or "").strip()
    if eta:
        return eta
    bo = (item.get("backOrderMessage") or "").strip()
    if bo:
        return bo
    return "—"


def main():
    skus = [s.strip().upper() for s in sys.argv[1:] if s.strip()]
    if not skus:
        print("Usage: python scripts/sku_lookup.py <SKU> [SKU...]")
        sys.exit(1)

    names = load_product_names()
    results = {}
    for i in range(0, len(skus), MAX_SKUS_PER_CALL):
        batch = skus[i : i + MAX_SKUS_PER_CALL]
        try:
            results.update(fetch_batch(batch))
        except Exception as e:
            for s in batch:
                results[s] = {"error": str(e)}

    blocks = []
    for sku in skus:
        item = results.get(sku)
        if item is None:
            blocks.append(f"{sku}\n  Not found in Samsung HK shop API")
            continue
        if "error" in item:
            blocks.append(f"{sku}\n  API error: {item['error']}")
            continue
        name = names.get(sku)
        header = f"{sku}" + (f" — {name}" if name else "")
        blocks.append(
            f"{header}\n"
            f"  Stock: {fmt_stock(item)}\n"
            f"  Shipping ETA: {fmt_eta(item)}"
        )
    print("\n\n".join(blocks))


if __name__ == "__main__":
    main()
