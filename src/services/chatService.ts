import axiosInstance from '../config/axios';

/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Chat Service - Handles all chat API calls
 * All responses are unwrapped from the nested { success, message, data: {...} } structure
 */
class ChatService {
  /**
   * Helper to extract data from nested response
   */
  private extractData(response: any): any {
    const data = response.data;
    return data.data || data;
  }

  /**
   * Get all chat histories
   */
  async getChatHistories() {
    const response = await axiosInstance.get('/api/chat-history');
    return this.extractData(response);
  }

  /**
   * Get specific chat history by ID
   */
  async getChatHistoryById(chatId: string): Promise<any> {
    const response = await axiosInstance.get(`/api/chat-history/${chatId}`);
    return this.extractData(response);
  }

  /**
   * Create new chat history
   */
  async createChatHistory(chatData: any): Promise<any> {
    const response = await axiosInstance.post('/api/chat-history', chatData);
    return this.extractData(response);
  }

  /**
   * Update chat history
   */
  async updateChatHistory(chatId: string, chatData: any): Promise<any> {
    const response = await axiosInstance.put(`/api/chat-history/${chatId}`, chatData);
    return this.extractData(response);
  }

  /**
   * Delete specific chat history
   */
  async deleteChatHistory(chatId: string): Promise<any> {
    const response = await axiosInstance.delete(`/api/chat-history/${chatId}`);
    return this.extractData(response);
  }

  /**
   * Delete all chat histories
   */
  async deleteAllChatHistories() {
    const response = await axiosInstance.delete('/api/chat-history/all');
    return this.extractData(response);
  }
}

export default new ChatService();
