#!/usr/bin/env python3
"""Scan admin pages and components for hardcoded English strings."""
import re
import os

SKIP = {
    'wallet-gas-topups/page.jsx',
    'wallet-gas-topups/[id]/page.jsx',
    'roles/page.jsx',
    'roles/[role]/page.jsx',
}

BASE = 'app/(dashboard)/admin'
COMP_BASE = 'components/admin'

def collect_files():
    pages = []
    for root, dirs, files in os.walk(BASE):
        for f in files:
            if f.endswith('.jsx') or f.endswith('.tsx'):
                path = os.path.join(root, f)
                rel = path[len(BASE)+1:]
                if rel not in SKIP:
                    pages.append(path)
    components = []
    for root, dirs, files in os.walk(COMP_BASE):
        for f in files:
            if f.endswith('.jsx') or f.endswith('.tsx'):
                components.append(os.path.join(root, f))
    return sorted(set(pages + components))

def scan_file(filepath):
    with open(filepath, 'r') as fp:
        content = fp.read()
        lines = content.split('\n')

    has_t = 'useTranslation' in content
    hardcoded = []

    for i, line in enumerate(lines, 1):
        stripped = line.strip()

        # Skip non-content lines
        if stripped.startswith('import ') or stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('* '):
            continue
        if 'className' in stripped or 'console.' in stripped:
            continue
        if 'router.push' in stripped or 'router.replace' in stripped:
            continue
        if stripped.startswith('href=') or 'Link ' in stripped:
            continue

        # Pattern 1: >English Text< (JSX text nodes)
        jsx_texts = re.findall(r'>([A-Z][a-zA-Z0-9 /&:,.\-\'()#]+)<', line)
        for txt in jsx_texts:
            txt = txt.strip()
            if len(txt) >= 2 and not txt.startswith('{'):
                hardcoded.append((i, 'jsx', txt))

        # Pattern 2: Attribute strings like title="English", placeholder="Enter..."
        for attr in ['title', 'placeholder', 'label', 'header', 'description', 'alt', 'aria-label']:
            attr_matches = re.findall(rf'{attr}\s*=\s*["\']([A-Z][a-zA-Z0-9 /&:,.\-()#]+)["\']', line)
            for m in attr_matches:
                if len(m) >= 2:
                    hardcoded.append((i, 'attr', f'[{attr}] {m}'))

        # Pattern 3: Bare English text lines in JSX (like standalone text nodes)
        if (re.match(r'^\s*[A-Z][a-zA-Z0-9 :,.\-()#/&]+\s*$', stripped)
            and not stripped.endswith('{')
            and not stripped.endswith('}')
            and not stripped.endswith('(')
            and not stripped.endswith(')')
            and not stripped.startswith('const ')
            and not stripped.startswith('let ')
            and not stripped.startswith('return')
            and not stripped.startswith('export')
            and not stripped.startswith('function')
            and not stripped.startswith('if')
            and not stripped.startswith('case ')
            and not stripped.startswith('default:')
            and not stripped.startswith('break')
            and not stripped.startswith('throw')
            and not stripped.startswith('await')
            and not stripped.startswith('async')
            and 3 < len(stripped) < 80):
            # Avoid duplicates with pattern 1
            already = any(s == stripped for _, _, s in hardcoded if _ == i)
            if not already:
                hardcoded.append((i, 'text', stripped))

        # Pattern 4: strings like "Some English Text" not inside t()
        # Look for quoted strings that look like UI text
        quoted = re.findall(r"""(?<!\w)['"]([A-Z][a-zA-Z ]{4,}(?:\s[a-zA-Z]+)*)['"]""", line)
        for q in quoted:
            # Skip if it's inside t('...')
            if f"t('{q}')" in line or f't("{q}")' in line:
                continue
            # Skip if it's a key like 'admin.something'
            if '.' in q and q[0].islower():
                continue
            # Skip if already captured
            already = any(s.endswith(q) or s == q for _, _, s in hardcoded if _ == i)
            if not already:
                hardcoded.append((i, 'str', q))

    return has_t, hardcoded

def main():
    os.chdir('/Users/recordset/Projects/bullpay-web')
    all_files = collect_files()

    group_a = []  # No useTranslation
    group_b = []  # Has useTranslation but has hardcoded

    for fp in all_files:
        has_t, hardcoded = scan_file(fp)
        if not hardcoded:
            continue
        entry = {
            'file': fp,
            'has_t': has_t,
            'count': len(hardcoded),
            'strings': hardcoded
        }
        if not has_t:
            group_a.append(entry)
        else:
            group_b.append(entry)

    # Sort by count descending
    group_a.sort(key=lambda x: -x['count'])
    group_b.sort(key=lambda x: -x['count'])

    print("=" * 80)
    print("GROUP A: Pages with NO useTranslation (full translation needed)")
    print("=" * 80)
    if not group_a:
        print("  (none found - all files have useTranslation)")
    for entry in group_a:
        print(f"\n  FILE: {entry['file']}")
        print(f"  HARDCODED COUNT: {entry['count']}")
        for ln, typ, txt in entry['strings'][:25]:
            print(f"    L{ln} [{typ}]: {txt}")
        if len(entry['strings']) > 25:
            print(f"    ... and {len(entry['strings']) - 25} more")

    print()
    print("=" * 80)
    print("GROUP B: Pages WITH useTranslation (may have remaining hardcoded)")
    print("=" * 80)
    if not group_b:
        print("  (none found)")
    for entry in group_b:
        print(f"\n  FILE: {entry['file']}")
        print(f"  HARDCODED COUNT: {entry['count']}")
        for ln, typ, txt in entry['strings'][:25]:
            print(f"    L{ln} [{typ}]: {txt}")
        if len(entry['strings']) > 25:
            print(f"    ... and {len(entry['strings']) - 25} more")

    print()
    print("=" * 80)
    print("SUMMARY")
    print("=" * 80)
    total_a = sum(e['count'] for e in group_a)
    total_b = sum(e['count'] for e in group_b)
    print(f"  Group A files: {len(group_a)} ({total_a} hardcoded strings)")
    print(f"  Group B files: {len(group_b)} ({total_b} hardcoded strings)")
    print(f"  Total: {len(group_a) + len(group_b)} files, {total_a + total_b} strings")

if __name__ == '__main__':
    main()
