import re

def analyze_div_tags(filename):
    print("Reading file:", filename)
    with open(filename, "r") as f:
        content = f.read()

    print("File size:", len(content))
    lines = content.split('\n')
    print("Total lines read:", len(lines))
    
    stack = []
    
    for idx, line in enumerate(lines):
        line_num = idx + 1
        clean_line = line.split('//')[0]
        clean_line = re.sub(r'\{\/\*.*?\*\/\}', '', clean_line)
        
        # Check if line contains a tab condition
        if 'activeTab' in line:
            print(f"DEBUG: Found activeTab at line {line_num}: {line.strip()}")
            if '===' in line:
                print(f"--- TAB CONDITION FOUND at Line {line_num}: {line.strip()} ---")
                print(f"Current open divs in stack: {len(stack)}")
                for s_num, s_text in stack[-3:]: # Print top 3 of the stack
                    print(f"  [Open] Line {s_num}: {s_text}")
        
        pos = 0
        while True:
            open_idx = clean_line.find('<div', pos)
            close_idx = clean_line.find('</div', pos)
            
            if open_idx == -1 and close_idx == -1:
                break
                
            if open_idx != -1 and (close_idx == -1 or open_idx < close_idx):
                # Check if it's a self-closing div
                end_tag = clean_line.find('>', open_idx)
                if end_tag != -1 and clean_line[end_tag-1] == '/':
                    pos = end_tag + 1
                else:
                    stack.append((line_num, line.strip()))
                    pos = open_idx + 4
            else:
                if stack:
                    stack.pop()
                else:
                    print(f"Error: Unmatched closing </div> at line {line_num}: {line.strip()}")
                pos = close_idx + 5

    print(f"\nAnalysis complete. Remaining unclosed divs in stack: {len(stack)}")

analyze_div_tags("src/components/AdminSettings.tsx")
