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

