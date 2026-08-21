"""Owner-defined strict product canvas-edge audit.

The owner requires visible white space between the actual product and every image-canvas
edge. This screening script is intentionally non-destructive: it records exact touched
edges and produces contact sheets for manual confirmation before any database record is
considered for permanent removal.
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
OUTPUT = Path("/home/ubuntu/magnetic-source-strict-edge-audit-artifacts")
REPORT = ROOT / "data" / "strict-canvas-edge-audit-report.json"
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://pylhokxuqqbldnfjwjem.supabase.co")
PUBLIC_KEY = os.environ.get("VITE_SUPABASE_ANON_KEY", "sb_publishable_ps9YypvtK5jByJ37N6LZzw_oanbTDgq")
FONT = ImageFont.load_default()


def safe_name(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-") or "product"


def fetch_catalogue() -> list[dict]:
    response = requests.get(
        f"{SUPABASE_URL}/rest/v1/products?select=id,slug,name,category,sku,image&order=id",
        headers={"apikey": PUBLIC_KEY, "User-Agent": "MagneticSourceStrictEdgeAudit/1.0"},
        timeout=30,
    )
    response.raise_for_status()
    return response.json()


def inspect_product(product: dict) -> dict:
    result = {"sku": product["sku"], "name": product["name"], "slug": product["slug"], "category": product["category"], "image": product.get("image") or "", "status": "keep", "reasons": [], "touches": [], "metrics": {}}
    if not result["image"].startswith("https://"):
        result["status"] = "review"
        result["reasons"].append("missing_or_invalid_image_url")
        return result
    try:
        response = requests.get(result["image"], headers={"User-Agent": "MagneticSourceStrictEdgeAudit/1.0"}, timeout=(5, 8))
        response.raise_for_status()
        if not response.headers.get("content-type", "").startswith("image/"):
            raise ValueError("response was not an image")
        raw = Image.open(io.BytesIO(response.content)).convert("RGBA")
    except Exception as exc:
        result["status"] = "review"
        result["reasons"].append("unreachable_or_invalid_image")
        result["metrics"]["error"] = str(exc)[:140]
        return result

    raw.thumbnail((900, 900), Image.Resampling.LANCZOS)
    alpha = np.asarray(raw.getchannel("A"), dtype=np.uint8)
    rgb = np.asarray(Image.alpha_composite(Image.new("RGBA", raw.size, "white"), raw).convert("RGB"), dtype=np.float32)
    height, width = alpha.shape
    luminance = 0.2126 * rgb[:, :, 0] + 0.7152 * rgb[:, :, 1] + 0.0722 * rgb[:, :, 2]
    chroma = rgb.max(axis=2) - rgb.min(axis=2)
    # Transparent PNGs provide an exact actual-product mask. For opaque images,
    # coloured/dark pixels identify the product or unsuitable non-white canvas.
    has_transparent_canvas = bool((alpha < 250).any())
    if has_transparent_canvas:
        object_mask = alpha > 16
    else:
        object_mask = (luminance < 245) | (chroma > 18)
    white_space = (luminance >= 245) & (chroma <= 18) & (alpha >= 250)
    edges = {
        "top": object_mask[0, :],
        "bottom": object_mask[-1, :],
        "left": object_mask[:, 0],
        "right": object_mask[:, -1],
    }
    white_edges = {
        "top": white_space[0, :],
        "bottom": white_space[-1, :],
        "left": white_space[:, 0],
        "right": white_space[:, -1],
    }
    touches = [side for side, values in edges.items() if bool(values.any())]
    white_ratios = {side: round(float(values.mean()), 4) for side, values in white_edges.items()}
    nonwhite_canvas_edges = [side for side, ratio in white_ratios.items() if ratio < 0.98]
    result["metrics"] = {
        "width": width,
        "height": height,
        "transparent_canvas_detected": has_transparent_canvas,
        "white_edge_ratios": white_ratios,
        "edge_object_pixel_counts": {side: int(values.sum()) for side, values in edges.items()},
    }
    result["touches"] = touches
    if touches:
        result["status"] = "review"
        result["reasons"].append("actual_product_or_nonwhite_content_touches_canvas_edge")
    if nonwhite_canvas_edges:
        result["status"] = "review"
        result["reasons"].append("visible_white_space_not_present_on_all_canvas_edges")
        result["nonwhite_canvas_edges"] = nonwhite_canvas_edges
    if result["status"] == "review":
        review_path = OUTPUT / "flagged" / product["category"] / f"{safe_name(product['sku'])}.png"
        review_path.parent.mkdir(parents=True, exist_ok=True)
        raw.convert("RGB").save(review_path, "PNG")
        result["review_image"] = str(review_path)
    return result


def contact_sheets(results: list[dict]) -> list[str]:
    by_category: dict[str, list[dict]] = defaultdict(list)
    for item in results:
        if item["status"] == "review" and item.get("review_image"):
            by_category[item["category"]].append(item)
    outputs = []
    cell_w, cell_h, columns = 300, 270, 3
    for category, items in sorted(by_category.items()):
        for start in range(0, len(items), 12):
            page = items[start:start + 12]
            rows = (len(page) + columns - 1) // columns
            sheet = Image.new("RGB", (columns * cell_w, rows * cell_h), "#f4f1ea")
            draw = ImageDraw.Draw(sheet)
            for index, item in enumerate(page):
                x, y = (index % columns) * cell_w, (index // columns) * cell_h
                image = Image.open(item["review_image"]).convert("RGB")
                image = ImageOps.contain(image, (cell_w - 20, 188), Image.Resampling.LANCZOS)
                frame = Image.new("RGB", (cell_w - 16, 194), "white")
                frame.paste(image, ((frame.width - image.width) // 2, (frame.height - image.height) // 2))
                marker = ImageDraw.Draw(frame)
                edge_map = {"top": ((0, 0), (frame.width - 1, 0)), "bottom": ((0, frame.height - 1), (frame.width - 1, frame.height - 1)), "left": ((0, 0), (0, frame.height - 1)), "right": ((frame.width - 1, 0), (frame.width - 1, frame.height - 1))}
                for edge in set(item.get("touches", [])) | set(item.get("nonwhite_canvas_edges", [])):
                    marker.line(edge_map[edge], fill="#c92828", width=3)
                sheet.paste(frame, (x + 8, y + 8))
                draw.text((x + 8, y + 208), f"{item['sku']}  {item['name'][:34]}", fill="#18212c", font=FONT)
                draw.text((x + 8, y + 226), f"touch: {', '.join(item.get('touches', [])) or 'white-edge'}", fill="#b11f1f", font=FONT)
            out = OUTPUT / "contact-sheets" / f"{safe_name(category)}-{start // 12 + 1}.jpg"
            out.parent.mkdir(parents=True, exist_ok=True)
            sheet.save(out, "JPEG", quality=90)
            outputs.append(str(out))
    return outputs


def main() -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    products = fetch_catalogue()
    results = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(inspect_product, product): product["sku"] for product in products}
        for future in as_completed(futures):
            results.append(future.result())
    results.sort(key=lambda item: item["sku"])
    sheets = contact_sheets(results)
    flagged = [item for item in results if item["status"] == "review"]
    report = {
        "auditedAt": datetime.now(timezone.utc).isoformat(),
        "productCount": len(products),
        "flaggedCount": len(flagged),
        "rule": "Keep only if the actual product/object has visible white space to every image-canvas edge. Any product or non-white content touching top, bottom, left, or right canvas edge requires manual review before permanent deletion.",
        "automatedScreeningOnly": True,
        "contactSheets": sheets,
        "results": results,
    }
    REPORT.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"productCount": len(products), "flaggedCount": len(flagged), "contactSheets": len(sheets), "reportPath": str(REPORT)}, indent=2))


if __name__ == "__main__":
    main()
