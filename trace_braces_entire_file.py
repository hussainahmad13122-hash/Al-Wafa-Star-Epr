import re

with open("src/components/AdminSettings.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Tracing curly braces from line 1...")

brace_stack = []

for idx in range(len(lines)):
    line_no = idx + 1
    line = lines[idx]
    
    # Strip comments
    line_clean = re.sub(r'\{/\*.*?\*/\}', '', line)
    line_clean = re.sub(r'/\*.*?\*/', '', line_clean)
    line_clean = re.sub(r'//.*', '', line_clean)
    
    # Strip simple quotes/strings
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
# Let's print the top 20 unclosed braces if any
for ln in brace_stack[:20]:
    print(f"Unclosed brace opened at line {ln}")
