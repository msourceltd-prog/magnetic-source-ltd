"""Trade Ledger product-image audit.

This is a non-destructive screening tool. It evaluates every live product image for
objective presentation risks, then creates readable contact sheets of flagged records
for human visual review. It never modifies the database.
"""
from __future__ import annotations

import io
import json
import os
import re
import shutil
from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import requests
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path("/home/ubuntu/magnetic-source-ecommerce-v2")
OUTPUT = Path("/home/ubuntu/magnetic-source-catalogue-audit-artifacts")
REPORT = ROOT / "data" / "full-catalogue-image-audit-report.json"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://pylhokxuqqbldnfjwjem.supabase.co")
PUBLIC_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq")
SESSION = requests.Session()
SESSION.headers.update({"apikey": PUBLIC_KEY, "User-Agent": "MagneticSourceCatalogueAudit/1.0"})
FONT = ImageFont.load_default()

def safe_name(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-") or "product"

def fetch_catalogue() -> list[dict]:
    url = f"{SUPABASE_URL}/rest/v1/products?select=id,slug,name,category,sku,image&order=id"
    response = SESSION.get(url, timeout=30)
    response.raise_for_status()
    return response.json()

def image_metrics(product: dict) -> dict:
    result = {"sku": product["sku"], "name": product["name"], "slug": product["slug"], "category": product["category"], "image": product.get("image") or "", "flags": [], "metrics": {}}
    if not result["image"].startswith("https://"):
        result["flags"].append("missing_or_invalid_image_url")
        return result
    try:
        response = SESSION.get(result["image"], timeout=25)
        response.raise_for_status()
        content_type = response.headers.get("content-type", "")
        if not content_type.startswith("image/"):
            result["flags"].append("non_image_response")
            return result
        image = Image.open(io.BytesIO(response.content)).convert("RGB")
    except Exception as exc:
        result["flags"].append("unreachable_image")
        result["metrics"]["error"] = str(exc)[:140]
        return result
    image.thumbnail((360, 360), Image.Resampling.LANCZOS)
    width, height = image.size
    if width < 100 or height < 100:
        result["flags"].append("low_resolution")
    data = np.asarray(image).astype(np.float32)
    luminance = 0.2126 * data[:, :, 0] + 0.7152 * data[:, :, 1] + 0.0722 * data[:, :, 2]
    border = max(3, min(width, height) // 20)
    edge = np.concatenate((luminance[:border, :].ravel(), luminance[-border:, :].ravel(), luminance[:, :border].ravel(), luminance[:, -border:].ravel()))
    edge_light_ratio = float((edge >= 225).mean())
    edge_dark_ratio = float((edge <= 105).mean())
    # Approximate a white/light backdrop based on pixel brightness and low chroma.
    chroma = data.max(axis=2) - data.min(axis=2)
    foreground = (luminance < 225) | (chroma > 26)
    ys, xs = np.where(foreground)
    occupancy = 0.0
    touches_edge = False
    if len(xs):
        x0, x1, y0, y1 = int(xs.min()), int(xs.max()), int(ys.min()), int(ys.max())
        occupancy = float(((x1 - x0 + 1) * (y1 - y0 + 1)) / (width * height))
        touches_edge = x0 <= 1 or y0 <= 1 or x1 >= width - 2 or y1 >= height - 2
    result["metrics"] = {"width": width, "height": height, "edge_light_ratio": round(edge_light_ratio, 3), "edge_dark_ratio": round(edge_dark_ratio, 3), "estimated_product_area": round(occupancy, 3), "estimated_content_touches_edge": touches_edge}
    if edge_light_ratio < 0.62:
        result["flags"].append("background_not_consistently_light")
    if edge_dark_ratio > 0.28:
        result["flags"].append("dark_or_busy_edge_background")
    if occupancy < 0.055:
        result["flags"].append("possible_excessive_empty_space")
    if touches_edge:
        result["flags"].append("possible_edge_crop")
    if result["flags"]:
        product_path = OUTPUT / "flagged" / product["category"] / f"{safe_name(product['sku'])}.jpg"
        product_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(product_path, "JPEG", quality=88)
        result["review_image"] = str(product_path)
    return result

def contact_sheets(results: list[dict]) -> list[str]:
    by_category: dict[str, list[dict]] = defaultdict(list)
    for item in results:
        if item.get("flags") and item.get("review_image"):
            by_category[item["category"]].append(item)
    output = []
    cell_w, cell_h, cols = 280, 258, 3
    for category, items in sorted(by_category.items()):
        for page_start in range(0, len(items), 12):
            page = items[page_start:page_start + 12]
            rows = (len(page) + cols - 1) // cols
            sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "#f5f1e8")
            draw = ImageDraw.Draw(sheet)
            for index, item in enumerate(page):
                x = (index % cols) * cell_w
                y = (index // cols) * cell_h
                image = Image.open(item["review_image"]).convert("RGB")
                image = ImageOps.contain(image, (cell_w - 20, 185), Image.Resampling.LANCZOS)
                frame = Image.new("RGB", (cell_w - 16, 190), "white")
                frame.paste(image, ((frame.width - image.width) // 2, (frame.height - image.height) // 2))
                sheet.paste(frame, (x + 8, y + 8))
                label = f"{item['sku']}  {item['name'][:31]}"
                flags = ", ".join(item["flags"][:2])
                draw.text((x + 8, y + 203), label, fill="#18212c", font=FONT)
                draw.text((x + 8, y + 220), flags[:44], fill="#9d5319", font=FONT)
            out = OUTPUT / "contact-sheets" / f"{safe_name(category)}-{page_start // 12 + 1}.jpg"
            out.parent.mkdir(parents=True, exist_ok=True)
            sheet.save(out, "JPEG", quality=90)
            output.append(str(out))
    return output

def main() -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    products = fetch_catalogue()
    results = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(image_metrics, product): product["sku"] for product in products}
        for future in as_completed(futures):
            results.append(future.result())
    results.sort(key=lambda item: item["sku"])
    sheets = contact_sheets(results)
    flagged = [item for item in results if item["flags"]]
    report = {
        "auditedAt": datetime.now(timezone.utc).isoformat(),
        "productCount": len(products),
        "flaggedCount": len(flagged),
        "automatedScreeningOnly": True,
        "rule": "No product is removed by this script. Flagged records require visual review against the owner’s clean light-background, fully visible, not-cropped, professionally framed product standard.",
        "categoryCounts": {category: sum(1 for product in products if product["category"] == category) for category in sorted({product["category"] for product in products})},
        "contactSheets": sheets,
        "results": results,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"productCount": len(products), "flaggedCount": len(flagged), "contactSheets": len(sheets), "reportPath": str(REPORT)}, indent=2))

if __name__ == "__main__":
    main()
