with open("src/store/settingsStore.ts", "r") as f:
    content = f.read()

content = content.replace("create<SettingsState>((set)", "create<SettingsState>()((set)")

with open("src/store/settingsStore.ts", "w") as f:
    f.write(content)
