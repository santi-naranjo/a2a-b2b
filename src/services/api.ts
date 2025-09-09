import { ChatInput, AgentResponse } from '@/types/chat';

export class ApiService {
  static async sendMessage(message: string, conversationId?: string): Promise<AgentResponse> {
    try {
      // Enqueue to MCP respond route (uses OpenAI directly)
      if (conversationId) {
        const res = await fetch('/api/mcp/respond', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversation_id: conversationId, text: message })
        });
        if (!res.ok) throw new Error(`MCP error: ${res.status}`);
        const json = await res.json();
        return { summary: json.content, output: json.content };
      }

      // Fallback: echo
      const payload: ChatInput = { chatInput: message };
      return { summary: payload.chatInput, output: payload.chatInput };
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message to the agent');
    }
  }
}