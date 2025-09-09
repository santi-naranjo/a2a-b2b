import { Conversation, ConversationSummary, ChatMessage } from '@/types/chat';

const STORAGE_KEY = 'b2b_conversations';

export class ConversationService {
  static getAllConversations(): Conversation[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const conversations = JSON.parse(stored);
      return conversations.map((conv: { createdAt: string; updatedAt: string; messages: Array<{ timestamp: string; [key: string]: unknown }>; [key: string]: unknown }) => ({
        ...conv,
        createdAt: new Date(conv.createdAt),
        updatedAt: new Date(conv.updatedAt),
        messages: conv.messages.map((msg: { timestamp: string; [key: string]: unknown }) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
      }));
    } catch (error) {
      console.error('Error loading conversations:', error);
      return [];
    }
  }

  static async ensureServerConversation(): Promise<Conversation | null> {
    try {
      const res = await fetch('/api/conversations/demo', { method: 'POST' });
      if (!res.ok) return null;
      const json = await res.json();
      const conv: Conversation = {
        id: json.data.id,
        title: json.data.topic || 'A2A Conversation',
        messages: [],
        createdAt: new Date(json.data.created_at),
        updatedAt: new Date(json.data.updated_at),
        status: json.data.status === 'open' ? 'active' : 'archived'
      };
      // Save in local for quick access
      const conversations = this.getAllConversations();
      const exists = conversations.find(c => c.id === conv.id);
      if (!exists) {
        conversations.unshift(conv);
        this.saveConversations(conversations);
      }
      return conv;
    } catch {
      return null;
    }
  }

  static getConversation(id: string): Conversation | null {
    const conversations = this.getAllConversations();
    return conversations.find(conv => conv.id === id) || null;
  }

  static createConversation(title: string): Conversation {
    const conversation: Conversation = {
      id: Date.now().toString(),
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active'
    };

    const conversations = this.getAllConversations();
    conversations.unshift(conversation);
    this.saveConversations(conversations);

    return conversation;
  }

  static updateConversation(id: string, updates: Partial<Conversation>): void {
    const conversations = this.getAllConversations();
    const index = conversations.findIndex(conv => conv.id === id);
    
    if (index !== -1) {
      conversations[index] = {
        ...conversations[index],
        ...updates,
        updatedAt: new Date()
      };
      this.saveConversations(conversations);
    }
  }

  static addMessage(conversationId: string, message: ChatMessage): void {
    const conversations = this.getAllConversations();
    const index = conversations.findIndex(conv => conv.id === conversationId);
    
    if (index !== -1) {
      conversations[index].messages.push(message);
      conversations[index].updatedAt = new Date();
      
      // Actualizar título si es el primer mensaje del usuario
      if (message.role === 'user' && conversations[index].messages.filter(m => m.role === 'user').length === 1) {
        conversations[index].title = message.content.substring(0, 50) + (message.content.length > 50 ? '...' : '');
      }
      
      this.saveConversations(conversations);
    }
  }

  static deleteConversation(id: string): void {
    const conversations = this.getAllConversations();
    const filtered = conversations.filter(conv => conv.id !== id);
    this.saveConversations(filtered);
  }

  static getConversationSummaries(): ConversationSummary[] {
    const conversations = this.getAllConversations();
    return conversations.map(conv => ({
      id: conv.id,
      title: conv.title,
      lastMessage: conv.messages.length > 0 ? conv.messages[conv.messages.length - 1].content : '',
      messageCount: conv.messages.length,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      status: conv.status
    }));
  }

  static groupConversationsByDate(): { [key: string]: ConversationSummary[] } {
    const summaries = this.getConversationSummaries();
    const groups: { [key: string]: ConversationSummary[] } = {};

    summaries.forEach(summary => {
      const date = summary.updatedAt.toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(summary);
    });

    return groups;
  }

  private static saveConversations(conversations: Conversation[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch (error) {
      console.error('Error saving conversations:', error);
    }
  }
} 