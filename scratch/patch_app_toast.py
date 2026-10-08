import re

with open("src/App.tsx", "r") as f:
    content = f.read()

# Add RefreshCw import
if "RefreshCw" not in content:
    content = content.replace('import { Sidebar } from "./components/Sidebar";', 'import { Sidebar } from "./components/Sidebar";\nimport { RefreshCw } from "lucide-react";')

# Get compileStatus
content = content.replace("const { view, mainContentRef } = useAppContext();", "const { view, mainContentRef, compileStatus } = useAppContext();")

# Add the toast right before <Sidebar />
toast_code = """
      {compileStatus === "compiling" && (
        <div className="fixed top-6 right-6 z-[9999] bg-[#121216]/90 backdrop-blur-md border border-amber-500/30 text-amber-500 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in pointer-events-none">
          <RefreshCw size={16} className="animate-spin" />
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-wide">Compilation...</span>
            <span className="text-[10px] text-amber-500/70 font-medium leading-tight">1er lancement : téléchargement des paquets requis</span>
          </div>
        </div>
      )}
"""
content = content.replace("<Sidebar />\n    </div>", toast_code + "      <Sidebar />\n    </div>")

with open("src/App.tsx", "w") as f:
    f.write(content)
