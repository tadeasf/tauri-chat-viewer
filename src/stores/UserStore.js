/** @format */

import { makeAutoObservable } from "mobx";

class UserStore {
  user = null;

  constructor() {
    makeAutoObservable(this);
  }

  setUser(userData) {
    this.user = userData;
  }

  clearUser() {
    this.user = null;
  }
}

// Export an instance of the UserStore
const userStore = new UserStore();
export default userStore;
