import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { Activity, Plus, Settings, Play, FolderOpen, Box, Layers, Code, ChevronLeft, ChevronRight, Info, FolderPlus, X, ChevronDown, SortAsc, Clock, Calendar, Lock, EyeOff, Trash2 } from "lucide-react";
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
  const [view, setView] = useState<"dashboard" | "new" | "settings" | "project">("dashboard");
  const [health, setHealth] = useState<HealthStatus[]>([]);
  const [projectName, setProjectName] = useState("");
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
  
  const mainContentRef = useRef<HTMLDivElement>(null);

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
      const status: HealthStatus[] = await invoke("check_latex_health");
      setHealth(status);
    } catch (error) {
      console.error("Health check failed:", error);
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
    }
    if (view === "new") {
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
    try {
      const fullTemplatePath = `${templateDir}/${selectedTemplate}`;
      const path: string = await invoke("create_project", { 
        args: { name: projectName, target_dir: targetDir, template_dir: fullTemplatePath } 
      });
      activateProject(projectName, path); 
      setView("project");
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

  const sortedProjects = [...existingProjects].sort((a, b) => {
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

        <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'} w-full mb-12`}>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg shrink-0">
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
          <NavItem collapsed={isSidebarCollapsed} active={view === "dashboard"} onClick={() => setView("dashboard")} icon={<Layers size={18} />} label="Dashboard" />
          <NavItem collapsed={isSidebarCollapsed} active={view === "new"} onClick={() => setView("new")} icon={<Plus size={18} />} label="Nouveau Projet" disabled={isWatching} />
          <NavItem collapsed={isSidebarCollapsed} active={view === "settings"} onClick={() => setView("settings")} icon={<Settings size={18} />} label="Paramètres" />
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
              <header className="flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">Tableau de bord</h1>
                  <p className="text-white/40 text-sm">Gérez vos projets et votre environnement LaTeX.</p>
                </div>
                <button 
                   onClick={() => setView("new")} 
                   disabled={isWatching}
                   className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${isWatching ? 'bg-white/5 text-white/10 cursor-not-allowed opacity-50' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white'}`}
                >
                  <Plus size={16} /> Nouveau
                </button>
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

              <section className="bg-[#121216]/50 border border-white/5 rounded-2xl p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                  <div className="flex items-center gap-3">
                    <Layers size={20} className={isWatching ? 'text-green-500' : 'text-blue-500'} />
                    <h2 className="text-xl font-bold uppercase tracking-tight">Projets</h2>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {/* Filters */}
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

                <div className="flex flex-col gap-2 relative">
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
                    <div className="text-center py-24 bg-black/10 rounded-3xl border border-dashed border-white/5">
                      <div className="flex flex-col items-center gap-4">
                        <FolderOpen size={48} className="text-white/5" />
                        <p className="text-white/20 italic text-sm">Aucun projet trouvé dans ce répertoire.</p>
                      </div>
                    </div>
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

          {view === "new" && (
             <div className="fade-in flex flex-col gap-8">
               <header>
                 <h1 className="text-3xl font-bold mb-2">Nouveau Projet</h1>
                 <p className="text-white/40 text-sm">Initialisez votre structure LaTeX.</p>
               </header>
               
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 <section className="bg-[#121216] border border-white/5 rounded-2xl p-8 space-y-6">
                   <InputGroup label="Nom du projet" value={projectName} onChange={setProjectName} placeholder="mon-memoire" />
                   <InputGroup label="Fichier racine" value={mainFile} onChange={setMainFile} placeholder="main.tex" />
                   <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">Template</label>
                     <select 
                       value={selectedTemplate} 
                       onChange={(e) => setSelectedTemplate(e.target.value)}
                       className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-sm outline-none"
                     >
                       {availableTemplates.length > 0 ? availableTemplates.map(t => <option key={t} value={t}>{t}</option>) : <option disabled>Aucun template</option>}
                     </select>
                   </div>
                 </section>

                 <section className="bg-[#121216] border border-white/5 rounded-2xl p-8 flex flex-col justify-between gap-8">
                   <InputGroup label="Dossier Cible" value={targetDir} onChange={setTargetDir} />
                   <div className="flex gap-3">
                     <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold transition-all" onClick={handleCreateProject}>Créer</button>
                     <button className="bg-white/5 hover:bg-white/10 px-6 py-3.5 rounded-xl font-bold transition-all border border-white/5" onClick={() => setView("dashboard")}>Annuler</button>
                   </div>
                 </section>
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
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  <span className="text-[10px] font-bold text-white/50 uppercase tracking-tight">Système Prêt</span>
                </div>
              </header>
              
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

function InputGroup({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-1">{label}</label>
      <input 
        type="text" 
        className="bg-black/40 border border-white/10 rounded-xl p-3 text-sm focus:border-blue-500 outline-none transition-colors truncate"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function VSCodeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="vsc-mask0" maskType="alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
        <path fillRule="evenodd" clipRule="evenodd" d="M70.9119 99.3171C72.4869 99.9307 74.2828 99.8914 75.8725 99.1264L96.4608 89.2197C98.6242 88.1787 100 85.9892 100 83.5872V16.4133C100 14.0113 98.6243 11.8218 96.4609 10.7808L75.8725 0.873756C73.7862 -0.130129 71.3446 0.11576 69.5135 1.44695C69.252 1.63711 69.0028 1.84943 68.769 2.08341L29.3551 38.0415L12.1872 25.0096C10.589 23.7965 8.35363 23.8959 6.86933 25.2461L1.36303 30.2549C-0.452552 31.9064 -0.454633 34.7627 1.35853 36.417L16.2471 50.0001L1.35853 63.5832C-0.454633 65.2374 -0.452552 68.0938 1.36303 69.7453L6.86933 74.7541C8.35363 76.1043 10.589 76.2037 12.1264 74.9905L29.3551 61.9587L68.769 97.9167C69.3925 98.5406 70.1246 99.0104 70.9119 99.3171ZM75.0152 27.2989L45.1091 50.0001L75.0152 72.7012V27.2989Z" fill="white"/>
      </mask>
      <g mask="url(#vsc-mask0)">
        <path d="M96.4614 10.7962L75.8569 0.875542C73.4719 -0.272773 70.6217 0.211611 68.75 2.08333L1.29858 63.5832C-0.515693 65.2373 -0.513607 68.0937 1.30308 69.7452L6.81272 74.754C8.29793 76.1042 10.5347 76.2036 12.1338 74.9905L93.3609 13.3699C96.086 11.3026 100 13.2462 100 16.6667V16.4275C100 14.0265 98.6246 11.8378 96.4614 10.7962Z" fill="#0065A9"/>
        <g filter="url(#vsc-filter0_d)">
          <path d="M96.4614 89.2038L75.8569 99.1245C73.4719 100.273 70.6217 99.7884 68.75 97.9167L1.29858 36.4169C-0.515693 34.7627 -0.513607 31.9063 1.30308 30.2548L6.81272 25.246C8.29793 23.8958 10.5347 23.7964 12.1338 25.0095L93.3609 86.6301C96.086 88.6974 100 86.7538 100 83.3334V83.5726C100 85.9735 98.6246 88.1622 96.4614 89.2038Z" fill="#007ACC"/>
        </g>
        <g filter="url(#vsc-filter1_d)">
          <path d="M75.8578 99.1263C73.4721 100.274 70.6219 99.7885 68.75 97.9166C71.0564 100.223 75 98.5895 75 95.3278V4.67213C75 1.41039 71.0564 -0.223106 68.75 2.08332C70.6219 0.211402 73.4721 -0.273666 75.8578 0.873633L96.4587 10.7807C98.6234 11.8217 100 14.0112 100 16.4132V83.5871C100 85.9891 98.6246 88.1786 96.4586 89.2196L75.8578 99.1263Z" fill="#1F9CF0"/>
        </g>
        <g style={{ mixBlendMode: 'overlay' }} opacity="0.25">
          <path fillRule="evenodd" clipRule="evenodd" d="M70.8511 99.3171C72.4261 99.9306 74.2221 99.8913 75.8117 99.1264L96.4 89.2197C98.5634 88.1787 99.9392 85.9892 99.9392 83.5871V16.4133C99.9392 14.0112 98.5635 11.8217 96.4001 10.7807L75.8117 0.873695C73.7255 -0.13019 71.2838 0.115699 69.4527 1.44688C69.1912 1.63705 68.942 1.84937 68.7082 2.08335L29.2943 38.0414L12.1264 25.0096C10.5283 23.7964 8.29285 23.8959 6.80855 25.246L1.30225 30.2548C-0.513334 31.9064 -0.515415 34.7627 1.29775 36.4169L16.1863 50L1.29775 63.5832C-0.515415 65.2374 -0.513334 68.0937 1.30225 69.7452L6.80855 74.754C8.29285 76.1042 10.5283 76.2036 12.1264 74.9905L29.2943 61.9586L68.7082 97.9167C69.3317 98.5405 70.0638 99.0104 70.8511 99.3171ZM74.9544 27.2989L45.0483 50L74.9544 72.7012V27.2989Z" fill="url(#vsc-paint0_linear)"/>
        </g>
      </g>
      <defs>
        <filter id="vsc-filter0_d" x="-8.39411" y="15.8291" width="116.727" height="92.2456" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="4.16667"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="overlay" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
        <filter id="vsc-filter1_d" x="60.4167" y="-8.07558" width="47.9167" height="116.151" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <feFlood floodOpacity="0" result="BackgroundImageFix"/>
          <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"/>
          <feOffset/>
          <feGaussianBlur stdDeviation="4.16667"/>
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
          <feBlend mode="overlay" in2="BackgroundImageFix" result="effect1_dropShadow"/>
          <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
        </filter>
        <linearGradient id="vsc-paint0_linear" x1="49.9392" y1="0.257812" x2="49.9392" y2="99.7423" gradientUnits="userSpaceOnUse">
          <stop stopColor="white"/>
          <stop offset="1" stopColor="white" stopOpacity="0"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

export default App;
