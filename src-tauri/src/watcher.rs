use notify::{Watcher, RecursiveMode, Event};
use std::process::Command;
use std::path::Path;
use std::sync::mpsc::channel;
use std::time::Duration;
use std::sync::{Arc, Mutex};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, State};

pub struct WatcherState(pub Arc<Mutex<Option<Arc<AtomicBool>>>>);

#[tauri::command]
pub fn start_watch(
    _handle: AppHandle, 
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
    
    std::thread::spawn(move || {
        let (tx, rx) = channel();
        let mut watcher = notify::recommended_watcher(tx).unwrap();

        if let Err(e) = watcher.watch(Path::new(&path), RecursiveMode::Recursive) {
            println!("Error watching: {}", e);
            return;
        }

        println!("Watching: {} (main: {})", path, file);
        run_build(&path, &file);

        let debounce_duration = Duration::from_millis(500);

        while !thread_stop_signal.load(Ordering::Relaxed) {
            // On attend un événement avec un timeout pour pouvoir vérifier le signal d'arrêt
            if let Ok(res) = rx.recv_timeout(Duration::from_millis(500)) {
                if let Ok(event) = res {
                    if is_relevant_event(event) {
                        while let Ok(_) = rx.try_recv() {}
                        std::thread::sleep(debounce_duration);
                        run_build(&path, &file);
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

fn run_build(project_path: &str, main_file: &str) {
    let target = Path::new(project_path).join(main_file);
    if !target.exists() { return; }

    let _ = Command::new("latexmk")
        .arg("-pdf")
        .arg("-interaction=nonstopmode")
        .arg("-cd")
        .arg(main_file)
        .current_dir(project_path)
        .status();

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
