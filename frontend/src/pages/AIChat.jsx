import React, { useState, useRef, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { aiService } from '../services/aiService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Send, Bot, User } from 'lucide-react'

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I'm your AI assistant. How can I help you today? You can ask me about tasks, system usage, or any workflow questions."
    }
  ])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const chatMutation = useMutation({
    mutationFn: (message) => aiService.chat(message),
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.data.message
      }])
    },
    onError: (error) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again later.'
      }])
    }
  })

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim() || chatMutation.isPending) return

    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])

    chatMutation.mutate(userMessage)
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold">AI Chat Assistant</h1>
        <p className="text-gray-500 mt-1">
          Get help with tasks, system usage, and workflow guidance
        </p>
      </div>

      <Card className="h-[calc(100vh-280px)] flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            AI Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 ${
                  message.role === 'user' ? 'flex-row-reverse' : ''
                }`}
              >
                <Avatar className={message.role === 'user' ? 'bg-blue-600' : 'bg-gray-600'}>
                  <AvatarFallback>
                    {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {chatMutation.isPending && (
              <div className="flex items-start gap-3">
                <Avatar className="bg-gray-600">
                  <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-lg p-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </CardContent>
        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={chatMutation.isPending}
            className="flex-1"
          />
          <Button type="submit" disabled={!input.trim() || chatMutation.isPending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </Card>
    </div>
  )
}

export default AIChat