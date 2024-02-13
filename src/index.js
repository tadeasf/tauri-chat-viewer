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
import React from "react";
import { createRoot } from "react-dom/client";
import "./globals.css";
import App from "./App";
import { storesContext } from "./stores/storesContext";
import collectionStore from "./stores/CollectionStore";
import themeStore from "./stores/ThemeStore";
import messageStore from "./stores/MessageStore";
import collectionStore from "./stores/CollectionStore";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <storesContext.Provider
    value={{
      CollectionStore: collectionStore,
      ThemeStore: themeStore,
      MessageStore: messageStore,
      CollectionStore: collectionStore,
    }}
  >
    <App />
  </storesContext.Provider>
);
// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
