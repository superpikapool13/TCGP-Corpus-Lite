#!/usr/bin/env python3
"""
merge_locales.py

Deep-merges all JSON files in each raw per-language folder
into a single output file per language.

  raw/en_US/Master.json, raw/en_US/System.json, ...
    -> out/en_US.json   (one file per language)

Key conflicts (same key path, different scalar value across files) are
resolved by last-file-wins (alphabetical filename order) and reported,
rather than silently overwritten without a trace.

Usage:
  python merge_locales.py --raw ./raw-locales --out ./locales
"""

import argparse
import json
import sys
from pathlib import Path


def deep_merge(target: dict, source: dict, path: list, conflicts: list):
    """Recursively merge `source` into `target`. Records leaf-value
    conflicts (same key path, different scalar value) into `conflicts`
    instead of silently overwriting without a trace."""
    for key, value in source.items():
        current_path = path + [key]
        if isinstance(value, dict) and isinstance(target.get(key), dict):
            deep_merge(target[key], value, current_path, conflicts)
        else:
            if key in target and target[key] != value:
                conflicts.append(
                    {
                        "path": ".".join(current_path),
                        "old_value": target[key],
                        "new_value": value,
                    }
                )
            target[key] = value
    return target


def find_language_dirs(raw_dir: Path):
    return sorted([p for p in raw_dir.iterdir() if p.is_dir()])


def run_merge(raw_dir: Path, out_dir: Path):
    out_dir.mkdir(parents=True, exist_ok=True)
    total_conflicts = 0

    for lang_dir in find_language_dirs(raw_dir):
        lang = lang_dir.name
        json_files = sorted(lang_dir.glob("*.json"))
        if not json_files:
            print(f"  [skip] {lang}: no .json files found")
            continue

        merged = {}
        conflicts = []
        for f in json_files:
            with open(f, "r", encoding="utf-8") as fh:
                data = json.load(fh)
            deep_merge(merged, data, [], conflicts)

        out_path = out_dir / f"{lang}.json"
        with open(out_path, "w", encoding="utf-8") as fh:
            json.dump(merged, fh, ensure_ascii=False, indent=2, sort_keys=True)
            fh.write("\n")

        print(f"  [ok] {lang}: merged {len(json_files)} file(s) -> {out_path.name}")
        if conflicts:
            total_conflicts += len(conflicts)
            print(f"       {len(conflicts)} key conflict(s) (last file wins):")
            for c in conflicts:
                print(f"         - {c['path']}: {c['old_value']!r} -> {c['new_value']!r}")

    if total_conflicts:
        print(f"\n{total_conflicts} total key conflict(s) across all languages — review above.")
    print(f"\nDone. Merged files written to: {out_dir}")


def main():
    parser = argparse.ArgumentParser(description="Merge multi-file raw locales into one JSON per language.")
    parser.add_argument("--raw", required=True, help="Path to raw locale folders (one subfolder per language)")
    parser.add_argument("--out", required=True, help="Output path")
    args = parser.parse_args()

    raw_dir = Path(args.raw)
    out_dir = Path(args.out)

    if not raw_dir.is_dir():
        print(f"Error: raw directory not found: {raw_dir}", file=sys.stderr)
        sys.exit(1)

    print(f"Raw: {raw_dir}\nOut: {out_dir}\n")
    run_merge(raw_dir, out_dir)


if __name__ == "__main__":
    main()
