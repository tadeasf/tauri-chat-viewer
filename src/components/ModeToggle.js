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

// components/ModeToggle.js

import React, { useContext } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";
import { storesContext } from "../stores/storesContext";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const { ThemeStore } = useContext(storesContext);

  // Toggle between light and dark theme
  const toggleTheme = () => {
    ThemeStore.toggleTheme();
    setTheme(ThemeStore.theme);
  };

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {resolvedTheme === "dark" ? (
        <MoonIcon className="h-[1rem] w-[1rem]" />
      ) : (
        <SunIcon className="h-[1rem] w-[1rem]" />
      )}
    </Button>
  );
}

export default ModeToggle;
