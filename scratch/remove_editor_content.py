import re

with open("src/hooks/useAppState.ts", "r") as f:
    content = f.read()

# Make sure useEditorStore is imported
if "import { useEditorStore }" not in content:
    content = "import { useEditorStore } from '../store/editorStore';\n" + content

# 1. Remove useState
content = re.sub(r'\s*const \[editorContent, setEditorContent\] = useState<string>\(""\);\n', '\n', content)

# 2. Replace setters: setEditorContent(X) -> useEditorStore.getState().setEditorContent(X)
content = re.sub(r'setEditorContent\((.*?)\)', r'useEditorStore.getState().setEditorContent(\1)', content)

# 3. Replace getters inside functions: editorContent -> useEditorStore.getState().editorContent
# We must be careful not to replace it inside dependency arrays yet.
# We will just replace it where it's passed to `saveFileContent` or checked in `if (editorContent)`.
content = re.sub(r'(?<!\.)(?<!\{ )(?<!const )(?<!\[)editorContent(?!:)(?!,\s)', 'useEditorStore.getState().editorContent', content)
# Wait, my regex might be flaky.

# A simpler way: Just replace standalone occurrences
content = content.replace("await saveFileContent(editingFile, editorContent);", "await saveFileContent(editingFile, useEditorStore.getState().editorContent);")
content = content.replace("saveFileContent(editingFile, editorContent);", "saveFileContent(editingFile, useEditorStore.getState().editorContent);")
content = content.replace("if (pendingHighlightLine && editorContent) {", "if (pendingHighlightLine && useEditorStore.getState().editorContent) {")

# 4. Remove from dependency arrays
content = content.replace("editorContent, pendingHighlightLine", "pendingHighlightLine")
content = content.replace("autoSaveEnabled, editorContent, activeProject", "autoSaveEnabled, activeProject")
content = content.replace("editorContent, activeProject, editingFile", "activeProject, editingFile")

# 5. Remove from return block
content = re.sub(r'\s*editorContent,\n', '\n', content)
content = re.sub(r'\s*setEditorContent,\n', '\n', content)

with open("src/hooks/useAppState.ts", "w") as f:
    f.write(content)

# 6. Update AppContext.tsx to remove it from the type
with open("src/context/AppContext.tsx", "r") as f:
    context = f.read()
context = re.sub(r'\s*editorContent: string;\n', '\n', context)
context = re.sub(r'\s*setEditorContent: \(.*?\) => void;\n', '\n', context)
with open("src/context/AppContext.tsx", "w") as f:
    f.write(context)

