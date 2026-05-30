use std::fs;
use std::path::Path;
use fs_extra::dir::{copy, CopyOptions};
use std::process::Command;

#[tauri::command]
pub fn list_tex_files(path: String) -> Result<Vec<String>, String> {
    let mut tex_files = Vec::new();
    let dir = std::path::Path::new(&path);

    if dir.is_dir() {
        for entry in std::fs::read_dir(dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_file() && path.extension().and_then(|s| s.to_str()) == Some("tex") {
                if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                    tex_files.push(name.to_string());
                }
            }
        }
    }
    
    tex_files.sort();
    Ok(tex_files)
}

#[tauri::command]
pub fn open_in_vscode(path: String) -> Result<(), String> {
    Command::new("open")
        .arg("-a")
        .arg("Visual Studio Code")
        .arg(path)
        .spawn()
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn open_in_vscode_at_line(project_path: String, file: String, line: u32) -> Result<(), String> {
    let full_path = Path::new(&project_path).join(file);
    let path_str = full_path.to_str().ok_or("Invalid path")?;
    
    let code_bin_global = Path::new("/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code");
    let home = std::env::var("HOME").unwrap_or_default();
    let code_bin_user = Path::new(&home).join("Applications/Visual Studio Code.app/Contents/Resources/app/bin/code");
    
    let bin_to_use = if code_bin_global.exists() {
        Some(code_bin_global)
    } else if code_bin_user.exists() {
        Some(code_bin_user.as_path())
    } else {
        None
    };

    if let Some(bin) = bin_to_use {
        Command::new(bin)
            .arg("-g")
            .arg(format!("{}:{}", path_str, line))
            .spawn()
            .map_err(|e| e.to_string())?;
    } else {
        Command::new("open")
            .arg("-a")
            .arg("Visual Studio Code")
            .arg(path_str)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    
    Ok(())
}


#[derive(serde::Serialize)]
pub struct ProjectInfo {
    pub name: String,
    pub last_modified: u64,
}

#[derive(serde::Deserialize)]
pub struct CreateProjectArgs {
    pub name: String,
    pub target_dir: String,
    pub template_dir: String,
}

#[tauri::command]
pub fn list_projects(target_dir: String) -> Result<Vec<ProjectInfo>, String> {
    let path = Path::new(&target_dir);
    if !path.exists() {
        return Ok(Vec::new());
    }

    let mut projects = Vec::new();
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries {
            if let Ok(entry) = entry {
                let p = entry.path();
                if p.is_dir() {
                    if let Some(name) = entry.file_name().to_str() {
                        let metadata = fs::metadata(&p).map_err(|e| e.to_string())?;
                        let last_modified = metadata.modified()
                            .map_err(|e| e.to_string())?
                            .duration_since(std::time::UNIX_EPOCH)
                            .map_err(|e| e.to_string())?
                            .as_secs();

                        projects.push(ProjectInfo {
                            name: name.to_string(),
                            last_modified,
                        });
                    }
                }
            }
        }
    }
    // Sort by modification date descending by default
    projects.sort_by(|a, b| b.last_modified.cmp(&a.last_modified));
    Ok(projects)
}

#[tauri::command]
pub fn list_templates(template_dir: String) -> Result<Vec<String>, String> {
    let path = Path::new(&template_dir);
    if !path.exists() {
        return Ok(Vec::new());
    }

    let mut templates = Vec::new();
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries {
            if let Ok(entry) = entry {
                if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                    if let Some(name) = entry.file_name().to_str() {
                        templates.push(name.to_string());
                    }
                }
            }
        }
    }
    Ok(templates)
}

#[tauri::command]
pub fn create_project(args: CreateProjectArgs) -> Result<String, String> {
    let dest_path = Path::new(&args.target_dir).join(&args.name);
    
    if dest_path.exists() {
        return Err("Le dossier du projet existe déjà.".to_string());
    }

    // Créer le dossier parent si nécessaire
    fs::create_dir_all(&dest_path).map_err(|e| e.to_string())?;

    let mut options = CopyOptions::new();
    options.content_only = true; // Copier seulement le contenu du template

    copy(&args.template_dir, &dest_path, &options).map_err(|e| e.to_string())?;

    Ok(dest_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn file_exists(path: String) -> bool {
    std::path::Path::new(&path).exists()
}

#[tauri::command]
pub fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    std::fs::write(path, content).map_err(|e| e.to_string())
}

#[derive(serde::Serialize)]
pub struct SynctexResult {
    pub file: String,
    pub line: u32,
}

#[tauri::command]
pub fn synctex_inverse_search(pdf_path: String, page: u32, x: f64, y: f64) -> Result<SynctexResult, String> {
    let arg_coords = format!("{}:{}:{}:{}", page, x.round(), y.round(), pdf_path);
    
    let output = Command::new("synctex")
        .arg("edit")
        .arg("-o")
        .arg(&arg_coords)
        .output()
        .or_else(|_| {
            #[cfg(target_os = "macos")]
            {
                Command::new("/Library/TeX/texbin/synctex")
                    .arg("edit")
                    .arg("-o")
                    .arg(&arg_coords)
                    .output()
            }
            #[cfg(not(target_os = "macos"))]
            {
                Err(std::io::Error::new(std::io::ErrorKind::NotFound, "synctex not found"))
            }
        })
        .map_err(|e| format!("Erreur lors du lancement de synctex : {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    let mut file = String::new();
    let mut line = 1;

    for line_str in stdout.lines() {
        if line_str.starts_with("Input:") {
            file = line_str["Input:".len()..].trim().to_string();
        } else if line_str.starts_with("Line:") {
            if let Ok(l) = line_str["Line:".len()..].trim().parse::<u32>() {
                line = l;
            }
        }
    }

    if file.is_empty() {
        return Err("Aucune correspondance trouvée dans le fichier SyncTeX.".to_string());
    }

    Ok(SynctexResult { file, line })
}




