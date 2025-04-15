import React, { useState } from 'react';
import { Fab, Box, Zoom } from '@mui/material';
import { Chat as ChatIcon, Close as CloseIcon } from '@mui/icons-material';
import AdminChat from './AdminChat';

const AdminChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating chat button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1000,
          display: isOpen ? 'none' : 'block', // Hide button when chat is open
        }}
      >
        <Fab
          color="primary"
          aria-label="chat"
          onClick={toggleChat}
          sx={{
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 14px rgba(0,0,0,0.3)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          <ChatIcon />
        </Fab>
      </Box>

      {/* Chat panel that slides in when button is clicked */}
      <Zoom in={isOpen} timeout={300}>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: isOpen ? '100%' : 0,
            height: isOpen ? '100%' : 0,
            maxWidth: '1200px',
            maxHeight: '800px',
            zIndex: 999,
            display: isOpen ? 'block' : 'none',
            overflow: 'hidden',
            boxShadow: '0 0 20px rgba(0,0,0,0.2)',
            borderRadius: { xs: 0, md: '10px 0 0 0' },
            '@media (min-width: 600px)': {
              width: '90%',
              height: '90%',
              bottom: 20,
              right: 20,
            },
          }}
        >
          <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
            <AdminChat />
            {/* Close button inside chat panel */}
            <Box
              sx={{
                position: 'absolute',
                top: 10,
                right: 10,
                zIndex: 1001,
              }}
            >
              <Fab
                size="small"
                color="default"
                aria-label="close"
                onClick={toggleChat}
              >
                <CloseIcon />
              </Fab>
            </Box>
          </Box>
        </Box>
      </Zoom>
    </>
  );
};

export default AdminChatButton; 