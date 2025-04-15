import axios from 'axios';
import api from '../services/api';
import { API_URL } from '../config';
import authService from './authService';

// Define types for the chat service
export interface ChatMessage {
    id?: number | string;
    content: string;
    senderId: string;
    senderName: string;
    receiverId?: string;
    senderType: 'USER' | 'ADMIN' | 'SYSTEM';
    chatSessionId: string;
    createdAt?: string;
    read?: boolean;
}

export interface ChatSession {
    id: string;
    userId: string;
    userName: string;
    status: 'ACTIVE' | 'ENDED';
    startedAt: string;
    endedAt?: string;
    lastMessage?: string;
    unreadCount?: number;
}

class ChatService {
    // Base URL for API calls (đã bao gồm tiền tố '/api/chat' từ controller)
    // API_URL đã là 'http://localhost:8080' từ config.ts
    
    // Helper method to log auth headers for debugging
    private logAuthHeaders() {
        const user = authService.getCurrentUser();
        console.log('Current user roles:', user?.roles);
        console.log('Is user admin?', user?.roles?.includes('ROLE_ADMIN'));
        console.log('Auth token present?', !!user?.accessToken || !!(user as any)?.token);
        
        // Check token format
        const token = user?.accessToken || (user as any)?.token;
        if (token) {
            console.log('Token format valid?', token.startsWith('ey'));
            console.log('Token length:', token.length);
        }
        
        return authService.getAuthHeader();
    }
    
    // Get active chat sessions (for admin)
    async getActiveChatSessions() {
        console.log('Calling getActiveChatSessions - admin endpoint');
        this.logAuthHeaders();
        
        try {
            const response = await api.get<ChatSession[]>(`/api/chat/sessions/active`);
            console.log('Active chat sessions response:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Error getting active chat sessions:', error.message);
            console.error('Error response status:', error.response?.status);
            console.error('Error response data:', error.response?.data);
            throw error;
        }
    }
    
    // Get all chat sessions (for admin)
    async getAllChatSessions() {
        console.log('Calling getAllChatSessions - admin endpoint');
        this.logAuthHeaders();
        
        try {
            const response = await api.get<ChatSession[]>(`/api/chat/sessions/all`);
            return response.data;
        } catch (error: any) {
            console.error('Error getting all chat sessions:', error.message);
            console.error('Error response status:', error.response?.status);
            console.error('Error response data:', error.response?.data);
            throw error;
        }
    }
    
    // Get chat history for a user
    async getUserChatHistory(userId: string) {
        // Use 'api' instance to ensure auth headers are included
        const response = await api.get<ChatSession[]>(`/api/chat/sessions/user/${userId}`);
        return response.data;
    }
    
    // Get active chat session for a user or create a new one
    async getOrCreateActiveChatSession(userId: string) {
        const response = await api.get<ChatSession>(`/api/chat/sessions/user/${userId}/active`);
        return response.data;
    }
    
    // Create a new chat session
    async createChatSession(userId: string, username: string, isAnonymous = false, requestSupport = true) {
        console.log(`Creating chat session for user ${userId} (${username}), anonymous: ${isAnonymous}`);
        try {
            const response = await api.post<ChatSession>(`/api/chat/sessions`, {
                userId,
                username,
                isAnonymous,
                requestSupport
            });
            
            if (!response.data || !response.data.id) {
                console.error('Error creating chat session: No valid session returned from server');
                throw new Error('Failed to create chat session: Invalid response');
            }
            
            console.log(`Successfully created chat session: ${response.data.id}`);
            return response.data;
        } catch (error: any) {
            console.error('Error creating chat session:', error);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            throw error;
        }
    }
    
    // Verify if a session exists in the database
    async verifySessionExists(sessionId: string): Promise<boolean> {
        try {
            console.log(`Verifying if session ${sessionId} exists`);
            const response = await api.get<ChatSession>(`/api/chat/sessions/${sessionId}`);
            const exists = !!response.data && !!response.data.id;
            console.log(`Session ${sessionId} exists: ${exists}`);
            return exists;
        } catch (error: any) {
            console.error(`Error verifying session ${sessionId}:`, error);
            if (error.response?.status === 404) {
                console.log(`Session ${sessionId} not found (404)`);
                return false;
            }
            // If other error, assume session doesn't exist to be safe
            return false;
        }
    }
    
    // Send a message with verification
    async sendMessageWithVerification(message: Omit<ChatMessage, 'id' | 'createdAt' | 'read'>): Promise<ChatMessage> {
        // First verify the session exists
        const sessionExists = await this.verifySessionExists(message.chatSessionId);
        
        if (!sessionExists) {
            throw new Error(`Cannot send message: Session ${message.chatSessionId} does not exist`);
        }
        
        // Session exists, proceed with sending the message
        return this.sendMessage(message);
    }
    
    // Get messages for a chat session
    async getMessagesByChatSession(sessionId: string) {
        const response = await api.get<ChatMessage[]>(`/api/chat/messages/session/${sessionId}`);
        return response.data;
    }
    
    // Send a message
    async sendMessage(message: Omit<ChatMessage, 'id' | 'createdAt' | 'read'>) {
        console.log(`Sending message to session ${message.chatSessionId}`);
        try {
            const response = await api.post<ChatMessage>(`/api/chat/messages`, message);
            console.log(`Message sent successfully to session ${message.chatSessionId}`);
            return response.data;
        } catch (error: any) {
            console.error(`Error sending message to session ${message.chatSessionId}:`, error);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            throw error;
        }
    }
    
    // Send a system message
    async sendSystemMessage(content: string, chatSessionId: string, userId?: string) {
        console.log(`Sending system message to session ${chatSessionId}`);
        const payload = {
            content,
            chatSessionId,
            userId
        };
        try {
            const response = await api.post<ChatMessage>(`/api/chat/messages/system`, payload);
            console.log(`System message sent successfully to session ${chatSessionId}`);
            return response.data;
        } catch (error: any) {
            console.error(`Error sending system message to session ${chatSessionId}:`, error);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', error.response?.data);
            throw error;
        }
    }
    
    // Mark messages in a session as read
    async markSessionAsRead(sessionId: string) {
        const response = await api.put(`/api/chat/sessions/${sessionId}/read`);
        return response.data;
    }
    
    // End a chat session
    async endChatSession(sessionId: string) {
        const response = await api.put(`/api/chat/sessions/${sessionId}/end`);
        return response.data;
    }
    
    // Get a specific chat session by ID
    async getChatSessionById(sessionId: string) {
        const response = await api.get<ChatSession>(`/api/chat/sessions/${sessionId}`);
        return response.data;
    }
    
    // Update session status
    async updateSessionStatus(sessionId: string, status: 'ACTIVE' | 'ENDED') {
        const response = await api.put<ChatSession>(`/api/chat/sessions/${sessionId}/status`, { status });
        return response.data;
    }

    /**
     * Delete a chat session and all its messages
     * @param sessionId The ID of the chat session to delete
     * @returns Result of the deletion operation
     */
    async deleteChatSession(sessionId: string): Promise<{success: boolean, message: string}> {
        try {
            const response = await api.delete(`/api/chat/sessions/${sessionId}`);
            return response.data;
        } catch (error: any) {
            console.error('Error deleting chat session:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Error deleting chat session'
            };
        }
    }
}

export default new ChatService(); 