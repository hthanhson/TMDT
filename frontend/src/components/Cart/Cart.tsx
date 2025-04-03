import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Divider,
  TextField,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import { useCart } from '../../contexts/CartContext';

const Cart: React.FC = () => {
  const { items, removeFromCart, updateQuantity, getCartTotal, clearCart } = useCart();

  const handleQuantityChange = (id: string, quantity: number) => {
    if (quantity > 0) {
      updateQuantity(id, quantity);
    } else {
      removeFromCart(id);
    }
  };

  if (items.length === 0) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="50vh"
      >
        <Typography variant="h6">Your cart is empty</Typography>
        <Button
          variant="contained"
          color="primary"
          href="/products"
          sx={{ mt: 2 }}
        >
          Continue Shopping
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Shopping Cart
      </Typography>
      <List>
        {items.map((item) => (
          <React.Fragment key={item.id}>
            <ListItem>
              <Box
                component="img"
                src={item.imageUrl}
                alt={item.name}
                sx={{ width: 100, height: 100, objectFit: 'cover', mr: 2 }}
              />
              <ListItemText
                primary={item.name}
                secondary={`$${item.price.toFixed(2)}`}
              />
              <Box display="flex" alignItems="center" mr={2}>
                <IconButton
                  onClick={() =>
                    handleQuantityChange(item.id, item.quantity - 1)
                  }
                >
                  <RemoveIcon />
                </IconButton>
                <TextField
                  value={item.quantity}
                  type="number"
                  size="small"
                  sx={{ width: 60, mx: 1 }}
                  onChange={(e) =>
                    handleQuantityChange(
                      item.id,
                      parseInt(e.target.value) || 0
                    )
                  }
                />
                <IconButton
                  onClick={() =>
                    handleQuantityChange(item.id, item.quantity + 1)
                  }
                >
                  <AddIcon />
                </IconButton>
              </Box>
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={() => removeFromCart(item.id)}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </React.Fragment>
        ))}
      </List>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mt={3}
      >
        <Button variant="outlined" color="secondary" onClick={clearCart}>
          Clear Cart
        </Button>
        <Typography variant="h6">Total: ${getCartTotal().toFixed(2)}</Typography>
      </Box>
      <Box display="flex" justifyContent="flex-end" mt={2}>
        <Button variant="contained" color="primary" size="large" href="/checkout">
          Proceed to Checkout
        </Button>
      </Box>
    </Box>
  );
};

export default Cart; 