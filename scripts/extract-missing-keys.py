#!/usr/bin/env python3
"""Extract default values for missing translation keys from source code and add them to locale files."""

import re
import json
import glob

def get_nested(obj, path):
    keys = path.split('.')
    current = obj
    for key in keys:
        if isinstance(current, dict) and key in current:
            current = current[key]
        else:
            return None
    return current

def set_nested(obj, path, value):
    keys = path.split('.')
    current = obj
    for key in keys[:-1]:
        if key not in current or not isinstance(current[key], dict):
            current[key] = {}
        current = current[key]
    current[keys[-1]] = value

# Extract all t('key', { defaultValue: 'value' }) patterns from admin files
pattern = re.compile(r"t\('([^']+)',\s*\{\s*defaultValue:\s*'([^']+)'\s*(?:,\s*\w+:\s*[^}]+)?\}\)")
pattern_dq = re.compile(r't\("([^"]+)",\s*\{\s*defaultValue:\s*"([^"]+)"\s*(?:,\s*\w+:\s*[^}]+)?\}\)')

files = glob.glob('app/(dashboard)/admin/**/*.jsx', recursive=True) + \
        glob.glob('components/admin/**/*.jsx', recursive=True)

key_vals = {}
for fpath in files:
    with open(fpath) as f:
        content = f.read()
    for m in pattern.finditer(content):
        key, val = m.group(1), m.group(2)
        if key not in key_vals:
            key_vals[key] = val
    for m in pattern_dq.finditer(content):
        key, val = m.group(1), m.group(2)
        if key not in key_vals:
            key_vals[key] = val

# Load en locale
with open('locales/en/common.json') as f:
    en_data = json.load(f)

# Find missing keys
all_keys = sorted(key_vals.keys())
missing = []
for key in all_keys:
    if get_nested(en_data, key) is None:
        missing.append(key)

print(f"Total keys extracted: {len(key_vals)}")
print(f"Missing from en locale: {len(missing)}")

if not missing:
    print("All keys present!")
    exit(0)

