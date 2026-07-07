import re

with open("src/components/AdminSettings.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

start_line = 1798
end_line = 2382

stack = []

# Regex to match any JSX opening or closing tag
# (e.g., <div>, </div>, <table ...>, </table>, <input ... />)
tag_pattern = re.compile(r'<(/?[a-zA-Z][a-zA-Z0-9\.\-_]*)(?:\s+[^>]*?)?(/?)>')

for idx in range(start_line - 1, end_line):
    line_no = idx + 1
    line = lines[idx]
    
    # Clean comments and strings to avoid matching quotes or commented code
    line_clean = re.sub(r'\{/\*.*?\*/\}', '', line)
    line_clean = re.sub(r'/\*.*?\*/', '', line_clean)
    line_clean = re.sub(r'//.*', '', line_clean)
    line_clean = re.sub(r'".*?"', '""', line_clean)
    line_clean = re.sub(r'\'.*?\'', '\'\'', line_clean)
    
    # We find all tags on this line
    matches = []
    # Let's do a character-by-character search to find tags, handling multiline attributes
    # Wait, let's just find tags using the regex. It's usually fine if we look at the results.
    for m in tag_pattern.finditer(line_clean):
        tag = m.group(0)
        name = m.group(1)
        is_closing = name.startswith("/")
        is_self_closing = m.group(2) == "/" or tag.endswith("/>")
        
        if is_self_closing:
            continue
            
        if is_closing:
            tag_name = name[1:]
            matches.append(("close", tag_name, line_no))
        else:
            matches.append(("open", name, line_no))

    for action, name, ln in matches:
        if action == "open":
            stack.append((name, ln))
            print(f"Line {ln}: Opens <{name}>")
        else:
            if stack:
                top_name, top_ln = stack.pop()
                if top_name != name:
                    print(f"ERROR: Line {ln}: Closes </{name}> but top of stack was <{top_name}> from line {top_ln}")
                    # Put it back to try to keep alignment
                    stack.append((top_name, top_ln))
                else:
                    print(f"Line {ln}: Closes </{name}> from line {top_ln}")
            else:
                print(f"ERROR: Line {ln}: Closes </{name}> but stack is empty!")

print("\n--- Summary ---")
print(f"Unclosed tags in security tab stack: {len(stack)}")
for name, ln in stack:
    print(f"Line {ln}: <{name}>")
