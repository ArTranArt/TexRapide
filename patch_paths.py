with open("src/hooks/useAppState.ts", "r") as f:
    code = f.read()

old_vars = """  const [targetDir, setTargetDir] = useState(() => {
    return localStorage.getItem("texrapide_target_dir") || "C:\\\\Users\\\\Art\\\\Documents\\\\LaTeX\\\\LaTeX_Projects";
  });
  const [dashboardProjectsDir, setDashboardProjectsDir] = useState(() => {
    return localStorage.getItem("texrapide_dashboard_dir") || localStorage.getItem("texrapide_target_dir") || "C:\\\\Users\\\\Art\\\\Documents\\\\LaTeX\\\\LaTeX_Projects";
  });
  const [templateDir, setTemplateDir] = useState(() => {
    return localStorage.getItem("texrapide_template_dir") || "C:\\\\Users\\\\Art\\\\Documents\\\\LaTeX\\\\templates";
  });"""

new_vars = """  const [targetDir, setTargetDir] = useState(() => localStorage.getItem("texrapide_target_dir") || "");
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
  }, []);"""

if old_vars in code:
    code = code.replace(old_vars, new_vars)
    with open("src/hooks/useAppState.ts", "w") as f:
        f.write(code)
    print("Replaced successfully!")
else:
    print("Could not find old vars block")
