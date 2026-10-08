import re

with open('src/hooks/useAppState.ts', 'r') as f:
    content = f.read()

to_remove = [
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
]

# Remove single line useState
for var in to_remove:
    pattern = r'\s*const\s+\[\s*' + var + r'\s*,\s*set[A-Z]\w+\s*\]\s*=\s*useState[^\n]+;\n?'
    content = re.sub(pattern, '', content)

# Remove multiline useState (like theme, leftPanelWidth...)
# These start with const [var, setVar] = useState(() => { ... });
multiline_vars = ["theme", "leftPanelWidth", "topPanelHeight", "drawerHeight", "fileExplorerWidth", "pdfPosition", "showPdfPanel", "editorFontSize", "autoIndent"]

for var in multiline_vars:
    # Match the block up to the first `});`
    pattern = r'\s*const\s+\[\s*' + var + r'\s*,\s*set[A-Z]\w+\s*\]\s*=\s*useState.*?\}\);\n?'
    content = re.sub(pattern, '', content, flags=re.DOTALL)

# Remove useEffects for these vars
use_effect_patterns = [
    r'\s*useEffect\(\(\)\s*=>\s*\{\s*localStorage\.setItem\("texrapide_theme".*?\}\s*,\s*\[theme\]\);\n?',
    r'\s*useEffect\(\(\)\s*=>\s*\{\s*localStorage\.setItem\("texrapide_left_panel_width".*?\}\s*,\s*\[leftPanelWidth\]\);\n?',
    r'\s*useEffect\(\(\)\s*=>\s*\{\s*localStorage\.setItem\("texrapide_editor_font_size".*?\}\s*,\s*\[editorFontSize\]\);\n?',
    r'\s*useEffect\(\(\)\s*=>\s*\{\s*localStorage\.setItem\("texrapide_auto_indent".*?\}\s*,\s*\[autoIndent\]\);\n?',
    r'\s*useEffect\(\(\)\s*=>\s*\{\s*localStorage\.setItem\("texrapide_show_pdf_panel".*?\}\s*,\s*\[showPdfPanel\]\);\n?',
    r'\s*useEffect\(\(\)\s*=>\s*\{\s*localStorage\.setItem\("texrapide_pdf_position".*?\}\s*,\s*\[pdfPosition\]\);\n?',
    r'\s*useEffect\(\(\)\s*=>\s*\{\s*localStorage\.setItem\("texrapide_top_panel_height".*?\}\s*,\s*\[topPanelHeight\]\);\n?',
    r'\s*useEffect\(\(\)\s*=>\s*\{\s*localStorage\.setItem\("texrapide_drawer_height".*?\}\s*,\s*\[drawerHeight\]\);\n?',
    r'\s*useEffect\(\(\)\s*=>\s*\{\s*localStorage\.setItem\("texrapide_file_explorer_width".*?\}\s*,\s*\[fileExplorerWidth\]\);\n?'
]

for pat in use_effect_patterns:
    content = re.sub(pat, '', content, flags=re.DOTALL)

# Remove the keys from the return block
for var in to_remove:
    # Match exactly the key (and optional trailing comma) inside the return block
    pattern = r'^\s*' + var + r'\s*,\n?'
    content = re.sub(pattern, '', content, flags=re.MULTILINE)

# Inject getters at the top of the hook if they are used elsewhere in useAppState
hook_start = r'(export function useAppState\(\) \{\n?)'
getters = "\n".join([f"  const {v} = useSettingsStore(s => s.{v});" for v in to_remove if not v.startswith("set")])
getters += "\n" + "\n".join([f"  const {v} = useSettingsStore(s => s.{v});" for v in to_remove if v.startswith("set")])
content = re.sub(hook_start, r'\1' + getters + '\n', content)

import_stmt = "import { useSettingsStore } from '../store/settingsStore';\n"
if "useSettingsStore" not in content:
    content = import_stmt + content

with open('src/hooks/useAppState.ts', 'w') as f:
    f.write(content)
print("Cleaned useAppState")
