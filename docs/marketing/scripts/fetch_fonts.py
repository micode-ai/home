# -*- coding: utf-8 -*-
"""Download the site's fonts into assets/fonts/ so renders are reproducible.

The landing page pulls Poppins + Open Sans from the Google Fonts CDN at runtime.
The creatives cannot depend on a CDN, and they must not read C:/Windows/Fonts —
that path does not exist on a CI runner. Run this once; the files are committed.

Usage:
    python docs/marketing/scripts/fetch_fonts.py
"""
import sys
import urllib.request
from pathlib import Path

from PIL import ImageFont

FONTS_DIR = Path(__file__).resolve().parents[1] / "assets" / "fonts"
RAW = "https://raw.githubusercontent.com/google/fonts/main"

# Poppins ships static instances. Open Sans does NOT ship a static/ cut in the
# google/fonts repo (ofl/opensans/static/ 404s) — upstream only publishes the
# variable font ofl/opensans/OpenSans[wdth,wght].ttf. We download that variable
# font and use fontTools to pin it to the Regular/SemiBold instances and save
# each as its own static .ttf (see export_open_sans_statics() below).
SOURCES = {
    "Poppins-Bold.ttf": f"{RAW}/ofl/poppins/Poppins-Bold.ttf",
    "Poppins-SemiBold.ttf": f"{RAW}/ofl/poppins/Poppins-SemiBold.ttf",
}

# Open Sans variable font, pinned to static instances after download.
OPEN_SANS_VARIABLE_URL = f"{RAW}/ofl/opensans/OpenSans%5Bwdth%2Cwght%5D.ttf"
OPEN_SANS_INSTANCES = {
    "OpenSans-Regular.ttf": "Regular",
    "OpenSans-SemiBold.ttf": "SemiBold",
}

LICENSES = {
    "Poppins-OFL.txt": f"{RAW}/ofl/poppins/OFL.txt",
    "OpenSans-OFL.txt": f"{RAW}/ofl/opensans/OFL.txt",
}


def download(url: str, target: Path) -> None:
    target.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=60) as response:
        target.write_bytes(response.read())
    print(f"  {target.name}  <-  {url}")


def export_open_sans_statics() -> None:
    """Download the Open Sans variable font and pin static instances from it.

    google/fonts has no ofl/opensans/static/ directory, so there is no plain
    URL for OpenSans-Regular.ttf / OpenSans-SemiBold.ttf. Instead we fetch the
    variable font, set each named instance (fonttools varLib.instancer), and
    write the result as a standalone static .ttf that PIL.ImageFont.truetype
    can load like any other font file.
    """
    from fontTools import varLib
    from fontTools.varLib.instancer import instantiateVariableFont
    from fontTools.ttLib import TTFont

    variable_path = FONTS_DIR / "_OpenSans-Variable.ttf"
    download(OPEN_SANS_VARIABLE_URL, variable_path)

    for filename, instance_name in OPEN_SANS_INSTANCES.items():
        font = TTFont(str(variable_path))
        fvar = font["fvar"]
        named_instance = next(
            inst
            for inst in fvar.instances
            if font["name"].getDebugName(inst.subfamilyNameID) == instance_name
        )
        axes = {
            axis.axisTag: named_instance.coordinates[axis.axisTag]
            for axis in fvar.axes
        }
        # updateFontNames=True is required: without it, instantiateVariableFont
        # leaves the name table's family/subfamily/PostScript/unique-ID fields
        # pointing at the source variable font, so every exported instance
        # (Regular, SemiBold, ...) claims the SAME name-table identity. PIL
        # loads by file path and never notices, but PDF/font-embedding tooling
        # (e.g. the LinkedIn carousel PDF export) commonly keys embedded font
        # resources off the PostScript name (nameID 6) or unique ID (nameID 3)
        # — two files both self-identifying as "OpenSans-Regular" risk one
        # silently shadowing the other.
        static_font = instantiateVariableFont(font, axes, updateFontNames=True)
        target = FONTS_DIR / filename
        static_font.save(str(target))
        print(f"  {filename}  <-  {OPEN_SANS_VARIABLE_URL} @ {instance_name} {axes}")

    variable_path.unlink()


def main() -> int:
    for name, url in {**SOURCES, **LICENSES}.items():
        try:
            download(url, FONTS_DIR / name)
        except Exception as exc:  # noqa: BLE001 - report and keep going
            print(f"  FAILED {name}: {exc}", file=sys.stderr)
            return 1

    try:
        export_open_sans_statics()
    except Exception as exc:  # noqa: BLE001 - report and keep going
        print(f"  FAILED Open Sans static export: {exc}", file=sys.stderr)
        return 1

    all_fonts = list(SOURCES) + list(OPEN_SANS_INSTANCES)
    for name in all_fonts:
        ImageFont.truetype(str(FONTS_DIR / name), 32)  # raises if unusable
    print(f"OK — {len(all_fonts)} fonts verified in {FONTS_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
