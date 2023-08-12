/** @format */

import { createContext } from "react";
import themeStore from "./ThemeStore";
import messageStore from "./MessageStore";
import collectionStore from "./CollectionStore";

export const storesContext = createContext({
  ThemeStore: themeStore,
  MessageStore: messageStore,
  CollectionStore: collectionStore,
});
