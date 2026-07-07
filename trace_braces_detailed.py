with open('src/components/AdminSettings.tsx', 'r') as f:
    lines = f.readlines()

stack = []
for idx, line in enumerate(lines):
    line_num = idx + 1
    # Simple scanner for braces and parentheses
    for char_idx, char in enumerate(line):
        if char == '{':
            stack.append((line_num, char_idx, '{'))
        elif char == '}':
            if stack:
                stack.pop()
            else:
                print(f"Extra '}}' on line {line_num}:{char_idx}")
        elif char == '(':
            stack.append((line_num, char_idx, '('))
        elif char == ')':
            if stack:
                popped = stack.pop()
                if popped[2] != '(':
                    print(f"Mismatched ')' on line {line_num}:{char_idx} matching '{popped[2]}' from line {popped[0]}:{popped[1]}")
            else:
                print(f"Extra ')' on line {line_num}:{char_idx}")

print("Remaining stack at end of file:")
for item in stack:
    print(f"  Line {item[0]}:{item[1]} - '{item[2]}'")
