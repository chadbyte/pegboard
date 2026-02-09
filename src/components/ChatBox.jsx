import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast, Toaster } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  Lock,
  Unlock,
  X,
  Send,
  MessageSquare,
  GripVertical,
  CheckCircle2,
  AlertCircle,
  Minus,
  Plus,
  Copy,
  Check,
  Home,
  History,
  Settings,
  Trash2,
  RotateCcw,
  FileText,
  Upload,
  Loader2,
  MoreVertical,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  ExternalLink,
  Monitor,
} from 'lucide-react';

// Markdown Message Component with syntax highlighting
const MarkdownMessage = ({ content }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={match[1]}
              PreTag="div"
              className="rounded-md !mt-2 !mb-2"
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-200" {...props}>
              {children}
            </code>
          );
        },
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
        li: ({ children }) => <li className="text-slate-200">{children}</li>,
        h1: ({ children }) => <h1 className="text-xl font-bold mb-2 text-slate-100">{children}</h1>,
        h2: ({ children }) => <h2 className="text-lg font-bold mb-2 text-slate-100">{children}</h2>,
        h3: ({ children }) => <h3 className="text-base font-bold mb-1 text-slate-100">{children}</h3>,
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-500 pl-4 italic my-2 text-slate-300">
            {children}
          </blockquote>
        ),
        a: ({ children, href }) => (
          <a href={href} className="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        table: ({ children }) => (
          <div className="overflow-x-auto my-2">
            <table className="border-collapse border border-slate-600 w-full">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-slate-800">{children}</thead>,
        tbody: ({ children }) => <tbody>{children}</tbody>,
        tr: ({ children }) => <tr className="border-b border-slate-600">{children}</tr>,
        th: ({ children }) => <th className="border border-slate-600 px-3 py-2 text-left text-slate-200">{children}</th>,
        td: ({ children }) => <td className="border border-slate-600 px-3 py-2 text-slate-300">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
};

