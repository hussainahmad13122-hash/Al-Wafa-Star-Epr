import re

with open("src/components/AdminSettings.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

ranges = [(1463, 1513), (1665, 1796)]

stack = []

for start_line, end_line in ranges:
    print(f"\n--- Scanning lines {start_line} to {end_line} ---")
    for idx in range(start_line - 1, end_line):
        line_no = idx + 1
        line = lines[idx]
        
        # Clean comments and strings
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
                    start_tag, start_ln = stack.pop()
                    print(f"Line {line_no}: Closes <div> from line {start_ln}")
                else:
                    print(f"ERROR: Line {line_no}: Mismatched closing <div> tag!")
            else:
                stack.append((tag, line_no))
                print(f"Line {line_no}: Opens <div> {tag[:40]}")

print("\n--- Summary ---")
print(f"Unclosed divs inside appearance tab: {len(stack)}")
for tag, ln in stack:
    print(f"Line {ln}: {tag[:50]}...")
