import { configureStore } from "@reduxjs/toolkit";
import footerReducer from "./footerSlice";

export const store = configureStore({
  reducer: {
    footer: footerReducer,
  },
});