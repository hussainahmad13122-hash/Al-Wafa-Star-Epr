with open('src/localDatabase.ts', 'r') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'getCurrentUserPermissions' in line:
        print(f"Line {idx+1}: {line.strip()}")
