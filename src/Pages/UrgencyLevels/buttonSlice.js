import { createSlice } from "@reduxjs/toolkit";

const buttonSlice = createSlice({
  name: "button",
  initialState: {
    isResetButtonVisible: false,
  },
  reducers: {
    showResetButton(state) {
      state.isResetButtonVisible = true;
    },
    hideResetButton(state) {
      state.isResetButtonVisible = false;
    },
  },
});

export const { showResetButton, hideResetButton } = buttonSlice.actions;

export default buttonSlice.reducer;
