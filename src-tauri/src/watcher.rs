use notify::{Watcher, RecursiveMode, Event as NotifyEvent};
use std::path::Path;
use std::time::Duration;
use std::sync::Arc;
use tokio::sync::Mutex;
use tauri::{AppHandle, State, Emitter};
use tokio::process::Command;
use tokio::time::sleep;

pub struct WatcherState(pub Arc<Mutex<Option<tokio::sync::oneshot::Sender<()>>>>);

fn is_relevant_event(event: &NotifyEvent) -> bool {
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

#[tauri::command]
pub async fn stop_watch(state: State<'_, WatcherState>) -> std::result::Result<(), String> {
    let mut watcher_lock = state.0.lock().await;
    if let Some(signal) = watcher_lock.take() {
        let _ = signal.send(());
    }
    Ok(())
}

#[tauri::command]
pub async fn compile_once(
    handle: AppHandle,
    project_path: String,
    main_file: String,
    pdf_viewer_mode: String,
    engine: String,
) -> std::result::Result<(), String> {
    // For manual compilation, we just spawn and await it.
    // If we wanted to abort it, we could manage it globally, but compile_once is a one-off.
    run_build_async(handle, project_path, main_file, pdf_viewer_mode, engine).await;
    Ok(())
}

#[tauri::command]
pub async fn start_watch(
    handle: AppHandle, 
    state: State<'_, WatcherState>,
    project_path: String, 
    main_file: String,
    pdf_viewer_mode: String,
    engine: String,
) -> std::result::Result<(), String> {
    
    // Arrêter un watcher existant s'il y en a un
    stop_watch(state.clone()).await?;

    let (stop_tx, mut stop_rx) = tokio::sync::oneshot::channel();
    
    {
        let mut watcher_lock = state.0.lock().await;
        *watcher_lock = Some(stop_tx);
    }

    let (event_tx, mut event_rx) = tokio::sync::mpsc::unbounded_channel();

    // Standard notify watcher
    let mut watcher = notify::recommended_watcher(move |res: notify::Result<NotifyEvent>| {
        if let Ok(event) = res {
            if is_relevant_event(&event) {
                let _ = event_tx.send(());
            }
        }
    }).map_err(|e| e.to_string())?;

    watcher.watch(Path::new(&project_path), RecursiveMode::Recursive).map_err(|e| e.to_string())?;

    // Spawn async background task to orchestrate builds
    tokio::spawn(async move {
        let _watcher = watcher; // Keep alive
        
        let mut current_build_task: Option<tokio::task::JoinHandle<()>> = None;
        let mut trigger_build = true;

        loop {
            if trigger_build {
                
                
                // Abort previous compilation immediately (kill_on_drop will kill the process)
                if let Some(task) = current_build_task.take() {
                    task.abort();
                    println!("Previous compilation aborted due to new changes.");
                }

                let h_clone = handle.clone();
                let p_path = project_path.clone();
                let m_file = main_file.clone();
                let mode = pdf_viewer_mode.clone();
                let eng = engine.clone();

                current_build_task = Some(tokio::spawn(async move {
                    run_build_async(h_clone, p_path, m_file, mode, eng).await;
                }));
            }

            tokio::select! {
                _ = &mut stop_rx => {
                    if let Some(task) = current_build_task.take() { task.abort(); }
                    println!("Watcher stopped for: {}", project_path);
                    break;
                }
                event = event_rx.recv() => {
                    if event.is_none() { break; }
                    // Debounce
                    sleep(Duration::from_millis(500)).await;
                    while let Ok(_) = event_rx.try_recv() {}
                    trigger_build = true;
                }
            }
        }
    });

    Ok(())
}

async fn run_build_async(
    handle: AppHandle,
    project_path: String,
    main_file: String,
    pdf_viewer_mode: String,
    engine: String,
) {
    let target = Path::new(&project_path).join(&main_file);
    if !target.exists() { return; }

    let synctex_path = target.with_extension("synctex.gz");
    if !synctex_path.exists() {
        let fdb_path = target.with_extension("fdb_latexmk");
        if fdb_path.exists() { let _ = std::fs::remove_file(fdb_path); }
        let pdf_path = target.with_extension("pdf");
        if pdf_path.exists() { let _ = std::fs::remove_file(pdf_path); }
    }

    let _ = handle.emit("compile-status", CompilePayload {
        status: "compiling".to_string(),
        logs: "".to_string(),
    });

    let (success, logs) = if engine == "tectonic" {
        let mut cmd = Command::new("tectonic");
        cmd.arg("--synctex")
           .arg("--keep-logs")
           .arg(&main_file)
           .current_dir(&project_path)
           .kill_on_drop(true);
        
        #[cfg(target_os = "windows")]
        cmd.raw_arg("--hide-console"); // We can't easily do creation_flags without messing imports, tectonic doesn't pop console normally anyway, or we rely on Tauri v2 running it hidden.

        match cmd.output().await {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                let mut logs = stdout;
                if !stderr.is_empty() {
                    if !logs.is_empty() { logs.push_str("\n"); }
                    logs.push_str(&stderr);
                }
                (output.status.success(), logs)
            }
            Err(e) => (false, format!("Erreur lors du lancement de Tectonic : {}", e)),
        }
    } else {
        let mut cmd = Command::new("latexmk");
        cmd.arg("-pdf")
           .arg("-synctex=1")
           .arg("-interaction=nonstopmode")
           .arg("-cd")
           .arg(&main_file)
           .current_dir(&project_path)
           .kill_on_drop(true);

        match cmd.output().await {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout).to_string();
                let stderr = String::from_utf8_lossy(&output.stderr).to_string();
                let mut logs = stdout;
                if !stderr.is_empty() {
                    if !logs.is_empty() { logs.push_str("\n"); }
                    logs.push_str(&stderr);
                }
                (output.status.success(), logs)
            }
            Err(e) => (false, format!("Erreur lors du lancement de latexmk : {}", e)),
        }
    };

    let status_str = if success { "success" } else { "error" };
    let _ = handle.emit("compile-status", CompilePayload {
        status: status_str.to_string(),
        logs,
    });

    if !success && engine != "tectonic" {
        let mut cmd = Command::new("latexmk");
        cmd.arg("-c")
           .arg(&main_file)
           .current_dir(&project_path)
           .kill_on_drop(true);
        let _ = cmd.status().await;

        let fdb_path = target.with_extension("fdb_latexmk");
        if fdb_path.exists() { let _ = std::fs::remove_file(fdb_path); }
    }

    sleep(Duration::from_millis(500)).await;

    let pdf_path = target.with_extension("pdf");
    if pdf_path.exists() && pdf_viewer_mode == "system" {
        open_system_pdf(&pdf_path);
    }
}

