/** @format */

import { createContext } from "react";
import collectionStore from "./CollectionStore";
import themeStore from "./ThemeStore";
import messageStore from "./MessageStore";
import collectionStore from "./CollectionStore";

export const storesContext = createContext({
  CollectionStore: collectionStore,
  ThemeStore: themeStore,
  MessageStore: messageStore,
  CollectionStore: collectionStore,
});
