/** @format */

// components/ModeToggle.js

import React from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { Button } from "./ui/button";

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();

  // Toggle between light and dark theme
  const toggleTheme = () => {
    if (resolvedTheme === "dark") {
      setTheme("light");
    } else {
      setTheme("dark");
    }
  };

  return (
    <Button variant="outline" size="icon" onClick={toggleTheme}>
      {resolvedTheme === "dark" ? (
        <MoonIcon className="h-[1.2rem] w-[1.2rem]" />
      ) : (
        <SunIcon className="h-[1.2rem] w-[1.2rem]" />
      )}
    </Button>
  );
}

export default ModeToggle;
