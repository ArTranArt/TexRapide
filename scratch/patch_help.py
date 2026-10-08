import re

with open("src/components/Help.tsx", "r") as f:
    content = f.read()

new_section = """
              {/* Section 1: De quoi ai-je besoin ? */}
              <section className="bg-bg-card border border-border-subtle rounded-2xl p-6 md:p-8 flex flex-col gap-4">
                <div>
                  <h2 className="text-xl font-bold text-text-main mb-2">De quoi ai-je besoin ?</h2>
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl w-fit">
                    <Check size={18} className="shrink-0" />
                    <p className="text-sm font-medium">Absolument rien ! TexRapide s'occupe de tout.</p>
                  </div>
                </div>
                <p className="text-text-subtle text-xs leading-relaxed max-w-2xl mt-2">
                  Contrairement aux anciens éditeurs LaTeX qui nécessitent l'installation lourde de MacTeX ou MiKTeX (plusieurs gigaoctets), TexRapide télécharge et utilise automatiquement <strong>Tectonic</strong> en arrière-plan.<br/><br/>
                  Tectonic est un moteur moderne, extrêmement léger, qui télécharge les paquets manquants à la volée depuis le cloud. Vous n'avez pas non plus besoin d'installer un lecteur PDF externe (comme Skim ou Sumatra) car notre lecteur natif intégré est synchronisé en temps réel avec le code (SyncTeX bidirectionnel).
                </p>
                <div className="mt-4">
                  <button 
                    onClick={() => invoke("download_tectonic").catch(console.error)}
                    className="flex items-center justify-center gap-2 w-fit bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
                  >
                    <RefreshCw size={14} /> Forcer la réinstallation du moteur
                  </button>
                </div>
              </section>
"""

# Replace the whole section
pattern = r'\{\/\* Section 1: De quoi ai-je besoin \? \*\/\}[\s\S]*?\{\/\* Section 2: Cheat Sheet LaTeX \*\/\}'
replacement = new_section + "\n\n              {/* Section 2: Cheat Sheet LaTeX */}"

if "{/* Section 2: Cheat Sheet LaTeX */}" in content:
    content = re.sub(pattern, replacement, content)
else:
    # If the comment isn't there exactly, just replace from the section start to the next section or div
    pattern2 = r'\{\/\* Section 1: De quoi ai-je besoin \? \*\/\}[\s\S]*?<\/section>'
    content = re.sub(pattern2, new_section, content)

with open("src/components/Help.tsx", "w") as f:
    f.write(content)
