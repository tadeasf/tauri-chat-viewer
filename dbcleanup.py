from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()
uri = os.getenv("MONGO_URI")

# Connect to MongoDB
client = MongoClient(uri)

# Accessing the kocouratciMessenger database
messages = client.messages
message_backup = client.message_backup
user_input_db = input("Do you want to copy and delete collections from 'messages' or 'message_backup' database?: ").strip().lower()
if user_input_db == 'messages':
    src_db = messages
    target_db = message_backup
elif user_input_db == 'message_backup':
    src_db = message_backup
    target_db = messages

def copy_and_delete_collection(collection_name):
    """
    Copies a collection to the target database, including its indexes,
    and then deletes it from the source database in a more efficient batch process.
    """
    src_collection = src_db[collection_name]
    target_collection = target_db[collection_name]

    # Fetching all documents from the source collection
    documents = list(src_collection.find())

    if documents:
        # Inserting documents in batches to the target collection
        target_collection.insert_many(documents)

    # Copying indexes from the source collection to the target collection
    # for index in src_collection.list_indexes():
    #     # Skip the _id index
    #     if index['name'] == '_id_':
    #         continue

        # # Reformat index keys from index['key'] (a dict) to the format expected by create_index
        # keys = [(field, value) for field, value in index['key'].items()]

        # # Recreating the index in the target collection
        # # 'unique' field is conditionally included based on its presence
        # index_options = {'unique': index['unique']} if 'unique' in index else {}
        # target_collection.create_index(keys, **index_options)

    # Deleting the collection from the source database
    src_db.drop_collection(collection_name)
    print(f"Collection '{collection_name}' copied to 'message_backup' database with indexes and removed from 'messages'.")

def main():
    collections = src_db.list_collection_names()
    # # First, handle collections with "_" in their names automatically
    # for collection_name in collections:
    #     if "_" in collection_name:
    #         print(f"Automatically processing collection '{collection_name}' due to '_' in the name.")
    #         copy_and_delete_collection(collection_name)
    
    # Refresh the list of collections after automatic processing
    # remaining_collections = src_db.list_collection_names()
    # Sort the remaining collections alphabetically A-Z
    sorted_remaining_collections = sorted(collections)

    # Then, prompt for user input for the rest
    for collection_name in sorted_remaining_collections:
        user_input = input(f"Do you want to copy and delete the collection '{collection_name}'? (y/n): ").strip().lower()
        if user_input == 'y' or user_input == '':
            copy_and_delete_collection(collection_name)
        elif user_input == '§':
            print(f"Skipping collection '{collection_name}'.")
        else:
            print("Invalid input. Skipping this collection.")
    
    print("Operation completed.")

if __name__ == "__main__":
    main()
