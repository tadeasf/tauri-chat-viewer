/** @format */

import { createContext } from "react";
import userStore from "./UserStore";
import themeStore from "./ThemeStore";

export const storesContext = createContext({
  UserStore: userStore,
  ThemeStore: themeStore,
});
