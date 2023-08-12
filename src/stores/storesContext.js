/** @format */

import { createContext } from "react";
import collectionStore from "./CollectionStore";
import themeStore from "./ThemeStore";
import messageStore from "./MessageStore";

export const storesContext = createContext({
  CollectionStore: collectionStore,
  ThemeStore: themeStore,
  MessageStore: messageStore,
});
