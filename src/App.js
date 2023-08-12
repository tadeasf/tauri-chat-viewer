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
import { ErrorBoundary } from "react-error-boundary";
import { storesContext } from "./stores/storesContext";
import { ModeToggle } from "./components/ModeToggle";
import { VariableSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { ThemeProvider } from "./components/theme-provider";
import Message from "./components/ui/Message";
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

const App = observer(() => {
  const { MessageStore, CollectionStore } = useContext(storesContext);
  const {
    author,
    user,
    filteredMessages,
    page,
    searchTerm,
    uploadedMessages,
    debouncedSearchTerm,
    numberOfResults,
    scrollToIndex,
    contentSearchIndex,
    searchContent,
    highlightedMessageIndex,
    numberOfResultsContent,
    currentResultIndex,
    firstPress,
  } = MessageStore;
  const {
    isLoading,
    collections,
    collectionName,
    isPhotoAvailable,
    handleDelete,
    uploadFile,
    refreshCollections,
    refresh,
    handleFileChange,
  } = CollectionStore;

  const chatBodyRef = useRef();
  const listRef = useRef();
  const rowHeights = useRef({}); // Add this ref
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileInputRef = useRef(null);
  const isPhotoAvailableRef = useRef(false);

  const handleOnSelect = async (value) => {
    await CollectionStore.hardReset();
    CollectionStore.collectionName = value;
    MessageStore.handleSend(value); // Assuming handleSend is a method in MessageStore
  };

  useEffect(() => {
    if (scrollToIndex !== -1 && listRef.current) {
      listRef.current.scrollToItem(scrollToIndex, "center");
      MessageStore.scrollToIndex = -1;
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
    CollectionStore.refreshCollections();
  }, []);

  useEffect(() => {
    MessageStore.filterMessagesBySearchTerm();
  }, [MessageStore.uploadedMessages, MessageStore.page]);

  useEffect(() => {
    MessageStore.filterMessagesByContent();
  }, [MessageStore.searchContent, MessageStore.uploadedMessages]);

  useEffect(() => {
    isPhotoAvailableRef.current = CollectionStore.isPhotoAvailable;
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
                            key={collection.id}
                            onSelect={() => {
                              handleOnSelect(collection.name);
                              setOpen(false);
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

              <Input
                className="min-w-[10rem] max-w-[20rem] h-10"
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => MessageStore.setSearchTerm(e.target.value)}
                onKeyDown={MessageStore.handleContentKeyPress}
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
                  {MessageStore.user
                    ? MessageStore.user
                    : "Select a collection..."}
                </p>
                <div className="flex items-center justify-rnd p-1 space-x-5 mr-5">
                  <Button
                    onClick={CollectionStore.refresh}
                    className="bg-secondary text-popover-foreground text-3xl rounded-full w-12 h-12 justify-center"
                  >
                    &#8635;
                  </Button>
                  <Button
                    onClick={CollectionStore.hardReset}
                    className="bg-secondary text-destructive text-3xl rounded-full w-12 h-12 justify-center"
                  >
                    &#8635;
                  </Button>
                </div>
              </div>
              {CollectionStore.isLoading ? (
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
                  {MessageStore.filteredMessages.length > 0 ? (
                    <AutoSizer>
                      {({ height, width }) => (
                        <List
                          height={height}
                          itemCount={MessageStore.filteredMessages.length}
                          itemSize={getRowHeight}
                          width={width}
                          ref={listRef}
                          scrollToAlignment="center"
                        >
                          {({ index, style }) => {
                            const messageArray =
                              MessageStore.filteredMessages[index];
                            const isLastMessage =
                              index ===
                              MessageStore.filteredMessages.length - 1;
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
                                    index ===
                                    MessageStore.highlightedMessageIndex
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
                      {CollectionStore.collections.length === 0 && (
                        <CommandEmpty>No collections found.</CommandEmpty>
                      )}
                      <CommandGroup>
                        {CollectionStore.collections.map((collection) => (
                          <CommandItem
                            key={collection.value}
                            onSelect={() => {
                              CollectionStore.handleDelete(collection.value);
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
                    onChange={(e) => CollectionStore.uploadFile(e.target.files)}
                  />
                </Label>
              </div>
            </div>
          </Card>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
});

export default App;
