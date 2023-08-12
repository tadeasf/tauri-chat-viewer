/** @format */

import { createContext } from "react";
import userStore from "./UserStore";
import themeStore from "./ThemeStore";
import messageStore from "./MessageStore";

export const storesContext = createContext({
  UserStore: userStore,
  ThemeStore: themeStore,
  MessageStore: messageStore,
});
