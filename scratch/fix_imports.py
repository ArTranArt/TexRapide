import os

def fix_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
        
    if "useSettingsStore" in content and "import { useSettingsStore }" not in content:
        if "components" in filepath:
            content = "import { useSettingsStore } from '../store/settingsStore';\n" + content
        else:
            content = "import { useSettingsStore } from './store/settingsStore';\n" + content
            
    with open(filepath, 'w') as f:
        f.write(content)

components_dir = "src/components"
for file in os.listdir(components_dir):
    if file.endswith(".tsx"):
        fix_file(os.path.join(components_dir, file))
        
if os.path.exists("src/App.tsx"):
    fix_file("src/App.tsx")
