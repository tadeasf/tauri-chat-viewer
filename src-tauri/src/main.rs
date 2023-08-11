// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::process::{Command, Stdio};
use std::env;

fn main() {
    // Set the path to the express-server directory
    let express_server_path = env::current_dir().unwrap().join("/Users/tadeasfort/Documents/pythonJSprojects/gitHub/tauri-chat-viewer/express-server");

    // Start the Express server
    let _child = Command::new("node")
        .arg("index.js")
        .current_dir(express_server_path) // Set the current directory
        .stdout(Stdio::inherit()) // Optional: To see the Express server logs in the Tauri console
        .spawn()
        .expect("Failed to start Express server");

    // Run the Tauri app
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
