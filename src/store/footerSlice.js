import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isDonateOpen: false,
};

const footerSlice = createSlice({
  name: "footer",
  initialState,
  reducers: {
    openDonateModal: (state) => {
      state.isDonateOpen = true;
    },
    closeDonateModal: (state) => {
      state.isDonateOpen = false;
    },
  },
});

export const { openDonateModal, closeDonateModal } = footerSlice.actions;
export default footerSlice.reducer;