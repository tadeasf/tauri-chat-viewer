/** @format */

import { makeAutoObservable } from "mobx";

class CollectionStore {
	// State Variables
	isPhotoAvailable = false;
	collections = [];
	collectionName = "";
	isLoading = false;
	currentCollectionName = ""; // Current collection name
	newCollectionName = ""; // New collection name input by the user

	constructor() {
		makeAutoObservable(this);
	}

	/* FUNCTION DECLARATIONS BBY */

	// Setters for currentCollectionName and newCollectionName
	setCurrentCollectionName(name) {
		this.currentCollectionName = name;
	}

	setNewCollectionName(name) {
		this.newCollectionName = name;
	}

	handleRename = async () => {
		this.isLoading = true;

		// Validate the new collection name for MongoDB naming convention
		if (
			!this.newCollectionName ||
			!/^[a-zA-Z0-9_]+$/.test(this.newCollectionName)
		) {
			alert("Invalid collection name");
			this.isLoading = false;
			return;
		}

		try {
			const response = await fetch(
				`https://secondary.dev.tadeasfort.com/rename/${this.currentCollectionName}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ newCollectionName: this.newCollectionName }),
				}
			);

			let data;
			try {
				data = await response.json();
			} catch (error) {
				console.error("Failed to parse JSON:", error);
				// Handle the error (e.g., show a message to the user)
				return;
			}

			if (response.ok) {
				this.currentCollectionName = this.newCollectionName;
				window.location.reload(false); // Refresh the page
			} else {
				console.error(data.message);
				alert(data.message);
			}
			if (!response.ok) {
				console.error(data.message);
				console.log("Raw response: ", await response.text());
			}
		} catch (error) {
			console.error(error);
			alert(error.message);
		} finally {
			this.isLoading = false;
		}
	};

	// openDeleteDialog() {
	//   // Logic to open the delete confirmation dialog
	// }
	// // Delete the profile picture of the current collection
	// async handleDeletePhoto() {
	//   try {
	//     const response = await fetch(
	//       `https://secondary.dev.tadeasfort.com/delete/photo/${collectionName}`,
	//       {
	//         method: "DELETE",
	//       }
	//     );

	//     const data = await response.json();

	//     if (response.ok) {
	//       // Update the UI to reflect the deletion
	//       this.isPhotoAvailable = false;
	//       alert("Photo deleted successfully");
	//     } else {
	//       console.error(data.message);
	//       alert(data.message);
	//     }
	//   } catch (error) {
	//     console.error(error);
	//     alert("Error deleting photo:", error.message);
	//   }
	// }
}

const collectionStore = new CollectionStore();
export default collectionStore;
