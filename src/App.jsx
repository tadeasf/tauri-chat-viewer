import { observer } from "mobx-react-lite";
import { useContext, useEffect, useState, useRef } from "react";
import Message from "./components/ui/Message";
import { ErrorBoundary } from "react-error-boundary";
import { storesContext } from "./stores/storesContext";
import { Virtuoso } from "react-virtuoso";
import { ThemeProvider } from "./components/theme-provider";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Badge } from "./components/ui/badge";
import { Switch } from "./components/ui/switch";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faMagnifyingGlass,
  faSort,
  faMessage,
  faArrowsRotate,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
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
  const { MessageStore } = useContext(storesContext);
  const {
    filteredMessages,
    searchTerm,
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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const fileInputRef = useRef(null);
  const isPhotoAvailableRef = useRef(false);
  const rowHeights = useRef({});
  const [showOnlyUserMessages, setShowOnlyUserMessages] = useState(false);
  const [sortByAlphabet, setSortByAlphabet] = useState(true);
  const [galleryPhotos, setGalleryPhotos] = useState([]);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [currentDb, setCurrentDb] = useState("Loading...");
  const [dbSwitchLoading, setDbSwitchLoading] = useState(false);
  const virtuosoRef = useRef(null);

  const fetchCurrentDb = () => {
    fetch("https://secondary.dev.tadeasfort.com/current_db")
      .then((response) => response.text())
      .then((data) => {
        setCurrentDb(data);
      })
      .catch((error) =>
        console.error(
          "There was an error fetching the current database name:",
          error
        )
      );
  };

  const switchDbAndFetch = () => {
    setDbSwitchLoading(true); // Start loading
    fetch("https://secondary.dev.tadeasfort.com/switch_db", { method: "GET" }) // Assuming GET request is sufficient for switching
      .then((response) => {
        if (response.ok) {
          setTimeout(() => {
            // Add a delay to simulate loading time
            fetchCurrentDb(); // Re-fetch the current database name after switching
            refreshCollections(); // Refresh the collections to reflect the database change
            setDbSwitchLoading(false); // Stop loading after everything is done
          }, 8000); // Adjust the timeout as necessary
        } else {
          console.error("There was an error switching the database");
          setDbSwitchLoading(false); // Ensure loading is stopped in case of an error
        }
      })
      .catch((error) => {
        console.error("There was an error switching the database:", error);
        setDbSwitchLoading(false); // Ensure loading is stopped in case of an error
      });
  };

  useEffect(() => {
    fetchCurrentDb();
  }, []);

  const handleOnSelect = async (value) => {
    await hardReset();
    const encodedCollectionName = encodeURIComponent(value);
    setCollectionName(encodedCollectionName);

    // Assume fromDate and toDate are state variables you have defined somewhere
    MessageStore.handleSend(encodedCollectionName, fromDate, toDate);

    MessageStore.setCrossCollectionMessages([]);
  };

  useEffect(() => {
    if (scrollToIndex !== -1 && virtuosoRef.current) {
      virtuosoRef.current.scrollToIndex({
        index: scrollToIndex,
        behavior: "smooth",
        align: "start",
      });
    }
  }, [scrollToIndex]);

  useEffect(() => {
    // Reset row heights
    rowHeights.current = {};
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [filteredMessages, collectionName]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const endpoint = sortByAlphabet
          ? "https://secondary.dev.tadeasfort.com/collections/alphabetical"
          : "https://secondary.dev.tadeasfort.com/collections";

        const response = await fetch(endpoint);
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
  }, [sortByAlphabet]); // Added sortByAlphabet as a dependency

  useEffect(() => {
    MessageStore.filterMessagesBySearchTerm();
  }, [
    MessageStore.debouncedSearchTerm,
    MessageStore.uploadedMessages,
    MessageStore.page,
    MessageStore,
  ]);

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
    MessageStore.isPhotoAvailable = false; // <-- Reset state
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
        `https://secondary.dev.tadeasfort.com/delete/${collectionName}`,
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

  // Function to refresh collections
  const refreshCollections = async () => {
    try {
      const response = await fetch(
        "https://secondary.dev.tadeasfort.com/collections"
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
        `https://secondary.dev.tadeasfort.com/upload/photo/${collectionName}`,
        {
          method: "POST",
          body: formData,
        }
      );
      console.log(collectionName);

      const data = await response.json();
      if (data.message === "Photo uploaded successfully") {
        MessageStore.isPhotoAvailable = true;
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
  };

  useEffect(() => {
    isPhotoAvailableRef.current = MessageStore.isPhotoAvailable; // <-- change here
  }, [MessageStore.isPhotoAvailable]); // <-- change here

  // // When the dialog is opened, set the current collection name
  // function handleDialogOpen() {
  //   collectionStore.setCurrentCollectionName(collectionName);
  // }

  // // When the input value changes, update the newCollectionName in the store
  // function handleInputChange(event) {
  //   collectionStore.setNewCollectionName(event.target.value);
  // }

  const handleSearchAll = async () => {
    const query = MessageStore.searchContent;

    try {
      const response = await fetch("https://fastapi.tadeasfort.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      });

      // print the request for debugging
      console.log("Request:", JSON.stringify({ query }));
      const data = await response.json();

      // Update the MobX store
      MessageStore.setCrossCollectionMessages(data);
    } catch (error) {
      console.error("Error during search:", error);
    }
  };

  useEffect(() => {
    // Define the function to handle key press
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.key === "Enter") {
        handleSearchAll();
      }
    };

    // Attach event listener
    document.addEventListener("keydown", handleKeyPress);

    // Cleanup function to remove event listener
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  });

  const messagesToDisplay =
    MessageStore.crossCollectionMessages.length > 0
      ? MessageStore.crossCollectionMessages
      : filteredMessages;

  // Flag to indicate if the messages are from a cross-collection search
  const isCrossCollection = MessageStore.crossCollectionMessages.length > 0;

  const sanitizeName = (name) => {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "")
      .replace(/[^a-zA-Z0-9]/g, "");
  };

  const sanitizedCollectionName = sanitizeName(
    decodeURIComponent(collectionName)
  );

  const handleDeletePhoto = async () => {
    try {
      const response = await fetch(
        `https://secondary.dev.tadeasfort.com/delete/photo/${sanitizedCollectionName}`,
        {
          method: "DELETE",
        }
      );

      if (response.status === 200) {
        const data = await response.json();
        // You can handle the response here. For example, you might want to set some state to indicate that the photo was deleted.
        alert(data.message); // Display the message
        // Update the UI to indicate that the photo has been deleted
        // For example, set MessageStore.isPhotoAvailable to false
      } else {
        // Handle errors
        const data = await response.json();
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error("There was an error deleting the photo:", error);
    }
  };

  async function handleShowAllPhotos() {
    if (!collectionName) return; // Guard clause

    setIsGalleryOpen(false);
    setGalleryLoading(true);

    const photoDataUri = `https://secondary.dev.tadeasfort.com/photos/${encodeURIComponent(
      collectionName
    )}`;
    try {
      const response = await fetch(photoDataUri);
      const photoData = await response.json();

      const photoUrls = photoData
        .flatMap((msg) =>
          msg.photos.map((photo) => {
            const processedUri = photo.uri.replace("messages/inbox/", "");
            return {
              ...photo,
              url: `https://secondary.dev.tadeasfort.com/inbox/${processedUri}`,
            };
          })
        )
        .sort((a, b) => a.creation_timestamp - b.creation_timestamp)
        .map((photo, index) => ({ ...photo, index: index + 1 }));

      setGalleryPhotos(photoUrls);
      setIsGalleryOpen(true);
      setGalleryLoading(false);
    } catch (error) {
      console.error("Failed to fetch photo data:", error);
      setGalleryLoading(false);
    }
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="{ThemeStore.theme}" enableSystem={true}>
        <div className="font-anonymous box-border bg-background">
          <Card className="flex flex-col h-screen bg-background">
            <div className="w-full bg-background flex flex-wrap justify-left items-center gap-x-1 ml-5 mb-1">
              {/* <ModeToggle /> */}
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-2 w-18 justify-start">
                    {collectionName
                      ? decodeURIComponent(collectionName)
                      : "Select"}
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
                            onSelect={() => handleOnSelect(collection.name)}
                          >
                            {decodeURIComponent(collection.name)} (
                            {collection.messageCount} msgs)
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                    {/* Add date input fields */}
                    <div className="grid grid-cols-3 gap-4 p-4">
                      <Label htmlFor="fromDate">From Date</Label>
                      <Input
                        type="date"
                        id="fromDate"
                        value={fromDate}
                        onChange={(e) => {
                          const [year, month] = e.target.value.split("-");
                          setFromDate(`${year}-${month}-01`);
                        }}
                        className="col-span-2 h-8"
                      />
                      <Label htmlFor="toDate">To Date</Label>
                      <Input
                        type="date"
                        id="toDate"
                        value={toDate}
                        onChange={(e) => {
                          const [year, month] = e.target.value.split("-");
                          setToDate(`${year}-${month}-01`);
                        }}
                        className="col-span-2 h-8"
                      />
                    </div>
                  </Command>
                </PopoverContent>
              </Popover>
              <button
                onClick={() => setSortByAlphabet(!sortByAlphabet)}
                className="text-white rounded p-2" // Add your styling here
                aria-pressed={sortByAlphabet} // Improves accessibility
              >
                <FontAwesomeIcon icon={faSort} /> {/* Sort icon */}
              </button>
              <Input
                className="w-24 h-8"
                type="text"
                placeholder="Search"
                value={searchContent}
                onChange={(e) => (MessageStore.searchContent = e.target.value)}
                onKeyDown={MessageStore.handleContentKeyPress}
              />
              <button
                onClick={handleSearchAll}
                className="text-white ml-2 text-lg"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />{" "}
                {/* Magnifying glass icon */}
              </button>

              <Button
                onClick={() => MessageStore.handleSearchDirection(-1)}
                className="text-white rounded"
              >
                <FontAwesomeIcon icon={faArrowLeft} /> {/* Left arrow icon */}
              </Button>
              <Button
                onClick={() => MessageStore.handleSearchDirection(1)}
                className="text-white rounded"
              >
                <FontAwesomeIcon icon={faArrowRight} /> {/* Right arrow icon */}
              </Button>

              <Badge
                variant="secondary"
                className="py-1 text-base leading-tight ml-0 mr-0 flex items-center" // Added flex and items-center for alignment
              >
                {searchContent !== ""
                  ? `${
                      currentResultIndex + 1
                    }/${numberOfResultsContent} ${searchContent}`
                  : `${numberOfResults} `}
                <FontAwesomeIcon icon={faMessage} className="ml-1" />
              </Badge>
              <Switch
                checked={showOnlyUserMessages}
                onCheckedChange={() =>
                  setShowOnlyUserMessages(!showOnlyUserMessages)
                }
              />
              <FontAwesomeIcon icon={faEyeSlash} />
            </div>

            <Card className="w-full max-h-[90%] flex flex-col overflow-auto">
              <input
                type="file"
                ref={fileInputRef}
                className={`${
                  MessageStore.isPhotoAvailable ? "hidden" : "block"
                } cursor-pointer`}
                onChange={handleFileChange}
                accept="image/*"
              />
              <img
                src={
                  MessageStore.isPhotoAvailable
                    ? `https://secondary.dev.tadeasfort.com/serve/photo/${sanitizedCollectionName}`
                    : "https://secondary.dev.tadeasfort.com/inbox/placeholder/photos/placeholder.jpg"
                }
                alt="user-profile"
                className="my-responsive-image rounded-full"
                onClick={() => {
                  if (!MessageStore.isPhotoAvailable && collectionName) {
                    fileInputRef.current.click();
                  }
                }}
              />
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
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-full h-1 bg-red-b70 animate-pulse opacity-70 rounded-xl" />
                    </div>
                  ) : (
                    <Virtuoso
                      ref={virtuosoRef}
                      data={messagesToDisplay}
                      itemContent={(index, message) => {
                        const isLastMessage =
                          index === messagesToDisplay.length - 1;
                        const isAuthor =
                          message.sender_name.toLowerCase() ===
                          "Tadeáš Fořt".toLowerCase();
                        return (
                          <Message
                            message={message}
                            author={isAuthor}
                            time={message.timestamp_ms}
                            key={message.timestamp_ms}
                            isLastMessage={isLastMessage}
                            type={message.type}
                            searchTerm={searchTerm}
                            index={index}
                            is_geoblocked_for_viewer={
                              message.is_geoblocked_for_viewer
                            }
                            isHighlighted={index === highlightedMessageIndex}
                            isCrossCollection={isCrossCollection}
                          />
                        );
                      }}
                      style={{ height: "100%" }} // You may need to adjust this
                      alignToBottom
                      // followOutput="smooth" // This ensures smooth scrolling to the bottom
                    />
                  )}
                </div>
              )}
            </Card>

            <div className="flex flex-row items-center gap-2 m-auto">
              <Popover open={deleteOpen} onOpenChange={setDeleteOpen}>
                <PopoverTrigger asChild></PopoverTrigger>
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
               {/* New Button for switching the database */}
              <Button
                variant="outline"
                onClick={switchDbAndFetch}
                disabled={dbSwitchLoading}
              >
                {dbSwitchLoading ? (
                  <div
                    className="spinner-border animate-spin inline-block w-4 h-4 border-4 rounded-full"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  currentDb
                )}
              </Button>
              <Button
                variant="outline"
                disabled={!collectionName} // Disabled if no collection name is set
                onClick={handleShowAllPhotos}
              >
                Photos
              </Button>
              {/* <Dialog>
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
              </Dialog> */}
              <Button variant="outline" onClick={handleDeletePhoto}>
                Delete
              </Button>
              <Button
                onClick={hardReset}
                className="bg-secondary text-destructive text-lg justify-center ml-0 mr-0"
              >
                <FontAwesomeIcon icon={faArrowsRotate} />
              </Button>
            </div>
          </Card>
          {/* Gallery Overlay */}
          {isGalleryOpen && !galleryLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center">
              <button
                onClick={() => setIsGalleryOpen(false)}
                className="absolute top-0 right-0 m-4 text-white font-bold text-2xl"
              >
                &times;
              </button>
              <div
                className="overflow-auto p-4 max-h-full w-full"
                style={{ maxHeight: "90%" }}
              >
                <div
                  className="grid gap-0"
                  style={{
                    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                  }}
                >
                  {galleryPhotos.map((photo, index) => (
                    <div
                      key={photo.creation_timestamp}
                      className="flex justify-center items-center border border-white border-opacity-50 relative"
                    >
                      {/* Container to ensure the photo is centered and has a border */}
                      <div className="flex justify-center items-center p-1 w-full h-full">
                        <img
                          src={photo.url}
                          alt={`Gallery ${index + 1}`}
                          loading="lazy"
                          className="max-w-xs max-h-[calc(100%-2rem)] w-auto h-auto"
                        />
                      </div>
                      {/* Overlay with index */}
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-sm p-1 text-center">
                        Photo #{photo.index}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {galleryLoading && (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-center">
              {/* Loading Spinner */}
            </div>
          )}
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
});

export default App;
