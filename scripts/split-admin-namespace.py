#!/usr/bin/env python3
"""Split admin namespace from common.json into admin.json for all locales."""

import json
import os

LOCALES = ['en', 'th', 'zh']
BASE = 'locales'

for lang in LOCALES:
    common_path = os.path.join(BASE, lang, 'common.json')
    admin_path = os.path.join(BASE, lang, 'admin.json')

    with open(common_path) as f:
        data = json.load(f)

    if 'admin' not in data:
        print(f"  {lang}: no 'admin' key found, skipping")
        continue

    admin_data = data.pop('admin')

    # Write admin.json
    with open(admin_path, 'w') as f:
        json.dump(admin_data, f, indent=2, ensure_ascii=False)
        f.write('\n')

    # Write updated common.json (without admin)
    with open(common_path, 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write('\n')

    # Count keys
    def count_keys(obj):
        t = 0
        for v in obj.values():
            if isinstance(v, dict):
                t += count_keys(v)
            else:
                t += 1
        return t

    print(f"  {lang}: common={count_keys(data)} keys, admin={count_keys(admin_data)} keys")

print("\nDone! Created admin.json and updated common.json for all locales.")
