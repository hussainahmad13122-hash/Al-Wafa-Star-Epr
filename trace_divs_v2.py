import re

with open("src/components/AdminSettings.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Let's find the start of the main JSX return
start_idx = None
for idx, line in enumerate(lines):
    if "return (" in line and idx > 1100:  # The main return is near line 1200
        start_idx = idx
        break

if start_idx is None:
    # fallback
    start_idx = 1199

print(f"Starting trace from line {start_idx + 1}...")

open_divs_stack = []

for idx in range(start_idx, len(lines)):
    line_no = idx + 1
    line = lines[idx]
    
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
                print(f"ERROR: Line {line_no}: Mismatched closing </div> tag! No matching open <div> found.")
        else:
            open_divs_stack.append((tag, line_no))
            print(f"Line {line_no}: Opens <div> {tag[:40]} (stack size: {len(open_divs_stack)})")

print("\n--- Summary ---")
print(f"Remaining unclosed divs: {len(open_divs_stack)}")
for tag, line in open_divs_stack:
    print(f"Unclosed <div> at line {line}: {tag[:40]}...")
