import React, { useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';

// Định nghĩa interface Message
interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderType: 'USER' | 'ADMIN' | 'SYSTEM';
  timestamp: Date;
}

// Component MessagesList
const MessagesList = React.memo(
  ({
    messages,
    renderMessage,
    scrollToBottom,
  }: {
    messages: Message[];
    renderMessage: (message: Message) => JSX.Element;
    scrollToBottom: (ref: React.RefObject<HTMLDivElement>) => void;
  }) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Cuộn xuống cuối khi messages thay đổi
    useEffect(() => {
      scrollToBottom(messagesEndRef);
    }, [messages, scrollToBottom]);

    return (
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: '#fdfdfb',
        }}
      >
        {messages.length > 0 ? (
          messages.map((message) => (
            <Box key={message.id} sx={{ mb: 2 }}>
              {renderMessage(message)}
            </Box>
          ))
        ) : (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No messages yet
            </Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>
    );
  }
);

export default MessagesList;