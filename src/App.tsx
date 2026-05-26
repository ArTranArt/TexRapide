import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Activity, Plus, Settings, Play, FolderOpen, Layers, Code, ChevronLeft, ChevronRight, Info, FolderPlus, X, ChevronDown, SortAsc, Clock, Calendar, Lock, EyeOff, Search, Check, RefreshCw } from "lucide-react";
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
  const [view, setView] = useState<"dashboard" | "settings" | "project">("dashboard");
  const [health, setHealth] = useState<HealthStatus[]>([]);
  const hasDistribution = health.find(h => h.binary === "distribution")?.installed ?? false;
  const hasCliTools = health.filter(h => ["pdflatex", "latexmk", "bibtex"].includes(h.binary.toString())).every(h => h.installed);
  const hasSkim = health.find(h => h.binary === "skim")?.installed ?? false;
  const isSystemReady = hasDistribution && hasCliTools && hasSkim;

  const [analysisStep, setAnalysisStep] = useState<number>(3);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

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
  
  const mainContentRef = useRef<HTMLDivElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);

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

  const activateProject = (name: string, path?: string) => {
    if (isWatching) return; 
    const fullPath = path || `${dashboardProjectsDir}/${name}`;
    setActiveProject(fullPath);
    setProjectName(name);
    setIsWatching(false);
    setConfirmRemoval(false);

    // Smooth scroll to top when activating a project
    mainContentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeselectProject = () => {
    if (isWatching) return;
    setActiveProject(null);
    setConfirmRemoval(false);
    setIsWatching(false);
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
    <div className="flex h-screen bg-[#0a0a0c] text-white font-sans selection:bg-blue-500/30 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-[#0f0f12] border-r border-white/5 flex flex-col p-6 transition-all duration-300 z-10 shrink-0 relative group`}>
        <button 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-20 bg-[#1e1e24] border border-white/10 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 hover:bg-blue-500 hover:border-blue-500"
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
              <span className="font-display text-xl font-bold tracking-tight text-white/90">
                TexRapide
              </span>
            )}
          </div>
        </div>
        
        <nav className="flex flex-col gap-1.5">
          <NavItem collapsed={isSidebarCollapsed} active={view === "dashboard"} onClick={() => { setView("dashboard"); setIsCreatingInline(false); }} icon={<Layers size={18} />} label="Dashboard" />
          <NavItem collapsed={isSidebarCollapsed} active={view === "settings"} onClick={() => { setView("settings"); setIsCreatingInline(false); }} icon={<Settings size={18} />} label="Paramètres" />
        </nav>

        {activeProject && (
          <div className="mt-auto pt-8">
            <div className={`flex ${isSidebarCollapsed ? 'justify-center' : 'justify-start'} gap-2`}>
              <button 
                onClick={handleToggleWatch}
                className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl font-bold transition-all ${isWatching ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'}`}
                title={isWatching ? "Arrêter" : "Démarrer"}
              >
                {isWatching ? <div className="w-2.5 h-2.5 bg-green-400 rounded-sm" /> : <Play size={18} fill="currentColor" />}
              </button>
              {!isSidebarCollapsed && (
                <button 
                  onClick={handleOpenVSCode}
                  className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                  title="VSCode"
                >
                  <VSCodeIcon size={20} />
                </button>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main ref={mainContentRef} className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
        <div className="max-w-6xl mx-auto flex flex-col gap-8">
          
          {view === "dashboard" && (
            <div className="fade-in flex flex-col gap-10">
              <header className="flex justify-between items-end px-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Tableau de bord</h1>
                  <p className="text-white/40 text-sm">Gérez vos projets et votre environnement LaTeX.</p>
                </div>
              </header>

              {/* ACTIVE OR PLACEHOLDER PROJECT CARD */}
              {activeProject ? (
                <section className={`bg-[#121216] border rounded-2xl p-6 md:p-8 flex flex-col justify-between shadow-xl relative group/card min-h-[210px] transition-colors duration-500 ${isWatching ? 'border-green-500/40' : 'border-white/5'}`}>
                  {/* Close button */}
                  {!confirmRemoval ? (
                    <button 
                      onClick={() => setConfirmRemoval(true)}
                      disabled={isWatching}
                      className={`absolute top-4 right-4 p-2 transition-all opacity-0 group-hover/card:opacity-100 ${isWatching ? 'cursor-not-allowed text-white/5' : 'text-white/10 hover:text-red-400 hover:bg-red-500/10'}`}
                      title={isWatching ? "Arrêtez le watch mode d'abord" : "Retirer ce projet"}
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/10 border border-red-500/20 p-1.5 rounded-lg fade-in z-20">
                      <span className="text-[10px] font-bold text-red-400 px-2 uppercase tracking-tighter">Sûr ?</span>
                      <button onClick={handleDeselectProject} className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-black hover:bg-red-600 transition-colors">OUI</button>
                      <button onClick={() => setConfirmRemoval(false)} className="text-white/40 hover:text-white px-2 py-0.5 text-[10px] font-bold">NON</button>
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-2 h-2 rounded-full ${isWatching ? 'bg-green-400 animate-pulse' : 'bg-white/20'}`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${isWatching ? 'text-green-400/60' : 'text-white/30'}`}>Projet Actuel</span>
                    </div>
                    <h2 className="text-3xl font-bold truncate text-white">{projectName}</h2>
                  </div>

                  <div className="flex items-end justify-between gap-4 mt-4">
                    <div className="flex flex-col gap-1.5 group/file relative">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-0.5 ${isWatching ? 'text-green-400/30' : 'text-white/20'}`}>Fichier Racine</span>
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
                            <div className={`flex items-center gap-2 text-xs font-mono px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${isWatching ? 'bg-white/[0.02] border-green-500/20 text-green-400/70' : 'text-white/40 bg-white/5 border-white/5 hover:border-white/20 hover:text-white/70'}`}>
                              <Code size={12} className={isWatching ? 'text-green-500' : 'text-blue-500/50'} />
                              <span className="truncate max-w-[150px]">{mainFile}</span>
                              {!isWatching && projectTexFiles.length > 1 && <ChevronDown size={12} className="text-white/10" />}
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
                      <button 
                        onClick={handleToggleWatch}
                        disabled={projectTexFiles.length === 0}
                        className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-xl transition-all ${
                          projectTexFiles.length === 0 
                            ? 'bg-white/5 text-white/10 border border-white/5 cursor-not-allowed' 
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
                        className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                        title="VSCode"
                      >
                        <VSCodeIcon size={20} />
                      </button>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="border-2 border-dashed border-white/5 rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[210px]">
                   <FolderOpen size={32} className="text-white/10 mb-4" />
                   <p className="text-white/30 text-sm font-medium">Sélectionnez un projet pour commencer à travailler</p>
                </section>
              )}

              <section className="bg-[#121216]/50 border border-white/5 rounded-2xl p-6 md:p-8 flex flex-col">
                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 px-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <Layers size={20} className={isWatching ? 'text-green-500' : 'text-blue-500'} />
                    <h2 className="text-xl font-bold uppercase tracking-tight">Projets</h2>
                  </div>
                  
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                      <button 
                        onClick={() => setSortBy("recent")}
                        disabled={isWatching}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${sortBy === "recent" ? 'bg-white/5 text-white shadow-sm' : 'text-white/20 hover:text-white/40 disabled:opacity-30 disabled:cursor-not-allowed'}`}
                      >
                        <Clock size={12} /> Récents
                      </button>
                      <button 
                        onClick={() => setSortBy("alphabetical")}
                        disabled={isWatching}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${sortBy === "alphabetical" ? 'bg-white/5 text-white shadow-sm' : 'text-white/20 hover:text-white/40 disabled:opacity-30 disabled:cursor-not-allowed'}`}
                      >
                        <SortAsc size={12} /> A-Z
                      </button>
                    </div>

                    <div className="h-6 w-px bg-white/5"></div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={handleSelectDashboardDir}
                        disabled={isWatching}
                        className={`p-2 rounded-lg border transition-all ${isWatching ? 'bg-white/5 border-white/5 text-white/5 cursor-not-allowed' : 'bg-white/5 hover:bg-white/10 border-white/5 text-white/40 hover:text-blue-500'}`}
                        title={isWatching ? "Verrouillé pendant le watch mode" : "Explorer un autre dossier"}
                      >
                        <FolderPlus size={16} />
                      </button>
                      <span className="text-[10px] font-bold bg-white/5 px-2 py-1 rounded text-white/30">{existingProjects.length}</span>
                    </div>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="mb-8 px-4 relative group">
                  <Search size={14} className="absolute left-7.5 top-1/2 -translate-y-1/2 text-white/10 group-focus-within:text-blue-500 transition-colors pl-4" />
                  <input 
                    type="text" 
                    placeholder="Rechercher un projet..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-black/60 border border-white/5 hover:border-white/10 focus:border-blue-500/50 rounded-xl py-2.5 pl-10 pr-4 text-xs outline-none transition-all placeholder:text-white/10"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="absolute right-7 top-1/2 -translate-y-1/2 text-white/10 hover:text-white transition-colors pr-4"
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
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed transition-all group ${isWatching ? 'border-white/5 text-white/5 opacity-50 cursor-not-allowed' : 'border-white/5 text-white/20 hover:border-blue-500/30 hover:bg-blue-500/[0.02] hover:scale-[1.01]'}`}
                    >
                      <div className="p-2.5 rounded-xl bg-white/5 text-white/10 group-hover:bg-blue-500/10 group-hover:text-blue-500 transition-colors">
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
                        <button onClick={() => setIsCreatingInline(false)} className="text-white/20 hover:text-white transition-colors"><X size={14} /></button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-1">Nom du projet</label>
                          <input 
                            ref={inlineInputRef}
                            type="text" 
                            className="bg-black/60 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-colors"
                            placeholder="ex: rapport-stage"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest px-1">Template</label>
                          <div className="relative">
                            <select 
                              className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-colors appearance-none pr-10"
                              value={selectedTemplate}
                              onChange={(e) => setSelectedTemplate(e.target.value)}
                            >
                              {availableTemplates.length > 0 ? availableTemplates.map(t => <option key={t} value={t}>{t}</option>) : <option disabled>Aucun template</option>}
                            </select>
                            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 mt-2">
                        <button 
                          onClick={() => setIsCreatingInline(false)}
                          className="px-4 py-2 rounded-lg text-xs font-bold text-white/40 hover:text-white transition-colors"
                        >
                          Annuler
                        </button>
                        <button 
                          onClick={handleCreateProject}
                          disabled={!newProjectName.trim()}
                          className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-white/5 disabled:text-white/10 text-white px-6 py-2 rounded-lg text-xs font-bold transition-all ${newProjectName.trim() ? 'shadow-lg shadow-blue-600/20' : 'shadow-none'}`}
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
                      <div className="text-center py-24 bg-black/10 rounded-3xl border border-dashed border-white/5 mx-2">
                        <div className="flex flex-col items-center gap-4">
                          <FolderOpen size={48} className="text-white/5" />
                          <p className="text-white/20 italic text-sm">
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
                  <h1 className="text-4xl font-bold mb-2 truncate">{projectName}</h1>
                  <p className="text-white/30 font-mono text-[10px] truncate">{activeProject}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button 
                    onClick={handleOpenVSCode} 
                    className="w-12 h-12 shrink-0 flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
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
                  <section className={`border rounded-3xl p-10 flex flex-col items-center text-center transition-colors duration-500 ${isWatching ? 'bg-green-500/5 border-green-500/20' : 'bg-[#121216] border-white/5'}`}>
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-8 ${isWatching ? 'bg-green-500/10 text-green-400' : 'bg-blue-600 text-white'}`}>
                      {isWatching ? <Activity size={32} className="animate-pulse" /> : <Play size={32} fill="currentColor" />}
                    </div>
                    <h2 className="text-2xl font-bold mb-4">{isWatching ? "TexRapide en action" : "Prêt pour la compilation"}</h2>
                    <p className="text-white/40 max-w-sm mb-8 text-sm">
                      {isWatching ? "Le système surveille vos fichiers. Sauvegardez pour compiler." : "Activez le mode surveillance pour automatiser vos builds LaTeX."}
                    </p>
                    <button onClick={handleToggleWatch} className={`px-10 py-4 rounded-xl font-bold text-lg transition-all ${isWatching ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                      {isWatching ? "Arrêter" : "Lancer"}
                    </button>
                  </section>
                </div>

                <div className="space-y-6">
                  <section className="bg-[#121216]/50 border border-white/5 rounded-2xl p-6">
                    <h3 className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-6">Détails</h3>
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-white/30 uppercase">Main File</label>
                        <div className="text-xs font-mono text-white/70 truncate">{mainFile}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[9px] font-bold text-white/30 uppercase">Status</label>
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${isWatching ? 'bg-green-400' : 'bg-white/10'}`}></div>
                          <span className="text-xs font-bold text-white/70">{isWatching ? "Compiling..." : "Idle"}</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}

          {view === "settings" && (
            <div className="fade-in flex flex-col gap-6">
              <header className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">Paramètres</h1>
                  <p className="text-white/30 text-xs">Configuration de l'environnement.</p>
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${isSystemReady ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isSystemReady ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`}></div>
                  <span className="text-[10px] font-black uppercase tracking-tight">
                    {isSystemReady ? "Système Prêt" : "Configuration Requise"}
                  </span>
                </div>
              </header>

              {/* Diagnostic de l'Environnement */}
              <section className="bg-[#121216] border border-white/5 rounded-xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-blue-500" />
                    <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Diagnostic Système</h2>
                  </div>
                  <button 
                    onClick={checkHealth}
                    disabled={isAnalyzing}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all text-[10px] font-bold border border-white/5 disabled:opacity-35 disabled:cursor-not-allowed"
                    title="Relancer le diagnostic"
                  >
                    <RefreshCw size={10} className={`transition-transform duration-500 ${isAnalyzing ? 'animate-spin' : 'hover:rotate-180'}`} />
                    {isAnalyzing ? "Analyse..." : "Re-analyser"}
                  </button>
                </div>

                <div className="flex flex-col md:flex-row items-stretch md:items-stretch gap-4 md:gap-0">
                  
                  {/* 1. LaTeX Distribution */}
                  {(() => {
                    const checking = isAnalyzing && analysisStep === 0;
                    const active = !isAnalyzing || analysisStep >= 1;
                    const success = hasDistribution;
                    
                    const cardBgBorder = checking 
                      ? 'bg-blue-500/[0.02] border-blue-500/20 shadow-[0_0_12px_rgba(0,122,255,0.03)] scale-[1.01]' 
                      : active 
                        ? success 
                          ? 'bg-green-500/[0.02] border-green-500/10' 
                          : 'bg-red-500/[0.02] border-red-500/10'
                        : 'bg-white/[0.01] border-white/5 opacity-30';
                    
                    const ledColor = checking 
                      ? 'bg-blue-500 shadow-[0_0_8px_rgba(0,122,255,0.6)] animate-pulse' 
                      : active 
                        ? success 
                          ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                          : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                        : 'bg-white/10';

                    return (
                      <div className={`flex-1 p-4 rounded-xl border transition-all duration-500 min-h-[170px] flex flex-col justify-between ${cardBgBorder}`}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-white/80">1. Distribution LaTeX</span>
                            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${ledColor}`}></div>
                          </div>
                          <p className="text-[11px] text-white/40 leading-relaxed mb-4">
                            MacTeX, BasicTeX ou TeX Live requis pour la structure et la compilation des documents.
                          </p>
                        </div>
                        <div>
                          {checking ? (
                            <span className="text-[9px] font-bold text-blue-400 animate-pulse">Recherche...</span>
                          ) : active ? (
                            success ? (
                              <div className="text-[9px] font-mono text-green-400 bg-green-500/5 px-2 py-1 rounded inline-block truncate max-w-full">
                                {health.find(h => h.binary === "distribution")?.version || "Détectée"}
                              </div>
                            ) : (
                              <div className="text-[9px] font-bold text-red-400 bg-red-500/5 px-2 py-1 rounded inline-block">
                                Non détectée (MacTeX requis)
                              </div>
                            )
                          ) : (
                            <span className="text-[9px] text-white/20">En attente...</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Connector 1 */}
                  {(() => {
                    const active = !isAnalyzing || analysisStep >= 1;
                    const success = hasDistribution;
                    const color = active ? (success ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.05)';
                    const isAnimating = isAnalyzing && analysisStep === 0;
                    return (
                      <div className="hidden md:flex items-center justify-center w-10 shrink-0">
                        <svg className="w-full h-2" viewBox="0 0 40 10" preserveAspectRatio="none">
                          <line 
                            x1="0" 
                            y1="5" 
                            x2="40" 
                            y2="5" 
                            stroke={color} 
                            strokeWidth="2" 
                            strokeDasharray="6,4" 
                            className={`transition-all duration-500 ${isAnimating || (active && success) ? 'animate-dash' : ''}`}
                          />
                        </svg>
                      </div>
                    );
                  })()}

                  {/* 2. CLI Tools */}
                  {(() => {
                    const checking = isAnalyzing && analysisStep === 1;
                    const active = !isAnalyzing || analysisStep >= 2;
                    const success = hasCliTools;
                    
                    const cardBgBorder = checking 
                      ? 'bg-blue-500/[0.02] border-blue-500/20 shadow-[0_0_12px_rgba(0,122,255,0.03)] scale-[1.01]' 
                      : active 
                        ? success 
                          ? 'bg-green-500/[0.02] border-green-500/10' 
                          : 'bg-red-500/[0.02] border-red-500/10'
                        : 'bg-white/[0.01] border-white/5 opacity-30';
                    
                    const ledColor = checking 
                      ? 'bg-blue-500 shadow-[0_0_8px_rgba(0,122,255,0.6)] animate-pulse' 
                      : active 
                        ? success 
                          ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                          : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                        : 'bg-white/10';

                    return (
                      <div className={`flex-1 p-4 rounded-xl border transition-all duration-500 min-h-[170px] flex flex-col justify-between ${cardBgBorder}`}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-white/80">2. Outils CLI</span>
                            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${ledColor}`}></div>
                          </div>
                          <p className="text-[11px] text-white/40 leading-relaxed mb-4">
                            Les exécutables requis pour l'automatisation : pdflatex, latexmk et bibtex.
                          </p>
                        </div>
                        <div className="flex flex-col gap-1.5 w-full">
                          {checking ? (
                            <span className="text-[9px] font-bold text-blue-400 animate-pulse">Vérification des binaires...</span>
                          ) : active ? (
                            <div className="grid grid-cols-1 gap-1 w-full animate-fade-in">
                              {["pdflatex", "latexmk", "bibtex"].map(bin => {
                                const isBinInstalled = health.find(h => h.binary === bin)?.installed ?? false;
                                const rawVersion = health.find(h => h.binary === bin)?.version ?? "";
                                
                                let displayVer = "Détecté";
                                if (isBinInstalled && rawVersion) {
                                  if (bin === "pdflatex") {
                                    const match = rawVersion.match(/3\.14\S*/);
                                    displayVer = match ? `v${match[0]}` : "Détecté";
                                  } else if (bin === "latexmk") {
                                    const match = rawVersion.match(/v\d+\.\d+\S*/);
                                    displayVer = match ? match[0] : "Détecté";
                                  } else if (bin === "bibtex") {
                                    const match = rawVersion.match(/0\.99\S*/);
                                    displayVer = match ? `v${match[0]}` : "Détecté";
                                  } else {
                                    displayVer = rawVersion.substring(0, 10);
                                  }
                                }

                                return (
                                  <div key={bin} className={`text-[9px] font-mono px-2 py-1 rounded border flex items-center justify-between ${isBinInstalled ? 'bg-green-500/5 border-green-500/10 text-green-400/80' : 'bg-red-500/5 border-red-500/10 text-red-400/80'}`}>
                                    <div className="flex items-center gap-1">
                                      <div className={`w-1 h-1 rounded-full ${isBinInstalled ? 'bg-green-400' : 'bg-red-400'}`}></div>
                                      <span className="font-bold">{bin}</span>
                                    </div>
                                    {isBinInstalled && <span className="text-[8px] text-white/30 font-semibold">{displayVer}</span>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-[9px] text-white/20">En attente...</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Connector 2 */}
                  {(() => {
                    const active = !isAnalyzing || analysisStep >= 2;
                    const success = hasCliTools;
                    const color = active ? (success ? '#22c55e' : '#ef4444') : 'rgba(255,255,255,0.05)';
                    const isAnimating = isAnalyzing && analysisStep === 1;
                    return (
                      <div className="hidden md:flex items-center justify-center w-10 shrink-0">
                        <svg className="w-full h-2" viewBox="0 0 40 10" preserveAspectRatio="none">
                          <line 
                            x1="0" 
                            y1="5" 
                            x2="40" 
                            y2="5" 
                            stroke={color} 
                            strokeWidth="2" 
                            strokeDasharray="6,4" 
                            className={`transition-all duration-500 ${isAnimating || (active && success) ? 'animate-dash' : ''}`}
                          />
                        </svg>
                      </div>
                    );
                  })()}

                  {/* 3. Skim PDF Reader */}
                  {(() => {
                    const checking = isAnalyzing && analysisStep === 2;
                    const active = !isAnalyzing || analysisStep >= 3;
                    const success = hasSkim;
                    
                    const cardBgBorder = checking 
                      ? 'bg-blue-500/[0.02] border-blue-500/20 shadow-[0_0_12px_rgba(0,122,255,0.03)] scale-[1.01]' 
                      : active 
                        ? success 
                          ? 'bg-green-500/[0.02] border-green-500/10' 
                          : 'bg-amber-500/[0.02] border-amber-500/10'
                        : 'bg-white/[0.01] border-white/5 opacity-30';
                    
                    const ledColor = checking 
                      ? 'bg-blue-500 shadow-[0_0_8px_rgba(0,122,255,0.6)] animate-pulse' 
                      : active 
                        ? success 
                          ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' 
                          : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                        : 'bg-white/10';

                    return (
                      <div className={`flex-1 p-4 rounded-xl border transition-all duration-500 min-h-[170px] flex flex-col justify-between ${cardBgBorder}`}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-white/80">3. Lecteur PDF Skim</span>
                            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${ledColor}`}></div>
                          </div>
                          <p className="text-[11px] text-white/40 leading-relaxed mb-4">
                            Recommandé pour l'aperçu PDF automatique et synchronisé en temps réel sans blocage.
                          </p>
                        </div>
                        <div>
                          {checking ? (
                            <span className="text-[9px] font-bold text-blue-400 animate-pulse">Détection de Skim.app...</span>
                          ) : active ? (
                            success ? (
                              <div className="text-[9px] font-mono text-green-400 bg-green-500/5 px-2 py-1 rounded inline-block">
                                {health.find(h => h.binary === "skim")?.version || "Détecté"}
                              </div>
                            ) : (
                              <div className="text-[9px] font-bold text-amber-400 bg-amber-500/5 px-2 py-1 rounded inline-block">
                                Non détecté (Optionnel)
                              </div>
                            )
                          ) : (
                            <span className="text-[9px] text-white/20">En attente...</span>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* System Folders - Column Left */}
                <div className="lg:col-span-7 space-y-6">
                  <section className="bg-[#121216] border border-white/5 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-8">
                      <FolderOpen size={16} className="text-blue-500" />
                      <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Chemins Système</h2>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Dossier Projets</label>
                          <button onClick={handleSelectDir} disabled={isWatching} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors disabled:opacity-30">Modifier</button>
                        </div>
                        <div className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs font-mono text-white/50 truncate">
                          {targetDir}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center px-1">
                          <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Dossier Templates</label>
                          <button onClick={handleSelectTemplateDir} className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors">Modifier</button>
                        </div>
                        <div className="bg-black/40 border border-white/10 rounded-lg p-2.5 text-xs font-mono text-white/50 truncate">
                          {templateDir}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>

                {/* Filters - Column Right */}
                <div className="lg:col-span-5 space-y-6">
                  <section className="bg-[#121216] border border-white/5 rounded-xl p-6 h-full flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <EyeOff size={16} className="text-amber-500" />
                        <h2 className="text-[11px] font-black text-white/40 uppercase tracking-[0.2em]">Filtres .tex</h2>
                      </div>
                      <span className="text-[10px] font-bold text-white/20 bg-white/5 px-2 py-0.5 rounded-full">{ignoredPatterns.length}</span>
                    </div>
                    
                    <div className="space-y-4 flex-1">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Mot-clé..."
                          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-amber-500/50 outline-none transition-colors"
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
                          <div key={pattern} className="flex items-center gap-1.5 bg-white/5 border border-white/5 pl-2.5 pr-1 py-1 rounded-md group hover:border-amber-500/20 transition-all">
                            <span className="text-[10px] font-bold text-white/40">{pattern}</span>
                            <button 
                              onClick={() => removeIgnoredPattern(pattern)}
                              className="p-1 text-white/10 hover:text-red-400 transition-colors"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-white/5">
                       <p className="text-[9px] text-white/20 leading-relaxed italic">
                        Les noms contenant ces mots seront exclus du sélecteur racine.
                      </p>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label, collapsed, disabled }: { active: boolean, onClick: () => void, icon: any, label: string, collapsed: boolean, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-2.5 rounded-xl transition-all duration-200 group ${active ? 'bg-blue-600/10 text-blue-500 border border-blue-600/20' : 'text-white/30 hover:bg-white/5 hover:text-white/70'} ${disabled ? 'opacity-20 cursor-not-allowed' : ''}`}
      title={collapsed ? label : ""}
    >
      <div className={`${active ? 'text-blue-500' : 'group-hover:text-white/70'} transition-colors shrink-0`}>{icon}</div>
      {!collapsed && <span className="text-sm font-semibold">{label}</span>}
    </button>
  );
}

function ProjectListRow({ name, date, active, isWatching, disabled, onClick }: { name: string, date: string, active: boolean, isWatching: boolean, disabled: boolean, onClick: () => void }) {
  const activeColorClass = isWatching ? 'text-green-400' : 'text-blue-400';
  const activeBgClass = isWatching ? 'bg-green-600/5 border-green-500/20 shadow-green-500/5' : 'bg-blue-600/5 border-blue-600/20 shadow-sm';
  const iconBgClass = isWatching ? (active ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/5') : (active ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/10');

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group/row ${active ? activeBgClass : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'} ${disabled ? 'opacity-20 grayscale cursor-not-allowed scale-[0.98]' : 'hover:scale-[1.01] active:scale-95'}`}
    >
      <div className={`p-2.5 rounded-xl transition-colors ${iconBgClass} group-hover/row:text-white/30`}>
        {disabled && active ? <Lock size={18} className="text-white/20" /> : <FolderOpen size={18} />}
      </div>
      
      <div className="flex-1 min-w-0 text-left">
        <span className={`block text-sm font-bold truncate ${active ? activeColorClass : 'text-white/80'}`}>{name}</span>
        <div className="flex items-center gap-2 mt-0.5">
           <Calendar size={10} className="text-white/10" />
           <span className="text-[10px] font-medium text-white/20 uppercase tracking-wider">{date}</span>
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

export default App;
