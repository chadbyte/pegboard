const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');

app.setName('Pegboard');

let mainWindow;
let tray = null;
const floatingWindows = new Map(); // Track floating windows by chatbox ID

// Widget state persistence
const getWidgetStatePath = () => {
  return path.join(app.getPath('userData'), 'pegboard-widgets.json');
};

let saveWidgetTimer = null;
const saveWidgetStates = () => {
  clearTimeout(saveWidgetTimer);
  saveWidgetTimer = setTimeout(async () => {
    const states = [];
    for (const [chatboxId, win] of floatingWindows) {
      if (!win.isDestroyed()) {
        states.push({
          chatboxId,
          bounds: win.getBounds(),
          windowData: win._windowData,
        });
      }
    }
    try {
      await fs.writeFile(getWidgetStatePath(), JSON.stringify(states, null, 2), 'utf8');
      console.log('[Main] Widget states saved:', states.length, 'widgets');
    } catch (error) {
      console.error('[Main] Failed to save widget states:', error);
    }
  }, 500);
};

const loadWidgetStates = async () => {
  try {
    const data = await fs.readFile(getWidgetStatePath(), 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Prevent crashes from unhandled errors
process.on('uncaughtException', (error) => {
  console.error('[Main] Uncaught exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('[Main] Unhandled rejection:', error);
});

// Get the path to store app data
const getStoragePath = () => {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'pegboard-data.json');
};

// Handle storage operations
ipcMain.handle('storage:load', async () => {
  try {
    const storagePath = getStoragePath();
    console.log('[Main] Loading data from:', storagePath);

    const data = await fs.readFile(storagePath, 'utf8');
    console.log('[Main] Data loaded successfully');
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('[Main] No saved data found, returning null');
      return null; // File doesn't exist yet
    }
    console.error('[Main] Error loading data:', error);
    throw error;
  }
});

ipcMain.handle('storage:save', async (event, data) => {
  try {
    const storagePath = getStoragePath();
    console.log('[Main] Saving data to:', storagePath);

    await fs.writeFile(storagePath, JSON.stringify(data, null, 2), 'utf8');
    console.log('[Main] Data saved successfully');
    return true;
  } catch (error) {
    console.error('[Main] Error saving data:', error);
    throw error;
  }
});

// Helper: hide main window (handles fullscreen) then show widget on desktop
const hideMainAndShowWidget = (floatingWindow) => {
  return new Promise((resolve) => {
    const showWidget = () => {
      if (process.platform === 'darwin') app.dock.hide();
      floatingWindow.show();
      floatingWindow.focus();
      resolve();
    };

    if (!mainWindow || mainWindow.isDestroyed()) {
      showWidget();
      return;
    }

    if (mainWindow.isFullScreen()) {
      mainWindow.setOpacity(0);
      mainWindow.setFullScreen(false);
      mainWindow.once('leave-full-screen', () => {
        mainWindow.hide();
        mainWindow.setOpacity(1);
        showWidget();
      });
    } else {
      mainWindow.hide();
      showWidget();
    }
  });
};

// Shared floating window creation logic
function createFloatingWindow(chatboxId, windowData, opts = {}) {
  const { bounds, hideMain = true } = opts;

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  const floatingWindow = new BrowserWindow({
    width: bounds?.width || windowData.width || 400,
    height: bounds?.height || windowData.height || 500,
    x: bounds?.x ?? (screenWidth - (windowData.width || 400) - 50),
    y: bounds?.y ?? 50,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    resizable: true,
    minimizable: true,
    maximizable: false,
    fullscreenable: false,
    hasShadow: true,
    vibrancy: 'under-window',
    backgroundColor: '#1e293b',
    show: false,
    parent: null,
    modal: false,
    visibleOnAllWorkspaces: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Store windowData for persistence
  floatingWindow._windowData = windowData;

  // Load the floating window URL
  if (process.env.VITE_DEV_SERVER_URL) {
    const floatingUrl = `${process.env.VITE_DEV_SERVER_URL}?floating=true&chatboxId=${chatboxId}`;
    floatingWindow.loadURL(floatingUrl);
  } else {
    const indexPath = path.join(__dirname, '../dist/index.html');
    floatingWindow.loadFile(indexPath, {
      query: { floating: 'true', chatboxId: chatboxId }
    });
  }

  floatingWindows.set(chatboxId, floatingWindow);

  floatingWindow.webContents.once('did-finish-load', async () => {
    console.log('[Main] Floating window loaded:', chatboxId);
    floatingWindow.webContents.send('floating:init', { chatboxId, windowData });

    if (hideMain) {
      await hideMainAndShowWidget(floatingWindow);
    } else {
      floatingWindow.show();
    }
  });

  floatingWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[Main] Floating window failed to load:', errorCode, errorDescription);
  });

  // Persist position/size on move and resize
  floatingWindow.on('move', saveWidgetStates);
  floatingWindow.on('resize', saveWidgetStates);

  floatingWindow.on('closed', () => {
    console.log('[Main] Floating window closed:', chatboxId);
    floatingWindows.delete(chatboxId);
    saveWidgetStates();
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('floating:closed', { chatboxId });
    }
  });

  return floatingWindow;
}

// Handle floating window creation from renderer
ipcMain.handle('floating:create', async (event, { chatboxId, windowData }) => {
  console.log('[Main] Creating floating window for chatbox:', chatboxId);

  if (floatingWindows.has(chatboxId)) {
    const existingWindow = floatingWindows.get(chatboxId);
    if (!existingWindow.isDestroyed()) {
      existingWindow.focus();
      return { success: true, alreadyExists: true };
    }
  }

  createFloatingWindow(chatboxId, windowData, { hideMain: true });
  saveWidgetStates();
  return { success: true };
});

// Handle showing the main window from a floating widget
ipcMain.handle('floating:showMain', async () => {
  const showMain = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy();
    }
    createWindow();
  };
  if (process.platform === 'darwin') {
    await app.dock.show();
  }
  showMain();
  return { success: true };
});

