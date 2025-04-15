import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Paper,
  TextField,
  IconButton,
  Grid,
  Badge,
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Chip,
} from '@mui/material';
import {
  Send as SendIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon,
  ChatBubble as ChatBubbleIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import ChatService, { ChatSession } from '../../services/ChatService';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../contexts/AuthContext';
import { useSnackbar } from 'notistack';
import MessagesList from './MessagesList';

// Định nghĩa các interface
interface Message {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderType: 'USER' | 'ADMIN' | 'SYSTEM';
  timestamp: Date;
}

interface ActiveUser {
  userId: string;
  username: string;
  connected: boolean;
  sessionId?: string;
}

interface WebSocketMessage {
  type: string;
  userId?: string;
  username?: string;
  sessionId?: string;
  content?: string;
  timestamp?: number;
  activeUsers?: ActiveUser[];
  messageId?: string;
  adminCount?: number;
  message?: string;
  senderType?: string;
  sender?: string;
}

const AdminChat: React.FC = () => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [activeSessions, setActiveSessions] = useState<ChatSession[]>([]);
  const [historySessions, setHistorySessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { enqueueSnackbar } = useSnackbar();

  // Tải danh sách sessions khi mới vào trang
  useEffect(() => {
    loadActiveSessions();
    
    // Yêu cầu quyền thông báo từ trình duyệt
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          console.log('Notification permission:', permission);
        });
      }
    }
  }, []);

  // Kết nối WebSocket
  useEffect(() => {
    connectToWebSocket();
    
    return () => {
      if (socket) {
        console.log('Closing WebSocket connection on cleanup');
        socket.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [user]);

  // Khởi tạo onmessage cho WebSocket
  useEffect(() => {
    if (socket) {
      socket.onmessage = (event) => {
        try {
          const rawData = event.data;
          console.log('Raw WebSocket message received:', rawData);
          
          const data: WebSocketMessage = JSON.parse(rawData);
          console.log('Parsed WebSocket message:', data);
          console.log('Message type:', data.type);
          
          if (data.type === 'CHAT_MESSAGE') {
            console.log('CHAT_MESSAGE details:');
            console.log('- sessionId:', data.sessionId);
            console.log('- sender:', data.sender);
            console.log('- senderType:', data.senderType);
            console.log('- content:', data.content);
            console.log('- messageId:', data.messageId);
            console.log('- selectedSession:', selectedSession?.id);
            console.log('- activeSession match:', activeSessions.some(s => s.id === data.sessionId));
            
            // Xử lý tin nhắn mới một cách quyết liệt
            handleNewMessage(data);
          } else {
            // Các loại tin nhắn khác dùng xử lý thông thường
            handleWebSocketMessage(data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
          console.error('Raw message that caused error:', event.data);
        }
      };
    }
  }, [socket, selectedSession, activeSessions, messages]);

  const connectToWebSocket = () => {
    // Nếu đã có kết nối, đóng kết nối cũ
    if (socket && socket.readyState !== WebSocket.CLOSED) {
      console.log('Closing existing WebSocket connection');
      socket.close();
    }
    
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = host === 'localhost' ? ':8089' : '';
    const wsUrl = `${wsProtocol}//${host}${port}/chat?role=ADMIN&userId=${user?.id}`;
    console.log('Connecting to WebSocket:', wsUrl);
    
    const newSocket = new WebSocket(wsUrl);

    // Set connection timeout
    const connectionTimeout = setTimeout(() => {
      if (newSocket.readyState !== WebSocket.OPEN) {
        console.error('WebSocket connection timeout');
        setConnected(false);
        enqueueSnackbar('Connection timeout. Reconnecting...', { variant: 'error' });
        reconnectTimeoutRef.current = setTimeout(connectToWebSocket, 3000);
      }
    }, 5000);

    newSocket.onopen = () => {
      console.log('WebSocket connected successfully');
      clearTimeout(connectionTimeout);
      setConnected(true);
      setSocket(newSocket);
      
      // Gửi tin nhắn kết nối
      const connectMsg = {
        type: 'ADMIN_CONNECT',
        adminId: user?.id?.toString() || 'admin',
        adminName: user?.username || 'Admin',
        timestamp: new Date().getTime(),
      };
      newSocket.send(JSON.stringify(connectMsg));
      console.log('Sent ADMIN_CONNECT message');
      
      // Tải lại danh sách sessions sau khi kết nối
      loadActiveSessions();
    };

    newSocket.onclose = (event) => {
      console.log('WebSocket closed. Code:', event.code, 'Reason:', event.reason);
      clearTimeout(connectionTimeout);
      setConnected(false);
      setSocket(null);
      
      if (event.wasClean) {
        console.log('WebSocket closed cleanly');
      } else {
        console.error('WebSocket connection died');
        enqueueSnackbar('Connection lost. Reconnecting...', { variant: 'warning' });
      }
      
      // Automatically reconnect
      reconnectTimeoutRef.current = setTimeout(connectToWebSocket, 3000);
    };

    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      enqueueSnackbar('WebSocket error occurred', { variant: 'error' });
    };
  };

  // Tải danh sách sessions
  const loadActiveSessions = async () => {
    try {
      setLoading(true);
      const sessions = await ChatService.getActiveChatSessions();
      console.log('Loaded active sessions:', sessions);
      setActiveSessions(sessions);
    } catch (err) {
      console.error('Error loading active sessions:', err);
      enqueueSnackbar('Failed to load active sessions', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadHistorySessions = async () => {
    try {
      setLoading(true);
      const sessions = await ChatService.getAllChatSessions();
      setHistorySessions(sessions.filter((s) => s.status === 'ENDED'));
      } catch (err) {
      console.error('Error loading history sessions:', err);
      enqueueSnackbar('Failed to load history sessions', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadSessionMessages = async (session: ChatSession) => {
    try {
      setLoading(true);
      
      // Đánh dấu session đang chọn và làm mới unreadCount
      setSelectedSession(session);
      setActiveSessions(prev => 
        prev.map(s => s.id === session.id ? { ...s, unreadCount: 0 } : s)
      );
      
      // Tải tin nhắn từ API chỉ khi ban đầu chọn session
      const chatMessages = await ChatService.getMessagesByChatSession(session.id);
      const formattedMessages: Message[] = chatMessages.map((msg) => ({
        id: msg.id?.toString() || uuidv4(),
        content: msg.content,
        senderId: msg.senderId,
        senderName: msg.senderName,
        senderType: msg.senderType,
        timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      }));
      setMessages(formattedMessages);
      
      // Đánh dấu session đã đọc
      await ChatService.markSessionAsRead(session.id);
    } catch (err) {
      console.error('Error loading session messages:', err);
      enqueueSnackbar('Failed to load session messages', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Hàm xử lý tin nhắn mới một cách quyết liệt
  const handleNewMessage = (data: WebSocketMessage) => {
    if (!data.content || !data.sessionId) {
      console.warn('Tin nhắn không có nội dung hoặc sessionId');
      return;
    }

    // 1. Kiểm tra và lưu tin nhắn mới
    const isSenderUser = data.sender === 'user' || data.senderType?.toLowerCase() === 'user';
    const newMessageObj: Message = {
      id: data.messageId || uuidv4(),
      content: data.content,
      senderId: data.userId || 'unknown',
      senderName: data.username || (isSenderUser ? 'User' : 'Admin'),
      senderType: isSenderUser ? 'USER' : 'ADMIN',
      timestamp: new Date(data.timestamp || Date.now()),
    };

    // 2. Kiểm tra trùng lặp
    if (messages.some(m => m.id === newMessageObj.id)) {
      console.log('Bỏ qua tin nhắn trùng lặp:', newMessageObj.id);
      return;
    }

    // 3. Kiểm tra session
    const sessionExists = activeSessions.some(s => s.id === data.sessionId);
    const isCurrentSession = selectedSession?.id === data.sessionId;

    // 4. Trường hợp 1: Session đang được chọn - thêm tin nhắn vào messages
    if (isCurrentSession) {
      console.log('Thêm tin nhắn vào session hiện tại:', data.sessionId);
      setMessages(prev => [...prev, newMessageObj]);
      
      // Đánh dấu đã đọc
      ChatService.markSessionAsRead(data.sessionId)
        .catch(err => console.error('Lỗi khi đánh dấu đã đọc:', err));
      
      // Cập nhật unreadCount = 0 cho session hiện tại
      setActiveSessions(prev => 
        prev.map(s => s.id === data.sessionId ? {...s, lastMessage: data.content, unreadCount: 0} : s)
      );
      return;
    }

    // 5. Trường hợp 2: Session chưa tồn tại - thêm mới
    if (!sessionExists && isSenderUser) {
      console.log('Thêm session mới cho tin nhắn:', data.sessionId);
      
      // Tạo session mới
      const newSession: ChatSession = {
        id: data.sessionId,
        userId: data.userId || 'unknown',
        userName: data.username || 'User',
        status: 'ACTIVE',
        startedAt: new Date().toISOString(),
        lastMessage: data.content,
        unreadCount: 1
      };
      
      // Thêm vào danh sách sessions
      setActiveSessions(prev => [newSession, ...prev]);
      
      // Hiển thị thông báo
      if (isSenderUser) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Tin nhắn mới từ ${data.username || 'User'}`, {
            body: data.content
          });
        }
        
        enqueueSnackbar(`Tin nhắn mới từ ${data.username || 'User'}`, {
          variant: 'info',
          action: (key) => (
            <Button color="inherit" size="small" onClick={() => {
              const foundSession = activeSessions.find(s => s.id === data.sessionId) || newSession;
              loadSessionMessages(foundSession);
            }}>
              Xem
            </Button>
          ),
        });
      }
      
      // Tải lại danh sách session để cập nhật đầy đủ thông tin
      loadActiveSessions();
      return;
    }

    // 6. Trường hợp 3: Session tồn tại nhưng không phải session hiện tại
    if (sessionExists && !isCurrentSession) {
      console.log('Cập nhật session có sẵn:', data.sessionId);
      
      // Cập nhật lastMessage và tăng unreadCount
      setActiveSessions(prev => 
        prev.map(s => s.id === data.sessionId 
          ? {...s, lastMessage: data.content, unreadCount: (s.unreadCount || 0) + 1}
          : s
        )
      );
      
      // Hiển thị thông báo nếu là tin nhắn từ user
      if (isSenderUser) {
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Tin nhắn mới từ ${data.username || 'User'}`, {
            body: data.content
          });
        }
        
        enqueueSnackbar(`Tin nhắn mới từ ${data.username || 'User'}`, {
          variant: 'info',
          action: (key) => (
            <Button color="inherit" size="small" onClick={() => {
              const session = activeSessions.find(s => s.id === data.sessionId);
              if (session) loadSessionMessages(session);
            }}>
              Xem
            </Button>
          ),
        });
      }
    }
  };

  // Xử lý tin nhắn từ WebSocket
  const handleWebSocketMessage = (data: WebSocketMessage) => {
    console.log('Processing WebSocket message type:', data.type);
    
    switch (data.type) {
      case 'CHAT_MESSAGE':
        if (data.content && data.sessionId) {
          console.log('CHAT_MESSAGE from session:', data.sessionId);
          
          // Xác định loại người gửi một cách chính xác
          const sender = data.sender === 'admin' || data.senderType?.toLowerCase() === 'admin' ? 'ADMIN' : 
                         data.sender === 'system' || data.senderType?.toLowerCase() === 'system' ? 'SYSTEM' : 'USER';

          // Tạo đối tượng tin nhắn mới
          const newMessage: Message = {
            id: data.messageId || uuidv4(),
            content: data.content,
            senderId: data.userId || 'unknown',
            senderName: data.username || (sender === 'SYSTEM' ? 'System' : 
                        sender === 'ADMIN' ? 'Admin' : 'User'),
            senderType: sender as 'USER' | 'ADMIN' | 'SYSTEM',
            timestamp: new Date(data.timestamp || Date.now()),
          };

          // Kiểm tra trùng lặp tin nhắn
          if (data.messageId && messages.some((m) => m.id === data.messageId)) {
            console.log('Duplicate message ignored:', data.messageId);
            return;
          }

          // Kiểm tra xem session có trong danh sách active sessions không
          const sessionExists = activeSessions.some(s => s.id === data.sessionId);
          const isCurrentSession = selectedSession?.id === data.sessionId;
          
          // Nếu session chưa có trong danh sách, tải thông tin session và thêm vào activeSessions
          if (!sessionExists && sender === 'USER') {
            console.log('Session not in activeSessions, loading session info');
            
            // Đảm bảo sessionId không undefined
            const sessionId = data.sessionId || uuidv4();
            
            // Tạo session tạm thời để hiển thị ngay
            const tempSession: ChatSession = {
              id: sessionId,
              userId: data.userId || 'unknown',
              userName: data.username || 'User',
              status: 'ACTIVE',
              startedAt: new Date().toISOString(),
              lastMessage: data.content,
              unreadCount: 1
            };
            
            // Thêm session tạm thời vào danh sách
            setActiveSessions(prev => [...prev, tempSession]);
            
            // Tải lại danh sách sessions đầy đủ
            loadActiveSessions().then(() => {
              // Sau khi tải xong, hiển thị thông báo
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('New chat message', {
                  body: `${data.username || 'User'}: ${data.content}`
                });
              }
              
              // Thông báo trong app với nút mở chat
              enqueueSnackbar(`New message from ${data.username || 'User'}`, { 
                variant: 'info',
                action: (key) => (
                  <Button color="inherit" size="small" onClick={() => {
                    // Tìm session trong danh sách đã tải lại
                    const session = activeSessions.find(s => s.id === sessionId);
                    if (session) {
                      loadSessionMessages(session);
                    }
                  }}>
                    Open Chat
                  </Button>
                )
              });
            });
            
            return;
          }

          // Cập nhật tin nhắn vào session hiện tại nếu đang xem
          if (isCurrentSession) {
            console.log('Adding message to current session:', newMessage);
            setMessages((prev) => [...prev, newMessage]);
            
            // Đánh dấu đã đọc
            ChatService.markSessionAsRead(data.sessionId).catch((err) =>
              console.error('Error marking session as read:', err)
            );
          } else {
            console.log('Message for another session:', data.sessionId);
            
            // Hiển thị thông báo nếu là tin nhắn từ người dùng
            if (sender === 'USER' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification('New message', {
                body: `${data.username || 'User'}: ${data.content}`
              });
              
              // Hiển thị thông báo trong ứng dụng với nút để chuyển đến session
              enqueueSnackbar(`New message from ${data.username || 'User'}`, { 
                variant: 'info',
                action: (key) => (
                  <Button color="inherit" size="small" onClick={() => {
                    const session = activeSessions.find(s => s.id === data.sessionId);
                    if (session) {
                      loadSessionMessages(session);
                    }
                  }}>
                    View
                  </Button>
                )
              });
            }
          }

          // Cập nhật activeSessions để hiển thị tin nhắn mới nhất và unreadCount
          setActiveSessions((prev) => {
            // Kiểm tra xem session đã có trong danh sách chưa
            const sessionIndex = prev.findIndex(s => s.id === data.sessionId);
            
            if (sessionIndex !== -1) {
              // Session đã tồn tại, cập nhật thông tin
              const updatedSessions = [...prev];
              updatedSessions[sessionIndex] = {
                ...updatedSessions[sessionIndex],
                lastMessage: data.content,
                unreadCount: isCurrentSession ? 0 : (updatedSessions[sessionIndex].unreadCount || 0) + 1
              };
              return updatedSessions;
            } else if (sender === 'USER' && data.sessionId) {
              // Session không tồn tại và là tin nhắn từ user, thêm session mới
              return [
                ...prev,
                {
                  id: data.sessionId,
                  userId: data.userId || 'unknown',
                  userName: data.username || 'User',
                  status: 'ACTIVE',
                  startedAt: new Date().toISOString(),
                lastMessage: data.content,
                  unreadCount: 1
                } as ChatSession
              ];
            }
            
            // Trường hợp khác, trả về danh sách hiện tại
            return prev;
          });
        } else {
          console.warn('Invalid CHAT_MESSAGE data:', data);
        }
        break;

      case 'USER_CONNECTED':
        console.log('USER_CONNECTED:', data.userId, data.username);
        if (data.userId && data.username) {
          // Cập nhật danh sách người dùng đang hoạt động
          setActiveUsers((prev) => {
            const exists = prev.some((u) => u.userId === data.userId);
            return exists
              ? prev.map((u) =>
                  u.userId === data.userId 
                    ? { 
                        userId: u.userId, 
                        username: u.username, 
                        connected: true, 
                        sessionId: data.sessionId 
                      } 
                    : u
                )
              : [
              ...prev,
                  {
                    userId: data.userId,
                    username: data.username,
                    connected: true,
                    sessionId: data.sessionId,
                  } as ActiveUser,
                ];
          });
          
          // Thông báo người dùng mới kết nối
          enqueueSnackbar(`User ${data.username} connected`, { variant: 'info' });
          
          // Tải lại danh sách session để cập nhật UI
          loadActiveSessions();
        }
        break;
        
      case 'USER_DISCONNECTED':
        console.log('USER_DISCONNECTED:', data.userId);
        if (data.userId) {
          // Cập nhật trạng thái người dùng
          setActiveUsers((prev) =>
            prev.map((u) => 
              u.userId === data.userId 
                ? { 
                    userId: u.userId, 
                    username: u.username, 
                    connected: false, 
                    sessionId: u.sessionId 
                  } 
                : u
            )
          );
          
          // Thông báo người dùng đã ngắt kết nối
          const disconnectedUser = activeUsers.find(u => u.userId === data.userId);
          if (disconnectedUser) {
            enqueueSnackbar(`User ${disconnectedUser.username} disconnected`, { variant: 'info' });
          }
          
          // Tải lại danh sách session để cập nhật UI
          loadActiveSessions();
        }
        break;

      case 'SESSION_DELETED':
        console.log('SESSION_DELETED:', data.sessionId);
        if (data.sessionId) {
          // Xóa session khỏi danh sách
          setActiveSessions((prev) => prev.filter((session) => session.id !== data.sessionId));
          
          // Nếu session bị xóa là session đang chọn
          if (selectedSession?.id?.toString() === data.sessionId?.toString()) {
            // Thêm tin nhắn hệ thống
            const deleteMessage: Message = {
              id: uuidv4(),
              content: 'This chat session has been deleted.',
              senderId: 'system',
              senderName: 'System',
              senderType: 'SYSTEM',
                    timestamp: new Date(),
            };
            
            setMessages((prev) => [...prev, deleteMessage]);
            setTimeout(() => setSelectedSession(null), 2000);
          }
          
          // Tải lại danh sách lịch sử
          loadHistorySessions();
        }
        break;

      case 'ACTIVE_USERS':
        console.log('ACTIVE_USERS received');
        if (data.activeUsers) {
          setActiveUsers(data.activeUsers as ActiveUser[]);
        }
        break;

      case 'CONNECTION_ESTABLISHED':
        console.log('CONNECTION_ESTABLISHED for admin');
        enqueueSnackbar('Connected to chat server', { variant: 'success' });
        break;
        
      default:
        console.log('Unhandled WebSocket message type:', data.type);
        break;
    }
  };

  // Gửi tin nhắn
  const sendMessage = async () => {
    if (!input.trim() || !selectedSession || !socket || socket.readyState !== WebSocket.OPEN) return;

    const messageText = input.trim();
    const messageId = uuidv4();
    const adminMessage: Message = {
      id: messageId,
      content: messageText,
      senderId: user?.id?.toString() || 'admin',
      senderName: user?.username || 'Admin',
      senderType: 'ADMIN',
      timestamp: new Date(),
    };

    // Thêm tin nhắn vào UI ngay lập tức
    setMessages((prev) => [...prev, adminMessage]);
    setInput('');

    try {
      // Lưu vào database trước
      const savedMessage = await ChatService.sendMessage({
        content: messageText,
        senderId: user?.id?.toString() || 'admin',
        senderName: user?.username || 'Admin',
        senderType: 'ADMIN',
        chatSessionId: selectedSession.id,
      });
      console.log('Message saved to database with ID:', savedMessage.id);
      
      // Gửi qua WebSocket kèm messageId và đánh dấu là đã lưu
      const wsMessage = {
        type: 'CHAT_MESSAGE',
        userId: user?.id?.toString() || 'admin',
        username: user?.username || 'Admin',
        content: messageText,
        sessionId: selectedSession.id,
        timestamp: Date.now(),
        messageId: messageId, // Client message ID
        savedToDatabase: true, // Đánh dấu là đã lưu trong database
        dbMessageId: savedMessage.id, // ID từ database
        senderType: 'ADMIN',
        sender: 'admin'
      };
      
      console.log('Sending WebSocket message with flag savedToDatabase=true:', wsMessage);
      socket.send(JSON.stringify(wsMessage));
      console.log('Message sent via WebSocket');
    } catch (err) {
      console.error('Error saving message:', err);
      enqueueSnackbar('Failed to send message', { variant: 'error' });
    }
  };

  // Xóa session
  const deleteChatSession = async () => {
    if (!selectedSession) return;
    try {
      await ChatService.deleteChatSession(selectedSession.id);
      
      // Explicitly send WebSocket notification about session deletion
      if (socket && socket.readyState === WebSocket.OPEN) {
        const deleteNotification = {
          type: 'SESSION_DELETED',
          sessionId: selectedSession.id,
          timestamp: Date.now()
        };
        socket.send(JSON.stringify(deleteNotification));
        console.log('Sent WebSocket notification about session deletion:', deleteNotification);
      }
      
      enqueueSnackbar('Chat session deleted successfully', { variant: 'success' });
      loadActiveSessions();
      loadHistorySessions();
      setSelectedSession(null);
    } catch (err) {
      console.error('Error deleting chat session:', err);
      enqueueSnackbar('Failed to delete chat session', { variant: 'error' });
    }
  };

  // Cuộn xuống cuối
  const scrollToBottom = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Render tin nhắn
  const renderMessage = (message: Message) => {
    const isAdmin = message.senderType === 'ADMIN';
    const isSystem = message.senderType === 'SYSTEM';
  return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: isAdmin ? 'flex-end' : 'flex-start',
          mb: 1,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: isAdmin ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {!isSystem && (
            <Avatar
              sx={{
                bgcolor: isAdmin ? 'primary.main' : 'secondary.main',
                width: 24,
                height: 24,
              }}
            >
              {message.senderName.charAt(0).toUpperCase()}
            </Avatar>
          )}
          <Typography variant="caption" color="text.secondary">
            {message.senderName} • {format(message.timestamp, 'HH:mm')}
              </Typography>
            </Box>
        <Paper
          sx={{
            p: 1,
            mt: 0.5,
            maxWidth: '80%',
            bgcolor: isSystem ? 'grey.100' : isAdmin ? 'primary.light' : 'secondary.light',
            color: isSystem ? 'text.primary' : 'white',
          }}
        >
          <Typography variant="body2">{message.content}</Typography>
        </Paper>
      </Box>
    );
  };

  // Giao diện chính
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fdfdfb' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1, bgcolor: 'primary.main', color: 'white' }}>
        <Typography variant="h6">Admin Chat Support</Typography>
        <Typography variant="caption">
          {connected ? 'Connected' : 'Disconnected'} • {loading ? ' Loading...' : ` ${activeSessions.length} active sessions`}
                    </Typography>
      </Box>
      <Box sx={{ display: 'flex', height: 'calc(100% - 64px)' }}>
        {/* Danh sách sessions */}
        <Box sx={{ width: 300, borderRight: 1, borderColor: 'divider', overflow: 'auto' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Active" icon={<ChatBubbleIcon />} />
            <Tab label="History" icon={<HistoryIcon />} />
          </Tabs>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : (
            <List>
              {(tabValue === 0 ? activeSessions : historySessions).map((session) => (
                <React.Fragment key={session.id}>
                    <ListItem
                      button
                    selected={selectedSession?.id === session.id}
                    onClick={() => loadSessionMessages(session)}
                      sx={{
                      py: 1.5,
                      px: 2,
                      bgcolor: selectedSession?.id === session.id ? 'action.selected' : 'transparent',
                    }}
                  >
                    <ListItemAvatar>
                      <Badge color="success" variant="dot" invisible={session.status !== 'ACTIVE'}>
                        <Avatar>{session.userName.charAt(0).toUpperCase()}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: session.unreadCount ? 'bold' : 'normal' }}
                        >
                          {session.userName}
                          {session.unreadCount ? (
                            <Chip
                              size="small"
                              label={session.unreadCount}
                              color="primary"
                              sx={{ ml: 1, height: 20 }}
                            />
                          ) : null}
                          </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {tabValue === 0
                            ? session.lastMessage || 'New session'
                            : `Ended ${format(new Date(session.endedAt!), 'dd/MM/yyyy HH:mm')}`}
                            </Typography>
                      }
                    />
                    </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
              {(tabValue === 0 ? activeSessions : historySessions).length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    {tabValue === 0 ? 'No active chat sessions' : 'No chat history'}
                  </Typography>
                </Box>
              )}
            </List>
              )}
            </Box>
        {/* Khu vực chat */}
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', bgcolor: '#fdfdfb' }}>
          {selectedSession ? (
            <>
            <Box
              sx={{
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                          display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 32, height: 32 }}>
                    {selectedSession.userName.charAt(0).toUpperCase()}
                        </Avatar>
                  <Box>
                    <Typography variant="subtitle1">{selectedSession.userName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Session started: {format(new Date(selectedSession.startedAt), 'dd/MM/yyyy HH:mm')}
                          </Typography>
                        </Box>
                      </Box>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={deleteChatSession}
                >
                  Delete Chat
                </Button>
              </Box>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <MessagesList messages={messages} renderMessage={renderMessage} scrollToBottom={scrollToBottom} />
              )}
              <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: '#fdfdfb' }}>
                <Grid container spacing={1} alignItems="center">
                  <Grid item xs>
                    <TextField
                      fullWidth
                      placeholder="Type a message..."
                      variant="outlined"
                      size="small"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      disabled={selectedSession.status === 'ENDED'}
                    />
                  </Grid>
                  <Grid item>
                    <IconButton
                      color="primary"
                      onClick={sendMessage}
                      disabled={!input.trim() || selectedSession.status === 'ENDED'}
                    >
                      <SendIcon />
                    </IconButton>
                  </Grid>
                </Grid>
            </Box>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%',
                p: 3,
              }}
            >
              <PersonAddIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6">Select a chat session</Typography>
              <Typography variant="body2" color="text.secondary">
                Select an active chat session from the list on the left to start chatting with a user.
              </Typography>
            </Box>
          )}
        </Box>
            </Box>
          </Box>
  );
};

export default AdminChat; 