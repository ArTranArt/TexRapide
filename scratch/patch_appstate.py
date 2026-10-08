import re

with open("src/hooks/useAppState.ts", "r") as f:
    content = f.read()

# Replace setEditorContent(...) with useEditorStore.getState().setEditorContent(...)
content = re.sub(r'setEditorContent\((.*?)\)', r'useEditorStore.getState().setEditorContent(\1)', content)

# For editorContent, replace it with useEditorStore.getState().editorContent where it's used as a value.
# Be careful not to replace it in dependency arrays yet.

# Let's replace editorContent inside functions:
# We can just replace all standalone `editorContent` with `useEditorStore.getState().editorContent`
# EXCEPT in dependency arrays `[..., editorContent, ...]`
# This is tricky with regex.

# A much safer approach:
# Just let `useAppState` subscribe to `editorContent` but ONLY for the auto-save!
# Wait! If `useAppState` uses `const editorContent = useEditorStore(s => s.editorContent)`, it WILL re-render!
# The whole point is to avoid `useAppState` re-rendering on every keystroke.