// Handle floating window close
ipcMain.handle('floating:close', async (event, { chatboxId }) => {
  console.log('[Main] Closing floating window:', chatboxId);
  const floatingWindow = floatingWindows.get(chatboxId);
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    floatingWindow.close();
  }
  return { success: true };
});

// Handle syncing state between main window and floating widgets
ipcMain.on('floating:sync', (event, { chatboxId, state, fromWidget }) => {
  if (fromWidget) {
    // From widget -> send to main window
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('floating:sync', { chatboxId, state, fromWidget: true });
    }
  } else {
    // From main window -> send to widget
    const floatingWindow = floatingWindows.get(chatboxId);
    if (floatingWindow && !floatingWindow.isDestroyed()) {
      floatingWindow.webContents.send('floating:sync', { chatboxId, state, fromWidget: false });
    }
  }
});

// Handle request for current window data from floating window
ipcMain.handle('floating:getData', async (event, { chatboxId }) => {
  // Request data from main window
  if (mainWindow && !mainWindow.isDestroyed()) {
    return new Promise((resolve) => {
      const responseHandler = (event, data) => {
        if (data.chatboxId === chatboxId) {
          ipcMain.removeListener('floating:dataResponse', responseHandler);
          resolve(data.windowData);
        }
      };
      ipcMain.on('floating:dataResponse', responseHandler);
      mainWindow.webContents.send('floating:requestData', { chatboxId });

      // Timeout after 5 seconds
      setTimeout(() => {
        ipcMain.removeListener('floating:dataResponse', responseHandler);
        resolve(null);
      }, 5000);
    });
  }
  return null;
});

/**
 * Handle Gemini API requests directly using @google/genai SDK
 */
