import os
import re

components_dir = "src/components"
for file in os.listdir(components_dir):
    if file.endswith(".tsx"):
        with open(os.path.join(components_dir, file), "r") as f:
            content = f.read()
            if "useAppContext" in content:
                print(f"File {file} uses useAppContext")
                # print first few lines of destructing
                match = re.search(r'const\s*\{([^}]+)\}\s*=\s*useAppContext\(\);', content)
                if match:
                    print(match.group(1).strip()[:100] + "...")