// Thinking Process Component
const ThinkingProcess = ({ isThinking, duration, content }) => {
  const [isOpen, setIsOpen] = useState(isThinking);

  // Auto-open when thinking starts, close when done (optional, but requested behavior implies user control)
  // Let's keep it user controlled or default open while thinking? 
  // User asked for "Thought for #s" and chevron to open. So default closed after finishing?
  // Let's default to open while thinking, and collapsable.

  return (
    <div className="flex flex-col gap-2 my-2 no-drag">
      <div
        className="flex items-center gap-2 cursor-pointer text-slate-400 hover:text-slate-200 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {isThinking ? `Thinking for ${duration}s...` : `Thought for ${duration}s`}
        </span>
      </div>

      {isOpen && (
        <div className="pl-6 border-l-2 border-slate-700 ml-2">
          <div className="text-sm text-slate-400">
            {content ? (
              <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar text-xs text-slate-300 markdown-content">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-1 pl-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-1 pl-1">{children}</ol>,
                    li: ({ children }) => <li className="mb-0.5">{children}</li>,
                    code: ({ inline, children }) => (
                      <code className={`${inline ? 'bg-slate-800 px-1 py-0.5 rounded' : 'block bg-slate-800 p-2 rounded my-1 whitespace-pre-wrap'}`}>
                        {children}
                      </code>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <span className="italic">{isThinking ? "Processing..." : "Reasoning process completed."}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

function ChatBox({
  id,
  name,
  x,
  y,
  width,
  height,
  prompt,
  model,
  locked,
  messages,
  streaming,
  tintColor,
  gridSize,
  isLocked,
  isFocused,
  isDragging: isDraggingFromParent,
  apiKeys,
  allWindows,
  pendingInput,
  isFloatingWidget = false,
  hasActiveWidget = false,
  onWidgetCreated,
  onUpdate,
  onRemove,
  onFocus,
  onSendToWindow,
  onDragStart,
  onDragEnd,
}) {
  // Initialize state from localStorage with fallback to defaults
  const getInitialState = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(`chatbox-${id}-${key}`);
      return saved ? JSON.parse(saved) : defaultValue;
    } catch (e) {
      console.error(`Error loading ${key} from localStorage:`, e);
      return defaultValue;
    }
  };

  const [input, setInput] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [isChatMode, setIsChatMode] = useState(() => getInitialState('isChatMode', false));
  const [currentSession, setCurrentSession] = useState(() => getInitialState('currentSession', null));
  const [chatMessages, setChatMessages] = useState(() => getInitialState('chatMessages', []));
  const [chatSessions, setChatSessions] = useState(() => getInitialState('chatSessions', []));
  const [activeSessionId, setActiveSessionId] = useState(() => getInitialState('activeSessionId', null));
  const [refineContext, setRefineContext] = useState(null); // { userInput, assistantResponse } when in refine mode
  const [activeTab, setActiveTab] = useState('main'); // 'main', 'history', 'settings'
  const [localName, setLocalName] = useState(name);
  const [localPrompt, setLocalPrompt] = useState(prompt);
  const [localModel, setLocalModel] = useState(model);
  const [thinkingLevel, setThinkingLevel] = useState(() => getInitialState('thinkingLevel', 'high'));

  // Thinking UI State
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingDuration, setThinkingDuration] = useState(0);
  const [thinkingContent, setThinkingContent] = useState('');
  const thinkingStartTimeRef = useRef(null);
  const thinkingIntervalRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [copied, setCopied] = useState(false);
  const [showCurrentResponse, setShowCurrentResponse] = useState(true);
  const [selectedText, setSelectedText] = useState('');
  const [showSelectionMenu, setShowSelectionMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [localTintColor, setLocalTintColor] = useState(tintColor || '#3b82f6');
  const [resourceText, setResourceText] = useState(() => getInitialState('resourceText', ''));
  const [resourceChunks, setResourceChunks] = useState(() => getInitialState('resourceChunks', []));
  const [resourceEmbeddings, setResourceEmbeddings] = useState(() => getInitialState('resourceEmbeddings', []));
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [resourceFileName, setResourceFileName] = useState(() => getInitialState('resourceFileName', ''));
  const chatBoxRef = useRef(null);
  const fileInputRef = useRef(null);
  const resultRef = useRef(null);
  const mainResultRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const selectionMenuRef = useRef(null);
  const chatInputRef = useRef(null);
  const isSyncingRef = useRef(false); // Prevent infinite sync loops

  const MIN_WIDTH = 18; // minimum grid units (enough for all tabs with padding)
  const MIN_HEIGHT = 14; // minimum grid units

  // Sync state with paired widget/pegboard window
  const syncState = (partialState) => {
    if (isSyncingRef.current) return; // Don't sync if we're receiving a sync
    if (window.electron?.floating && (isFloatingWidget || hasActiveWidget)) {
      window.electron.floating.sync(id, partialState, isFloatingWidget);
    }
  };

  // Wrapper functions for synced state changes
  const setActiveTabSynced = (tab) => {
    setActiveTab(tab);
    syncState({ activeTab: tab });
  };

  const setInputSynced = (value) => {
    setInput(value);
    syncState({ input: value });
  };

  const setIsChatModeSynced = (value) => {
    setIsChatMode(value);
    syncState({ isChatMode: value });
  };

  const setChatMessagesSynced = (messagesOrUpdater) => {
    if (typeof messagesOrUpdater === 'function') {
      setChatMessages(prev => {
        const newValue = messagesOrUpdater(prev);
        setTimeout(() => syncState({ chatMessages: newValue }), 0);
        return newValue;
      });
    } else {
      setChatMessages(messagesOrUpdater);
      syncState({ chatMessages: messagesOrUpdater });
    }
  };

  const setCurrentSessionSynced = (sessionOrUpdater) => {
    if (typeof sessionOrUpdater === 'function') {
      setCurrentSession(prev => {
        const newValue = sessionOrUpdater(prev);
        // Sync happens after state update
        setTimeout(() => syncState({ currentSession: newValue }), 0);
        return newValue;
      });
    } else {
      setCurrentSession(sessionOrUpdater);
      syncState({ currentSession: sessionOrUpdater });
    }
  };

  const setLocalPromptSynced = (value) => {
    setLocalPrompt(value);
    syncState({ localPrompt: value });
  };

  const setLocalModelSynced = (value) => {
    setLocalModel(value);
    syncState({ localModel: value });
  };

  const setLocalTintColorSynced = (value) => {
    setLocalTintColor(value);
    syncState({ localTintColor: value });
  };

  const setActiveSessionIdSynced = (value) => {
    setActiveSessionId(value);
    syncState({ activeSessionId: value });
  };

  const setChatInputSynced = (value) => {
    setChatInput(value);
    syncState({ chatInput: value });
  };

  const setIsLoadingSynced = (value) => {
    setIsLoading(value);
    syncState({ isLoading: value });
  };

  const setIsThinkingSynced = (value) => {
    setIsThinking(value);
    syncState({ isThinking: value });
  };

  const setThinkingDurationSynced = (value) => {
    setThinkingDuration(value);
    syncState({ thinkingDuration: value });
  };

  const setThinkingContentSynced = (value) => {
    setThinkingContent(value);
    syncState({ thinkingContent: value });
  };

  const setShowCurrentResponseSynced = (value) => {
    setShowCurrentResponse(value);
    syncState({ showCurrentResponse: value });
  };

  const setThinkingLevelSynced = (value) => {
    setThinkingLevel(value);
    syncState({ thinkingLevel: value });
  };

  // Listen for sync updates from paired window
  useEffect(() => {
    if (window.electron?.floating && (isFloatingWidget || hasActiveWidget)) {
      const handleSync = ({ chatboxId, state, fromWidget }) => {
        if (chatboxId !== id) return;
        // Only accept sync from the opposite side
        if (isFloatingWidget === fromWidget) return;

        console.log('[ChatBox] Received sync:', state);
        isSyncingRef.current = true;

        if (state.activeTab !== undefined) setActiveTab(state.activeTab);
        if (state.input !== undefined) setInput(state.input);
        if (state.chatInput !== undefined) setChatInput(state.chatInput);
        if (state.isChatMode !== undefined) setIsChatMode(state.isChatMode);
        if (state.chatMessages !== undefined) setChatMessages(state.chatMessages);
        if (state.currentSession !== undefined) setCurrentSession(state.currentSession);
        if (state.localPrompt !== undefined) setLocalPrompt(state.localPrompt);
        if (state.localModel !== undefined) setLocalModel(state.localModel);
        if (state.localTintColor !== undefined) {
          setLocalTintColor(state.localTintColor);
          onUpdate({ tintColor: state.localTintColor });
        }
        if (state.activeSessionId !== undefined) setActiveSessionId(state.activeSessionId);
        if (state.isLoading !== undefined) setIsLoading(state.isLoading);
        if (state.isThinking !== undefined) setIsThinking(state.isThinking);
        if (state.thinkingDuration !== undefined) setThinkingDuration(state.thinkingDuration);
        if (state.thinkingContent !== undefined) setThinkingContent(state.thinkingContent);
        if (state.showCurrentResponse !== undefined) setShowCurrentResponse(state.showCurrentResponse);
        if (state.thinkingLevel !== undefined) setThinkingLevel(state.thinkingLevel);

        // Reset sync flag after a short delay
        setTimeout(() => {
          isSyncingRef.current = false;
        }, 100);
      };

      window.electron.floating.onSync(handleSync);
    }
  }, [id, isFloatingWidget, hasActiveWidget]);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(`chatbox-${id}-isChatMode`, JSON.stringify(isChatMode));
    } catch (e) {
      console.error('Error saving isChatMode to localStorage:', e);
    }
  }, [isChatMode, id]);

  useEffect(() => {
    try {
      localStorage.setItem(`chatbox-${id}-currentSession`, JSON.stringify(currentSession));
    } catch (e) {
      console.error('Error saving currentSession to localStorage:', e);
    }
  }, [currentSession, id]);

  useEffect(() => {
    try {
      localStorage.setItem(`chatbox-${id}-chatMessages`, JSON.stringify(chatMessages));
    } catch (e) {
      console.error('Error saving chatMessages to localStorage:', e);
    }
  }, [chatMessages, id]);

  useEffect(() => {
    try {
      localStorage.setItem(`chatbox-${id}-chatSessions`, JSON.stringify(chatSessions));
    } catch (e) {
      console.error('Error saving chatSessions to localStorage:', e);
    }
  }, [chatSessions, id]);

  useEffect(() => {
    try {
      localStorage.setItem(`chatbox-${id}-activeSessionId`, JSON.stringify(activeSessionId));
    } catch (e) {
      console.error('Error saving activeSessionId to localStorage:', e);
    }
  }, [activeSessionId, id]);

  useEffect(() => {
    try {
      localStorage.setItem(`chatbox-${id}-resourceText`, JSON.stringify(resourceText));
    } catch (e) {
      console.error('Error saving resourceText to localStorage:', e);
    }
  }, [resourceText, id]);

  useEffect(() => {
    try {
      localStorage.setItem(`chatbox-${id}-resourceChunks`, JSON.stringify(resourceChunks));
    } catch (e) {
      console.error('Error saving resourceChunks to localStorage:', e);
    }
  }, [resourceChunks, id]);

  useEffect(() => {
    try {
      localStorage.setItem(`chatbox-${id}-resourceEmbeddings`, JSON.stringify(resourceEmbeddings));
    } catch (e) {
      console.error('Error saving resourceEmbeddings to localStorage:', e);
    }
  }, [resourceEmbeddings, id]);

  useEffect(() => {
    try {
      localStorage.setItem(`chatbox-${id}-resourceFileName`, JSON.stringify(resourceFileName));
    } catch (e) {
      console.error('Error saving resourceFileName to localStorage:', e);
    }
  }, [resourceFileName, id]);

  useEffect(() => {
    try {
      localStorage.setItem(`chatbox-${id}-thinkingLevel`, JSON.stringify(thinkingLevel));
    } catch (e) {
      console.error('Error saving thinkingLevel to localStorage:', e);
    }
  }, [thinkingLevel, id]);

  // Sync local state with props
  useEffect(() => {
    setLocalName(name);
  }, [name]);

  useEffect(() => {
    setLocalPrompt(prompt);
  }, [prompt]);

  useEffect(() => {
    setLocalModel(model);
  }, [model]);

  useEffect(() => {
    setLocalTintColor(tintColor || '#3b82f6');
  }, [tintColor]);

  // Listen for floating window data requests
  useEffect(() => {
    if (window.electron?.floating) {
      const handleDataRequest = ({ chatboxId }) => {
        if (chatboxId === id) {
          const windowData = {
            name,
            model: localModel,
            systemPrompt: localPrompt,
            tintColor: localTintColor,
            apiKeys,
            currentResponse: currentSession?.assistantResponse || null,
            chatMessages,
            isChatMode,
          };
          window.electron.floating.sendDataResponse(id, windowData);
        }
      };

      window.electron.floating.onRequestData(handleDataRequest);

      return () => {
        // Cleanup listener when component unmounts
      };
    }
  }, [id, name, localModel, localPrompt, localTintColor, apiKeys, currentSession, chatMessages, isChatMode]);

  // Get the current response based on mode
  const currentResponse = isChatMode
    ? null // In chat mode, we don't use currentResponse
    : (currentSession?.assistantResponse || null);

  // Auto-scroll to bottom when response updates or in chat mode
  useEffect(() => {
    if (isChatMode && chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    } else if (!isChatMode && mainResultRef.current && currentResponse) {
      mainResultRef.current.scrollTop = mainResultRef.current.scrollHeight;
    }
  }, [currentResponse, isChatMode, chatMessages]);

  // Handle pending input from another window
  useEffect(() => {
    if (pendingInput) {
      // Handle both string (legacy) and object format
      const inputText = typeof pendingInput === 'string' ? pendingInput : pendingInput.text;
      const shouldAutoSend = typeof pendingInput === 'object' && pendingInput.autoSend;

      setInputSynced(inputText);
      setActiveTabSynced('main'); // Switch to main tab

      // Clear the pendingInput first
      onUpdate({ pendingInput: null });

      // If autoSend is enabled, trigger send after state updates
      if (shouldAutoSend) {
        // Use a longer delay to ensure input state is set
        setTimeout(() => {
          // Manually trigger the send logic
          if (inputText.trim()) {
            setInputSynced('');
            setShowCurrentResponseSynced(true);
            setIsLoadingSynced(true);
            setIsChatModeSynced(false);
            setActiveSessionIdSynced(null);
            setRefineContext(null);

            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const newSession = {
              sessionId: sessionId,
              userInput: inputText,
              assistantResponse: '',
              timestamp: Date.now()
            };

            setCurrentSessionSynced(newSession);
            setChatMessagesSynced([]);

            (async () => {
              try {
                const apiKey = (() => {
                  if (localModel.startsWith('gpt-') || localModel.startsWith('openai-')) {
                    return apiKeys.openai;
                  } else if (localModel.startsWith('claude-')) {
                    return apiKeys.claude;
                  } else if (localModel.startsWith('gemini-')) {
                    return apiKeys.gemini;
                  }
                  return apiKeys.openai;
                })();

                const result = await window.electron.ai.generate({
                  model: localModel,
                  apiKey,
                  systemPrompt: prompt,
                  userMessage: inputText,
                  thinkingLevel, // Pass thinking level
                  streaming: false,
                  requestId
                });

                const updatedSession = {
                  ...newSession,
                  assistantResponse: result.text
                };
                setCurrentSessionSynced(updatedSession);
                saveSessionToHistory(updatedSession);
                setIsLoadingSynced(false);
              } catch (error) {
                console.error('Auto-send error:', error);
                setCurrentSessionSynced(prev => ({
                  ...prev,
                  assistantResponse: `Error: ${error.message || 'Failed to get response from AI.'}`
                }));
                setIsLoadingSynced(false);
              }
            })();
          }
        }, 200);
      }
    }
  }, [pendingInput]);

  // Auto-focus chat input when entering chat mode
  useEffect(() => {
    if (isChatMode && chatInputRef.current) {
      chatInputRef.current.focus();
    }
  }, [isChatMode]);

  const handleCopyResponse = async () => {
    if (currentResponse) {
      try {
        await navigator.clipboard.writeText(currentResponse);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success('Copied to clipboard');
      } catch (err) {
        console.error('Failed to copy:', err);
        toast.error('Failed to copy');
      }
    }
  };

  const handleClearOutput = () => {
    // Just hide the output, keep it in history
    setShowCurrentResponseSynced(false);
  };

  // Helper function to update chat messages and sync with active session
  const updateChatMessages = (messages) => {
    setChatMessagesSynced(messages);

    // Also update the active session in chatSessions
    if (activeSessionId) {
      setChatSessions(prev => prev.map(session =>
        session.id === activeSessionId
          ? { ...session, messages }
          : session
      ));
    }
  };

  // Helper function to create or update a session in history
  const saveSessionToHistory = (session) => {
    const historySession = {
      id: session.sessionId,
      title: session.userInput,
      messages: [
        { role: 'user', content: session.userInput, timestamp: session.timestamp },
        { role: 'assistant', content: session.assistantResponse, timestamp: session.timestamp, thinkingContent: thinkingContent, thinkingDuration: thinkingDuration }
      ],
      timestamp: session.timestamp
    };

    setChatSessions(prev => {
      // Check if session already exists
      const existingIndex = prev.findIndex(s => s.id === session.sessionId);
      if (existingIndex >= 0) {
        // Update existing session
        const updated = [...prev];
        updated[existingIndex] = historySession;
        return updated;
      } else {
        // Add new session
        return [...prev, historySession];
      }
    });
  };

  const handleRewind = () => {
    // Only works in chat mode
    if (!isChatMode || chatMessages.length < 2) return;

    // Show confirmation
    const confirmed = window.confirm('Rewind to the previous message? This will remove the last exchange.');
    if (!confirmed) return;

    // Remove the last user message and assistant response
    const newChatMessages = chatMessages.slice(0, -2);
    updateChatMessages(newChatMessages);
  };

  // Helper function for RAG: compute cosine similarity between two vectors
  const cosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  // Helper function for RAG: find relevant chunks for a query
  const findRelevantChunks = async (query, topK = 3) => {
    if (!resourceEmbeddings.length || !resourceChunks.length) {
      return [];
    }

    try {
      // Generate query embedding via main process
      const result = await window.electron.embedding.generate([query]);
      const queryEmbedding = result.embeddings[0];

      // Calculate similarity scores
      const scores = resourceEmbeddings.map((embedding, index) => ({
        index,
        score: cosineSimilarity(queryEmbedding, embedding)
      }));

      // Sort by score and take top K
      scores.sort((a, b) => b.score - a.score);
      const topChunks = scores.slice(0, topK).map(s => ({
        text: resourceChunks[s.index],
        score: s.score
      }));

      return topChunks;
    } catch (error) {
      console.error('Error finding relevant chunks:', error);
      return [];
    }
  };

  // Build system prompt with RAG context
  const buildPromptWithRAG = async (basePrompt, userQuery) => {
    const relevantChunks = await findRelevantChunks(userQuery);

    if (relevantChunks.length === 0) {
      return basePrompt;
    }

    const contextText = relevantChunks
      .map((chunk, i) => `[Context ${i + 1}]:\n${chunk.text}`)
      .join('\n\n');

    return `${basePrompt}\n\n---\nRelevant context from uploaded document:\n\n${contextText}\n---\n\nUse the above context to help answer the user's question when relevant.`;
  };


  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text) {
      setSelectedText(text);

      // Get the position of the selection
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // Position menu above the selection
      setMenuPosition({
        x: rect.left + (rect.width / 2),
        y: rect.top - 10
      });
      setShowSelectionMenu(true);
    } else {
      setSelectedText('');
      setShowSelectionMenu(false);
    }
  };

  const handleSendToWindow = (targetWindowId) => {
    if (selectedText && onSendToWindow) {
      onSendToWindow(targetWindowId, selectedText);
      setSelectedText('');
      setShowSelectionMenu(false);
    }
  };

  const handleCopySelectedText = async () => {
    if (selectedText) {
      try {
        await navigator.clipboard.writeText(selectedText);
        setShowSelectionMenu(false);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 32));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 8));
  };

  const getApiKey = () => {
    if (localModel.startsWith('gpt-') || localModel.startsWith('openai-')) {
      if (!apiKeys.openai) {
        throw new Error('OpenAI API key is not configured. Please add it in Settings.');
      }
      return apiKeys.openai;
    } else if (localModel.startsWith('claude-')) {
      if (!apiKeys.claude) {
        throw new Error('Claude API key is not configured. Please add it in Settings.');
      }
      return apiKeys.claude;
    } else if (localModel.startsWith('gemini-')) {
      if (!apiKeys.gemini) {
        throw new Error('Gemini API key is not configured. Please add it in Settings.');
      }
      return apiKeys.gemini;
    }
    // Default to OpenAI
    if (!apiKeys.openai) {
      throw new Error('OpenAI API key is not configured. Please add it in Settings.');
    }
    return apiKeys.openai;
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userInput = input;
    setInputSynced('');
    setShowCurrentResponseSynced(true); // Show the response area again when sending a new message
    setIsLoadingSynced(true);
    setIsChatModeSynced(false); // Exit chat mode for fresh single-turn generation
    setActiveSessionIdSynced(null); // Clear active session
    setRefineContext(null); // Clear refine context

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    console.log('[ChatBox] Sending single-turn message:', {
      input: userInput,
      model: localModel,
      streaming: streaming,
      hasApiKey: !!getApiKey(),
      requestId
    });

    // Create new isolated session for this single-turn request with a session ID
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newSession = {
      sessionId: sessionId,
      userInput: userInput,
      assistantResponse: '',
      timestamp: Date.now()
    };

    setCurrentSessionSynced(newSession);
    setChatMessagesSynced([]); // Clear any chat messages
    console.log('[ChatBox] Created new isolated session with ID:', sessionId);

    try {
      const apiKey = getApiKey();
      console.log('[ChatBox] Got API key, length:', apiKey?.length);

      // Build prompt with RAG context if available
      const systemPromptWithRAG = await buildPromptWithRAG(localPrompt, userInput);
      console.log('[ChatBox] RAG context added:', systemPromptWithRAG !== localPrompt);

      if (streaming) {
        // For streaming mode, accumulate content with throttled updates
        let streamedContent = '';
        let updateScheduled = false;
        let pendingUpdate = false;

        // Throttled update function - updates UI at 60fps (every ~16ms)
        const updateUI = () => {
          console.log('[ChatBox] updateUI called, content length:', streamedContent.length);
          // Update current session with streamed content
          setCurrentSession(prev => ({
            ...prev,
            assistantResponse: streamedContent
          }));
          updateScheduled = false;

          // If there was a pending update during throttle, schedule another
          if (pendingUpdate) {
            console.log('[ChatBox] Pending update detected, scheduling another');
            pendingUpdate = false;
            updateScheduled = true;
            setTimeout(updateUI, 16);
          }
        };

        // Set up streaming listeners
        const chunkHandler = ({ requestId: chunkReqId, chunk }) => {
          if (chunkReqId === requestId) {
            // If this is the first chunk, stop thinking logic
            if (thinkingStartTimeRef.current) {
              clearInterval(thinkingIntervalRef.current);
              thinkingStartTimeRef.current = null;
              setIsThinkingSynced(false);
            }

            streamedContent += chunk;
            console.log('[ChatBox] Received chunk:', chunk.length, 'chars, total content:', streamedContent.length);

            // Throttle updates for smooth streaming at 60fps
            if (!updateScheduled) {
              console.log('[ChatBox] Scheduling updateUI');
              updateScheduled = true;
              setTimeout(updateUI, 16);
            } else {
              console.log('[ChatBox] Update already scheduled, setting pendingUpdate');
              pendingUpdate = true;
            }
          }
        };

        const thinkingHandler = ({ requestId: thinkingReqId, content }) => {
          if (thinkingReqId === requestId) {
            setThinkingContent(prev => prev + content);
          }
        };

        const completeHandler = ({ requestId: completeReqId }) => {
          if (completeReqId === requestId) {
            console.log('[ChatBox] Stream complete, final content length:', streamedContent.length);

            // Ensure thinking stops if it hasn't already (e.g. empty stream)
            if (thinkingStartTimeRef.current) {
              clearInterval(thinkingIntervalRef.current);
              thinkingStartTimeRef.current = null;
              setIsThinkingSynced(false);
            }

            // Force final update with complete content
            const updatedSession = {
              ...newSession,
              assistantResponse: streamedContent
            };
            setCurrentSessionSynced(updatedSession);

            // Save to history automatically
            saveSessionToHistory(updatedSession);

            setIsLoadingSynced(false);
            window.electron.ai.removeStreamListeners();
          }
        };

        const errorHandler = ({ requestId: errorReqId, error }) => {
          if (errorReqId === requestId) {
            console.error('[ChatBox] Stream error:', error);
            setCurrentSessionSynced(prev => ({
              ...prev,
              assistantResponse: `Error: ${error || 'Failed to get response from AI.'}`
            }));
            setIsLoadingSynced(false);
            window.electron.ai.removeStreamListeners();
          }
        };

        // Remove any existing listeners before registering new ones
        window.electron.ai.removeStreamListeners();

        window.electron.ai.onStreamChunk(chunkHandler);
        window.electron.ai.onStreamThinking(thinkingHandler);
        window.electron.ai.onStreamComplete(completeHandler);
        window.electron.ai.onStreamError(errorHandler);

        // Set loading to false immediately for streaming so we can see the chunks
        console.log('[ChatBox] Setting isLoading to false for streaming');
        // Set loading to false immediately for streaming so we can see the chunks
        console.log('[ChatBox] Setting isLoading to false for streaming');
        // UPDATE: Keeping isLoading true until stream completes or we decide to handle it differently?
        // Actually, existing logic sets isLoading=false here. 
        // We should keep isLoading=true for the Spinner, OR we rely on `isThinking` for the first phase 
        // and then show content.
        // User wants "Loading spinner" if waiting.
        // If we set isLoading=false immediately, the Spinner in the UI (which depends on isLoading) will disappear.
        // We should NOT set isLoading=false here. We should let it stay true until completeHandler?
        // WAIT: The previous code sets `isLoading(false)` immediately essentially to show "partial results".
        // But `isLoading` is used to disable inputs AND show the big spinner in static mode.
        // If we want to show streamed content, we MUST allow the UI to render the content area.
        // In Chat Mode, we changed the logic to append the spinner. So `isLoading=true` is fine?
        // In Static Mode, `isLoading` replaces the content with a spinner. This prevents seeing the stream!
        // We need to change Static Mode rendering to allow "content + spinner/thinking"

        // Let's NOT set isLoading=false here. But we need to fix the Static Mode render.
        // However, safe path for now: Keep existing `isLoading` behavior (false on start of stream logic?? No that seems wrong)
        // Line 880 was: `setIsLoadingSynced(false);`
        // If I remove this, `isLoading` stays true.
        // The `completeHandler` sets `setIsLoading(false)`.
        // So I will remove `setIsLoading(false)` here.

        // Start thinking timer
        setIsThinkingSynced(true);
        setThinkingDurationSynced(0);
        setThinkingContentSynced(''); // Reset thinking content
        thinkingStartTimeRef.current = Date.now();
        thinkingIntervalRef.current = setInterval(() => {
          if (thinkingStartTimeRef.current) {
            const seconds = Math.floor((Date.now() - thinkingStartTimeRef.current) / 1000);
            setThinkingDuration(seconds);
          }
        }, 100);

        // Start the streaming request
        console.log('[ChatBox] Starting streaming request...');
        await window.electron.ai.generate({
          model: localModel,
          apiKey,
          systemPrompt: systemPromptWithRAG,
          userMessage: userInput,
          thinkingLevel, // Pass thinking level
          streaming: true,
          requestId
        });
      } else {
        // Non-streaming mode
        console.log('[ChatBox] Calling electron.ai.generate...');
        const result = await window.electron.ai.generate({
          model: localModel,
          apiKey,
          systemPrompt: systemPromptWithRAG,
          userMessage: userInput,
          thinkingLevel, // Pass thinking level
          streaming: false,
          requestId
        });

        console.log('[ChatBox] Received result:', {
          hasText: !!result?.text,
          textLength: result?.text?.length,
          streaming: result?.streaming
        });

        // Update current session with response
        const updatedSession = {
          ...newSession,
          assistantResponse: result.text
        };
        setCurrentSessionSynced(updatedSession);

        // Save to history automatically
        saveSessionToHistory(updatedSession);

        console.log('[ChatBox] Session updated successfully');
        setIsLoadingSynced(false);
      }
    } catch (error) {
      console.error('[ChatBox] AI Error:', error);
      console.error('[ChatBox] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setCurrentSessionSynced(prev => ({
        ...prev,
        assistantResponse: `Error: ${error.message || 'Failed to get response from AI. Please check your API key in Settings.'}`
      }));
      setIsLoadingSynced(false);
    }
  };

  const handleChatSend = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userMessage = chatInput;
    setChatInputSynced('');
    setIsLoadingSynced(true);
    setThinkingContentSynced(''); // Reset thinking content for new chat message

    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add user message to current session
    const updatedMessages = [...chatMessages, { role: 'user', content: userMessage }];
    setChatMessagesSynced(updatedMessages);

    // Update the active session in history
    if (activeSessionId) {
      const sessionIndex = chatSessions.findIndex(s => s.id === activeSessionId);
      if (sessionIndex !== -1) {
        const updatedSessions = [...chatSessions];
        updatedSessions[sessionIndex] = {
          ...updatedSessions[sessionIndex],
          messages: updatedMessages,
          timestamp: Date.now(),
        };
        setChatSessions(updatedSessions);
        // Chat sessions are saved via localStorage in state persistence
      }
    }

    try {
      const apiKey = getApiKey();
      console.log('[ChatBox] Got API key for chat, length:', apiKey?.length);

      // Build prompt with RAG context if available
      let basePrompt = localPrompt;
      if (refineContext) {
        basePrompt = `${localPrompt}\n\n---\nCRITICAL — REFINEMENT MODE:\nYou are now in refinement mode. The user's follow-up messages are NOT new inputs to process from scratch. They are instructions, clarifications, or corrections about the previous response.\n\nOriginal user input: "${refineContext.userInput}"\nYour previous response: "${refineContext.assistantResponse}"\n\nWhen the user sends a follow-up message:\n- Treat it as feedback or clarification about the ORIGINAL input/response above.\n- Produce a REVISED version of the original response incorporating the user's feedback.\n- Do NOT process the follow-up message as a new standalone request.\n- For example, if the user clarifies what they actually meant, re-do the original task with that updated understanding.\n---`;
      }
      const systemPromptWithRAG = await buildPromptWithRAG(basePrompt, userMessage);
      console.log('[ChatBox] RAG context added for chat:', systemPromptWithRAG !== basePrompt, 'refineMode:', !!refineContext);

      if (streaming) {
        let streamedContent = '';
        let updateScheduled = false;
        let pendingUpdate = false;

        const updateUI = () => {
          // Update the last assistant message with streamed content
          setChatMessages(prevMessages => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              return prevMessages.map((msg, idx) =>
                idx === prevMessages.length - 1 ? { ...msg, content: streamedContent } : msg
              );
            } else {
              // If for some reason the last message isn't assistant, add a new one
              return [...prevMessages, { role: 'assistant', content: streamedContent }];
            }
          });
          updateScheduled = false;

          if (pendingUpdate) {
            pendingUpdate = false;
            updateScheduled = true;
            setTimeout(updateUI, 16);
          }
        };

        const thinkingHandler = ({ requestId: thinkingReqId, content }) => {
          if (thinkingReqId === requestId) {
            setThinkingContent(prev => prev + content);
          }
        };

        const chunkHandler = ({ requestId: chunkReqId, chunk }) => {
          if (chunkReqId === requestId) {
            if (thinkingStartTimeRef.current) {
              clearInterval(thinkingIntervalRef.current);
              thinkingStartTimeRef.current = null;
              setIsThinkingSynced(false);
              // Don't clear thinking content - preserve it for display
            }

            streamedContent += chunk;
            if (!updateScheduled) {
              updateScheduled = true;
              setTimeout(updateUI, 16);
            } else {
              pendingUpdate = true;
            }
          }
        };

        const completeHandler = ({ requestId: completeReqId }) => {
          if (completeReqId === requestId) {
            if (thinkingStartTimeRef.current) {
              clearInterval(thinkingIntervalRef.current);
              thinkingStartTimeRef.current = null;
              setIsThinkingSynced(false);
              // Don't clear thinking content - preserve it for display
            }

            // Capture thinking data before any resets
            const finalThinkingContent = thinkingContent;
            const finalThinkingDuration = thinkingDuration;

            // Ensure final update - save thinking data with the message
            setChatMessagesSynced(prevMessages => {
              const lastMessage = prevMessages[prevMessages.length - 1];
              const messageWithThinking = {
                role: 'assistant',
                content: streamedContent,
                thinkingContent: finalThinkingContent,
                thinkingDuration: finalThinkingDuration
              };
              if (lastMessage && lastMessage.role === 'assistant') {
                return prevMessages.map((msg, idx) =>
                  idx === prevMessages.length - 1 ? messageWithThinking : msg
                );
              } else {
                return [...prevMessages, messageWithThinking];
              }
            });

            // Save updated session to history
            if (activeSessionId) {
              const sessionIndex = chatSessions.findIndex(s => s.id === activeSessionId);
              if (sessionIndex !== -1) {
                const updatedSessions = [...chatSessions];
                updatedSessions[sessionIndex] = {
                  ...updatedSessions[sessionIndex],
                  messages: [...updatedMessages, {
                    role: 'assistant',
                    content: streamedContent,
                    thinkingContent: finalThinkingContent,
                    thinkingDuration: finalThinkingDuration
                  }],
                  timestamp: Date.now(),
                };
                setChatSessions(updatedSessions);
                // Chat sessions are saved via localStorage in state persistence
              }
            }

            setIsLoadingSynced(false);
            window.electron.ai.removeStreamListeners();
          }
        };

        const errorHandler = ({ requestId: errorReqId, error }) => {
          if (errorReqId === requestId) {
            console.error('[ChatBox] Chat Stream error:', error);
            // Stop thinking state
            if (thinkingStartTimeRef.current) {
              clearInterval(thinkingIntervalRef.current);
              thinkingStartTimeRef.current = null;
              setIsThinkingSynced(false);
            }
            // Update the placeholder assistant message with error
            setChatMessagesSynced(prevMessages => {
              const lastMessage = prevMessages[prevMessages.length - 1];
              if (lastMessage && lastMessage.role === 'assistant') {
                return prevMessages.map((msg, idx) =>
                  idx === prevMessages.length - 1 ? { ...msg, content: `Error: ${error || 'Failed to get response from AI.'}` } : msg
                );
              } else {
                return [...prevMessages, { role: 'assistant', content: `Error: ${error || 'Failed to get response from AI.'}` }];
              }
            });
            setIsLoadingSynced(false);
            window.electron.ai.removeStreamListeners();
          }
        };

        // Remove any existing listeners before registering new ones
        window.electron.ai.removeStreamListeners();

        window.electron.ai.onStreamChunk(chunkHandler);
        window.electron.ai.onStreamComplete(completeHandler);
        window.electron.ai.onStreamError(errorHandler);
        window.electron.ai.onStreamThinking(thinkingHandler); // Listen for thinking events in chat

        // Add a placeholder for the assistant's response immediately
        setChatMessagesSynced(prev => [...prev, { role: 'assistant', content: '' }]);

        // Start thinking timer
        setIsThinkingSynced(true);
        setThinkingDurationSynced(0);
        setThinkingContentSynced(''); // Reset thinking content
        thinkingStartTimeRef.current = Date.now();
        thinkingIntervalRef.current = setInterval(() => {
          if (thinkingStartTimeRef.current) {
            const seconds = Math.floor((Date.now() - thinkingStartTimeRef.current) / 1000);
            setThinkingDuration(seconds);
          }
        }, 100);

        await window.electron.ai.generate({
          model: localModel,
          apiKey,
          systemPrompt: systemPromptWithRAG,
          messages: updatedMessages, // Pass full chat history
          thinkingLevel,
          streaming: true,
          requestId
        });

      } else {
        // Non-streaming chat mode
        const result = await window.electron.ai.generate({
          model: localModel,
          apiKey,
          systemPrompt: systemPromptWithRAG,
          messages: updatedMessages, // Pass full chat history
          thinkingLevel,
          streaming: false,
          requestId
        });

        const assistantResponse = result.text;
        const finalMessages = [...updatedMessages, { role: 'assistant', content: assistantResponse }];
        setChatMessagesSynced(finalMessages);

        // Update the active session in history with the new messages
        if (activeSessionId) {
          const sessionIndex = chatSessions.findIndex(s => s.id === activeSessionId);
          if (sessionIndex !== -1) {
            const updatedSessions = [...chatSessions];
            updatedSessions[sessionIndex] = {
              ...updatedSessions[sessionIndex],
              messages: finalMessages,
              timestamp: Date.now(),
            };
            setChatSessions(updatedSessions);
            // Chat sessions are saved via localStorage in state persistence
          }
        }
        setIsLoadingSynced(false);
      }
    } catch (error) {
      console.error('[ChatBox] Chat AI Error:', error);
      setChatMessagesSynced(prevMessages => [
        ...prevMessages,
        { role: 'assistant', content: `Error: ${error.message || 'Failed to get response from AI. Please check your API key in Settings.'}` }
      ]);
      setIsLoadingSynced(false);
    }
  };

  const handleMouseDown = (e) => {
    if (isLocked || locked || e.target.closest('.no-drag')) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - x * gridSize,
      y: e.clientY - y * gridSize,
    });
    if (onDragStart) onDragStart();
  };

  const handleResizeMouseDown = (e, direction) => {
    if (isLocked || locked) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: width,
      height: height,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging && !locked) {
      const newX = Math.round((e.clientX - dragStart.x) / gridSize);
      const newY = Math.round((e.clientY - dragStart.y) / gridSize);
      onUpdate({ x: newX, y: newY });
    }

    if (isResizing && !locked) {
      const deltaX = Math.round((e.clientX - resizeStart.x) / gridSize);
      const deltaY = Math.round((e.clientY - resizeStart.y) / gridSize);

      let updates = {};

      if (resizeDirection.includes('right')) {
        updates.width = Math.max(MIN_WIDTH, resizeStart.width + deltaX);
      }
      if (resizeDirection.includes('left')) {
        const newWidth = Math.max(MIN_WIDTH, resizeStart.width - deltaX);
        if (newWidth > MIN_WIDTH) {
          updates.x = x + (resizeStart.width - newWidth);
          updates.width = newWidth;
        } else {
          updates.width = MIN_WIDTH;
        }
      }
      if (resizeDirection.includes('bottom')) {
        updates.height = Math.max(MIN_HEIGHT, resizeStart.height + deltaY);
      }
      if (resizeDirection.includes('top')) {
        const newHeight = Math.max(MIN_HEIGHT, resizeStart.height - deltaY);
        if (newHeight > MIN_HEIGHT) {
          updates.y = y + (resizeStart.height - newHeight);
          updates.height = newHeight;
        } else {
          updates.height = MIN_HEIGHT;
        }
      }

      if (Object.keys(updates).length > 0) {
        onUpdate(updates);
      }
    }
  };

  const handleMouseUp = () => {
    const wasDragging = isDragging;
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection(null);
    if (wasDragging && onDragEnd) onDragEnd();
  };

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, resizeDirection, locked, x, y, width, height]);

  // Handle clicks outside the selection menu
  useEffect(() => {
    if (showSelectionMenu) {
      const handleClickOutside = (event) => {
        if (selectionMenuRef.current && !selectionMenuRef.current.contains(event.target)) {
          setShowSelectionMenu(false);
        }
      };

      // Use mousedown instead of click to handle it before other events
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showSelectionMenu]);

  const getModelIcon = (size = 20) => {
    if (localModel.startsWith('gpt-') || localModel.startsWith('openai-')) {
      return <img src="/gpt-icon.svg" alt="OpenAI" style={{ width: size, height: size }} />;
    } else if (localModel.startsWith('claude-')) {
      return <img src="/claude-icon.svg" alt="Claude" style={{ width: size, height: size }} />;
    } else if (localModel.startsWith('gemini-')) {
      return <img src="/gemini-icon.svg" alt="Gemini" style={{ width: size, height: size }} />;
    }
    return <img src="/gpt-icon.svg" alt="AI" style={{ width: size, height: size, opacity: 0.5 }} />;
  };

  const getModelDisplayName = () => {
    const modelNames = {
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'claude-sonnet-4-5-20250929': 'Claude Sonnet 4.5',
      'claude-opus-4-1-20250805': 'Claude Opus 4.1',
      'claude-haiku-4-5-20251001': 'Claude Haiku 4.5',
      'claude-sonnet-4-20250514': 'Claude Sonnet 4',
      'claude-3-7-sonnet-20250219': 'Claude 3.7 Sonnet',
      'claude-opus-4-20250514': 'Claude Opus 4',
      'claude-3-5-haiku-20241022': 'Claude Haiku 3.5',
      'claude-3-haiku-20240307': 'Claude Haiku 3',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'gemini-1.0-pro': 'Gemini 1.0 Pro',
      'gemini-3-pro-preview': 'Gemini 3 Pro',
      'gemini-3-flash-preview': 'Gemini 3 Flash',
    };
    return modelNames[localModel] || localModel;
  };

  return (
    <div
      ref={chatBoxRef}
      onClick={(e) => {
        e.stopPropagation();
        onFocus();
      }}
      className={`${isFloatingWidget ? 'h-screen w-screen' : 'absolute'} bg-slate-800 border-2 rounded-lg shadow-xl flex flex-col select-none ${!isLocked && !isFloatingWidget
        ? isDragging
          ? 'cursor-grabbing'
          : 'cursor-grab'
        : 'cursor-default'
        }`}
      style={isFloatingWidget ? {
        borderColor: localTintColor || '#3b82f6',
      } : {
        left: `${x * gridSize}px`,
        top: `${y * gridSize}px`,
        width: `${width * gridSize}px`,
        height: `${height * gridSize}px`,
        zIndex: isDraggingFromParent ? 100 : 10,
        pointerEvents: 'auto',
        borderColor: isLocked ? '#475569' : (locked ? '#64748b' : (localTintColor || '#3b82f6')),
        opacity: isDraggingFromParent ? 0.5 : 1,
        transition: isDraggingFromParent ? 'none' : 'opacity 0.2s',
      }}
    >
      {/* Tint color overlay - highest z-index to show selection highlight above all content */}
      <div
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{
          backgroundColor: localTintColor || '#3b82f6',
          opacity: 0.08,
          zIndex: 50,
        }}
      />
      {/* Header */}
      <div
        className="relative z-10 flex items-center justify-between p-2 border-b border-slate-600 rounded-t-lg min-h-[44px]"
        style={{
          backgroundColor: `color-mix(in srgb, ${localTintColor || '#3b82f6'} 20%, #334155)`,
          WebkitAppRegion: isFloatingWidget ? 'drag' : 'no-drag',
        }}
        onMouseDown={isFloatingWidget ? undefined : handleMouseDown}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!isLocked && <GripVertical className="h-4 w-4 text-slate-400 flex-shrink-0" />}

          {/* Model Icon - Windows 98 style app icon */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={isLocked || locked}>
              <button
                className={`h-7 w-7 p-0 border-none bg-transparent rounded no-drag flex items-center justify-center flex-shrink-0 ${isLocked || locked ? 'cursor-default opacity-60' : 'hover:bg-slate-600'
                  }`}
                onMouseDown={(e) => e.stopPropagation()}
                disabled={isLocked || locked}
              >
                {getModelIcon()}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-slate-900 border-slate-600 shadow-2xl min-w-[180px] text-slate-100">
              {/* OpenAI Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-sm text-slate-100 focus:bg-slate-700 focus:text-slate-100 cursor-pointer">
                  <div className="flex items-center gap-3 flex-1">
                    <img src="/gpt-icon.svg" alt="OpenAI" className="h-5 w-5" />
                    <span className="font-medium">OpenAI</span>
                    {apiKeys.openai ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500 ml-auto" />
                    )}
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-slate-900 border-slate-600 text-slate-100">
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('gpt-4');
                      onUpdate({ model: 'gpt-4' });
                    }}
                  >
                    GPT-4
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('gpt-4-turbo');
                      onUpdate({ model: 'gpt-4-turbo' });
                    }}
                  >
                    GPT-4 Turbo
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('gpt-3.5-turbo');
                      onUpdate({ model: 'gpt-3.5-turbo' });
                    }}
                  >
                    GPT-3.5 Turbo
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Claude Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-sm text-slate-100 focus:bg-slate-700 focus:text-slate-100 cursor-pointer">
                  <div className="flex items-center gap-3 flex-1">
                    <img src="/claude-icon.svg" alt="Claude" className="h-5 w-5" />
                    <span className="font-medium">Claude</span>
                    {apiKeys.claude ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500 ml-auto" />
                    )}
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-slate-900 border-slate-600 text-slate-100">
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('claude-sonnet-4-5-20250929');
                      onUpdate({ model: 'claude-sonnet-4-5-20250929' });
                    }}
                  >
                    Claude Sonnet 4.5
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('claude-opus-4-1-20250805');
                      onUpdate({ model: 'claude-opus-4-1-20250805' });
                    }}
                  >
                    Claude Opus 4.1
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('claude-haiku-4-5-20251001');
                      onUpdate({ model: 'claude-haiku-4-5-20251001' });
                    }}
                  >
                    Claude Haiku 4.5
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('claude-sonnet-4-20250514');
                      onUpdate({ model: 'claude-sonnet-4-20250514' });
                    }}
                  >
                    Claude Sonnet 4 (Legacy)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('claude-3-7-sonnet-20250219');
                      onUpdate({ model: 'claude-3-7-sonnet-20250219' });
                    }}
                  >
                    Claude 3.7 Sonnet (Legacy)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('claude-opus-4-20250514');
                      onUpdate({ model: 'claude-opus-4-20250514' });
                    }}
                  >
                    Claude Opus 4 (Legacy)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('claude-3-5-haiku-20241022');
                      onUpdate({ model: 'claude-3-5-haiku-20241022' });
                    }}
                  >
                    Claude Haiku 3.5 (Legacy)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('claude-3-haiku-20240307');
                      onUpdate({ model: 'claude-3-haiku-20240307' });
                    }}
                  >
                    Claude Haiku 3 (Legacy)
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              {/* Gemini Submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-sm text-slate-100 focus:bg-slate-700 focus:text-slate-100 cursor-pointer">
                  <div className="flex items-center gap-3 flex-1">
                    <img src="/gemini-icon.svg" alt="Gemini" className="h-5 w-5" />
                    <span className="font-medium">Gemini</span>
                    {apiKeys.gemini ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-500 ml-auto" />
                    )}
                  </div>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-slate-900 border-slate-600 text-slate-100">
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('gemini-1.5-pro');
                      onUpdate({ model: 'gemini-1.5-pro' });
                    }}
                  >
                    Gemini 1.5 Pro
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('gemini-1.5-flash');
                      onUpdate({ model: 'gemini-1.5-flash' });
                    }}
                  >
                    Gemini 1.5 Flash
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('gemini-1.0-pro');
                      onUpdate({ model: 'gemini-1.0-pro' });
                    }}
                  >
                    Gemini 1.0 Pro
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('gemini-3-pro-preview');
                      onUpdate({ model: 'gemini-3-pro-preview' });
                    }}
                  >
                    Gemini 3 Pro
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-sm cursor-pointer focus:bg-slate-700"
                    onClick={() => {
                      setLocalModel('gemini-3-flash-preview');
                      onUpdate({ model: 'gemini-3-flash-preview' });
                    }}
                  >
                    Gemini 3 Flash
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          <input
            type="text"
            value={localName}
            onChange={(e) => {
              if (!isLocked && !locked) {
                setLocalName(e.target.value);
                onUpdate({ name: e.target.value });
              }
            }}
            className={`bg-transparent border-none outline-none text-sm text-slate-100 font-medium flex-1 min-w-0 px-1 rounded no-drag select-text ${isLocked || locked ? 'cursor-default' : 'focus:bg-slate-600'
              }`}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            readOnly={isLocked || locked}
          />
        </div>
        <div className="flex items-center gap-1 no-drag flex-shrink-0 ml-2" style={{ WebkitAppRegion: 'no-drag' }}>
          {!isLocked && (
            <>
              {!isFloatingWidget && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ${locked ? 'text-yellow-400 hover:text-yellow-300' : 'text-slate-400 hover:text-slate-300'}`}
                  onClick={() => onUpdate({ locked: !locked })}
                >
                  {locked ? (
                    <Lock className="h-3 w-3" />
                  ) : (
                    <Unlock className="h-3 w-3" />
                  )}
                </Button>
              )}
              {!isFloatingWidget && !hasActiveWidget && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-400 hover:text-slate-300"
                  onClick={async () => {
                    if (window.electron?.floating) {
                      try {
                        const windowData = {
                          name,
                          model: localModel,
                          systemPrompt: localPrompt,
                          tintColor: localTintColor,
                          apiKeys,
                          currentResponse: currentSession?.assistantResponse || null,
                          chatMessages,
                          isChatMode,
                          width: Math.max(400, width * gridSize),
                          height: Math.max(500, height * gridSize),
                        };
                        console.log('[ChatBox] Creating floating window:', id, windowData);
                        const result = await window.electron.floating.create(id, windowData);
                        console.log('[ChatBox] Floating window result:', result);
                        if (result.success && onWidgetCreated) {
                          onWidgetCreated();
                        }
                      } catch (err) {
                        console.error('[ChatBox] Failed to create floating window:', err);
                        toast.error('Failed to create floating window');
                      }
                    } else {
                      console.error('[ChatBox] Floating API not available');
                      toast.error('Floating windows not available');
                    }
                  }}
                  title="Pop out as floating window"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
              {isFloatingWidget && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-400 hover:text-slate-300"
                  onClick={() => {
                    window.electron?.floating?.showMain();
                  }}
                  title="Show in main window"
                >
                  <Monitor className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-red-400 hover:text-red-300"
                onClick={() => {
                  if (isFloatingWidget) {
                    if (window.confirm('Close this widget?')) {
                      onRemove();
                    }
                  } else {
                    onRemove();
                  }
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="relative z-10 flex border-b border-slate-600 no-drag bg-slate-750">
        <button
          onClick={() => setActiveTabSynced('main')}
          className={`px-4 py-2 text-xs font-medium transition-colors flex items-center justify-center ${activeTab === 'main'
            ? 'bg-slate-800'
            : 'text-slate-400 hover:text-slate-200'
            }`}
          style={activeTab === 'main' ? {
            color: localTintColor,
            borderBottom: `2px solid ${localTintColor}`,
          } : {}}
          title="Home"
        >
          <Home className="h-4 w-4" />
        </button>
        <button
          onClick={() => setActiveTabSynced('history')}
          className={`px-4 py-2 text-xs font-medium transition-colors flex items-center justify-center ${activeTab === 'history'
            ? 'bg-slate-800'
            : 'text-slate-400 hover:text-slate-200'
            }`}
          style={activeTab === 'history' ? {
            color: localTintColor,
            borderBottom: `2px solid ${localTintColor}`,
          } : {}}
          title="History"
        >
          <History className="h-4 w-4" />
        </button>
        <button
          onClick={() => setActiveTabSynced('settings')}
          className={`px-4 py-2 text-xs font-medium transition-colors flex items-center justify-center ${activeTab === 'settings'
            ? 'bg-slate-800'
            : 'text-slate-400 hover:text-slate-200'
            }`}
          style={activeTab === 'settings' ? {
            color: localTintColor,
            borderBottom: `2px solid ${localTintColor}`,
          } : {}}
          title="Settings"
        >
          <Settings className="h-4 w-4" />
        </button>
        <button
          onClick={() => setActiveTabSynced('resource')}
          className={`px-4 py-2 text-xs font-medium transition-colors flex items-center justify-center ${activeTab === 'resource'
            ? 'bg-slate-800'
            : 'text-slate-400 hover:text-slate-200'
            }`}
          style={activeTab === 'resource' ? {
            color: localTintColor,
            borderBottom: `2px solid ${localTintColor}`,
          } : {}}
          title="Resource"
        >
          <FileText className="h-4 w-4" />
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'main' && (
        <div className="relative z-10 flex flex-col flex-1 min-h-0">
          {/* Input area - at top */}
          <div className="p-3 border-b border-slate-600 no-drag bg-slate-750 cursor-default">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInputSynced(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your input here... (Shift+Enter for new line)"
                className="bg-slate-900 border-slate-700 text-slate-100 text-sm resize-none select-text placeholder:text-slate-500"
                rows={2}
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Result area - single turn display or chat mode */}
          <div ref={mainResultRef} className="flex-1 overflow-y-auto relative flex flex-col">
            {isChatMode ? (
              /* Chat Mode: Show all messages as chat bubbles */
              <div ref={chatMessagesRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg, idx) => {
                  // Skip empty assistant messages (placeholder while loading)
                  if (msg.role === 'assistant' && !msg.content) return null;

                  return (
                  <React.Fragment key={idx}>
                    {/* Show thinking content before each assistant message that has thinking data */}
                    {msg.role === 'assistant' && msg.thinkingDuration > 0 && (
                      <div className="flex justify-start w-full">
                        <ThinkingProcess isThinking={false} duration={msg.thinkingDuration} content={msg.thinkingContent || ''} />
                      </div>
                    )}
                    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-lg ${msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-700 text-slate-100'
                        }`}
                    >
                      <div
                        className="text-sm no-drag select-text cursor-text p-3"
                        style={{ fontSize: `${fontSize}px` }}
                        onMouseUp={handleTextSelection}
                      >
                        {msg.role === 'assistant' ? (
                          <MarkdownMessage content={msg.content} />
                        ) : (
                          <div className="whitespace-pre-wrap">{msg.content}</div>
                        )}
                      </div>

                      {/* Action buttons for assistant messages */}
                      {msg.role === 'assistant' && (
                        <div className="flex gap-1 px-3 pb-2 pt-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 hover:bg-slate-600"
                            onClick={async () => {
                              try {
                                await navigator.clipboard.writeText(msg.content);
                                toast.success('Copied to clipboard');
                              } catch (err) {
                                console.error('Failed to copy:', err);
                                toast.error('Failed to copy');
                              }
                            }}
                            title="Copy message"
                          >
                            <Copy className="h-3 w-3 text-slate-400" />
                          </Button>
                          {allWindows && allWindows.length > 1 && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 hover:bg-slate-600"
                                  title="Send to window"
                                >
                                  <Send className="h-3 w-3 text-slate-400" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-slate-900 border-slate-600 text-slate-100">
                                {allWindows
                                  .filter(w => w.id !== id)
                                  .map(window => (
                                    <DropdownMenuItem
                                      key={window.id}
                                      className="text-sm cursor-pointer focus:bg-slate-700"
                                      onClick={() => {
                                        if (onSendToWindow) {
                                          onSendToWindow(window.id, msg.content);
                                        }
                                      }}
                                    >
                                      {window.name}
                                    </DropdownMenuItem>
                                  ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  </React.Fragment>
                  );
                })}

                {/* Thinking Process Indicator - only show when actively thinking */}
                {isThinking && (
                  <div className="flex justify-start w-full">
                    <ThinkingProcess isThinking={isThinking} duration={thinkingDuration} content={thinkingContent} />
                  </div>
                )}

                {/* Loading indicator for chat mode */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-700 rounded-lg p-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-400" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Static Output Mode */
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto p-4">
                  {/* Show Thinking Process if active or has duration */}
                  {(isThinking || thinkingDuration > 0) && (
                    <div className="mb-4">
                      <ThinkingProcess isThinking={isThinking} duration={thinkingDuration} content={thinkingContent} />
                    </div>
                  )}

                  {isLoading ? (
                    /* Static Loading State */
                    <div className="flex items-center justify-center h-20 text-slate-400">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                  ) : currentResponse && showCurrentResponse ? (
                    /* Static Content State */
                    <div>
                      <div className="sticky top-0 float-right ml-2 mb-1 flex items-center gap-0.5 bg-slate-900/30 backdrop-blur-sm border border-slate-600/50 rounded-md px-1 py-0.5 shadow-lg z-10 no-drag opacity-40 hover:opacity-100 hover:bg-slate-900/90 hover:border-slate-600 transition-all duration-200">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-slate-700"
                          onClick={decreaseFontSize}
                          disabled={fontSize <= 8}
                          title="Decrease font size"
                        >
                          <Minus className="h-3 w-3 text-slate-300" />
                        </Button>
                        <span className="text-xs text-slate-200 w-6 text-center">{fontSize}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 hover:bg-slate-700"
                          onClick={increaseFontSize}
                          disabled={fontSize >= 32}
                          title="Increase font size"
                        >
                          <Plus className="h-3 w-3 text-slate-300" />
                        </Button>
                      </div>

                      <div
                        className="text-sm leading-relaxed no-drag select-text cursor-text text-slate-200"
                        style={{ fontSize: `${fontSize}px` }}
                        onMouseUp={handleTextSelection}
                      >
                        <MarkdownMessage content={currentResponse} />
                      </div>
                    </div>
                  ) : (
                    /* Empty State */
                    <div className="flex items-center justify-center h-full text-slate-500 select-none no-drag">
                      Enter your input above and press Send
                    </div>
                  )}
                </div>

                {/* Fixed Refine in chat button at bottom - outside scrollable area */}
                {currentResponse && showCurrentResponse && !isLoading && (
                  <div className="border-t border-slate-700/50 p-2 bg-slate-900/80 backdrop-blur-sm flex justify-center no-drag shrink-0 z-10">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (currentSession && currentSession.sessionId) {
                          const existingSession = chatSessions.find(s => s.id === currentSession.sessionId);
                          if (existingSession) {
                            setActiveSessionIdSynced(existingSession.id);
                            setChatMessagesSynced(existingSession.messages);
                            setRefineContext({
                              userInput: currentSession.userInput,
                              assistantResponse: currentSession.assistantResponse,
                            });
                            setIsChatModeSynced(true);
                          }
                        }
                      }}
                      disabled={isLoading}
                      className="text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 disabled:opacity-30 disabled:cursor-not-allowed text-xs"
                    >
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Refine in chat
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Chat input - only shown in chat mode */}
          {
            isChatMode && (
              <div className="p-3 border-t border-slate-700 no-drag bg-slate-750 cursor-default">
                <div className="flex gap-2 items-end">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsChatModeSynced(false);
                      setActiveSessionIdSynced(null);
                      setRefineContext(null);
                    }}
                    className="flex-shrink-0 text-slate-400 hover:text-slate-200 hover:bg-slate-700"
                    title="Back to single output"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <Textarea
                    ref={chatInputRef}
                    value={chatInput}
                    onChange={(e) => {
                      setChatInputSynced(e.target.value);
                      // Auto-resize textarea based on content (min: 40px, max: 200px ~8 lines)
                      if (chatInputRef.current) {
                        chatInputRef.current.style.height = '40px';
                        const newHeight = Math.min(Math.max(40, chatInputRef.current.scrollHeight), 200);
                        chatInputRef.current.style.height = `${newHeight}px`;
                      }
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleChatSend();
                        // Reset height after sending
                        if (chatInputRef.current) {
                          chatInputRef.current.style.height = '40px';
                        }
                      }
                    }}
                    placeholder="Continue the conversation... (Shift+Enter for new line)"
                    className="bg-slate-900 border-slate-700 text-slate-100 text-sm resize-none select-text placeholder:text-slate-500 overflow-y-auto"
                    style={{ minHeight: '40px', height: '40px', maxHeight: '200px' }}
                    disabled={isLoading}
                  />
                  <Button
                    size="icon"
                    onClick={handleChatSend}
                    disabled={isLoading || !chatInput.trim()}
                    className="flex-shrink-0"
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )
          }
        </div>
      )
      }

      {/* History Tab Content - List of Chat Sessions */}
      {
        activeTab === 'history' && (
          <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-3">
            {chatSessions.length === 0 ? (
              <div className="text-sm text-slate-400 text-center py-8">
                No chat sessions yet. Create a single-turn output and click "Refine in chat" to start a session.
              </div>
            ) : (
              // Display sessions in reverse order (newest first)
              [...chatSessions].reverse().map((session) => (
                <div
                  key={session.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors no-drag ${session.id === activeSessionId
                    ? 'border-blue-500 bg-slate-700/50'
                    : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
                    }`}
                  onClick={() => {
                    // Load this session (not a refine - just reopening history)
                    setActiveSessionIdSynced(session.id);
                    setChatMessagesSynced(session.messages);
                    setRefineContext(null);
                    setIsChatModeSynced(true);
                    setActiveTabSynced('main'); // Switch back to main tab to show the chat
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate mb-1">
                        {session.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {session.messages.length} messages • {new Date(session.timestamp).toLocaleString()}
                      </div>
                    </div>
                    {session.id === activeSessionId && (
                      <div className="text-xs text-blue-400 flex-shrink-0">Active</div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )
      }

      {/* Settings Tab Content */}
      {
        activeTab === 'settings' && (
          <div className="relative z-10 flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Streaming Response</label>
                <div className={`flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-lg ${isLocked || locked ? 'opacity-60' : ''
                  }`}>
                  <div>
                    <p className="text-sm text-slate-200">Enable real-time streaming</p>
                    <p className="text-xs text-slate-500">Show responses as they are generated</p>
                  </div>
                  <Switch
                    checked={streaming}
                    onCheckedChange={(checked) => {
                      if (!isLocked && !locked) {
                        onUpdate({ streaming: checked });
                      }
                    }}
                    disabled={isLocked || locked}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">Model</label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild disabled={isLocked || locked}>
                    <button
                      className={`w-full flex items-center justify-between bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 transition-colors ${isLocked || locked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-800'
                        }`}
                      disabled={isLocked || locked}
                    >
                      <div className="flex items-center gap-2">
                        {getModelIcon()}
                        <span>{getModelDisplayName()}</span>
                      </div>
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-900 border-slate-600 shadow-2xl w-[300px] text-slate-100">
                    {/* OpenAI Submenu */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-sm text-slate-100 focus:bg-slate-700 focus:text-slate-100 cursor-pointer">
                        <div className="flex items-center gap-3 flex-1">
                          <img src="/gpt-icon.svg" alt="OpenAI" className="h-5 w-5" />
                          <span className="font-medium">OpenAI</span>
                          {apiKeys.openai ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500 ml-auto" />
                          )}
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-slate-900 border-slate-600 text-slate-100">
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('gpt-4');
                            onUpdate({ model: 'gpt-4' });
                          }}
                        >
                          GPT-4
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('gpt-4-turbo');
                            onUpdate({ model: 'gpt-4-turbo' });
                          }}
                        >
                          GPT-4 Turbo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('gpt-3.5-turbo');
                            onUpdate({ model: 'gpt-3.5-turbo' });
                          }}
                        >
                          GPT-3.5 Turbo
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {/* Claude Submenu */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-sm text-slate-100 focus:bg-slate-700 focus:text-slate-100 cursor-pointer">
                        <div className="flex items-center gap-3 flex-1">
                          <img src="/claude-icon.svg" alt="Claude" className="h-5 w-5" />
                          <span className="font-medium">Claude</span>
                          {apiKeys.claude ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500 ml-auto" />
                          )}
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-slate-900 border-slate-600 text-slate-100">
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('claude-sonnet-4-5-20250929');
                            onUpdate({ model: 'claude-sonnet-4-5-20250929' });
                          }}
                        >
                          Claude Sonnet 4.5
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('claude-opus-4-1-20250805');
                            onUpdate({ model: 'claude-opus-4-1-20250805' });
                          }}
                        >
                          Claude Opus 4.1
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('claude-haiku-4-5-20251001');
                            onUpdate({ model: 'claude-haiku-4-5-20251001' });
                          }}
                        >
                          Claude Haiku 4.5
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('claude-sonnet-4-20250514');
                            onUpdate({ model: 'claude-sonnet-4-20250514' });
                          }}
                        >
                          Claude Sonnet 4 (Legacy)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('claude-3-7-sonnet-20250219');
                            onUpdate({ model: 'claude-3-7-sonnet-20250219' });
                          }}
                        >
                          Claude 3.7 Sonnet (Legacy)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('claude-opus-4-20250514');
                            onUpdate({ model: 'claude-opus-4-20250514' });
                          }}
                        >
                          Claude Opus 4 (Legacy)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('claude-3-5-haiku-20241022');
                            onUpdate({ model: 'claude-3-5-haiku-20241022' });
                          }}
                        >
                          Claude Haiku 3.5 (Legacy)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('claude-3-haiku-20240307');
                            onUpdate({ model: 'claude-3-haiku-20240307' });
                          }}
                        >
                          Claude Haiku 3 (Legacy)
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    {/* Gemini Submenu */}
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="text-sm text-slate-100 focus:bg-slate-700 focus:text-slate-100 cursor-pointer">
                        <div className="flex items-center gap-3 flex-1">
                          <img src="/gemini-icon.svg" alt="Gemini" className="h-5 w-5" />
                          <span className="font-medium">Gemini</span>
                          {apiKeys.gemini ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-500 ml-auto" />
                          )}
                        </div>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="bg-slate-900 border-slate-600 text-slate-100">
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('gemini-1.5-pro');
                            onUpdate({ model: 'gemini-1.5-pro' });
                          }}
                        >
                          Gemini 1.5 Pro
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('gemini-1.5-flash');
                            onUpdate({ model: 'gemini-1.5-flash' });
                          }}
                        >
                          Gemini 1.5 Flash
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('gemini-1.0-pro');
                            onUpdate({ model: 'gemini-1.0-pro' });
                          }}
                        >
                          Gemini 1.0 Pro
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('gemini-3-pro-preview');
                            onUpdate({ model: 'gemini-3-pro-preview' });
                          }}
                        >
                          Gemini 3 Pro
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-sm cursor-pointer focus:bg-slate-700"
                          onClick={() => {
                            setLocalModel('gemini-3-flash-preview');
                            onUpdate({ model: 'gemini-3-flash-preview' });
                          }}
                        >
                          Gemini 3 Flash
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Thinking Level (Gemini 3 Only) */}
              {(localModel.startsWith('gemini-3-') || localModel.includes('gemini-exp-1206')) && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-200">Thinking Level</label>
                  <div className="flex gap-2">
                    {localModel.includes('flash') && (
                      <button
                        onClick={() => {
                          if (!isLocked && !locked) setThinkingLevelSynced('minimal');
                        }}
                        className={`flex-1 px-3 py-2 text-sm border rounded transition-colors ${thinkingLevel === 'minimal'
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-600 text-slate-300 hover:bg-slate-800'
                          } ${isLocked || locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={isLocked || locked}
                      >
                        Minimal
                        <div className="text-[10px] opacity-70 mt-1">Fastest</div>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (!isLocked && !locked) setThinkingLevelSynced('low');
                      }}
                      className={`flex-1 px-3 py-2 text-sm border rounded transition-colors ${thinkingLevel === 'low'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-900 border-slate-600 text-slate-300 hover:bg-slate-800'
                        } ${isLocked || locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={isLocked || locked}
                    >
                      Low
                      <div className="text-[10px] opacity-70 mt-1">Faster</div>
                    </button>
                    {localModel.includes('flash') && (
                      <button
                        onClick={() => {
                          if (!isLocked && !locked) setThinkingLevelSynced('medium');
                        }}
                        className={`flex-1 px-3 py-2 text-sm border rounded transition-colors ${thinkingLevel === 'medium'
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-600 text-slate-300 hover:bg-slate-800'
                          } ${isLocked || locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                        disabled={isLocked || locked}
                      >
                        Medium
                        <div className="text-[10px] opacity-70 mt-1">Balanced</div>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (!isLocked && !locked) setThinkingLevelSynced('high');
                      }}
                      className={`flex-1 px-3 py-2 text-sm border rounded transition-colors ${thinkingLevel === 'high'
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-900 border-slate-600 text-slate-300 hover:bg-slate-800'
                        } ${isLocked || locked ? 'opacity-60 cursor-not-allowed' : ''}`}
                      disabled={isLocked || locked}
                    >
                      High
                      <div className="text-[10px] opacity-70 mt-1">Deeper reasoning</div>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">System Prompt</label>
                {isFloatingWidget ? (
                  <div className="space-y-2">
                    <div className="min-h-[200px] bg-slate-900 border border-slate-700 rounded-md p-3 text-sm text-slate-400 select-text overflow-y-auto whitespace-pre-wrap">
                      {localPrompt || <span className="text-slate-500 italic">No system prompt set</span>}
                    </div>
                    <p className="text-xs text-slate-500">Edit system prompt from the main Pegboard window</p>
                  </div>
                ) : (
                <Textarea
                  value={localPrompt}
                  onChange={(e) => {
                    if (!isLocked && !locked) {
                      setLocalPrompt(e.target.value);
                      onUpdate({ prompt: e.target.value });
                    }
                  }}
                  placeholder="Define the AI's behavior..."
                  className={`min-h-[200px] bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 select-text ${isLocked || locked ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  readOnly={isLocked || locked}
                />
                )}
              </div>

              {/* Window Tint Color - moved from color tab */}
              <div className="space-y-2 pt-4 border-t border-slate-700">
                <label className="text-sm font-medium text-slate-200">Window Tint Color</label>
                <p className="text-xs text-slate-500">Choose a color to identify this window quickly</p>
              </div>

              <div className="grid grid-cols-8 gap-2">
                {[
                  // Blues
                  { name: 'Sky Blue', color: '#0ea5e9' },
                  { name: 'Blue', color: '#3b82f6' },
                  { name: 'Indigo', color: '#6366f1' },
                  { name: 'Navy', color: '#1e40af' },

                  // Purples & Violets
                  { name: 'Violet', color: '#8b5cf6' },
                  { name: 'Purple', color: '#a855f7' },
                  { name: 'Fuchsia', color: '#d946ef' },
                  { name: 'Magenta', color: '#c026d3' },

                  // Pinks & Reds
                  { name: 'Pink', color: '#ec4899' },
                  { name: 'Rose', color: '#f43f5e' },
                  { name: 'Red', color: '#ef4444' },
                  { name: 'Crimson', color: '#dc2626' },

                  // Oranges & Yellows
                  { name: 'Orange', color: '#f97316' },
                  { name: 'Amber', color: '#f59e0b' },
                  { name: 'Yellow', color: '#eab308' },
                  { name: 'Lime', color: '#84cc16' },

                  // Greens
                  { name: 'Green', color: '#22c55e' },
                  { name: 'Emerald', color: '#10b981' },
                  { name: 'Teal', color: '#14b8a6' },
                  { name: 'Mint', color: '#34d399' },

                  // Cyans & Aquas
                  { name: 'Cyan', color: '#06b6d4' },
                  { name: 'Aqua', color: '#22d3ee' },
                  { name: 'Turquoise', color: '#2dd4bf' },
                  { name: 'Sky', color: '#38bdf8' },

                  // Neutrals
                  { name: 'Slate', color: '#64748b' },
                  { name: 'Gray', color: '#6b7280' },
                  { name: 'Zinc', color: '#71717a' },
                  { name: 'Stone', color: '#78716c' },

                  // Browns & Earth Tones
                  { name: 'Brown', color: '#92400e' },
                  { name: 'Amber Dark', color: '#b45309' },
                  { name: 'Chocolate', color: '#7c2d12' },
                  { name: 'Olive', color: '#4d7c0f' },
                ].map((colorOption) => (
                  <button
                    key={colorOption.color}
                    onClick={() => {
                      if (!isLocked && !locked) {
                        setLocalTintColor(colorOption.color);
                        onUpdate({ tintColor: colorOption.color });
                      }
                    }}
                    className={`h-8 rounded-md border-2 transition-all ${localTintColor === colorOption.color
                      ? 'border-white scale-110'
                      : 'border-slate-600'
                      } ${isLocked || locked ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'}`}
                    style={{ backgroundColor: colorOption.color }}
                    title={colorOption.name}
                    disabled={isLocked || locked}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={localTintColor}
                  onChange={(e) => {
                    if (!isLocked && !locked) {
                      setLocalTintColor(e.target.value);
                      onUpdate({ tintColor: e.target.value });
                    }
                  }}
                  className={`h-8 w-14 rounded border border-slate-600 bg-slate-900 ${isLocked || locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  disabled={isLocked || locked}
                />
                <Input
                  type="text"
                  value={localTintColor}
                  onChange={(e) => {
                    if (!isLocked && !locked) {
                      setLocalTintColor(e.target.value);
                      onUpdate({ tintColor: e.target.value });
                    }
                  }}
                  className={`bg-slate-900 border-slate-700 text-slate-100 font-mono text-sm select-text flex-1 ${isLocked || locked ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
                  placeholder="#3b82f6"
                  readOnly={isLocked || locked}
                />
                <Button
                  variant="outline"
                  size="sm"
                  className={`border-slate-600 text-slate-200 ${isLocked || locked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-700'
                    }`}
                  onClick={() => {
                    if (!isLocked && !locked) {
                      setLocalTintColor('#3b82f6');
                      onUpdate({ tintColor: '#3b82f6' });
                    }
                  }}
                  disabled={isLocked || locked}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {/* Resource Tab Content */}
      {
        activeTab === 'resource' && (
          <div className="relative z-10 flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-200">RAG Resource</label>
                <p className="text-xs text-slate-500">Upload a plain text document to use as context for AI responses</p>
              </div>

              {/* File Upload Area */}
              <input
                type="file"
                ref={fileInputRef}
                accept=".txt,.md,.text"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  try {
                    const text = await file.text();
                    setResourceText(text);
                    setResourceFileName(file.name);

                    // Process embeddings via main process
                    setIsEmbedding(true);
                    try {
                      // Chunk the text - use multiple strategies
                      let chunks = [];

                      // First try splitting by markdown headers
                      const headerChunks = text.split(/(?=^#{1,3}\s)/m);

                      if (headerChunks.length > 1) {
                        chunks = headerChunks
                          .map(chunk => chunk.trim())
                          .filter(chunk => chunk.length > 50);
                      }

                      // If no good chunks from headers, try double newlines
                      if (chunks.length === 0) {
                        chunks = text
                          .split(/\n\n+/)
                          .map(chunk => chunk.trim())
                          .filter(chunk => chunk.length > 50);
                      }

                      // If still no chunks, split by fixed size with overlap
                      if (chunks.length === 0) {
                        const chunkSize = 500;
                        const overlap = 100;
                        for (let i = 0; i < text.length; i += chunkSize - overlap) {
                          const chunk = text.slice(i, i + chunkSize).trim();
                          if (chunk.length > 50) {
                            chunks.push(chunk);
                          }
                        }
                      }

                      // Limit chunk size to avoid embedding issues
                      chunks = chunks.flatMap(chunk => {
                        if (chunk.length > 1000) {
                          const subChunks = [];
                          for (let i = 0; i < chunk.length; i += 800) {
                            subChunks.push(chunk.slice(i, i + 1000).trim());
                          }
                          return subChunks.filter(c => c.length > 50);
                        }
                        return [chunk];
                      });

                      console.log('[RAG] Created', chunks.length, 'chunks');
                      setResourceChunks(chunks);

                      if (chunks.length === 0) {
                        console.warn('[RAG] No chunks created from document');
                        setIsEmbedding(false);
                        return;
                      }

                      // Generate embeddings via main process IPC
                      console.log('[RAG] Sending chunks to main process for embedding...');
                      const result = await window.electron.embedding.generate(chunks);
                      console.log('[RAG] Generated', result.embeddings.length, 'embeddings');
                      setResourceEmbeddings(result.embeddings);
                    } catch (embError) {
                      console.error('[RAG] Error generating embeddings:', embError);
                      console.error('[RAG] Error details:', embError.message, embError.stack);
                    }
                    setIsEmbedding(false);
                  } catch (err) {
                    console.error('Error reading file:', err);
                  }

                  // Reset file input
                  e.target.value = '';
                }}
                disabled={isLocked || locked}
              />

              {!resourceText ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`w-full border-2 border-dashed border-slate-600 rounded-lg p-8 flex flex-col items-center gap-3 transition-colors ${isLocked || locked
                    ? 'opacity-60 cursor-not-allowed'
                    : 'hover:border-slate-500 hover:bg-slate-800/50 cursor-pointer'
                    }`}
                  disabled={isLocked || locked}
                >
                  <Upload className="h-8 w-8 text-slate-400" />
                  <div className="text-center">
                    <p className="text-sm text-slate-200">Click to upload a text file</p>
                    <p className="text-xs text-slate-500 mt-1">.txt, .md files supported</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-3">
                  {/* File info */}
                  <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-700 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-200">{resourceFileName}</p>
                        <p className="text-xs text-slate-500">
                          {resourceChunks.length} chunks • {resourceText.length.toLocaleString()} characters
                        </p>
                      </div>
                    </div>
                    {isEmbedding ? (
                      <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
                    ) : resourceEmbeddings.length > 0 ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : null}
                  </div>

                  {/* Embedding status */}
                  {isEmbedding && (
                    <div className="flex items-center gap-2 text-sm text-blue-400">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generating embeddings...</span>
                    </div>
                  )}

                  {resourceEmbeddings.length > 0 && !isEmbedding && (
                    <p className="text-xs text-green-400">
                      Embeddings ready ({resourceEmbeddings.length} vectors)
                    </p>
                  )}

                  {/* Re-run embedding button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className={`w-full border-slate-600 text-slate-200 ${isLocked || locked || isEmbedding ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-700'
                      }`}
                    onClick={async () => {
                      if (isLocked || locked || isEmbedding || !resourceText) return;

                      setIsEmbedding(true);
                      try {
                        // Chunk the text - use multiple strategies
                        let chunks = [];

                        // First try splitting by markdown headers
                        const headerChunks = resourceText.split(/(?=^#{1,3}\s)/m);

                        if (headerChunks.length > 1) {
                          chunks = headerChunks
                            .map(chunk => chunk.trim())
                            .filter(chunk => chunk.length > 50);
                        }

                        // If no good chunks from headers, try double newlines
                        if (chunks.length === 0) {
                          chunks = resourceText
                            .split(/\n\n+/)
                            .map(chunk => chunk.trim())
                            .filter(chunk => chunk.length > 50);
                        }

                        // If still no chunks, split by fixed size with overlap
                        if (chunks.length === 0) {
                          const chunkSize = 500;
                          const overlap = 100;
                          for (let i = 0; i < resourceText.length; i += chunkSize - overlap) {
                            const chunk = resourceText.slice(i, i + chunkSize).trim();
                            if (chunk.length > 50) {
                              chunks.push(chunk);
                            }
                          }
                        }

                        // Limit chunk size to avoid embedding issues
                        chunks = chunks.flatMap(chunk => {
                          if (chunk.length > 1000) {
                            const subChunks = [];
                            for (let i = 0; i < chunk.length; i += 800) {
                              subChunks.push(chunk.slice(i, i + 1000).trim());
                            }
                            return subChunks.filter(c => c.length > 50);
                          }
                          return [chunk];
                        });

                        console.log('[RAG] Re-run: Created', chunks.length, 'chunks');
                        setResourceChunks(chunks);

                        if (chunks.length > 0) {
                          console.log('[RAG] Re-run: Sending to main process for embedding...');
                          const result = await window.electron.embedding.generate(chunks);
                          console.log('[RAG] Re-run: Generated', result.embeddings.length, 'embeddings');
                          setResourceEmbeddings(result.embeddings);
                        }
                      } catch (err) {
                        console.error('[RAG] Re-run error:', err);
                      }
                      setIsEmbedding(false);
                    }}
                    disabled={isLocked || locked || isEmbedding}
                  >
                    <RotateCcw className={`h-4 w-4 mr-2 ${isEmbedding ? 'animate-spin' : ''}`} />
                    {isEmbedding ? 'Processing...' : 'Re-run Embedding'}
                  </Button>

                  {/* Preview */}
                  <div className="space-y-2">
                    <label className="text-xs text-slate-400">Preview:</label>
                    <div className="max-h-40 overflow-y-auto p-3 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-300 font-mono whitespace-pre-wrap">
                      {resourceText.slice(0, 1000)}
                      {resourceText.length > 1000 && '...'}
                    </div>
                  </div>

                  {/* Remove button */}
                  <Button
                    variant="outline"
                    className={`w-full border-slate-600 text-slate-200 ${isLocked || locked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-slate-700'
                      }`}
                    onClick={() => {
                      if (!isLocked && !locked) {
                        setResourceText('');
                        setResourceChunks([]);
                        setResourceEmbeddings([]);
                        setResourceFileName('');
                      }
                    }}
                    disabled={isLocked || locked}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Document
                  </Button>
                </div>
              )}
            </div>
          </div>
        )
      }

      {/* Resize handles - hidden for floating widget */}
      {
        !isLocked && !locked && isFocused && !isFloatingWidget && (
          <>
            {/* Corner handles - z-[9999] for highest priority */}
            <div
              className="absolute top-0 left-0 w-4 h-4 bg-green-500 border-2 border-green-300 cursor-nw-resize no-drag rounded-sm z-[9999]"
              onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-green-300 cursor-ne-resize no-drag rounded-sm z-[9999]"
              onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 bg-green-500 border-2 border-green-300 cursor-sw-resize no-drag rounded-sm z-[9999]"
              onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')}
            />
            <div
              className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-green-300 cursor-se-resize no-drag rounded-sm z-[9999]"
              onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}
            />
            {/* Edge handles - z-[9999] for highest priority */}
            <div
              className="absolute top-0 left-4 right-4 h-2 cursor-n-resize no-drag hover:bg-green-500/70 bg-green-500/30 rounded-sm z-[9999]"
              onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
            />
            <div
              className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize no-drag hover:bg-green-500/70 bg-green-500/30 rounded-sm z-[9999]"
              onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
            />
            <div
              className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize no-drag hover:bg-green-500/70 bg-green-500/30 rounded-sm z-[9999]"
              onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
            />
            <div
              className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize no-drag hover:bg-green-500/70 bg-green-500/30 rounded-sm z-[9999]"
              onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
            />
          </>
        )
      }

      {/* Global Floating selection menu */}
      {
        showSelectionMenu && selectedText && (
          <div
            ref={selectionMenuRef}
            className="fixed z-[101] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden no-drag select-none"
            style={{
              left: `${menuPosition.x}px`,
              top: `${menuPosition.y}px`,
              transform: 'translate(-50%, -100%)',
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              onClick={handleCopySelectedText}
              onMouseDown={(e) => e.preventDefault()}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 w-full text-left transition-colors"
            >
              <Copy className="h-4 w-4" />
              Copy
            </button>
            {allWindows && allWindows.length > 1 && (
              <div className="relative group">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 w-full text-left transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Send to Window
                  <svg className="ml-auto h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                {/* Submenu */}
                <div className="absolute left-full top-0 ml-1 hidden group-hover:block bg-slate-800 border border-slate-700 rounded-lg shadow-2xl overflow-hidden min-w-[150px]">
                  {allWindows
                    .filter(w => w.id !== id)
                    .map(window => (
                      <button
                        key={window.id}
                        onClick={() => handleSendToWindow(window.id)}
                        onMouseDown={(e) => e.preventDefault()}
                        className="px-4 py-2 text-sm text-slate-100 hover:bg-slate-700 w-full text-left transition-colors"
                      >
                        {window.name}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )
      }

      {/* Toast notifications */}
      <Toaster position="top-center" theme="dark" />
    </div >
  );
}

export default ChatBox;
