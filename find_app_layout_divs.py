with open('src/App.tsx', 'r') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'flex' in line or 'grid' in line:
        if idx > 1650 and idx < 1740:
            print(f"Line {idx+1}: {line.strip()}")
