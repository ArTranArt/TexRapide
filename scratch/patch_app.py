with open("src/App.tsx", "r") as f:
    content = f.read()

# Replace the block:
#           <Dashboard />
#           <Project />
#           <Settings />
#           <Help />
# With conditional rendering.

import re

# Find the block
pattern = r'(<Dashboard />\s*<Project />\s*<Settings />\s*<Help />)'
replacement = """
          {view === "dashboard" && <Dashboard />}
          {view === "project" && <Project />}
          {view === "settings" && <Settings />}
          {view === "help" && <Help />}
"""
new_content = re.sub(pattern, replacement.strip(), content)

with open("src/App.tsx", "w") as f:
    f.write(new_content)
