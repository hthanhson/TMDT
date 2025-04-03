import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Fab,
  Collapse,
  Avatar,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial greeting when chat opens
  useEffect(() => {
    if (open && messages.length === 0) {
      const greeting: Message = {
        id: 1,
        text: `Hi${user ? ' ' + user.username : ' there'}! How can I help you today?`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [open, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toggleChat = () => {
    setOpen(!open);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (input.trim() === '') return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate bot response after a delay
    setTimeout(() => {
      const botResponse = generateBotResponse(input.trim().toLowerCase());
      setMessages((prev) => [...prev, botResponse]);
      setLoading(false);
    }, 1000);
  };

  const generateBotResponse = (userInput: string): Message => {
    // Simple response logic based on keywords
    let responseText = 'I\'m not sure how to help with that. Would you like to talk to a human agent?';
    
    if (userInput.includes('hello') || userInput.includes('hi') || userInput.includes('hey')) {
      responseText = `Hello${user ? ' ' + user.username : ''}! How can I assist you today?`;
    } 
    else if (userInput.includes('order') && userInput.includes('track')) {
      responseText = 'You can track your order by going to the Orders section in your account dashboard.';
    }
    else if (userInput.includes('order') && userInput.includes('cancel')) {
      responseText = 'To cancel an order, please go to your Orders page, select the order you want to cancel, and click the "Cancel Order" button if the order is still in processing state.';
    }
    else if (userInput.includes('return')) {
      responseText = 'Our return policy allows returns within 30 days of purchase. Please go to your Orders page and select "Return Item" for the product you wish to return.';
    }
    else if (userInput.includes('payment') || userInput.includes('pay')) {
      responseText = 'We accept credit cards, PayPal, and bank transfers. All payment information is securely processed.';
    }
    else if (userInput.includes('delivery') || userInput.includes('shipping')) {
      responseText = 'Standard shipping takes 3-5 business days. Express shipping is available for an additional fee and delivers within 1-2 business days.';
    }
    else if (userInput.includes('contact') || userInput.includes('support') || userInput.includes('help')) {
      responseText = 'You can reach our customer support team at support@example.com or call us at +1-800-123-4567 during business hours (9 AM - 5 PM EST).';
    }
    else if (userInput.includes('password') || userInput.includes('forgot')) {
      responseText = 'To reset your password, go to the login page and click on "Forgot Password". You will receive an email with instructions.';
    }
    else if (userInput.includes('thank')) {
      responseText = 'You\'re welcome! Is there anything else I can help you with?';
    }
    else if (userInput.includes('bye') || userInput.includes('goodbye')) {
      responseText = 'Goodbye! Feel free to chat again if you have more questions.';
    }
    
    return {
      id: messages.length + 2,
      text: responseText,
      sender: 'bot',
      timestamp: new Date(),
    };
  };

  return (
    <>
      {/* Chat button */}
      <Fab
        color="primary"
        aria-label="chat"
        sx={{ position: 'fixed', bottom: 20, right: 20 }}
        onClick={toggleChat}
      >
        {open ? <CloseIcon /> : <ChatIcon />}
      </Fab>

      {/* Chat window */}
      <Collapse
        in={open}
        timeout="auto"
        unmountOnExit
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 20,
          width: 320,
          maxWidth: '90vw',
          zIndex: 1000,
        }}
      >
        <Paper elevation={3} sx={{ borderRadius: 2, overflow: 'hidden' }}>
          {/* Chat header */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'primary.main',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <BotIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Shopping Assistant
            </Typography>
            <IconButton color="inherit" onClick={toggleChat} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          <Divider />

          {/* Chat messages */}
          <Box
            sx={{
              height: 320,
              overflowY: 'auto',
              p: 2,
              bgcolor: '#f5f5f5',
            }}
          >
            <List>
              {messages.map((message) => (
                <ListItem
                  key={message.id}
                  sx={{
                    textAlign: message.sender === 'user' ? 'right' : 'left',
                    pl: message.sender === 'user' ? 2 : 0,
                    pr: message.sender === 'bot' ? 2 : 0,
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                      alignItems: 'flex-start',
                      width: '100%',
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: message.sender === 'user' ? 'secondary.main' : 'primary.main',
                        width: 32,
                        height: 32,
                        mr: message.sender === 'user' ? 0 : 1,
                        ml: message.sender === 'user' ? 1 : 0,
                      }}
                    >
                      {message.sender === 'user' ? <PersonIcon /> : <BotIcon />}
                    </Avatar>
                    <Box
                      sx={{
                        maxWidth: '75%',
                        bgcolor: message.sender === 'user' ? 'secondary.light' : 'white',
                        borderRadius: 2,
                        p: 1,
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant="body2">{message.text}</Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 0.5, textAlign: 'right' }}
                      >
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
              ))}
              {loading && (
                <ListItem>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 1 }}>
                      <BotIcon />
                    </Avatar>
                    <CircularProgress size={20} thickness={4} />
                  </Box>
                </ListItem>
              )}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          <Divider />

          {/* Chat input */}
          <Box
            sx={{
              p: 1.5,
              bgcolor: 'background.paper',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <TextField
              fullWidth
              placeholder="Type a message..."
              variant="outlined"
              size="small"
              value={input}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              disabled={loading}
              autoFocus={open}
              InputProps={{
                sx: { borderRadius: 3 },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={input.trim() === '' || loading}
              sx={{ ml: 1 }}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Paper>
      </Collapse>
    </>
  );
};

export default ChatBot; 