async function handleGeminiDirect(event, { model, apiKey, systemPrompt, messages, userMessage, thinkingLevel, streaming, requestId }) {
  console.log('[Main] Handling Gemini Direct Request:', { model, streaming, thinkingLevel });

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const client = new GoogleGenAI({ apiKey });

    // Configure Generation Config
    const config = {
      temperature: 1.0, // Default for Gemini 3
    };

    // Apply Thinking Config for Gemini 3
    if ((model.startsWith('gemini-3') || model.includes('gemini-exp-1206')) && thinkingLevel) {
      config.thinkingConfig = {
        thinkingLevel,
        includeThoughts: true // Try enabling thoughts here
      };
      console.log('[Main] Gemini Direct: Applied thinkingConfig:', config.thinkingConfig);
    }

    // Prepare System Instruction
    if (systemPrompt) {
      config.systemInstruction = systemPrompt;
    }

    // Construct Contents (Messages)
    // SDK expects "contents" to be text or array of parts.
    // For chat, it expects specific structure or we use `client.chats.create`?
    // The docs show `client.models.generateContent({ contents: ... })` where contents can be a string or array.
    // BUT for multi-turn, checking the doc "Multi-turn conversations (chat)":
    // It uses `client.chats.create`.
    // Let's stick to `generateContent` with full history if possible, OR use `chats`.
    // The doc link "Multi-turn conversations (chat)" shows:
    /*
      const chat = ai.chats.create({ model: ..., history: [...] });
      await chat.sendMessage(...)
    */
    // We are stateless in backend for this calls usually (receiving full messages).
    // Let's map messages to `contents` array for `generateContent` if it supports list of messages?
    // Doc for `generateContent` REST shows `contents: [{role: "user", parts: [...]}, {role: "model", ...}]`.
    // So passing array of message objects to `contents` field of `generateContent` should work.

    let contents = [];
    if (messages && messages.length > 0) {
      contents = messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));
    } else {
      contents = [{ role: 'user', parts: [{ text: userMessage }] }];
    }

    // HOWEVER, the JS SDK example for `generateContent` usually takes just the prompt OR standard content structure.
    // We will pass the array of message objects as `contents`.

    if (streaming) {
      console.log('[Main] Gemini Direct: Starting stream using client.models.generateContentStream...');
      const responseStream = await client.models.generateContentStream({
        model,
        contents,
        config
      });

      let fullText = '';
      let chunkIndex = 0;

      for await (const chunk of responseStream) {
        chunkIndex++;

        const candidates = chunk.candidates;
        if (candidates && candidates.length > 0) {
          const parts = candidates[0].content?.parts;
          if (parts) {
            parts.forEach(part => {
              // Check if it's a thinking part
              if (part.thought) {
                // It's a thought! Send to thinking stream
                if (part.text) {
                  event.sender.send('ai:stream-thinking', { requestId, content: part.text });
                }
              } else if (part.thoughtSignature) {
                // Logic signature, ignore for display
              } else if (part.text) {
                // Normal text content
                fullText += part.text;
                event.sender.send('ai:stream-chunk', { requestId, chunk: part.text });
              }
            });
          }
        }
      }

      console.log('[Main] Gemini Direct: Stream complete');
      event.sender.send('ai:stream-complete', { requestId });
      return { text: fullText, streaming: true };
    } else {
      console.log('[Main] Gemini Direct: Generating (non-stream)...');
      const response = await client.models.generateContent({
        model,
        contents,
        config
      });
      const responseText = response.text();
      return { text: responseText, streaming: false };
    }

  } catch (error) {
    console.error('[Main] Gemini Direct Error:', error);
    throw error;
  }
}

