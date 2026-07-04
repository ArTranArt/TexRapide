mod health;
mod project;
mod watcher;
use tauri::Manager;
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

#[cfg(target_os = "macos")]
fn fix_macos_path() {
    if let Ok(current_path) = std::env::var("PATH") {
        let mut paths: Vec<String> = current_path.split(':').map(|s| s.to_string()).collect();
        
        let additional_paths = vec![
            "/Library/TeX/texbin",
            "/usr/local/bin",
            "/opt/homebrew/bin",
        ];
        
        let mut modified = false;
        for path in additional_paths {
            if !paths.contains(&path.to_string()) && std::path::Path::new(path).exists() {
                paths.push(path.to_string());
                modified = true;
            }
        }
        
        if modified {
            let new_path = paths.join(":");
            std::env::set_var("PATH", new_path);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "macos")]
    fix_macos_path();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(watcher::WatcherState(std::sync::Arc::new(std::sync::Mutex::new(None))))
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            apply_vibrancy(&window, NSVisualEffectMaterial::UnderWindowBackground, None, None)
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            #[cfg(target_os = "macos")]
            {
                use tauri::menu::Menu;
                let menu = Menu::default(app.handle())?;
                app.set_menu(menu)?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            health::check_latex_health,
            project::create_project,
            project::list_projects,
            project::list_templates,
            project::list_tex_files,
            project::list_project_tree,
            project::open_in_vscode,
            project::open_in_vscode_at_line,
            project::file_exists,
            project::read_file,
            project::write_file,
            project::rename_file,
            project::duplicate_file,
            project::delete_file,
            project::export_pdf_to_downloads,
            project::show_in_finder,
            project::synctex_inverse_search,
            project::synctex_forward_search,
            project::clean_auxiliary_files,
            watcher::start_watch,
            watcher::stop_watch,
            watcher::compile_once
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
