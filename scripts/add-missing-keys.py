#!/usr/bin/env python3
"""Add the remaining 8 missing locale keys to all 3 locale files."""

import json

def set_nested(obj, path, value):
    keys = path.split('.')
    current = obj
    for key in keys[:-1]:
        if key not in current or not isinstance(current[key], dict):
            current[key] = {}
        current = current[key]
    current[keys[-1]] = value

# (en, th, zh)
KEYS = {
    "admin.evm.addChainSetting": (
        "Add Chain Setting",
        "\u0e40\u0e1e\u0e34\u0e48\u0e21\u0e01\u0e32\u0e23\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32\u0e40\u0e0a\u0e19",
        "\u6dfb\u52a0\u94fe\u8bbe\u7f6e"
    ),
    "admin.evm.deleteChainConfirm": (
        "Are you sure you want to delete this chain setting?",
        "\u0e04\u0e38\u0e13\u0e41\u0e19\u0e48\u0e43\u0e08\u0e2b\u0e23\u0e37\u0e2d\u0e27\u0e48\u0e32\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e25\u0e1a\u0e01\u0e32\u0e23\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32\u0e40\u0e0a\u0e19\u0e19\u0e35\u0e49?",
        "\u786e\u5b9a\u8981\u5220\u9664\u6b64\u94fe\u8bbe\u7f6e\u5417\uff1f"
    ),
    "admin.evm.editChainSetting": (
        "Edit Chain Setting",
        "\u0e41\u0e01\u0e49\u0e44\u0e02\u0e01\u0e32\u0e23\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32\u0e40\u0e0a\u0e19",
        "\u7f16\u8f91\u94fe\u8bbe\u7f6e"
    ),
    "admin.sweep.updateSuccess": (
        "Settings updated successfully",
        "\u0e2d\u0e31\u0e1b\u0e40\u0e14\u0e15\u0e01\u0e32\u0e23\u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08",
        "\u8bbe\u7f6e\u66f4\u65b0\u6210\u529f"
    ),
    "admin.tempWallets.lastAssigned": (
        "Last Assigned",
        "\u0e21\u0e2d\u0e1a\u0e2b\u0e21\u0e32\u0e22\u0e25\u0e48\u0e32\u0e2a\u0e38\u0e14",
        "\u6700\u540e\u5206\u914d"
    ),
    "admin.withdrawal.deleteConfirm": (
        "Are you sure you want to delete this override?",
        "\u0e04\u0e38\u0e13\u0e41\u0e19\u0e48\u0e43\u0e08\u0e2b\u0e23\u0e37\u0e2d\u0e27\u0e48\u0e32\u0e15\u0e49\u0e2d\u0e07\u0e01\u0e32\u0e23\u0e25\u0e1a\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e19\u0e35\u0e49?",
        "\u786e\u5b9a\u8981\u5220\u9664\u6b64\u8986\u76d6\u9879\u5417\uff1f"
    ),
    "admin.withdrawalAddress.actionFailed": (
        "Failed to perform action on address",
        "\u0e44\u0e21\u0e48\u0e2a\u0e32\u0e21\u0e32\u0e23\u0e16\u0e14\u0e33\u0e40\u0e19\u0e34\u0e19\u0e01\u0e32\u0e23\u0e01\u0e31\u0e1a\u0e17\u0e35\u0e48\u0e2d\u0e22\u0e39\u0e48\u0e44\u0e14\u0e49",
        "\u64cd\u4f5c\u5730\u5740\u5931\u8d25"
    ),
    "common.optional": (
        "Optional",
        "\u0e44\u0e21\u0e48\u0e1a\u0e31\u0e07\u0e04\u0e31\u0e1a",
        "\u53ef\u9009"
    ),
}

for lang_idx, lang in enumerate(["en", "th", "zh"]):
    with open(f"locales/{lang}/common.json") as f:
        data = json.load(f)
    for key, vals in KEYS.items():
        set_nested(data, key, vals[lang_idx])
    with open(f"locales/{lang}/common.json", "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"{lang}: added {len(KEYS)} keys")