fn open_system_pdf(pdf_path: &Path) {
    #[cfg(target_os = "macos")]
    {
        let has_skim = Path::new("/Applications/Skim.app").exists() || {
            let output = std::process::Command::new("osascript")
                .arg("-e")
                .arg("id of application \"Skim\"")
                .output();
            output.is_ok() && output.unwrap().status.success()
        };
        if has_skim {
            let _ = std::process::Command::new("open")
                .arg("-g")
                .arg("-a")
                .arg("Skim")
                .arg(pdf_path)
                .spawn();
        } else {
            let _ = std::process::Command::new("open")
                .arg(pdf_path)
                .spawn();
        }
    }

    #[cfg(target_os = "windows")]
    {
        let sumatra_paths = vec![
            "C:\\Program Files\\SumatraPDF\\SumatraPDF.exe",
            "C:\\Program Files (x86)\\SumatraPDF\\SumatraPDF.exe",
            "C:\\Users\\Default\\AppData\\Local\\SumatraPDF\\SumatraPDF.exe",
        ];
        
        let mut sumatra_exe = None;
        for path in sumatra_paths {
            if Path::new(path).exists() {
                sumatra_exe = Some(path.to_string());
                break;
            }
        }

        if let Some(exe) = sumatra_exe {
            let _ = std::process::Command::new(exe)
                .arg(pdf_path)
                .spawn();
        } else {
            let mut cmd = std::process::Command::new("cmd");
            cmd.args(&["/C", "start", "", &pdf_path.to_string_lossy()]);
            #[cfg(target_os = "windows")]
            {
                use std::os::windows::process::CommandExt;
                cmd.creation_flags(0x08000000);
            }
            let _ = cmd.spawn();
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows")))]
    {
        let _ = std::process::Command::new("xdg-open")
            .arg(pdf_path)
            .spawn();
    }
}
