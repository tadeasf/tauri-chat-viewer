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
        `https://backend.jevrej.cz/rename/${this.currentCollectionName}`,
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
}

const collectionStore = new CollectionStore();
export default collectionStore;
