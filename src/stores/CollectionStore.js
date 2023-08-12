/** @format */

// src/stores/CollectionStore.js

import { makeAutoObservable } from "mobx";
import MessageStore from "./MessageStore";

class CollectionStore {
  // State Variables
  isPhotoAvailable = false;
  collections = [];
  collectionName = "";
  isLoading = false;

  constructor() {
    makeAutoObservable(this);
  }

  /* FUNCTION DECLARATIONS BBY */

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

  async refresh() {
    // Check if there's no collection and no uploaded messages
    if (!this.collectionName && MessageStore.uploadedMessages.length === 0) {
      console.warn(
        "No collection selected and no messages uploaded. Cannot refresh."
      );
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    MessageStore.page = 1;
    MessageStore.debouncedSearchTerm = "";
    MessageStore.contentSearchIndex = -1;
    MessageStore.searchContent = "";
    MessageStore.highlightedMessageIndex = -1;
    MessageStore.currentResultIndex = 0;
    MessageStore.numberOfResultsContent = 0;
    MessageStore.scrollToIndex = -1;
    MessageStore.numberOfResults = 0;
    MessageStore.firstPress = true;
    MessageStore.currentResultIndex = 0;
    MessageStore.scrollToTop();

    if (uploadedMessages.length > 0) {
      MessageStore.filteredMessages = uploadedMessages;
      MessageStore.numberOfResults = uploadedMessages.length;
      MessageStore.searchTerm = "";
      this.isLoading = false;
    } else if (collectionName) {
      await MessageStore.handleSend(collectionName);
      this.isLoading = false;
    } else {
      this.isLoading = false;
    }
  }

  async hardReset() {
    this.isLoading = true;

    // Reset states related to pagination, search, and UI behavior
    MessageStore.page = 1;
    MessageStore.debouncedSearchTerm = "";
    MessageStore.contentSearchIndex = -1;
    MessageStore.searchContent = "";
    MessageStore.highlightedMessageIndex = -1;
    MessageStore.currentResultIndex = 0;
    MessageStore.numberOfResultsContent = 0;
    MessageStore.scrollToIndex = -1;
    MessageStore.numberOfResults = 0;
    MessageStore.firstPress = true;
    MessageStore.currentResultIndex = 0;
    MessageStore.scrollToTop();

    // Reset collection and user
    this.collectionName = "";
    MessageStore.user = "";

    // Reset messages
    MessageStore.filteredMessages = []; // Clear the displayed messages
    MessageStore.uploadedMessages = []; // Clear the uploaded messages cache

    this.isLoading = false;
  }

  async handleDelete(collectionName) {
    this.isLoading = true;

    try {
      const response = await fetch(
        `https://server.kocouratko.eu/delete/${collectionName}`,
        { method: "DELETE" }
      );

      const responseData = await response.json();

      if (response.status === 200) {
        // Use response.status instead of response
        this.collections = this.collections.filter(
          (col) => col.value !== collectionName
        );

        alert(
          `Collection deleted successfully!\nCollection name: ${responseData.collectionName}`
        );
      } else {
        console.error("Error deleting collection");
        alert(`${responseData.message}`);
      }
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  async refreshCollections() {
    try {
      const response = await fetch("https://server.kocouratko.eu/collections");
      if (response.ok) {
        const data = await response.json();
        this.collections = data;
      } else {
        console.error("Error fetching collections");
      }
    } catch (error) {
      console.error(error);
    }
  }

  async uploadFile(files) {
    if (!files || files.length === 0) {
      return;
    }

    this.isLoading = true;

    try {
      const formData = new FormData();

      // Loop through the files and append them to the FormData
      for (let i = 0; i < files.length; i++) {
        formData.append("files", files[i]);
      }

      const response = await fetch("https://server.kocouratko.eu/upload", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (response.status === 200) {
        // Fix the typo here
        alert(
          `Files uploaded successfully!\nCollection name: ${responseData.collectionName}\nMessage count: ${responseData.messageCount}`
        );

        // Refresh collections after the files have been uploaded
        this.refreshCollections();
      } else if (response.status === 409) {
        alert(responseData.message);
      } else {
        alert(`Error uploading files: ${responseData.message}`);
      }
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      this.isLoading = false;
    }
  }

  async handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await fetch(
        `https://server.kocouratko.eu/upload/photo/${this.collectionName}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (data.message === "Photo uploaded successfully") {
        this.isPhotoAvailable = true;
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
  }
}

const collectionStore = new CollectionStore();
export default collectionStore;
