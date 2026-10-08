import { invoke } from "@tauri-apps/api/core";

import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Activity, Plus, Settings, Play, FolderOpen, Layers, Code, ChevronRight, Info, FolderPlus, X, ChevronDown, SortAsc, Clock, Calendar, Lock, EyeOff, Search, Check, RefreshCw, Terminal, BookOpen, Sun, Moon, Copy, ExternalLink, Laptop, WrapText, Save, Edit2, Trash2, Eraser, Repeat } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { PdfViewer } from "../PdfViewer";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function Help() {
        const { activeOsTab, copiedId, handleCopy, helpTab, isSystemReady, setActiveOsTab, setHelpTab, view } = useAppContext();
  return (
    <>
          {view === "help" && (
            <div className="fade-in flex flex-col gap-10">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-text-main mb-2">Guide de démarrage & Aide</h1>
                  <p className="text-text-subtle text-sm">Configurez votre environnement LaTeX et retrouvez les commandes indispensables.</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isSystemReady ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isSystemReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-tight">
                    {isSystemReady ? "Environnement Prêt" : "Configuration Recommandée"}
                  </span>
                </div>
              </header>

              {/* Section 1: De quoi ai-je besoin ? */}
              <section className="bg-bg-card border border-border-subtle rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                <div>
                  <h2 className="text-xl font-bold text-text-main mb-1">De quoi ai-je besoin ?</h2>
                  <p className="text-text-subtle text-xs">Pour compiler vos fichiers PDF localement, vous devez installer une distribution LaTeX adaptée à votre système d'exploitation.</p>
                </div>
                
                <div className="flex bg-bg-input/50 p-1 rounded-lg w-fit mb-2 border border-border-subtle">
                  <button 
                    onClick={() => setActiveOsTab("mac")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeOsTab === "mac" ? "bg-bg-card shadow-sm text-blue-500" : "text-text-subtle hover:text-text-main"}`}
                  >
                    macOS
                  </button>
                  <button 
                    onClick={() => setActiveOsTab("windows")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeOsTab === "windows" ? "bg-bg-card shadow-sm text-blue-500" : "text-text-subtle hover:text-text-main"}`}
                  >
                    Windows
                  </button>
                  <button 
                    onClick={() => setActiveOsTab("linux")}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeOsTab === "linux" ? "bg-bg-card shadow-sm text-blue-500" : "text-text-subtle hover:text-text-main"}`}
                  >
                    Linux
                  </button>
                </div>

                <div className="w-full">
                  {/* macOS Card */}
                  {activeOsTab === "mac" && (
                  <div className="bg-bg-input/30 hover:bg-bg-input/50 border border-border-subtle hover:border-blue-500/20 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 group max-w-lg">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md">macOS</span>
                        <Laptop size={16} className="text-text-subtle group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h3 className="text-base font-bold text-text-main mb-1">MacTeX</h3>
                      <p className="text-text-subtle text-xs mb-4 leading-relaxed">Distribution recommandée pour macOS. Complète et s'intègre parfaitement avec les outils du système.</p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="bg-bg-deep border border-border-input rounded-lg p-2.5 flex items-center justify-between">
                        <code className="text-[10px] font-mono text-text-muted truncate select-all">brew install --cask mactex</code>
                        <button 
                          onClick={() => handleCopy("brew install --cask mactex", "mac")}
                          className="p-1.5 text-text-subtle hover:text-text-main bg-bg-card hover:bg-bg-input rounded border border-border-subtle transition-colors shrink-0 ml-2"
                          title="Copier la commande"
                        >
                          {copiedId === "mac" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <a 
                        href="https://www.tug.org/mactex/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition-colors"
                      >
                        Site officiel <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  )}

                  {/* Windows Card */}
                  {activeOsTab === "windows" && (
                  <div className="bg-bg-input/30 hover:bg-bg-input/50 border border-border-subtle hover:border-blue-500/20 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 group max-w-lg">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md">Windows</span>
                        <Laptop size={16} className="text-text-subtle group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h3 className="text-base font-bold text-text-main mb-1">MiKTeX & Perl</h3>
                      <p className="text-text-subtle text-xs mb-4 leading-relaxed">Distribution moderne pour Windows. <br/><span className="text-amber-500 font-bold">Important :</span> <b>Strawberry Perl</b> est requis pour utiliser l'outil <code>latexmk</code>.</p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="bg-bg-deep border border-border-input rounded-lg p-2.5 flex items-center justify-between mb-2">
                        <code className="text-[10px] font-mono text-text-muted truncate select-all">winget install MiKTeX.MiKTeX StrawberryPerl.StrawberryPerl</code>
                        <button 
                          onClick={() => handleCopy("winget install --id=MiKTeX.MiKTeX && winget install --id=StrawberryPerl.StrawberryPerl", "win")}
                          className="p-1.5 text-text-subtle hover:text-text-main bg-bg-card hover:bg-bg-input rounded border border-border-subtle transition-colors shrink-0 ml-2"
                          title="Copier la commande"
                        >
                          {copiedId === "win" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                      </div>

                      <button 
                        onClick={() => invoke("download_tectonic").catch(console.error)}
                        className="flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition-colors"
                      >
                        Télécharger et installer Tectonic
                      </button>

                      <a 
                        href="https://miktex.org/download" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full bg-bg-input hover:bg-bg-deep text-text-main border border-border-subtle font-bold text-xs py-2 rounded-lg transition-colors"
                      >
                        Voir le site officiel <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  )}

                  {/* Linux Card */}
                  {activeOsTab === "linux" && (
                  <div className="bg-bg-input/30 hover:bg-bg-input/50 border border-border-subtle hover:border-blue-500/20 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 group max-w-lg">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md">Linux</span>
                        <Laptop size={16} className="text-text-subtle group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h3 className="text-base font-bold text-text-main mb-1">TeX Live</h3>
                      <p className="text-text-subtle text-xs mb-4 leading-relaxed">Distribution standard pour Unix/Linux. Disponible directement dans les gestionnaires de paquets.</p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="bg-bg-deep border border-border-input rounded-lg p-2.5 flex items-center justify-between">
                        <code className="text-[10px] font-mono text-text-muted truncate select-all">sudo apt install texlive-full</code>
                        <button 
                          onClick={() => handleCopy("sudo apt install texlive-full", "linux")}
                          className="p-1.5 text-text-subtle hover:text-text-main bg-bg-card hover:bg-bg-input rounded border border-border-subtle transition-colors shrink-0 ml-2"
                          title="Copier la commande"
                        >
                          {copiedId === "linux" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <a 
                        href="https://www.tug.org/texlive/" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition-colors"
                      >
                        Site officiel <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                  )}
                </div>
              </section>

              {/* Section 2: Antisèche LaTeX */}
              <section className="bg-bg-card border border-border-subtle rounded-2xl p-6 md:p-8 flex flex-col gap-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-text-main mb-1">Antisèche LaTeX (Cheat Sheet)</h2>
                    <p className="text-text-subtle text-xs">Retrouvez et copiez les commandes les plus couramment utilisées pour rédiger vos documents.</p>
                  </div>
                  
                  {/* Category switcher */}
                  <div className="flex bg-bg-input p-1 rounded-lg border border-border-subtle self-start md:self-auto">
                    <button 
                      onClick={() => setHelpTab("basics")}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${helpTab === "basics" ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-subtle hover:text-text-main'}`}
                    >
                      Bases
                    </button>
                    <button 
                      onClick={() => setHelpTab("text")}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${helpTab === "text" ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-subtle hover:text-text-main'}`}
                    >
                      Texte
                    </button>
                    <button 
                      onClick={() => setHelpTab("math")}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${helpTab === "math" ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-subtle hover:text-text-main'}`}
                    >
                      Maths
                    </button>
                    <button 
                      onClick={() => setHelpTab("media")}
                      className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${helpTab === "media" ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-subtle hover:text-text-main'}`}
                    >
                      Médias
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {helpTab === "basics" && (
                    <>
                      <CheatSheetItem 
                        title="Structure minimale d'un document" 
                        description="Tout document LaTeX doit avoir cette structure de base." 
                        code={`\\documentclass{article}
\\usepackage[utf8]{inputenc}

\\begin{document}
  Votre texte ici...
\\end{document}`}
                        id="base-struct"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                      <CheatSheetItem 
                        title="Titre et auteur" 
                        description="Définit les métadonnées et génère le bloc de titre." 
                        code={`\\title{Titre du document}
\\author{Nom de l'auteur}
\\date{\\today}

% Dans le document :
\\maketitle`}
                        id="base-title"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                      <CheatSheetItem 
                        title="Titres de sections" 
                        description="Pour organiser votre document en chapitres et sections." 
                        code={`\\section{Section principale}
\\subsection{Sous-section}
\\subsubsection{Sous-sous-section}
\\paragraph{Paragraphe}`}
                        id="base-sections"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                      <CheatSheetItem 
                        title="Table des matières" 
                        description="Génère automatiquement le sommaire à partir des sections." 
                        code={`\\tableofcontents`}
                        id="base-toc"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                    </>
                  )}

                  {helpTab === "text" && (
                    <>
                      <CheatSheetItem 
                        title="Mise en forme du texte" 
                        description="Appliquez des styles de texte simples." 
                        code={`\\textbf{Texte en gras}
\\textit{Texte en italique}
\\underline{Texte souligné}
\\texttt{Texte en chasse fixe}`}
                        id="text-format"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                      <CheatSheetItem 
                        title="Listes à puces (non ordonnées)" 
                        description="Affiche une liste simple avec des puces." 
                        code={`\\begin{itemize}
  \\item Premier élément
  \\item Deuxième élément
\\end{itemize}`}
                        id="text-list"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                      <CheatSheetItem 
                        title="Listes numérotées" 
                        description="Affiche une liste ordonnée avec des chiffres." 
                        code={`\\begin{enumerate}
  \\item Premier élément
  \\item Deuxième élément
\\end{enumerate}`}
                        id="text-enum"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                      <CheatSheetItem 
                        title="Notes de bas de page" 
                        description="Ajoute un appel de note et le texte en bas de page." 
                        code={`Voici un exemple de texte avec une note de bas de page\\footnote{Le texte explicatif en bas.}.`}
                        id="text-footnote"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                    </>
                  )}

                  {helpTab === "math" && (
                    <>
                      <CheatSheetItem 
                        title="Équation en ligne (Inline)" 
                        description="Insère des symboles ou équations au milieu du texte." 
                        code={`La célèbre équation $E = mc^2$ d'Einstein.`}
                        id="math-inline"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                      <CheatSheetItem 
                        title="Équation centrée (Hors-ligne)" 
                        description="Affiche une équation sur sa propre ligne, centrée et sans numéro." 
                        code={`\\[ f(x) = \\int_{a}^{b} g(t) \\,dt \\]`}
                        id="math-block"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                      <CheatSheetItem 
                        title="Équation numérotée" 
                        description="Affiche une équation numérotée pour pouvoir la référencer." 
                        code={`\\begin{equation}
  a^2 + b^2 = c^2
  \\label{eq:pythagore}
\\end{equation}`}
                        id="math-eq"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                      <CheatSheetItem 
                        title="Fractions, indices et exposants" 
                        description="Commandes mathématiques courantes." 
                        code={`\\frac{a}{b}   % Fraction a sur b
x^{2}         % Exposant (x au carré)
x_{n}         % Indice (x indice n)
\\sqrt{x}     % Racine carrée de x`}
                        id="math-helpers"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                    </>
                  )}

                  {helpTab === "media" && (
                    <>
                      <CheatSheetItem 
                        title="Insertion d'une image" 
                        description="Permet d'ajouter une image centrée avec légende." 
                        code={`% Requiert \\usepackage{graphicx} dans le préambule
\\begin{figure}[h]
  \\centering
  \\includegraphics[width=0.5\\textwidth]{nom_image.png}
  \\caption{Légende de l'image}
  \\label{fig:mon_image}
\\end{figure}`}
                        id="media-image"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                      <CheatSheetItem 
                        title="Tableau simple" 
                        description="Crée un tableau avec bordures verticales et horizontales." 
                        code={`\\begin{table}[h]
  \\centering
  \\begin{tabular}{|l|c|r|}
    \\hline
    Gauche & Centré & Droite \\\\
    \\hline
    Valeur 1 & Valeur 2 & Valeur 3 \\\\
    \\hline
  \\end{tabular}
  \\caption{Exemple de tableau}
\\end{table}`}
                        id="media-table"
                        copiedId={copiedId}
                        onCopy={handleCopy}
                      />
                    </>
                  )}
                </div>
              </section>
            </div>
          )}

    </>
  );
}

