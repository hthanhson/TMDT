import React, { useState, useEffect } from 'react';
import { 
  Box, 
  InputBase, 
  IconButton, 
  styled, 
  alpha,
  SxProps,
  Theme,
  Tooltip,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Clear as ClearIcon 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Search = styled('div')(({ theme }) => ({
  position: 'relative',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: alpha(theme.palette.common.white, 0.15),
  '&:hover': {
    backgroundColor: alpha(theme.palette.common.white, 0.25),
  },
  marginRight: theme.spacing(2),
  marginLeft: 0,
  width: '100%',
  [theme.breakpoints.up('sm')]: {
    marginLeft: theme.spacing(3),
    width: 'auto',
  },
  display: 'flex',
  alignItems: 'center',
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
  padding: theme.spacing(0, 2),
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
  color: 'inherit',
  width: '100%',
  '& .MuiInputBase-input': {
    padding: theme.spacing(1, 1, 1, 0),
    // vertical padding + font size from searchIcon
    paddingLeft: `calc(1em + ${theme.spacing(4)})`,
    paddingRight: theme.spacing(4),
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('md')]: {
      width: '30ch',
    },
  },
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: 4,
  color: theme.palette.mode === 'dark' ? alpha(theme.palette.common.white, 0.65) : alpha(theme.palette.common.black, 0.65),
  '&:hover': {
    color: theme.palette.mode === 'dark' ? theme.palette.common.white : theme.palette.common.black,
  }
}));

interface SearchBarProps {
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  handleSearch?: (e: React.FormEvent) => void;
  sx?: SxProps<Theme>;
  placeholder?: string;
  isLoading?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
  handleSearch,
  sx,
  placeholder = "Tìm kiếm sản phẩm...",
  isLoading = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Use internal state if no external state is provided
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  
  // Determine if we should use internal or external state
  const isControlled = externalSearchQuery !== undefined && externalSetSearchQuery !== undefined;
  const searchQuery = isControlled ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = isControlled 
    ? externalSetSearchQuery 
    : setInternalSearchQuery;

  // Initialize search query from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchParam = params.get('search');
    
    if (searchParam && !searchQuery) {
      setSearchQuery(searchParam);
    }
  }, [location.search, searchQuery, setSearchQuery]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch();
    if (handleSearch) {
      handleSearch(e);
    }
  };

  const submitSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    // Optional: navigate to products page without search query
    // navigate('/products');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  return (
    <Box sx={sx}>
      <Search>
        <SearchIconWrapper>
          <SearchIcon />
        </SearchIconWrapper>
        <form onSubmit={handleFormSubmit} style={{ width: '100%' }}>
          <StyledInputBase
            placeholder={placeholder}
            inputProps={{ 
              'aria-label': 'search products',
              'data-testid': 'search-input'
            }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
          />
        </form>
        
        {isLoading ? (
          <ActionButton disabled>
            <CircularProgress size={20} color="inherit" />
          </ActionButton>
        ) : searchQuery ? (
          <Tooltip title="Xóa">
            <ActionButton onClick={handleClear} aria-label="clear search">
              <ClearIcon fontSize="small" />
            </ActionButton>
          </Tooltip>
        ) : (
          <Tooltip title="Tìm kiếm">
            <ActionButton onClick={submitSearch} aria-label="search">
              <SearchIcon fontSize="small" />
            </ActionButton>
          </Tooltip>
        )}
      </Search>
    </Box>
  );
};

export default SearchBar; 