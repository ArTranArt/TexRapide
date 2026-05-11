use std::fs;
use std::path::Path;
use fs_extra::dir::{copy, CopyOptions};

#[derive(serde::Deserialize)]
pub struct CreateProjectArgs {
    pub name: String,
    pub target_dir: String,
    pub template_dir: String,
}

#[tauri::command]
pub fn list_projects(target_dir: String) -> Result<Vec<String>, String> {
    let path = Path::new(&target_dir);
    if !path.exists() {
        return Ok(Vec::new());
    }

    let mut projects = Vec::new();
    if let Ok(entries) = fs::read_dir(path) {
        for entry in entries {
            if let Ok(entry) = entry {
                if entry.file_type().map(|t| t.is_dir()).unwrap_or(false) {
                    if let Some(name) = entry.file_name().to_str() {
                        projects.push(name.to_string());
                    }
                }
            }
        }
    }
    projects.sort();
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
