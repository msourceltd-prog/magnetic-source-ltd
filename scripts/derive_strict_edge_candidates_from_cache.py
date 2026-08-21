"""Derive strict image-canvas edge candidates from the completed local 322-image audit.

The prior audit retained local copies of every source image that had any presentation
risk. This tool re-evaluates those local images against the owner's exact four-sided
white-space rule without making new supplier requests. It is non-destructive.
"""
from __future__ import annotations

import json
import re
import shutil
from collections import defaultdict
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path("/home/ubuntu/magnetic-source-ecommerce-v2")
SOURCE_REPORT = ROOT / "data" / "full-catalogue-image-audit-report.json"
OUTPUT = Path("/home/ubuntu/magnetic-source-strict-edge-cache-audit-artifacts")
REPORT = ROOT / "data" / "strict-canvas-edge-audit-report.json"
FONT = ImageFont.load_default()


def safe_name(value: str) -> str:
    return re.sub(r"[^a-zA-Z0-9_-]+", "-", value).strip("-") or "product"


def analyze(item: dict) -> dict:
    result = {key: item[key] for key in ("sku", "name", "slug", "category", "image")}
    result.update({"status": "keep", "touches": [], "nonwhite_canvas_edges": [], "metrics": {}})
    path = Path(item.get("review_image", ""))
    if not path.exists() and "full-catalogue-image-audit" in path.parts:
        marker = path.parts.index("full-catalogue-image-audit")
        path = Path("/home/ubuntu/magnetic-source-catalogue-audit-artifacts").joinpath(*path.parts[marker + 1:])
    if not path.exists():
        result.update({"status": "review", "reasons": ["cached_source_image_unavailable"]})
        return result
    image = Image.open(path).convert("RGB")
    image.thumbnail((900, 900), Image.Resampling.LANCZOS)
    data = np.asarray(image).astype(np.float32)
    height, width = data.shape[:2]
    luminance = 0.2126 * data[:, :, 0] + 0.7152 * data[:, :, 1] + 0.0722 * data[:, :, 2]
    chroma = data.max(axis=2) - data.min(axis=2)
    object_mask = (luminance < 245) | (chroma > 18)
    white_space = (luminance >= 245) & (chroma <= 18)
    edge_masks = {"top": object_mask[0, :], "bottom": object_mask[-1, :], "left": object_mask[:, 0], "right": object_mask[:, -1]}
    edge_white = {"top": white_space[0, :], "bottom": white_space[-1, :], "left": white_space[:, 0], "right": white_space[:, -1]}
    touches = [side for side, values in edge_masks.items() if bool(values.any())]
    white_ratios = {side: round(float(values.mean()), 4) for side, values in edge_white.items()}
    nonwhite = [side for side, ratio in white_ratios.items() if ratio < 0.98]
    result["touches"] = touches
    result["nonwhite_canvas_edges"] = nonwhite
    result["metrics"] = {"width": width, "height": height, "white_edge_ratios": white_ratios, "edge_object_pixel_counts": {side: int(values.sum()) for side, values in edge_masks.items()}}
    if touches or nonwhite:
        result["status"] = "review"
        result["reasons"] = ["actual_product_or_nonwhite_content_touches_canvas_edge" if touches else "", "visible_white_space_not_present_on_all_canvas_edges" if nonwhite else ""]
        result["reasons"] = [reason for reason in result["reasons"] if reason]
        review_path = OUTPUT / "flagged" / item["category"] / f"{safe_name(item['sku'])}.png"
        review_path.parent.mkdir(parents=True, exist_ok=True)
        image.save(review_path, "PNG")
        result["review_image"] = str(review_path)
    return result


def sheets(results: list[dict]) -> list[str]:
    grouped: dict[str, list[dict]] = defaultdict(list)
    for item in results:
        if item["status"] == "review" and item.get("review_image"):
            grouped[item["category"]].append(item)
    output = []
    cell_w, cell_h, cols = 300, 270, 3
    for category, items in sorted(grouped.items()):
        for start in range(0, len(items), 12):
            page = items[start:start + 12]
            rows = (len(page) + cols - 1) // cols
            sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "#f4f1ea")
            draw = ImageDraw.Draw(sheet)
            for index, item in enumerate(page):
                x, y = (index % cols) * cell_w, (index // cols) * cell_h
                image = Image.open(item["review_image"]).convert("RGB")
                image = ImageOps.contain(image, (cell_w - 20, 188), Image.Resampling.LANCZOS)
                frame = Image.new("RGB", (cell_w - 16, 194), "white")
                frame.paste(image, ((frame.width - image.width) // 2, (frame.height - image.height) // 2))
                mark = ImageDraw.Draw(frame)
                edge_map = {"top": ((0, 0), (frame.width - 1, 0)), "bottom": ((0, frame.height - 1), (frame.width - 1, frame.height - 1)), "left": ((0, 0), (0, frame.height - 1)), "right": ((frame.width - 1, 0), (frame.width - 1, frame.height - 1))}
                for side in set(item["touches"]) | set(item["nonwhite_canvas_edges"]):
                    mark.line(edge_map[side], fill="#c92828", width=3)
                sheet.paste(frame, (x + 8, y + 8))
                draw.text((x + 8, y + 208), f"{item['sku']}  {item['name'][:34]}", fill="#18212c", font=FONT)
                draw.text((x + 8, y + 226), f"edges: {', '.join(set(item['touches']) | set(item['nonwhite_canvas_edges']))}", fill="#b11f1f", font=FONT)
            out = OUTPUT / "contact-sheets" / f"{safe_name(category)}-{start // 12 + 1}.jpg"
            out.parent.mkdir(parents=True, exist_ok=True)
            sheet.save(out, "JPEG", quality=90)
            output.append(str(out))
    return output


def main() -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    source = json.loads(SOURCE_REPORT.read_text(encoding="utf-8"))
    # Previous full scan screened all 322 products. Only 69 records carried a risk
    # image copy; a strict edge audit is derived from every retained copy.
    source_candidates = [item for item in source["results"] if item.get("review_image")]
    results = [analyze(item) for item in source_candidates]
    results.sort(key=lambda item: item["sku"])
    flagged = [item for item in results if item["status"] == "review"]
    contact_sheets = sheets(results)
    payload = {"auditedAt": source.get("auditedAt"), "catalogueProductCount": source.get("productCount"), "cachedImagesRechecked": len(source_candidates), "flaggedCount": len(flagged), "rule": "Actual product/object must have visible white space on all four image-canvas sides. Any top, bottom, left, or right contact is a manual removal candidate.", "sourceAuditReport": str(SOURCE_REPORT), "contactSheets": contact_sheets, "results": results}
    REPORT.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"catalogueProductCount": payload["catalogueProductCount"], "cachedImagesRechecked": len(source_candidates), "flaggedCount": len(flagged), "contactSheets": len(contact_sheets), "reportPath": str(REPORT)}, indent=2))


if __name__ == "__main__":
    main()
