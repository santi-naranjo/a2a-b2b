export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

export interface ProductRequest {
  product: string;
  quantity: number;
  delivery_location: string;
  delivery_date?: string;
  urgency: 'low' | 'normal' | 'high';
  notes?: string;
}

export interface VendorResponse {
  vendor: string;
  price_per_unit: number;
  total_price: number;
  delivery_time: string;
  discount?: number;
  fulfillment: boolean;
  notes?: string;
}

export interface AgentResponse {
  structured_request?: ProductRequest;
  vendor_responses?: VendorResponse[];
  recommendation?: {
    selected_vendor: string;
    reasoning: string;
    trade_offs?: string;
  };
  summary?: string;
  output?: string; // Para respuestas simples de texto
}

export interface ChatInput {
  chatInput: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'archived';
  summary?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  lastMessage: string;
  messageCount: number;
  createdAt: Date;
  updatedAt: Date;
  status: 'active' | 'completed' | 'archived';
} 