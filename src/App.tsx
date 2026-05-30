import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { listen } from "@tauri-apps/api/event";
import { Activity, Plus, Settings, Play, FolderOpen, Layers, Code, ChevronLeft, ChevronRight, Info, FolderPlus, X, ChevronDown, SortAsc, Clock, Calendar, Lock, EyeOff, Search, Check, RefreshCw, Terminal, BookOpen, Sun, Moon, Copy, ExternalLink, Laptop } from "lucide-react";
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

function App() {
  const [view, setView] = useState<"dashboard" | "settings" | "project" | "help">("dashboard");
  const [helpTab, setHelpTab] = useState<"basics" | "text" | "math" | "media">("basics");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
  const [health, setHealth] = useState<HealthStatus[]>([]);
  const hasDistribution = health.find(h => h.binary === "distribution")?.installed ?? false;
  const hasCliTools = health.filter(h => ["pdflatex", "latexmk", "bibtex"].includes(h.binary.toString())).every(h => h.installed);
  const hasSkim = health.find(h => h.binary === "skim")?.installed ?? false;
  const isSystemReady = hasDistribution && hasCliTools && hasSkim;

  const [analysisStep, setAnalysisStep] = useState<number>(3);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<"distribution" | "cli" | "skim" | null>(null);
  const [selectedNode, setSelectedNode] = useState<"distribution" | "cli" | "skim" | null>(null);

  const pdflatexInfo = health.find(h => h.binary === "pdflatex");
  const latexmkInfo = health.find(h => h.binary === "latexmk");
  const bibtexInfo = health.find(h => h.binary === "bibtex");
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

  const distributionTooltip = hasDistribution 
    ? `Distribution LaTeX : ${distributionInfo?.version || "détectée"}`
    : "Distribution LaTeX : non détectée";

  const cliTooltip = (() => {
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
    ? `Lecteur PDF Skim${skimVer ? ` (${skimVer})` : ''}`
    : "Lecteur PDF Skim : non détecté";

  const [projectName, setProjectName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [mainFile, setMainFile] = useState("main.tex");
  const [targetDir, setTargetDir] = useState("/Users/arthur/Documents/LaTeX_Projects");
  const [dashboardProjectsDir, setDashboardProjectsDir] = useState(targetDir);
  const [templateDir, setTemplateDir] = useState("/Users/arthur/templates/my_latex_templates");
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [projectTexFiles, setProjectTexFiles] = useState<string[]>([]);
  const [unfilteredTexCount, setUnfilteredTexCount] = useState(0);
  const [isWatching, setIsWatching] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const [sortBy, setSortBy] = useState<"recent" | "alphabetical">("recent");
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [compileStatus, setCompileStatus] = useState<"idle" | "compiling" | "success" | "error">("idle");
  const [compileLogs, setCompileLogs] = useState("");
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  
  const mainContentRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const [drawerHeight, setDrawerHeight] = useState(() => {
    const saved = localStorage.getItem("texrapide_drawer_height");
    return saved ? parseInt(saved, 10) : 400;
  });
  const [autoOpenOnError, setAutoOpenOnError] = useState(() => {
    const saved = localStorage.getItem("texrapide_auto_open");
    return saved === "true"; // default to false
  });
  const autoOpenRef = useRef(autoOpenOnError);

  useEffect(() => {
    autoOpenRef.current = autoOpenOnError;
    localStorage.setItem("texrapide_auto_open", autoOpenOnError ? "true" : "false");
  }, [autoOpenOnError]);

  useEffect(() => {
    localStorage.setItem("texrapide_drawer_height", drawerHeight.toString());
  }, [drawerHeight]);

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

  const handleLineClick = async (lineNum: number) => {
    if (!activeProject) return;
    try {
      await invoke("open_in_vscode_at_line", { 
        projectPath: activeProject, 
        file: mainFile, 
        line: lineNum 
      });
    } catch (error) {
      console.error("Failed to open file in editor:", error);
    }
  };


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
    }
  }, [activeProject, ignoredPatterns]);

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
            if (event.payload.status === "error" && autoOpenRef.current) {
              setIsLogsOpen(true);
            }
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
            firstErrorEl.scrollIntoView({ behavior: "smooth", block: "center" });
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
    if (isWatching) return; 
    const fullPath = path || `${dashboardProjectsDir}/${name}`;
    setActiveProject(fullPath);
    setProjectName(name);
    setIsWatching(false);
    setConfirmRemoval(false);
    setCompileStatus("idle");
    setCompileLogs("");
    setIsLogsOpen(false);

    // Smooth scroll to top when activating a project
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeselectProject = () => {
    if (isWatching) return;
    setActiveProject(null);
    setConfirmRemoval(false);
    setIsWatching(false);
    setCompileStatus("idle");
    setCompileLogs("");
    setIsLogsOpen(false);
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
    if (isWatching) return;
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
        await invoke("start_watch", { projectPath: activeProject, mainFile: mainFile });
        setIsWatching(true);
      } catch (error) {
        alert(`Erreur : ${error}`);
      }
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

  return (
    <div className="flex h-screen bg-bg-deep text-text-main font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-bg-sidebar border-r border-border-subtle flex flex-col p-6 transition-all duration-300 z-10 shrink-0 relative group`}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 bg-bg-sidebar-button border border-border-input rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-blue-500 hover:border-blue-500"
        >
          {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div 
          onClick={() => {
            if (isWatching) return;
            setDashboardProjectsDir(targetDir);
            setActiveProject(null);
            setView("dashboard");
            setIsCreatingInline(false);
          }}
          className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} w-full mb-12 cursor-pointer active:scale-95 transition-transform`}
          title="Retour au dossier par défaut"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shrink-0 shadow-lg shadow-blue-600/20">
              <Activity size={20} className="text-white" />
            </div>
            {!isSidebarCollapsed && (
              <span className="font-display text-xl font-bold tracking-tight text-text-main/90">
                TexRapide
              </span>
            )}
          </div>
        </div>
        
        <nav className="flex flex-col gap-1.5">
          <NavItem collapsed={isSidebarCollapsed} active={view === "dashboard"} onClick={() => { setView("dashboard"); setIsCreatingInline(false); }} icon={<Layers size={18} />} label="Dashboard" />
          <NavItem collapsed={isSidebarCollapsed} active={view === "settings"} onClick={() => { setView("settings"); setIsCreatingInline(false); }} icon={<Settings size={18} />} label="Configuration" />
          <NavItem collapsed={isSidebarCollapsed} active={view === "help"} onClick={() => { setView("help"); setIsCreatingInline(false); }} icon={<BookOpen size={18} />} label="Guide & Aide" />
        </nav>

        {activeProject && (
          <div className="mt-auto pt-8">
            <div className={`flex ${isSidebarCollapsed ? 'flex-col items-center' : 'justify-start'} gap-2`}>
              <button 
                onClick={handleToggleWatch}
                className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl font-bold transition-all ${isWatching ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'}`}
                title={isWatching ? "Arrêter" : "Démarrer"}
              >
                {isWatching ? <div className="w-2.5 h-2.5 bg-green-400 rounded-sm" /> : <Play size={18} fill="currentColor" />}
              </button>
              {compileStatus !== "idle" && (
                <button 
                  onClick={() => setIsLogsOpen(true)}
                  className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border transition-all relative ${
                    compileStatus === "compiling"
                      ? 'bg-blue-600/10 text-blue-400 border-blue-500/30'
                      : compileStatus === "error"
                        ? 'bg-red-600/10 text-red-400 border-red-500/30 animate-blink-red'
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

              {(!isSidebarCollapsed || !isWatching) && (
                <button 
                  onClick={handleOpenVSCode}
                  className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-bg-input hover:bg-bg-input border border-border-input transition-all"
                  title="VSCode"
                >
                  <VSCodeIcon size={20} />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      <main ref={mainContentRef} className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          
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
                <section className={`bg-bg-card border rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-xl relative group/card min-h-[210px] transition-colors duration-500 ${isWatching ? 'border-green-500/40' : 'border-border-subtle'}`}>
                  {/* Close button */}
                  {!confirmRemoval ? (
                    <button 
                      onClick={() => setConfirmRemoval(true)}
                      disabled={isWatching}
                      className={`absolute top-4 right-4 p-2 transition-all opacity-0 group-hover/card:opacity-100 ${isWatching ? 'cursor-not-allowed text-text-extra-subtle/5' : 'text-text-extra-subtle hover:text-red-400 hover:bg-red-500/10'}`}
                      title={isWatching ? "Arrêtez le watch mode d'abord" : "Retirer ce projet"}
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-1.5 rounded-lg fade-in z-20">
                      <span className="text-[10px] font-bold text-red-400 px-2 uppercase tracking-tighter">Sûr ?</span>
                      <button onClick={handleDeselectProject} className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-black hover:bg-red-600 transition-colors">OUI</button>
                      <button onClick={() => setConfirmRemoval(false)} className="text-text-subtle hover:text-text-main px-2 py-0.5 text-[10px] font-bold">NON</button>
                    </div>
                  )}

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
                              disabled={isWatching}
                              onChange={(e) => {
                                setMainFile(e.target.value);
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
                            >
                              {projectTexFiles.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                            <div className={`flex items-center gap-2 text-xs font-mono px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${isWatching ? 'bg-bg-card/40 border-green-500/20 text-green-400/70' : 'text-text-subtle bg-bg-input border-border-subtle hover:border-white/20 hover:text-text-muted'}`}>
                              <Code size={12} className={isWatching ? 'text-green-500' : 'text-blue-500/50'} />
                              <span className="truncate max-w-[150px]">{mainFile}</span>
                              {!isWatching && projectTexFiles.length > 1 && <ChevronDown size={12} className="text-text-extra-subtle" />}
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
                          className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl border transition-all relative ${
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
                      <button 
                        onClick={handleToggleWatch}
                        disabled={projectTexFiles.length === 0}
                        className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl transition-all ${
                          projectTexFiles.length === 0 
                            ? 'bg-bg-input text-text-extra-subtle border border-border-subtle cursor-not-allowed' 
                            : isWatching 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/30 shadow-lg shadow-green-500/5' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                        }`}
                        title={projectTexFiles.length === 0 ? "Compilation impossible (aucun fichier racine valide)" : isWatching ? "Arrêter" : "Démarrer"}
                      >
                        {isWatching ? <div className="w-3 h-3 bg-green-400 rounded-sm" /> : <Play size={18} fill="currentColor" />}
                      </button>

                      <button 
                        onClick={handleOpenVSCode}
                        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-bg-input hover:bg-bg-input border border-border-input transition-all"
                        title="VSCode"
                      >
                        <VSCodeIcon size={20} />
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
                    <Layers size={20} className={isWatching ? 'text-green-500' : 'text-blue-500'} />
                    <h2 className="text-xl font-bold uppercase tracking-tight text-text-main">Projets</h2>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex bg-bg-input p-1 rounded-lg border border-border-subtle">
                      <button 
                        onClick={() => setSortBy("recent")}
                        disabled={isWatching}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${sortBy === "recent" ? 'bg-bg-input text-text-main shadow-sm' : 'text-text-extra-subtle hover:text-text-subtle disabled:opacity-30 disabled:cursor-not-allowed'}`}
                      >
                        <Clock size={12} /> Récents
                      </button>
                      <button 
                        onClick={() => setSortBy("alphabetical")}
                        disabled={isWatching}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${sortBy === "alphabetical" ? 'bg-bg-input text-text-main shadow-sm' : 'text-text-extra-subtle hover:text-text-subtle disabled:opacity-30 disabled:cursor-not-allowed'}`}
                      >
                        <SortAsc size={12} /> A-Z
                      </button>
                    </div>

                    <div className="h-6 w-px bg-bg-input"></div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleSelectDashboardDir}
                        disabled={isWatching}
                        className={`p-2 rounded-lg border transition-all ${isWatching ? 'bg-bg-input border-border-subtle text-text-extra-subtle/5 cursor-not-allowed' : 'bg-bg-input hover:bg-bg-input border-border-subtle text-text-subtle hover:text-blue-500'}`}
                        title={isWatching ? "Verrouillé pendant le watch mode" : "Explorer un autre dossier"}
                      >
                        <FolderPlus size={16} />
                      </button>
                      <span className="text-[10px] font-bold bg-bg-input px-2 py-1 rounded text-text-subtle">{existingProjects.length}</span>
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
                      disabled={isWatching}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all group ${isWatching ? 'border-border-subtle text-text-extra-subtle/5 opacity-50 cursor-not-allowed' : 'border-border-subtle text-text-extra-subtle hover:border-blue-500/30 hover:bg-blue-500/[0.02] hover:scale-[1.01]'}`}
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
                        disabled={isWatching && activeProject !== `${dashboardProjectsDir}/${p.name}`}
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

          {view === "project" && activeProject && (
            <div className="fade-in flex flex-col gap-10">
              <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="min-w-0">
                  <button onClick={() => setView("dashboard")} className={`text-xs font-bold mb-4 flex items-center gap-1 hover:underline ${isWatching ? 'text-green-500' : 'text-blue-500'}`}>
                    <ChevronLeft size={14} /> Dashboard
                  </button>
                  <h1 className="text-4xl font-bold mb-2 truncate text-text-main">{projectName}</h1>
                  <p className="text-text-subtle font-mono text-[10px] truncate">{activeProject}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={handleOpenVSCode} 
                    className="w-12 h-12 shrink-0 flex items-center justify-center bg-bg-input hover:bg-bg-input border border-border-input rounded-xl transition-all"
                    title="Ouvrir VSCode"
                  >
                    <VSCodeIcon size={24} />
                  </button>
                  <button 
                    onClick={handleToggleWatch} 
                    className={`w-12 h-12 shrink-0 flex items-center justify-center rounded-xl transition-all ${isWatching ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    title={isWatching ? "Arrêter" : "Démarrer"}
                  >
                    {isWatching ? <div className="w-3.5 h-3.5 bg-white rounded-sm" /> : <Play size={20} fill="currentColor" />}
                  </button>
                </div>
              </header>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <section className={`border rounded-3xl p-10 flex flex-col items-center text-center transition-colors duration-500 ${isWatching ? 'bg-green-500/5 border-green-500/20' : 'bg-bg-card border-border-subtle'}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 ${isWatching ? 'bg-green-500/10 text-green-400' : 'bg-blue-600 text-white'}`}>
                      {isWatching ? <Activity size={32} className="animate-pulse" /> : <Play size={32} fill="currentColor" />}
                    </div>
                    <h2 className="text-2xl font-bold mb-4 text-text-main">{isWatching ? "TexRapide en action" : "Prêt pour la compilation"}</h2>
                    <p className="text-text-subtle max-w-sm mb-8 text-sm">
                      {isWatching ? "Le système surveille vos fichiers. Sauvegardez pour compiler." : "Activez le mode surveillance pour automatiser vos builds LaTeX."}
                    </p>
                    <button onClick={handleToggleWatch} className={`px-10 py-4 rounded-xl font-bold text-lg transition-all ${isWatching ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                      {isWatching ? "Arrêter" : "Lancer"}
                    </button>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="bg-bg-card/50 border border-border-subtle rounded-2xl p-6">
                    <h3 className="text-[10px] font-bold text-text-extra-subtle uppercase tracking-widest mb-6">Détails</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-text-subtle uppercase">Main File</label>
                        <div className="text-xs font-mono text-text-muted truncate">{mainFile}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-text-subtle uppercase">Status</label>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${isWatching ? 'bg-green-400' : 'bg-bg-input'}`}></div>
                          <span className="text-xs font-bold text-text-muted">{isWatching ? "Compiling..." : "Idle"}</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {view === "settings" && (
            <div className="fade-in flex flex-col gap-10">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-text-main mb-2">Configuration</h1>
                  <p className="text-text-subtle text-sm">Configuration de l'environnement.</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isSystemReady ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isSystemReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-tight">
                    {isSystemReady ? "Système Prêt" : "Configuration Requise"}
                  </span>
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
                      statusText = "Détecter le lecteur PDF Skim...";
                      statusSubtext = "Vérification de la présence de Skim.app sur votre Mac...";
                    }
                  } else if (activeDisplayNode) {
                    if (activeDisplayNode === "distribution") {
                      statusIcon = <Layers size={16} className={hasDistribution ? "text-green-400 shrink-0" : "text-red-400 shrink-0"} />;
                      statusText = "Distribution LaTeX";
                      statusSubtext = hasDistribution
                        ? "Moteur TeX Live ou MacTeX opérationnel en arrière-plan."
                        : "Aucune distribution LaTeX détectée (MacTeX ou TeX Live requis).";
                    } else if (activeDisplayNode === "cli") {
                      statusIcon = <Terminal size={16} className={hasCliTools ? "text-green-400 shrink-0" : "text-red-400 shrink-0"} />;
                      statusText = "Outils en Ligne de Commande";
                      statusSubtext = hasCliTools
                        ? "Les utilitaires pdflatex, latexmk et bibtex sont prêts pour la compilation automatique."
                        : "Certains compilateurs requis (pdflatex, latexmk ou bibtex) sont absents ou inaccessibles.";
                    } else if (activeDisplayNode === "skim") {
                      statusIcon = <BookOpen size={16} className={hasSkim ? "text-green-400 shrink-0" : "text-amber-400 shrink-0"} />;
                      statusText = "Lecteur PDF Skim";
                      statusSubtext = hasSkim
                        ? "Le visualiseur externe Skim est prêt pour l'aperçu dynamique du PDF."
                        : "Skim n'est pas détecté. Recommandé pour l'aperçu PDF automatique sans blocage de fichier.";
                    }
                  } else if (health.length > 0) {
                    if (isSystemReady) {
                      statusIcon = <Check size={16} className="text-green-500 shrink-0" />;
                      statusText = "Système prêt et opérationnel";
                      statusSubtext = "Survolez ou cliquez sur les cercles pour inspecter les composants.";
                    } else {
                      statusIcon = <Info size={16} className={hasDistribution && hasCliTools ? "text-amber-500 shrink-0" : "text-red-500 shrink-0"} />;
                      statusText = hasDistribution && hasCliTools 
                        ? "Configuration fonctionnelle (Skim recommandé)" 
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
                            Distribution
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
                            Outils CLI
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
                            Lecteur PDF
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
                          <button onClick={handleSelectDir} disabled={isWatching} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-30">Modifier</button>
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* macOS Card */}
                  <div className="bg-bg-input/30 hover:bg-bg-input/50 border border-border-subtle hover:border-blue-500/20 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 group">
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

                  {/* Windows Card */}
                  <div className="bg-bg-input/30 hover:bg-bg-input/50 border border-border-subtle hover:border-blue-500/20 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 group">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-2.5 py-1 rounded-md">Windows</span>
                        <Laptop size={16} className="text-text-subtle group-hover:text-blue-500 transition-colors" />
                      </div>
                      <h3 className="text-base font-bold text-text-main mb-1">MiKTeX</h3>
                      <p className="text-text-subtle text-xs mb-4 leading-relaxed">Distribution moderne et légère pour Windows. Télécharge automatiquement les packages manquants à la volée.</p>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                      <div className="bg-bg-deep border border-border-input rounded-lg p-2.5 flex items-center justify-between">
                        <code className="text-[10px] font-mono text-text-muted truncate select-all">winget install MiKTeX.MiKTeX</code>
                        <button 
                          onClick={() => handleCopy("winget install --id=MiKTeX.MiKTeX", "win")}
                          className="p-1.5 text-text-subtle hover:text-text-main bg-bg-card hover:bg-bg-input rounded border border-border-subtle transition-colors shrink-0 ml-2"
                          title="Copier la commande"
                        >
                          {copiedId === "win" ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <a 
                        href="https://miktex.org/download" 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-lg transition-colors"
                      >
                        Site officiel <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  {/* Linux Card */}
                  <div className="bg-bg-input/30 hover:bg-bg-input/50 border border-border-subtle hover:border-blue-500/20 rounded-xl p-5 flex flex-col justify-between transition-all duration-300 group">
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

      {/* Overlay de fond pour la console */}
      {isLogsOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-40 transition-opacity duration-300"
          onClick={() => setIsLogsOpen(false)}
        />
      )}

      <div 
        style={{ height: isLogsOpen ? `${drawerHeight}px` : undefined }}
        className={`fixed bottom-0 right-0 left-0 bg-bg-card/95 border-t border-border-input z-50 transition-all duration-300 ease-out transform ${
          isLogsOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'
        } glass-panel shadow-2xl flex flex-col`}
      >
        {/* Bordure de redimensionnement (poignée invisible pour drag) */}
        <div 
          onMouseDown={handleResizeMouseDown}
          className="absolute top-0 left-0 right-0 h-1.5 cursor-ns-resize z-50 hover:bg-blue-500/20 active:bg-blue-500/40 transition-colors"
        />

        {/* Poignée de tiroir pour fermer */}
        <div className="w-full flex justify-center py-2 cursor-pointer select-none shrink-0" onClick={() => setIsLogsOpen(false)}>
          <div className="w-12 h-1 bg-text-extra-subtle/30 rounded-full" />
        </div>

        {/* En-tête */}
        <div className="flex items-center justify-between px-6 pb-3 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-3">
            <Terminal size={16} className={compileStatus === "compiling" ? "text-blue-400 animate-spin" : compileStatus === "error" ? "text-red-400" : "text-green-400"} />
            <span className="font-display font-bold text-sm tracking-wide">
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
            <label className="flex items-center gap-2 mr-3 cursor-pointer select-none text-[10px] text-text-subtle hover:text-text-main font-semibold">
              <input 
                type="checkbox"
                checked={autoOpenOnError}
                onChange={(e) => setAutoOpenOnError(e.target.checked)}
                className="rounded border-border-input bg-bg-input text-blue-500 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5 cursor-pointer accent-blue-600"
              />
              <span>Ouverture auto. sur erreur</span>
            </label>

            {compileLogs && (
              <button 
                onClick={() => handleCopy(compileLogs, "console-logs")}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-input hover:bg-bg-input-hover text-text-muted hover:text-text-main border border-border-subtle transition-all text-[10px] font-bold"
              >
                {copiedId === "console-logs" ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
                {copiedId === "console-logs" ? "Copié !" : "Copier les logs"}
              </button>
            )}
            <button 
              onClick={() => setIsLogsOpen(false)}
              className="p-1.5 text-text-subtle hover:text-text-main rounded-lg hover:bg-bg-input transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Zone des logs de console */}
        <div className="flex-1 min-h-0 bg-black/35 p-6 font-mono text-[11px] overflow-y-auto selection:bg-blue-500/20 select-text custom-scrollbar">
          {compileLogs ? (
            (() => {
              const lines = compileLogs.split('\n');
              const hasCriticalError = lines.some(line => line.trim().startsWith("!"));
              let idAssigned = false;
              return (
                <pre className="whitespace-pre-wrap break-all text-text-muted leading-relaxed font-mono">
                  {lines.map((line, idx) => {
                    const lowerLine = line.toLowerCase();
                    const trimLine = line.trim();
                    const lineMatch = trimLine.match(/^l\.(\d+)/);
                    const isLineIndicator = !!lineMatch;
                    
                    const isCritical = trimLine.startsWith("!");
                    const isGeneralError = lowerLine.includes("error") || lowerLine.includes("l.");
                    const isWarning = lowerLine.includes("warning");
                    
                    let lineClass = "text-text-muted";
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
    </div>
  );
}

function NavItem({ active, onClick, icon, label, collapsed, disabled }: { active: boolean, onClick: () => void, icon: any, label: string, collapsed: boolean, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-xl transition-all duration-200 border group ${active ? 'bg-blue-600/10 text-blue-500 border-blue-600/20' : 'border-transparent text-text-subtle hover:bg-bg-input-hover hover:text-text-main'} ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}
      title={collapsed ? label : ""}
    >
      <div className={`${active ? 'text-blue-500' : 'group-hover:text-text-muted'} transition-colors shrink-0`}>{icon}</div>
      {!collapsed && <span className="text-sm font-semibold">{label}</span>}
    </button>
  );
}

function ProjectListRow({ name, date, active, isWatching, disabled, onClick }: { name: string, date: string, active: boolean, isWatching: boolean, disabled: boolean, onClick: () => void }) {
  const activeColorClass = isWatching ? 'text-green-400' : 'text-blue-400';
  const activeBgClass = isWatching ? 'bg-green-600/5 border-green-500/20 shadow-green-500/5' : 'bg-blue-600/5 border-blue-600/20 shadow-sm';
  const iconBgClass = isWatching ? (active ? 'bg-green-500/20 text-green-400' : 'bg-bg-input text-text-extra-subtle') : (active ? 'bg-blue-500/20 text-blue-400' : 'bg-bg-input text-text-extra-subtle');

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group/row ${active ? activeBgClass : 'bg-bg-card border-border-subtle hover:bg-bg-input-hover hover:border-border-input'} ${disabled ? 'opacity-20 grayscale cursor-not-allowed scale-[0.98]' : 'hover:scale-[1.01] active:scale-95'}`}
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

export default App;
