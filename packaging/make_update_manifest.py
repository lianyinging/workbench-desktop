#!/usr/bin/env python3
"""Compose the Tauri updater manifest (latest.json) from staged release artifacts.

Run by the release CI job after all platform builds are staged in one directory:

    python3 make_update_manifest.py --version 0.3.5 --tag v0.3.5 \
        --repo lianyinging/workbench-desktop --dist dist/ --out dist/latest.json

    # Or point asset URLs at Aliyun OSS / CDN (no trailing slash):
    python3 make_update_manifest.py --version 0.3.5 --tag v0.3.5 \
        --repo lianyinging/workbench-desktop --dist dist/ --out dist/latest.json \
        --base-url https://your-bucket.oss-cn-hangzhou.aliyuncs.com/opc-workbench

Looks for the updater artifacts by their STABLE names (the same names release.yml
uploads):

    OpcWorkbench-macos-arm64.app.tar.gz(.sig)   -> platforms["darwin-aarch64"]
    OpcWorkbench-macos-x64.app.tar.gz(.sig)     -> platforms["darwin-x86_64"]
    OpcWorkbench-windows-setup.exe(.sig)        -> platforms["windows-x86_64"]

Without --base-url, URLs point at the TAG-pinned GitHub download path
(releases/download/<tag>/<asset>), never at `latest/`. With --base-url, each
asset is `$base/$asset` (upload the same filenames to OSS).

Platforms whose artifact or .sig is missing are SKIPPED with a warning.
"""

from __future__ import annotations

import argparse
import datetime
import json
import pathlib
import sys

# stable asset name -> Tauri platform key
ARTIFACTS = {
    "OpcWorkbench-macos-arm64.app.tar.gz": "darwin-aarch64",
    "OpcWorkbench-macos-x64.app.tar.gz": "darwin-x86_64",
    "OpcWorkbench-windows-setup.exe": "windows-x86_64",
}


def asset_url(base_url: str | None, repo: str, tag: str, asset: str) -> str:
    if base_url:
        return f"{base_url.rstrip('/')}/{asset}"
    return f"https://github.com/{repo}/releases/download/{tag}/{asset}"


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--version", required=True, help="bare version, e.g. 0.3.4")
    ap.add_argument(
        "--tag", required=True, help="git tag the assets live under, e.g. v0.3.4"
    )
    ap.add_argument(
        "--repo", required=True, help="owner/name, e.g. lianyinging/workbench-desktop"
    )
    ap.add_argument(
        "--dist", required=True, type=pathlib.Path, help="staged artifacts dir"
    )
    ap.add_argument("--out", required=True, type=pathlib.Path)
    ap.add_argument(
        "--notes", default="", help="release notes line shown in the update prompt"
    )
    ap.add_argument(
        "--base-url",
        default="",
        help="optional public base (OSS/CDN) for asset urls; empty = GitHub release urls",
    )
    args = ap.parse_args()
    base = (args.base_url or "").strip() or None

    platforms: dict[str, dict[str, str]] = {}
    for asset, platform in ARTIFACTS.items():
        artifact = args.dist / asset
        sig = args.dist / (asset + ".sig")
        if not artifact.exists():
            print(
                f"warning: {asset} not in {args.dist} — skipping {platform}",
                file=sys.stderr,
            )
            continue
        if not sig.exists():
            print(
                f"warning: {asset} has no .sig — skipping {platform} (unsigned updates never install)",
                file=sys.stderr,
            )
            continue
        platforms[platform] = {
            "signature": sig.read_text().strip(),
            "url": asset_url(base, args.repo, args.tag, asset),
        }

    if not platforms:
        print(
            "error: no signed updater artifacts found — refusing to write an empty manifest",
            file=sys.stderr,
        )
        return 1

    manifest = {
        "version": args.version,
        "notes": args.notes,
        "pub_date": datetime.datetime.now(datetime.timezone.utc)
        .isoformat(timespec="seconds")
        .replace("+00:00", "Z"),
        "platforms": platforms,
    }
    args.out.write_text(json.dumps(manifest, indent=2) + "\n")
    where = base or f"github.com/{args.repo}"
    print(f"wrote {args.out} ({', '.join(sorted(platforms))}) urls→{where}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
