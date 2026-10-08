with open("src/hooks/useAppState.ts", "r") as f:
    app = f.read()

# Remove autosave from useAppState.ts
app = app.replace("""  // Auto-save logic
  useEffect(() => {
    if (!autoSaveEnabled || !activeProject || !editingFile || !hasUnsavedChanges) return;
    
    const delayDebounce = setTimeout(() => {
      saveFileContent(editingFile, useEditorStore.getState().editorContent);
    }, 1000); // 1s debounce

    return () => clearTimeout(delayDebounce);
  }, [autoSaveEnabled, activeProject, editingFile, hasUnsavedChanges]);""", "")

with open("src/hooks/useAppState.ts", "w") as f:
    f.write(app)

# Add autosave to Project.tsx
with open("src/components/Project.tsx", "r") as f:
    proj = f.read()

# Make sure autoSaveEnabled is grabbed from settings
if "const autoSaveEnabled =" not in proj:
    proj = proj.replace("const theme = useSettingsStore(s => s.theme);", "const theme = useSettingsStore(s => s.theme);\n  const autoSaveEnabled = useSettingsStore(s => s.autoSaveEnabled);")

# Add the useEffect
autosave_code = """
  // Auto-save logic
  useEffect(() => {
    if (!autoSaveEnabled || !activeProject || !editingFile || !hasUnsavedChanges) return;
    
    const delayDebounce = setTimeout(() => {
      saveFileContent(editingFile, editorContent);
    }, 1000); // 1s debounce

    return () => clearTimeout(delayDebounce);
  }, [autoSaveEnabled, editorContent, activeProject, editingFile, hasUnsavedChanges, saveFileContent]);
"""

proj = proj.replace("  return (\n    <>", autosave_code + "\n  return (\n    <>")

with open("src/components/Project.tsx", "w") as f:
    f.write(proj)