// Handle AI API calls from renderer process
ipcMain.handle('ai:generate', async (event, { model, apiKey, systemPrompt, userMessage, messages, streaming, requestId, thinkingLevel }) => {
  console.log('[Main] Received ai:generate request:', {
    model,
    apiKeyLength: apiKey?.length,
    systemPromptLength: systemPrompt?.length,
    userMessageLength: userMessage?.length,
    messagesCount: messages?.length,
    userMessageLength: userMessage?.length,
    messagesCount: messages?.length,
    streaming,
    thinkingLevel, // Log thinking level
    requestId
  });

  // Delegate to Direct Google SDK for Gemini models
  if (model.startsWith('gemini-')) {
    try {
      return await handleGeminiDirect(event, { model, apiKey, systemPrompt, messages, userMessage, thinkingLevel, streaming, requestId });
    } catch (err) {
      console.error('[Main] Gemini Direct Error:', err);
      throw err;
    }
  }

  try {
    // Import AI SDK modules dynamically
    console.log('[Main] Importing AI SDK modules...');
    console.log('[Main] Importing AI SDK modules...');
    const { generateText, streamText } = await import('ai');
    const { createOpenAI } = await import('@ai-sdk/openai');
    const { createAnthropic } = await import('@ai-sdk/anthropic');
    console.log('[Main] AI SDK modules imported successfully');

    let provider;
    let providerName;
    if (model.startsWith('gpt-') || model.startsWith('openai-')) {
      providerName = 'OpenAI';
      console.log('[Main] Creating OpenAI provider for model:', model);
      const openai = createOpenAI({ apiKey });
      provider = openai(model);
    } else if (model.startsWith('claude-')) {
      providerName = 'Anthropic';
      console.log('[Main] Creating Anthropic provider for model:', model);
      const anthropic = createAnthropic({ apiKey });
      provider = anthropic(model);
    } else if (model.startsWith('gemini-')) {
      // Should not be reached if delegated above, but keep as fallback or error
      throw new Error('Gemini models should use direct SDK handler');
    }

    console.log('[Main] Provider created:', providerName);
    console.log('[Main] Starting AI generation, streaming:', streaming);

    if (streaming) {
      // For streaming, send chunks as they arrive
      console.log('[Main] Calling streamText...');
      // Use full messages array if provided, otherwise single user message
      const conversationMessages = messages || [{ role: 'user', content: userMessage }];

      const { fullStream } = await streamText({
        model: provider,
        system: systemPrompt,
        messages: conversationMessages,
      });

      console.log('[Main] Streaming chunks to renderer...');
      let accumulatedText = '';
      let chunkCount = 0;

      for await (const chunk of fullStream) {
        chunkCount++;
        // Inspect chunk structure for thinking data, especially for Gemini 3
        if (model.includes('gemini-3')) {
          console.log(`[Main] Chunk ${chunkCount} type:`, chunk.type);
          if (chunk.type === 'reasoning') {
            console.log('[Main] Reasoning found:', JSON.stringify(chunk, null, 2));
          }
        }

        if (chunk.type === 'text-delta') {
          accumulatedText += chunk.textDelta;
          event.sender.send('ai:stream-chunk', { requestId, chunk: chunk.textDelta });
        } else if (chunk.type === 'reasoning') {
          // Send reasoning to frontend
          event.sender.send('ai:stream-thinking', { requestId, content: chunk.textDelta });
        }
      }

      console.log('[Main] Stream complete, total chunks:', chunkCount, 'total text length:', accumulatedText.length);

      // Send completion event
      event.sender.send('ai:stream-complete', { requestId });

      return { text: accumulatedText, streaming: true };
    } else {
      console.log('[Main] Calling generateText...');
      // Use full messages array if provided, otherwise single user message
      const conversationMessages = messages || [{ role: 'user', content: userMessage }];
      const { text } = await generateText({
        model: provider,
        system: systemPrompt,
        messages: conversationMessages,
      });
      console.log('[Main] Generation complete, text length:', text.length);
      return { text, streaming: false };
    }
  } catch (error) {
    console.error('[Main] AI generation error:', error);
    console.error('[Main] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      statusCode: error.statusCode,
      responseBody: error.responseBody
    });

    // Send error event for streaming requests
    if (streaming) {
      event.sender.send('ai:stream-error', { requestId, error: error.message });
    }

    throw new Error(error.message || 'Failed to generate AI response');
  }
});

