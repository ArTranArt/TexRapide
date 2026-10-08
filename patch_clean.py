with open("src-tauri/src/project.rs", "r") as f:
    pcode = f.read()

old_clean = """pub fn clean_auxiliary_files(project_path: String, path: String) -> Result<u32, String> {"""
new_clean = """pub async fn clean_auxiliary_files(project_path: String, path: String) -> Result<u32, String> {
    tauri::async_runtime::spawn_blocking(move || {
        _clean_auxiliary_files(project_path, path)
    }).await.map_err(|e| e.to_string())?
}

fn _clean_auxiliary_files(project_path: String, path: String) -> Result<u32, String> {"""

pcode = pcode.replace(old_clean, new_clean)

with open("src-tauri/src/project.rs", "w") as f:
    f.write(pcode)
