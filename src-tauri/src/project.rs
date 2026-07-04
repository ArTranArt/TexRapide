use std::fs;
use std::path::Path;
use fs_extra::dir::{copy, CopyOptions};
use std::process::Command;
use tauri::Manager;

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
    let path_obj = Path::new(&path);
    if let Some(parent) = path_obj.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(path_obj, content).map_err(|e| e.to_string())
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

#[derive(serde::Serialize)]
pub struct SynctexForwardResult {
    pub page: u32,
    pub x: f64,
    pub y: f64,
}

#[tauri::command]
pub fn synctex_forward_search(pdf_path: String, line: u32, column: u32, tex_path: String) -> Result<SynctexForwardResult, String> {
    let arg_input = format!("{}:{}:{}", line, column, tex_path);
    
    let output = Command::new("synctex")
        .arg("view")
        .arg("-i")
        .arg(&arg_input)
        .arg("-o")
        .arg(&pdf_path)
        .output()
        .or_else(|_| {
            #[cfg(target_os = "macos")]
            {
                Command::new("/Library/TeX/texbin/synctex")
                    .arg("view")
                    .arg("-i")
                    .arg(&arg_input)
                    .arg("-o")
                    .arg(&pdf_path)
                    .output()
            }
            #[cfg(not(target_os = "macos"))]
            {
                Err(std::io::Error::new(std::io::ErrorKind::NotFound, "synctex not found"))
            }
        })
        .map_err(|e| format!("Erreur lors du lancement de synctex : {}", e))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    
    let mut page = 1;
    let mut x = 0.0;
    let mut y = 0.0;
    let mut found = false;

    for line_str in stdout.lines() {
        if line_str.starts_with("Page:") {
            if let Ok(p) = line_str["Page:".len()..].trim().parse::<u32>() {
                page = p;
                found = true;
            }
        } else if line_str.starts_with("x:") {
            if let Ok(val) = line_str["x:".len()..].trim().parse::<f64>() {
                x = val;
            }
        } else if line_str.starts_with("y:") {
            if let Ok(val) = line_str["y:".len()..].trim().parse::<f64>() {
                y = val;
            }
        }
    }

    if !found {
        return Err("Aucune correspondance trouvée dans le fichier SyncTeX.".to_string());
    }

    Ok(SynctexForwardResult { page, x, y })
}

#[derive(serde::Serialize)]
pub struct FileEntry {
    pub name: String,
    pub relative_path: String,
    pub is_dir: bool,
    pub children: Option<Vec<FileEntry>>,
}

fn scan_dir_recursive(dir_path: &Path, root_path: &Path) -> Result<Vec<FileEntry>, String> {
    let mut entries = Vec::new();
    
    if dir_path.is_dir() {
        for entry in fs::read_dir(dir_path).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            let name = path.file_name().and_then(|s| s.to_str()).unwrap_or("").to_string();
            
            // Skip hidden files, target folders, standard node_modules, and synctex/gzip files
            if name.starts_with('.') || name == "node_modules" || name == "target" || name == "dist" || name.ends_with(".synctex.gz") || name.ends_with(".synctex") || name.ends_with(".gz") {
                continue;
            }
            
            let relative_path = path.strip_prefix(root_path)
                .map_err(|e| e.to_string())?
                .to_str()
                .ok_or("Invalid path encoding")?
                .to_string()
                .replace("\\", "/");
                
            if path.is_dir() {
                let children = scan_dir_recursive(&path, root_path)?;
                entries.push(FileEntry {
                    name,
                    relative_path,
                    is_dir: true,
                    children: Some(children),
                });
            } else {
                let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
                let ignored_exts = ["aux", "log", "toc", "lof", "lot", "out", "synctex.gz", "pdf", "fls", "fdb_latexmk", "blg", "bbl", "run.xml", "bcf", "gz"];
                if ignored_exts.contains(&ext.as_str()) {
                    continue;
                }
                
                entries.push(FileEntry {
                    name,
                    relative_path,
                    is_dir: false,
                    children: None,
                });
            }
        }
    }
    
    // Sort: directories first, then files alphabetically
    entries.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        } else if a.is_dir {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });
    
    Ok(entries)
}

#[tauri::command]
pub fn list_project_tree(path: String) -> Result<Vec<FileEntry>, String> {
    let root = Path::new(&path);
    scan_dir_recursive(root, root)
}

#[tauri::command]
pub fn rename_file(old_path: String, new_path: String) -> Result<(), String> {
    let old = Path::new(&old_path);
    let new = Path::new(&new_path);
    if let Some(parent) = new.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::rename(old, new).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn duplicate_file(src_path: String, dest_path: String) -> Result<(), String> {
    let src = Path::new(&src_path);
    let dest = Path::new(&dest_path);
    if let Some(parent) = dest.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::copy(src, dest).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn delete_file(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if p.is_dir() {
        fs::remove_dir_all(p).map_err(|e| e.to_string())?;
    } else {
        fs::remove_file(p).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn export_pdf_to_downloads(app_handle: tauri::AppHandle, pdf_path: String, filename: String) -> Result<String, String> {
    let src = Path::new(&pdf_path);
    if !src.exists() {
        return Err("Le fichier PDF source n'existe pas. Veuillez d'abord compiler le projet.".to_string());
    }

    let download_dir = app_handle.path().download_dir()
        .map_err(|e| format!("Impossible de localiser le dossier des téléchargements : {}", e))?;

    let mut dest = download_dir.join(&filename);
    if dest.exists() {
        let path_obj = Path::new(&filename);
        let file_stem = path_obj
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("document");
        let file_ext = path_obj
            .extension()
            .and_then(|s| s.to_str())
            .unwrap_or("pdf");
            
        let mut counter = 1;
        loop {
            let new_filename = format!("{} ({}).{}", file_stem, counter, file_ext);
            let candidate = download_dir.join(&new_filename);
            if !candidate.exists() {
                dest = candidate;
                break;
            }
            counter += 1;
        }
    }
    
    std::fs::copy(src, &dest).map_err(|e| format!("Erreur lors de la copie du fichier : {}", e))?;

    Ok(dest.to_string_lossy().to_string())
}

#[tauri::command]
pub fn show_in_finder(path: String) -> Result<(), String> {
    let p = Path::new(&path);
    if !p.exists() {
        return Err("Le fichier n'existe pas.".to_string());
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg("-R")
            .arg(p)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .arg(format!("/select,\"{}\"", p.to_string_lossy()))
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        if let Some(parent) = p.parent() {
            Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn clean_auxiliary_files(path: String) -> Result<u32, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err("Le chemin fourni n'est pas un dossier.".to_string());
    }

    let ignored_exts = ["aux", "log", "toc", "lof", "lot", "out", "fls", "fdb_latexmk", "blg", "bbl", "run.xml", "bcf", "gz"];
    let mut deleted_count = 0;

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
                    if ignored_exts.contains(&ext.to_lowercase().as_str()) {
                        if fs::remove_file(&path).is_ok() {
                            deleted_count += 1;
                        }
                    }
                }
            }
        }
    }
    
    Ok(deleted_count)
}
