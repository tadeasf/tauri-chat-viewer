/** @format */

// src/stores/CollectionStore.js

import { makeAutoObservable } from "mobx";

class CollectionStore {
  // State Variables
  isPhotoAvailable = false;
  collections = [];
  collectionName = "";

  constructor() {
    makeAutoObservable(this);
  }
  async renameCollection() {
    this.isLoading = true;

    try {
      const response = await fetch(`/rename/${this.currentCollectionName}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ newCollectionName: this.newCollectionName }),
      });

      const data = await response.json();

      if (response.ok) {
        this.currentCollectionName = this.newCollectionName;
        window.location.reload(false); // Refresh the page
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  // Delete the profile picture of the current collection
  async deleteProfilePicture() {
    this.isLoading = true;

    try {
      const response = await fetch(
        `/delete/photo/${this.currentCollectionName}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error(data.message);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }
}

const collectionStore = new CollectionStore();
export default collectionStore;
