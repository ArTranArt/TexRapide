import { useRef, useEffect } from "react";

import { invoke, convertFileSrc } from "@tauri-apps/api/core";

import React from 'react';
import { useAppContext } from '../context/AppContext';
import { Activity, Plus, Settings, Play, FolderOpen, Layers, Code, ChevronRight, Info, FolderPlus, X, ChevronDown, SortAsc, Clock, Calendar, Lock, EyeOff, Search, Check, RefreshCw, Terminal, BookOpen, Sun, Moon, Copy, ExternalLink, Laptop, WrapText, Save, Edit2, Trash2, Eraser, Repeat } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { PdfViewer } from "../PdfViewer";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */

export interface FileEntry {
  name: string;
  relative_path: string;
  is_dir: boolean;
  children?: FileEntry[];
}

export function Project() {
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
          {view === "project" && activeProject && (() => {
            const pdfPath = mainFile ? `${activeProject}/${mainFile.replace(/\.tex$/, ".pdf")}` : null;
            const pdfSrc = pdfPath ? convertFileSrc(pdfPath) : "";

            return (
              <div className={`flex h-full w-full bg-bg-deep overflow-hidden fade-in ${
                pdfPosition === "right" ? "flex-row" : pdfPosition === "left" ? "flex-row-reverse" : pdfPosition === "bottom" ? "flex-col" : "flex-col-reverse"
              }`}>
                {/* Left/Top Panel - Dynamic Size */}
                <div 
                  style={
                    showPdfPanel 
                      ? ((pdfPosition === "right" || pdfPosition === "left") 
                          ? { width: `${leftPanelWidth}px` } 
                          : { height: `${topPanelHeight}px` })
                      : undefined
                  }
                  className={`bg-bg-sidebar flex flex-col overflow-hidden ${
                    (pdfPosition === "right" || pdfPosition === "left") 
                      ? "h-full border-r border-border-subtle" 
                      : "w-full border-b border-border-subtle"
                  } ${
                    showPdfPanel 
                      ? ((pdfPosition === "right" || pdfPosition === "left") 
                          ? "min-w-[350px] shrink-0" 
                          : "min-h-[150px] shrink-0")
                      : "flex-1"
                  }`}
                >
                  
                  {/* Ultra-compact Header (Single Row) */}
                  <div className="h-12 border-b border-border-subtle bg-bg-sidebar flex items-center justify-between pr-3 shrink-0 select-none">

                    {/* Collapsible File Explorer Toggle Button */}
                    <button 
                      onClick={() => setShowFileTree(prev => !prev)}
                      className={`w-12 h-12 flex items-center justify-center border-r border-border-subtle hover:bg-bg-input-hover transition-colors cursor-pointer shrink-0 ${
                        showFileTree ? "text-blue-400 bg-blue-500/5" : "text-text-muted hover:text-text-main"
                      }`}
                      title="Afficher/Masquer l'explorateur de fichiers"
                    >
                      <FolderOpen size={16} />
                    </button>

                    {/* Project Title and Muted Path (with Copy on click) */}
                    <div className="flex flex-col min-w-0 flex-1 ml-3">
                      <span className="text-xs font-bold text-text-main truncate leading-tight" title={projectName}>
                        {projectName}
                      </span>
                      <span 
                        onClick={() => invoke("show_in_finder", { path: activeProject })}
                        className="text-[9px] text-text-extra-subtle font-mono truncate leading-none mt-1 hover:text-blue-400 hover:underline transition-colors cursor-pointer flex items-center gap-1" 
                        title="Ouvrir dans le Finder"
                      >
                        {activeProject}
                      </span>
                    </div>

                    {/* Inline Selectors / Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Compiled Main File Target Indicator */}
                      <div className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border transition-all shrink-0 ${
                        compileStatus === "compiling"
                          ? "bg-blue-500/10 border-blue-500/30 text-blue-400 font-semibold"
                          : "bg-bg-input/30 border-border-subtle/50 text-text-subtle"
                      }`}>
                        {compileStatus === "compiling" ? (
                          <RefreshCw size={10} className="animate-spin text-blue-400 shrink-0" />
                        ) : (
                          <span className="text-[8px] font-bold uppercase tracking-wider text-text-extra-subtle">Cible :</span>
                        )}
                        <span className={`truncate max-w-[100px] ${compileStatus === "compiling" ? "text-blue-300" : "text-text-muted"}`} title={mainFile}>
                          {mainFile || "aucun"}
                        </span>
                      </div>

                      {/* Save Status & Compile Button */}
                      <button
                        onClick={() => saveFileContent(editingFile, editorContent)}
                        disabled={!hasUnsavedChanges}
                        className={`w-6 h-6 flex items-center justify-center rounded-md border transition-all ${
                          hasUnsavedChanges 
                            ? "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25 active:scale-95 cursor-pointer shadow-[0_0_8px_rgba(245,158,11,0.15)]" 
                            : "bg-green-500/10 border-green-500/20 text-green-400 cursor-default"
                        }`}
                        title={
                          hasUnsavedChanges 
                            ? "Sauvegarde automatique en cours..."
                            : "Changements enregistrés et compilés"
                        }
                      >
                        {hasUnsavedChanges ? <Save size={12} /> : <Check size={12} />}
                      </button>

                      {/* Line wrapping toggle button */}
                      <button
                        onClick={() => setLineWrapping(prev => !prev)}
                        className={`w-6 h-6 flex items-center justify-center rounded-md border transition-all cursor-pointer ${
                          lineWrapping 
                            ? "bg-blue-500/15 border-blue-500/30 text-blue-400" 
                            : "bg-bg-input border-border-subtle text-text-muted hover:text-text-main hover:border-border-input"
                        }`}
                        title={lineWrapping ? "Désactiver le retour à la ligne automatique" : "Activer le retour à la ligne automatique"}
                      >
                        <WrapText size={12} />
                      </button>


                      {/* Toggle PDF Panel Button */}
                      <button
                        onClick={() => setShowPdfPanel(prev => !prev)}
                        className={`w-6 h-6 flex items-center justify-center rounded-md border transition-all cursor-pointer ${
                          showPdfPanel 
                            ? "bg-blue-500/15 border-blue-500/30 text-blue-400" 
                            : "bg-amber-500/15 border-amber-500/30 text-amber-400 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.15)]"
                        }`}
                        title={showPdfPanel ? "Masquer l'aperçu PDF" : "Afficher l'aperçu PDF"}
                      >
                        <BookOpen size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Code Editor & File Tree Content Area */}
                  <div className="flex-1 min-h-0 w-full flex flex-row overflow-hidden bg-bg-sidebar">
                    {/* Collapsible File Explorer Sidebar */}
                    {showFileTree && (
                      <>
                        <div 
                          style={{ width: fileExplorerWidth }}
                          className="shrink-0 border-r border-border-subtle bg-bg-sidebar/30 flex flex-col h-full select-none"
                        >
                        <div className="flex items-center justify-between px-2.5 py-2 border-b border-border-subtle/50 shrink-0 bg-bg-sidebar/40">
                          <span className="text-[9px] font-black uppercase tracking-wider text-text-extra-subtle">Fichiers</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                if (activeProject) fetchProjectTree(activeProject);
                              }}
                              className="p-1 rounded text-text-muted transition-colors hover:bg-bg-input-hover hover:text-text-main cursor-pointer"
                              title="Recharger les fichiers"
                            >
                              <RefreshCw size={10} />
                            </button>
                            <button
                              onClick={handleCleanAuxiliaryFiles}
                              className="p-1 rounded text-text-muted transition-colors hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                              title="Nettoyer les fichiers auxiliaires (.aux, .log, .out, etc.)"
                            >
                              <Eraser size={10} />
                            </button>
                            <button
                              onClick={() => {
                                if (!isSwitchLocked) {
                                  setIsCreatingFile(prev => !prev);
                                }
                              }}
                              disabled={isSwitchLocked}
                              className={`p-1 rounded text-text-muted transition-colors ${
                                isSwitchLocked 
                                  ? "opacity-30 cursor-not-allowed" 
                                  : "hover:bg-bg-input-hover hover:text-text-main cursor-pointer"
                              }`}
                              title={isSwitchLocked ? "Création bloquée pendant la compilation/visualisation" : "Nouveau fichier"}
                            >
                              <Plus size={10} />
                            </button>
                          </div>
                        </div>

                        {/* Inline File Creation Input */}
                        {isCreatingFile && (
                          <div className="px-2 py-1.5 border-b border-border-subtle/40 bg-bg-input/20 shrink-0">
                            <input
                              ref={newFileInputRef}
                              type="text"
                              placeholder="Nom (ex: intro.tex)..."
                              className="w-full bg-bg-input border border-border-input rounded px-1.5 py-1 text-[10px] font-mono text-text-main outline-none focus:border-blue-500/50"
                              value={newFileName}
                              onChange={(e) => setNewFileName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleCreateFile();
                                else if (e.key === "Escape") {
                                  setIsCreatingFile(false);
                                  setNewFileName("");
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  setIsCreatingFile(false);
                                  setNewFileName("");
                                }, 200);
                              }}
                            />
                          </div>
                        )}

                        <FileTree
                          tree={projectTree}
                          expandedDirs={expandedDirs}
                          toggleDir={toggleDir}
                          selectedFile={editingFile}
                          onFileSelect={async (relative_path) => {
                            if (isSwitchLocked) return;
                            if (hasUnsavedChanges && editingFile) {
                              await saveFileContent(editingFile, editorContent);
                            }
                            setEditingFile(relative_path);
                            // If selected file is a .tex file at root level, also set it as main file.
                            if (relative_path.toLowerCase().endsWith(".tex") && !relative_path.includes("/")) {
                              setMainFile(relative_path);
                            }
                          }}
                          isCompiling={isSwitchLocked}
                          renamingPath={renamingPath}
                          setRenamingPath={setRenamingPath}
                          renamingValue={renamingValue}
                          setRenamingValue={setRenamingValue}
                          onRenameSubmit={handleRename}
                          onItemContextMenu={(e, entry) => {
                            e.preventDefault();
                            if (isSwitchLocked) return;
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              entry
                            });
                          }}
                        />
                      </div>
                      {/* File Explorer Resizer */}
                      <div
                        className="w-1 cursor-col-resize hover:bg-blue-500/50 active:bg-blue-500 transition-colors z-20 shrink-0 bg-border-subtle/10"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          const startX = e.clientX;
                          const startWidth = fileExplorerWidth;
                          
                          const onMouseMove = (moveEvent: MouseEvent) => {
                            const newWidth = Math.max(120, Math.min(600, startWidth + (moveEvent.clientX - startX)));
                            setFileExplorerWidth(newWidth);
                          };
                          
                          const onMouseUp = () => {
                            document.removeEventListener("mousemove", onMouseMove);
                            document.removeEventListener("mouseup", onMouseUp);
                          };
                          
                          document.addEventListener("mousemove", onMouseMove);
                          document.addEventListener("mouseup", onMouseUp);
                        }}
                      />
                    </>
                    )}

                    {/* Code Editor */}
                    <div className="flex-1 min-h-0 h-full overflow-hidden">
                      <CodeMirror
                        key={editingFile}
                        ref={editorRef}
                        value={editorContent}
                        height="100%"
                        theme={theme}
                        extensions={editorExtensions}
                        onChange={(value) => {
                          setEditorContent(value);
                          setHasUnsavedChanges(true);
                        }}
                        className="h-full font-mono"
                        style={{ fontSize: `${editorFontSize}px` }}
                      />
                    </div>
                  </div>
                </div>

                {showPdfPanel && (
                  <>
                    {/* Resizer Handle */}
                    <div 
                      onMouseDown={handleMouseDown}
                      className={`${
                        (pdfPosition === "right" || pdfPosition === "left") 
                          ? "w-1.5 h-full cursor-col-resize" 
                          : "h-1.5 w-full cursor-row-resize"
                      } bg-border-subtle hover:bg-blue-500/50 active:bg-blue-500 shrink-0 transition-all select-none z-30 relative group/resizer`}
                    >
                      <div className={`absolute bg-border-subtle group-hover/resizer:bg-blue-500/50 group-active/resizer:bg-blue-500 ${
                        (pdfPosition === "right" || pdfPosition === "left")
                          ? "inset-y-0 left-[2px] w-[1px]"
                          : "inset-x-0 top-[2px] h-[1px]"
                      }`} />
                    </div>

                    {/* Right Panel */}
                    <div className={`flex-1 bg-bg-deep flex flex-col relative overflow-hidden ${
                      (pdfPosition === "right" || pdfPosition === "left") ? "h-full" : "w-full"
                    }`}>
                      {pdfViewerMode === "integrated" ? (
                        pdfExists ? (
                          <div className="flex-1 w-full h-full relative overflow-hidden">
                            <PdfViewer 
                              pdfSrc={pdfSrc}
                              pdfPath={pdfPath || ""}
                              projectName={projectName}
                              compileStatus={compileStatus}
                              onLineSelect={handleLineSelect}
                              zoomInKey={zoomInKey}
                              zoomOutKey={zoomOutKey}
                              pdfPosition={pdfPosition}
                              onChangePdfPosition={(pos) => {
                                isManualOrientationRef.current = true;
                                setPdfPosition(pos);
                              }}
                              forwardSearchRipple={forwardSearchRipple}
                            />
                          </div>
                        ) : compileStatus === "compiling" ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-deep select-none animate-fade-in">
                            <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                              <BookOpen size={28} className="animate-pulse" />
                            </div>
                            <h3 className="text-lg font-bold text-text-main mb-2">Compilation en cours...</h3>
                            <p className="text-text-subtle text-xs max-w-sm leading-relaxed mb-6">
                              Veuillez patienter pendant la génération du premier aperçu PDF.
                            </p>
                            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                          </div>
                        ) : (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-deep select-none animate-fade-in">
                            <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                              <BookOpen size={28} />
                            </div>
                            <h3 className="text-lg font-bold text-text-main mb-2">Aucun PDF généré</h3>
                            <p className="text-text-subtle text-xs max-w-sm leading-relaxed mb-6">
                              Compilez votre document pour générer et afficher le document PDF.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={handleCompileOnce}
                                disabled={projectTexFiles.length === 0 || isWatching}
                                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer flex items-center justify-center gap-2"
                              >
                                <Play size={14} fill="currentColor" />
                                Compiler une fois (Cmd + S)
                              </button>
                              <button
                                onClick={handleToggleWatch}
                                disabled={projectTexFiles.length === 0}
                                className={`font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 border ${
                                  isWatching 
                                    ? 'bg-blue-950 border-blue-800/60 text-blue-400 hover:bg-blue-900/60'
                                    : 'bg-bg-input hover:bg-bg-input-hover text-text-main border-border-subtle'
                                }`}
                              >
                                <Repeat size={14} className={isWatching ? "animate-pulse" : ""} />
                                {isWatching ? "Compilation continue active" : "Compilation continue"}
                              </button>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-bg-deep animate-fade-in">
                          <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                            <ExternalLink size={28} />
                          </div>
                          <h3 className="text-lg font-bold text-text-main mb-2">Lecteur Système Actif</h3>
                          <p className="text-text-subtle text-xs max-w-sm leading-relaxed mb-6">
                            L'aperçu est géré par votre lecteur PDF système externe (Skim sur macOS, SumatraPDF sur Windows, etc.).
                          </p>
                          <div className="flex bg-bg-input p-1 rounded-lg border border-border-subtle">
                            <button 
                              onClick={() => setPdfViewerMode("integrated")}
                              className="px-3 py-1.5 rounded-md text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-all cursor-pointer"
                            >
                              Activer le lecteur intégré
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })()}

    </>
  );
}

function FileTreeItem({
  entry,
  level,
  expandedDirs,
  toggleDir,
  selectedFile,
  onFileSelect,
  isCompiling,
  renamingPath,
  setRenamingPath,
  renamingValue,
  setRenamingValue,
  onRenameSubmit,
  onItemContextMenu
}: {
  entry: FileEntry;
  level: number;
  expandedDirs: Set<string>;
  toggleDir: (path: string) => void;
  selectedFile: string;
  onFileSelect: (path: string) => void;
  isCompiling: boolean;
  renamingPath: string | null;
  setRenamingPath: (val: string | null) => void;
  renamingValue: string;
  setRenamingValue: (val: string) => void;
  onRenameSubmit: (entry: FileEntry, val: string) => void;
  onItemContextMenu: (e: React.MouseEvent, entry: FileEntry) => void;
}) {
  const isExpanded = expandedDirs.has(entry.relative_path);
  const isSelected = selectedFile === entry.relative_path;
  const isRenaming = renamingPath === entry.relative_path;
  const isCancelledRef = useRef(false);

  useEffect(() => {
    if (isRenaming) {
      isCancelledRef.current = false;
    }
  }, [isRenaming]);

  if (entry.is_dir) {
    return (
      <div className="flex flex-col">
        {isRenaming ? (
          <div style={{ paddingLeft: `${level * 8 + 18}px` }} className="py-1 pr-2">
            <input 
              value={renamingValue}
              onChange={(e) => setRenamingValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                } else if (e.key === "Escape") {
                  isCancelledRef.current = true;
                  setRenamingPath(null);
                }
              }}
              onBlur={() => {
                if (!isCancelledRef.current) {
                  onRenameSubmit(entry, renamingValue);
                }
              }}
              className="bg-bg-input border border-blue-500 rounded px-1.5 py-0.5 text-[11px] font-mono text-text-main focus:outline-none w-full"
              autoFocus
              ref={(el) => { if (el && document.activeElement !== el) { el.focus(); el.select(); } }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.currentTarget.focus();
              if (!isCompiling) toggleDir(entry.relative_path);
            }}
            onMouseDown={(e) => e.currentTarget.focus()}
            onContextMenu={(e) => onItemContextMenu(e, entry)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === "F2") {
                e.preventDefault();
                e.stopPropagation();
                setRenamingPath(entry.relative_path);
                setRenamingValue(entry.name);
              }
            }}
            disabled={isCompiling}
            style={{ paddingLeft: `${level * 8 + 6}px` }}
            className={`w-full text-left py-1 pr-2 hover:bg-bg-input-hover text-text-muted hover:text-text-main flex items-center gap-1.5 transition-colors text-[11px] font-mono border-none bg-transparent focus:outline-none focus:bg-bg-input-hover focus:text-text-main ${
              isCompiling ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <ChevronRight
              size={10}
              className={`transform transition-transform text-text-extra-subtle shrink-0 ${isExpanded ? "rotate-90" : ""}`}
            />
            <span className="truncate">{entry.name}</span>
          </button>
        )}

        {isExpanded && entry.children && entry.children.map(child => (
          <FileTreeItem
            key={child.relative_path}
            entry={child}
            level={level + 1}
            expandedDirs={expandedDirs}
            toggleDir={toggleDir}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
            isCompiling={isCompiling}
            renamingPath={renamingPath}
            setRenamingPath={setRenamingPath}
            renamingValue={renamingValue}
            setRenamingValue={setRenamingValue}
            onRenameSubmit={onRenameSubmit}
            onItemContextMenu={onItemContextMenu}
          />
        ))}
      </div>
    );
  }

  return isRenaming ? (
    <div style={{ paddingLeft: `${level * 8 + 18}px` }} className="py-1 pr-2">
      <input 
        value={renamingValue}
        onChange={(e) => setRenamingValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.currentTarget.blur();
          } else if (e.key === "Escape") {
            isCancelledRef.current = true;
            setRenamingPath(null);
          }
        }}
        onBlur={() => {
          if (!isCancelledRef.current) {
            onRenameSubmit(entry, renamingValue);
          }
        }}
        className="bg-bg-input border border-blue-500 rounded px-1.5 py-0.5 text-[11px] font-mono text-text-main focus:outline-none w-full"
        autoFocus
        ref={(el) => {
          if (el && document.activeElement !== el) {
            el.focus();
            const dotIndex = entry.name.lastIndexOf(".");
            if (dotIndex !== -1) {
              el.setSelectionRange(0, dotIndex);
            } else {
              el.select();
            }
          }
        }}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  ) : (
    <button
      onClick={(e) => {
        e.currentTarget.focus();
        if (!isCompiling) onFileSelect(entry.relative_path);
      }}
      onMouseDown={(e) => e.currentTarget.focus()}
      onContextMenu={(e) => onItemContextMenu(e, entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === "F2") {
          e.preventDefault();
          e.stopPropagation();
          setRenamingPath(entry.relative_path);
          setRenamingValue(entry.name);
        }
      }}
      disabled={isCompiling}
      style={{ paddingLeft: `${level * 8 + 18}px` }}
      className={`w-full text-left py-1.5 pr-2 flex items-center gap-1.5 transition-colors text-[11px] font-mono border-none bg-transparent border-l-2 focus:outline-none focus:bg-bg-input-hover focus:text-text-main ${
        isCompiling
          ? "opacity-50 cursor-not-allowed text-text-extra-subtle border-transparent"
          : isSelected
            ? "bg-blue-500/10 text-blue-400 border-blue-500 font-semibold cursor-pointer focus:border-blue-500 focus:bg-blue-500/15"
            : "text-text-muted hover:text-text-main hover:bg-bg-input-hover border-transparent cursor-pointer focus:bg-bg-input-hover focus:text-text-main focus:border-blue-500/30"
      }`}
    >
      <span className="truncate">{entry.name}</span>
    </button>
  );
}

