import re

with open("src/components/AdminSettings.tsx", "r", encoding="utf-8") as f:
    content = f.read()

tabs = [
    ("profile", r'activeTab === "profile"'),
    ("appearance", r'activeTab === "appearance"'),
    ("security", r'activeTab === "security"'),
    ("password_security", r'activeTab === "password_security"'),
    ("role_permissions", r'activeTab === "role_permissions"'),
    ("active_devices", r'activeTab === "active_devices"'),
    ("database", r'activeTab === "database"'),
]

lines = content.splitlines()

# Find the start line of each tab
tab_ranges = []
for i, (tab_name, pattern) in enumerate(tabs):
    start_ln = None
    for idx, line in enumerate(lines):
        if pattern in line and "<div" in line and "activeTab" in line:
            start_ln = idx + 1
            break
    tab_ranges.append((tab_name, start_ln))

print("Detected Tab Start Lines:")
for name, ln in tab_ranges:
    print(f" - {name}: Line {ln}")

# For each tab, let's find the closing tag by tracking the balance of that tab's wrapper
for i, (name, start_ln) in enumerate(tab_ranges):
    if start_ln is None:
        print(f"Error: Could not find start for {name}")
        continue
    
    # We trace from start_ln onwards until the main wrapper's div is closed (stack of that div becomes 0)
    stack = []
    closed_at = None
    for idx in range(start_ln - 1, len(lines)):
        line_no = idx + 1
        line = lines[idx]
        
        # Clean comments
        line_clean = re.sub(r'\{/\*.*?\*/\}', '', line)
        line_clean = re.sub(r'/\*.*?\*/', '', line_clean)
        line_clean = re.sub(r'//.*', '', line_clean)
        line_clean = re.sub(r'".*?"', '""', line_clean)
        line_clean = re.sub(r'\'.*?\'', '\'\'', line_clean)
        
        matches = re.finditer(r'(</?div\b[^>]*>)', line_clean, re.IGNORECASE)
        for m in matches:
            tag = m.group(1)
            is_close = tag.startswith("</")
            is_self_closing = tag.endswith("/>")
            if is_self_closing:
                continue
            
            if is_close:
                if stack:
                    stack.pop()
                    if not stack:
                        closed_at = line_no
                        break
            else:
                stack.append(line_no)
        if closed_at is not None:
            break
            
    print(f"Tab {name} starts on line {start_ln} and its wrapper closes on line {closed_at}")
