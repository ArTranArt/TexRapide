use std::process::Command;

#[tauri::command]
pub fn download_and_run_windows_installers() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        // 1. Ouvrir la page de téléchargement de MiKTeX
        let _ = Command::new("cmd")
            .args(["/C", "start", "https://miktex.org/download"])
            .spawn()
            .map_err(|e| e.to_string())?;

        // 2. Ouvrir la page de téléchargement de Strawberry Perl
        let _ = Command::new("cmd")
            .args(["/C", "start", "https://strawberryperl.com/"])
            .spawn()
            .map_err(|e| e.to_string())?;

        // 3. Ouvrir la page de téléchargement de SumatraPDF
        let _ = Command::new("cmd")
            .args(["/C", "start", "https://www.sumatrapdfreader.org/download-free-pdf-viewer"])
            .spawn()
            .map_err(|e| e.to_string())?;

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Cette fonctionnalité n'est disponible que sur Windows.".into())
    }
}