// Create application menu
function createMenu() {
  const template = [
    {
      label: 'Pegboard',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow({ hidden = false } = {}) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: !hidden,
    fullscreen: !hidden,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // In development, load from Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // Dev tools disabled - use Cmd+Option+I to open manually if needed
  } else {
    // In production, load the built files
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Hide instead of close when user clicks the close button
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      if (mainWindow.isFullScreen()) {
        mainWindow.setOpacity(0);
        mainWindow.setFullScreen(false);
        mainWindow.once('leave-full-screen', () => {
          mainWindow.hide();
          mainWindow.setOpacity(1);
        });
      } else {
        mainWindow.hide();
      }
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Toggle floating widgets visibility with main window
  mainWindow.on('show', () => {
    for (const [, win] of floatingWindows) {
      if (!win.isDestroyed()) win.hide();
    }
  });
  mainWindow.on('hide', () => {
    for (const [, win] of floatingWindows) {
      if (!win.isDestroyed()) win.show();
    }
  });

  // Handle renderer process crashes
  mainWindow.webContents.on('crashed', () => {
    console.error('[Main] Renderer process crashed');
  });

  mainWindow.webContents.on('unresponsive', () => {
    console.error('[Main] Renderer process became unresponsive');
  });
}

function createTray() {
  // Create tray icon programmatically (16x16 black circle, works as macOS template image)
  const iconBase64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMklEQVR4nGNgGMzgPxomWyNJBhHSTNAQigwgVjNOQ4aBAaQYghNQbAAxhhANyNZIXwAABnZvkUpxlIEAAAAASUVORK5CYII=';
  let icon = nativeImage.createFromDataURL(`data:image/png;base64,${iconBase64}`);

  // For macOS, mark as template image for proper menu bar appearance
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true);
  }

  tray = new Tray(icon);
  tray.setToolTip('Pegboard');

  const buildTrayMenu = () => {
    const isVisible = mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible();
    return Menu.buildFromTemplate([
      {
        label: isVisible ? 'Hide Pegboard' : 'Show Pegboard',
        click: () => {
          if (!mainWindow || mainWindow.isDestroyed()) return;
          if (isVisible) {
            if (mainWindow.isFullScreen()) {
              mainWindow.setOpacity(0);
              mainWindow.setFullScreen(false);
              mainWindow.once('leave-full-screen', () => {
                mainWindow.hide();
                mainWindow.setOpacity(1);
                if (process.platform === 'darwin') app.dock.hide();
              });
            } else {
              mainWindow.hide();
              if (process.platform === 'darwin') app.dock.hide();
            }
          } else {
            const showMain = () => {
              mainWindow.destroy();
              createWindow();
            };
            if (process.platform === 'darwin') {
              app.dock.show().then(showMain);
            } else {
              showMain();
            }
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
  };

  tray.on('click', () => {
    tray.popUpContextMenu(buildTrayMenu());
  });
  tray.on('right-click', () => {
    tray.popUpContextMenu(buildTrayMenu());
  });
}

app.whenReady().then(async () => {
  createMenu();
  createTray();
  const savedWidgets = await loadWidgetStates();
  const hasWidgets = savedWidgets.length > 0;
  createWindow({ hidden: hasWidgets });
  if (hasWidgets) {
    if (process.platform === 'darwin') app.dock.hide();
    console.log('[Main] Widgets exist, starting with main window hidden');
    for (const { chatboxId, bounds, windowData } of savedWidgets) {
      createFloatingWindow(chatboxId, windowData, { bounds, hideMain: false });
    }
  }
});

app.on('window-all-closed', () => {
  // Don't quit when all windows are closed - app stays in tray
  if (process.platform !== 'darwin') {
    // On Windows/Linux, we might want to quit if no tray
    // But since we have tray, keep running
  }
});

app.on('activate', () => {
  const showMain = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy();
    }
    createWindow();
  };
  if (process.platform === 'darwin') {
    app.dock.show().then(showMain);
  } else {
    showMain();
  }
});

// Ensure app quits properly when explicitly requested
app.on('before-quit', () => {
  app.isQuitting = true;
  // Save widget states synchronously before quitting
  const states = [];
  for (const [chatboxId, win] of floatingWindows) {
    if (!win.isDestroyed()) {
      states.push({
        chatboxId,
        bounds: win.getBounds(),
        windowData: win._windowData,
      });
    }
  }
  try {
    require('fs').writeFileSync(getWidgetStatePath(), JSON.stringify(states, null, 2), 'utf8');
  } catch (e) {
    console.error('[Main] Failed to save widget states on quit:', e);
  }
});

// Handle embedding generation in main process (ONNX works better in Node.js)
let embeddingPipeline = null;

ipcMain.handle('embedding:generate', async (event, { texts }) => {
  console.log('[Main] Generating embeddings for', texts.length, 'texts');

  try {
    // Dynamically import transformers
    const { pipeline } = await import('@xenova/transformers');

    // Cache the pipeline for reuse
    if (!embeddingPipeline) {
      console.log('[Main] Loading embedding model...');
      embeddingPipeline = await pipeline('feature-extraction', 'Xenova/bge-small-en-v1.5', {
        progress_callback: (progress) => {
          if (progress.status === 'downloading') {
            console.log(`[Main] Downloading ${progress.file}: ${Math.round(progress.progress || 0)}%`);
          } else if (progress.status) {
            console.log('[Main] Model status:', progress.status);
          }
        }
      });
      console.log('[Main] Embedding model loaded');
    }

    // Generate embeddings for each text
    const embeddings = [];
    for (let i = 0; i < texts.length; i++) {
      console.log(`[Main] Embedding text ${i + 1}/${texts.length}`);
      const output = await embeddingPipeline(texts[i], { pooling: 'mean', normalize: true });
      embeddings.push(Array.from(output.data));
    }

    console.log('[Main] Generated', embeddings.length, 'embeddings');
    return { embeddings };
  } catch (error) {
    console.error('[Main] Embedding error:', error);
    throw new Error(error.message || 'Failed to generate embeddings');
  }
});
