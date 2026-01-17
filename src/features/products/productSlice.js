import { createSlice } from '@reduxjs/toolkit'
import { initial_state } from "../../lib/mock/product.js";

export const productSlice = createSlice({
  name: 'products',
  initialState: initial_state,
  reducers: {
    addProduct: (state, action) => {
      // Generate new productId based on max existing ID
      const maxId = state.reduce((max, product) => {
        const id = parseInt(product.productId);
        return id > max ? id : max;
      }, 0);
      
      const newProduct = {
        ...action.payload,
        productId: String(maxId + 1)
      };
      state.push(newProduct);
    },
    
    updateProduct: (state, action) => {
      const index = state.findIndex(product => product.productId === action.payload.productId);
      if (index !== -1) {
        state[index] = action.payload;
      }
    },
    
    deleteProduct: (state, action) => {
      return state.filter(product => product.productId !== action.payload);
    },
  }
});

export const { addProduct, updateProduct, deleteProduct } = productSlice.actions;
export default productSlice.reducer;

