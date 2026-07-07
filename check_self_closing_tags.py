import re

with open("src/components/AdminSettings.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

start_line = 1200
end_line = len(lines)

self_closing_candidates = ["input", "img", "br", "hr", "meta"]

for idx in range(start_line - 1, end_line):
    line_no = idx + 1
    line = lines[idx]
    
    # Simple search for candidate tags
    for cand in self_closing_candidates:
        matches = re.finditer(rf'<{cand}\b([^>]*?)>', line, re.IGNORECASE)
        for m in matches:
            attrs = m.group(1)
            if not attrs.endswith("/"):
                # Double check if it ends with / before the closing bracket
                if not attrs.strip().endswith("/"):
                    print(f"Line {line_no}: Found <{cand}> tag that might not be self-closed: {line.strip()}")
