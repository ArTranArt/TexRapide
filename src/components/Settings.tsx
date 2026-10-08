import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Activity, Plus, Play, FolderOpen, Layers, Code, ChevronRight, Info, FolderPlus, X, ChevronDown, SortAsc, Clock, Calendar, Lock, EyeOff, Search, Check, RefreshCw, Terminal, BookOpen, Sun, Moon, Copy, ExternalLink, Laptop, WrapText, Save, Edit2, Trash2, Eraser, Repeat } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { PdfViewer } from "../PdfViewer";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function Settings() {
      const {
    activateProject,
    activeOsTab,
    activeProject,
    addIgnoredPattern,
    analysisStep,
    autoIndent,
    autoSaveEnabled,
    availableTemplates,
    bibtexInfo,
    bibtexVer,
    checkHealth,
    checkPdfExists,
    cliTooltip,
    cmEventHandlers,
    commentKey,
    compilationEngine,
    compileLogs,
    compileStatus,
    contextMenu,
    copiedId,
    dashboardProjectsDir,
    distributionInfo,
    distributionTooltip,
    drawerHeight,
    editingFile,
    editorContent,
    editorExtensions,
    editorFontSize,
    editorRef,
    existingProjects,
    expandedDirs,
    fetchProjectTexFiles,
    fetchProjectTree,
    fetchProjects,
    fetchTemplates,
    fileExplorerWidth,
    filteredProjects,
    floatingDragOffset,
    floatingPos,
    formatBinaryVersion,
    formatDate,
    forwardSearchRefs,
    forwardSearchRipple,
    handleCleanAuxiliaryFiles,
    handleCompileOnce,
    handleCopy,
    handleCreateFile,
    handleCreateProject,
    handleDelete,
    handleDeselectProject,
    handleDuplicate,
    handleForwardSearch,
    handleLineClick,
    handleLineSelect,
    handleMouseDown,
    handleOpenVSCode,
    handleRename,
    handleResizeMouseDown,
    handleSelectDashboardDir,
    handleSelectDir,
    handleSelectTemplateDir,
    handleToggleWatch,
    hasCliTools,
    hasDistribution,
    hasSkim,
    hasUnsavedChanges,
    health,
    helpTab,
    hoveredNode,
    ignoredPatterns,
    inlineInputRef,
    isAnalyzing,
    isCreatingFile,
    isCreatingInline,
    isFloatingCollapsed,
    isLogsOpen,
    isManualOrientationRef,
    isResizingRef,
    isSwitchLocked,
    isSystemReady,
    isWatching,
    jumpToEditorLine,
    latexmkInfo,
    latexmkVer,
    leftPanelWidth,
    lineWrapping,
    loadFileContent,
    logsEndRef,
    mainContentRef,
    mainFile,
    newFileInputRef,
    newFileName,
    newPattern,
    newProjectName,
    parseShortcut,
    pdfExists,
    pdfPosition,
    pdfViewerMode,
    pdflatexInfo,
    pdflatexVer,
    pendingHighlightLine,
    projectName,
    projectTexFiles,
    projectTree,
    recordingField,
    removeIgnoredPattern,
    renamingPath,
    renamingValue,
    saveFileContent,
    searchQuery,
    selectedNode,
    selectedTemplate,
    setActiveOsTab,
    setActiveProject,
    setAnalysisStep,
    setAutoIndent,
    setAvailableTemplates,
    setCommentKey,
    setCompilationEngine,
    setCompileLogs,
    setCompileStatus,
    setContextMenu,
    setCopiedId,
    setDashboardProjectsDir,
    setDrawerHeight,
    setEditingFile,
    setEditorContent,
    setEditorFontSize,
    setExistingProjects,
    setExpandedDirs,
    setFileExplorerWidth,
    setFloatingDragOffset,
    setFloatingPos,
    setForwardSearchRipple,
    setHasUnsavedChanges,
    setHealth,
    setHelpTab,
    setHoveredNode,
    setIgnoredPatterns,
    setIsAnalyzing,
    setIsCreatingFile,
    setIsCreatingInline,
    setIsFloatingCollapsed,
    setIsLogsOpen,
    setIsWatching,
    setLeftPanelWidth,
    setLineWrapping,
    setMainFile,
    setNewFileName,
    setNewPattern,
    setNewProjectName,
    setPdfExists,
    setPdfPosition,
    setPdfViewerMode,
    setPendingHighlightLine,
    setProjectName,
    setProjectTexFiles,
    setProjectTree,
    setRecordingField,
    setRenamingPath,
    setRenamingValue,
    setSearchQuery,
    setSelectedNode,
    setSelectedTemplate,
    setShowFileTree,
    setShowPdfPanel,
    setSortBy,
    setTargetDir,
    setTemplateDir,
    setTheme,
    setTopPanelHeight,
    setUnfilteredTexCount,
    setView,
    setZoomInKey,
    setZoomOutKey,
    showFileTree,
    showPdfPanel,
    skimInfo,
    skimTooltip,
    skimVer,
    sortBy,
    sortedProjects,
    targetDir,
    tectonicInfo,
    tectonicVer,
    templateDir,
    theme,
    toggleDir,
    topPanelHeight,
    unfilteredTexCount,
    view,
    zoomInKey,
    zoomOutKey
  } = useAppContext();
  return (
    <>
          {view === "settings" && (
            <div className="fade-in flex flex-col gap-10">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-text-main mb-2">Configuration</h1>
                  <p className="text-text-subtle text-sm">Configuration de l'environnement.</p>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
                    className="flex items-center justify-center rounded-md bg-bg-input hover:bg-bg-input-hover border border-border-subtle shadow-sm transition-all cursor-pointer text-text-main px-3 py-1.5 gap-2"
                    title={theme === "dark" ? "Passer au mode clair" : "Passer au mode sombre"}
                  >
                    {theme === "dark" ? (
                      <><Sun size={14} className="text-amber-400" /><span className="text-[10px] font-bold">Thème Clair</span></>
                    ) : (
                      <><Moon size={14} className="text-blue-400" /><span className="text-[10px] font-bold">Thème Sombre</span></>
                    )}
                  </button>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isSystemReady ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${isSystemReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                    <span className="text-[10px] font-black uppercase tracking-tight">
                      {isSystemReady ? "Système Prêt" : "Configuration Requise"}
                    </span>
                  </div>
                </div>
              </header>

              {/* Diagnostic de l'Environnement */}
              <section 
                className="bg-bg-card border border-border-subtle rounded-xl p-5 md:p-6 shadow-xl"
                onClick={() => setSelectedNode(null)}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    <h2 className="text-[11px] font-black text-text-subtle uppercase tracking-[0.2em]">Diagnostic Système</h2>
                  </div>
                  <button 
                    onClick={checkHealth}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-bg-input hover:bg-bg-input text-text-muted hover:text-text-main transition-all text-[10px] font-bold border border-border-subtle disabled:opacity-35 disabled:cursor-not-allowed"
                    title="Relancer le diagnostic"
                  >
                    <RefreshCw size={10} className={`transition-transform duration-500 ${isAnalyzing ? 'animate-spin' : 'hover:rotate-180'}`} />
                    {isAnalyzing ? "Analyse..." : "Re-analyser"}
                  </button>
                </div>

                {/* Pipeline visual container */}
                {(() => {
                  const isNode1Hovered = hoveredNode === "distribution";
                  const isNode2Hovered = hoveredNode === "cli";
                  const isNode3Hovered = hoveredNode === "skim";

                  const isNode1Active = !isAnalyzing && (isNode1Hovered || selectedNode === "distribution");
                  const isNode2Active = !isAnalyzing && (isNode2Hovered || selectedNode === "cli");
                  const isNode3Active = !isAnalyzing && (isNode3Hovered || selectedNode === "skim");

                  // Node 1 state
                  const checking1 = isAnalyzing && analysisStep === 0;
                  const active1 = !isAnalyzing || analysisStep >= 1;
                  const success1 = hasDistribution;
                  const node1Style = checking1
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(0,122,255,0.3)] animate-pulse'
                    : active1
                      ? success1
                        ? `border-green-500 bg-green-500/10 text-green-400 ${isAnalyzing ? 'cursor-default' : 'cursor-pointer'} ${isNode1Active ? 'scale-110 shadow-[0_0_15px_rgba(34,197,94,0.6)] border-green-400' : 'shadow-[0_0_8px_rgba(34,197,94,0.3)]'}`
                        : `border-red-500 bg-red-500/10 text-red-400 ${isAnalyzing ? 'cursor-default' : 'cursor-pointer'} ${isNode1Active ? 'scale-110 shadow-[0_0_15px_rgba(239,68,68,0.6)] border-red-400' : 'shadow-[0_0_8px_rgba(239,68,68,0.3)]'}`
                      : 'border-border-input bg-bg-input text-text-extra-subtle';

                  // Node 2 state
                  const checking2 = isAnalyzing && analysisStep === 1;
                  const active2 = !isAnalyzing || analysisStep >= 2;
                  const success2 = hasCliTools;
                  const node2Style = checking2
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(0,122,255,0.3)] animate-pulse'
                    : active2
                      ? success2
                        ? `border-green-500 bg-green-500/10 text-green-400 ${isAnalyzing ? 'cursor-default' : 'cursor-pointer'} ${isNode2Active ? 'scale-110 shadow-[0_0_15px_rgba(34,197,94,0.6)] border-green-400' : 'shadow-[0_0_8px_rgba(34,197,94,0.3)]'}`
                        : `border-red-500 bg-red-500/10 text-red-400 ${isAnalyzing ? 'cursor-default' : 'cursor-pointer'} ${isNode2Active ? 'scale-110 shadow-[0_0_15px_rgba(239,68,68,0.6)] border-red-400' : 'shadow-[0_0_8px_rgba(239,68,68,0.3)]'}`
                      : 'border-border-input bg-bg-input text-text-extra-subtle';

                  // Node 3 state
                  const checking3 = isAnalyzing && analysisStep === 2;
                  const active3 = !isAnalyzing || analysisStep >= 3;
                  const success3 = hasSkim;
                  const node3Style = checking3
                    ? 'border-blue-500 bg-blue-500/10 text-blue-400 shadow-[0_0_8px_rgba(0,122,255,0.3)] animate-pulse'
                    : active3
                      ? success3
                        ? `border-green-500 bg-green-500/10 text-green-400 ${isAnalyzing ? 'cursor-default' : 'cursor-pointer'} ${isNode3Active ? 'scale-110 shadow-[0_0_15px_rgba(34,197,94,0.6)] border-green-400' : 'shadow-[0_0_8px_rgba(34,197,94,0.3)]'}`
                        : `border-amber-500 bg-amber-500/10 text-amber-400 ${isAnalyzing ? 'cursor-default' : 'cursor-pointer'} ${isNode3Active ? 'scale-110 shadow-[0_0_15px_rgba(245,158,11,0.6)] border-amber-400' : 'shadow-[0_0_8px_rgba(245,158,11,0.3)]'}`
                      : 'border-border-input bg-bg-input text-text-extra-subtle';

                  // Line 1 status
                  const line1Active = !isAnalyzing || analysisStep >= 1;
                  const line1Success = hasDistribution;
                  const line1Color = line1Active ? (line1Success ? '#22c55e' : '#ef4444') : 'var(--color-border-subtle)';
                  const line1Class = (isAnalyzing && analysisStep === 0) || (line1Active && line1Success) ? 'animate-dash' : '';

                  // Line 2 status
                  const line2Active = !isAnalyzing || analysisStep >= 2;
                  const line2Success = hasCliTools;
                  const line2Color = line2Active ? (line2Success ? '#22c55e' : '#ef4444') : 'var(--color-border-subtle)';
                  const line2Class = (isAnalyzing && analysisStep === 1) || (line2Active && line2Success) ? 'animate-dash' : '';

                  // Dynamic Message
                  let statusIcon = <Info size={16} className="text-blue-500 shrink-0" />;
                  let statusText = "Système non analysé";
                  let statusSubtext = "Consultez la configuration ou lancez un diagnostic.";

                  const activeDisplayNode = hoveredNode || selectedNode;

                  if (isAnalyzing) {
                    if (analysisStep === 0) {
                      statusIcon = <RefreshCw size={16} className="text-blue-500 animate-spin shrink-0" />;
                      statusText = "Recherche de la distribution LaTeX...";
                      statusSubtext = "Validation de TeX Live / MacTeX (/Library/TeX/texbin)...";
                    } else if (analysisStep === 1) {
                      statusIcon = <RefreshCw size={16} className="text-blue-500 animate-spin shrink-0" />;
                      statusText = "Vérification des outils en ligne de commande...";
                      statusSubtext = "Exécution de pdflatex, latexmk et bibtex...";
                    } else if (analysisStep === 2) {
                      statusIcon = <RefreshCw size={16} className="text-blue-500 animate-spin shrink-0" />;
                      statusText = "Détecter le lecteur PDF externe...";
                      statusSubtext = "Vérification de la présence de Skim (Mac) ou SumatraPDF (Win)...";
                    }
                  } else if (activeDisplayNode) {
                    if (activeDisplayNode === "distribution") {
                      statusIcon = <Layers size={16} className={hasDistribution ? "text-green-400 shrink-0" : "text-red-400 shrink-0"} />;
                      statusText = "Distribution LaTeX";
                      statusSubtext = hasDistribution
                        ? (compilationEngine === "tectonic" ? "Moteur Tectonic opérationnel." : "Moteur TeX Live ou MiKTeX/MacTeX opérationnel en arrière-plan.")
                        : (compilationEngine === "tectonic" ? "Tectonic n'est pas détecté." : "Aucune distribution LaTeX détectée (MiKTeX, MacTeX ou TeX Live requis).");
                    } else if (activeDisplayNode === "cli") {
                      statusIcon = <Terminal size={16} className={hasCliTools ? "text-green-400 shrink-0" : "text-red-400 shrink-0"} />;
                      statusText = "Outils en Ligne de Commande";
                      statusSubtext = hasCliTools
                        ? "Les utilitaires pdflatex, latexmk et bibtex sont prêts pour la compilation automatique."
                        : "Certains compilateurs requis (pdflatex, latexmk ou bibtex) sont absents ou inaccessibles.";
                    } else if (activeDisplayNode === "skim") {
                      statusIcon = <BookOpen size={16} className={hasSkim ? "text-green-400 shrink-0" : "text-amber-400 shrink-0"} />;
                      statusText = "Lecteur PDF Externe";
                      statusSubtext = hasSkim
                        ? "Le visualiseur externe est prêt pour l'aperçu dynamique du PDF."
                        : "Lecteur externe non détecté. Recommandé (Skim ou SumatraPDF) pour l'aperçu dynamique.";
                    }
                  } else if (health.length > 0) {
                    if (isSystemReady) {
                      statusIcon = <Check size={16} className="text-green-500 shrink-0" />;
                      statusText = "Système prêt et opérationnel";
                      statusSubtext = "Survolez ou cliquez sur les cercles pour inspecter les composants.";
                    } else {
                      statusIcon = <Info size={16} className={hasDistribution && hasCliTools ? "text-amber-500 shrink-0" : "text-red-500 shrink-0"} />;
                      statusText = hasDistribution && hasCliTools 
                        ? "Configuration fonctionnelle (Lecteur externe recommandé)" 
                        : "Configuration requise incomplète";
                      statusSubtext = "Certains composants requis sont manquants. Survolez ou cliquez sur les cercles pour plus de détails.";
                    }
                  }

                  return (
                    <div className="flex flex-col gap-5 w-full">
                      {/* Responsive Pipeline Stepper */}
                      <div className="flex items-start justify-between max-w-lg mx-auto w-full px-4 pt-3 pb-8 select-none relative">
                        
                        {/* Step 1 Node */}
                        <div 
                          className={`relative flex flex-col items-center shrink-0 w-9 h-9 ${isAnalyzing ? 'pointer-events-none' : ''}`}
                          onMouseEnter={() => setHoveredNode("distribution")}
                          onMouseLeave={() => setHoveredNode(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(selectedNode === "distribution" ? null : "distribution");
                          }}
                        >
                          <div 
                            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${node1Style} cursor-pointer`}
                            title={distributionTooltip}
                          >
                            <Layers size={14} />
                          </div>
                          <span className="absolute top-11 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider text-text-subtle whitespace-nowrap">
                            {compilationEngine === "tectonic" ? "Tectonic" : "Distribution"}
                          </span>
                        </div>

                        {/* Step 1 Connector */}
                        <div className="flex-1 min-w-[10px] h-9 flex items-center">
                          <svg className="w-full h-1" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <line 
                              x1="0" y1="5" x2="100" y2="5" 
                              stroke={line1Color} 
                              strokeWidth="3" 
                              strokeDasharray="6,4" 
                              className={`transition-all duration-500 ${line1Class}`}
                            />
                          </svg>
                        </div>

                        {/* Step 2 Node */}
                        <div 
                          className={`relative flex flex-col items-center shrink-0 w-9 h-9 ${isAnalyzing ? 'pointer-events-none' : ''}`}
                          onMouseEnter={() => setHoveredNode("cli")}
                          onMouseLeave={() => setHoveredNode(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(selectedNode === "cli" ? null : "cli");
                          }}
                        >
                          <div 
                            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${node2Style} cursor-pointer`}
                            title={cliTooltip}
                          >
                            <Terminal size={14} />
                          </div>
                          <span className="absolute top-11 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider text-text-subtle whitespace-nowrap">
                            {compilationEngine === "tectonic" ? "CLI Intégré" : "Outils CLI"}
                          </span>
                        </div>

                        {/* Step 2 Connector */}
                        <div className="flex-1 min-w-[10px] h-9 flex items-center">
                          <svg className="w-full h-1" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <line 
                              x1="0" y1="5" x2="100" y2="5" 
                              stroke={line2Color} 
                              strokeWidth="3" 
                              strokeDasharray="6,4" 
                              className={`transition-all duration-500 ${line2Class}`}
                            />
                          </svg>
                        </div>

                        {/* Step 3 Node */}
                        <div 
                          className={`relative flex flex-col items-center shrink-0 w-9 h-9 ${isAnalyzing ? 'pointer-events-none' : ''}`}
                          onMouseEnter={() => setHoveredNode("skim")}
                          onMouseLeave={() => setHoveredNode(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNode(selectedNode === "skim" ? null : "skim");
                          }}
                        >
                          <div 
                            className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-300 ${node3Style} cursor-pointer`}
                            title={skimTooltip}
                          >
                            <BookOpen size={14} />
                          </div>
                          <span className="absolute top-11 left-1/2 -translate-x-1/2 text-[9px] font-bold uppercase tracking-wider text-text-subtle whitespace-nowrap">
                            Lecteur (Skim/Sumatra)
                          </span>
                        </div>

                      </div>

                      {/* Status Message Area */}
                      <div className="bg-bg-input border border-border-subtle rounded-xl p-4 flex flex-col items-center justify-center text-center min-h-[90px] transition-all duration-300 select-none">
                        <div className="flex flex-col items-center gap-2.5 max-w-md w-full animate-fade-in">
                          <div className="p-2 rounded-lg bg-bg-card/40 border border-border-subtle shrink-0 flex items-center justify-center">
                            {statusIcon}
                          </div>
                          <div className="flex flex-col gap-0.5 text-center items-center">
                            <span className="text-xs font-bold text-text-main/90 text-center">{statusText}</span>
                            <span className="text-[10px] text-text-subtle leading-relaxed text-center">{statusSubtext}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* System Folders - Column Left */}
                <div className="lg:col-span-7 space-y-6">
                  <section className="bg-bg-card border border-border-subtle rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-8">
                      <FolderOpen size={16} className="text-blue-500" />
                      <h2 className="text-[11px] font-black text-text-subtle uppercase tracking-[0.2em]">Chemins Système</h2>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-bold text-text-subtle uppercase tracking-widest">Dossier Projets</label>
                          <button onClick={handleSelectDir} disabled={isSwitchLocked} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-30">Modifier</button>
                        </div>
                        <div className="bg-bg-input border border-border-input rounded-lg p-2.5 text-xs font-mono text-text-muted truncate">
                          {targetDir}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-bold text-text-subtle uppercase tracking-widest">Dossier Templates</label>
                          <button onClick={handleSelectTemplateDir} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors">Modifier</button>
                        </div>
                        <div className="bg-bg-input border border-border-input rounded-lg p-2.5 text-xs font-mono text-text-muted truncate">
                          {templateDir}
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Apparence Card */}
                  <section className="bg-bg-card border border-border-subtle rounded-xl p-6 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {theme === "dark" ? <Moon size={16} className="text-blue-500" /> : <Sun size={16} className="text-amber-500" />}
                        <h2 className="text-[11px] font-black text-text-subtle uppercase tracking-[0.2em]">Apparence</h2>
                      </div>
                      
                      <div className="flex bg-bg-input p-1 rounded-lg border border-border-subtle transition-colors duration-300">
                        <button 
                          onClick={() => setTheme("light")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${theme === "light" ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-subtle hover:text-text-main'}`}
                        >
                          <Sun size={12} /> Clair
                        </button>
                        <button 
                          onClick={() => setTheme("dark")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${theme === "dark" ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-subtle hover:text-text-main'}`}
                        >
                          <Moon size={12} /> Sombre
                        </button>
                      </div>
                    </div>
                  </section>

                  {/* Éditeur Card */}
                  <section className="bg-bg-card border border-border-subtle rounded-xl p-6 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Code size={16} className="text-blue-500" />
                        <h2 className="text-[11px] font-black text-text-subtle uppercase tracking-[0.2em]">Éditeur</h2>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-text-subtle font-bold">Indentation auto.</span>
                        <div className="flex bg-bg-input p-1 rounded-lg border border-border-subtle transition-colors duration-300">
                          <button 
                            onClick={() => setAutoIndent(true)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${autoIndent ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-subtle hover:text-text-main'}`}
                          >
                            Activer
                          </button>
                          <button 
                            onClick={() => setAutoIndent(false)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${!autoIndent ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-subtle hover:text-text-main'}`}
                          >
                            Désactiver
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>



                  {/* Lecteur PDF Card */}
                  <section className="bg-bg-card border border-border-subtle rounded-xl p-6 transition-colors duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-blue-500" />
                        <h2 className="text-[11px] font-black text-text-subtle uppercase tracking-[0.2em]">Lecteur PDF</h2>
                      </div>
                      
                      <div className="flex bg-bg-input p-1 rounded-lg border border-border-subtle transition-colors duration-300">
                        <button 
                          onClick={() => setPdfViewerMode("integrated")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${pdfViewerMode === "integrated" ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-subtle hover:text-text-main'}`}
                        >
                          Intégré
                        </button>
                        <button 
                          onClick={() => setPdfViewerMode("system")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${pdfViewerMode === "system" ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-subtle hover:text-text-main'}`}
                        >
                          Système
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between border-t border-border-subtle pt-5 mt-5">
                      <div>
                        <h4 className="text-sm font-bold text-text-main mb-1">Moteur de compilation</h4>
                        <p className="text-text-subtle text-xs">Utiliser Tectonic pour une configuration zéro-effort.</p>
                      </div>
                      <div className="flex bg-bg-input p-1 rounded-lg border border-border-subtle transition-colors duration-300">
                        <button 
                          onClick={() => setCompilationEngine("system")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${compilationEngine === "system" ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-subtle hover:text-text-main'}`}
                        >
                          Système (latexmk)
                        </button>
                        <button 
                          onClick={() => setCompilationEngine("tectonic")}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${compilationEngine === "tectonic" ? 'bg-bg-card text-text-main shadow-sm' : 'text-text-subtle hover:text-text-main'}`}
                        >
                          Tectonic (Magique)
                        </button>
                      </div>
                    </div>
                  </section>


                </div>

                {/* Filters - Column Right */}
                <div className="lg:col-span-5 space-y-6">
                  <section className="bg-bg-card border border-border-subtle rounded-xl p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <EyeOff size={16} className="text-amber-500" />
                        <h2 className="text-[11px] font-black text-text-subtle uppercase tracking-[0.2em]">Filtres .tex</h2>
                      </div>
                      <span className="text-[10px] font-bold text-text-extra-subtle bg-bg-input px-2 py-0.5 rounded-full">{ignoredPatterns.length}</span>
                    </div>
                    
                    <div className="space-y-4 flex-1">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Mot-clé..."
                          className="flex-1 bg-bg-input border border-border-input rounded-lg px-3 py-2 text-xs focus:border-amber-500/50 outline-none transition-colors"
                          value={newPattern}
                          onChange={(e) => setNewPattern(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addIgnoredPattern()}
                        />
                        <button 
                          onClick={addIgnoredPattern}
                          className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-500 px-3 rounded-lg text-xs font-bold transition-all border border-amber-500/10"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                        {ignoredPatterns.map(pattern => (
                          <div key={pattern} className="flex items-center gap-1.5 bg-bg-input border border-border-subtle pl-2.5 pr-1 py-1 rounded-md group hover:border-amber-500/20 transition-all">
                            <span className="text-[10px] font-bold text-text-subtle">{pattern}</span>
                            <button 
                              onClick={() => removeIgnoredPattern(pattern)}
                              className="p-1 text-text-extra-subtle hover:text-red-400 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-border-subtle">
                       <p className="text-[9px] text-text-extra-subtle leading-relaxed italic">
                        Les noms contenant ces mots seront exclus du sélecteur racine.
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

    </>
  );
}
