/** @format */

import { createContext } from "react";
import UserStore from "./UserStore";
import ThemeStore from "./ThemeStore";

export const storesContext = createContext({
  UserStore: new UserStore(),
  ThemeStore: new ThemeStore(),
});
