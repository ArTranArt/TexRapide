import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Activity, Plus, Settings, Play, FolderOpen, Layers, Code, ChevronRight, Info, FolderPlus, X, ChevronDown, SortAsc, Clock, Calendar, Lock, EyeOff, Search, Check, RefreshCw, Terminal, BookOpen, Sun, Moon, Copy, ExternalLink, Laptop, WrapText, Save, Edit2, Trash2, Eraser, Repeat } from "lucide-react";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
export function Sidebar() {
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
      <div 
        className={`fixed bottom-6 ${floatingPos === "right" ? "right-6" : "left-6"} z-50 flex flex-col gap-2 ${floatingDragOffset === 0 ? 'transition-all duration-300 ease-in-out' : ''}`}
        style={{ transform: floatingDragOffset ? `translateX(${floatingDragOffset}px)` : 'none' }}
      >
        <div className="w-[60px] flex flex-col items-center bg-bg-sidebar/90 backdrop-blur-md p-2 rounded-2xl border border-border-subtle shadow-xl shadow-black/20">
          
          <div className={`grid transition-all duration-300 ease-in-out w-full ${isFloatingCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}>
            <div className="overflow-hidden flex flex-col items-center gap-2">
              {activeProject && view !== "settings" && (
            <>
              {/* VSCode Button */}
              <button 
                onClick={handleOpenVSCode}
                className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-bg-input hover:bg-bg-input-hover border border-border-subtle shadow-md shadow-black/10 transition-all cursor-pointer text-text-main"
                title="VSCode"
              >
                <VSCodeIcon size={20} />
              </button>

              {/* Terminal Button */}
              <button 
                onClick={() => {
                  if (compileStatus !== "idle") setIsLogsOpen(true);
                }}
                disabled={compileStatus === "idle"}
                className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border transition-all relative ${
                  compileStatus === "idle"
                    ? 'bg-bg-input text-text-extra-subtle border-border-subtle cursor-not-allowed opacity-50'
                    : compileStatus === "error"
                      ? 'bg-red-600/10 text-red-400 border-red-500/30 animate-blink-red cursor-pointer shadow-lg shadow-red-500/20'
                      : 'bg-bg-input text-green-400 border-border-subtle hover:bg-bg-input-hover shadow-md shadow-black/10 cursor-pointer'
                }`}
                title={compileStatus === "idle" ? "Logs non disponibles" : "Logs de compilation"}
              >
                <Terminal size={18} className={compileStatus === "compiling" ? "animate-spin text-blue-400" : ""} />
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

              {/* Manual Compilation Button */}
              <button 
                onClick={handleCompileOnce}
                disabled={projectTexFiles.length === 0 || compileStatus === "compiling" || isWatching}
                className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                  projectTexFiles.length === 0 || isWatching
                    ? 'bg-bg-input text-text-extra-subtle border border-border-subtle cursor-not-allowed opacity-50' 
                    : compileStatus === "compiling"
                      ? 'bg-amber-600/10 border border-amber-500/30 text-amber-500 animate-spin'
                      : 'bg-bg-input hover:bg-bg-input-hover border border-border-subtle text-text-main shadow-md shadow-black/10'
                }`}
                title={
                  projectTexFiles.length === 0 
                    ? "Compilation impossible (aucun fichier racine valide)" 
                    : isWatching 
                      ? "Compilation continue active" 
                      : "Compiler une fois (Cmd + S)"
                }
              >
                {compileStatus === "compiling" ? (
                  <RefreshCw size={16} className="animate-spin text-amber-500" />
                ) : (
                  <Play size={18} fill="currentColor" className="text-blue-400" />
                )}
              </button>

              {/* Continuous compilation button */}
              <button 
                onClick={handleToggleWatch}
                disabled={projectTexFiles.length === 0}
                className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl transition-all cursor-pointer ${
                  projectTexFiles.length === 0 
                    ? 'bg-bg-input text-text-extra-subtle border border-border-subtle cursor-not-allowed opacity-50' 
                    : isWatching 
                      ? 'bg-blue-950 border border-blue-800/60 text-blue-400 hover:bg-blue-900/60 hover:text-blue-300 shadow-lg shadow-blue-950/10 animate-pulse' 
                      : 'bg-bg-input hover:bg-bg-input-hover border border-border-subtle text-text-subtle hover:text-text-main shadow-md shadow-black/10'
                }`}
                title={projectTexFiles.length === 0 ? "Compilation impossible (aucun fichier racine valide)" : isWatching ? "Arrêter la compilation continue" : "Activer la compilation continue"}
              >
                <Repeat size={18} className={isWatching ? "animate-pulse" : ""} />
              </button>

              <div className="w-full h-px bg-border-subtle/50 my-1"></div>
            </>
          )}

          <button onClick={() => { if (isSwitchLocked) return; setView("dashboard"); setIsCreatingInline(false); }} className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all ${view === "dashboard" ? "bg-bg-input-hover text-text-main" : "text-text-subtle hover:text-text-main hover:bg-bg-input"}`} title="Dashboard">
            <Layers size={18} />
          </button>
          <button onClick={() => { setView("settings"); setIsCreatingInline(false); }} className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-xl transition-all ${view === "settings" ? "bg-bg-input-hover text-text-main" : "text-text-subtle hover:text-text-main hover:bg-bg-input"}`} title="Configuration">
            <Settings size={18} />
          </button>
            </div>
          </div>

          {/* Drag Handle */}
          <div 
            className="w-full h-4 mt-1 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-30 hover:opacity-100 transition-opacity"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startPos = floatingPos;
              let currentDiff = 0;
              let hasDragged = false;
              const onMouseMove = (moveEvent: MouseEvent) => {
                currentDiff = moveEvent.clientX - startX;
                if (Math.abs(currentDiff) > 5) hasDragged = true;
                setFloatingDragOffset(currentDiff);
              };
              const onMouseUp = () => {
                if (!hasDragged) {
                  setIsFloatingCollapsed(prev => !prev);
                } else {
                  if (startPos === "right" && currentDiff < -100) {
                    setFloatingPos("left");
                  } else if (startPos === "left" && currentDiff > 100) {
                    setFloatingPos("right");
                  }
                }
                setFloatingDragOffset(0);
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
              };
              document.addEventListener("mousemove", onMouseMove);
              document.addEventListener("mouseup", onMouseUp);
            }}
            title="Glisser pour déplacer"
          >
            <div className="w-6 h-1 bg-text-subtle rounded-full" />
          </div>
        </div>
      </div>


      {/* Overlay de fond pour la console */}
      {isLogsOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity duration-300"
          onClick={() => setIsLogsOpen(false)}
        />
      )}

      <div 
        style={{ height: isLogsOpen ? `${drawerHeight}px` : undefined }}
        className={`fixed bottom-0 right-0 left-0 bg-[#121216]/95 border-t border-white/10 z-50 transition-[transform,opacity] duration-300 ease-out transform ${
          isLogsOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        } shadow-2xl flex flex-col`}
      >
        {/* Bordure de redimensionnement (poignée invisible pour drag) */}
        <div 
          onMouseDown={handleResizeMouseDown}
          className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize z-50 hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
        />

        {/* Poignée de tiroir pour fermer */}
        <div className="w-full flex justify-center py-2 cursor-pointer select-none shrink-0" onClick={() => setIsLogsOpen(false)}>
          <div className="w-12 h-1 bg-white/30 rounded-full" />
        </div>

        {/* En-tête */}
        <div className="flex items-center justify-between px-6 pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <Terminal size={16} className={compileStatus === "compiling" ? "text-blue-400 animate-spin" : compileStatus === "error" ? "text-red-400" : "text-green-400"} />
            <span className="font-display font-bold text-sm tracking-wide text-white">
              Console de compilation — {projectName}
            </span>
            {compileStatus === "compiling" && (
              <span className="text-[9px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-bold animate-pulse uppercase tracking-wider">
                En cours
              </span>
            )}
            {compileStatus === "success" && (
              <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Réussie
              </span>
            )}
            {compileStatus === "error" && (
              <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-bold animate-pulse uppercase tracking-wider">
                Échouée
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">

            {compileLogs && (
              <button 
                onClick={() => handleCopy(compileLogs, "console-logs")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 transition-all text-[10px] font-bold"
              >
                {copiedId === "console-logs" ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                {copiedId === "console-logs" ? "Copié !" : "Copier les logs"}
              </button>
            )}
            <button 
              onClick={() => setIsLogsOpen(false)}
              className="p-1.5 text-white/40 hover:text-white rounded-lg hover:bg-white/10 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Zone des logs de console */}
        <div className="flex-1 min-h-0 bg-black/50 p-6 font-mono text-[11px] overflow-y-auto selection:bg-blue-500/20 select-text custom-scrollbar text-white">
          {compileLogs ? (
            (() => {
              const lines = compileLogs.split('\n');
              const hasCriticalError = lines.some(line => line.trim().startsWith("!"));
              let idAssigned = false;
              return (
                <pre className="whitespace-pre-wrap break-all text-white/70 leading-relaxed font-mono">
                  {lines.map((line, idx) => {
                    const lowerLine = line.toLowerCase();
                    const trimLine = line.trim();
                    const lineMatch = trimLine.match(/^l\.(\d+)/);
                    const isLineIndicator = !!lineMatch;
                    
                    const isCritical = trimLine.startsWith("!");
                    const isGeneralError = lowerLine.includes("error") || lowerLine.includes("l.");
                    const isWarning = lowerLine.includes("warning");
                    
                    let lineClass = "text-white/70";
                    let idProp: string | undefined = undefined;

                    if (isCritical) {
                      lineClass = "text-red-400 font-bold bg-red-500/10 px-1 rounded";
                      if (hasCriticalError && !idAssigned) {
                        idProp = "first-error-line";
                        idAssigned = true;
                      }
                    } else if (isLineIndicator) {
                      lineClass = "text-cyan-400 font-semibold cursor-pointer hover:underline hover:bg-cyan-500/5 px-1 rounded flex items-center justify-between group/logline transition-colors";
                      if (!hasCriticalError && !idAssigned) {
                        idProp = "first-error-line";
                        idAssigned = true;
                      }
                    } else if (isGeneralError) {
                      lineClass = "text-red-400 font-semibold";
                      if (!hasCriticalError && !idAssigned) {
                        idProp = "first-error-line";
                        idAssigned = true;
                      }
                    } else if (isWarning) {
                      lineClass = "text-amber-400";
                    }

                    if (isLineIndicator && lineMatch) {
                      const lineNum = parseInt(lineMatch[1], 10);
                      return (
                        <div 
                          key={idx} 
                          id={idProp} 
                          onClick={() => handleLineClick(lineNum)}
                          className={`${lineClass} font-mono py-0.5`}
                          title={`Ouvrir la ligne ${lineNum} dans VS Code`}
                        >
                          <span className="truncate flex-1">{line}</span>
                          <span className="opacity-0 group-hover/logline:opacity-100 transition-opacity text-[8px] bg-cyan-950 text-cyan-400 border border-cyan-800 px-1.5 py-0.5 rounded font-sans shrink-0 uppercase tracking-tighter ml-2">
                            Ouvrir dans VS Code
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div key={idx} id={idProp} className={`${lineClass} font-mono py-0.5`}>
                        {line}
                      </div>
                    );
                  })}
                </pre>
              );
            })()
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-text-extra-subtle gap-2 italic">
              <Terminal size={20} className="opacity-40" />
              <span>Aucun log disponible pour le moment.</span>
              {isWatching && <span>Modifiez un fichier ou sauvegardez pour lancer la compilation.</span>}
            </div>
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
      
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-transparent" 
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => {
              e.preventDefault();
              setContextMenu(null);
            }}
          />
          <div 
            style={{ 
              top: `${contextMenu.y}px`, 
              left: `${contextMenu.x}px` 
            }}
            className="fixed bg-bg-card/90 backdrop-blur-xl border border-border-input/40 rounded-xl shadow-2xl p-1.5 z-50 min-w-[150px] flex flex-col gap-0.5 text-[11px] font-medium select-none animate-in fade-in zoom-in-95 duration-100 ease-out"
            onClick={() => setContextMenu(null)}
          >
            <button 
              onClick={() => {
                setRenamingPath(contextMenu.entry.relative_path);
                setRenamingValue(contextMenu.entry.name);
              }}
              className="w-full text-left px-2.5 py-1.5 hover:bg-blue-600 hover:text-white rounded-lg text-text-main transition-all font-sans cursor-pointer flex items-center gap-2"
            >
              <Edit2 size={12} className="opacity-70 shrink-0" />
              <span>Renommer</span>
              <span className="ml-auto text-[9px] opacity-40 font-mono tracking-tighter">Enter</span>
            </button>
            {!contextMenu.entry.is_dir && (
              <button 
                onClick={() => handleDuplicate(contextMenu.entry)}
                className="w-full text-left px-2.5 py-1.5 hover:bg-blue-600 hover:text-white rounded-lg text-text-main transition-all font-sans cursor-pointer flex items-center gap-2"
              >
                <Copy size={12} className="opacity-70 shrink-0" />
                <span>Dupliquer</span>
              </button>
            )}
            <div className="h-[1px] bg-border-subtle/30 my-0.5" />
            <button 
              onClick={() => handleDelete(contextMenu.entry)}
              className="w-full text-left px-2.5 py-1.5 hover:bg-red-600 hover:text-white rounded-lg text-red-500 transition-all font-sans cursor-pointer flex items-center gap-2"
            >
              <Trash2 size={12} className="shrink-0" />
              <span>Supprimer</span>
            </button>
          </div>
        </>
      )}
    </>
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
