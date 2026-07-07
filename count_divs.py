with open("src/components/AdminSettings.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import re

# Remove strings and comments
content_clean = re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.DOTALL)
content_clean = re.sub(r'/\*.*?\*/', '', content_clean, flags=re.DOTALL)
content_clean = re.sub(r'//.*', '', content_clean)
content_clean = re.sub(r'".*?"', '""', content_clean, flags=re.DOTALL)
content_clean = re.sub(r'\'.*?\'', '\'\'', content_clean, flags=re.DOTALL)

open_tags = len(re.findall(r'<div\b', content_clean, re.IGNORECASE))
close_tags = len(re.findall(r'</div\b', content_clean, re.IGNORECASE))
self_closing = len(re.findall(r'<div\s+[^>]*/>', content_clean, re.IGNORECASE))

print(f"Total <div: {open_tags}")
print(f"Total </div: {close_tags}")
print(f"Total self-closing <div/>: {self_closing}")
print(f"Net divs opened: {open_tags - self_closing - close_tags}")
