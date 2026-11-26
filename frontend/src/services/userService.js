import api from './api'

export const userService = {
  getAll: async (params = {}) => {
    return api.get('/users', { params })
  },

  create: async (data) => {
    return api.post('/users', data)
  },

  update: async (id, data) => {
    return api.put(`/users/${id}`, data)
  },

  delete: async (id) => {
    return api.delete(`/users/${id}`)
  }
}