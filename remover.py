import os
import shutil


def remove_specific_dirs(root_dir, dir_names_to_remove):
    for root, dirs, files in os.walk(root_dir):
        for dir_name in dirs:
            if dir_name.lower() in dir_names_to_remove:
                dir_path = os.path.join(root, dir_name)
                try:
                    shutil.rmtree(dir_path)
                    print(f"Successfully removed: {dir_path}")
                except Exception as e:
                    print(f"Error while removing {dir_path}: {e}")


if __name__ == "__main__":
    root_directory = "/Users/tadeasfort/Desktop/inbox"
    dir_names = {"videos", "audio", "files"}
    remove_specific_dirs(root_directory, dir_names)

# Example usage
# root_directory = "/path/to/your/root/directory"
# dir_names = {"videos", "audio", "files"}
# remove_specific_dirs(root_directory, dir_names)