# Thai translations for common terms
TH_MAP = {
    "Account Type": "ประเภทบัญชี",
    "Address": "ที่อยู่",
    "Action": "การดำเนินการ",
    "Actions": "การดำเนินการ",
    "Active": "ใช้งาน",
    "Actual Amount": "จำนวนจริง",
    "Add": "เพิ่ม",
    "Admin": "ผู้ดูแลระบบ",
    "All Actions": "ทุกการดำเนินการ",
    "All Events": "ทุกเหตุการณ์",
    "All Types": "ทุกประเภท",
    "Amount": "จำนวน",
    "Approve": "อนุมัติ",
    "Ascending": "น้อยไปมาก",
    "Average (USD)": "เฉลี่ย (USD)",
    "Block Number": "หมายเลขบล็อก",
    "By Currency": "ตามสกุลเงิน",
    "Callback URL": "URL เรียกกลับ",
    "Category": "หมวดหมู่",
    "Chain": "เชน",
    "Chain ID": "รหัสเชน",
    "Code": "รหัส",
    "Coin": "เหรียญ",
    "Coin Network": "เครือข่ายเหรียญ",
    "Coin Network ID": "รหัสเครือข่ายเหรียญ",
    "Coin Symbol": "สัญลักษณ์เหรียญ",
    "Confirm": "ยืนยัน",
    "Confirm Delete": "ยืนยันการลบ",
    "Confirmed Balance": "ยอดยืนยันแล้ว",
    "Confirmations": "การยืนยัน",
    "Copy": "คัดลอก",
    "Count": "จำนวน",
    "Create": "สร้าง",
    "Created": "สร้างเมื่อ",
    "Created At": "สร้างเมื่อ",
    "Credit": "เครดิต",
    "Currency": "สกุลเงิน",
    "Daily Trends": "แนวโน้มรายวัน",
    "Date": "วันที่",
    "Date From": "ตั้งแต่วันที่",
    "Date To": "ถึงวันที่",
    "Debit": "เดบิต",
    "Descending": "มากไปน้อย",
    "Description": "รายละเอียด",
    "Details": "รายละเอียด",
    "Detected": "ตรวจพบ",
    "Edit": "แก้ไข",
    "Email": "อีเมล",
    "End Date": "วันสิ้นสุด",
    "Entry Code": "รหัสรายการ",
    "Entry Type": "ประเภทรายการ",
    "Error": "ข้อผิดพลาด",
    "Event": "เหตุการณ์",
    "Explorer": "สำรวจ",
    "Fee": "ค่าธรรมเนียม",
    "Fee (USD)": "ค่าธรรมเนียม (USD)",
    "Fiat Volume": "ปริมาณเงินเฟียต",
    "Filters": "ตัวกรอง",
    "Fixed": "คงที่",
    "From Address": "ที่อยู่ต้นทาง",
    "ID": "รหัส",
    "Invoice ID": "รหัสใบแจ้งหนี้",
    "Is Flagged": "ถูกตั้งค่าสถานะ",
    "Is Verified": "ยืนยันแล้ว",
    "Items": "รายการ",
    "Key Required": "ต้องระบุคีย์",
    "Metadata": "เมตาดาต้า",
    "Min Value (USD)": "มูลค่าขั้นต่ำ (USD)",
    "Name": "ชื่อ",
    "Native": "เนทีฟ",
    "Network": "เครือข่าย",
    "Network Name": "ชื่อเครือข่าย",
    "No data available": "ไม่มีข้อมูล",
    "No transactions found": "ไม่พบรายการ",
    "OK": "ตกลง",
    "Operating Profit": "กำไรจากการดำเนินงาน",
    "Optional": "ไม่บังคับ",
    "Page": "หน้า",
    "Payments": "การชำระเงิน",
    "Purpose": "วัตถุประสงค์",
    "Reason": "เหตุผล",
    "Refresh": "รีเฟรช",
    "Reject": "ปฏิเสธ",
    "Related ID": "รหัสที่เกี่ยวข้อง",
    "Reservation": "การจอง",
    "Reservation ID": "รหัสการจอง",
    "Role": "บทบาท",
    "Search": "ค้นหา",
    "Select Date Range": "เลือกช่วงวันที่",
    "Show Less": "แสดงน้อยลง",
    "Sort By": "เรียงตาม",
    "Sort Order": "ลำดับ",
    "Start Date": "วันเริ่มต้น",
    "State": "สถานะ",
    "Status": "สถานะ",
    "Success": "สำเร็จ",
    "Success Rate": "อัตราสำเร็จ",
    "Sweep ID": "รหัสการกวาดเงิน",
    "Temp Wallet ID": "รหัสกระเป๋าชั่วคราว",
    "Timestamps": "ประทับเวลา",
    "To Address": "ที่อยู่ปลายทาง",
    "Top Users": "ผู้ใช้อันดับต้น",
    "Total Balance": "ยอดรวม",
    "Total Volume": "ปริมาณรวม",
    "Total Value (USD)": "มูลค่ารวม (USD)",
    "Transactions": "รายการ",
    "Tx Hash": "แฮชธุรกรรม",
    "Type": "ประเภท",
    "Unconfirmed Balance": "ยอดไม่ยืนยัน",
    "Updated": "อัปเดตเมื่อ",
    "Updated At": "อัปเดตเมื่อ",
    "User": "ผู้ใช้",
    "User ID": "รหัสผู้ใช้",
    "Value": "ค่า",
    "Value (USD)": "มูลค่า (USD)",
    "Valued At": "มูลค่าตาม",
    "View Detail": "ดูรายละเอียด",
    "View Details": "ดูรายละเอียด",
    "View on Explorer": "ดูบน Explorer",
    "Volume": "ปริมาณ",
    "Wallet ID": "รหัสกระเป๋า",
    "Webhook retry enqueued": "เพิ่มการส่ง Webhook ซ้ำในคิวแล้ว",
    "With Balance": "มียอดคงเหลือ",
    "Withdrawal": "การถอน",
}

