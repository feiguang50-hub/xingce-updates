"""Build an offline, redesigned frontend from the pinned published APK.

The signed production APK and latest.json are never modified by this tool.
"""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
from zipfile import ZipFile

ROOT = Path(__file__).resolve().parent.parent
BASE_APK = ROOT / 'apks' / 'xingce-1.8.0.apk'
BASE_SHA256 = '2f1bc21f43c6f91f0f9e4e1c03cd88fed6004c54f0c4b3020b6b35be3e236590'


def build_html(*, preview: bool = False) -> str:
    if hashlib.sha256(BASE_APK.read_bytes()).hexdigest() != BASE_SHA256:
        raise ValueError('Base APK differs from the pinned 1.8.0 release')
    with ZipFile(BASE_APK) as archive:
        source = archive.read('assets/index.html').decode('utf-8')
    assert source.count('<script>boot();</script>') == 1
    css = (ROOT / 'ui' / 'theme.css').read_text(encoding='utf-8')
    javascript = (ROOT / 'ui' / 'home.js').read_text(encoding='utf-8')
    source = source.replace('</head>', '<style id="xingce-refined-theme">\n' + css + '\n</style></head>', 1)
    updater = 'const canNativeUpdate=()=>!!globalThis.XingceAndroid?.checkUpdate;'
    if source.count(updater) != 1:
        raise ValueError('The base APK updater guard no longer matches')
    source = source.replace(updater, 'const canNativeUpdate=()=>!globalThis.XINGCE_UI_PREVIEW&&!!globalThis.XingceAndroid?.checkUpdate;')
    flag = 'globalThis.XINGCE_UI_PREVIEW=true;\n' if preview else ''
    source = source.replace('<script>boot();</script>', '<script>\n' + flag + javascript + '\nboot();</script>')
    source = source.replace('<title>行测错题本 · v1.7.0</title>', '<title>行测错题本</title>')
    return source


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist' / 'index.html')
    args = parser.parse_args()
    html = build_html()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(html, encoding='utf-8')
    print(f'Built offline frontend: {args.output} ({args.output.stat().st_size:,} bytes)')


if __name__ == '__main__':
    main()
