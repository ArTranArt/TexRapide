import re

with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

# 1. First, remove the old big toast.
old_toast_pattern = r'\{compileStatus === "compiling" && \(\s*<div className=\{`absolute bottom-0.*?</div>\s*\)\}'
content = re.sub(old_toast_pattern, '', content, flags=re.DOTALL)

# 2. Add local state inside Sidebar
# We look for: export function Sidebar() {
# and add our state just after it.
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
content = content.replace("export function Sidebar() {", "export function Sidebar() {\n" + state_code)

# 3. Insert the new small pills right after `<div className="w-[60px] ..."> ... </div>` inside the fixed container.
# It's at the same place as last time. Let's find `</div>` before `{/* Overlay de fond pour la console */}`
pill_code = """
        {/* Toast Pills */}
        {showToast && (
          <div className={`absolute bottom-0 ${floatingPos === "right" ? "right-[72px]" : "left-[72px]"} flex flex-col gap-2 z-50 pointer-events-none transition-all duration-300`}>
            {compileStatus === "compiling" && (
              <div className="bg-bg-sidebar/90 backdrop-blur-md border border-amber-500/30 text-amber-500 px-3 py-1.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2">
                <RefreshCw size={14} className="animate-spin" />
                Compilation...
              </div>
            )}
            {compileStatus === "success" && (
              <div className="bg-bg-sidebar/90 backdrop-blur-md border border-green-500/30 text-green-500 px-3 py-1.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2">
                <Check size={14} />
                Succès
              </div>
            )}
            {compileStatus === "error" && (
              <div className="bg-bg-sidebar/90 backdrop-blur-md border border-red-500/30 text-red-500 px-3 py-1.5 rounded-full shadow-lg text-xs font-semibold flex items-center gap-2">
                <X size={14} />
                Erreur
              </div>
            )}
          </div>
        )}
"""

pattern = r'(<div className="w-6 h-1 bg-text-subtle rounded-full" />\s*</div>\s*</div>\s*</div>)'

def repl(m):
    return m.group(1) + "\n" + pill_code

content = re.sub(pattern, repl, content, flags=re.DOTALL)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)
