use std::process::Command;
use std::path::Path;

#[derive(serde::Serialize)]
pub struct HealthStatus {
    pub binary: String,
    pub installed: bool,
    pub version: Option<String>,
}

fn check_command_exists(bin: &str) -> bool {
    Command::new(bin).arg("--version").output().map(|o| o.status.success()).unwrap_or(false)
}

#[tauri::command]
pub fn check_latex_health() -> Vec<HealthStatus> {
    let mut statuses = Vec::new();

    // 1. Check LaTeX distribution
    let has_dist_cmd = check_command_exists("pdflatex");
    let has_mactex = Path::new("/Library/TeX/texbin").exists();
    let has_texlive = Path::new("/usr/local/texlive").exists() || Path::new("C:\\texlive").exists();
    let has_miktex = Path::new("C:\\Program Files\\MiKTeX").exists() || Path::new("C:\\Users\\Default\\AppData\\Local\\Programs\\MiKTeX").exists();
    
    let has_dist = has_mactex || has_texlive || has_miktex || has_dist_cmd;

    let dist_version = if has_mactex {
        Some("MacTeX / BasicTeX (/Library/TeX/texbin)".to_string())
    } else if has_texlive {
        Some("TeX Live".to_string())
    } else if has_miktex {
        Some("MiKTeX".to_string())
    } else if has_dist_cmd {
        Some("Distribution détectée via PATH".to_string())
    } else {
        None
    };

    statuses.push(HealthStatus {
        binary: "distribution".to_string(),
        installed: has_dist,
        version: dist_version,
    });

    // 2. Check individual LaTeX binaries
    let binaries = vec!["pdflatex", "latexmk", "bibtex", "tectonic"];
    for bin in binaries {
        let installed = check_command_exists(bin);
        
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

    // 3. Check PDF Reader
    #[cfg(target_os = "macos")]
    let (has_viewer, viewer_version) = {
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
        (has_skim, skim_version)
    };

    #[cfg(target_os = "windows")]
    let (has_viewer, viewer_version) = {
        let mut sumatra_paths = vec![
            "C:\\Program Files\\SumatraPDF\\SumatraPDF.exe".to_string(),
            "C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe".to_string(),
        ];
        
        if let Ok(local_app_data) = std::env::var("LOCALAPPDATA") {
            sumatra_paths.push(format!("{}\\SumatraPDF\\SumatraPDF.exe", local_app_data));
        }
        
        let mut found = false;
        for path in sumatra_paths {
            if Path::new(&path).exists() {
                found = true;
                break;
            }
        }
        
        if !found {
            // Some users might have it in PATH
            let output = Command::new("SumatraPDF").arg("-help").output();
            found = output.is_ok();
        }

        (found, if found { Some("Installé".to_string()) } else { None })
    };

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    let (has_viewer, viewer_version) = (true, Some("Standard".to_string()));

    statuses.push(HealthStatus {
        binary: "skim".to_string(), // Keep key as skim for frontend compatibility
        installed: has_viewer,
        version: viewer_version,
    });

    statuses
}
