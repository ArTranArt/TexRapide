import { useSettingsStore } from '../store/settingsStore';
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { Activity, Plus, Settings, Play, FolderOpen, Layers, Code, ChevronRight, Info, FolderPlus, X, ChevronDown, SortAsc, Clock, Calendar, Lock, EyeOff, Search, Check, RefreshCw, Terminal, BookOpen, Sun, Moon, Copy, ExternalLink, Laptop, WrapText, Save, Edit2, Trash2, Eraser, Repeat } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { latex } from "codemirror-lang-latex";
import { StateEffect, StateField } from "@codemirror/state";
import { EditorView, Decoration, keymap } from "@codemirror/view";
import { toggleComment, insertNewline } from "@codemirror/commands";


interface HealthStatus {
  binary: String;
  installed: boolean;
  version: string | null;
}

interface Project {
  name: string;
  last_modified: number;
}

interface FileEntry {
  name: string;
  relative_path: string;
  is_dir: boolean;
  children?: FileEntry[];
}

// CodeMirror decorations and effects for temporary line highlighting (SyncTeX inverse search)
const addLineHighlight = StateEffect.define<number>();
const clearLineHighlight = StateEffect.define<null>();

const lineHighlightMark = Decoration.line({
  attributes: { class: "bg-amber-400/25 border-l-4 border-amber-500 shadow-sm" }
});

const lineHighlightField = StateField.define<any>({
  create() {
    return Decoration.none;
  },
  update(decorations: any, tr: any) {
    decorations = decorations.map(tr.changes);
    for (let e of tr.effects) {
      if (e.is(addLineHighlight)) {
        decorations = Decoration.none.update({
          add: [lineHighlightMark.range(e.value)]
        });
      } else if (e.is(clearLineHighlight)) {
        decorations = Decoration.none;
      }
    }
    return decorations;
  },
  provide: (f: any) => EditorView.decorations.from(f)
});


