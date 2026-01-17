import { configureStore } from '@reduxjs/toolkit'
import { productSlice } from "./features/products/productSlice.js";
export const store = configureStore({
    reducer: { products: productSlice.reducer }
});