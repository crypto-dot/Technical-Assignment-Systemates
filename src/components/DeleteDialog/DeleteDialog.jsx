import React from 'react';
import { useDispatch } from 'react-redux';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { deleteProduct } from '../../features/products/productSlice';

export function DeleteDialog({ deleteConfirm = null, onClose }) {
  const dispatch = useDispatch();

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    dispatch(deleteProduct(deleteConfirm.productId));
    onClose?.();
  };

  return (
    <Dialog open={deleteConfirm !== null} onClose={onClose}>
      <DialogTitle>Confirm Delete</DialogTitle>
      <DialogContent>
        Are you sure you want to delete "{deleteConfirm?.item}"?
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirmDelete} color="error" variant="contained">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DeleteDialog;