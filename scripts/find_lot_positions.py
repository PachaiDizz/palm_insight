#!/usr/bin/env python3
"""
Find lot label positions in the plantation map image using image analysis.

This script analyzes the rasterized map image to find where lot labels are located,
then converts those pixel positions to WGS84 coordinates using the CTM transformation.
"""

import json
from pathlib import Path

try:
    from PIL import Image
    import numpy as np
    HAS_DEPS = True
except ImportError:
    HAS_DEPS = False
    print("ERROR: Install dependencies: pip install Pillow numpy")

# CTM transformation (PDF → WGS84)
# lng = 0.000075792249 * x_pdf + 119.067071738726
# lat = 0.000075807892 * y_pdf + 5.072123187189
CTM_A = 0.000075792249
CTM_D = 0.000075807892
CTM_E = 119.067071738726
CTM_F = 5.072123187189

# Image bounds in PDF coords
PDF_X_MIN = 36
PDF_X_MAX = 576
PDF_Y_MIN = 36
PDF_Y_MAX = 756


def pixel_to_wgs84(px, py, img_width, img_height):
    """Convert image pixel to WGS84 coordinates."""
    # Map pixel to PDF coords
    x_pdf = PDF_X_MIN + (px / img_width) * (PDF_X_MAX - PDF_X_MIN)
    # PDF y is flipped (increases upward, image y increases downward)
    y_pdf = PDF_Y_MAX - (py / img_height) * (PDF_Y_MAX - PDF_Y_MIN)
    
    lng = CTM_A * x_pdf + CTM_E
    lat = CTM_D * y_pdf + CTM_F
    return lat, lng


def main():
    if not HAS_DEPS:
        return
    
    img_path = Path(__file__).parent.parent / "public" / "maps" / "sahabat5_map.jpg"
    
    if not img_path.exists():
        print(f"Image not found: {img_path}")
        return
    
    print(f"Loading image: {img_path}")
    img = Image.open(img_path)
    width, height = img.size
    print(f"Image size: {width}x{height}")
    
    # Convert to numpy array for analysis
    img_array = np.array(img)
    
    # The map has red lines (lot boundaries) and blue lines (lot boundaries)
    # Lot labels are text in the image
    
    # Let's analyze the color channels to understand the image structure
    print("\nAnalyzing image channels...")
    
    # Check if image has text regions by looking for dark pixels (text)
    # Text is typically dark on lighter background
    
    # For now, let's output the WGS84 bounds of the image
    lat_sw, lng_sw = pixel_to_wgs84(0, height, width, height)
    lat_ne, lng_ne = pixel_to_wgs84(width, 0, width, height)
    
    print(f"\nImage WGS84 bounds:")
    print(f"  SW: [{lat_sw:.6f}, {lng_sw:.6f}]")
    print(f"  NE: [{lat_ne:.6f}, {lng_ne:.6f}]")
    
    # Create a reference grid to help understand the coordinate mapping
    print("\nCoordinate reference points:")
    test_points = [
        (0, 0, "Top-left"),
        (width, 0, "Top-right"),
        (0, height, "Bottom-left"),
        (width, height, "Bottom-right"),
        (width//2, height//2, "Center"),
    ]
    
    for px, py, label in test_points:
        lat, lng = pixel_to_wgs84(px, py, width, height)
        print(f"  {label} ({px}, {py}): [{lat:.6f}, {lng:.6f}]")
    
    # The issue is we need OCR to find where "LOT XXX" text appears in the image
    # Without OCR, we can't precisely locate the lot labels
    
    print("\n" + "="*60)
    print("LIMITATION: Without OCR, cannot find exact lot label positions.")
    print("="*60)
    print("\nTo get accurate lot boundaries, you MUST use one of these methods:")
    print("\n1. Global Mapper (Recommended):")
    print("   - Open SAHABAT 5.pdf in Global Mapper")
    print("   - Use Vector > Digitizer Tool to trace lot polygons")
    print("   - Export as WGS84 CSV/GeoJSON")
    
    print("\n2. QGIS (Free alternative):")
    print("   - Open SAHABAT 5.pdf in QGIS")
    print("   - Georeference the image using known control points")
    print("   - Create vector polygons for each lot")
    
    print("\n3. Install OCR support:")
    print("   - pip install pytesseract")
    print("   - Install Tesseract: https://github.com/tesseract-ocr/tesseract")
    print("   - Then this script can find lot label positions automatically")
    
    # Output the transformation formula for manual use
    print("\n" + "="*60)
    print("COORDINATE TRANSFORMATION FORMULA:")
    print("="*60)
    print("To convert any PDF point (x, y) to WGS84:")
    print("  lng = 0.000075792249 * x + 119.067071738726")
    print("  lat = 0.000075807892 * y + 5.072123187189")
    print(f"\nImage covers PDF points:")
    print(f"  x: {PDF_X_MIN} to {PDF_X_MAX}")
    print(f"  y: {PDF_Y_MIN} to {PDF_Y_MAX}")


if __name__ == "__main__":
    main()
