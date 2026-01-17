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
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

/**
 * ProductGroup component for rendering collapsible group headers in the product table
 * 
 * @param {string} label - The group name/label to display
 * @param {number} itemCount - Number of items in the group
 * @param {boolean} isExpanded - Whether the group is currently expanded
 * @param {function} onToggle - Callback when the group header is clicked
 * @param {React.ReactNode} children - The content to render when expanded (ProductRow components)
 * @param {string} variant - 'primary' for main groups, 'secondary' for subgroups
 * @param {string} secondaryLabel - Optional secondary chip label (e.g., "X sizes")
 * @param {number} indentLevel - Indentation level for nested groups (0 or 1)
 */
function ProductGroup({
  label,
  itemCount,
  isExpanded,
  onToggle,
  children,
  variant = 'primary',
  secondaryLabel,
  indentLevel = 0
}) {
  const isPrimary = variant === 'primary';
  const paddingLeft = indentLevel * 2;

  return (
    <>
      <TableRow
        sx={{
          backgroundColor: (theme) => alpha(
            theme.palette.primary.main,
            isPrimary ? 0.12 : 0.04
          ),
          cursor: 'pointer',
          '&:hover': {
            backgroundColor: (theme) => alpha(
              theme.palette.primary.main,
              isPrimary ? 0.16 : 0.08
            ),
          },
          '& .MuiTableCell-root': {
            px: { xs: 0.5, sm: 1, md: 2 },
            py: isPrimary 
              ? { xs: 0.75, sm: 1.25 } 
              : { xs: 0.5, sm: 0.75 },
          }
        }}
        onClick={onToggle}
      >
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', pl: paddingLeft }}>
            <IconButton size="small">
              {isExpanded 
                ? <ExpandLessIcon fontSize={isPrimary ? 'medium' : 'small'} /> 
                : <ExpandMoreIcon fontSize={isPrimary ? 'medium' : 'small'} />
              }
            </IconButton>
          </Box>
        </TableCell>
        <TableCell colSpan={7}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pl: paddingLeft }}>
            <Typography 
              variant={isPrimary ? 'subtitle1' : 'body1'} 
              fontWeight={isPrimary ? 700 : 600}
            >
              {label}
            </Typography>
            <Chip 
              label={`${itemCount} items`} 
              size="small" 
              color={isPrimary ? 'primary' : 'default'}
              variant={isPrimary ? 'filled' : 'outlined'}
            />
            {secondaryLabel && (
              <Chip 
                label={secondaryLabel} 
                size="small" 
                variant="outlined"
              />
            )}
          </Box>
        </TableCell>
      </TableRow>

      {isExpanded && children}
    </>
  );
}

export default ProductGroup;
