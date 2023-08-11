// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::env;

fn main() {
    env::set_var("RUST_BACKTRACE", "full");
    // Run the Tauri app
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}