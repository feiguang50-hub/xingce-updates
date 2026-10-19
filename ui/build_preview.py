"""Build an unsigned, separately installable Android UI preview.

Uses the pinned published native shell. Package identity and component authorities
are changed so the preview cannot replace or share storage with the production app.
Sign the result with a development key after running zipalign.
"""
from __future__ import annotations

import argparse
import json
import struct
from pathlib import Path
from zipfile import ZipFile

from build import BASE_APK, ROOT, build_html

PACKAGE = 'cn.xingce.practice.preview'
VERSION_NAME = '1.8.0-ui.1'
VERSION_CODE = 190
NONE = 0xFFFFFFFF


def string_pool(chunk: bytes) -> list[str]:
    _, header, _, count, style_count, flags, start, _ = struct.unpack_from('<HHIIIIII', chunk)
    if style_count:
        raise ValueError('Styled manifest string pools are not supported')
    result = []
    for index in range(count):
        position = start + struct.unpack_from('<I', chunk, header + index * 4)[0]
        if flags & 0x100:
            def length8(position):
                value = chunk[position]
                return (((value & 0x7F) << 8) | chunk[position + 1], position + 2) if value & 0x80 else (value, position + 1)
            _, position = length8(position)
            length, position = length8(position)
            result.append(chunk[position:position + length].decode('utf-8'))
        else:
            length = struct.unpack_from('<H', chunk, position)[0]
            position += 2
            if length & 0x8000:
                length = ((length & 0x7FFF) << 16) | struct.unpack_from('<H', chunk, position)[0]
                position += 2
            result.append(chunk[position:position + length * 2].decode('utf-16le'))
    return result


def encode_pool(strings: list[str]) -> bytes:
    def length8(value):
        if value > 0x7FFF:
            raise ValueError('Manifest string exceeds the supported length')
        return bytes([(value >> 8) | 0x80, value & 255]) if value > 127 else bytes([value])
    data = bytearray()
    offsets = []
    for text in strings:
        offsets.append(len(data))
        encoded = text.encode('utf-8')
        data.extend(length8(len(text.encode('utf-16le')) // 2))
        data.extend(length8(len(encoded)))
        data.extend(encoded + b'\0')
    data.extend(b'\0' * (-len(data) % 4))
    start = 28 + len(strings) * 4
    return struct.pack('<HHIIIIII', 1, 28, start + len(data), len(strings), 0, 0x100, start, 0) + struct.pack('<' + 'I' * len(offsets), *offsets) + data


def preview_manifest(original: bytes) -> bytes:
    kind, header, size = struct.unpack_from('<HHI', original)
    if kind != 3 or header != 8 or size != len(original):
        raise ValueError('Unexpected binary Android manifest header')
    chunks = []
    position = header
    while position < len(original):
        chunk_kind, _, chunk_size = struct.unpack_from('<HHI', original, position)
        if chunk_size < 8 or position + chunk_size > len(original):
            raise ValueError('Malformed Android manifest chunk')
        chunks.append((chunk_kind, bytearray(original[position:position + chunk_size])))
        position += chunk_size
    pools = [chunk for chunk_kind, chunk in chunks if chunk_kind == 1]
    if len(pools) != 1:
        raise ValueError('Expected one manifest string pool')
    strings = string_pool(bytes(pools[0]))

    def string_index(value):
        if value not in strings:
            strings.append(value)
        return strings.index(value)

    changes = set()
    for chunk_kind, chunk in chunks:
        if chunk_kind != 0x0102:
            continue
        name = strings[struct.unpack_from('<I', chunk, 20)[0]]
        attribute_start, attribute_size, attribute_count = struct.unpack_from('<HHH', chunk, 24)
        if attribute_size != 20:
            raise ValueError('Unexpected manifest attribute size')
        for index in range(attribute_count):
            offset = 16 + attribute_start + index * attribute_size
            attribute = strings[struct.unpack_from('<I', chunk, offset + 4)[0]]
            raw = struct.unpack_from('<I', chunk, offset + 8)[0]
            value_type = chunk[offset + 15]
            value = struct.unpack_from('<I', chunk, offset + 16)[0]
            text = strings[value] if value_type == 3 else strings[raw] if raw != NONE else None
            replacement = None
            if name == 'manifest' and attribute == 'package':
                if text != 'cn.xingce.practice':
                    raise ValueError('Base package does not match production 1.8.0')
                replacement = PACKAGE
                changes.add('package')
            elif name == 'manifest' and attribute == 'versionName':
                replacement = VERSION_NAME
                changes.add('versionName')
            elif name == 'manifest' and attribute == 'versionCode':
                struct.pack_into('<I', chunk, offset + 16, VERSION_CODE)
                changes.add('versionCode')
            elif name == 'application' and attribute == 'label':
                replacement = '行测·设计预览'
                changes.add('label')
            elif name in ('activity', 'provider') and attribute == 'name' and text and text.startswith('.'):
                replacement = 'cn.xingce.practice' + text
                changes.add(name)
            elif name == 'provider' and attribute == 'authorities':
                replacement = PACKAGE + '.updates'
                changes.add('authorities')
            if replacement is not None:
                replacement_index = string_index(replacement)
                struct.pack_into('<I', chunk, offset + 8, replacement_index)
                chunk[offset + 15] = 3
                struct.pack_into('<I', chunk, offset + 16, replacement_index)
    expected = {'package', 'versionName', 'versionCode', 'label', 'activity', 'provider', 'authorities'}
    if changes != expected:
        raise ValueError(f'Incomplete preview identity conversion: {changes}')
    body = b''.join(encode_pool(strings) if chunk_kind == 1 else bytes(chunk) for chunk_kind, chunk in chunks)
    return struct.pack('<HHI', 3, 8, 8 + len(body)) + body


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist' / 'xingce-ui-preview-unsigned.apk')
    args = parser.parse_args()
    if args.output.resolve() == BASE_APK.resolve():
        raise ValueError('Refusing to overwrite the production APK')
    html = build_html(preview=True).encode('utf-8')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with ZipFile(BASE_APK) as source, ZipFile(args.output, 'w') as target:
        for info in source.infolist():
            if info.filename.upper().startswith('META-INF/'):
                continue
            content = source.read(info.filename)
            if info.filename == 'AndroidManifest.xml':
                content = preview_manifest(content)
            elif info.filename == 'assets/index.html':
                content = html
            target.writestr(info, content)
    print(json.dumps({'packageName': PACKAGE, 'versionName': VERSION_NAME, 'versionCode': VERSION_CODE, 'signed': False, 'output': str(args.output)}, ensure_ascii=False))


if __name__ == '__main__':
    main()
