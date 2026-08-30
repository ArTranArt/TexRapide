import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { Activity, Plus, Settings, Play, FolderOpen, Layers, Code, ChevronRight, Info, FolderPlus, X, ChevronDown, SortAsc, Clock, Calendar, Lock, EyeOff, Search, Check, RefreshCw, Terminal, BookOpen, Sun, Moon, Copy, ExternalLink, Laptop, WrapText, Save, Edit2, Trash2, Eraser, Repeat, Target } from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { latex } from "codemirror-lang-latex";
import { StateEffect, StateField } from "@codemirror/state";
import { EditorView, Decoration, keymap } from "@codemirror/view";
import { toggleComment, insertNewline } from "@codemirror/commands";
import { PdfViewer } from "./PdfViewer";
import "./index.css";


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


function App() {
  const [view, setView] = useState<"dashboard" | "settings" | "project" | "help">("dashboard");
  const [helpTab, setHelpTab] = useState<"basics" | "text" | "math" | "media">("basics");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lineWrapping, setLineWrapping] = useState<boolean>(false);
  const [showFileTree, setShowFileTree] = useState<boolean>(true);
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
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = localStorage.getItem("texrapide_theme");
    return saved === "light" || saved === "dark" ? saved : "dark";
  });

  useEffect(() => {
    localStorage.setItem("texrapide_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);
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
  const [targetDir, setTargetDir] = useState(() => {
    return localStorage.getItem("texrapide_target_dir") || "C:\\Users\\Art\\Documents\\LaTeX\\LaTeX_Projects";
  });
  const [dashboardProjectsDir, setDashboardProjectsDir] = useState(() => {
    return localStorage.getItem("texrapide_dashboard_dir") || localStorage.getItem("texrapide_target_dir") || "C:\\Users\\Art\\Documents\\LaTeX\\LaTeX_Projects";
  });
  const [templateDir, setTemplateDir] = useState(() => {
    return localStorage.getItem("texrapide_template_dir") || "C:\\Users\\Art\\Documents\\LaTeX\\templates";
  });

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
  const [fileExplorerWidth, setFileExplorerWidth] = useState(() => {
    const saved = localStorage.getItem("texrapide_file_explorer_width");
    return saved ? parseInt(saved, 10) : 160;
  });
  useEffect(() => {
    localStorage.setItem("texrapide_file_explorer_width", fileExplorerWidth.toString());
  }, [fileExplorerWidth]);
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

  const [drawerHeight, setDrawerHeight] = useState(() => {
    const saved = localStorage.getItem("texrapide_drawer_height");
    return saved ? parseInt(saved, 10) : 400;
  });

  const [pdfViewerMode, setPdfViewerMode] = useState<"integrated" | "system">(() => {
    const saved = localStorage.getItem("texrapide_pdf_viewer_mode");
    return saved === "system" ? "system" : "integrated";
  });

  useEffect(() => {
    localStorage.setItem("texrapide_pdf_viewer_mode", pdfViewerMode);
  }, [pdfViewerMode]);

  useEffect(() => {
    localStorage.setItem("texrapide_drawer_height", drawerHeight.toString());
  }, [drawerHeight]);

  const [pdfExists, setPdfExists] = useState(false);

  const checkPdfExists = async () => {
    if (!activeProject || !mainFile) {
      setPdfExists(false);
      return;
    }
    const pdfPath = `${activeProject}/${mainFile.replace(/\.tex$/, ".pdf")}`;
    try {
      const exists = await invoke<boolean>("file_exists", { path: pdfPath });
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
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    const saved = localStorage.getItem("texrapide_left_panel_width");
    return saved ? Math.max(350, parseInt(saved, 10)) : 450;
  });
  const [topPanelHeight, setTopPanelHeight] = useState<number>(() => {
    const saved = localStorage.getItem("texrapide_top_panel_height");
    return saved ? parseInt(saved, 10) : 400;
  });
  const [pdfPosition, setPdfPosition] = useState<"right" | "bottom" | "left" | "top">(() => {
    const saved = localStorage.getItem("texrapide_pdf_position");
    if (saved === "right" || saved === "bottom" || saved === "left" || saved === "top") return saved;
    return window.innerWidth < 850 ? "bottom" : "right";
  });
  const [showPdfPanel, setShowPdfPanel] = useState<boolean>(() => {
    const saved = localStorage.getItem("texrapide_show_pdf_panel");
    return saved !== "false";
  });

  const isManualOrientationRef = useRef<boolean>(false);

  useEffect(() => {
    localStorage.setItem("texrapide_show_pdf_panel", showPdfPanel.toString());
  }, [showPdfPanel]);

  useEffect(() => {
    localStorage.setItem("texrapide_pdf_position", pdfPosition);
  }, [pdfPosition]);

  useEffect(() => {
    localStorage.setItem("texrapide_top_panel_height", topPanelHeight.toString());
  }, [topPanelHeight]);

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
  const [editorFontSize, setEditorFontSize] = useState<number>(() => {
    const saved = localStorage.getItem("texrapide_editor_font_size");
    return saved ? parseInt(saved, 10) : 13;
  });
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
  const [autoIndent, setAutoIndent] = useState<boolean>(() => {
    const saved = localStorage.getItem("texrapide_auto_indent");
    return saved ? saved === "true" : false; // Default is false (n'indente pas par défaut)
  });

  useEffect(() => {
    localStorage.setItem("texrapide_auto_indent", autoIndent.toString());
  }, [autoIndent]);

  useEffect(() => {
    localStorage.setItem("texrapide_left_panel_width", leftPanelWidth.toString());
  }, [leftPanelWidth]);

  useEffect(() => {
    localStorage.setItem("texrapide_editor_font_size", editorFontSize.toString());
  }, [editorFontSize]);

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
        const content = await invoke<string>("read_file", { path: filePath });
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
      const content = await invoke<string>("read_file", { path: filePath });
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
      await invoke("write_file", { path: filePath, content });
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
      const tree = await invoke<FileEntry[]>("list_project_tree", { path });
      
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
                children: filterTreeNodes(node.children)
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
      const exists = await invoke<boolean>("file_exists", { path: filePath });
      if (exists) {
        alert("Ce fichier existe déjà.");
        return;
      }
      
      if (hasUnsavedChanges && editingFile) {
        await saveFileContent(editingFile, editorContent);
      }

      await invoke("write_file", { path: filePath, content: "" });
      
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

      const exists = await invoke<boolean>("file_exists", { path: newPath });
      if (exists) {
        alert("Un fichier (ou dossier) avec ce nom existe déjà. Le renommage a été annulé pour ne pas écraser vos données.");
        return;
      }

      if (hasUnsavedChanges && editingFile === entry.relative_path) {
        await saveFileContent(editingFile, editorContent);
      }
      
      await invoke("rename_file", { oldPath, newPath });
      
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
      while (await invoke<boolean>("file_exists", { path: destPath })) {
        counter++;
        copyName = `${baseName}_copy${counter}${ext}`;
        destRelativePath = parentPath ? `${parentPath}/${copyName}` : copyName;
        destPath = `${activeProject}/${destRelativePath}`;
      }

      const srcPath = `${activeProject}/${entry.relative_path}`;
      await invoke("duplicate_file", { srcPath, destPath });
      
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
      await invoke("delete_file", { path: fullPath });
      
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
      const deletedCount = await invoke<number>("clean_auxiliary_files", { path: activeProject });
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

  return (
    <div className="flex h-screen bg-bg-deep text-text-main font-sans selection:bg-blue-500/30 overflow-hidden">

      <main ref={mainContentRef} className={`flex-1 scroll-smooth ${view === "project" ? "h-screen overflow-hidden" : "overflow-y-auto p-6 md:p-12"}`}>
        <div className={view === "project" ? "h-full w-full" : "max-w-6xl mx-auto flex flex-col gap-8"}>
          
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

                      {/* Forward Search Button */}
                      {showPdfPanel && (
                        <button
                          onClick={() => {
                            const view = editorRef.current?.view;
                            if (view) {
                              const pos = view.state.selection.main.head;
                              const line = view.state.doc.lineAt(pos);
                              handleForwardSearch(line.number);
                            }
                          }}
                          className="w-6 h-6 flex items-center justify-center rounded-md border bg-bg-input border-border-subtle text-text-muted hover:text-text-main hover:border-border-input transition-all cursor-pointer"
                          title="Localiser la ligne actuelle dans le PDF (ou Cmd + Click sur le code)"
                        >
                          <Target size={12} />
                        </button>
                      )}

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
                        onClick={() => invoke("download_and_run_windows_installers").catch(console.error)}
                        className="flex items-center justify-center gap-1.5 w-full bg-green-600 hover:bg-green-700 text-white font-bold text-xs py-2 rounded-lg transition-colors"
                      >
                        Télécharger les installeurs officiels <ExternalLink size={12} />
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
        </div>
      </main>
      {/* Floating Action Bar */}
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
    </div>
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

export default App;
