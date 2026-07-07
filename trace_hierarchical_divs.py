import re

def trace_hierarchy(filename):
    with open(filename, "r") as f:
        content = f.read()

    lines = content.split('\n')
    stack = []
    
    for idx, line in enumerate(lines):
        line_num = idx + 1
        clean_line = line.split('//')[0]
        clean_line = re.sub(r'\{\/\*.*?\*\/\}', '', clean_line)
        
        pos = 0
        while True:
            open_idx = clean_line.find('<div', pos)
            close_idx = clean_line.find('</div', pos)
            
            if open_idx == -1 and close_idx == -1:
                break
                
            if open_idx != -1 and (close_idx == -1 or open_idx < close_idx):
                # Check self-closing
                end_tag = clean_line.find('>', open_idx)
                if end_tag != -1 and clean_line[end_tag-1] == '/':
                    pos = end_tag + 1
                    continue
                
                # Extract class or ID if any to identify the div
                tag_content = clean_line[open_idx:end_tag+1] if end_tag != -1 else clean_line[open_idx:open_idx+100]
                stack.append((line_num, tag_content))
                
                # Check if it's a structural div
                if "col-span" in tag_content or "grid-cols" in tag_content or "activeTab" in tag_content:
                    print(f"L{line_num}: OPEN {tag_content.strip()} - Nesting level: {len(stack)}")
                
                pos = open_idx + 4
            else:
                if stack:
                    closed_line, closed_tag = stack.pop()
                    # Check if the closed div was structural
                    if "col-span" in closed_tag or "grid-cols" in closed_tag or "activeTab" in closed_tag:
                        print(f"L{line_num}: CLOSE matching L{closed_line}: {closed_tag.strip()} - Nesting level: {len(stack)}")
                else:
                    print(f"L{line_num}: UNMATCHED CLOSE")
                pos = close_idx + 5

trace_hierarchy("src/components/AdminSettings.tsx")
