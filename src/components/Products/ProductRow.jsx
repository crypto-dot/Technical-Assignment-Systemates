import React from 'react';
import {
  TableRow,
  TableCell,
  IconButton,
  Typography,
  Chip,
  Box,
  alpha
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

function ProductRow({ 
  product, 
  onEdit, 
  onDelete, 
  showGroupColumn = false,
  indentLevel = 0 
}) {
  const paddingLeft = indentLevel * 4;

  return (
    <TableRow
      hover
      sx={{
        '&:nth-of-type(odd)': {
          backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.25),
        },
        '&:hover': {
          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.06),
        },
        '& .MuiTableCell-root': {
          borderColor: 'divider',
          px: { xs: 0.5, sm: 1, md: 2 },
          py: { xs: 0.5, sm: 1 },
        }
      }}
    >
      {showGroupColumn && <TableCell></TableCell>}
      <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <Box sx={{ pl: paddingLeft }}>
          <Typography variant="body2" noWrap title={product.item}>
            {product.item}
          </Typography>
        </Box>
      </TableCell>
      <TableCell align="center">
        <Chip
          label={product.price.trim()}
          color="success"
          size="small"
          variant="outlined"
          sx={{ 
            height: 'auto', 
            '& .MuiChip-label': { 
              px: { xs: 0.5, sm: 1 },
              py: 0.25,
              fontSize: { xs: '0.7rem', sm: '0.8125rem' }
            } 
          }}
        />
      </TableCell>
      <TableCell align="center">
        <Chip 
          label={product.uom} 
          size="small"
          sx={{ 
            height: 'auto', 
            '& .MuiChip-label': { 
              px: { xs: 0.5, sm: 1 },
              py: 0.25,
              fontSize: { xs: '0.7rem', sm: '0.8125rem' }
            } 
          }}
        />
      </TableCell>
      <TableCell align="center">
        {product.productSize || '-'}
      </TableCell>
      <TableCell align="center">
        {product.plu_upc || '-'}
      </TableCell>
      <TableCell align="center">
        {product.catId}
      </TableCell>
      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.75 }}>
          <IconButton
            size="small"
            color="primary"
            onClick={() => onEdit(product)}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => onDelete(product)}
            sx={{
              border: 1,
              borderColor: 'divider',
              borderRadius: 2,
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </TableCell>
    </TableRow>
  );
}

export default ProductRow;
