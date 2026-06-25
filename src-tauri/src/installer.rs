use std::process::Command;

#[tauri::command]
pub fn download_and_run_windows_installers() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let ps_script = r#"
            $downloads = Join-Path $env:USERPROFILE "Downloads"
            $miktex = Join-Path $downloads "miktex-installer.exe"
            $perl = Join-Path $downloads "strawberry-perl.msi"
            $sumatra = Join-Path $downloads "sumatrapdf-installer.exe"

            # Téléchargement et lancement de MiKTeX
            if (-not (Test-Path $miktex)) {
                Invoke-WebRequest -Uri "https://miktex.org/download/ctan/systems/win32/miktex/setup/windows-x64/basic-miktex-24.4-x64.exe" -OutFile $miktex
            }
            Start-Process -FilePath $miktex

            # Téléchargement et lancement de Strawberry Perl
            if (-not (Test-Path $perl)) {
                Invoke-WebRequest -Uri "https://github.com/StrawberryPerl/Perl-Dist-Strawberry/releases/download/SP_53822_64bit_UCRT/strawberry-perl-5.38.2.2-64bit.msi" -OutFile $perl
            }
            Start-Process -FilePath $perl

            # Téléchargement et lancement de SumatraPDF
            if (-not (Test-Path $sumatra)) {
                Invoke-WebRequest -Uri "https://www.sumatrapdfreader.org/dl/SumatraPDF-3.5.2-64-install.exe" -OutFile $sumatra
            }
            Start-Process -FilePath $sumatra
        "#;

        Command::new("powershell")
            .args(["-NoProfile", "-WindowStyle", "Hidden", "-Command", ps_script])
            .spawn()
            .map_err(|e| format!("Erreur lors du lancement du script: {}", e))?;

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Cette fonctionnalité n'est disponible que sur Windows.".into())
    }
}
