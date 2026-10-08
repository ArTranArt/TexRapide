with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

state_code = """
  const [showToast, setShowToast] = React.useState(false);
  React.useEffect(() => {
    if (compileStatus !== "idle") {
      setShowToast(true);
      // Keep "compiling" visible until it finishes. Only auto-hide success/error.
      if (compileStatus !== "compiling") {
        const t = setTimeout(() => setShowToast(false), 3000);
        return () => clearTimeout(t);
      }
    } else {
      setShowToast(false);
    }
  }, [compileStatus]);
"""

# Remove the state code from the top
content = content.replace("export function Sidebar() {\n" + state_code, "export function Sidebar() {\n")

# Find the end of `useAppContext();` and insert the state code after it
content = content.replace("useAppContext();", "useAppContext();\n" + state_code)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)
