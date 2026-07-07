import re

with open("src/components/AdminSettings.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's clean the JSX to extract only the tags.
# First, remove JSX comments like {/* ... */}
clean_content = re.sub(r'\{/\*.*?\*/\}', '', content, flags=re.DOTALL)
# Remove standard JS/TS comments
clean_content = re.sub(r'/\*.*?\*/', '', clean_content, flags=re.DOTALL)
clean_content = re.sub(r'//.*', '', clean_content)

# We want to extract JSX tags in the return block.
# Let's find the main return block.
start_idx = clean_content.find("return (")
if start_idx == -1:
    print("Could not find 'return ('")
    exit()

# Scan from start_idx onwards
stack = []
tag_pattern = re.compile(r'<(/?[a-zA-Z0-9\.\-_]+)(?:\s+[^>]*?)?(/?)>')

# Since regex on raw strings with JSX attributes can be complex, let's parse character by character or line by line
lines = clean_content.splitlines()

for idx in range(len(lines)):
    line_no = idx + 1
    line = lines[idx]
    
    # We only care about lines inside the return block
    if line_no < 1200:
        continue
        
    # Find tags using regex. This is simplified but works for standard JSX tags.
    # To avoid matching '<' as less-than in comparisons (e.g., i < len),
    # let's only match strings starting with '<' and a letter/slash
    matches = re.finditer(r'<(/?[a-zA-Z][a-zA-Z0-9\.\-_]*)(?:\s+[^>]*?)?(/?)>', line)
    for m in matches:
        tag_name = m.group(1)
        is_self_closing = m.group(2) == "/"
        is_closing = tag_name.startswith("/")
        
        if is_self_closing:
            # Self closing tag, ignore
            continue
            
        if is_closing:
            actual_name = tag_name[1:]
            if stack:
                top_name, top_line = stack.pop()
                if top_name != actual_name:
                    print(f"Mismatch: Line {line_no} closed </{actual_name}>, but top of stack was <{top_name}> from line {top_line}")
                    # Push back to keep stack aligned if possible
                    stack.append((top_name, top_line))
            else:
                print(f"ERROR: Line {line_no} closed </{actual_name}> with empty stack!")
        else:
            # Skip common non-JSX symbols like standard JS comparisons in braces
            # e.g. < 0 or < usersList.length
            # If the line contains a curly brace '{' before '<', or we are inside a JS expression, we must be careful.
            # But usually JSX tag names are capitalized or lowercase HTML tags.
            stack.append((tag_name, line_no))

print("\n--- Remaining stack of unclosed tags ---")
for name, ln in stack:
    print(f"Line {ln}: <{name}>")
