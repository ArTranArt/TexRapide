import re

with open("src/hooks/useAppState.ts", "r") as f:
    content = f.read()

if "import { useEditorStore }" not in content:
    content = "import { useEditorStore } from '../store/editorStore';\n" + content

# Remove useStates
content = re.sub(r'\s*const \[editingFile, setEditingFile\] = useState<string>\(""\);\n', '\n', content)
content = re.sub(r'\s*const \[editorContent, setEditorContent\] = useState<string>\(""\);\n', '\n', content)
content = re.sub(r'\s*const \[hasUnsavedChanges, setHasUnsavedChanges\] = useState\(false\);\n', '\n', content)

# Replace all occurrences of setEditorContent, setEditingFile, setHasUnsavedChanges
content = re.sub(r'setEditorContent\((.*?)\)', r'useEditorStore.getState().setEditorContent(\1)', content)
content = re.sub(r'setEditingFile\((.*?)\)', r'useEditorStore.getState().setEditingFile(\1)', content)
content = re.sub(r'setHasUnsavedChanges\((.*?)\)', r'useEditorStore.getState().setHasUnsavedChanges(\1)', content)

# Replace getters with getState() inside functions
# We have to be careful with dependency arrays.
# We will just globally replace `editingFile`, `editorContent`, `hasUnsavedChanges` EXCEPT in variable declarations and destructuring.

def replace_getter(name):
    global content
    # Replace when it's a standalone word, not preceded by a dot, not in a destructuring or parameter
    # Let's just do a smart regex:
    # Match `name` not preceded by `{ `, `.` or `const `
    pattern = r'(?<!\.)(?<!\{\s)(?<!const\s)\b' + name + r'\b(?!\s*:)'
    content = re.sub(pattern, f'useEditorStore.getState().{name}', content)

replace_getter("editingFile")
replace_getter("editorContent")
replace_getter("hasUnsavedChanges")

# Now we need to fix the dependency arrays because `useEditorStore.getState().editingFile` is invalid in deps.
# Let's just remove them from dependency arrays.
content = re.sub(r',\s*useEditorStore\.getState\(\)\.editingFile', '', content)
content = re.sub(r',\s*useEditorStore\.getState\(\)\.editorContent', '', content)
content = re.sub(r',\s*useEditorStore\.getState\(\)\.hasUnsavedChanges', '', content)
content = re.sub(r'useEditorStore\.getState\(\)\.editingFile\s*,?', '', content)
content = re.sub(r'useEditorStore\.getState\(\)\.editorContent\s*,?', '', content)
content = re.sub(r'useEditorStore\.getState\(\)\.hasUnsavedChanges\s*,?', '', content)

# We also need to fix `forwardSearchRefs.current = { activeProject, editingFile, mainFile };`
content = content.replace("editingFile: useEditorStore.getState().editingFile", "editingFile: useEditorStore.getState().editingFile") # Already replaced correctly by regex

# Let's clean up the return block of useAppState
content = re.sub(r'\s*useEditorStore\.getState\(\)\.editingFile,?', '', content)
content = re.sub(r'\s*useEditorStore\.getState\(\)\.editorContent,?', '', content)
content = re.sub(r'\s*useEditorStore\.getState\(\)\.hasUnsavedChanges,?', '', content)
content = re.sub(r'\s*useEditorStore\.getState\(\)\.setEditingFile,?', '', content)
content = re.sub(r'\s*useEditorStore\.getState\(\)\.setEditorContent,?', '', content)
content = re.sub(r'\s*useEditorStore\.getState\(\)\.setHasUnsavedChanges,?', '', content)

with open("src/hooks/useAppState.ts", "w") as f:
    f.write(content)
