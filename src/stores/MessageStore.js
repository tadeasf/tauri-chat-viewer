/** @format */

// src/stores/MessageStore.js

import { makeAutoObservable } from "mobx";

class MessageStore {
  // State Variables
  author = "";
  user = "";
  filteredMessages = [];
  page = 1;
  searchTerm = "";
  uploadedMessages = [];
  debouncedSearchTerm = "";
  numberOfResults = 0;
  contentSearchIndex = -1;
  searchContent = "";
  highlightedMessageIndex = -1;
  numberOfResultsContent = 0;
  currentResultIndex = 0;
  firstPress = true;
  scrollToIndex = -1;

  constructor() {
    makeAutoObservable(this);
  }

  // Scroll to the top of the message list
  scrollToTop() {
    this.contentSearchIndex = 0;
    this.scrollToIndex = 0;
    this.highlightedMessageIndex = -1;
  }

  // Handle key presses when searching for content
  handleContentKeyPress(e) {
    if (e.key === "Enter") {
      if (this.firstPress) {
        this.scrollToContent(this.searchContent);
        this.firstPress = false;
      } else {
        this.scrollToContent(this.searchContent);
        this.currentResultIndex =
          this.currentResultIndex + 1 < this.numberOfResultsContent
            ? this.currentResultIndex + 1
            : 0;
      }
    }
  }

  // Remove diacritics from a string
  removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // Scroll to a specific content in the message list
  scrollToContent(content) {
    const normalizedContent = this.removeDiacritics(content.toLowerCase());
    let messageIndex = -1;

    for (let i = 1; i <= this.uploadedMessages.length; i++) {
      const currentIndex =
        (this.contentSearchIndex + i) % this.uploadedMessages.length;
      const currentMessage = this.uploadedMessages[currentIndex];

      if (!currentMessage.content) {
        continue;
      }

      const normalizedMessageContent = this.removeDiacritics(
        currentMessage.content.toLowerCase()
      );

      if (normalizedMessageContent.includes(normalizedContent)) {
        messageIndex = currentIndex;
        break;
      }
    }

    if (messageIndex !== -1) {
      this.contentSearchIndex = messageIndex;
      this.scrollToIndex = messageIndex;
      this.highlightedMessageIndex = messageIndex;
    } else {
      console.error("No more messages with the given content found.");
    }
  }

  // Get the height of a row
  getRowHeight(index) {
    return this.rowHeights[index] || 110;
  }

  // Set the height of a row
  setRowHeight(index, size) {
    this.rowHeights = { ...this.rowHeights, [index]: size };
    // Additional logic for resetting after index...
  }

  // Send a message
  async handleSend(collectionName) {
    this.isLoading = true;
    this.user = null;

    try {
      const response = await fetch(
        `https://server.kocouratko.eu/messages/${collectionName}`
      );
      const data = await response.json();
      this.uploadedMessages = data.map((message) => ({ ...message }));

      if (!this.author || !this.user) {
        const uniqueSenders = [
          ...new Set(data.map((message) => message.sender_name)),
        ];
        uniqueSenders.forEach((sender) => {
          if (sender === "Tadeáš Fořt" || sender === "Tadeáš") {
            this.author = sender;
          } else {
            this.user = sender;
          }
        });
      }

      const photoResponse = await fetch(
        `https://server.kocouratko.eu/messages/${collectionName}/photo`
      );
      const photoData = await photoResponse.json();

      if (photoData && photoData.isPhotoAvailable) {
        this.isPhotoAvailable = true;
      } else {
        this.isPhotoAvailable = false;
      }

      this.isLoading = false;
    } catch (error) {
      console.error(error);
      this.isLoading = false;
    }
  }

  // Filter messages based on the search term
  filterMessagesBySearchTerm() {
    const normalizedSearchTerm = this.removeDiacritics(
      this.debouncedSearchTerm.toLowerCase()
    );
    const messagesPerPage = 150000;
    let messagesSorted = [...this.uploadedMessages];
    messagesSorted.sort((a, b) => b.timestamp - a.timestamp);

    let filteredMsgs =
      this.debouncedSearchTerm.length === 0
        ? messagesSorted
        : messagesSorted.filter((messageArray) => {
            if (!messageArray.content) return false;
            const normalizedContent = this.removeDiacritics(
              messageArray.content.toLowerCase()
            );
            return normalizedContent.includes(normalizedSearchTerm);
          });

    this.numberOfResults = filteredMsgs.length;
    filteredMsgs = filteredMsgs.slice(
      Math.max(this.page - 2, 0) * messagesPerPage,
      this.page * messagesPerPage
    );

    this.filteredMessages = filteredMsgs;
  }

  // Filter messages based on content
  filterMessagesByContent() {
    const normalizedSearchContent = this.removeDiacritics(
      this.searchContent.toLowerCase()
    );

    let filteredMsgsByContent =
      this.searchContent.length === 0
        ? this.uploadedMessages
        : this.uploadedMessages.filter((messageArray) => {
            if (!messageArray.content) return false;
            const normalizedContent = this.removeDiacritics(
              messageArray.content.toLowerCase()
            );
            return normalizedContent.includes(normalizedSearchContent);
          });

    this.numberOfResultsContent = filteredMsgsByContent.length;
  }
}

const messageStore = new MessageStore();
export default messageStore;
