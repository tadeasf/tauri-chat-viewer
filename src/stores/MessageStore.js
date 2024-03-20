/** @format */

// src/stores/MessageStore.js

import { makeAutoObservable, reaction } from "mobx";

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
  crossCollectionMessages = [];
  isPhotoAvailable = false;

  constructor() {
    makeAutoObservable(this);

    // Add this reaction to reset firstPress when searchContent changes
    reaction(
      () => this.searchContent,
      () => {
        this.firstPress = true;
      }
    );
  }

  // Scroll to the top of the message list
  scrollToTop() {
    this.contentSearchIndex = 0;
    this.scrollToIndex = 0;
    this.highlightedMessageIndex = -1;
  }

  setCrossCollectionMessages(messages) {
    this.crossCollectionMessages = messages;
  }

  // Handle key presses when searching for content
  handleContentKeyPress = (e) => {
    if (e.key === "Enter") {
      this.setCrossCollectionMessages([]); // Reset cross-collection messages
      if (e.shiftKey) {
        // If shift is held down, scroll to the previous result
        this.currentResultIndex =
          this.currentResultIndex - 1 >= 0
            ? this.currentResultIndex - 1
            : this.numberOfResultsContent - 1; // Wrap to the last index if going below 0
        this.scrollToContent(this.searchContent, this.currentResultIndex);
      } else {
        // Regular behavior for Enter without shift
        if (this.firstPress) {
          this.scrollToContent(this.searchContent);
          this.firstPress = false;
        } else {
          this.currentResultIndex =
            this.currentResultIndex + 1 < this.numberOfResultsContent
              ? this.currentResultIndex + 1
              : 0; // Wrap to 0 if exceeding the number of results
          this.scrollToContent(this.searchContent, this.currentResultIndex);
        }
      }
    }
  };

  // Remove diacritics from a string
  removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // Scroll to a specific content in the message list
  scrollToContent = (content) => {
    const normalizedContent = this.removeDiacritics(content.toLowerCase());
    let messageIndex = -1;

    for (let i = 1; i <= this.uploadedMessages.length; i++) {
      const currentIndex =
        (this.contentSearchIndex + i) % this.uploadedMessages.length;
      const currentMessage = this.uploadedMessages[currentIndex];

      const normalizedMessageContent = currentMessage.content
        ? this.removeDiacritics(currentMessage.content.toLowerCase())
        : "";

      // Check for the "photo" keyword but exclude messages from "Tadeáš Fořt"
      if (
        (normalizedMessageContent.includes(normalizedContent) ||
          (normalizedContent === "photo" && currentMessage.photos)) &&
        currentMessage.sender_name !== "Tadeáš Fořt" // Exclude Tadeáš Fořt's messages for "photo"
      ) {
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
  };

  async handleSend(collectionName, fromDate = null, toDate = null) {
    this.isLoading = true;
    this.user = null;
    this.setCrossCollectionMessages([]);

    let apiUrl = `https://secondary.dev.tadeasfort.com/messages/${collectionName}`;
    if (fromDate || toDate) {
      const queryParams = new URLSearchParams();
      if (fromDate) queryParams.append("fromDate", fromDate);
      if (toDate) queryParams.append("toDate", toDate);
      apiUrl += `?${queryParams.toString()}`;
    }
    console.log("Fetching from URL:", apiUrl);
    try {
      const response = await fetch(apiUrl);
      console.log(collectionName);
      const data = await response.json();
      this.uploadedMessages = data.map((message) => ({
        ...message,
        collectionName, // Add the collection name to each message
      }));

      if (!this.author || !this.user) {
        const uniqueSenders = [
          ...new Set(data.map((message) => message.sender_name)),
        ];
        const authorRegex = /tade/i; // Case-insensitive regex to match any form containing "tade"

        uniqueSenders.forEach((sender) => {
          if (authorRegex.test(sender)) {
            this.author = sender;
          } else {
            this.user = sender;
          }
        });
      }

      const photoResponse = await fetch(
        `https://secondary.dev.tadeasfort.com/messages/${collectionName}/photo`
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
    const messagesPerPage = 500000;
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

    let filteredMsgsByContent = this.uploadedMessages.filter((messageArray) => {
      if (
        normalizedSearchContent === "photo" &&
        messageArray.sender_name !== "Tadeáš Fořt"
      ) {
        return messageArray.photos;
      }
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
