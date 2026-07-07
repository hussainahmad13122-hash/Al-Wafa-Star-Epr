import re

with open('src/components/AdminSettings.tsx', 'r') as f:
    content = f.read()

# Search for classes like w-[...px] or min-w-[...px]
matches = re.finditer(r'(w|min-w|max-w)-\[(\d+px)\]', content)
for m in matches:
    # Find line number
    line_no = content[:m.start()].count('\n') + 1
    print(f"Line {line_no}: {m.group(0)}")
