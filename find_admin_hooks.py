import re

with open("src/components/AdminSettings.tsx", "r", encoding="utf-8") as f:
    content = f.read()

lines = content.split('\n')
for idx, line in enumerate(lines):
    if "useState" in line or "useEffect" in line:
        # Trace backwards to find function headers
        # We can find the closest previous line starting with 'function' or containing '=>' or 'const' or 'class'
        func_found = "None"
        for i in range(idx - 1, -1, -1):
            prev_line = lines[i].strip()
            if prev_line.startswith("function ") or "const " in prev_line or "let " in prev_line or "export default function" in prev_line:
                # check if it defines a function
                if "(" in prev_line and "{" in prev_line or "=>" in prev_line:
                    func_found = f"Line {i+1}: {prev_line}"
                    break
        print(f"Hook on Line {idx+1}: {line.strip()}")
        print(f"  Under function: {func_found}")
        print()
