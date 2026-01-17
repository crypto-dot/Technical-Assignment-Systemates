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
  const [expandedSubGroups, setExpandedSubGroups] = useState({});

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
  // Helper to parse size into numeric value and unit
  const parseSizeInfo = (productSize) => {
    if (!productSize) return { numericValue: null, unit: 'Not Specified', formattedValue: 'Not Specified' };
    
    const regex = /[a-zA-Z]+/;
    const match = productSize.match(regex);
    const unit = match?.length ? match[0].toUpperCase() : "UNITS";
    
    let numericValue;
    let formattedValue;
    
    if (productSize.includes('/')) {
      numericValue = parseFraction(productSize);
      formattedValue = Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(numericValue);
    } else if (productSize.includes('-')) {
      numericValue = parseFloat(productSize.split('-')[0]) + parseFloat(productSize.split('-')[1]) / 12;
      formattedValue = Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(numericValue);
    } else {
      numericValue = parseFloat(productSize);
      formattedValue = !isNaN(numericValue) 
        ? Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(numericValue) 
        : 'Not Specified';
    }
    
    if (isNaN(numericValue)) {
      return { numericValue: null, unit: 'Not Specified', formattedValue: 'Not Specified' };
    }
    
    return { numericValue, unit, formattedValue };
  };

  // Hierarchical grouping for productSize
  const hierarchicalSizeGroups = useMemo(() => {
    if (groupBy !== 'productSize') return null;

    const unitGroups = {};
    
    filteredProducts.forEach(product => {
      const { unit, formattedValue, numericValue } = parseSizeInfo(product.productSize);
      
      if (!unitGroups[unit]) {
        unitGroups[unit] = {};
      }
      
      const sizeKey = formattedValue;
      if (!unitGroups[unit][sizeKey]) {
        unitGroups[unit][sizeKey] = { products: [], numericValue };
      }
      unitGroups[unit][sizeKey].products.push(product);
    });

    // Sort units alphabetically, but put "Not Specified" at the end
    const sortedUnits = Object.keys(unitGroups).sort((a, b) => {
      if (a === 'Not Specified') return 1;
      if (b === 'Not Specified') return -1;
      return a.localeCompare(b);
    });

    const sortedResult = {};
    sortedUnits.forEach(unit => {
      // Sort size values numerically within each unit
      const sizeKeys = Object.keys(unitGroups[unit]).sort((a, b) => {
        const numA = unitGroups[unit][a].numericValue;
        const numB = unitGroups[unit][b].numericValue;
        if (numA === null) return 1;
        if (numB === null) return -1;
        return numA - numB;
      });
      
      sortedResult[unit] = {};
      sizeKeys.forEach(sizeKey => {
        sortedResult[unit][sizeKey] = unitGroups[unit][sizeKey].products;
      });
    });

    return sortedResult;
  }, [filteredProducts, groupBy]);

  // Count total products in a unit group
  const getUnitGroupCount = (unit) => {
    if (!hierarchicalSizeGroups || !hierarchicalSizeGroups[unit]) return 0;
    return Object.values(hierarchicalSizeGroups[unit]).reduce((sum, products) => sum + products.length, 0);
  };

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

    // For productSize, return empty object as we use hierarchicalSizeGroups
    if (groupBy === 'productSize') {
      return {};
    }

    const groups = {};
    filteredProducts.forEach(product => {
      let key = product[groupBy] || 'Not Specified';

      if (groupBy === 'price') {
        key = getPriceRange(product.price);
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
    const initialSubExpanded = {};
    
    if (groupBy === 'productSize' && hierarchicalSizeGroups) {
      Object.keys(hierarchicalSizeGroups).forEach(unit => {
        initialExpanded[unit] = true;
        Object.keys(hierarchicalSizeGroups[unit]).forEach(size => {
          initialSubExpanded[`${unit}-${size}`] = true;
        });
      });
    } else {
      Object.keys(groupedProducts).forEach(key => {
        initialExpanded[key] = true;
      });
    }
    
    setExpandedGroups(initialExpanded);
    setExpandedSubGroups(initialSubExpanded);
  }, [groupBy, groupedProducts, hierarchicalSizeGroups]);

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

  const toggleSubGroup = (subGroupKey) => {
    setExpandedSubGroups(prev => ({
      ...prev,
      [subGroupKey]: !prev[subGroupKey]
    }));
  };

  const allGroupsExpanded = useMemo(() => {
    if (groupBy === 'productSize' && hierarchicalSizeGroups) {
      const unitKeys = Object.keys(hierarchicalSizeGroups);
      if (unitKeys.length === 0) return false;
      
      const allUnitsExpanded = unitKeys.every(key => expandedGroups[key]);
      const allSizesExpanded = unitKeys.every(unit => 
        Object.keys(hierarchicalSizeGroups[unit]).every(size => 
          expandedSubGroups[`${unit}-${size}`]
        )
      );
      return allUnitsExpanded && allSizesExpanded;
    }
    
    const groupKeys = Object.keys(groupedProducts);
    return groupKeys.length > 0 && groupKeys.every(key => expandedGroups[key]);
  }, [groupedProducts, expandedGroups, groupBy, hierarchicalSizeGroups, expandedSubGroups]);

  const toggleAllGroups = () => {
    const newExpanded = {};
    const newSubExpanded = {};
    
    if (groupBy === 'productSize' && hierarchicalSizeGroups) {
      Object.keys(hierarchicalSizeGroups).forEach(unit => {
        newExpanded[unit] = !allGroupsExpanded;
        Object.keys(hierarchicalSizeGroups[unit]).forEach(size => {
          newSubExpanded[`${unit}-${size}`] = !allGroupsExpanded;
        });
      });
      setExpandedSubGroups(newSubExpanded);
    } else {
      Object.keys(groupedProducts).forEach(key => {
        newExpanded[key] = !allGroupsExpanded;
      });
    }
    
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
              {/* Hierarchical rendering for productSize grouping */}
              {groupBy === 'productSize' && hierarchicalSizeGroups && Object.entries(hierarchicalSizeGroups).map(([unit, sizeGroups]) => (
                <React.Fragment key={unit}>
                  {/* Unit group header (outer group) */}
                  <TableRow
                    sx={{
                      backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                      cursor: 'pointer',
                      '&:hover': {
                        backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.16),
                      },
                      '& .MuiTableCell-root': {
                        px: { xs: 0.5, sm: 1, md: 2 },
                        py: { xs: 0.75, sm: 1.25 },
                      }
                    }}
                    onClick={() => toggleGroup(unit)}
                  >
                    <TableCell>
                      <IconButton size="small">
                        {expandedGroups[unit] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell colSpan={7}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>
                          {unit}
                        </Typography>
                        <Chip 
                          label={`${getUnitGroupCount(unit)} items`} 
                          size="small" 
                          color="primary" 
                          variant="filled"
                        />
                        {unit !== 'Not Specified' && (
                          <Chip 
                            label={`${Object.keys(sizeGroups).length} sizes`} 
                            size="small" 
                            backgroundColor="primary"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* For "Not Specified" - show products directly without inner subgroups */}
                  {expandedGroups[unit] && unit === 'Not Specified' && Object.values(sizeGroups).flat().map((product) => (
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
                      <TableCell></TableCell>
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

                  {/* Size subgroups (inner groups) - only for non "Not Specified" units */}
                  {expandedGroups[unit] && unit !== 'Not Specified' && Object.entries(sizeGroups).map(([sizeValue, products]) => {
                    const subGroupKey = `${unit}-${sizeValue}`;
                    return (
                      <React.Fragment key={subGroupKey}>
                        {/* Size subgroup header */}
                        <TableRow
                          sx={{
                            cursor: 'pointer',
                            '& .MuiTableCell-root': {
                              px: { xs: 0.5, sm: 1, md: 2 },
                              py: { xs: 0.5, sm: 0.75 },
                            }
                          }}
                          onClick={() => toggleSubGroup(subGroupKey)}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
                              <IconButton size="small">
                                {expandedSubGroups[subGroupKey] ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                              </IconButton>
                            </Box>
                          </TableCell>
                          <TableCell colSpan={7}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: 2 }}>
                              <Typography variant="body1" fontWeight={600}>
                                {sizeValue} {unit}
                              </Typography>
                              <Chip 
                                label={`${products.length} items`} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          </TableCell>
                        </TableRow>

                        {/* Products in this size subgroup */}
                        {expandedSubGroups[subGroupKey] && products.map((product) => (
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
                            <TableCell></TableCell>
                            <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              <Box sx={{ pl: 4 }}>
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
                    );
                  })}
                </React.Fragment>
              ))}

              {/* Standard rendering for non-productSize grouping */}
              {groupBy !== 'productSize' && Object.entries(groupedProducts).map(([groupName, groupProducts]) => (
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