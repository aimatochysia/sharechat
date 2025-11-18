import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function SearchDialog({ open, onClose, onSearch, currentQuery }) {
  const [query, setQuery] = useState(currentQuery);

  const handleSearch = () => {
    onSearch(query);
    onClose();
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Search Messages
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          autoFocus
          label="Search for text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
          placeholder="Enter search term..."
          sx={{ mt: 2 }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClear}>Clear</Button>
        <Button onClick={handleSearch} variant="contained">
          Search
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default SearchDialog;