export function useAppState() {

  const theme = useSettingsStore(s => s.theme);
  const setTheme = useSettingsStore(s => s.setTheme);
  const leftPanelWidth = useSettingsStore(s => s.leftPanelWidth);
  const setLeftPanelWidth = useSettingsStore(s => s.setLeftPanelWidth);
  const topPanelHeight = useSettingsStore(s => s.topPanelHeight);
  const setTopPanelHeight = useSettingsStore(s => s.setTopPanelHeight);
  const drawerHeight = useSettingsStore(s => s.drawerHeight);
  const setDrawerHeight = useSettingsStore(s => s.setDrawerHeight);
  const fileExplorerWidth = useSettingsStore(s => s.fileExplorerWidth);
  const setFileExplorerWidth = useSettingsStore(s => s.setFileExplorerWidth);
  const pdfPosition = useSettingsStore(s => s.pdfPosition);
  const setPdfPosition = useSettingsStore(s => s.setPdfPosition);
  const showPdfPanel = useSettingsStore(s => s.showPdfPanel);
  const setShowPdfPanel = useSettingsStore(s => s.setShowPdfPanel);
  const showFileTree = useSettingsStore(s => s.showFileTree);
  const setShowFileTree = useSettingsStore(s => s.setShowFileTree);
  const editorFontSize = useSettingsStore(s => s.editorFontSize);
  const setEditorFontSize = useSettingsStore(s => s.setEditorFontSize);
  const lineWrapping = useSettingsStore(s => s.lineWrapping);
  const setLineWrapping = useSettingsStore(s => s.setLineWrapping);
  const autoIndent = useSettingsStore(s => s.autoIndent);
  const setAutoIndent = useSettingsStore(s => s.setAutoIndent);

  const [view, setView] = useState<"dashboard" | "settings" | "project" | "help">("dashboard");
  const [helpTab, setHelpTab] = useState<"basics" | "text" | "math" | "media">("basics");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [projectTree, setProjectTree] = useState<FileEntry[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [isCreatingFile, setIsCreatingFile] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>("");
  const newFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreatingFile && newFileInputRef.current) {
      newFileInputRef.current.focus();
    }
  }, [isCreatingFile]);
  const autoSaveEnabled = true;

  const toggleDir = (dirPath: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(dirPath)) {
        next.delete(dirPath);
      } else {
        next.add(dirPath);
      }
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const [compilationEngine, setCompilationEngine] = useState<"system" | "tectonic">(() => {
    const saved = localStorage.getItem("texrapide_compilation_engine");
    return saved === "tectonic" ? "tectonic" : "system";
  });

  useEffect(() => {
    localStorage.setItem("texrapide_compilation_engine", compilationEngine);
  }, [compilationEngine]);

  const [health, setHealth] = useState<HealthStatus[]>([]);
  
  const hasDistribution = compilationEngine === "tectonic" 
    ? health.find(h => h.binary === "tectonic")?.installed ?? false
    : health.find(h => h.binary === "distribution")?.installed ?? false;
    
  const hasCliTools = compilationEngine === "tectonic"
    ? true // Tectonic is an all-in-one tool
    : health.filter(h => ["pdflatex", "latexmk", "bibtex"].includes(h.binary.toString())).every(h => h.installed);
    
  const hasSkim = health.find(h => h.binary === "skim")?.installed ?? false;
  const isSystemReady = hasDistribution && hasCliTools && hasSkim;

  const [analysisStep, setAnalysisStep] = useState<number>(3);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<"distribution" | "cli" | "skim" | null>(null);
  const [selectedNode, setSelectedNode] = useState<"distribution" | "cli" | "skim" | null>(null);

  const pdflatexInfo = health.find(h => h.binary === "pdflatex");
  const latexmkInfo = health.find(h => h.binary === "latexmk");
  const bibtexInfo = health.find(h => h.binary === "bibtex");
  const tectonicInfo = health.find(h => h.binary === "tectonic");
  const skimInfo = health.find(h => h.binary === "skim");
  const distributionInfo = health.find(h => h.binary === "distribution");

  const formatBinaryVersion = (bin: string, rawVersion: string | null | undefined) => {
    if (!rawVersion) return "";
    if (bin === "pdflatex") {
      const match = rawVersion.match(/3\.14\S*/);
      return match ? `v${match[0]}` : "";
    }
    if (bin === "latexmk") {
      const match = rawVersion.match(/(?:version|v)?\s*(\d+\.\d+\S*)/i);
      return match ? `v${match[1]}` : "";
    }
    if (bin === "bibtex") {
      const match = rawVersion.match(/0\.99\S*/);
      return match ? `v${match[0]}` : "";
    }
    if (bin === "skim") {
      // Skim versions could look like "Version 1.7.5"
      const match = rawVersion.match(/Version\s+(\S*)/i) || rawVersion.match(/(\d+\.\d+\S*)/);
      return match ? `v${match[1] || match[0]}` : "";
    }
    return rawVersion;
  };

  const pdflatexVer = formatBinaryVersion("pdflatex", pdflatexInfo?.version);
  const latexmkVer = formatBinaryVersion("latexmk", latexmkInfo?.version);
  const bibtexVer = formatBinaryVersion("bibtex", bibtexInfo?.version);
  const skimVer = formatBinaryVersion("skim", skimInfo?.version);

  const tectonicVer = formatBinaryVersion("tectonic", tectonicInfo?.version);

  const distributionTooltip = compilationEngine === "tectonic"
    ? (hasDistribution ? `Tectonic : ${tectonicVer || "détecté"}` : "Tectonic : non détecté")
    : (hasDistribution ? `Distribution LaTeX : ${distributionInfo?.version || "détectée"}` : "Distribution LaTeX : non détectée");

  const cliTooltip = (() => {
    if (compilationEngine === "tectonic") return "Tectonic intègre déjà tous les outils CLI nécessaires.";
    const tools = [];
    if (pdflatexInfo?.installed) {
      tools.push(`pdflatex${pdflatexVer ? ` (${pdflatexVer})` : ''}`);
    } else {
      tools.push("pdflatex (manquant)");
    }
    if (latexmkInfo?.installed) {
      tools.push(`latexmk${latexmkVer ? ` (${latexmkVer})` : ''}`);
    } else {
      tools.push("latexmk (manquant)");
    }
    if (bibtexInfo?.installed) {
      tools.push(`bibtex${bibtexVer ? ` (${bibtexVer})` : ''}`);
    } else {
      tools.push("bibtex (manquant)");
    }
    return tools.join('\n');
  })();

  const skimTooltip = hasSkim
    ? `Lecteur PDF externe${skimVer ? ` (${skimVer})` : ''}`
    : "Lecteur PDF externe : non détecté";

  const [projectName, setProjectName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [mainFile, setMainFile] = useState("main.tex");
  const [targetDir, setTargetDir] = useState(() => localStorage.getItem("texrapide_target_dir") || "");
  const [dashboardProjectsDir, setDashboardProjectsDir] = useState(() => localStorage.getItem("texrapide_dashboard_dir") || localStorage.getItem("texrapide_target_dir") || "");
  const [templateDir, setTemplateDir] = useState(() => localStorage.getItem("texrapide_template_dir") || "");

  useEffect(() => {
    async function loadDefaults() {
      if (!targetDir || !dashboardProjectsDir || !templateDir) {
        try {
          const [projectsDir, templatesDir] = await invoke<[string, string]>("get_default_paths");
          
          if (!targetDir) {
            setTargetDir(projectsDir);
            localStorage.setItem("texrapide_target_dir", projectsDir);
          }
          if (!dashboardProjectsDir) {
            setDashboardProjectsDir(projectsDir);
            localStorage.setItem("texrapide_dashboard_dir", projectsDir);
          }
          if (!templateDir) {
            setTemplateDir(templatesDir);
            localStorage.setItem("texrapide_template_dir", templatesDir);
          }
        } catch (e) {
          console.error("Failed to load default paths:", e);
        }
      }
    }
    loadDefaults();
  }, []);

  useEffect(() => {
    localStorage.setItem("texrapide_target_dir", targetDir);
  }, [targetDir]);

  useEffect(() => {
    localStorage.setItem("texrapide_dashboard_dir", dashboardProjectsDir);
  }, [dashboardProjectsDir]);

  useEffect(() => {
    localStorage.setItem("texrapide_template_dir", templateDir);
  }, [templateDir]);

  const [availableTemplates, setAvailableTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [projectTexFiles, setProjectTexFiles] = useState<string[]>([]);
  const [unfilteredTexCount, setUnfilteredTexCount] = useState(0);
  const [floatingPos, setFloatingPos] = useState<"left" | "right">("right");
  const [floatingDragOffset, setFloatingDragOffset] = useState<number>(0);
  const [isFloatingCollapsed, setIsFloatingCollapsed] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "alphabetical">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [compileStatus, setCompileStatus] = useState<"idle" | "compiling" | "success" | "error">("idle");
  const [compileLogs, setCompileLogs] = useState("");
  const isSwitchLocked = compileStatus === "compiling";
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  
  const [activeOsTab, setActiveOsTab] = useState<"mac" | "windows" | "linux">(() => {
    if (navigator.userAgent.indexOf("Win") !== -1) return "windows";
    if (navigator.userAgent.indexOf("Linux") !== -1) return "linux";
    return "mac";
  });
  
  const mainContentRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);


  const [pdfViewerMode, setPdfViewerMode] = useState<"integrated" | "system">(() => {
    const saved = localStorage.getItem("texrapide_pdf_viewer_mode");
    return saved === "system" ? "system" : "integrated";
  });



  const [pdfExists, setPdfExists] = useState(false);

  const checkPdfExists = async () => {
    if (!activeProject || !mainFile) {
      setPdfExists(false);
      return;
    }
    const pdfPath = `${activeProject}/${mainFile.replace(/\.tex$/, ".pdf")}`;
    try {
      const exists = await invoke<boolean>("file_exists", { projectPath: activeProject, path: pdfPath });
      setPdfExists(exists);
    } catch (e) {
      console.error(e);
      setPdfExists(false);
    }
  };

  useEffect(() => {
    checkPdfExists();
  }, [activeProject, mainFile, compileStatus]);

  // Zoom and Pan states removed in favor of native WKWebView PDF reader gestures.

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = drawerHeight;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(200, Math.min(window.innerHeight - 100, startHeight - deltaY));
      setDrawerHeight(newHeight);
    };
    
    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const handleLineClick = async (lineNum: number, filename?: string) => {
    if (!activeProject) return;
    const targetFile = filename || mainFile;
    try {
      await invoke("open_in_vscode_at_line", { 
        projectPath: activeProject, 
        file: targetFile, 
        line: lineNum 
      });
    } catch (error) {
      console.error("Failed to open file in editor:", error);
    }
  };
  const [editingFile, setEditingFile] = useState<string>("");
  const [editorContent, setEditorContent] = useState<string>("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const isManualOrientationRef = useRef<boolean>(false);




  useEffect(() => {
    const handleResize = () => {
      // 1. Manage orientation based on window width
      if (!isManualOrientationRef.current) {
        const width = window.innerWidth;
        if (width < 850 && (pdfPosition === "right" || pdfPosition === "left")) {
          setPdfPosition("bottom");
        } else if (width >= 850 && (pdfPosition === "bottom" || pdfPosition === "top")) {
          setPdfPosition("right");
        }
      }

      // 2. Clamp editor sizes to ensure PDF panel remains visible and editor remains readable
      const maxAllowedWidth = Math.max(350, window.innerWidth - 200); // PDF min-width 200px
      setLeftPanelWidth(currentWidth => {
        return Math.max(350, Math.min(currentWidth, maxAllowedWidth));
      });

      const maxAllowedHeight = Math.max(150, window.innerHeight - 200); // PDF min-height 200px
      setTopPanelHeight(currentHeight => {
        return Math.max(150, Math.min(currentHeight, maxAllowedHeight));
      });
    };

    // Run once initially
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pdfPosition]);
  const isResizingRef = useRef(false);
  const editorRef = useRef<any>(null);
  const [pendingHighlightLine, setPendingHighlightLine] = useState<number | null>(null);

  // States and refs for SyncTeX forward search (Code -> PDF)
  const [forwardSearchRipple, setForwardSearchRipple] = useState<{ page: number; x: number; y: number; timestamp: number } | null>(null);
  const forwardSearchRefs = useRef({ activeProject, editingFile, mainFile });
  
  useEffect(() => {
    forwardSearchRefs.current = { activeProject, editingFile, mainFile };
  }, [activeProject, editingFile, mainFile]);

  const handleForwardSearch = useCallback(async (lineNum: number) => {
    const { activeProject, editingFile, mainFile } = forwardSearchRefs.current;
    if (!activeProject || !editingFile || !mainFile) return;
    const texPath = `${activeProject}/${editingFile}`;
    const pdfPath = `${activeProject}/${mainFile.replace(/\.tex$/, ".pdf")}`;

    try {
      const result: { page: number; x: number; y: number } = await invoke("synctex_forward_search", {
        pdfPath,
        line: lineNum,
        column: 1,
        texPath,
      });

      setForwardSearchRipple({
        page: result.page,
        x: result.x,
        y: result.y,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.warn("SyncTeX forward search failed:", err);
    }
  }, []);

  const cmEventHandlers = useMemo(() => {
    return EditorView.domEventHandlers({
      mousedown: (event, view) => {
        if (event.metaKey || event.ctrlKey) {
          const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
          if (pos !== null) {
            const line = view.state.doc.lineAt(pos);
            handleForwardSearch(line.number);
            event.preventDefault();
            return true;
          }
        }
        return false;
      },
      dblclick: (event, view) => {
        const pos = view.posAtCoords({ x: event.clientX, y: event.clientY });
        if (pos !== null) {
          const line = view.state.doc.lineAt(pos);
          handleForwardSearch(line.number);
        }
        return false;
      }
    });
  }, [handleForwardSearch]);

  interface Shortcut {
    key: string;
    code: string;
  }

  const parseShortcut = (saved: string | null): Shortcut | null => {
    if (!saved) return null;
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === "object" && typeof parsed.key === "string" && typeof parsed.code === "string") {
        return parsed;
      }
    } catch (_) {}
    return null;
  };

  const [zoomInKey, setZoomInKey] = useState<Shortcut | null>(() => {
    return parseShortcut(localStorage.getItem("texrapide_zoom_in_shortcut"));
  });
  const [zoomOutKey, setZoomOutKey] = useState<Shortcut | null>(() => {
    return parseShortcut(localStorage.getItem("texrapide_zoom_out_shortcut"));
  });
  const [commentKey, setCommentKey] = useState<Shortcut | null>(() => {
    return parseShortcut(localStorage.getItem("texrapide_comment_shortcut"));
  });
  const [recordingField, setRecordingField] = useState<"zoomIn" | "zoomOut" | "comment" | null>(null);




  useEffect(() => {
    if (zoomInKey) {
      localStorage.setItem("texrapide_zoom_in_shortcut", JSON.stringify(zoomInKey));
    } else {
      localStorage.removeItem("texrapide_zoom_in_shortcut");
    }
  }, [zoomInKey]);

  useEffect(() => {
    if (zoomOutKey) {
      localStorage.setItem("texrapide_zoom_out_shortcut", JSON.stringify(zoomOutKey));
    } else {
      localStorage.removeItem("texrapide_zoom_out_shortcut");
    }
  }, [zoomOutKey]);

  useEffect(() => {
    if (commentKey) {
      localStorage.setItem("texrapide_comment_shortcut", JSON.stringify(commentKey));
    } else {
      localStorage.removeItem("texrapide_comment_shortcut");
    }
  }, [commentKey]);

  useEffect(() => {
    if (!recordingField) return;

    const handleRecordingKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const key = e.key;
      const code = e.code;
      if (key === "Escape") {
        setRecordingField(null);
        return;
      }
      
      if (["Control", "Shift", "Alt", "Meta", "CapsLock", "Tab", "Enter"].includes(key)) {
        return;
      }

      const newShortcut = { key, code };

      if (recordingField === "zoomIn") {
        if (key === "=" || key === "+") setZoomInKey(null);
        else setZoomInKey(newShortcut);
      } else if (recordingField === "zoomOut") {
        if (key === "-") setZoomOutKey(null);
        else setZoomOutKey(newShortcut);
      } else if (recordingField === "comment") {
        if (key === "/" || key === ":") setCommentKey(null);
        else setCommentKey(newShortcut);
      }
      
      setRecordingField(null);
    };

    window.addEventListener("keydown", handleRecordingKeyDown, true);
    return () => window.removeEventListener("keydown", handleRecordingKeyDown, true);
  }, [recordingField]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = (pdfPosition === "right" || pdfPosition === "left") ? "col-resize" : "row-resize";
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      
      const isHorizontal = pdfPosition === "right" || pdfPosition === "left";
      const isReversed = pdfPosition === "left" || pdfPosition === "top";
      
      if (isHorizontal) {
        const calculatedWidth = isReversed ? window.innerWidth - e.clientX : e.clientX;
        const minWidth = 350;
        const maxWidth = Math.max(minWidth, window.innerWidth - 200);
        if (calculatedWidth >= minWidth && calculatedWidth <= maxWidth) {
          setLeftPanelWidth(calculatedWidth);
        }
      } else {
        const calculatedHeight = isReversed ? window.innerHeight - e.clientY : e.clientY;
        const minHeight = 150;
        const maxHeight = window.innerHeight - 150;
        if (calculatedHeight >= minHeight && calculatedHeight <= maxHeight) {
          setTopPanelHeight(calculatedHeight);
        }
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "";
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [pdfPosition]);

  const jumpToEditorLine = (lineNum: number) => {
    const view = editorRef.current?.view;
    if (!view) return;

    try {
      const doc = view.state.doc;
      const targetLine = Math.max(1, Math.min(lineNum, doc.lines));
      const lineObj = doc.line(targetLine);
      
      // Move cursor and scroll to top
      view.dispatch({
        selection: { anchor: lineObj.from },
        effects: [
          EditorView.scrollIntoView(lineObj.from, { y: "start" }),
          addLineHighlight.of(lineObj.from)
        ]
      });

      // Clear any accidental browser text selection
      window.getSelection()?.removeAllRanges();

      // Clear highlight after 2 seconds
      setTimeout(() => {
        if (view && !view.destroyed) {
          view.dispatch({
            effects: clearLineHighlight.of(null)
          });
        }
      }, 2000);
    } catch (err) {
      console.error("Failed to scroll to editor line:", err);
    }
  };

  const handleLineSelect = async (rawPath: string, line: number) => {
    if (!activeProject) return;
    if (isSwitchLocked) {
      console.log("SyncTeX jump blocked: project is watching/compiling.");
      return;
    }

    let normalizedPath = rawPath.replace(/\\/g, "/");
    const normalizedProjectDir = activeProject.replace(/\\/g, "/");
    let relativeFile = normalizedPath;

    // 1. Try case-insensitive prefix strip
    if (relativeFile.toLowerCase().startsWith(normalizedProjectDir.toLowerCase())) {
      relativeFile = relativeFile.substring(normalizedProjectDir.length + 1);
    }
    if (relativeFile.startsWith("./")) {
      relativeFile = relativeFile.substring(2);
    }

    // 2. Fallback: match baseName in projectTexFiles list (e.g. main.tex)
    const baseName = relativeFile.substring(relativeFile.lastIndexOf("/") + 1);
    const matchedFile = projectTexFiles.find(f => f.toLowerCase() === baseName.toLowerCase());
    if (matchedFile) {
      relativeFile = matchedFile;
    }

    // 3. Prevent opening LaTeX auxiliary files (like .toc, .aux, etc.)
    const extMatch = relativeFile.match(/\.([a-zA-Z0-9]+)$/);
    const ext = extMatch ? extMatch[1].toLowerCase() : "";
    const isAuxFile = ["toc", "lof", "lot", "bbl", "blg", "aux", "out", "log", "ind", "idx", "gls", "glo"].includes(ext);

    if (isAuxFile) {
      const texRelativeFile = relativeFile.replace(/\.[a-zA-Z0-9]+$/, ".tex");
      let targetLine = 1;
      let keyword = "";

      if (ext === "toc") keyword = "\\tableofcontents";
      else if (ext === "lof") keyword = "\\listoffigures";
      else if (ext === "lot") keyword = "\\listoftables";

      try {
        const filePath = `${activeProject}/${texRelativeFile}`;
        const content = await invoke<string>("read_file", { projectPath: activeProject, path: filePath });
        if (content) {
          const lines = content.split("\n");
          let foundLine = -1;

          if (keyword) {
            foundLine = lines.findIndex(l => l.includes(keyword));
          } else if (ext === "bbl" || ext === "blg") {
            foundLine = lines.findIndex(l => 
              l.includes("\\bibliography") || 
              l.includes("\\printbibliography") || 
              l.includes("thebibliography")
            );
          }

          if (foundLine !== -1) {
            targetLine = foundLine + 1; // 1-indexed
          }
        }
      } catch (err) {
        console.error("Failed to read tex file for aux redirect:", err);
      }

      relativeFile = texRelativeFile;
      line = targetLine;
    }

    console.log("SyncTeX selected file:", relativeFile, "line:", line);

    if (relativeFile !== editingFile) {
      if (hasUnsavedChanges && editingFile) {
        await saveFileContent(editingFile, editorContent);
      }
      setEditingFile(relativeFile);
      if (relativeFile.toLowerCase().endsWith(".tex") && !relativeFile.includes("/")) {
        setMainFile(relativeFile);
      }
      setPendingHighlightLine(line);
    } else {
      jumpToEditorLine(line);
    }
  };


  useEffect(() => {
    if (pendingHighlightLine && editorContent) {
      const timer = setTimeout(() => {
        jumpToEditorLine(pendingHighlightLine);
        setPendingHighlightLine(null);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editorContent, pendingHighlightLine]);

  const loadFileContent = async (fileName: string) => {
    if (!activeProject) return;
    const filePath = `${activeProject}/${fileName}`;
    try {
      const content = await invoke<string>("read_file", { projectPath: activeProject, path: filePath });
      setEditorContent(content);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error("Failed to read file:", error);
    }
  };

  const saveFileContent = async (fileName: string, content: string) => {
    if (!activeProject) return;
    const filePath = `${activeProject}/${fileName}`;
    try {
      await invoke("write_file", { projectPath: activeProject, path: filePath, content });
      setHasUnsavedChanges(false);
      
      if (!autoSaveEnabled) {
        await invoke("compile_once", { 
          projectPath: activeProject, 
          mainFile: mainFile, 
          pdfViewerMode: pdfViewerMode,
          engine: compilationEngine
        });
      }
    } catch (error) {
      console.error("Failed to write file:", error);
      setCompileStatus("error");
    }
  };

  // Auto-save logic
  useEffect(() => {
    if (!autoSaveEnabled || !activeProject || !editingFile || !hasUnsavedChanges) return;
    
    const delayDebounce = setTimeout(() => {
      saveFileContent(editingFile, editorContent);
    }, 1000); // 1s debounce

    return () => clearTimeout(delayDebounce);
  }, [autoSaveEnabled, editorContent, activeProject, editingFile, hasUnsavedChanges]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (activeProject) {
          if (isWatching) {
            if (editingFile && hasUnsavedChanges) {
              saveFileContent(editingFile, editorContent);
            }
          } else {
            handleCompileOnce();
          }
        }
      } else if (e.metaKey || e.ctrlKey) {
        // 1. Comment handling (always needs Shift modifier)
        const isCommentMatch = commentKey
          ? (e.shiftKey && e.code === commentKey.code)
          : (e.shiftKey && (e.key === "/" || e.key === ":" || e.code === "Slash"));

        if (isCommentMatch) {
          e.preventDefault();
          e.stopPropagation();
          const editorView = editorRef.current?.view;
          if (editorView) {
            toggleComment(editorView);
          }
          return;
        }

        // 2. Zoom handling
        const isHoveringPdf = document.getElementById("integrated-pdf-viewer")?.matches(":hover");
        if (!isHoveringPdf) {
          const isZoomInMatch = zoomInKey
            ? (e.code === zoomInKey.code || e.code === "NumpadAdd")
            : (e.key === "+" || e.key === "=" || e.code === "NumpadAdd");

          const isZoomOutMatch = zoomOutKey
            ? (e.code === zoomOutKey.code || e.code === "NumpadSubtract")
            : (e.key === "-" || e.code === "NumpadSubtract");

          if (isZoomInMatch) {
            e.preventDefault();
            e.stopPropagation();
            setEditorFontSize(s => Math.min(32, s + 1));
          } else if (isZoomOutMatch) {
            e.preventDefault();
            e.stopPropagation();
            setEditorFontSize(s => Math.max(8, s - 1));
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editorContent, activeProject, editingFile, hasUnsavedChanges, zoomInKey, zoomOutKey, commentKey, isWatching, mainFile, pdfViewerMode, compilationEngine]);

  // Default selected file loading
  useEffect(() => {
    if (view === "project" && activeProject) {
      if (!editingFile) {
        setEditingFile(mainFile);
      } else {
        loadFileContent(editingFile);
      }
    }
  }, [view, activeProject, editingFile]);

  // Ignore files feature
  const [ignoredPatterns, setIgnoredPatterns] = useState<string[]>(() => {
    const saved = localStorage.getItem("texrapide_ignored");
    return saved ? JSON.parse(saved) : ["preamble", "macros", "letterfonts"];
  });
  const [newPattern, setNewPattern] = useState("");

  useEffect(() => {
    localStorage.setItem("texrapide_ignored", JSON.stringify(ignoredPatterns));
  }, [ignoredPatterns]);

  const checkHealth = async () => {
    try {
      setSelectedNode(null);
      setHoveredNode(null);
      setIsAnalyzing(true);
      setAnalysisStep(0);
      
      const status: HealthStatus[] = await invoke("check_latex_health");
      
      // Etape 0 -> 1 : Analyse de la distribution
      setTimeout(() => {
        setAnalysisStep(1);
        
        // Etape 1 -> 2 : Analyse des outils CLI
        setTimeout(() => {
          setAnalysisStep(2);
          
          // Etape 2 -> 3 : Analyse du lecteur Skim
          setTimeout(() => {
            setHealth(status);
            setAnalysisStep(3);
            setIsAnalyzing(false);
          }, 800);
        }, 800);
      }, 800);

    } catch (error) {
      console.error("Health check failed:", error);
      setIsAnalyzing(false);
      setAnalysisStep(3);
    }
  };

  const fetchProjects = async () => {
    try {
      const projects: Project[] = await invoke("list_projects", { targetDir: dashboardProjectsDir });
      setExistingProjects(projects);
    } catch (error) {
      console.error("Failed to fetch projects:", error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const templates: string[] = await invoke("list_templates", { templateDir });
      setAvailableTemplates(templates);
      if (templates.length > 0) setSelectedTemplate(templates[0]);
    } catch (error) {
      console.error("Failed to fetch templates:", error);
    }
  };

  const fetchProjectTexFiles = async (path: string) => {
    try {
      const files: string[] = await invoke("list_tex_files", { path });
      setUnfilteredTexCount(files.length);
      
      const filtered = files.filter(file => {
        const lowerFile = file.toLowerCase();
        return !ignoredPatterns.some(pattern => lowerFile.includes(pattern.toLowerCase()));
      });
      
      setProjectTexFiles(filtered);
      if (filtered.length > 0 && !filtered.includes(mainFile)) {
        setMainFile(filtered[0]);
      } else if (filtered.length === 0) {
        setMainFile("");
      }
    } catch (error) {
      console.error("Failed to fetch tex files:", error);
    }
  };

  const fetchProjectTree = async (path: string) => {
    try {
      const tree = await invoke<FileEntry[]>("list_project_tree", { projectPath: dashboardProjectsDir, path });
      
      // Filter tree based on ignoredPatterns
      const filterTreeNodes = (nodes: FileEntry[]): FileEntry[] => {
        return nodes
          .filter(node => {
            const nameLower = node.name.toLowerCase();
            return !ignoredPatterns.some(pattern => 
              pattern && nameLower.includes(pattern.toLowerCase())
            );
          })
          .map(node => {
            if (node.is_dir && node.children) {
              return {
                ...node,
              };
            }
            return node;
          });
      };
      
      setProjectTree(filterTreeNodes(tree));
    } catch (error) {
      console.error("Failed to fetch project tree:", error);
    }
  };

  const handleCreateFile = async () => {
    if (!activeProject || !newFileName.trim()) return;
    
    let fileName = newFileName.trim();
    
    if (fileName.startsWith('.')) {
      alert("Le nom du fichier ne peut pas commencer par un point (ces fichiers sont masqués).");
      return;
    }
    
    const invalidChars = /[<>:"\/\\|?*\x00-\x1F]/;
    if (invalidChars.test(fileName)) {
      alert("Veuillez choisir un autre nom. Les caractères spéciaux (comme / \\ : * ? \" < > |) ne sont pas autorisés.");
      return;
    }

    if (!fileName.includes(".")) {
      fileName += ".tex";
    }
    
    const filePath = `${activeProject}/${fileName}`;
    
    try {
      const exists = await invoke<boolean>("file_exists", { projectPath: activeProject, path: filePath });
      if (exists) {
        alert("Ce fichier existe déjà.");
        return;
      }
      
      if (hasUnsavedChanges && editingFile) {
        await saveFileContent(editingFile, editorContent);
      }

      await invoke("write_file", { projectPath: activeProject, path: filePath, content: "" });
      
      setNewFileName("");
      setIsCreatingFile(false);
      
      await fetchProjectTexFiles(activeProject);
      await fetchProjectTree(activeProject);
      
      setEditingFile(fileName);
      if (fileName.toLowerCase().endsWith(".tex") && !fileName.includes("/")) {
        setMainFile(fileName);
      }
    } catch (error) {
      console.error("Failed to create file:", error);
      alert("Erreur lors de la création du fichier.");
    }
  };

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, entry: FileEntry } | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState<string>("");

  const handleRename = async (entry: FileEntry, newValue: string) => {
    setRenamingPath(null);
    const trimmed = newValue.trim();
    if (!trimmed || trimmed === entry.name) {
      return;
    }
    
    // Prevent invalid characters and accidental moves to subdirectories
    const invalidChars = /[<>:"\/\\|?*\x00-\x1F]/;
    if (invalidChars.test(trimmed)) {
      setTimeout(() => alert("Veuillez choisir un autre nom. Les caractères spéciaux (comme / \\ : * ? \" < > |) ne sont pas autorisés."), 10);
      return;
    }
    
    if (trimmed.startsWith('.')) {
      setTimeout(() => alert("Le nom du fichier ne peut pas commencer par un point (ces fichiers sont masqués)."), 10);
      return;
    }
    
    const oldPath = `${activeProject}/${entry.relative_path}`;
    const parentPath = entry.relative_path.includes("/") 
      ? entry.relative_path.substring(0, entry.relative_path.lastIndexOf("/")) 
      : "";
    const newRelativePath = parentPath ? `${parentPath}/${trimmed}` : trimmed;
    const newPath = `${activeProject}/${newRelativePath}`;

    try {
      if (isSwitchLocked) return;

      const exists = await invoke<boolean>("file_exists", { projectPath: activeProject, path: newPath });
      if (exists) {
        alert("Un fichier (ou dossier) avec ce nom existe déjà. Le renommage a été annulé pour ne pas écraser vos données.");
        return;
      }

      if (hasUnsavedChanges && editingFile === entry.relative_path) {
        await saveFileContent(editingFile, editorContent);
      }
      
      await invoke("rename_file", { projectPath: activeProject, oldPath, newPath });
      
      if (entry.is_dir) {
        const oldPrefix = `${entry.relative_path}/`;
        const newPrefix = `${newRelativePath}/`;
        if (editingFile.startsWith(oldPrefix)) {
          setEditingFile(newPrefix + editingFile.slice(oldPrefix.length));
        }
        if (mainFile.startsWith(oldPrefix)) {
          setMainFile(newPrefix + mainFile.slice(oldPrefix.length));
        }
        setExpandedDirs(prev => {
          const next = new Set<string>();
          prev.forEach(path => {
            if (path === entry.relative_path) {
              next.add(newRelativePath);
            } else if (path.startsWith(oldPrefix)) {
              next.add(newPrefix + path.slice(oldPrefix.length));
            } else {
              next.add(path);
            }
          });
          return next;
        });
      } else {
        if (editingFile === entry.relative_path) {
          setEditingFile(newRelativePath);
        }
        if (mainFile === entry.relative_path) {
          setMainFile(newRelativePath);
        }
      }

      await fetchProjectTexFiles(activeProject!);
      await fetchProjectTree(activeProject!);
    } catch (error) {
      alert(`Erreur lors du renommage : ${error}`);
    }
  };

  const handleDuplicate = async (entry: FileEntry) => {
    if (entry.is_dir) return;

    const dotIndex = entry.name.lastIndexOf(".");
    const baseName = dotIndex !== -1 ? entry.name.substring(0, dotIndex) : entry.name;
    const ext = dotIndex !== -1 ? entry.name.substring(dotIndex) : "";
    
    let copyName = `${baseName}_copy${ext}`;
    const parentPath = entry.relative_path.includes("/") 
      ? entry.relative_path.substring(0, entry.relative_path.lastIndexOf("/")) 
      : "";
    let destRelativePath = parentPath ? `${parentPath}/${copyName}` : copyName;
    let destPath = `${activeProject}/${destRelativePath}`;

    try {
      if (isSwitchLocked) return;
      
      let counter = 1;
      while (await invoke<boolean>("file_exists", { projectPath: activeProject, path: destPath })) {
        counter++;
        copyName = `${baseName}_copy${counter}${ext}`;
        destRelativePath = parentPath ? `${parentPath}/${copyName}` : copyName;
        destPath = `${activeProject}/${destRelativePath}`;
      }

      const srcPath = `${activeProject}/${entry.relative_path}`;
      await invoke("duplicate_file", { projectPath: activeProject, srcPath, destPath });
      
      await fetchProjectTexFiles(activeProject!);
      await fetchProjectTree(activeProject!);
      
      setEditingFile(destRelativePath);
    } catch (error) {
      alert(`Erreur lors de la duplication : ${error}`);
    }
  };

  const handleDelete = async (entry: FileEntry) => {
    const confirmMsg = entry.is_dir 
      ? `Voulez-vous vraiment supprimer le dossier "${entry.name}" et tout son contenu ?`
      : `Voulez-vous vraiment supprimer le fichier "${entry.name}" ?`;
      
    if (!confirm(confirmMsg)) return;

    const fullPath = `${activeProject}/${entry.relative_path}`;

    try {
      if (isSwitchLocked) return;
      await invoke("delete_file", { projectPath: activeProject, path: fullPath });
      
      const matchesPath = (path: string, target: string, isDir: boolean) => {
        if (isDir) {
          return path === target || path.startsWith(target + "/");
        }
        return path === target;
      };

      if (matchesPath(editingFile, entry.relative_path, entry.is_dir)) {
        setEditingFile("");
        setEditorContent("");
        setHasUnsavedChanges(false);
      }
      if (matchesPath(mainFile, entry.relative_path, entry.is_dir)) {
        setMainFile("");
      }

      await fetchProjectTexFiles(activeProject!);
      await fetchProjectTree(activeProject!);
    } catch (error) {
      alert(`Erreur lors de la suppression : ${error}`);
    }
  };

  useEffect(() => {
    if (view === "dashboard") {
      fetchProjects();
      checkHealth();
      fetchTemplates();
    }
  }, [view, dashboardProjectsDir]);

  useEffect(() => {
    if (activeProject) {
      fetchProjectTexFiles(activeProject);
      fetchProjectTree(activeProject);
    }
  }, [activeProject, ignoredPatterns]);

  useEffect(() => {
    if (activeProject && isWatching) {
      let active = true;
      const startWatching = async () => {
        try {
          await invoke("start_watch", { 
            projectPath: activeProject, 
            mainFile: mainFile, 
            pdfViewerMode: pdfViewerMode,
            engine: compilationEngine
          });
        } catch (error) {
          console.error("Failed to start watch mode:", error);
          if (active) setIsWatching(false);
        }
      };
      startWatching();
      
      return () => {
        active = false;
        invoke("stop_watch").catch(console.error);
      };
    } else {
      invoke("stop_watch").catch(console.error);
    }
  }, [activeProject, isWatching, mainFile, pdfViewerMode, compilationEngine]);

  const handleToggleWatch = async () => {
    if (!activeProject) return;
    
    if (isWatching) {
      try {
        await invoke("stop_watch");
        setIsWatching(false);
        setCompileStatus("idle");
      } catch (error) {
        alert(`Erreur : ${error}`);
      }
    } else {
      try {
        setIsWatching(true);
      } catch (error) {
        alert(`Erreur : ${error}`);
      }
    }
  };

  const handleCompileOnce = async () => {
    if (!activeProject || !mainFile || compileStatus === "compiling") return;
    
    // Save current file if there are unsaved changes
    if (editingFile && hasUnsavedChanges) {
      await saveFileContent(editingFile, editorContent);
    }
    
    try {
      setCompileStatus("compiling");
      await invoke("compile_once", {
        projectPath: activeProject,
        mainFile: mainFile,
        pdfViewerMode: pdfViewerMode,
        engine: compilationEngine
      });
    } catch (error) {
      console.error("Manual compilation failed:", error);
      setCompileStatus("error");
    }
  };

  const handleCleanAuxiliaryFiles = async () => {
    if (!activeProject) return;
    try {
      const deletedCount = await invoke<number>("clean_auxiliary_files", { projectPath: dashboardProjectsDir, path: activeProject });
      alert(`${deletedCount} fichier(s) auxiliaire(s) supprimé(s) avec succès.`);
    } catch (error) {
      alert(`Erreur lors du nettoyage : ${error}`);
    }
  };

  useEffect(() => {
    setDashboardProjectsDir(targetDir);
  }, [targetDir]);

  useEffect(() => {
    if (isCreatingInline) {
      setNewProjectName(""); // Clear field when opening
      if (inlineInputRef.current) {
        inlineInputRef.current.focus();
      }
    }
  }, [isCreatingInline]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    async function setupListener() {
      unlisten = await listen<{ status: "idle" | "compiling" | "success" | "error"; logs: string }>(
        "compile-status",
        (event) => {
          setCompileStatus(event.payload.status);
          if (event.payload.status === "compiling") {
            setCompileLogs("");
          } else {
            setCompileLogs(event.payload.logs);
          }
        }
      );
    }
    setupListener();
    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  useEffect(() => {
    if (isLogsOpen) {
      const timer = setTimeout(() => {
        if (compileStatus === "error") {
          // Essayer de défiler jusqu'à la première erreur pour la centrer
          const firstErrorEl = document.getElementById("first-error-line");
          if (firstErrorEl) {
            firstErrorEl.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
          }
        }
        
        // Fallback ou si pas d'erreur : défilement vers le bas
        if (logsEndRef.current) {
          logsEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
      }, 150);
      
      return () => clearTimeout(timer);
    }
  }, [compileLogs, isLogsOpen, compileStatus]);



  const activateProject = (name: string, path?: string) => {
    if (isSwitchLocked) return; 
    const fullPath = path || `${dashboardProjectsDir}/${name}`;
    setActiveProject(fullPath);
    setProjectName(name);
    setIsWatching(false);
    setCompileStatus("idle");
    setCompileLogs("");
    setIsLogsOpen(false);
    setEditingFile("");
    setEditorContent("");
    setHasUnsavedChanges(false);
    setView("dashboard");

    // Smooth scroll to top when activating a project
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeselectProject = () => {
    if (isSwitchLocked) return;
    setActiveProject(null);
    setIsWatching(false);
    setCompileStatus("idle");
    setCompileLogs("");
    setIsLogsOpen(false);
    setEditingFile("");
    setEditorContent("");
    setHasUnsavedChanges(false);
    setView("dashboard");
  };

  const handleSelectDir = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: targetDir,
      });
      if (selected && typeof selected === 'string') {
        setTargetDir(selected);
      }
    } catch (error) {
      console.error("Failed to select directory:", error);
    }
  };

  const handleSelectDashboardDir = async () => {
    if (isSwitchLocked) return;
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: dashboardProjectsDir,
      });
      if (selected && typeof selected === 'string') {
        setDashboardProjectsDir(selected);
        setSortBy("alphabetical"); 
      }
    } catch (error) {
      console.error("Failed to select dashboard directory:", error);
    }
  };

  const handleSelectTemplateDir = async () => {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        defaultPath: templateDir,
      });
      if (selected && typeof selected === 'string') {
        setTemplateDir(selected);
      }
    } catch (error) {
      console.error("Failed to select template directory:", error);
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const fullTemplatePath = `${templateDir}/${selectedTemplate}`;
      // Use dashboardProjectsDir to create the project in the currently viewed directory
      const path: string = await invoke("create_project", { 
        args: { name: newProjectName, target_dir: dashboardProjectsDir, template_dir: fullTemplatePath } 
      });
      activateProject(newProjectName, path); 
      setIsCreatingInline(false);
      setNewProjectName("");
      fetchProjects();
    } catch (error) {
      alert(`Erreur : ${error}`);
    }
  };




  const handleOpenVSCode = async () => {
    if (!activeProject) return;
    try {
      await invoke("open_in_vscode", { path: activeProject });
    } catch (error) {
      alert(`Erreur VSCode : ${error}`);
    }
  };


  const addIgnoredPattern = () => {
    if (newPattern && !ignoredPatterns.includes(newPattern)) {
      setIgnoredPatterns([...ignoredPatterns, newPattern]);
      setNewPattern("");
    }
  };

  const removeIgnoredPattern = (pattern: string) => {
    setIgnoredPatterns(ignoredPatterns.filter(p => p !== pattern));
  };

  useEffect(() => {
    checkHealth();
  }, []);

  const filteredProjects = existingProjects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedProjects = [...filteredProjects].sort((a, b) => {
    if (sortBy === "alphabetical") return a.name.localeCompare(b.name);
    return b.last_modified - a.last_modified;
  });

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const editorExtensions = useMemo(() => [
    latex(), 
    lineHighlightField, 
    cmEventHandlers,
    ...(lineWrapping ? [EditorView.lineWrapping] : []),
    ...(!autoIndent ? [keymap.of([{ key: "Enter", run: insertNewline }])] : [])
  ], [lineWrapping, autoIndent, cmEventHandlers]);

  return {
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
  zoomOutKey,
};
}