function FileTree({
  tree,
  expandedDirs,
  toggleDir,
  selectedFile,
  onFileSelect,
  isCompiling,
  renamingPath,
  setRenamingPath,
  renamingValue,
  setRenamingValue,
  onRenameSubmit,
  onItemContextMenu
}: {
  tree: FileEntry[];
  expandedDirs: Set<string>;
  toggleDir: (path: string) => void;
  selectedFile: string;
  onFileSelect: (path: string) => void;
  isCompiling: boolean;
  renamingPath: string | null;
  setRenamingPath: (val: string | null) => void;
  renamingValue: string;
  setRenamingValue: (val: string) => void;
  onRenameSubmit: (entry: FileEntry, val: string) => void;
  onItemContextMenu: (e: React.MouseEvent, entry: FileEntry) => void;
}) {
  return (
    <div className="w-full flex flex-col overflow-y-auto select-none py-2">
      {tree.map(entry => (
        <FileTreeItem
          key={entry.relative_path}
          entry={entry}
          level={0}
          expandedDirs={expandedDirs}
          toggleDir={toggleDir}
          selectedFile={selectedFile}
          onFileSelect={onFileSelect}
          isCompiling={isCompiling}
          renamingPath={renamingPath}
          setRenamingPath={setRenamingPath}
          renamingValue={renamingValue}
          setRenamingValue={setRenamingValue}
          onRenameSubmit={onRenameSubmit}
          onItemContextMenu={onItemContextMenu}
        />
      ))}
    </div>
  );
}

