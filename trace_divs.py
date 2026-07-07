import re

with open("src/components/AdminSettings.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

return_lines = lines[1199:3471]

open_divs_stack = []

print("Detailed Tracing:")
for idx, line in enumerate(return_lines):
    line_no = 1200 + idx
    
    # Remove comments and string literals
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
            if open_divs_stack:
                start_tag, start_line = open_divs_stack.pop()
                print(f"Line {line_no}: Closes <div> from line {start_line} (stack size: {len(open_divs_stack)})")
            else:
                print(f"ERROR: Line {line_no}: Mismatched closing </div> tag!")
        else:
            open_divs_stack.append((tag, line_no))
            print(f"Line {line_no}: Opens <div> {tag[:40]} (stack size: {len(open_divs_stack)})")
