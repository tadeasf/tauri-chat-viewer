/** @format */

// components/theme-provider.js

import React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }) {
  return <NextThemesProvider attribute="class">{children}</NextThemesProvider>;
}
