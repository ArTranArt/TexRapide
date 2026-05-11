use notify::{Watcher, RecursiveMode, Event};
use std::process::Command;
use std::path::Path;
use std::sync::mpsc::channel;
use std::time::Duration;
use tauri::AppHandle;

#[tauri::command]
pub fn start_watch(_handle: AppHandle, project_path: String, main_file: String) -> std::result::Result<(), String> {
    let path = project_path.clone();
    let file = main_file.clone();
    
    std::thread::spawn(move || {
        let (tx, rx) = channel();
        let mut watcher = notify::recommended_watcher(tx).unwrap();

        watcher.watch(Path::new(&path), RecursiveMode::Recursive).unwrap();

        println!("Watching: {} (main: {})", path, file);

        // Premier build immédiat à l'activation
        run_build(&path, &file);

        let debounce_duration = Duration::from_millis(500);

        loop {
            // On attend un événement
            if let Ok(res) = rx.recv() {
                if let Ok(event) = res {
                    if is_relevant_event(event) {
                        // On vide le channel des événements accumulés
                        while let Ok(_) = rx.try_recv() {}
                        
                        // Délai pour laisser l'éditeur finir d'écrire
                        std::thread::sleep(debounce_duration);
                        
                        run_build(&path, &file);
                    }
                }
            }
        }
    });

    Ok(())
}

fn is_relevant_event(event: Event) -> bool {
    // On réagit aux modifs de fichiers LaTeX courants
    event.paths.iter().any(|p| {
        let ext = p.extension().map_or("", |e| e.to_str().unwrap_or(""));
        ext == "tex" || ext == "bib" || ext == "cls" || ext == "sty"
    })
}

fn run_build(project_path: &str, main_file: &str) {
    // 1. Chercher le fichier principal choisi
    let target = Path::new(project_path).join(main_file);
    
    if !target.exists() {
        return;
    }

    // 2. Lancer latexmk avec nettoyage et changement de dossier
    let _ = Command::new("latexmk")
        .arg("-pdf")
        .arg("-interaction=nonstopmode")
        .arg("-cd") // Très important pour les fichiers inclus
        .arg(main_file)
        .current_dir(project_path)
        .status();

    // 3. Pause de STABILISATION (500ms) avant de notifier Skim
    // C'est ici que se règle l'erreur "Chargement impossible"
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
