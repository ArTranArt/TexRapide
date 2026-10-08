import re

with open("src-tauri/src/project.rs", "r") as f:
    code = f.read()

new_command = """
#[tauri::command]
pub fn get_default_paths(app: tauri::AppHandle) -> Result<(String, String), String> {
    use tauri::Manager;
    let docs = app.path().document_dir().map_err(|e| e.to_string())?;
    
    let mut projects_dir = docs.clone();
    projects_dir.push("LaTeX");
    projects_dir.push("LaTeX_Projects");
    
    let mut templates_dir = docs.clone();
    templates_dir.push("LaTeX");
    templates_dir.push("templates");

    Ok((
        projects_dir.to_string_lossy().to_string(),
        templates_dir.to_string_lossy().to_string()
    ))
}
"""

code += "\n" + new_command

with open("src-tauri/src/project.rs", "w") as f:
    f.write(code)

with open("src-tauri/src/lib.rs", "r") as f:
    lib_code = f.read()

lib_code = lib_code.replace("project::create_project,", "project::get_default_paths,\n            project::create_project,")

with open("src-tauri/src/lib.rs", "w") as f:
    f.write(lib_code)

