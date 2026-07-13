# Map Overlay

This directory contains the PNG overlay for the Field Map page.

To generate the overlay, run:

```bash
pip install pymupdf
python scripts/convert_pdf_to_png.py
```

This converts `SAHABAT 5.pdf` to `sahabat5_map.png` which is used as a raster overlay on the Leaflet map.
