import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Activity, Plus, Settings, Play, CheckCircle2, XCircle, FolderOpen, Eye } from "lucide-react";
import "./App.css";

interface HealthStatus {
  binary: String;
  installed: boolean;
  version: string | null;
}

function App() {
  const [view, setView] = useState<"dashboard" | "new" | "settings">("dashboard");
  const [health, setHealth] = useState<HealthStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState("");
  const [mainFile, setMainFile] = useState("main.tex");
  const [targetDir, setTargetDir] = useState("/Users/arthur/Documents/LaTeX_Projects");
  const [templateDir, setTemplateDir] = useState("/Users/arthur/templates/my_latex_templates");
  const [availableTemplates, setAvailableTemplates] = useState<string[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [existingProjects, setExistingProjects] = useState<string[]>([]);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState(false);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const status: HealthStatus[] = await invoke("check_latex_health");
      setHealth(status);
    } catch (error) {
      console.error("Health check failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const projects: string[] = await invoke("list_projects", { targetDir });
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

  useEffect(() => {
    if (view === "dashboard") {
      fetchProjects();
      checkHealth();
    }
    if (view === "new") {
      fetchTemplates();
    }
  }, [view]);

  const activateProject = (name: string) => {
    const path = `${targetDir}/${name}`;
    setActiveProject(path);
    setProjectName(name);
    setIsWatching(false); // Reset watch mode when changing project
  };

  const handleCreateProject = async () => {
    try {
      const fullTemplatePath = `${templateDir}/${selectedTemplate}`;
      const path: string = await invoke("create_project", { 
        args: { name: projectName, target_dir: targetDir, template_dir: fullTemplatePath } 
      });
      setActiveProject(path);
      setView("dashboard");
      alert("Projet créé avec succès !");
    } catch (error) {
      alert(`Erreur : ${error}`);
    }
  };

  const handleStartWatch = async () => {
    if (!activeProject) return;
    try {
      await invoke("start_watch", { projectPath: activeProject, mainFile: mainFile });
      setIsWatching(true);
    } catch (error) {
      alert(`Erreur : ${error}`);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '8px', borderRadius: '8px' }}>
            <Activity size={24} color="white" />
          </div>
          <span style={{ fontSize: '20px', fontWeight: 'bold' }}>TexRapide</span>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className={`sidebar-item ${view === "dashboard" ? "active" : ""}`} onClick={() => setView("dashboard")}>
            <Activity size={18} />
            <span>Dashboard</span>
          </div>
          <div className={`sidebar-item ${view === "new" ? "active" : ""}`} onClick={() => setView("new")}>
            <Plus size={18} />
            <span>Nouveau Projet</span>
          </div>
          <div className={`sidebar-item ${view === "settings" ? "active" : ""}`} onClick={() => setView("settings")}>
            <Settings size={18} />
            <span>Paramètres</span>
          </div>
        </nav>

        {activeProject && (
          <div style={{ marginTop: 'auto', padding: '20px 0' }}>
            <div className="card" style={{ padding: '12px', fontSize: '12px' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '5px' }}>PROJET ACTIF</div>
              <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {projectName || "Sans titre"}
              </div>
            </div>
          </div>
        )}
      </aside>

      <main className="main-content">
        {view === "dashboard" && (
          <>
            <header>
              <h1>Tableau de bord</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Surveillance et contrôle de vos sessions.</p>
            </header>

            <section className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px' }}>État du Système</h2>
                <button onClick={checkHealth} className="button secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  Actualiser
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                {health.map((status) => (
                  <div key={status.binary.toString()} className="status-indicator card" style={{ padding: '15px' }}>
                    {status.installed ? <CheckCircle2 color="var(--accent-success)" size={20} /> : <XCircle color="var(--accent-error)" size={20} />}
                    <div>
                      <div style={{ fontWeight: '600' }}>{status.binary}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{status.installed ? status.version : "Non trouvé"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>Tes Projets</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {existingProjects.length > 0 ? (
                  existingProjects.map(p => (
                    <div 
                      key={p} 
                      className={`sidebar-item ${activeProject === `${targetDir}/${p}` ? 'active' : ''}`}
                      onClick={() => activateProject(p)}
                      style={{ background: 'rgba(255, 255, 255, 0.03)' }}
                    >
                      <FolderOpen size={16} />
                      <span style={{ flex: 1 }}>{p}</span>
                      {activeProject === `${targetDir}/${p}` && <div className="dot success"></div>}
                    </div>
                  ))
                ) : (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Aucun projet trouvé dans {targetDir}</p>
                )}
              </div>
            </section>

            {activeProject ? (
              <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '18px' }}>Contrôle de Session</h2>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{activeProject}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      className={`button ${isWatching ? 'secondary' : ''}`} 
                      onClick={handleStartWatch}
                      disabled={isWatching}
                    >
                      <Play size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
                      {isWatching ? "Mode Watch Actif" : "Lancer Watch"}
                    </button>
                  </div>
                </div>
                {isWatching && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-success)' }}>
                    <div className="dot success"></div>
                    <span style={{ fontSize: '14px' }}>iTeX surveille vos fichiers...</span>
                  </div>
                )}
              </section>
            ) : (
              <section className="card" style={{ textAlign: 'center', padding: '40px' }}>
                <Plus size={48} color="var(--text-secondary)" style={{ marginBottom: '20px' }} />
                <h3>Aucun projet actif</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Commencez par créer un nouveau projet.</p>
                <button className="button" onClick={() => setView("new")}>Créer un projet</button>
              </section>
            )}
          </>
        )}

        {view === "new" && (
          <>
            <header>
              <h1>Nouveau Projet</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Configurez votre nouvel espace de travail.</p>
            </header>
            <section className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="input-group">
                <label>Nom du projet</label>
                <input type="text" placeholder="MonSuperProjet" value={projectName} onChange={(e) => setProjectName(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Fichier principal (.tex)</label>
                <input type="text" placeholder="main.tex" value={mainFile} onChange={(e) => setMainFile(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Dossier de destination</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input type="text" style={{ flex: 1 }} value={targetDir} onChange={(e) => setTargetDir(e.target.value)} />
                  <button className="button secondary"><FolderOpen size={18} /></button>
                </div>
              </div>
              <div className="input-group">
                <label>Choisir un Template</label>
                <select 
                  value={selectedTemplate} 
                  onChange={(e) => setSelectedTemplate(e.target.value)}
                  className="select-input"
                >
                  {availableTemplates.length > 0 ? (
                    availableTemplates.map(t => <option key={t} value={t}>{t}</option>)
                  ) : (
                    <option disabled>Aucun template trouvé</option>
                  )}
                </select>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                <button className="button" onClick={handleCreateProject}>Initialiser le projet</button>
                <button className="button secondary" onClick={() => setView("dashboard")}>Annuler</button>
              </div>
            </section>
          </>
        )}

        {view === "settings" && (
          <>
            <header>
              <h1>Paramètres</h1>
              <p style={{ color: 'var(--text-secondary)' }}>Configurez vos préférences iTeX.</p>
            </header>
            <section className="card">
              <p>Configuration des chemins par défaut et du viewer (Skim).</p>
              {/* Plus de paramètres ici plus tard */}
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
