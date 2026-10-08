with open("src/components/Project.tsx", "r") as f:
    proj = f.read()

proj = proj.replace("  const autoSaveEnabled = useSettingsStore(s => s.autoSaveEnabled);", "")
proj = proj.replace("const { activeProject,", "const { autoSaveEnabled, activeProject,")

with open("src/components/Project.tsx", "w") as f:
    f.write(proj)
