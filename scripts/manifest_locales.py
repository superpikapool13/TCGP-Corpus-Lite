#!/usr/bin/env python3
"""
manifest_locales.py

Copies raw per-language JSON files as-is into per-language output folders,
plus writes a manifest.json listing which files belong to which language.

  raw/en_US/Master.json, raw/en_US/System.json, ...
    -> out/en_US/Master.json, out/en_US/System.json, ...
    -> out/manifest.json   ({ "en_US": ["Master.json", "System.json", ...] })

Usage:
  python manifest_locales.py --raw ./raw-locales --out ./locales
"""

import argparse
import json
import shutil
import sys
from pathlib import Path


def find_language_dirs(raw_dir: Path):
    return sorted([p for p in raw_dir.iterdir() if p.is_dir()])


def run_manifest(raw_dir: Path, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    manifest = {}

    for lang_dir in find_language_dirs(raw_dir):
        lang = lang_dir.name
        json_files = sorted(lang_dir.glob("*.json"))
        if not json_files:
            print(f"  [skip] {lang}: no .json files found")
            continue

        lang_out_dir = out_dir / lang
        lang_out_dir.mkdir(parents=True, exist_ok=True)

        filenames = []
        for f in json_files:
            shutil.copy2(f, lang_out_dir / f.name)
            filenames.append(f.name)

        manifest[lang] = filenames
        print(f"  [ok] {lang}: copied {len(filenames)} file(s) -> {lang_out_dir}/")

    manifest_path = out_dir / "manifest.json"
    with open(manifest_path, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, ensure_ascii=False, indent=2, sort_keys=True)
        fh.write("\n")

    print(f"\nDone. Manifest written to: {manifest_path}")


def main():
    parser = argparse.ArgumentParser(description="Build manifest + per-language locale folders for deployment.")
    parser.add_argument("--raw", required=True, help="Path to raw locale folders (one subfolder per language)")
    parser.add_argument("--out", required=True, help="Output path")
    args = parser.parse_args()

    raw_dir = Path(args.raw)
    out_dir = Path(args.out)

    if not raw_dir.is_dir():
        print(f"Error: raw directory not found: {raw_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"Raw: {raw_dir}\nOut: {out_dir}\n")
    run_manifest(raw_dir, out_dir)


if __name__ == "__main__":
    main()
