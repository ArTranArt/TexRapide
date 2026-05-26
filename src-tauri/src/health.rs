use std::process::Command;
use std::path::Path;

#[derive(serde::Serialize)]
pub struct HealthStatus {
    pub binary: String,
    pub installed: bool,
    pub version: Option<String>,
}

#[tauri::command]
pub fn check_latex_health() -> Vec<HealthStatus> {
    let mut statuses = Vec::new();

    // 1. Check LaTeX distribution
    let has_dist = Path::new("/Library/TeX/texbin").exists() 
        || Path::new("/usr/local/texlive").exists()
        || Command::new("which").arg("pdflatex").output().map(|o| o.status.success()).unwrap_or(false);
    
    let dist_version = if Path::new("/Library/TeX/texbin").exists() {
        Some("MacTeX / BasicTeX (/Library/TeX/texbin)".to_string())
    } else if Path::new("/usr/local/texlive").exists() {
        Some("TeX Live (/usr/local/texlive)".to_string())
    } else if has_dist {
        Some("Distribution détectée".to_string())
    } else {
        None
    };

    statuses.push(HealthStatus {
        binary: "distribution".to_string(),
        installed: has_dist,
        version: dist_version,
    });

    // 2. Check individual LaTeX binaries
    let binaries = vec!["pdflatex", "latexmk", "bibtex"];
    for bin in binaries {
        let output = Command::new("which").arg(bin).output();
        let installed = output.is_ok() && output.unwrap().status.success();
        
        let version = if installed {
            let ver_output = Command::new(bin).arg("--version").output();
            if let Ok(o) = ver_output {
                let stdout = String::from_utf8_lossy(&o.stdout);
                // Clean version string a bit (usually first line contains what we need)
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

    // 3. Check Skim Reader
    let has_skim = Path::new("/Applications/Skim.app").exists() || {
        let output = Command::new("osascript")
            .arg("-e")
            .arg("id of application \"Skim\"")
            .output();
        output.is_ok() && output.unwrap().status.success()
    };

    let skim_version = if has_skim {
        let output = Command::new("osascript")
            .arg("-e")
            .arg("version of application \"Skim\"")
            .output();
        if let Ok(o) = output {
            if o.status.success() {
                let ver = String::from_utf8_lossy(&o.stdout).trim().to_string();
                if !ver.is_empty() {
                    Some(format!("Version {}", ver))
                } else {
                    Some("Installé".to_string())
                }
            } else {
                Some("Installé".to_string())
            }
        } else {
            Some("Installé".to_string())
        }
    } else {
        None
    };

    statuses.push(HealthStatus {
        binary: "skim".to_string(),
        installed: has_skim,
        version: skim_version,
    });

    statuses
}
