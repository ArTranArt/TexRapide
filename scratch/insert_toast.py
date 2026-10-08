with open("src/components/Sidebar.tsx", "r") as f:
    content = f.read()

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

content = content.replace("{/* Overlay de fond pour la console */}", pill_code + "\n      {/* Overlay de fond pour la console */}")

with open("src/components/Sidebar.tsx", "w") as f:
    f.write(content)
