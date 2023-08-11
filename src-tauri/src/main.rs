// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::process::{Command, Stdio};
use log::{info, error};

fn main() {
    // Initialize the logger
    simple_logger::init().unwrap();

    info!("Starting the Tauri app...");

    tauri::Builder::default()
        .setup(|app| {
            // Use Tauri's API to resolve the path to the bundled express-server directory
            let express_server_path = app.path_resolver()
                .resolve_resource("./../express-server")
                .expect("Failed to resolve express-server path in resources");
            
            info!("Resolved Express server path: {:?}", express_server_path);

            // Start the Express server
            let child = Command::new("node")
                .arg("index.js")
                .current_dir(&express_server_path) // Set the current directory
                .stdout(Stdio::inherit()) // Optional: To see the Express server logs in the Tauri console
                .spawn();

            match child {
                Ok(_) => info!("Express server started successfully."),
                Err(e) => error!("Failed to start Express server: {:?}", e),
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
