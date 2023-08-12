/** @format */

// src/stores/ThemeStore.js
import { makeAutoObservable } from "mobx";

class ThemeStore {
  theme = "dark"; // default theme

  constructor() {
    makeAutoObservable(this);
  }

  toggleTheme() {
    this.theme = this.theme === "dark" ? "light" : "dark";
  }
}

const themeStore = new ThemeStore();
export default themeStore;
