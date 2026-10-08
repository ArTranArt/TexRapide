with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

content = content.replace(
    "? 'bg-amber-600/10 border border-amber-500/30 text-amber-500'",
    "? 'bg-bg-input text-amber-500 border border-border-subtle shadow-md shadow-black/10'"
)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)