# Chinese translations
ZH_MAP = {
    "Account Type": "账户类型",
    "Address": "地址",
    "Action": "操作",
    "Actions": "操作",
    "Active": "活跃",
    "Actual Amount": "实际金额",
    "Add": "添加",
    "Admin": "管理员",
    "All Actions": "所有操作",
    "All Events": "所有事件",
    "All Types": "所有类型",
    "Amount": "金额",
    "Approve": "批准",
    "Ascending": "升序",
    "Average (USD)": "平均 (USD)",
    "Block Number": "区块号",
    "By Currency": "按币种",
    "Callback URL": "回调 URL",
    "Category": "分类",
    "Chain": "链",
    "Chain ID": "链 ID",
    "Code": "代码",
    "Coin": "币种",
    "Coin Network": "币种网络",
    "Coin Network ID": "币种网络 ID",
    "Coin Symbol": "币种符号",
    "Confirm": "确认",
    "Confirm Delete": "确认删除",
    "Confirmed Balance": "已确认余额",
    "Confirmations": "确认数",
    "Copy": "复制",
    "Count": "数量",
    "Create": "创建",
    "Created": "创建时间",
    "Created At": "创建时间",
    "Credit": "贷记",
    "Currency": "币种",
    "Daily Trends": "每日趋势",
    "Date": "日期",
    "Date From": "开始日期",
    "Date To": "结束日期",
    "Debit": "借记",
    "Descending": "降序",
    "Description": "描述",
    "Details": "详情",
    "Detected": "检测到",
    "Edit": "编辑",
    "Email": "邮箱",
    "End Date": "结束日期",
    "Entry Code": "条目代码",
    "Entry Type": "条目类型",
    "Error": "错误",
    "Event": "事件",
    "Explorer": "浏览器",
    "Fee": "手续费",
    "Fee (USD)": "手续费 (USD)",
    "Fiat Volume": "法币交易量",
    "Filters": "筛选",
    "Fixed": "固定",
    "From Address": "来源地址",
    "ID": "ID",
    "Invoice ID": "发票 ID",
    "Is Flagged": "已标记",
    "Is Verified": "已验证",
    "Items": "项目",
    "Key Required": "密钥必填",
    "Metadata": "元数据",
    "Min Value (USD)": "最低价值 (USD)",
    "Name": "名称",
    "Native": "原生",
    "Network": "网络",
    "Network Name": "网络名称",
    "No data available": "暂无数据",
    "No transactions found": "未找到交易",
    "OK": "确定",
    "Operating Profit": "运营利润",
    "Optional": "可选",
    "Page": "页面",
    "Payments": "付款",
    "Purpose": "用途",
    "Reason": "原因",
    "Refresh": "刷新",
    "Reject": "拒绝",
    "Related ID": "关联 ID",
    "Reservation": "预留",
    "Reservation ID": "预留 ID",
    "Role": "角色",
    "Search": "搜索",
    "Select Date Range": "选择日期范围",
    "Show Less": "收起",
    "Sort By": "排序方式",
    "Sort Order": "排序顺序",
    "Start Date": "开始日期",
    "State": "状态",
    "Status": "状态",
    "Success": "成功",
    "Success Rate": "成功率",
    "Sweep ID": "归集 ID",
    "Temp Wallet ID": "临时钱包 ID",
    "Timestamps": "时间戳",
    "To Address": "目标地址",
    "Top Users": "活跃用户",
    "Total Balance": "总余额",
    "Total Volume": "总交易量",
    "Total Value (USD)": "总价值 (USD)",
    "Transactions": "交易",
    "Tx Hash": "交易哈希",
    "Type": "类型",
    "Unconfirmed Balance": "未确认余额",
    "Updated": "更新时间",
    "Updated At": "更新时间",
    "User": "用户",
    "User ID": "用户 ID",
    "Value": "值",
    "Value (USD)": "价值 (USD)",
    "Valued At": "计价于",
    "View Detail": "查看详情",
    "View Details": "查看详情",
    "View on Explorer": "在浏览器中查看",
    "Volume": "交易量",
    "Wallet ID": "钱包 ID",
    "Webhook retry enqueued": "Webhook 重试已加入队列",
    "With Balance": "有余额",
    "Withdrawal": "提现",
}

# Add missing keys to en
for key in missing:
    val = key_vals.get(key, key)
    set_nested(en_data, key, val)
    
with open('locales/en/common.json', 'w') as f:
    json.dump(en_data, f, indent=2, ensure_ascii=False)
    f.write('\n')

# Load and update th locale
with open('locales/th/common.json') as f:
    th_data = json.load(f)

for key in missing:
    en_val = key_vals.get(key, key)
    # Try to find Thai translation
    th_val = TH_MAP.get(en_val, en_val)
    set_nested(th_data, key, th_val)
    
with open('locales/th/common.json', 'w') as f:
    json.dump(th_data, f, indent=2, ensure_ascii=False)
    f.write('\n')

# Load and update zh locale
with open('locales/zh/common.json') as f:
    zh_data = json.load(f)

for key in missing:
    en_val = key_vals.get(key, key)
    zh_val = ZH_MAP.get(en_val, en_val)
    set_nested(zh_data, key, zh_val)
    
with open('locales/zh/common.json', 'w') as f:
    json.dump(zh_data, f, indent=2, ensure_ascii=False)
    f.write('\n')

print(f"\nAdded {len(missing)} keys to all 3 locale files")
print("Sample additions:")
for key in missing[:10]:
    en_val = key_vals.get(key, key)
    print(f"  {key}: {en_val}")
