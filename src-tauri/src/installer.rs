use std::env::consts::{ARCH, OS};
use std::fs;
use std::io::Cursor;
use tauri::AppHandle;
use tauri::Manager;
use zip::ZipArchive;
use tar::Archive;
use flate2::read::GzDecoder;

#[tauri::command]
pub async fn download_tectonic(app: AppHandle) -> Result<String, String> {
    let version = "0.17.0"; // latest tectonic version
    
    // Determine platform suffix
    let suffix = match (OS, ARCH) {
        ("windows", "x86_64") => "x86_64-pc-windows-msvc.zip",
        ("windows", "aarch64") => "aarch64-pc-windows-msvc.zip", // Not officially there, but just in case
        ("macos", "x86_64") => "x86_64-apple-darwin.tar.gz",
        ("macos", "aarch64") => "aarch64-apple-darwin.tar.gz",
        ("linux", "x86_64") => "x86_64-unknown-linux-gnu.tar.gz",
        ("linux", "aarch64") => "aarch64-unknown-linux-musl.tar.gz",
        _ => return Err(format!("Unsupported platform: {}-{}", OS, ARCH)),
    };

    let url = format!("https://github.com/tectonic-typesetting/tectonic/releases/download/tectonic%40{version}/tectonic-{version}-{suffix}");
    
    // Determine destination dir
    let app_data_dir = app.path().app_data_dir().map_err(|e| format!("Failed to get app data dir: {}", e))?;
    fs::create_dir_all(&app_data_dir).map_err(|e| format!("Failed to create app data dir: {}", e))?;
    
    let dest_path = app_data_dir.join(if OS == "windows" { "tectonic.exe" } else { "tectonic" });
    
    if dest_path.exists() {
        return Ok(dest_path.to_string_lossy().to_string());
    }

    println!("Downloading Tectonic from {}...", url);
    let response = reqwest::get(&url).await.map_err(|e| format!("Network error: {}", e))?;
    
    if !response.status().is_success() {
        return Err(format!("Failed to download Tectonic: HTTP {}", response.status()));
    }

    let bytes = response.bytes().await.map_err(|e| format!("Failed to read bytes: {}", e))?;
    println!("Extracting...");
    
    // Extract
    if suffix.ends_with(".zip") {
        let mut archive = ZipArchive::new(Cursor::new(bytes)).map_err(|e| format!("Zip error: {}", e))?;
        for i in 0..archive.len() {
            let mut file = archive.by_index(i).map_err(|e| format!("Zip file error: {}", e))?;
            if file.name().contains("tectonic.exe") || file.name().ends_with("tectonic") {
                let mut outfile = fs::File::create(&dest_path).map_err(|e| format!("File creation error: {}", e))?;
                std::io::copy(&mut file, &mut outfile).map_err(|e| format!("Write error: {}", e))?;
                break;
            }
        }
    } else if suffix.ends_with(".tar.gz") {
        let tar = GzDecoder::new(Cursor::new(bytes));
        let mut archive = Archive::new(tar);
        for entry_res in archive.entries().map_err(|e| format!("Tar error: {}", e))? {
            let mut file = entry_res.map_err(|e| format!("Tar file error: {}", e))?;
            let path = file.path().map_err(|e| format!("Tar path error: {}", e))?;
            if path.to_string_lossy().contains("tectonic") {
                let mut outfile = fs::File::create(&dest_path).map_err(|e| format!("File creation error: {}", e))?;
                std::io::copy(&mut file, &mut outfile).map_err(|e| format!("Write error: {}", e))?;
                
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    if let Ok(metadata) = fs::metadata(&dest_path) {
                        let mut perms = metadata.permissions();
                        perms.set_mode(0o755);
                        let _ = fs::set_permissions(&dest_path, perms);
                    }
                }
                break;
            }
        }
    }
    
    println!("Successfully installed Tectonic to {:?}", dest_path);
    Ok(dest_path.to_string_lossy().to_string())
}
