import re

with open("src-tauri/src/watcher.rs", "r") as f:
    code = f.read()

old_compile = """#[tauri::command]
pub fn compile_once(
    handle: AppHandle,
    project_path: String,
    main_file: String,
    pdf_viewer_mode: String,
    engine: String,
) -> std::result::Result<(), String> {
    run_build(&handle, &project_path, &main_file, &pdf_viewer_mode, &engine);
    Ok(())
}"""

new_compile = """#[tauri::command]
pub async fn compile_once(
    handle: AppHandle,
    project_path: String,
    main_file: String,
    pdf_viewer_mode: String,
    engine: String,
) -> std::result::Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        run_build(&handle, &project_path, &main_file, &pdf_viewer_mode, &engine);
    })
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}"""

code = code.replace(old_compile, new_compile)

with open("src-tauri/src/watcher.rs", "w") as f:
    f.write(code)


with open("src-tauri/src/project.rs", "r") as f:
    pcode = f.read()

old_inverse = """pub fn synctex_inverse_search(pdf_path: String, page: u32, x: f64, y: f64) -> Result<SynctexResult, String> {"""
new_inverse = """pub async fn synctex_inverse_search(pdf_path: String, page: u32, x: f64, y: f64) -> Result<SynctexResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        _synctex_inverse_search(pdf_path, page, x, y)
    }).await.map_err(|e| e.to_string())?
}

fn _synctex_inverse_search(pdf_path: String, page: u32, x: f64, y: f64) -> Result<SynctexResult, String> {"""

pcode = pcode.replace(old_inverse, new_inverse)

old_forward = """pub fn synctex_forward_search(pdf_path: String, line: u32, column: u32, tex_path: String) -> Result<SynctexForwardResult, String> {"""
new_forward = """pub async fn synctex_forward_search(pdf_path: String, line: u32, column: u32, tex_path: String) -> Result<SynctexForwardResult, String> {
    tauri::async_runtime::spawn_blocking(move || {
        _synctex_forward_search(pdf_path, line, column, tex_path)
    }).await.map_err(|e| e.to_string())?
}

fn _synctex_forward_search(pdf_path: String, line: u32, column: u32, tex_path: String) -> Result<SynctexForwardResult, String> {"""

pcode = pcode.replace(old_forward, new_forward)

with open("src-tauri/src/project.rs", "w") as f:
    f.write(pcode)

