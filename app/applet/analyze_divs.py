import re

def analyze_div_tags(filename):
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

    print(f"Analysis complete. Remaining unclosed divs in stack: {len(stack)}")
    for item in stack:
        print(f"Unclosed <div> at line {item[0]}: {item[1]}")

analyze_div_tags("src/components/AdminSettings.tsx")
