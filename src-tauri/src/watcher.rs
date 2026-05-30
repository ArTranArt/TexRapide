use notify::{Watcher, RecursiveMode, Event};
use std::process::Command;
use std::path::Path;
use std::sync::mpsc::channel;
use std::time::Duration;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, State, Emitter};

pub struct WatcherState(pub Arc<Mutex<Option<Arc<AtomicBool>>>>);

#[tauri::command]
pub fn start_watch(
    handle: AppHandle, 
    state: State<'_, WatcherState>,
    project_path: String, 
    main_file: String
) -> std::result::Result<(), String> {
    // Arrêter un watcher existant s'il y en a un
    stop_watch(state.clone())?;

    let stop_signal = Arc::new(AtomicBool::new(false));
    let thread_stop_signal = stop_signal.clone();
    
    {
        let mut watcher_lock = state.0.lock().unwrap();
        *watcher_lock = Some(stop_signal);
    }

    let path = project_path.clone();
    let file = main_file.clone();
    let handle_clone = handle.clone();
    
    std::thread::spawn(move || {
        let (tx, rx) = channel();
        let mut watcher = notify::recommended_watcher(tx).unwrap();

        if let Err(e) = watcher.watch(Path::new(&path), RecursiveMode::Recursive) {
            println!("Error watching: {}", e);
            return;
        }

        println!("Watching: {} (main: {})", path, file);
        run_build(&handle_clone, &path, &file);

        let debounce_duration = Duration::from_millis(500);

        while !thread_stop_signal.load(Ordering::Relaxed) {
            // On attend un événement avec un timeout pour pouvoir vérifier le signal d'arrêt
            if let Ok(res) = rx.recv_timeout(Duration::from_millis(500)) {
                if let Ok(event) = res {
                    if is_relevant_event(event) {
                        while let Ok(_) = rx.try_recv() {}
                        std::thread::sleep(debounce_duration);
                        run_build(&handle_clone, &path, &file);
                    }
                }
            }
        }
        println!("Watcher stopped for: {}", path);
    });

    Ok(())
}

#[tauri::command]
pub fn stop_watch(state: State<'_, WatcherState>) -> std::result::Result<(), String> {
    let mut watcher_lock = state.0.lock().unwrap();
    if let Some(signal) = watcher_lock.take() {
        signal.store(true, Ordering::Relaxed);
    }
    Ok(())
}

fn is_relevant_event(event: Event) -> bool {
    event.paths.iter().any(|p| {
        let ext = p.extension().map_or("", |e| e.to_str().unwrap_or(""));
        ext == "tex" || ext == "bib" || ext == "cls" || ext == "sty"
    })
}

#[derive(Clone, serde::Serialize)]
struct CompilePayload {
    status: String,
    logs: String,
}

fn run_build(handle: &AppHandle, project_path: &str, main_file: &str) {
    let target = Path::new(project_path).join(main_file);
    if !target.exists() { return; }

    // Émettre le statut de début de compilation
    let _ = handle.emit("compile-status", CompilePayload {
        status: "compiling".to_string(),
        logs: "".to_string(),
    });

    // Lancer latexmk et capturer stdout et stderr
    let (success, logs) = match Command::new("latexmk")
        .arg("-pdf")
        .arg("-interaction=nonstopmode")
        .arg("-cd")
        .arg(main_file)
        .current_dir(project_path)
        .output()
    {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout).to_string();
            let stderr = String::from_utf8_lossy(&output.stderr).to_string();
            
            let mut logs = stdout;
            if !stderr.is_empty() {
                if !logs.is_empty() {
                    logs.push_str("\n");
                }
                logs.push_str(&stderr);
            }
            
            (output.status.success(), logs)
        }
        Err(e) => {
            (false, format!("Erreur lors du lancement de latexmk : {}", e))
        }
    };

    // Émettre le statut de fin de compilation
    let status_str = if success { "success" } else { "error" };
    let _ = handle.emit("compile-status", CompilePayload {
        status: status_str.to_string(),
        logs,
    });

    // Si la compilation a échoué, on nettoie les fichiers auxiliaires/temporaires pour le fichier principal
    // et on supprime le fichier de base de données .fdb_latexmk pour forcer latexmk à relancer
    // pdflatex lors de la prochaine tentative (ce qui génère l'erreur avec "!").
    if !success {
        let _ = Command::new("latexmk")
            .arg("-c")
            .arg(main_file)
            .current_dir(project_path)
            .status();

        let fdb_path = target.with_extension("fdb_latexmk");
        if fdb_path.exists() {
            let _ = std::fs::remove_file(fdb_path);
        }
    }

    std::thread::sleep(Duration::from_millis(500));

    let pdf_path = target.with_extension("pdf");
    if pdf_path.exists() {
        let _ = Command::new("open")
            .arg("-g")
            .arg("-a")
            .arg("Skim")
            .arg(pdf_path)
            .spawn();
    }
}
