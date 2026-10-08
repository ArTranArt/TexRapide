with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

# 1. Fix compile button (remove animate-spin from button)
content = content.replace(
    "? 'bg-amber-600/10 border border-amber-500/30 text-amber-500 animate-spin'",
    "? 'bg-amber-600/10 border border-amber-500/30 text-amber-500'"
)

# 2. Fix terminal button (remove red border/bg)
content = content.replace(
    "? 'bg-red-600/10 text-red-400 border-red-500/30 animate-blink-red cursor-pointer shadow-lg shadow-red-500/20'",
    "? 'bg-bg-input text-red-400 border-border-subtle hover:bg-bg-input-hover cursor-pointer shadow-md shadow-black/10'"
)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)
