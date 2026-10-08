import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Activity, Plus, Settings, Play, FolderOpen, Layers, Code, ChevronRight, Info, FolderPlus, X, ChevronDown, SortAsc, Clock, Calendar, Lock, EyeOff, Search, Check, RefreshCw, Terminal, BookOpen, Sun, Moon, Copy, ExternalLink, Laptop, WrapText, Save, Edit2, Trash2, Eraser, Repeat } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { PdfViewer } from "../PdfViewer";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function Dashboard() {
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
          {view === "dashboard" && (
            <div className="fade-in flex flex-col gap-10">
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-text-main mb-2">Tableau de bord</h1>
                  <p className="text-text-subtle text-sm">Gérez vos projets et votre environnement LaTeX.</p>
                </div>
              </header>

              {/* ACTIVE OR PLACEHOLDER PROJECT CARD */}
              {activeProject ? (
                <section className={`bg-bg-card border rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-xl relative group/card min-h-[210px] transition-colors duration-500 ${isWatching ? 'border-green-500/20' : 'border-border-subtle'}`}>
                  {/* Close button */}
                  <button 
                    onClick={handleDeselectProject}
                    disabled={isSwitchLocked}
                    className={`absolute top-4 right-4 p-2 transition-all opacity-0 group-hover/card:opacity-100 ${isSwitchLocked ? 'cursor-not-allowed text-text-extra-subtle/5' : 'text-text-extra-subtle hover:text-red-400 hover:bg-red-500/10'} cursor-pointer`}
                    title={isSwitchLocked ? "Verrouillé pendant la compilation" : "Désélectionner ce projet"}
                  >
                    <X size={16} />
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-2 h-2 rounded-full ${isWatching ? 'bg-green-400 animate-pulse' : 'bg-text-extra-subtle'}`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isWatching ? 'text-green-400/60' : 'text-text-subtle'}`}>Projet Actuel</span>
                    </div>
                    <h2 className="text-3xl font-bold truncate text-text-main">{projectName}</h2>
                  </div>

                  <div className="flex items-end justify-between gap-4 mt-4">
                    <div className="flex flex-col gap-1.5 group/file relative">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-0.5 ${isWatching ? 'text-green-400/30' : 'text-text-extra-subtle'}`}>Fichier Racine</span>
                      <div className="relative">
                        {projectTexFiles.length > 0 ? (
                          <>
                            <select 
                              value={mainFile}
                              disabled={isSwitchLocked}
                              onChange={(e) => {
                                const val = e.target.value;
                                setMainFile(val);
                                setEditingFile(val);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                            >
                              {projectTexFiles.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <div className={`flex items-center gap-2 text-xs font-mono px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${isSwitchLocked ? 'bg-bg-card/40 border-border-subtle text-text-extra-subtle/50 cursor-not-allowed opacity-50' : 'text-text-subtle bg-bg-input border-border-subtle hover:border-white/20 hover:text-text-muted'}`}>
                              <Code size={12} className={isSwitchLocked ? 'text-text-extra-subtle' : 'text-blue-500/50'} />
                              <span className="truncate max-w-[150px]">{mainFile}</span>
                              {!isSwitchLocked && projectTexFiles.length > 1 && <ChevronDown size={12} className="text-text-extra-subtle" />}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2 text-[10px] font-bold text-amber-500/60 bg-amber-500/5 px-2.5 py-1.5 rounded-md border border-amber-500/10">
                            <Info size={12} />
                            {unfilteredTexCount > 0 ? 'Fichiers ignorés' : 'Aucun .tex détecté'}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {compileStatus !== "idle" && (
                        <button 
                          onClick={() => setIsLogsOpen(true)}
                          className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border transition-all cursor-pointer relative ${
                            compileStatus === "compiling"
                              ? 'bg-blue-600/10 text-blue-400 border-blue-500/30'
                              : compileStatus === "error"
                                ? 'bg-red-600/10 text-red-400 border-red-500/30 animate-blink-red shadow-lg shadow-red-500/20'
                                : 'bg-green-600/10 text-green-400 border-green-500/20 hover:bg-green-600/20'
                          }`}
                          title="Logs de compilation"
                        >
                          <Terminal size={18} className={compileStatus === "compiling" ? "animate-spin" : ""} />
                          {compileStatus === "error" && (
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                            </span>
                          )}
                          {compileStatus === "success" && (
                            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                          )}
                        </button>
                      )}
                      

                      {/* Continuous compilation button */}
                      <button 
                        onClick={handleToggleWatch}
                        disabled={projectTexFiles.length === 0}
                        className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                          projectTexFiles.length === 0 
                            ? 'bg-bg-input text-text-extra-subtle border border-border-subtle cursor-not-allowed opacity-50' 
                            : isWatching 
                              ? 'bg-blue-950 border border-blue-800/60 text-blue-400 hover:bg-blue-900/60 hover:text-blue-300 shadow-lg shadow-blue-950/10 animate-pulse' 
                              : 'bg-bg-input hover:bg-bg-input-hover border border-border-subtle text-text-subtle hover:text-text-main'
                        }`}
                        title={projectTexFiles.length === 0 ? "Compilation impossible (aucun fichier racine valide)" : isWatching ? "Arrêter la compilation continue" : "Activer la compilation continue"}
                      >
                        <Repeat size={18} className={isWatching ? "animate-pulse" : ""} />
                      </button>

                      <button 
                        onClick={handleOpenVSCode}
                        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-bg-input hover:bg-bg-input-hover border border-border-subtle shadow-md shadow-black/10 transition-all cursor-pointer text-text-main"
                        title="VSCode"
                      >
                        <VSCodeIcon size={20} />
                      </button>

                      {/* Details & Preview Button (Moved to far right) */}
                      <button
                        onClick={() => setView("project")}
                        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-bg-input hover:bg-bg-input-hover border border-border-subtle shadow-md shadow-black/10 transition-all cursor-pointer text-text-subtle hover:text-text-main"
                        title="Ouvrir le visualiseur PDF double panneau"
                      >
                        <BookOpen size={18} />
                      </button>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="border-2 border-dashed border-border-subtle rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[210px]">
                   <FolderOpen size={32} className="text-text-extra-subtle mb-4" />
                   <p className="text-text-subtle text-sm font-medium">Sélectionnez un projet pour commencer à travailler</p>
                </section>
              )}
              <section className="bg-bg-card/50 border border-border-subtle rounded-2xl p-6 md:p-8 flex flex-col">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 px-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <Layers size={20} className="text-blue-500" />
                    <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold uppercase tracking-tight text-text-main">Projets</h2>
                  <span className="text-sm text-text-subtle">{existingProjects.length}</span>
                </div>
                                  
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex bg-bg-input p-1 rounded-lg border border-border-subtle">
                      <button 
                        onClick={() => setSortBy("recent")}
                        disabled={isSwitchLocked}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${sortBy === "recent" ? 'bg-bg-input text-text-main shadow-sm' : 'text-text-extra-subtle hover:text-text-subtle disabled:opacity-30 disabled:cursor-not-allowed'}`}
                      >
                        <Clock size={12} /> Récents
                      </button>
                      <button 
                        onClick={() => setSortBy("alphabetical")}
                        disabled={isSwitchLocked}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${sortBy === "alphabetical" ? 'bg-bg-input text-text-main shadow-sm' : 'text-text-extra-subtle hover:text-text-subtle disabled:opacity-30 disabled:cursor-not-allowed'}`}
                      >
                        <SortAsc size={12} /> A-Z
                      </button>
                    </div>

                    <div className="h-6 w-px bg-bg-input"></div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleSelectDashboardDir}
                        disabled={isSwitchLocked}
                        className={`p-2 rounded-lg border transition-all ${isSwitchLocked ? 'bg-bg-input border-border-subtle text-text-extra-subtle/5 cursor-not-allowed' : 'bg-bg-input hover:bg-bg-input border-border-subtle text-text-subtle hover:text-blue-500'}`}
                        title={isSwitchLocked ? "Verrouillé pendant la compilation" : "Explorer un autre dossier"}
                      >
                        <FolderPlus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-8 px-4 relative group">
                  <Search size={14} className="absolute left-7.5 top-1/2 -translate-y-1/2 text-text-extra-subtle group-focus-within:text-blue-500 transition-colors pl-4" />
                  <input 
                    type="text" 
                    placeholder="Rechercher un projet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-bg-input border border-border-subtle hover:border-border-input focus:border-blue-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none transition-all placeholder:text-text-extra-subtle"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-7 top-1/2 -translate-y-1/2 text-text-extra-subtle hover:text-text-main transition-colors pr-4"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>

                {/* Internal Scrollable List */}
                <div className="flex flex-col gap-2 relative max-h-[880px] overflow-y-auto px-4 pb-4 custom-scrollbar transition-all duration-500">
                  
                  {/* Inline Creation Card */}
                  {!isCreatingInline ? (
                    <button 
                      onClick={() => setIsCreatingInline(true)}
                      disabled={isSwitchLocked}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all group ${isSwitchLocked ? 'border-border-subtle text-text-extra-subtle/5 opacity-50 cursor-not-allowed' : 'border-border-subtle text-text-extra-subtle hover:border-blue-500/30 hover:bg-blue-500/[0.02] hover:scale-[1.01]'}`}
                    >
                      <div className="p-2.5 rounded-xl bg-bg-input text-text-extra-subtle group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 text-left">
                        <span className="block text-sm font-bold uppercase tracking-widest transition-colors">Nouveau Projet</span>
                      </div>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-4 p-5 rounded-2xl border border-blue-500/30 bg-blue-500/[0.03] fade-in shadow-lg shadow-blue-500/5">
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Initialisation</span>
                        </div>
                        <button onClick={() => setIsCreatingInline(false)} className="text-text-extra-subtle hover:text-text-main transition-colors"><X size={14} /></button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-text-subtle uppercase tracking-widest px-1">Nom du projet</label>
                          <input 
                            ref={inlineInputRef}
                            type="text" 
                            className="bg-bg-input border border-border-input rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                            placeholder="ex: rapport-stage"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-text-subtle uppercase tracking-widest px-1">Template</label>
                          <div className="relative">
                            <select 
                              className="w-full bg-bg-input border border-border-input rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-colors appearance-none pr-10"
                              value={selectedTemplate}
                              onChange={(e) => setSelectedTemplate(e.target.value)}
                            >
                              {availableTemplates.length > 0 ? availableTemplates.map(t => <option key={t} value={t}>{t}</option>) : <option disabled>Aucun template</option>}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-extra-subtle pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-2">
                        <button 
                          onClick={() => setIsCreatingInline(false)}
                          className="px-4 py-2 rounded-lg text-xs font-bold text-text-subtle hover:text-text-main transition-colors"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={handleCreateProject}
                          disabled={!newProjectName.trim()}
                          className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-bg-input disabled:text-text-extra-subtle text-white px-6 py-2 rounded-lg text-xs font-bold transition-all ${newProjectName.trim() ? 'shadow-lg shadow-blue-600/20' : 'shadow-none'}`}
                        >
                          <Check size={14} /> Créer
                        </button>
                      </div>
                    </div>
                  )}

                  {sortedProjects.length > 0 ? (
                    sortedProjects.map(p => (
                      <ProjectListRow 
                        key={p.name} 
                        name={p.name} 
                        date={formatDate(p.last_modified)}
                        active={activeProject === `${dashboardProjectsDir}/${p.name}`} 
                        isWatching={isWatching}
                        disabled={isSwitchLocked && activeProject !== `${dashboardProjectsDir}/${p.name}`}
                        onClick={() => activateProject(p.name)} 
                      />
                    ))
                  ) : (
                    !isCreatingInline && (
                      <div className="text-center py-24 bg-bg-input/10 rounded-3xl border border-dashed border-border-subtle mx-2">
                        <div className="flex flex-col items-center gap-4">
                          <FolderOpen size={48} className="text-text-extra-subtle/5" />
                          <p className="text-text-extra-subtle italic text-sm">
                            {searchQuery ? `Aucun résultat pour "${searchQuery}"` : "Aucun projet trouvé dans ce répertoire."}
                          </p>
                          {searchQuery && <button onClick={() => setSearchQuery("")} className="text-xs text-blue-500 hover:underline font-bold">Effacer la recherche</button>}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            </div>
          )}

    </>
  );
}


function ProjectListRow({ name, date, active, isWatching, disabled, onClick }: { name: string, date: string, active: boolean, isWatching: boolean, disabled: boolean, onClick: () => void }) {
  const activeColorClass = isWatching ? 'text-green-400' : 'text-blue-400';
  const activeBgClass = isWatching ? 'bg-green-600/[0.02] border-green-500/15' : 'bg-blue-600/[0.02] border-blue-600/15 shadow-sm';
  const iconBgClass = isWatching ? (active ? 'bg-green-500/15 text-green-400' : 'bg-bg-input text-text-extra-subtle') : (active ? 'bg-blue-500/15 text-blue-400' : 'bg-bg-input text-text-extra-subtle');

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all duration-500 ease-in-out group/row ${active ? activeBgClass : 'bg-bg-card border-border-subtle hover:bg-bg-input-hover hover:border-border-input'} ${disabled ? 'opacity-20 grayscale cursor-not-allowed scale-[0.98]' : 'hover:scale-[1.01] active:scale-95'}`}
    >
      <div className={`p-2.5 rounded-xl transition-colors ${iconBgClass} group-hover/row:text-text-subtle`}>
        {disabled && active ? <Lock size={18} className="text-text-extra-subtle" /> : <FolderOpen size={18} />}
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <span className={`block text-sm font-bold truncate ${active ? activeColorClass : 'text-text-muted'}`}>{name}</span>
        <div className="flex items-center gap-2 mt-0.5">
           <Calendar size={10} className="text-text-extra-subtle" />
           <span className="text-[10px] font-medium text-text-extra-subtle uppercase tracking-wider">{date}</span>
        </div>
      </div>

      <div className={`transition-all duration-300 ${active ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}`}>
         <div className={`w-1.5 h-1.5 rounded-full ${isWatching ? 'bg-green-500 shadow-lg shadow-green-500/50' : 'bg-blue-500 shadow-lg shadow-blue-500/50'}`}></div>
      </div>
    </button>
  );
}

function VSCodeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="vsc-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
        <path fillRule="evenodd" clipRule="evenodd" d="M70.9 99.3c1.6.6 3.4.6 5 0l20.6-9.9c2.2-1 3.5-3.2 3.5-5.6V16.4c0-2.4-1.3-4.6-3.5-5.6L75.9.9c-2.1-1-4.5-.8-6.4.5-.2.2-.5.4-.7.6L29.4 38 12.2 25c-1.6-1.2-3.8-1.1-5.3.2L1.4 30.3C-.4 32-.4 34.8 1.4 36.4L16.2 50 1.4 63.6c-1.8 1.6-1.8 4.4 0 6.1l5.5 5c1.5 1.4 3.7 1.5 5.2.3l17.2-13L68.7 98c.6.6 1.3 1.1 2.2 1.3zM75 27.3L45.1 50 75 72.7V27.3z" fill="white"/>
      </mask>
      <g mask="url(#vsc-mask)">
        <path d="M96.5 10.8L75.9.9c-2.4-1.2-5.3-.7-7.2 1.2L1.3 63.6c-1.8 1.6-1.8 4.5 0 6.1l5.5 5c1.5 1.4 3.7 1.5 5.3.3l81.2-61.6c2.7-2.1 6.6-.2 6.6 3.2v-.2c0-2.4-1.4-4.6-3.5-5.6z" fill="#0065A9"/>
        <g filter="url(#vsc-shadow)">
          <path d="M96.5 89.2L75.9 99.1c-2.4 1.1-5.3.6-7.2-1.2L1.3 36.4c-1.8-1.6-1.8-4.5 0-6.1l5.5-5c1.5-1.4 3.7-1.5 5.3-.3L93.4 86.6c2.7 2.1 6.6.2 6.6-3.2v.2c0 2.4-1.4 4.6-3.5 5.6z" fill="#007ACC"/>
        </g>
        <path d="M75.9 99.1c-2.4 1.2-5.3.7-7.2-1.2 2.3 2.3 6.3.7 6.3-2.6V4.7c0-3.3-4-4.9-6.3-2.6 1.9-1.9 4.8-2.4 7.2-1.2l20.6 9.9c2.2 1 3.5 3.2 3.5 5.6v67.2c0 2.4-1.3 4.6-3.5 5.6l-20.6 9.9z" fill="#1F9CF0"/>
      </g>
      <defs>
        <filter id="vsc-shadow" x="-10" y="20" width="120" height="100" filterUnits="userSpaceOnUse">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.2 0"/>
          <feBlend mode="normal" in="SourceGraphic" in2="blur"/>
        </filter>
      </defs>
    </svg>
  );
}
