import re

with open('src/hooks/useAppState.ts', 'r') as f:
    lines = f.readlines()

to_remove = [
    "const [theme, setTheme] =",
    "const [leftPanelWidth, setLeftPanelWidth] =",
    "const [topPanelHeight, setTopPanelHeight] =",
    "const [drawerHeight, setDrawerHeight] =",
    "const [fileExplorerWidth, setFileExplorerWidth] =",
    "const [pdfPosition, setPdfPosition] =",
    "const [showPdfPanel, setShowPdfPanel] =",
    "const [showFileTree, setShowFileTree] =",
    "const [editorFontSize, setEditorFontSize] =",
    "const [lineWrapping, setLineWrapping] =",
    "const [autoIndent, setAutoIndent] ="
]

effects_to_remove = [
    "texrapide_theme", "texrapide_left_panel_width", "texrapide_top_panel_height",
    "texrapide_drawer_height", "texrapide_file_explorer_width", "texrapide_pdf_position",
    "texrapide_show_pdf_panel", "texrapide_editor_font_size", "texrapide_auto_indent"
]

new_lines = []
skip = False
brackets = 0

for i, line in enumerate(lines):
    if skip:
        # Check for brackets to know when the block ends
        brackets += line.count('{') - line.count('}')
        if brackets <= 0 and ("});" in line or ");" in line):
            skip = False
            brackets = 0
        continue
        
    # Check if this line starts a block we want to remove
    matched = False
    for r in to_remove:
        if r in line:
            matched = True
            break
            
    if not matched and "useEffect(() => {" in line:
        # peek ahead to see if it's one of our effects
        # up to 5 lines ahead
        for j in range(i, min(i+10, len(lines))):
            for eff in effects_to_remove:
                if eff in lines[j]:
                    matched = True
                    break
            if matched: break
            
    if matched:
        skip = True
        brackets = line.count('{') - line.count('}')
        if brackets <= 0 and ("});" in line or ");" in line):
            skip = False
            brackets = 0
        continue
        
    new_lines.append(line)

content = "".join(new_lines)

# Now inject the getters at the top of useAppState hook
hook_start = "export function useAppState() {\n"
getters = """
  const theme = useSettingsStore(s => s.theme);
  const setTheme = useSettingsStore(s => s.setTheme);
  const leftPanelWidth = useSettingsStore(s => s.leftPanelWidth);
  const setLeftPanelWidth = useSettingsStore(s => s.setLeftPanelWidth);
  const topPanelHeight = useSettingsStore(s => s.topPanelHeight);
  const setTopPanelHeight = useSettingsStore(s => s.setTopPanelHeight);
  const drawerHeight = useSettingsStore(s => s.drawerHeight);
  const setDrawerHeight = useSettingsStore(s => s.setDrawerHeight);
  const fileExplorerWidth = useSettingsStore(s => s.fileExplorerWidth);
  const setFileExplorerWidth = useSettingsStore(s => s.setFileExplorerWidth);
  const pdfPosition = useSettingsStore(s => s.pdfPosition);
  const setPdfPosition = useSettingsStore(s => s.setPdfPosition);
  const showPdfPanel = useSettingsStore(s => s.showPdfPanel);
  const setShowPdfPanel = useSettingsStore(s => s.setShowPdfPanel);
  const showFileTree = useSettingsStore(s => s.showFileTree);
  const setShowFileTree = useSettingsStore(s => s.setShowFileTree);
  const editorFontSize = useSettingsStore(s => s.editorFontSize);
  const setEditorFontSize = useSettingsStore(s => s.setEditorFontSize);
  const lineWrapping = useSettingsStore(s => s.lineWrapping);
  const setLineWrapping = useSettingsStore(s => s.setLineWrapping);
  const autoIndent = useSettingsStore(s => s.autoIndent);
  const setAutoIndent = useSettingsStore(s => s.setAutoIndent);
"""

# Only inject if not already there
if "useSettingsStore(s => s.theme)" not in content:
    content = content.replace(hook_start, hook_start + getters)

if "useSettingsStore" not in content[:200]:
    content = "import { useSettingsStore } from '../store/settingsStore';\n" + content

with open('src/hooks/useAppState.ts', 'w') as f:
    f.write(content)

print("Cleaned useAppState")
