with open("src/store/settingsStore.ts", "r") as f:
    content = f.read()

content = content.replace(
    'setTheme: (theme: "dark" | "light") => void;',
    'setTheme: (theme: "dark" | "light" | ((prev: "dark" | "light") => "dark" | "light")) => void;'
)

content = content.replace(
    'setTheme: (theme) => {',
    'setTheme: (theme) => set((state) => {\n    const newTheme = typeof theme === "function" ? theme(state.theme) : theme;\n    localStorage.setItem("texrapide_theme", newTheme);\n    document.documentElement.setAttribute("data-theme", newTheme);\n    return { theme: newTheme };\n  }),\n  //'
)

with open("src/store/settingsStore.ts", "w") as f:
    f.write(content)
