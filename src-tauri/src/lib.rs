mod health;
mod project;
mod watcher;
use tauri::Manager;
use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(watcher::WatcherState(std::sync::Arc::new(std::sync::Mutex::new(None))))
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();

            #[cfg(target_os = "macos")]
            apply_vibrancy(&window, NSVisualEffectMaterial::UnderWindowBackground, None, None)
                .expect("Unsupported platform! 'apply_vibrancy' is only supported on macOS");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            health::check_latex_health,
            project::create_project,
            project::list_projects,
            project::list_templates,
            project::list_tex_files,
            project::open_in_vscode,
            project::open_in_vscode_at_line,
            project::file_exists,
            watcher::start_watch,
            watcher::stop_watch
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
