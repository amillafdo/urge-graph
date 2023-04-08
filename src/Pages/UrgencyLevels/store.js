import { configureStore } from "@reduxjs/toolkit";
import buttonReducer from "./buttonSlice";

export default configureStore({
  reducer: {
    button: buttonReducer,
  },
});
