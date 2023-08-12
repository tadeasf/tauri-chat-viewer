/**
 * This file is part of Kocouřátčí Messenger.
 *
 * Kocouřátčí Messenger is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Kocouřátčí Messenger is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Kocouřátčí Messenger. If not, see <https://www.gnu.org/licenses/>.
 *
 * @format
 */

import { useState, useEffect, useRef, useContext } from "react";
import Message from "./components/ui/Message";
import { ErrorBoundary } from "react-error-boundary";
import { ModeToggle } from "./components/ModeToggle";
import { storesContext } from "./stores/storesContext";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { ThemeProvider } from "./components/theme-provider";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";

function App() {
  const [author, setAuthor] = useState("");
  const [user, setUser] = useState("");
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadedMessages, setUploadedMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const chatBodyRef = useRef();
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [collections, setCollections] = useState([]);
  const [numberOfResults, setNumberOfResults] = useState(0);
  const listRef = useRef(); // Add this ref
  const rowHeights = useRef({}); // Add this ref
  const [scrollToIndex, setScrollToIndex] = useState(-1);
  const [contentSearchIndex, setContentSearchIndex] = useState(-1);
  const [searchContent, setSearchContent] = useState("");
  const [highlightedMessageIndex, setHighlightedMessageIndex] = useState(-1);
  const [numberOfResultsContent, setNumberOfResultsContent] = useState(0);
  const [currentResultIndex, setCurrentResultIndex] = useState(0);
  const [firstPress, setFirstPress] = useState(true);
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [isPhotoAvailable, setIsPhotoAvailable] = useState(false);
  const isPhotoAvailableRef = useRef(false);
  const { UserStore, ThemeStore } = useContext(storesContext);
  const scrollToTop = () => {
    setContentSearchIndex(0);
    setScrollToIndex(0);
    setHighlightedMessageIndex(-1);
  };

  const handleOnSelect = async (value) => {
    await hardReset();
    setCollectionName(value);
    handleSend(value);
  };

  const handleContentKeyPress = (e) => {
    if (e.key === "Enter") {
      if (firstPress) {
        scrollToContent(searchContent);
        setFirstPress(false);
      } else {
        scrollToContent(searchContent);
        // Increment the current result index
        setCurrentResultIndex((prevIndex) =>
          prevIndex + 1 < numberOfResultsContent ? prevIndex + 1 : 0
        );
      }
    }
  };

  const removeDiacritics = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const scrollToContent = (content) => {
    const normalizedContent = removeDiacritics(content.toLowerCase());
    console.log("Searching for:", normalizedContent);
    let messageIndex = -1;

    for (let i = 1; i <= uploadedMessages.length; i++) {
      const currentIndex = (contentSearchIndex + i) % uploadedMessages.length;
      const currentMessage = uploadedMessages[currentIndex];

      if (!currentMessage.content) {
        continue;
      }

      const normalizedMessageContent = removeDiacritics(
        currentMessage.content.toLowerCase()
      );
      console.log("Checking message:", currentIndex, normalizedMessageContent);

      if (normalizedMessageContent.includes(normalizedContent)) {
        messageIndex = currentIndex;
        break;
      }
    }

    if (messageIndex !== -1) {
      console.log("Message found:", messageIndex);
      setContentSearchIndex(messageIndex);
      setScrollToIndex(messageIndex);
      setHighlightedMessageIndex(messageIndex);
    } else {
      console.error("No more messages with the given content found.");
    }
  };

  useEffect(() => {
    if (scrollToIndex !== -1 && listRef.current) {
      listRef.current.scrollToItem(scrollToIndex, "center");
      setScrollToIndex(-1);
    }
  }, [scrollToIndex]);

  function getRowHeight(index) {
    return rowHeights.current[index] || 110; // Add this function
  }
  const setRowHeight = (index, size) => {
    // Add this function
    listRef.current.resetAfterIndex(0);
    rowHeights.current = { ...rowHeights.current, [index]: size };
  };

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch(
          "https://server.kocouratko.eu/collections"
        );
        const data = await response.json();

        // Map the data to the required format
        const formattedCollections = data.map((collection) => ({
          value: collection,
          label: collection,
        }));

        setCollections(formattedCollections);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCollections();
  }, []);

  const handleSend = async (collectionName) => {
    setIsLoading(true);
    setUser(null);

    try {
      const response = await fetch(
        `https://server.kocouratko.eu/messages/${collectionName}`
      );
      const data = await response.json();

      const mappedMessages = data.map((message) => {
        return {
          ...message,
        };
      });

      // Cache the uploaded messages
      setUploadedMessages(mappedMessages);

      // Set the author and user states only if they are not already set
      if (!author || !user) {
        // Get the unique sender names from the data
        const uniqueSenders = [
          ...new Set(data.map((message) => message.sender_name)),
        ];

        uniqueSenders.forEach((sender) => {
          if (sender === "Tadeáš Fořt" || sender === "Tadeáš") {
            setAuthor(sender);
          } else {
            setUser(sender);
          }
        });
      }

      const photoResponse = await fetch(
        `https://server.kocouratko.eu/messages/${collectionName}/photo`
      );
      const photoData = await photoResponse.json();
      console.log("PHOTO DATA IS:", photoData);

      if (photoData && photoData.isPhotoAvailable) {
        setIsPhotoAvailable(true);
      } else {
        setIsPhotoAvailable(false);
      }

      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const normalizedSearchTerm = removeDiacritics(
      debouncedSearchTerm.toLowerCase()
    );
    const messagesPerPage = 150000;

    let messagesSorted = [...uploadedMessages];

    // Sort messages by timestamp in descending order
    messagesSorted.sort((a, b) => b.timestamp - a.timestamp);

    let filteredMsgs =
      debouncedSearchTerm.length === 0
        ? messagesSorted
        : messagesSorted.filter((messageArray) => {
            if (!messageArray.content) return false;
            const normalizedContent = removeDiacritics(
              messageArray.content.toLowerCase()
            );
            // Return true if normalizedContent includes the normalizedSearchTerm
            return normalizedContent.includes(normalizedSearchTerm);
          });
    // Update numberOfResults
    setNumberOfResults(filteredMsgs.length);
    // Slice messages array for pagination
    filteredMsgs = filteredMsgs.slice(
      Math.max(page - 2, 0) * messagesPerPage,
      page * messagesPerPage
    );

    setFilteredMessages(filteredMsgs);
  }, [debouncedSearchTerm, uploadedMessages, page]);

  const refresh = async () => {
    // Check if there's no collection and no uploaded messages
    if (!collectionName && uploadedMessages.length === 0) {
      console.warn(
        "No collection selected and no messages uploaded. Cannot refresh."
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true); // Set isLoading to true when refresh is triggered
    setPage(1);
    setDebouncedSearchTerm(""); // Reset the debounced search term
    setContentSearchIndex(-1);
    setSearchContent("");
    setHighlightedMessageIndex(-1);
    setCurrentResultIndex(0);
    setNumberOfResultsContent(0);
    setScrollToIndex(-1);
    setNumberOfResults(0);
    setFirstPress(true);
    setCurrentResultIndex(0);
    scrollToTop();

    if (uploadedMessages.length > 0) {
      setFilteredMessages(uploadedMessages);
      setNumberOfResults(uploadedMessages.length);
      setSearchTerm("");
      setIsLoading(false); // Set isLoading to false when the messages are updated
    } else if (collectionName) {
      await handleSend(collectionName);
      setIsLoading(false); // Set isLoading to false after handleSend is completed
    } else {
      setIsLoading(false); // Set isLoading to false if no messages and no collectionName
    }
  };

  const hardReset = async () => {
    setIsLoading(true);

    // Reset states related to pagination, search, and UI behavior
    setPage(1);
    setDebouncedSearchTerm("");
    setContentSearchIndex(-1);
    setSearchContent("");
    setHighlightedMessageIndex(-1);
    setCurrentResultIndex(0);
    setNumberOfResultsContent(0);
    setScrollToIndex(-1);
    setNumberOfResults(0);
    setFirstPress(true);
    setCurrentResultIndex(0);
    scrollToTop();

    // Reset collection and user
    setCollectionName(null);
    setUser(null);

    // Reset messages
    setFilteredMessages([]); // Clear the displayed messages
    setUploadedMessages([]); // Clear the uploaded messages cache

    setIsLoading(false);
  };

  const handleDelete = async (collectionName) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://server.kocouratko.eu/delete/${collectionName}`,
        { method: "DELETE" }
      );

      const responseData = await response.json();

      if (response.status === 200) {
        // Use response.status instead of response
        setCollections(
          collections.filter((col) => col.value !== collectionName)
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
      setIsLoading(false);
    }
  };

  const uploadFile = async (files) => {
    if (!files || files.length === 0) {
      return;
    }

    setIsLoading(true);

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
        refreshCollections();
      } else if (response.status === 409) {
        alert(responseData.message);
      } else {
        alert(`Error uploading files: ${responseData.message}`);
      }
    } catch (error) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to refresh collections
  const refreshCollections = async () => {
    try {
      const response = await fetch("https://server.kocouratko.eu/collections");
      if (response.ok) {
        const data = await response.json();
        setCollections(data);
      } else {
        console.error("Error fetching collections");
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    const normalizedSearchContent = removeDiacritics(
      searchContent.toLowerCase()
    );

    let filteredMsgsByContent =
      searchContent.length === 0
        ? uploadedMessages
        : uploadedMessages.filter((messageArray) => {
            if (!messageArray.content) return false;
            const normalizedContent = removeDiacritics(
              messageArray.content.toLowerCase()
            );
            return normalizedContent.includes(normalizedSearchContent);
          });

    setNumberOfResultsContent(filteredMsgsByContent.length);
  }, [searchContent, uploadedMessages]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const response = await fetch(
        `https://server.kocouratko.eu/upload/photo/${collectionName}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (data.message === "Photo uploaded successfully") {
        setIsPhotoAvailable(true);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
  };

  useEffect(() => {
    isPhotoAvailableRef.current = isPhotoAvailable;
  }, [isPhotoAvailable]);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="{ThemeStore.theme}" enableSystem={true}>
        <div className="font-anonymous box-border bg-background">
          <Card className="flex flex-col h-screen bg-background">
            <div className="w-full bg-background flex flex-wrap justify-center items-center mt-5 mb-5 gap-x-4 gap-y-4">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    {collectionName ? collectionName : "Select a collection"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" side="right" align="start">
                  <Command>
                    <CommandInput placeholder="Select collection..." />
                    <CommandList>
                      {collections.length === 0 && (
                        <CommandEmpty>No collections found.</CommandEmpty>
                      )}
                      <CommandGroup>
                        {collections.map((collection) => (
                          <CommandItem
                            key={collection.value}
                            onSelect={() => {
                              handleOnSelect(collection.value);
                              setOpen(false);
                            }}
                          >
                            {collection.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>

              <Input
                className="min-w-[10rem] max-w-[20rem] h-10"
                type="text"
                placeholder="Seach messages..."
                value={searchContent}
                onChange={(e) => setSearchContent(e.target.value)}
                onKeyDown={handleContentKeyPress}
              />
              <Badge
                variant="secondary"
                className="py-1 text-sm leading-tight mr-10 min-w-[9rem] max-w-[300px]"
              >
                {searchContent !== ""
                  ? `Found ${
                      currentResultIndex + 1
                    }/${numberOfResultsContent} of: ${searchContent}`
                  : `Total number of messages: ${numberOfResults}`}
              </Badge>
              <ModeToggle />
            </div>

            <Card className="w-full max-h-[85%] flex flex-col overflow-auto">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
                accept="image/*"
              />
              <div className="flex items-center justify-between p-1">
                <img
                  src={
                    isPhotoAvailable
                      ? `https://server.kocouratko.eu/serve/photo/${collectionName}`
                      : "https://placehold.co/1280x1280/black/white"
                  }
                  alt="user-profile"
                  className="h-20 w-20 object-cover ml-12 mr-10 mt-3 mb-3 rounded-full p-2 bg-secondary"
                  onClick={() => {
                    if (!isPhotoAvailable && collectionName) {
                      fileInputRef.current.click();
                    }
                  }}
                />

                <p className="text-2xl font text-popover-foreground hover:text-accent">
                  {user ? user : "Select a collection..."}
                </p>
                <div className="flex items-center justify-rnd p-1 space-x-5 mr-5">
                  <Button
                    onClick={refresh}
                    className="bg-secondary text-popover-foreground text-3xl rounded-full w-12 h-12 justify-center"
                  >
                    &#8635;
                  </Button>
                  <Button
                    onClick={hardReset}
                    className="bg-secondary text-destructive text-3xl rounded-full w-12 h-12 justify-center"
                  >
                    &#8635;
                  </Button>
                </div>
              </div>
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="w-full h-1 bg-red-b70 animate-pulse opacity-70 rounded-xl" />
                </div>
              ) : (
                <div
                  className="flex-grow overflow-auto flex flex-col gap-4 p-2"
                  ref={chatBodyRef}
                  style={{
                    height: "calc(100vh - 150px)",
                    position: "relative",
                  }}
                >
                  {filteredMessages.length > 0 ? (
                    <AutoSizer>
                      {({ height, width }) => (
                        <List
                          height={height}
                          itemCount={filteredMessages.length}
                          itemSize={getRowHeight}
                          width={width}
                          ref={listRef}
                          scrollToAlignment="center"
                        >
                          {({ index, style }) => {
                            const messageArray = filteredMessages[index];
                            const isLastMessage =
                              index === filteredMessages.length - 1;
                            return (
                              <div
                                className="no-scrollbar"
                                style={{ ...style }}
                                key={index}
                              >
                                <Message
                                  message={messageArray}
                                  author={
                                    !!(messageArray.sender_name === author)
                                  }
                                  time={messageArray.timestamp_ms}
                                  key={messageArray.timestamp_ms}
                                  isLastMessage={isLastMessage}
                                  type={messageArray.type}
                                  searchTerm={searchTerm}
                                  setRowHeight={setRowHeight}
                                  index={index}
                                  isHighlighted={
                                    index === highlightedMessageIndex
                                  }
                                />
                              </div>
                            );
                          }}
                        </List>
                      )}
                    </AutoSizer>
                  ) : (
                    <p>No messages found</p>
                  )}
                </div>
              )}
            </Card>

            <div className="flex flex-row items-center gap-$ m-auto">
              <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="justify-start bg-secondary hover:bg-background"
                  >
                    Delete a collection
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" side="right" align="start">
                  <Command>
                    <CommandInput placeholder="Select collection to delete..." />
                    <CommandList>
                      {collections.length === 0 && (
                        <CommandEmpty>No collections found.</CommandEmpty>
                      )}
                      <CommandGroup>
                        {collections.map((collection) => (
                          <CommandItem
                            key={collection.value}
                            onSelect={() => {
                              handleDelete(collection.value);
                              setDeleteOpen(false);
                            }}
                          >
                            {collection.label}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
               
              <div className="flex bg-secondary rounded-md">
                <Label htmlFor="jsonFile" className="bg-secondary rounded-md">
                  <Input
                    className="bg-secondary hover:bg-background rounded-md"
                    id="jsonFile"
                    type="file"
                    accept=".json"
                    onChange={(e) => uploadFile(e.target.files)}
                  />
                </Label>
              </div>
            </div>
          </Card>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
