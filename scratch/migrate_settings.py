import os
import re

SETTINGS_PROPS = {
    "theme", "setTheme",
    "leftPanelWidth", "setLeftPanelWidth",
    "topPanelHeight", "setTopPanelHeight",
    "drawerHeight", "setDrawerHeight",
    "fileExplorerWidth", "setFileExplorerWidth",
    "pdfPosition", "setPdfPosition",
    "showPdfPanel", "setShowPdfPanel",
    "showFileTree", "setShowFileTree",
    "editorFontSize", "setEditorFontSize",
    "lineWrapping", "setLineWrapping",
    "autoIndent", "setAutoIndent"
}

def migrate_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Match the useAppContext destructuring block
    pattern = r'const\s+\{([^}]+)\}\s*=\s*useAppContext\(\);'
    match = re.search(pattern, content)
    if not match:
        return
        
    vars_str = match.group(1)
    
    # Split into list of variables, ignoring comments if any (though unlikely here)
    raw_vars = [v.strip() for v in vars_str.split(',')]
    vars_list = []
    for v in raw_vars:
        if not v: continue
        if ":" in v:
            orig, alias = [x.strip() for x in v.split(":")]
            vars_list.append((orig, alias))
        else:
            vars_list.append((v, v))
            
    # Everything before the match and after the match
    before = content[:match.start()]
    after = content[match.end():]
    
    # Check usages in `after`
    used_context_vars = []
    used_settings_vars = []
    
    for orig, alias in vars_list:
        # Check if `alias` is used in `after`
        # Using a simple regex word boundary
        usage_pattern = r'\b' + re.escape(alias) + r'\b'
        if re.search(usage_pattern, after):
            if orig in SETTINGS_PROPS:
                used_settings_vars.append((orig, alias))
            else:
                used_context_vars.append((orig, alias))
                
    # Build new statements
    new_statements = []
    
    if used_settings_vars:
        for orig, alias in used_settings_vars:
            if orig == alias:
                new_statements.append(f"  const {orig} = useSettingsStore(s => s.{orig});")
            else:
                new_statements.append(f"  const {alias} = useSettingsStore(s => s.{orig});")
                
    if used_context_vars:
        ctx_list = []
        for orig, alias in used_context_vars:
            if orig == alias:
                ctx_list.append(orig)
            else:
                ctx_list.append(f"{orig}: {alias}")
        new_statements.append(f"  const {{ {', '.join(ctx_list)} }} = useAppContext();")
        
    new_block = "\n".join(new_statements)
    
    new_content = before + new_block + after
    
    # Add import if needed
    if used_settings_vars and "useSettingsStore" not in new_content:
        import_match = list(re.finditer(r'^import .*?;$', new_content, re.MULTILINE))
        if import_match:
            last_import = import_match[-1]
            insert_pos = last_import.end() + 1
            # Adjust path depending on file location
            # If in src/components/, it's '../store/settingsStore'
            # If in src/, it's './store/settingsStore'
            if "components" in filepath:
                imp = "import { useSettingsStore } from '../store/settingsStore';\n"
            else:
                imp = "import { useSettingsStore } from './store/settingsStore';\n"
            new_content = new_content[:insert_pos] + imp + new_content[insert_pos:]
            
    with open(filepath, 'w') as f:
        f.write(new_content)
    print(f"Migrated {filepath} (Settings: {len(used_settings_vars)}, Context: {len(used_context_vars)})")

# Fix AppContext.tsx to remove unused imports maybe? Not needed.
components_dir = "src/components"
for file in os.listdir(components_dir):
    if file.endswith(".tsx"):
        migrate_file(os.path.join(components_dir, file))
        
if os.path.exists("src/App.tsx"):
    migrate_file("src/App.tsx")

