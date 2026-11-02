use std::fs;
use std::io::Write;
use std::process::Command;
use tauri::Manager;
use tauri_plugin_opener::OpenerExt;

/// Возвращает список системных шрифтов
#[tauri::command]
fn get_system_fonts() -> Vec<String> {
    #[cfg(target_os = "windows")]
    {
        let output = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "Add-Type -AssemblyName System.Drawing; [System.Drawing.FontFamily]::Families | Select-Object -ExpandProperty Name"
            ])
            .output();

        if let Ok(out) = output {
            let raw = String::from_utf8_lossy(&out.stdout);
            let mut fonts: Vec<String> = raw
                .lines()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .collect();
            if !fonts.is_empty() {
                fonts.sort_unstable();
                fonts.dedup();
                return fonts;
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        let output = Command::new("fc-list")
            .arg(":spacing=proportional")
            .arg("--format=%{family}\n")
            .output()
            .or_else(|_| Command::new("fc-list").arg("--format=%{family}\n").output());

        if let Ok(out) = output {
            let raw = String::from_utf8_lossy(&out.stdout);
            let mut fonts: Vec<String> = raw
                .lines()
                .flat_map(|line| {
                    line.split(',')
                        .map(|s| s.trim().to_string())
                        .filter(|s| !s.is_empty())
                })
                .collect();
            if !fonts.is_empty() {
                fonts.sort_unstable();
                fonts.dedup();
                return fonts;
            }
        }
    }

    // Fallback if commands fail
    vec![
        "Arial".to_string(),
        "Georgia".to_string(),
        "Times New Roman".to_string(),
        "Courier New".to_string(),
        "Verdana".to_string(),
    ]
}

/// Сохраняет HTML во временный файл и открывает его в браузере по умолчанию.
/// Возвращает путь к временному файлу.
#[tauri::command]
async fn preview_html(app: tauri::AppHandle, html: String) -> Result<String, String> {
    // Получаем системную temp-директорию
    let mut tmp_path = std::env::temp_dir();
    tmp_path.push(format!(
        "powerweb_preview_{}_{}.html",
        std::process::id(),
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map_err(|e| e.to_string())?
            .as_nanos()
    ));

    fs::write(&tmp_path, html.as_bytes())
        .map_err(|e| format!("Не удалось записать файл превью: {}", e))?;

    let path_str = tmp_path.to_string_lossy().to_string();

    // Открываем файл через xdg-open (браузер по умолчанию)
    app.opener()
        .open_path(&path_str, None::<&str>)
        .map_err(|e| format!("Не удалось открыть превью: {}", e))?;

    Ok(path_str)
}

/// Создаёт ZIP-архив с файлами проекта и сохраняет по указанному пути.
/// Принимает: путь сохранения, HTML, CSS, JS-содержимое.
#[tauri::command]
async fn export_zip(
    save_path: String,
    html: String,
    css: String,
    js: String,
    project_name: String,
) -> Result<(), String> {
    let _ = project_name;
    let file =
        fs::File::create(&save_path).map_err(|e| format!("Не удалось создать файл: {}", e))?;

    let mut zip = zip::ZipWriter::new(file);

    let options = zip::write::SimpleFileOptions::default()
        .compression_method(zip::CompressionMethod::Deflated)
        .unix_permissions(0o644);

    // index.html
    zip.start_file("index.html", options)
        .map_err(|e| format!("ZIP ошибка: {}", e))?;
    zip.write_all(html.as_bytes())
        .map_err(|e| format!("ZIP write ошибка: {}", e))?;

    // style.css (если есть)
    if !css.is_empty() {
        zip.start_file("style.css", options)
            .map_err(|e| format!("ZIP ошибка: {}", e))?;
        zip.write_all(css.as_bytes())
            .map_err(|e| format!("ZIP write ошибка: {}", e))?;
    }

    // app.js (если есть)
    if !js.is_empty() {
        zip.start_file("app.js", options)
            .map_err(|e| format!("ZIP ошибка: {}", e))?;
        zip.write_all(js.as_bytes())
            .map_err(|e| format!("ZIP write ошибка: {}", e))?;
    }

    zip.finish()
        .map_err(|e| format!("ZIP finish ошибка: {}", e))?;

    Ok(())
}

#[derive(serde::Serialize)]
struct ProjectArchiveEntry { path: String, data: String }

fn encode_base64(bytes: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::with_capacity((bytes.len() + 2) / 3 * 4);
    for chunk in bytes.chunks(3) {
        let a = chunk[0] as usize;
        let b = chunk.get(1).copied().unwrap_or(0) as usize;
        let c = chunk.get(2).copied().unwrap_or(0) as usize;
        result.push(TABLE[a >> 2] as char);
        result.push(TABLE[((a & 3) << 4) | (b >> 4)] as char);
        result.push(if chunk.len() > 1 { TABLE[((b & 15) << 2) | (c >> 6)] as char } else { '=' });
        result.push(if chunk.len() > 2 { TABLE[c & 63] as char } else { '=' });
    }
    result
}