function CheatSheetItem({ 
  title, 
  description, 
  code, 
  id, 
  copiedId, 
  onCopy 
}: { 
  title: string; 
  description: string; 
  code: string; 
  id: string; 
  copiedId: string | null; 
  onCopy: (text: string, id: string) => void; 
}) {
  return (
    <div className="bg-bg-input/10 hover:bg-bg-input/20 border border-border-subtle rounded-xl p-4 flex flex-col justify-between transition-colors">
      <div>
        <h3 className="text-xs font-bold text-text-main mb-1">{title}</h3>
        <p className="text-text-subtle text-[10px] mb-3 leading-relaxed">{description}</p>
      </div>
      
      <div className="relative group/code mt-2">
        <pre className="bg-bg-deep border border-border-input rounded-lg p-3 text-[10px] font-mono text-text-muted overflow-x-auto whitespace-pre">
          {code}
        </pre>
        <button 
          onClick={() => onCopy(code, id)}
          className="absolute top-2 right-2 p-1.5 text-text-subtle hover:text-text-main bg-bg-card/85 hover:bg-bg-input rounded border border-border-subtle transition-all opacity-0 group-hover/code:opacity-100 cursor-pointer"
          title="Copier le code"
        >
          {copiedId === id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
        </button>
        {copiedId === id && (
          <span className="absolute bottom-2 right-2 text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded font-bold">
            Copié !
          </span>
        )}
      </div>
    </div>
  );
}

