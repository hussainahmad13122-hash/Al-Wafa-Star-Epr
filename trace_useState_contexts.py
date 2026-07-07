import os
import re

src_dir = "src"
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(".tsx"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Simple heuristic to find functions/callbacks calling useState
            # Let's find matches of useState, and look at the surrounding lines (e.g. 5 lines above) to see if it's inside an inner function or regular function
            lines = content.split('\n')
            for idx, line in enumerate(lines):
                if "useState" in line:
                    # Look back up to 15 lines to see what function defines this
                    context = []
                    for i in range(max(0, idx - 15), idx + 1):
                        context.append(f"{i+1}: {lines[i]}")
                    
                    # Print context if it looks like a helper function or nested function
                    # We can print all of them to inspect manually, or filter
                    context_str = "\n".join(context)
                    if any(x in context_str for x in ["function ", "const ", "let "]):
                        # Print file, line number and a snippet
                        print(f"--- File: {path} Line {idx+1} ---")
                        print("\n".join(context[-8:]))
                        print()
