import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Box,
  Collapse,
  Typography
} from '@mui/material';
import { keyframes } from '@mui/system';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { addProduct, updateProduct } from '../../features/products/productSlice';

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-4px); }
  40%, 80% { transform: translateX(4px); }
`;

const ErrorMessage = ({ error }) => (
  <Collapse in={!!error} timeout={200}>
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        mt: 0.75,
        px: 1.5,
        py: 0.75,
        borderRadius: 1,
        backgroundColor: 'rgba(211, 47, 47, 0.08)',
        border: '1px solid rgba(211, 47, 47, 0.2)',
        animation: error ? `${shakeAnimation} 0.4s ease-in-out` : 'none',
      }}
    >
      <ErrorOutlineIcon 
        sx={{ 
          fontSize: 16, 
          color: 'error.main',
          flexShrink: 0
        }} 
      />
      <Typography
        variant="caption"
        sx={{
          color: 'error.main',
          fontWeight: 500,
          lineHeight: 1.4,
        }}
      >
        {error?.message}
      </Typography>
    </Box>
  </Collapse>
);

const ProductForm = ({ open, onClose, product, mode }) => {
  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      item: '',
      price: '',
      uom: 'LB',
      productSize: '',
      plu_upc: '',
      catId: '1'
    }
  });

  useEffect(() => {
    if (!open) return;

    if (product && mode === 'edit') {
      reset({
        item: product.item ?? '',
        price: product.price ? product.price.trim().replace('$', '').trim() : '',
        uom: product.uom ?? 'LB',
        productSize: product.productSize ?? '',
        plu_upc: product.plu_upc ?? '',
        catId: product.catId ?? '1'
      });
      return;
    }

    reset({
      item: '',
      price: '',
      uom: 'LB',
      productSize: '',
      plu_upc: '',
      catId: '1'
    });
  }, [open, product, mode, reset]);

  const onSubmit = (data) => {
    const numericPrice = Number.parseFloat(String(data.price));
    const productData = {
      item: data.item?.trim() ?? '',
      price: ` $${numericPrice.toFixed(2)} `,
      uom: data.uom,
      productSize: data.productSize ?? '',
      plu_upc: data.plu_upc ?? '',
      catId: data.catId ?? '1'
    };

    if (mode === 'edit' && product) {
      dispatch(updateProduct({ ...productData, productId: product.productId }));
    } else {
      dispatch(addProduct(productData));
    }

    onClose();
  };

  const uomOptions = ['LB', 'EA', 'OZ', 'KG', 'PKG'];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'edit' ? 'Edit Product' : 'Add New Product'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box>
              <TextField
                fullWidth
                label="Item Name"
                error={!!errors.item}
                required
                {...register('item', {
                  required: 'Item name is required',
                  validate: (value) => (value?.trim()?.length ? true : 'Item name is required')
                })}
              />
              <ErrorMessage error={errors.item} />
            </Box>
            
            <Box>
              <TextField
                fullWidth
                label="Price"
                type="number"
                error={!!errors.price}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                inputProps={{ step: '0.01', min: '0' }}
                {...register('price', {
                  required: 'Price is required',
                  validate: (value) => {
                    const num = Number.parseFloat(String(value));
                    if (Number.isNaN(num)) return 'Price must be a number';
                    if (num <= 0) return 'Price must be a positive number';
                    return true;
                  }
                })}
              />
              <ErrorMessage error={errors.price} />
            </Box>
            
            <Box>
              <TextField
                fullWidth
                select
                label="Unit"
                error={!!errors.uom}
                required
                defaultValue="LB"
                InputLabelProps={{ shrink: true }}
                {...register('uom', { required: 'Unit of measure is required' })}
              >
                {uomOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <ErrorMessage error={errors.uom} />
            </Box>
            
            <Box>
              <TextField
                fullWidth
                label="Product Size"
                {...register('productSize')}
              />
            </Box>
            
            <Box>
              <TextField
                fullWidth
                label="PLU/UPC"
                placeholder="042421-1606"
                error={!!errors.plu_upc}
                {...register('plu_upc', {
                  validate: (value) => {
                    if (!value || value.trim() === '') return true;
                    return /^\d+-\d+$/.test(value) || 'PLU/UPC must be in format: digits-digits (e.g., 042421-1606)';
                  }
                })}
              />
              <ErrorMessage error={errors.plu_upc} />
            </Box>
            
            <Box>
              <TextField
                fullWidth
                label="Category ID"
                {...register('catId')}
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting} variant="contained" color="primary">
            {mode === 'edit' ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ProductForm;
