import React, { useState, useMemo } from 'react';
import { useSelector} from 'react-redux';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Toolbar,
  Button,
  TextField,
  MenuItem,
  Chip,
  TablePagination,
  InputAdornment,
  alpha
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  UnfoldLess as UnfoldLessIcon,
  UnfoldMore as UnfoldMoreIcon
} from '@mui/icons-material';
import ProductForm from './ProductForm';
import {DeleteDialog} from "../DeleteDialog/DeleteDialog";

const PRICE_RANGE_ORDER = [
  'Under $1',
  '$1 - $4.99',
  '$5 - $9.99',
  '$10 - $24.99',
  '$25 - $49.99',
  '$50 - $99.99',
  '$100+',
  '⚠️ Invalid Price'
];

function ProductList() {
  const products = useSelector((state) => state.products);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState('none');
  const [openForm, setOpenForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expandedGroups, setExpandedGroups] = useState({});

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.price.includes(searchTerm) ||
      product.uom.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  function parseFraction(fractionString) {
    const parts = fractionString.split('/');
    if (parts.length === 2) {
      const numerator = parseFloat(parts[0]);
      const denominator = parseFloat(parts[1]);
  
      if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }
    return NaN; 
  }
  const groupedProducts = useMemo(() => {
    const getPriceRange = (priceStr) => {
      const numericPrice = parseFloat(priceStr?.replace(/[^0-9.-]/g, ''));
      if (isNaN(numericPrice)) return '⚠️ Invalid Price';
      if (numericPrice < 1) return PRICE_RANGE_ORDER[0];
      if (numericPrice < 5) return PRICE_RANGE_ORDER[1];
      if (numericPrice < 10) return PRICE_RANGE_ORDER[2];
      if (numericPrice < 25) return PRICE_RANGE_ORDER[3];
      if (numericPrice < 50) return PRICE_RANGE_ORDER[4];
      if (numericPrice < 100) return PRICE_RANGE_ORDER[5];
      return PRICE_RANGE_ORDER[6];
    };

    if (groupBy === 'none') {
      return { 'All Products': filteredProducts };
    }

    const groups = {};
    filteredProducts.forEach(product => {
      let key = product[groupBy] || 'Not Specified';

      if (groupBy === 'price') {
        key = getPriceRange(product.price);
      }
      if (groupBy === 'productSize') {
        const regex = /[a-zA-Z]+/;
        const match = product.productSize.match(regex);
        const units = match?.length ? match[0].toUpperCase() : "Units";
        if (product.productSize.includes('/')) {
          key = Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(parseFraction(product.productSize)) || "Not Specified";
        } else if (product.productSize.includes('-')) {
          key = Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(parseFloat(product.productSize.split('-')[0]) + parseFloat(product.productSize.split('-')[1])/12) || "Not Specified";
        } else {
          key = Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(parseFloat(product.productSize)) !== "NaN" ? Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(parseFloat(product.productSize)) : "Not Specified";
        }
        if(key !== "Not Specified") {
          key += ` ${units}`;
        }
      }
      if(groupBy === 'catId' && key !== "Not Specified") {
        const CATEGORY_NAME = "Category: " + key;
        key = CATEGORY_NAME;
      }
      if(groupBy === 'uom') {
         if(!product[groupBy]) {
          key = "Not Specified";
         }
      }
      if (groupBy === 'plu_upc') {
        const pluUpc = product.plu_upc || '';
        const prefix = pluUpc.split('-')[0];
        key = prefix ? `PLU/UPC: ${prefix}` : 'Not Specified';
      }
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(product);
      if(groupBy === 'catId') {
        groups[key].sort((a, b) => ( parseInt(a.catId) > parseInt(b.catId) ? 1 : parseInt(a.catId) < parseInt(b.catId) ? -1 : 0));
      }
    });

    // Sort groups - use price range order for price grouping, numerically for category, alphabetically for others
    if (groupBy === 'price') {
      return PRICE_RANGE_ORDER
        .filter(key => groups[key])
        .reduce((acc, key) => {
          acc[key] = groups[key];
          return acc;
        }, {});
    }

    if (groupBy === 'catId' || groupBy === 'uom' || groupBy === 'plu_upc') {
      return Object.keys(groups)
        .sort((a, b) => {
          const numA = parseInt(a.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.replace(/\D/g, '')) || 0;
          return numA - numB;
        })
        .reduce((acc, key) => {
          acc[key] = groups[key];
          return acc;
        }, {});
    }

    return Object.keys(groups)
      .sort()
      .reduce((acc, key) => {
        acc[key] = groups[key];
        return acc;
      }, {});
  }, [filteredProducts, groupBy]);

  // Initialize all groups as expanded
  React.useEffect(() => {
    const initialExpanded = {};
    Object.keys(groupedProducts).forEach(key => {
      initialExpanded[key] = true;
    });
    setExpandedGroups(initialExpanded);
  }, [groupBy,groupedProducts]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setOpenForm(true);
  };


  const handleAddNew = () => {
    setEditingProduct(null);
    setOpenForm(true);
  };

  const toggleGroup = (groupName) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const allGroupsExpanded = useMemo(() => {
    const groupKeys = Object.keys(groupedProducts);
    return groupKeys.length > 0 && groupKeys.every(key => expandedGroups[key]);
  }, [groupedProducts, expandedGroups]);

  const toggleAllGroups = () => {
    const newExpanded = {};
    Object.keys(groupedProducts).forEach(key => {
      newExpanded[key] = !allGroupsExpanded;
    });
    setExpandedGroups(newExpanded);
  };

  const groupingOptions = [
    { value: 'none', label: 'No Grouping' },
    { value: 'uom', label: 'Group by UOM' },
    { value: 'catId', label: 'Group by Category' },
    { value: 'productSize', label: 'Group by Size' },
    { value: 'price', label: 'Group by Price' },
    { value: 'plu_upc', label: 'Group by PLU/UPC' }
  ];


  return (
    <Box sx={{ width: '100%' }}>
      <Paper variant="outlined" sx={{ width: '100%', mb: 2, overflow: 'hidden' }}>
        <Toolbar
          sx={{
            px: { xs: 2, sm: 3 },
            py: 2,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 1.5,
            borderBottom: 1,
            borderColor: 'divider',
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flex: 1, width: '100%' }}>
            <Typography variant="h5" component="div">
              Products
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filteredProducts.length} Products
            </Typography>
          </Box>
          
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              flexWrap: 'wrap',
              gap: 1,
              width: { xs: '100%', md: 'auto' },
              flex: { md: '0 0 auto' },
              alignItems: { xs: 'stretch', sm: 'center' }
            }}
          >
            <TextField
              size="small"
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 200 }, flex: { sm: 'none' } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              select
              size="small"
              label="Group by"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              sx={{ minWidth: { xs: '100%', sm: 150 } }}
            >
              {groupingOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
              {groupBy !== 'none' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={allGroupsExpanded ? <UnfoldLessIcon /> : <UnfoldMoreIcon />}
                  onClick={toggleAllGroups}
                  sx={{ whiteSpace: 'nowrap', flex: { xs: 1, sm: 'none' } }}
                >
                  {allGroupsExpanded ? 'Collapse All' : 'Expand All'}
                </Button>
              )}

              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAddNew}
                sx={{ flex: { xs: 1, sm: 'none' } }}
              >
                Add Product
              </Button>
            </Box>
          </Box>
        </Toolbar>

        <TableContainer>
          <Table stickyHeader size="small" sx={{ minWidth: 650, tableLayout: 'fixed' }}>
            <colgroup>
              {groupBy !== 'none' && <col style={{ width: 40 }} />}
              <col style={{ width: '28%' }} />
              <col style={{ width: '11%' }} />
              <col style={{ width: '8%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '9%' }} />
              <col style={{ width: '14%' }} />
            </colgroup>
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-root': { bgcolor: 'background.paper', px: { xs: 0.5, sm: 1, md: 2 }, py: 1 } }}>
                {groupBy !== 'none' && <TableCell></TableCell>}
                <TableCell><strong>Item Name</strong></TableCell>
                <TableCell align="center"><strong>Price</strong></TableCell>
                <TableCell align="center"><strong>UOM</strong></TableCell>
                <TableCell align="center"><strong>Size</strong></TableCell>
                <TableCell align="center"><strong>PLU/UPC</strong></TableCell>
                <TableCell align="center"><strong>Category</strong></TableCell>
                <TableCell align="right"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(groupedProducts).map(([groupName, groupProducts]) => (
                <React.Fragment key={groupName}>
                  {groupBy !== 'none' && (
                    <TableRow
                      sx={{
                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                        cursor: 'pointer',
                        '&:hover': {
                          backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                        },
                        '& .MuiTableCell-root': {
                          px: { xs: 0.5, sm: 1, md: 2 },
                          py: { xs: 0.5, sm: 1 },
                        }
                      }}
                      onClick={() => toggleGroup(groupName)}
                    >
                      <TableCell>
                        <IconButton size="small">
                          {expandedGroups[groupName] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell colSpan={7}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700}>
                            {groupName}
                          </Typography>
                          <Chip 
                            label={`${groupProducts.length} items`} 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {(groupBy === 'none' || expandedGroups[groupName]) && groupProducts
                    .slice(
                      groupBy === 'none' ? page * rowsPerPage : 0,
                      groupBy === 'none' ? page * rowsPerPage + rowsPerPage : groupProducts.length
                    )
                    .map((product) => (
                      <TableRow
                        key={`${product.item}-${product.productId}`}
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
                        {groupBy !== 'none' && <TableCell></TableCell>}
                        <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Typography variant="body2" noWrap title={product.item}>
                            {product.item}
                          </Typography>
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
                              onClick={() => handleEdit(product)}
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
                              onClick={() => setDeleteConfirm(product)}
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
                    ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {groupBy === 'none' && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredProducts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        )}
      </Paper>

      <ProductForm
        open={openForm}
        onClose={() => setOpenForm(false)}
        product={editingProduct}
        mode={editingProduct ? 'edit' : 'add'}
      />

        <DeleteDialog deleteConfirm={deleteConfirm} onClose={() => setDeleteConfirm(null)} />
    </Box>
  );
}

export default ProductList;