#[tauri::command]
fn read_project_archive(path: String) -> Result<Vec<ProjectArchiveEntry>, String> {
    use std::io::Read;
    let file = fs::File::open(path).map_err(|error| error.to_string())?;
    let mut zip = zip::ZipArchive::new(file).map_err(|error| error.to_string())?;
    if zip.len() > 20000 { return Err("Слишком много файлов в PWB".into()); }
    let mut result = Vec::new();
    let mut paths = std::collections::HashSet::new();
    let mut total: u64 = 0;
    for index in 0..zip.len() {
        let mut entry = zip.by_index(index).map_err(|error| error.to_string())?;
        if entry.enclosed_name().is_none() { return Err("Недопустимый путь в PWB".into()); }
        total = total.checked_add(entry.size()).ok_or("Некорректный размер PWB")?;
        if total > 1024 * 1024 * 1024 { return Err("Распакованный PWB превышает 1 ГБ".into()); }
        let path = entry.name().to_string();
        if path.contains('\\') || !paths.insert(path.clone()) { return Err("Недопустимый или повторяющийся путь в PWB".into()); }
        let size = entry.size();
        let mut bytes = Vec::new();
        entry.by_ref().take(size + 1).read_to_end(&mut bytes).map_err(|error| error.to_string())?;
        if bytes.len() as u64 != size { return Err("Повреждённый ресурс PWB".into()); }
        result.push(ProjectArchiveEntry { path, data: encode_base64(&bytes) });
    }
    Ok(result)
}

/// Открывает папку plugins в файловом менеджере
#[tauri::command]
async fn open_plugins_folder(app: tauri::AppHandle) -> Result<(), String> {
    let plugins_path = plugins_directory(&app)?;

    app.opener()
        .open_path(plugins_path.to_string_lossy().as_ref(), None::<&str>)
        .map_err(|e| format!("Не удалось открыть папку: {}", e))?;

    Ok(())
}

fn plugins_directory(app: &tauri::AppHandle) -> Result<std::path::PathBuf, String> {
    let path = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("plugins");
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    Ok(path)
}

#[derive(serde::Serialize)]
struct PluginSource {
    name: String,
    code: String,
}

#[tauri::command]
fn load_plugins(app: tauri::AppHandle) -> Result<Vec<PluginSource>, String> {
    let path = plugins_directory(&app)?;
    // User plugins override bundled plugins of the same name.
    let mut plugins = std::collections::BTreeMap::<String, String>::new();
    let resource = app
        .path()
        .resource_dir()
        .map_err(|e| e.to_string())?
        .join("plugins");
    for directory in [resource, path] {
        if !directory.exists() {
            continue;
        }
        for entry in fs::read_dir(directory).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let file = entry.path();
            if file.is_file() && file.extension().and_then(|s| s.to_str()) == Some("js") {
                plugins.insert(
                    entry.file_name().to_string_lossy().to_string(),
                    fs::read_to_string(file).map_err(|e| e.to_string())?,
                );
            }
        }
    }
    Ok(plugins
        .into_iter()
        .map(|(name, code)| PluginSource { name, code })
        .collect())
}

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_system_fonts,
            preview_html,
            read_project_archive,
            export_zip,
            open_plugins_folder,
            load_plugins,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Read;

    #[test]
    fn zip_export_keeps_html_styles_and_script() {
        let dir = temp_dir::TempDir::new().unwrap();
        let path = dir.path().join("export.zip");
        let html = "<!DOCTYPE html><html><head><link rel=\"stylesheet\" href=\"style.css\"></head><body><script src=\"app.js\"></script></body></html>";
        tauri::async_runtime::block_on(export_zip(
            path.to_string_lossy().to_string(),
            html.into(),
            "body{color:red}".into(),
            "console.log('ok')".into(),
            "Test".into(),
        ))
        .unwrap();
        let mut archive = zip::ZipArchive::new(fs::File::open(path).unwrap()).unwrap();
        assert_eq!(archive.len(), 3);
        for (name, expected) in [
            ("index.html", html),
            ("style.css", "body{color:red}"),
            ("app.js", "console.log('ok')"),
        ] {
            let mut content = String::new();
            archive
                .by_name(name)
                .unwrap()
                .read_to_string(&mut content)
                .unwrap();
            assert_eq!(content, expected);
        }
    }

    #[test]
    fn zip_export_returns_error_for_missing_parent_directory() {
        let dir = temp_dir::TempDir::new().unwrap();
        let path = dir.path().join("missing").join("export.zip");
        let result = tauri::async_runtime::block_on(export_zip(
            path.to_string_lossy().to_string(),
            String::new(),
            String::new(),
            String::new(),
            String::new(),
        ));
        assert!(result.is_err());
    }
}
