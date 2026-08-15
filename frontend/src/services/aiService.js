import api from './api'

export const aiService = {
  chat: async (message, context = {}) => {
    return api.post('/ai/chat', { message, context })
  }
}