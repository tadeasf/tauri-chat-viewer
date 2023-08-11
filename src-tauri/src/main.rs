// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use log::info;

fn main() {
    // Initialize the logger
    simple_logger::init().unwrap();

    info!("Starting the Tauri app...");

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
