use std::process::Command;

#[derive(serde::Serialize)]
pub struct HealthStatus {
    pub binary: String,
    pub installed: bool,
    pub version: Option<String>,
}

#[tauri::command]
pub fn check_latex_health() -> Vec<HealthStatus> {
    let binaries = vec!["pdflatex", "latexmk", "bibtex"];
    let mut statuses = Vec::new();

    for bin in binaries {
        let output = Command::new("which").arg(bin).output();
        let installed = output.is_ok() && output.unwrap().status.success();
        
        let version = if installed {
            let ver_output = Command::new(bin).arg("--version").output();
            if let Ok(o) = ver_output {
                let stdout = String::from_utf8_lossy(&o.stdout);
                stdout.lines().next().map(|s| s.to_string())
            } else {
                None
            }
        } else {
            None
        };

        statuses.push(HealthStatus {
            binary: bin.to_string(),
            installed,
            version,
        });
    }

    statuses
}
