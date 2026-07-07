import re

with open("src/components/AdminSettings.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

start_line = None
for idx, line in enumerate(lines):
    if "return (" in line and idx > 1100:
        start_line = idx + 1
        break

if start_line is None:
    start_line = 1200

print(f"Tracing curly braces from line {start_line}...")

brace_stack = []

for idx in range(start_line - 1, len(lines)):
    line_no = idx + 1
    line = lines[idx]
    
    # Strip comments
    line_clean = re.sub(r'\{/\*.*?\*/\}', '', line)
    line_clean = re.sub(r'/\*.*?\*/', '', line_clean)
    line_clean = re.sub(r'//.*', '', line_clean)
    
    # Trace { and }
    # Since strings can contain braces, let's temporarily strip simple quotes/strings
    line_clean = re.sub(r'".*?"', '""', line_clean)
    line_clean = re.sub(r'\'.*?\'', '\'\'', line_clean)
    line_clean = re.sub(r'`.*?`', '``', line_clean)
    
    for char in line_clean:
        if char == '{':
            brace_stack.append(line_no)
        elif char == '}':
            if brace_stack:
                start_ln = brace_stack.pop()
            else:
                print(f"ERROR: Line {line_no}: Mismatched closing brace '}}'")

print("\n--- Summary ---")
print(f"Remaining unclosed braces: {len(brace_stack)}")
for ln in brace_stack:
    print(f"Unclosed brace opened at line {ln}")
