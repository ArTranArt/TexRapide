import os
import re

def migrate_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Replace import
    content = re.sub(
        r'import\s+\{\s*useAppContext\s*\}\s+from\s+[\'"]\.\./context/AppContext[\'"];?',
        r"import { useAppSelector } from '../context/AppContext';",
        content
    )

    pattern = r'(const\s+\{\s*)([^}]+)(\s*\}\s*=\s*useAppContext\(\);)'
    match = re.search(pattern, content)
    if not match:
        return
        
    start_str = match.group(1)
    vars_str = match.group(2)
    end_str = match.group(3)
    
    vars_list = [v.strip() for v in vars_str.split(',') if v.strip()]
    
    new_statements = []
    for v in vars_list:
        if ":" in v:
            orig, alias = [x.strip() for x in v.split(":")]
            new_statements.append(f"  const {alias} = useAppSelector(s => s.{orig});")
        else:
            new_statements.append(f"  const {v} = useAppSelector(s => s.{v});")
            
    new_block = "\n".join(new_statements) + "\n"
    new_content = content[:match.start()] + new_block + content[match.end():]
    
    with open(filepath, 'w') as f:
        f.write(new_content)
    print(f"Migrated {filepath}")

components_dir = "src/components"
for file in os.listdir(components_dir):
    if file.endswith(".tsx"):
        migrate_file(os.path.join(components_dir, file))
        
migrate_file("src/App.tsx")
