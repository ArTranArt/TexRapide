import re

with open("src-tauri/src/lib.rs", "r") as f:
    content = f.read()

path_code = """
fn ensure_local_bin_in_path(app: &tauri::AppHandle) {
    let mut modified = false;
    
    if let Ok(app_data_dir) = app.path().app_data_dir() {
        if let Ok(current_path) = std::env::var("PATH") {
            let separator = if cfg!(windows) { ";" } else { ":" };
            let mut paths: Vec<String> = current_path.split(separator).map(|s| s.to_string()).collect();
            let app_data_str = app_data_dir.to_string_lossy().to_string();
            if !paths.contains(&app_data_str) {
                paths.insert(0, app_data_str);
                std::env::set_var("PATH", paths.join(separator));
                modified = true;
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Ok(current_path) = std::env::var("PATH") {
            let mut paths: Vec<String> = current_path.split(':').map(|s| s.to_string()).collect();
            let additional_paths = vec![
                "/Library/TeX/texbin",
                "/usr/local/bin",
                "/opt/homebrew/bin",
            ];
            for path in additional_paths {
                if !paths.contains(&path.to_string()) && std::path::Path::new(path).exists() {
                    paths.push(path.to_string());
                    modified = true;
                }
            }
            if modified {
                std::env::set_var("PATH", paths.join(":"));
            }
        }
    }
}
"""

content = re.sub(r'#\[cfg\(target_os = "macos"\)\]\nfn fix_macos_path\(\) \{.*?\n\}\n', path_code, content, flags=re.DOTALL)
content = re.sub(r'(\.setup\(\|app\| \{)', r'\1\n            ensure_local_bin_in_path(app.handle());', content)
content = re.sub(r'#\[cfg\(target_os = "macos"\)\]\s*fix_macos_path\(\);\n', '', content)

with open("src-tauri/src/lib.rs", "w") as f:
    f.write(content)
