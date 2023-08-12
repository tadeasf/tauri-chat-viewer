/** @format */
/* This file is part of Chat Viewer.
 *
 * Chat Viewer is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Chat Viewer is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Chat Viewer. If not, see <https://www.gnu.org/licenses/>.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import Message from "./components/Message/Message";
import { ErrorBoundary } from "react-error-boundary";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import martina from "./assets/martina.jpg";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
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

const photosMap = {
  martina: martina,
};

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
  const [randomPhoto, setRandomPhoto] = useState(null);
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

  const scrollToTop = () => {
    setContentSearchIndex(0);
    setScrollToIndex(0);
    setHighlightedMessageIndex(-1);
  };

  const handleOnSelect = (value) => {
    setCollectionName(value);
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
    if (scrollToIndex !== -1) {
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
        setCollections(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCollections();
  }, []);

  const collectionOptions = collections.map((collection) => ({
    label: collection,
    value: collection,
  }));

  const handleSend = async (collectionName) => {
    setIsLoading(true);

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

      refreshPhoto(photoData);

      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const refreshPhoto = useCallback((photoName) => {
    // Check if photoName is provided and exists in the photosMap
    if (photoName && photosMap[photoName]) {
      setRandomPhoto(photosMap[photoName]);
      console.log(
        "Found photo data, non-random photo was selected:",
        photosMap[photoName]
      );
      return;
    }

    // If photoName is not provided or doesn't exist, select a random photo
    const photosArray = Object.values(photosMap);
    const randomIndex = Math.floor(Math.random() * photosArray.length);
    setRandomPhoto(photosArray[randomIndex]);
    console.log("Random photo was selected");
  }, []);

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

  const handleDelete = async (collectionName) => {
    setIsLoading(true);

    try {
      const response = await fetch(
        `https://server.kocouratko.eu/delete/${collectionName}`,
        { method: "DELETE" }
      );

      const responseData = await response.json();

      if (response === 200) {
        setCollections(collections.filter((col) => col !== collectionName));
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

  return (
    <ErrorBoundary>
      <div className="font-anonymous box-border m-0 p-0">
        <Card className="flex flex-col h-screen bg-gray-303">
          <div className="w-full flex justify-center flex-nowrap shrink-0 flex items-start mt-2 mb-8">
            <div className="flex flex-row items-center justify-between gap-3">
              <div className="w-full flex justify-center flex-nowrap shrink-0 m-0">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[150px] justify-start"
                    >
                      {collectionName ? collectionName : "Select a collection"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" side="right" align="start">
                    <Command>
                      <CommandInput placeholder="Select collection..." />
                      <CommandList>
                        <CommandEmpty>No collections found.</CommandEmpty>
                        <CommandGroup>
                          {collections.map((collection) => (
                            <CommandItem
                              key={collection.value}
                              onSelect={() => handleOnSelect(collection.value)}
                            >
                              {collection.label}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-row items-center justify-between">
                <span className="inline-flex text-white bg-gray-303 transition-all duration-300 ease-in-out items-center justify-center shadow-custom rounded-2 border-none text-lg self-start m-1 px-2 py-1">
                  {searchContent !== ""
                    ? `Found ${
                        currentResultIndex + 1
                      }/${numberOfResultsContent} of: ${searchContent}`
                    : `Total number of messages: ${numberOfResults}`}
                </span>
                <input
                  className="inline-flex text-white bg-gray-303 transition-all duration-300 ease-in-out items-center justify-center shadow-custom rounded-2 border-none text-lg self-start m-1 px-2 py-1"
                  type="text"
                  placeholder="Search by content"
                  value={searchContent}
                  onChange={(e) => setSearchContent(e.target.value)}
                  onKeyDown={handleContentKeyPress}
                />
              </div>
            </div>
          </div>

          <Card className="mb-8 w-full max-h-[80%] text-zinc-100 shadow-custom flex flex-col overflow-auto rounded-2 border-gray-5e7 bg-gray-1a1">
            <div className="flex items-center justify-between p-2 bg-gray-232">
              <img
                src={randomPhoto}
                alt="user-profile"
                className="h-20 w-20 object-cover ml-12 mr-10 rounded-full"
              />
              <p>{user ? user : "Select a collection..."}</p>
              <Button onClick={refresh} className="text-5xl mr-4 mt-1">
                &#8635;
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="w-full h-1 bg-red-b70 animate-pulse opacity-70 rounded-xl" />
              </div>
            ) : (
              <div
                className="flex-grow overflow-auto flex flex-col gap-4 p-2"
                ref={chatBodyRef}
                style={{ height: "calc(100vh - 150px)", position: "relative" }}
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
                                author={!!(messageArray.sender_name === author)}
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

          <div className="mb-[2em]">
            <div className="flex flex-row items-center justify-between gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>Delete a collection</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {collectionOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onSelect={() => handleDelete(option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <input
                className="inline-flex text-white bg-gray-303 transition-all duration-300 ease-in-out items-center justify-center shadow-custom rounded-2 border-none text-lg self-start m-1 px-2 py-1"
                type="file"
                multiple
                onChange={(e) => uploadFile(e.target.files)}
              />
            </div>
          </div>
        </Card>
      </div>
    </ErrorBoundary>
  );
}

export default App;
