import re

with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

# 1. Fix the compile button border
# Replace:
# ? 'bg-amber-600/10 border border-amber-500/30 text-amber-500'
# With:
# ? 'bg-bg-input border border-border-subtle text-amber-500 shadow-md shadow-black/10'

content = content.replace(
    "? 'bg-amber-600/10 border border-amber-500/30 text-amber-500'",
    "? 'bg-bg-input border border-border-subtle text-amber-500 shadow-md shadow-black/10'"
)

# 2. Add the notification popup at the bottom of the sidebar div
# Look for the end of the root Sidebar div (around where the settings button or the end of the div is).
# Actually, the floating div is wrapped in `<div className="w-[60px] ...">`
# Let's just insert it right after that inner div.

# The root of Sidebar is:
#     <div 
#        className={`fixed bottom-6 ${floatingPos === "right" ? "right-6" : "left-6"} z-50 flex flex-col gap-2 ${floatingDragOffset === 0 ? 'transition-all duration-300 ease-in-out' : ''}`}
#        style={{ transform: floatingDragOffset ? `translateX(${floatingDragOffset}px)` : 'none' }}
#      >
#        <div className="w-[60px] ...">
#          ...
#        </div>
#        ...
#      </div>

# I will find the closing `</>  );` of Sidebar, wait, no.
# Let's insert it right after `<div className="w-[60px] flex flex-col items-center bg-bg-sidebar/90 backdrop-blur-md p-2 rounded-2xl border border-border-subtle shadow-xl shadow-black/20">`
# Actually, just insert it before the closing `</div>` of the root fixed div.
# We can search for the end of the return statement.

insert_code = """
        {compileStatus === "compiling" && (
          <div className={`absolute bottom-0 ${floatingPos === "right" ? "right-[72px]" : "left-[72px]"} w-64 bg-bg-card border border-amber-500/30 rounded-xl p-3 shadow-xl z-50 text-sm animate-fade-in`}>
            <div className="flex items-center gap-2 text-amber-500 mb-1 font-semibold">
              <RefreshCw size={14} className="animate-spin" />
              Compilation en cours...
            </div>
            <div className="text-text-subtle text-xs leading-relaxed">
              Lors du premier lancement, Tectonic télécharge les paquets LaTeX requis. Les prochaines fois seront instantanées !
            </div>
          </div>
        )}
"""

pattern = r'(<button\s*onClick=\{() => setView\("settings"\)\}[^>]*>.*?</button>\s*</div>\s*</div>)'

def repl(m):
    return m.group(1) + "\n" + insert_code

content = re.sub(pattern, repl, content, flags=re.DOTALL)

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)
