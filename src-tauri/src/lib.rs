use std::fs;
use std::io::Write;
use std::process::Command;
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
            .or_else(|_| {
                Command::new("fc-list")
                    .arg("--format=%{family}\n")
                    .output()
            });

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
    tmp_path.push("powerweb_preview.html");

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
    _project_name: String,
) -> Result<(), String> {
    let file = fs::File::create(&save_path)
        .map_err(|e| format!("Не удалось создать файл: {}", e))?;

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

/// Открывает папку plugins в файловом менеджере
#[tauri::command]
async fn open_plugins_folder(app: tauri::AppHandle) -> Result<(), String> {
    // Пучаем путь к папке plugins рядом с исполняемым файлом
    let exe_dir = std::env::current_dir()
        .map_err(|e| format!("Не удалось получить текущую директорию: {}", e))?;
    let plugins_path = exe_dir.join("plugins");

    // Создаём папку если не существует
    if !plugins_path.exists() {
        fs::create_dir_all(&plugins_path)
            .map_err(|e| format!("Не удалось создать папку plugins: {}", e))?;
    }

    app.opener()
        .open_path(plugins_path.to_string_lossy().as_ref(), None::<&str>)
        .map_err(|e| format!("Не удалось открыть папку: {}", e))?;

    Ok(())
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
            export_zip,
            open_plugins_folder,
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
