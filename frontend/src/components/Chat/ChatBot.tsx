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
  Button,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
  Chat as ChatIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  Support as SupportIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import ChatService from '../../services/ChatService';
import { v4 as uuidv4 } from 'uuid';

// Define Message interface
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot' | 'admin' | 'system';
  timestamp: Date;
}

// Define WebSocket message interface
interface WebSocketMessage {
  type: string;
  userId?: string;
  username?: string;
  content?: string;
  timestamp?: number;
  senderType?: string;
  sessionId?: string;
  messageId?: string;
  adminId?: string;
  adminName?: string;
  adminCount?: number;
  message?: string;
  historical?: boolean;
  users?: Record<string, any>;
  isAnonymous?: boolean;
  sender?: string;
}

const ChatBot: React.FC = () => {
  // Get authentication context
  const { user, isAuthenticated } = useAuth();
  
  // UI state
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Chat state
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [chatWithAdmin, setChatWithAdmin] = useState(false);
  const [waitingForSupportResponse, setWaitingForSupportResponse] = useState(false);
  
  // WebSocket state
  const [socket, setSocket] = useState<WebSocket | null>(null);
  
  // Anonymous user info (for non-authenticated users)
  const [anonymousUserId] = useState<string>(() => {
    // Try to get stored anonymous ID or create a new one
    const storedId = localStorage.getItem('anonymousUserId');
    if (storedId) return storedId;
    
    const newId = uuidv4();
    localStorage.setItem('anonymousUserId', newId);
    return newId;
  });
  
  const [anonymousUsername] = useState<string>(() => {
    const storedName = localStorage.getItem('anonymousUsername');
    if (storedName) return storedName;
    
    const newName = `Guest_${anonymousUserId.substring(0, 6)}`;
    localStorage.setItem('anonymousUsername', newName);
    return newName;
  });
  
  // Create a separate axios instance for anonymous users
  const anonymousAxios = axios.create();
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const reconnectAttemptsRef = useRef(0);
  const [hasShownConnectionError, setHasShownConnectionError] = useState(false);
  const [hasShownSystemNotifications, setHasShownSystemNotifications] = useState({
    supportConnecting: false,
    adminConnected: false,
    adminDisconnected: false,
    sessionNotFound: false,
    chatEnded: false,
    noAdminsOnline: false
  });

  // Initial greeting when chat opens
  useEffect(() => {
    if (open && messages.length === 0) {
      // Loại bỏ thông báo chào ban đầu
      // Không thêm bất kỳ tin nhắn hệ thống nào ban đầu
    }
  }, [open, user, messages.length]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check for stored session on mount - chỉ kiểm tra chứ không tự tạo mới
  useEffect(() => {
    // Kiểm tra nếu có session trong localStorage
    const storedSessionId = localStorage.getItem('chatSessionId');
    if (storedSessionId) {
      // Chỉ lưu vào state, không kết nối ngay
      setCurrentSessionId(storedSessionId);
      
      // Kiểm tra session có tồn tại không khi user mở chat
      const verifySession = async () => {
        try {
          const exists = await ChatService.verifySessionExists(storedSessionId);
          if (!exists) {
            // Session không tồn tại, xóa khỏi localStorage
            console.log(`Stored session ${storedSessionId} no longer exists, removing from localStorage`);
            localStorage.removeItem('chatSessionId');
            setCurrentSessionId(null);
            
            // Loại bỏ thông báo hệ thống về session không tồn tại
          } else {
            // Session vẫn tồn tại, chỉ tải tin nhắn khi người dùng mở chat
            if (open) {
              checkActiveSession(storedSessionId);
            }
          }
        } catch (err) {
          console.error('Error verifying stored session:', err);
          // Giữ session ID trong state, sẽ kiểm tra lại khi user nhắn tin
        }
      };
      
      // Chỉ kiểm tra khi user mở chat
      if (open) {
        verifySession();
      }
    }
  }, [open]); // Chỉ chạy lại khi chat được mở
  
  // WebSocket connection management
  useEffect(() => {
    // Chỉ kết nối khi có session hợp lệ và đang chat với admin
    if (chatWithAdmin && currentSessionId) {
      connectToWebSocket();
    } else {
      console.log('Not connected to WebSocket - not chatting with admin or no session ID');
    }

    return () => {
      // Clean up WebSocket connection on unmount or before reconnect
      if (socket) {
        console.log('Closing WebSocket connection due to effect cleanup');
        socket.close();
        setSocket(null);
      }

      // Clear reconnect timers
      if (reconnectAttemptsRef.current) {
        clearInterval(reconnectAttemptsRef.current);
        reconnectAttemptsRef.current = 0;
      }
    };
  }, [chatWithAdmin, currentSessionId]);
  
  // Reset connection error flags when currentSessionId changes
  useEffect(() => {
    if (!currentSessionId) {
      // Khi không có session, reset các flag để tránh vòng lặp vô hạn
      setHasShownConnectionError(false);
      reconnectAttemptsRef.current = 0;
      console.log('Reset connection error flags due to no session ID');
    }
  }, [currentSessionId]);
  
  // Function to connect to WebSocket - session phải tồn tại
  const connectToWebSocket = async () => {
    // Đừng cố kết nối nếu không có session hợp lệ
    if (!currentSessionId) {
      console.log('No valid session ID, cannot connect to WebSocket');
      return;
    }
    
    try {
      // Verify session exists before attempting connection
      let sessionExists = false;
      try {
        sessionExists = await ChatService.verifySessionExists(currentSessionId);
        if (!sessionExists) {
          console.log(`Session ${currentSessionId} not found when trying to connect WebSocket`);
          
          // Session no longer exists - clear related data
          localStorage.removeItem('chatSessionId');
          setCurrentSessionId(null);
          setChatWithAdmin(false);
          
          // Loại bỏ thông báo về session hết hạn
          return; // Dừng thực thi hàm
        }
      } catch (err) {
        console.error('Error verifying session before WebSocket connection:', err);
        // Continue despite error - server will validate session
      }
      
      // Close any existing socket
      if (socket && socket.readyState !== WebSocket.CLOSED) {
        socket.close();
      }

      // Lấy token từ localStorage để xác thực với WebSocket
      const token = localStorage.getItem('user') ? 
        JSON.parse(localStorage.getItem('user')!).accessToken : null;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.hostname;
      const port = host === 'localhost' ? ':8089' : ''; // Only use port in development
      
      // Thêm token vào URL để xác thực
      const wsUrl = token 
        ? `${wsProtocol}//${host}${port}/chat?token=${encodeURIComponent(token)}`
        : `${wsProtocol}//${host}${port}/chat`;
      
      console.log('Connecting to WebSocket at:', wsUrl);
      
      const newSocket = new WebSocket(wsUrl);
      
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (newSocket.readyState !== WebSocket.OPEN) {
          console.error('WebSocket connection timeout');
          newSocket.close();
          
          // Giữ lại thông báo về lỗi kết nối nhưng chỉ hiển thị một lần
          if (!hasShownConnectionError) {
            const errorMessage: Message = {
              id: generateMessageId(),
              text: 'Đang kết nối lại với máy chủ...',
              sender: 'system',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
            setHasShownConnectionError(true);
          }
          setLoading(false);
          setWaitingForSupportResponse(false);
        }
      }, 5000);
      
      newSocket.onopen = () => {
        console.log('WebSocket connection established');
        clearTimeout(connectionTimeout);
        // Reset reconnection count on successful connection
        reconnectAttemptsRef.current = 0;
        setHasShownConnectionError(false);
        
        // Send user connect message
        if (currentSessionId) {
          setChatWithAdmin(true); // Always set chat with admin to true when connected
          
          // Thêm thông tin xác thực trong tin nhắn connect
          const token = localStorage.getItem('user') ? 
            JSON.parse(localStorage.getItem('user')!).accessToken : null;
          
          const connectMsg = {
            type: 'USER_CONNECT',
            userId: isAuthenticated && user?.id ? user.id.toString() : anonymousUserId,
            username: isAuthenticated && user?.username ? user.username : anonymousUsername,
            isAnonymous: !isAuthenticated,
            sessionId: currentSessionId,
            timestamp: new Date().getTime(),
            senderType: 'USER',
            sender: 'user',
            token: token // Thêm token vào tin nhắn kết nối
          };
          
          newSocket.send(JSON.stringify(connectMsg));
          console.log('Sent USER_CONNECT message:', connectMsg);
        } else {
          console.warn('WebSocket connected but no currentSessionId available');
          
          // Loại bỏ thông báo khi không có session ID
        }
      };
      
      newSocket.onmessage = (event) => {
        console.log('Received message from server:', event.data);
        try {
          const parsedData = JSON.parse(event.data);
          handleWebSocketMessage(parsedData);
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };
      
      newSocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        clearTimeout(connectionTimeout);
        
        // Xóa socket hiện tại
        setSocket(null);
        
        // Nếu đóng kết nối sạch sẽ hoặc không có session, không cần kết nối lại
        if (event.wasClean || !currentSessionId) {
          console.log('WebSocket closed cleanly or no session ID, no reconnect needed');
          reconnectAttemptsRef.current = 0;
          return;
        }
        
        // Kiểm tra xem có nên thử kết nối lại không
        const checkSessionAndReconnect = async () => {
          // Nếu đã vượt quá số lần thử lại, không kết nối nữa
          if (reconnectAttemptsRef.current >= 3) {
            console.log('Max reconnect attempts reached (3), giving up');
            
            // Giữ lại thông báo về đã đạt giới hạn kết nối lại
            const maxRetryMessage: Message = {
              id: generateMessageId(),
              text: "Không thể kết nối lại. Vui lòng gửi tin nhắn mới.",
              sender: 'system' as 'system',
              timestamp: new Date(),
            };
            setMessages(prev => [...prev, maxRetryMessage]);
            
            // Reset trạng thái
            reconnectAttemptsRef.current = 0;
            setHasShownConnectionError(false);
            return;
          }
          
          // Tăng số lần thử kết nối lại
          reconnectAttemptsRef.current += 1;
          
          // Kiểm tra session có tồn tại không trước khi thử kết nối lại
          try {
            const sessionExists = await ChatService.verifySessionExists(currentSessionId);
            
            if (!sessionExists) {
              console.log('Session no longer exists, will not attempt to reconnect');
              
              // Xóa thông tin session
              localStorage.removeItem('chatSessionId');
              setCurrentSessionId(null);
              setChatWithAdmin(false);
              
              // Loại bỏ thông báo về session không tồn tại
              
              // Reset trạng thái reconnect
              reconnectAttemptsRef.current = 0;
              setHasShownConnectionError(false);
              return;
            }
            
            // Session tồn tại, hiển thị thông báo kết nối lại nếu chưa hiển thị
            if (!hasShownConnectionError) {
              const disconnectMessage: Message = {
                id: generateMessageId(),
                text: 'Mất kết nối đến máy chủ. Đang kết nối lại...',
                sender: 'system' as 'system',
                timestamp: new Date(),
              };
              setMessages(prev => [...prev, disconnectMessage]);
              setHasShownConnectionError(true);
            }
            
            // Thử kết nối lại sau 3 giây
            console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/3)...`);
            setTimeout(() => {
              // Kiểm tra một lần nữa trước khi kết nối
              if (currentSessionId) {
                connectToWebSocket();
              }
            }, 3000);
          } catch (err) {
            console.error('Error checking session existence before reconnect:', err);
            
            // Xóa session vì không thể xác minh
            localStorage.removeItem('chatSessionId');
            setCurrentSessionId(null);
            setChatWithAdmin(false);
            
            // Loại bỏ thông báo lỗi về session không tồn tại
            
            // Reset trạng thái
            reconnectAttemptsRef.current = 0;
            setHasShownConnectionError(false);
          }
        };
        
        // Chạy kiểm tra session và kết nối lại
        checkSessionAndReconnect();
      };
      
      newSocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        clearTimeout(connectionTimeout);
        
        // Giữ lại thông báo về lỗi kết nối và đang thử kết nối lại
        if (!hasShownConnectionError) {
          const errorMessage: Message = {
            id: generateMessageId(),
            text: 'Đang kết nối lại với máy chủ...',
            sender: 'system',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          setHasShownConnectionError(true);
        }
        setLoading(false);
      };
      
      setSocket(newSocket);
    } catch (err) {
      console.error('Error connecting to WebSocket:', err);
      
      // Giữ lại thông báo về lỗi kết nối và đang thử kết nối lại
      if (!hasShownConnectionError) {
        const errorMessage: Message = {
          id: generateMessageId(),
          text: 'Đang kết nối lại với máy chủ...',
          sender: 'system',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setHasShownConnectionError(true);
      }
      setLoading(false);
      
      // Always attempt to reconnect
      setTimeout(() => {
        if (currentSessionId) {
          connectToWebSocket();
        }
      }, 5000);
    }
  };

  // Utility function to generate unique message IDs
  let messageCounter = 0; // Counter to ensure uniqueness
  const generateMessageId = (): string => {
    // Tạo ID duy nhất bằng cách kết hợp timestamp, counter và một phần của uuid
    messageCounter += 1;
    const timestamp = new Date().getTime();
    const randomPart = uuidv4().substring(0, 8);
    return `msg_${timestamp}_${messageCounter}_${randomPart}`;
  };
  
  // Scroll chat to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Toggle chat open/closed
  const toggleChat = () => {
    setOpen(!open);
  };

  // Handle input field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  // Handle Enter key press in input field
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Check if a stored session is still active
  const checkActiveSession = async (sessionId: string) => {
    try {
      console.log('Checking if session is still active:', sessionId);
      
      // Verify session exists in database
      const sessionExists = await ChatService.verifySessionExists(sessionId);
      if (!sessionExists) {
        console.log(`Session ${sessionId} not found in database during verification`);
        
        // Session no longer exists - remove from storage
        localStorage.removeItem('chatSessionId');
        setCurrentSessionId(null);
        setChatWithAdmin(false);
        
        // Loại bỏ thông báo về session không tồn tại
        return;
      }
      
      // Session exists - get details and check if active
      const session = await ChatService.getChatSessionById(sessionId);
      if (session && session.status === 'ACTIVE') {
        console.log('Found active session:', session);
        
        // Reset notification flags for the existing active session
        setHasShownSystemNotifications({
          supportConnecting: true, // Mark as shown since this is an existing session
          adminConnected: false,
          adminDisconnected: false,
          sessionNotFound: false,
          chatEnded: false,
          noAdminsOnline: false
        });
        
        // Load messages for valid session
        try {
          // Load messages from the session
          const messages = await ChatService.getMessagesByChatSession(sessionId);
          
          if (messages && messages.length > 0) {
            // Convert API messages to UI format
            const formattedMessages: Message[] = messages.map(msg => ({
              id: (msg.id || generateMessageId()).toString(),
              text: msg.content,
              sender: msg.senderType === 'ADMIN' ? 'admin' :
                    msg.senderType === 'SYSTEM' ? 'system' : 'user',
              timestamp: msg.createdAt ? new Date(msg.createdAt) : new Date(),
            }));
            
            setMessages(formattedMessages);
            
            // Check if we were chatting with an admin in this session
            const hasAdminMessages = messages.some(msg => msg.senderType === 'ADMIN');
            if (hasAdminMessages) {
              setChatWithAdmin(true);
              
              // Only connect to WebSocket if admin messages exist - indicating active admin support
              connectToWebSocket();
            }
          } else {
            // No messages in the session - don't automatically connect
            console.log('Session exists but has no messages - waiting for user to send first message');
            
            // Just set chatWithAdmin to true so messages go to this session
            setChatWithAdmin(true);
          }
        } catch (error) {
          console.error(`Error loading messages for session ${sessionId}`, error);
          
          // Session exists but messages couldn't be loaded
          localStorage.removeItem('chatSessionId');
          setCurrentSessionId(null);
          setChatWithAdmin(false);
          
          // Loại bỏ thông báo về lỗi không tải được tin nhắn
        }
      } else {
        // Session exists but is not active - likely ended
        console.log('Session is not active:', session);
        localStorage.removeItem('chatSessionId');
        setCurrentSessionId(null);
        setChatWithAdmin(false);
        
        // Loại bỏ thông báo về session đã kết thúc
      }
    } catch (err) {
      console.error('Error checking active session:', err);
      // Clear invalid session data
      localStorage.removeItem('chatSessionId');
      setCurrentSessionId(null);
      setChatWithAdmin(false);
      
      // Loại bỏ thông báo về lỗi session
    }
  };

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    const messageText = input.trim();
    setInput(''); // Clear input immediately to improve UX
    
    // Create and add user message to chat
    const userMessage: Message = {
      id: generateMessageId(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    scrollToBottom();
    
    // Nếu đã có session hợp lệ, kiểm tra trạng thái trước khi gửi
    if (chatWithAdmin && currentSessionId) {
      try {
        // Kiểm tra session có tồn tại trước khi gửi
        const sessionExists = await ChatService.verifySessionExists(currentSessionId);
        
        if (!sessionExists) {
          console.log('Session no longer exists, creating a new one');
          // Loại bỏ thông báo về session không tồn tại và đang tạo session mới
          
          // Reset session và tạo mới
          setCurrentSessionId(null);
          setChatWithAdmin(false);
          localStorage.removeItem('chatSessionId');
          
          // Đóng kết nối cũ nếu có
          if (socket) {
            socket.close();
            setSocket(null);
          }
          
          // Tạo session mới và gửi tin nhắn
          await createNewSessionAndSendMessage(messageText);
          return;
        }
      } catch (err) {
        console.warn('Error verifying session existence:', err);
        // Continue with normal flow and let the server handle errors
      }
    }
    
    // Nếu đã kết nối tới admin và có session hợp lệ
    if (chatWithAdmin && socket && socket.readyState === WebSocket.OPEN && currentSessionId) {
      try {
        // Gửi tin nhắn qua API và lưu vào database
        const savedMessage = await ChatService.sendMessageWithVerification({
          content: messageText,
          senderId: isAuthenticated && user?.id ? user.id.toString() : anonymousUserId,
          senderName: isAuthenticated && user?.username ? user.username : anonymousUsername,
          senderType: 'USER',
          chatSessionId: currentSessionId
        });
        
        // Gửi qua WebSocket với đánh dấu tin nhắn đã được lưu trong database
        const wsMessage = {
          type: 'CHAT_MESSAGE',
          userId: isAuthenticated && user?.id ? user.id.toString() : anonymousUserId,
          username: isAuthenticated && user?.username ? user.username : anonymousUsername,
          content: messageText,
          sessionId: currentSessionId,
          timestamp: new Date().getTime(),
          messageId: userMessage.id, // Client message ID
          savedToDatabase: true, // Đánh dấu tin nhắn đã được lưu trong database
          dbMessageId: savedMessage.id, // ID từ database
          senderType: 'USER',
          sender: 'user'
        };
        
        socket.send(JSON.stringify(wsMessage));
        console.log('Message sent to WebSocket with savedToDatabase=true');
      } catch (err: any) {
        // Xử lý lỗi nếu session không tồn tại hoặc các lỗi khác
        console.error('Error sending message:', err);
        
        const errorMessage = err.response?.data?.message || err.message || err.toString();
        const isSessionError = errorMessage.includes('Session') && 
          (errorMessage.includes('not exist') || errorMessage.includes('not found'));
          
        if (isSessionError) {
          // Loại bỏ thông báo về session không tồn tại và đang tạo session mới
          
          // Reset trạng thái và tạo session mới
          setCurrentSessionId(null);
          setChatWithAdmin(false);
          localStorage.removeItem('chatSessionId');
          
          if (socket) {
            socket.close();
            setSocket(null);
          }
          
          await createNewSessionAndSendMessage(messageText);
        }
      }
      
      return;
    }
    
    // Không có session - tạo mới và gửi tin nhắn
    setLoading(true);
    setWaitingForSupportResponse(true);
    await createNewSessionAndSendMessage(messageText);
  };
  
  // Helper function to create new session and send message
  const createNewSessionAndSendMessage = async (messageText: string) => {
    try {
      setLoading(true);
      
      // Check if user is logged in and create chat session if needed
      const userId = isAuthenticated && user?.id ? user.id.toString() : anonymousUserId;
      const username = isAuthenticated && user?.username ? user.username : anonymousUsername;
      const isAnon = !isAuthenticated;
      
      console.log('Creating new chat session for user:', userId, username);
      
      // Create a new session and save the message
      const messageId = generateMessageId();
      const response = await ChatService.createChatSession(
        userId,
        username,
        isAnon,
        true
      );
      if (response) {
        setCurrentSessionId(response.id);
        
        // Reset notification flags for the new session
        setHasShownSystemNotifications({
          supportConnecting: false,
          adminConnected: false,
          adminDisconnected: false,
          sessionNotFound: false,
          chatEnded: false,
          noAdminsOnline: false
        });
        
        // Verify the session actually exists in the database
        let sessionExists = false;
        try {
          sessionExists = await ChatService.verifySessionExists(response.id);
          if (!sessionExists) {
            console.error(`Created session ${response.id} not found in database when verifying!`);
            throw new Error('Session created but not found in database. Try again.');
          }
        } catch (err) {
          console.error('Error verifying session existence:', err);
          // Loại bỏ thông báo lỗi và dừng
          setCurrentSessionId(null); // Xóa session ID không hợp lệ
          setLoading(false);
          setWaitingForSupportResponse(false);
          return; // Dừng hàm, không tiếp tục xử lý
        }
        
        // Save session ID to localStorage
        try {
          localStorage.setItem('chatSessionId', response.id);
        } catch (err) {
          console.error('Error saving session ID to localStorage:', err);
        }
        
        // Thử lưu tin nhắn vào database
        let messageSaved = false;
        try {
          const savedMessage = await ChatService.sendMessage({
            content: messageText,
            senderId: userId,
            senderName: username,
            senderType: 'USER',
            chatSessionId: response.id
          });
          messageSaved = true;
          console.log('User message saved to database with ID:', savedMessage.id);
          
          // Tin nhắn đã được lưu qua API, khi gửi qua WebSocket cần gửi kèm messageId
          if (socket && socket.readyState === WebSocket.OPEN) {
            const wsMessage = {
              type: 'CHAT_MESSAGE',
              userId: userId,
              username: username,
              content: messageText,
              sessionId: response.id,
              timestamp: new Date().getTime(),
              messageId: messageId, // Client message ID
              savedToDatabase: true, // Đánh dấu là đã lưu trong database
              dbMessageId: messageId, // Dùng cùng ID vì đã được lưu trước đó
              senderType: 'USER',
              sender: 'user'
            };
            socket.send(JSON.stringify(wsMessage));
            console.log('Message sent to WebSocket with savedToDatabase=true');
          }
        } catch (err) {
          console.error('Error saving initial message to new session:', err);
          
          // Kiểm tra lại xem session có còn tồn tại không
          try {
            const sessionStillExists = await ChatService.verifySessionExists(response.id);
            if (!sessionStillExists) {
              throw new Error('Session disappeared after creation. Please try again.');
            }
          } catch (checkErr) {
            console.error('Error checking if session still exists:', checkErr);
            // Loại bỏ thông báo lỗi gửi tin nhắn
            setCurrentSessionId(null);
            localStorage.removeItem('chatSessionId');
            setLoading(false);
            setWaitingForSupportResponse(false);
            return; // Dừng hàm, không tiếp tục xử lý
          }
        }
        
        // Gửi tin nhắn hệ thống nếu lưu tin nhắn thành công
        if (messageSaved) {
          try {
            await ChatService.sendSystemMessage(
              "Connecting you to a support agent. Please wait a moment...",
              response.id,
              userId
            );
            console.log('System message saved successfully to session:', response.id);
          } catch (err) {
            console.error('Error saving system message to new session:', err);
            // Tiếp tục xử lý ngay cả khi tin nhắn hệ thống thất bại
          }
        }
        
        // Connect to admin
        setChatWithAdmin(true);
        connectToWebSocket();
        
        // Loại bỏ thông báo hệ thống về đã kết nối tới hỗ trợ
        
        // Wait for WebSocket to connect before trying to send the message there
        // If WebSocket isn't available, the message is already saved in the database
        // When the WebSocket connects later, it will fetch message history
        setTimeout(() => {
          if (socket && socket.readyState === WebSocket.OPEN) {
            const wsMessage = {
              type: 'CHAT_MESSAGE',
              userId: userId,
              username: username,
              content: messageText,
              sessionId: response.id,
              timestamp: new Date().getTime(),
              messageId: messageId, // Client message ID
              savedToDatabase: true, // Đánh dấu là đã lưu trong database
              dbMessageId: messageId, // Dùng cùng ID vì đã được lưu trước đó
              senderType: 'USER',
              sender: 'user'
            };
            socket.send(JSON.stringify(wsMessage));
            console.log('Message sent to WebSocket with savedToDatabase=true');
          } else {
            console.log('WebSocket not ready, message will be delivered through history when connected');
          }
        }, 1000); // Give WebSocket time to connect
        
        setLoading(false);
        setTimeout(() => setWaitingForSupportResponse(false), 1000);
      }
    } catch (err) {
      console.error('Error in overall process of creating session and sending message:', err);
      
      // Đảm bảo đã xóa mọi dữ liệu session không hợp lệ
      setCurrentSessionId(null);
      localStorage.removeItem('chatSessionId');
      setChatWithAdmin(false);
      
      // Loại bỏ thông báo lỗi kết nối
      
      setLoading(false);
      setWaitingForSupportResponse(false);
    }
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data: WebSocketMessage) => {
    switch (data.type) {
      case 'CONNECTION_ESTABLISHED':
        console.log('Connection established with WebSocket server');
        if (data.sessionId) {
          setCurrentSessionId(data.sessionId);
          try {
            localStorage.setItem('chatSessionId', data.sessionId);
          } catch (err) {
            console.error('Error storing session ID:', err);
          }
        }
        break;
        
      case 'CHAT_MESSAGE':
        // Handle incoming chat message
        if (data.content) {
          // Determine sender from either sender or senderType field
          const sender = data.sender === 'admin' || data.senderType?.toLowerCase() === 'admin' ? 'admin' : 
                         data.sender === 'system' || data.senderType?.toLowerCase() === 'system' ? 'system' : 'user';
          
          // Check if this is a duplicate message (if we sent it)
          if (sender === 'user' && messages.some(m => 
              m.text === data.content && 
              m.sender === 'user' && 
              new Date().getTime() - m.timestamp.getTime() < 3000)) {
            // Skip duplicate messages we likely just sent
            return;
          }
          
          // Ensure message ID is always unique by generating one if not provided or adding a prefix
          const messageId = data.messageId ? `server_${data.messageId}` : generateMessageId();
          
          const newMessage: Message = {
            id: messageId,
            text: data.content,
            sender: sender,
            timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
          };
          
          setMessages(prevMessages => [...prevMessages, newMessage]);
          scrollToBottom();
          
          // If this is the first admin message, set waiting to false
          if (sender === 'admin' && waitingForSupportResponse) {
            setWaitingForSupportResponse(false);
          }
        }
        break;
        
      case 'SESSION_NOT_FOUND':
        // Handle case where server couldn't find the session
        console.error('Server reported session not found:', data.sessionId);
        
        // Clear the invalid session
        setCurrentSessionId(null);
        localStorage.removeItem('chatSessionId');
        setChatWithAdmin(false);
        
        // Loại bỏ thông báo về session không tìm thấy
        
        // Close the socket
        if (socket) {
          socket.close();
          setSocket(null);
        }
        
        setLoading(false);
        setWaitingForSupportResponse(false);
        break;
        
      case 'MESSAGE_DELIVERED':
        // Message delivery confirmation
        console.log('Message delivered, admin count:', data.adminCount);
        if (data.adminCount !== undefined && data.adminCount === 0 && waitingForSupportResponse) {
          // Loại bỏ thông báo không có admin online
          setWaitingForSupportResponse(false);
        }
        break;
        
      case 'ADMIN_CONNECTED':
        // Admin connected to the chat
        if (data.adminName) {
          // Loại bỏ thông báo admin đã tham gia
          setWaitingForSupportResponse(false);
        }
        break;
        
      case 'SESSION_DELETED':
        console.log('Chat session deleted by admin');
        // Clear the session from state and localStorage
        setCurrentSessionId(null);
        setChatWithAdmin(false);
        
        // Giữ lại thông báo về session bị xóa vì đây là thông tin quan trọng
        setMessages(prev => [
          ...prev,
          {
            id: uuidv4(),
            text: 'Phiên chat đã bị xóa. Vui lòng tạo phiên chat mới nếu cần hỗ trợ.',
            sender: 'system',
            timestamp: new Date(),
          },
        ]);
        
        try {
          localStorage.removeItem('chatSessionId');
          console.log('Removed chat session ID from localStorage');
        } catch (err) {
          console.error('Error removing chat session from localStorage:', err);
        }
        
        // Reset WebSocket connection
        if (socket) {
          socket.close();
          setSocket(null);
        }
        
        // Allow user to start a new chat
        setTimeout(() => {
          setChatWithAdmin(false);
          setWaitingForSupportResponse(false);
        }, 3000);
        break;
        
      case 'CHAT_ENDED':
        // Chat has ended
        setChatWithAdmin(false);
        setCurrentSessionId(null);
        
        // Loại bỏ thông báo về chat đã kết thúc
        
        // Clean up
        if (socket) {
          socket.close();
          setSocket(null);
        }
        
        try {
          localStorage.removeItem('chatSessionId');
        } catch (err) {
          console.error('Error removing session ID:', err);
        }
        break;
        
      case 'ADMIN_DISCONNECT':
        // Loại bỏ thông báo admin đã rời đi
        break;
        
      case 'ERROR':
        // Error message from server
        console.error('Error from WebSocket server:', data.message);
        
        // Check if the error is related to constraint violations or session not found
        const errorMessage = data.message || "";
        const errorLower = errorMessage.toLowerCase();
        const isSessionError = 
            errorLower.includes('session') && 
            (errorLower.includes('not found') || errorLower.includes('invalid') || errorLower.includes('expired'));
        const isConstraintError = 
            errorLower.includes('constraint') || 
            errorLower.includes('foreign key') || 
            errorLower.includes('violation') ||
            errorLower.includes('could not execute statement');
          
        if (isSessionError || isConstraintError) {
          console.log('Detected session error or constraint violation in WebSocket message:', errorMessage);
          
          // Clear the invalid session
          setCurrentSessionId(null);
          localStorage.removeItem('chatSessionId');
          setChatWithAdmin(false);
          
          // Loại bỏ thông báo về lỗi session
          
          // Close the socket to force reconnection with a new session
          if (socket) {
            socket.close();
            setSocket(null);
          }
        } else {
          // Loại bỏ các thông báo lỗi chung
        }
        
        setWaitingForSupportResponse(false);
        break;
        
      default:
        console.log('Unhandled message type:', data.type);
    }
  };

  // Disconnect from chat (end the session)
  const disconnectChat = () => {
    if (chatWithAdmin) {
      // If we're currently chatting with an admin
      if (socket && socket.readyState === WebSocket.OPEN && currentSessionId) {
        // Send explicit end chat message instead of just closing the socket
        const endChatMessage = {
          type: 'END_CHAT',
          userId: isAuthenticated && user?.id ? user.id.toString() : anonymousUserId,
          username: isAuthenticated && user?.username ? user.username : anonymousUsername,
          sessionId: currentSessionId,
          timestamp: Date.now(),
          content: "User has ended the chat session",
          sender: 'user',
          senderType: 'USER'
        };
        socket.send(JSON.stringify(endChatMessage));
        console.log('Sent END_CHAT message:', endChatMessage);
        
        // Also make an API request to ensure the session is ended server-side
        ChatService.endChatSession(currentSessionId)
          .then(response => {
            console.log('Chat session ended via API:', response);
          })
          .catch(error => {
            console.error('Failed to end chat session via API:', error);
          });
      }
      
      setChatWithAdmin(false);
      setCurrentSessionId(null); // Clear the session ID
      
      // Remove any stored session ID from localStorage
      try {
        localStorage.removeItem('chatSessionId');
        console.log('Removed chat session ID from localStorage');
      } catch (err) {
        console.error('Error removing chat session from localStorage:', err);
      }
      
      if (socket) {
        socket.close();
        setSocket(null);
      }
      
      // Add disconnection notification
      
    }
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
            {chatWithAdmin ? <SupportIcon sx={{ mr: 1 }} /> : <SupportIcon sx={{ mr: 1 }} />}
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Support Chat
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
                    pr: message.sender === 'bot' || message.sender === 'admin' || message.sender === 'system' ? 2 : 0,
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
                        bgcolor: message.sender === 'user' ? 'secondary.main' : 
                                message.sender === 'admin' ? 'error.main' :
                                message.sender === 'system' ? 'info.main' : 'primary.main',
                        width: 32,
                        height: 32,
                        mr: message.sender === 'user' ? 0 : 1,
                        ml: message.sender === 'user' ? 1 : 0,
                      }}
                    >
                      {message.sender === 'user' ? <PersonIcon fontSize="small" /> : 
                       message.sender === 'admin' ? <SupportIcon fontSize="small" /> : 
                       <BotIcon fontSize="small" />}
                    </Avatar>
                    <Box
                      sx={{
                        maxWidth: '75%',
                        bgcolor: message.sender === 'user' ? 'secondary.light' : 
                                message.sender === 'admin' ? 'error.light' :
                                message.sender === 'system' ? 'info.light' : 'white',
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
                    <Avatar sx={{ bgcolor: chatWithAdmin ? 'error.main' : 'primary.main', width: 32, height: 32, mr: 1 }}>
                      {chatWithAdmin ? <SupportIcon fontSize="small" /> : <BotIcon fontSize="small" />}
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