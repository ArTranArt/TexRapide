import os
import re

components = ["Dashboard", "Project", "Settings", "Help"]

for comp in components:
    filepath = f"src/components/{comp}.tsx"
    with open(filepath, "r") as f:
        content = f.read()

    # Find `{view === "..." && (` and remove it
    # We will just replace it with `<>`
    # But wait, it's wrapped in `<> {view === "..." && ( <div...> )} </>`
    # It's safer to just let the double check exist. It's totally harmless.
    # React will evaluate `{view === "dashboard" && <Dashboard />}` in App
    # Then Dashboard evaluates `{view === "dashboard" && ...}` which is true.
    pass
