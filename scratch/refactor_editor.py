import os
import re

# 1. Update AppContext.tsx to remove editor variables from context type
with open("src/context/AppContext.tsx", "r") as f:
    content = f.read()

content = re.sub(r'\s*editingFile: string;.*?\s*setHasUnsavedChanges: .*?;', '', content, flags=re.DOTALL)

with open("src/context/AppContext.tsx", "w") as f:
    f.write(content)

# 2. Update useAppState.ts
with open("src/hooks/useAppState.ts", "r") as f:
    content = f.read()

content = "import { useEditorStore } from '../store/editorStore';\n" + content

# Remove useState declarations
content = re.sub(r'const \[editingFile, setEditingFile\] = useState<string>\(""\);\n', '', content)
content = re.sub(r'const \[editorContent, setEditorContent\] = useState<string>\(""\);\n', '', content)
content = re.sub(r'const \[hasUnsavedChanges, setHasUnsavedChanges\] = useState\(false\);\n', '', content)

# Replace getters in functions with getState()
content = re.sub(r'(?<!\.)editingFile(?!\s*:)', 'useEditorStore.getState().editingFile', content)
content = re.sub(r'(?<!\.)editorContent(?!\s*:)', 'useEditorStore.getState().editorContent', content)
content = re.sub(r'(?<!\.)hasUnsavedChanges(?!\s*:)', 'useEditorStore.getState().hasUnsavedChanges', content)

# Replace setters
content = re.sub(r'setEditingFile\((.*?)\)', r'useEditorStore.setState({ editingFile: \1 })', content)
content = re.sub(r'setEditorContent\((.*?)\)', r'useEditorStore.setState({ editorContent: \1 })', content)
content = re.sub(r'setHasUnsavedChanges\((.*?)\)', r'useEditorStore.setState({ hasUnsavedChanges: \1 })', content)

# Remove them from return statement
content = re.sub(r'\s*useEditorStore\.getState\(\)\.editingFile,\n\s*useEditorStore\.getState\(\)\.editorContent,\n\s*useEditorStore\.getState\(\)\.hasUnsavedChanges,\n\s*useEditorStore\.setState\(\{ editingFile: .*? \}\),\n\s*useEditorStore\.setState\(\{ editorContent: .*? \}\),\n\s*useEditorStore\.setState\(\{ hasUnsavedChanges: .*? \}\),', '', content, flags=re.DOTALL)

# Let's just strip them from the return block explicitly
content = re.sub(r'\s*editingFile,\n', '\n', content)
content = re.sub(r'\s*editorContent,\n', '\n', content)
content = re.sub(r'\s*hasUnsavedChanges,\n', '\n', content)
content = re.sub(r'\s*setEditingFile,\n', '\n', content)
content = re.sub(r'\s*setEditorContent,\n', '\n', content)
content = re.sub(r'\s*setHasUnsavedChanges,\n', '\n', content)

with open("src/hooks/useAppState.ts", "w") as f:
    f.write(content)

