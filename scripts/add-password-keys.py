#!/usr/bin/env python3
"""Add change password i18n keys to all locale files."""
import json
import os

password_keys = {
    "title": {"en": "Change Password", "th": "เปลี่ยนรหัสผ่าน", "zh": "修改密码"},
    "description": {
        "en": "For security, you'll be logged out of all devices after changing your password.",
        "th": "เพื่อความปลอดภัย คุณจะออกจากระบบทุกอุปกรณ์หลังเปลี่ยนรหัสผ่าน",
        "zh": "为安全考虑，更改密码后您将从所有设备中注销。",
    },
    "currentPassword": {"en": "Current Password", "th": "รหัสผ่านปัจจุบัน", "zh": "当前密码"},
    "newPassword": {"en": "New Password", "th": "รหัสผ่านใหม่", "zh": "新密码"},
    "confirmPassword": {"en": "Confirm New Password", "th": "ยืนยันรหัสผ่านใหม่", "zh": "确认新密码"},
    "requirements": {
        "en": "Min 8 characters with uppercase, lowercase, number, and special character.",
        "th": "อย่างน้อย 8 ตัวอักษร ต้องมีตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ",
        "zh": "至少8个字符，包含大写字母、小写字母、数字和特殊字符。",
    },
    "changeButton": {"en": "Change Password", "th": "เปลี่ยนรหัสผ่าน", "zh": "修改密码"},
    "changing": {"en": "Changing...", "th": "กำลังเปลี่ยน...", "zh": "正在修改..."},
    "changeSuccess": {
        "en": "Password changed successfully. Please log in again.",
        "th": "เปลี่ยนรหัสผ่านสำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง",
        "zh": "密码修改成功，请重新登录。",
    },
    "changeFailed": {
        "en": "Failed to change password. Please try again.",
        "th": "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาลองใหม่",
        "zh": "密码修改失败，请重试。",
    },
    "incorrectCurrent": {
        "en": "Current password is incorrect",
        "th": "รหัสผ่านปัจจุบันไม่ถูกต้อง",
        "zh": "当前密码不正确",
    },
}

for lang in ["en", "th", "zh"]:
    path = os.path.join("locales", lang, "common.json")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    if "password" not in data.get("settings", {}):
        data["settings"]["password"] = {}

    for key, translations in password_keys.items():
        data["settings"]["password"][key] = translations[lang]

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"{lang}: added {len(password_keys)} password keys")
