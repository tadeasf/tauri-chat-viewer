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
import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState, useRef } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import collectionStore from "./stores/CollectionStore";

const App = observer(() => {
  const { MessageStore } = useContext(storesContext);
  const {
    user,
    filteredMessages,
    searchTerm,
    uploadedMessages,
    numberOfResults,
    scrollToIndex,
    searchContent,
    highlightedMessageIndex,
    numberOfResultsContent,
    currentResultIndex,
  } = MessageStore;
  const [isLoading, setIsLoading] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const chatBodyRef = useRef();
  const [collections, setCollections] = useState([]);
  const listRef = useRef();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileInputRef = useRef(null);
  const [isPhotoAvailable, setIsPhotoAvailable] = useState(false);
  const isPhotoAvailableRef = useRef(false);
  const rowHeights = useRef({});

  const handleOnSelect = async (value) => {
    await hardReset();
    const encodedCollectionName = encodeURIComponent(value);
    setCollectionName(encodedCollectionName);
    MessageStore.handleSend(encodedCollectionName);
    MessageStore.setCrossCollectionMessages([]);
  };

  useEffect(() => {
    if (scrollToIndex !== -1 && listRef.current) {
      listRef.current.scrollToItem(scrollToIndex, "center");
      MessageStore.scrollToIndex = -1;
    }
  }, [MessageStore, scrollToIndex]);

  useEffect(() => {
    // Reset row heights
    rowHeights.current = {};
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [filteredMessages, collectionName]);

  const setRowHeight = (index, height) => {
    rowHeights.current[index] = height;
    if (listRef.current) {
      listRef.current.resetAfterIndex(index);
    }
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
          name: collection.name,
          messageCount: collection.messageCount,
        }));
        setCollections(formattedCollections);
      } catch (error) {
        console.error(error);
      }
    };

    fetchCollections();
  }, []);

  useEffect(() => {
    MessageStore.filterMessagesBySearchTerm();
  }, [
    MessageStore.debouncedSearchTerm,
    MessageStore.uploadedMessages,
    MessageStore.page,
    MessageStore,
  ]);

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
      setIsLoading(false); // Set isLoading to false when the messages are updated
    } else if (collectionName) {
      await MessageStore.handleSend(collectionName);
      setIsLoading(false); // Set isLoading to false after handleSend is completed
    } else {
      setIsLoading(false); // Set isLoading to false if no messages and no collectionName
    }
  };

  const hardReset = async () => {
    setIsLoading(true);

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
    setCollectionName("");
    MessageStore.user = "";

    // Reset messages
    MessageStore.filteredMessages = []; // Clear the displayed messages
    MessageStore.uploadedMessages = []; // Clear the uploaded messages cache
    MessageStore.setCrossCollectionMessages([]);

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
      const data = await response.json();

      // Map the data to the required format
      const formattedCollections = data.map((collection) => ({
        name: collection.name,
        messageCount: collection.messageCount,
      }));

      setCollections(formattedCollections);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    MessageStore.filterMessagesByContent();
  }, [MessageStore, MessageStore.searchContent, MessageStore.uploadedMessages]);

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
      console.log(collectionName);

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

  // When the dialog is opened, set the current collection name
  function handleDialogOpen() {
    collectionStore.setCurrentCollectionName(collectionName);
  }

  // When the input value changes, update the newCollectionName in the store
  function handleInputChange(event) {
    collectionStore.setNewCollectionName(event.target.value);
  }

  const handleSearchAll = async () => {
    const query = MessageStore.searchContent;

    try {
      const response = await fetch("https://server.kocouratko.eu/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();

      // Update the MobX store
      MessageStore.setCrossCollectionMessages(data);
    } catch (error) {
      console.error("Error during search:", error);
    }
  };

  const messagesToDisplay =
    MessageStore.crossCollectionMessages.length > 0
      ? MessageStore.crossCollectionMessages
      : filteredMessages;

  // Flag to indicate if the messages are from a cross-collection search
  const isCrossCollection = MessageStore.crossCollectionMessages.length > 0;

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="{ThemeStore.theme}" enableSystem={true}>
        <div className="font-anonymous box-border bg-background">
          <Card className="flex flex-col h-screen bg-background">
            <div className="w-full bg-background flex flex-wrap justify-center items-center mt-5 mb-5 gap-x-4 gap-y-4">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    {collectionName
                      ? decodeURIComponent(collectionName)
                      : "Select a collection"}
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
                            key={collection.name}
                            onSelect={() => {
                              handleOnSelect(collection.name); // Pass only the name
                              setOpen(false);
                            }}
                          >
                            {decodeURIComponent(collection.name)} (
                            {collection.messageCount} msgs)
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
                placeholder="Search messages..."
                value={searchContent}
                onChange={(e) => (MessageStore.searchContent = e.target.value)}
                onKeyDown={MessageStore.handleContentKeyPress}
              />
              <button onClick={handleSearchAll}>Search All</button>
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

            <Card className="w-full max-h-[90%] flex flex-col overflow-auto">
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: "none" }}
                onChange={handleFileChange}
                accept="image/*"
              />
              <div className="flex items-center justify-between p-1 bg-backgroundtranslucent">
                <img
                  src={
                    isPhotoAvailable
                      ? `https://server.kocouratko.eu/serve/photo/${collectionName}`
                      : "https://placehold.co/1280x1280/black/white"
                  }
                  alt="user-profile"
                  className="h-28 w-28 object-cover ml-12 mr-10 mt-3 mb-3 rounded-full p-2 bg-secondary"
                  onClick={() => {
                    if (isPhotoAvailable) {
                      // Open the delete confirmation dialog
                      // openDeleteDialog();
                    } else if (collectionName) {
                      fileInputRef.current.click();
                    }
                  }}
                />

                <p className="text-xl font text-popover-foreground hover:text-accent">
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
                  {messagesToDisplay.length > 0 ? (
                    <AutoSizer>
                      {({ height, width }) => (
                        <List
                          height={height}
                          itemCount={messagesToDisplay.length}
                          itemSize={(index) =>
                            (rowHeights.current[index] || 110) + 20
                          } // Add a 20px gap
                          width={width}
                          ref={listRef}
                          scrollToAlignment="center"
                        >
                          {({ index, style }) => {
                            const messageArray = messagesToDisplay[index];
                            if (!messageArray || !messageArray.sender_name) {
                              console.log(
                                "Skipping message due to missing data:",
                                messageArray
                              ); // Debugging line
                              return null; // Skip this iteration if data is missing
                            }
                            const isLastMessage =
                              index === messagesToDisplay.length - 1;
                            const isAuthor =
                              messageArray.sender_name.toLowerCase() ===
                              "Tadeáš Fořt".toLowerCase();
                            return (
                              <div
                                className="no-scrollbar"
                                style={{ ...style }}
                                key={index}
                              >
                                <Message
                                  message={messageArray}
                                  author={isAuthor}
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
                                  isCrossCollection={isCrossCollection} // Pass the flag here
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

            <div className="flex flex-row items-center gap-4 m-auto">
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
                            key={collection.name}
                            onSelect={() => {
                              handleDelete(collection.name);
                              setDeleteOpen(false);
                            }}
                          >
                            {collection.name}
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
              <Dialog>
                <DialogTrigger asChild onClick={handleDialogOpen}>
                  <Button variant="secondary">Rename Collection</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Rename Collection</DialogTitle>
                    <DialogDescription>
                      Enter the new name for the collection.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="newCollectionName" className="text-right">
                        New Name
                      </Label>
                      <Input
                        id="newCollectionName"
                        className="col-span-3"
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="submit"
                      onClick={collectionStore.handleRename}
                    >
                      Save changes
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
});

export default App;
