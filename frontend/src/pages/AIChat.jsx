import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { aiService } from '../services/aiService';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { initials } from '../lib/labels';
import { cn } from '../lib/utils';
import {
  Sparkles,
  ListTodo,
  Users,
  AlertCircle,
  ArrowUp,
  Bot,
  Square,
  RotateCcw,
  Copy,
  Check,
  Database,
  Plus,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

const DEFAULT_MODEL = { id: 'meta/llama-3.1-8b-instruct', name: 'Meta Llama 3.1 8B Instruct (Default)' };

const FALLBACK_MODELS = [
  DEFAULT_MODEL,
  { id: 'meta/llama-3.3-70b-instruct', name: 'Meta Llama 3.3 70B (High Intelligence)' },
  { id: 'gemini-2.5-flash', name: 'Google Gemini 2.5 Flash' },
  { id: 'gpt-4o-mini', name: 'OpenAI GPT-4o Mini' },
];

const STARTER_PROMPTS = [
  {
    title: 'Pending tasks',
    desc: 'Count and breakdown of all pending items',
    prompt: 'How many tasks are currently pending?',
    icon: ListTodo
  },
  {
    title: 'Executive summary',
    desc: 'Progress report and completion rates',
    prompt: 'Give me a summary of task progress and completion rates for our team.',
    icon: Sparkles
  },
  {
    title: 'Team workload',
    desc: 'Analyze tasks assigned per user',
    prompt: 'Which users have the most assigned tasks and what is their current workload?',
    icon: Users
  },
  {
    title: 'Overdue insights',
    desc: 'Detect delayed tasks and bottlenecks',
    prompt: 'Give me insights about overdue or incomplete tasks requiring attention.',
    icon: AlertCircle
  }
];

const WELCOME_MESSAGE = {
  role: 'assistant',
  content: `Hello! I'm **Synthie AI**, your assistant for this Task Management System.\n\nI can query your **PostgreSQL database** to generate reports, calculate metrics, and answer questions about your team's tasks.\n\nHow can I help you today?`
};

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

// Frosted-glass surface shared by the panels on this page.
const glass = 'border border-white/70 bg-card/50 shadow-[0_8px_30px_rgb(0_0_0/0.06)] backdrop-blur-2xl dark:border-white/[0.08] dark:bg-card/40 dark:shadow-[0_8px_30px_rgb(0_0_0/0.35)]';

const AIChat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL.id);
  const [models, setModels] = useState([]);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const abortControllerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // Fetch available models from backend
    aiService.getModels()
      .then(res => {
        const list = res?.data?.models;
        if (!list?.length) return;
        // The backend's default model is what requests use when nothing else is chosen,
        // but it isn't always in the list. Add it so the selector shows the model in use.
        const defaultId = res.data.defaultModel || DEFAULT_MODEL.id;
        const withDefault = list.some(m => m.id === defaultId)
          ? list
          : [{ id: defaultId, name: defaultId === DEFAULT_MODEL.id ? DEFAULT_MODEL.name : `${defaultId} (Default)` }, ...list];
        setModels(withDefault);
        setSelectedModel(current => (withDefault.some(m => m.id === current) ? current : defaultId));
      })
      .catch(() => {
        setModels(FALLBACK_MODELS);
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Grow the composer with its content, up to a limit.
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const handleSendMessage = async (textToSend) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent || isStreaming) return;

    setInput('');

    // Add user message & empty assistant placeholder
    const newMessages = [
      ...messages,
      { role: 'user', content: messageContent }
    ];

    setMessages([
      ...newMessages,
      { role: 'assistant', content: '' }
    ]);

    setIsStreaming(true);
    abortControllerRef.current = new AbortController();

    let accumulatedText = '';

    await aiService.streamChat({
      messages: newMessages.map(m => ({ role: m.role, content: m.content })),
      model: selectedModel,
      signal: abortControllerRef.current.signal,
      onChunk: (chunk) => {
        accumulatedText += chunk;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: accumulatedText
          };
          return updated;
        });
      },
      onDone: () => {
        setIsStreaming(false);
      },
      onError: (err) => {
        setIsStreaming(false);
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: 'assistant',
            content: accumulatedText || `**Error:** ${err.message || 'Failed to generate response. Please try again.'}`
          };
          return updated;
        });
      }
    });
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  };

  const handleCopy = (content, index) => {
    navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleClearChat = () => {
    if (isStreaming) handleStopGeneration();
    setMessages([WELCOME_MESSAGE]);
    inputRef.current?.focus();
  };

  const handleRetryLast = () => {
    if (isStreaming || messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isFresh = messages.length <= 1 && !isStreaming;
  const currentModelName = models.find(m => m.id === selectedModel)?.name || selectedModel;

  return (
    <div className="relative isolate">
      {/* Soft tinted backdrop that shows through the glass panels */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-3xl">
        <div className="absolute -left-20 -top-20 h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-3xl dark:bg-primary/20" />
        <div className="absolute -right-10 top-1/4 h-96 w-96 rounded-full bg-info/25 blur-3xl dark:bg-info/15" />
        <div className="absolute -bottom-20 left-1/3 h-80 w-80 rounded-full bg-success/15 blur-3xl dark:bg-success/10" />
      </div>

      <div className={cn('flex h-[calc(100vh-8.5rem)] min-h-[560px] flex-col overflow-hidden rounded-2xl', glass)}>
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="relative">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm">
                <Bot className="h-[18px] w-[18px]" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card bg-success" />
            </div>
            <div className="min-w-0 leading-tight">
              <h1 className="text-sm font-semibold">Synthie AI</h1>
              <p className="truncate text-xs text-muted-foreground">
                {isStreaming ? 'Thinking…' : 'Task assistant · answers from your live database'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground md:inline-flex">
              <Database className="h-3 w-3" />
              PostgreSQL grounded
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearChat}
              disabled={isStreaming || messages.length <= 1}
              className="bg-background/40 hover:bg-background/70"
            >
              <Plus className="h-3.5 w-3.5" />
              New chat
            </Button>
          </div>
        </div>

        {/* Conversation */}
        <div className="flex-1 overflow-y-auto">
          {isFresh ? (
            <div className="mx-auto flex min-h-full max-w-3xl flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-info text-primary-foreground shadow-lg shadow-primary/20">
                <Sparkles className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">
                {greeting()}{user?.firstName ? `, ${user.firstName}` : ''}
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Ask about tasks, workloads, deadlines or reports. I'll look up the answer in your team's data.
              </p>

              <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
                {STARTER_PROMPTS.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <button
                      key={item.title}
                      onClick={() => handleSendMessage(item.prompt)}
                      className="group flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-4 text-left backdrop-blur transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-background/80 hover:shadow-md"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <IconComponent className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 text-sm font-medium">
                          {item.title}
                          <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{item.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                return (
                  <div key={index} className={cn('flex items-start gap-3', isUser && 'flex-row-reverse')}>
                    {isUser ? (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary ring-1 ring-primary/20">
                        {initials(user?.firstName, user?.lastName)}
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-info text-primary-foreground shadow-sm">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}

                    <div className={cn('group min-w-0 max-w-[85%]', isUser && 'flex flex-col items-end')}>
                      <div
                        className={cn(
                          'rounded-2xl px-4 py-3',
                          isUser
                            ? 'rounded-tr-md bg-primary/90 text-primary-foreground shadow-sm shadow-primary/20 backdrop-blur'
                            : 'rounded-tl-md border border-border/60 bg-background/60 shadow-sm backdrop-blur'
                        )}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
                        ) : message.content ? (
                          <div className="markdown">
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                table: ({ node, ...props }) => (
                                  <div className="overflow-x-auto"><table {...props} /></div>
                                ),
                              }}
                            >
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 py-1 text-muted-foreground">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                            <span className="ml-1.5 text-xs">Analyzing database…</span>
                          </div>
                        )}
                      </div>

                      {/* Message actions */}
                      {!isUser && message.content && !isStreaming && index > 0 && (
                        <div className="mt-1 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            onClick={() => handleCopy(message.content, index)}
                            className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-background/70 hover:text-foreground"
                            title="Copy response"
                          >
                            {copiedIndex === index ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                            {copiedIndex === index ? 'Copied' : 'Copy'}
                          </button>
                          {index === messages.length - 1 && (
                            <button
                              onClick={handleRetryLast}
                              className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground hover:bg-background/70 hover:text-foreground"
                              title="Regenerate response"
                            >
                              <RotateCcw className="h-3 w-3" />
                              Regenerate
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="px-4 pb-4 pt-2 sm:px-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="mx-auto max-w-3xl rounded-2xl border border-border/70 bg-background/70 shadow-lg shadow-black/[0.03] backdrop-blur-xl transition-colors focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10"
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about tasks, workloads, deadlines or reports…"
              disabled={isStreaming}
              className="block max-h-40 w-full resize-none bg-transparent px-4 pb-2 pt-3.5 text-sm outline-none placeholder:text-muted-foreground disabled:opacity-60"
            />
            <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
              <label className="relative flex min-w-0 items-center">
                <span className="sr-only">Model</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={isStreaming}
                  title={currentModelName}
                  className="h-8 max-w-[260px] cursor-pointer appearance-none truncate rounded-lg bg-transparent pl-2.5 pr-7 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed"
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name || m.id}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-muted-foreground" />
              </label>

              <div className="flex items-center gap-2">
                <span className="hidden text-[11px] text-muted-foreground sm:inline">
                  <kbd className="font-sans">Enter</kbd> to send · <kbd className="font-sans">Shift + Enter</kbd> new line
                </span>
                {isStreaming ? (
                  <Button type="button" size="icon-sm" variant="destructive" onClick={handleStopGeneration} className="rounded-lg" title="Stop">
                    <Square className="h-3.5 w-3.5 fill-current" />
                    <span className="sr-only">Stop</span>
                  </Button>
                ) : (
                  <Button type="submit" size="icon-sm" disabled={!input.trim()} className="rounded-lg" title="Send">
                    <ArrowUp className="h-4 w-4" />
                    <span className="sr-only">Send</span>
                  </Button>
                )}
              </div>
            </div>
          </form>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            AI responses can be inaccurate. Verify important figures in Reports.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
