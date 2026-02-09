import React, { useState, useRef, useEffect } from 'react';
import ChatBox from './ChatBox';
import TextBox from './TextBox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Settings, X, Type, Key, Palette, Monitor, Bell, Bot, Sparkles, Brain, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

const GRID_SIZE = 20; // pixels per grid unit

function Pegboard() {
  const [isLocked, setIsLocked] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsCategory, setSettingsCategory] = useState('api-keys');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [canvasToDelete, setCanvasToDelete] = useState(null);
  const [editingCanvasId, setEditingCanvasId] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    claude: '',
    gemini: '',
  });
  const [tempApiKeys, setTempApiKeys] = useState({
    openai: '',
    claude: '',
    gemini: '',
  });
  const [canvases, setCanvases] = useState([
    {
      id: '1',
      name: 'Canvas 1',
      chatBoxes: [
        {
          id: '1',
          name: 'Agent 1',
          x: 2,
          y: 2,
          width: 18,
          height: 16,
          prompt: 'You are a helpful assistant.',
          model: 'gpt-4',
          locked: false,
          messages: [],
          streaming: true,
          tintColor: '#3b82f6',
        },
      ],
      textBoxes: [],
    },
  ]);
  const [activeCanvasId, setActiveCanvasId] = useState('1');
  const [focusedWindowId, setFocusedWindowId] = useState(null);
  const [activeFloatingWidgets, setActiveFloatingWidgets] = useState(new Set()); // Track windows that have active widgets
  const [zoom, setZoom] = useState(1); // 1 = 100%, 0.5 = 50%, 2 = 200%
  const [pan, setPan] = useState({ x: 0, y: 0 }); // Pan offset in pixels
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [draggingWindowId, setDraggingWindowId] = useState(null); // Track which window is being dragged
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const isPanningRef = useRef(false); // Track if panning gesture is active
  const panningTimeoutRef = useRef(null); // Timeout to reset panning state
  const scrollHighlightRef = useRef(null); // Currently highlighted scrollable element
  const scrollHighlightTimeoutRef = useRef(null); // Timeout to remove highlight

  const activeCanvas = canvases.find(c => c.id === activeCanvasId);
  // Filter out archived boxes
  const chatBoxes = (activeCanvas?.chatBoxes || []).filter(box => !box.archived);
  const textBoxes = (activeCanvas?.textBoxes || []).filter(box => !box.archived);

  // Listen for floating widget closed events
  useEffect(() => {
    if (window.electron?.floating) {
      window.electron.floating.onClosed(({ chatboxId }) => {
        console.log('[Pegboard] Floating widget closed:', chatboxId);
        setActiveFloatingWidgets(prev => {
          const newSet = new Set(prev);
          newSet.delete(chatboxId);
          return newSet;
        });
      });

      return () => {
        window.electron.floating.removeListeners();
      };
    }
  }, []);

  // Function to mark a window as having an active widget
  const onWidgetCreated = (chatboxId) => {
    setActiveFloatingWidgets(prev => new Set(prev).add(chatboxId));
  };

  const addCanvas = () => {
    const newCanvas = {
      id: Date.now().toString(),
      name: `Canvas ${canvases.length + 1}`,
      chatBoxes: [],
      textBoxes: [],
    };
    setCanvases([...canvases, newCanvas]);
    setActiveCanvasId(newCanvas.id);
  };

  const initiateDeleteCanvas = (canvasId) => {
    if (canvases.length === 1) return; // Don't delete the last canvas
    setCanvasToDelete(canvasId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteCanvas = () => {
    if (!canvasToDelete) return;

    const newCanvases = canvases.filter(c => c.id !== canvasToDelete);
    setCanvases(newCanvases);

    // Switch to another canvas if we deleted the active one
    if (activeCanvasId === canvasToDelete) {
      setActiveCanvasId(newCanvases[0].id);
    }

    setDeleteConfirmOpen(false);
    setCanvasToDelete(null);
  };

  const cancelDeleteCanvas = () => {
    setDeleteConfirmOpen(false);
    setCanvasToDelete(null);
  };

  const renameCanvas = (canvasId, newName) => {
    setCanvases(canvases.map(c =>
      c.id === canvasId ? { ...c, name: newName } : c
    ));
  };

  const findFreePosition = (width, height) => {
    // Try to find a free position on the grid
    const maxX = 50; // Max grid units to search
    const maxY = 50;

    for (let y = 2; y < maxY; y += 2) {
      for (let x = 2; x < maxX; x += 2) {
        // Check if this position is free
        if (!checkCollision(null, x, y, width, height, 'new')) {
          return { x, y };
        }
      }
    }

    // If no free position found, return default position (will overlap)
    return { x: 2, y: 2 };
  };

  const findNearestFreePosition = (id, currentX, currentY, width, height, type) => {
    // Try to find the nearest free position to the current position
    // Start with the current position rounded to grid
    const startX = Math.round(currentX);
    const startY = Math.round(currentY);

    // Check if current position is already free
    if (!checkCollision(id, startX, startY, width, height, type)) {
      return { x: startX, y: startY };
    }

    // Search in expanding square pattern for nearest free spot
    // This is more thorough than spiral and checks every grid position
    const maxRadius = 50; // Max grid units to search outward

    for (let radius = 1; radius < maxRadius; radius++) {
      // Check all positions in a square at this radius
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
          // Only check positions on the perimeter of the square (not interior)
          if (Math.abs(dx) === radius || Math.abs(dy) === radius) {
            const x = startX + dx;
            const y = startY + dy;

            if (!checkCollision(id, x, y, width, height, type)) {
              return { x, y };
            }
          }
        }
      }
    }

    // If no free position found nearby, try to find ANY free position on the canvas
    const maxSearch = 60;
    for (let y = 2; y < maxSearch; y += 2) {
      for (let x = 2; x < maxSearch; x += 2) {
        if (!checkCollision(id, x, y, width, height, type)) {
          return { x, y };
        }
      }
    }

    // Last resort: return current position (will overlap)
    return { x: startX, y: startY };
  };

  const addChatBox = () => {
    // Auto-unlock when adding a new box
    setIsLocked(false);

    const currentBoxCount = chatBoxes.length;
    const width = 18;
    const height = 16;
    const freePos = findFreePosition(width, height);

    const newBoxId = Date.now().toString();
    const colors = ['#3b82f6', '#a855f7', '#ec4899', '#ef4444', '#f97316', '#22c55e', '#14b8a6', '#0ea5e9'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newBox = {
      id: newBoxId,
      name: `Agent ${currentBoxCount + 1}`,
      x: freePos.x,
      y: freePos.y,
      width: width,
      height: height,
      prompt: 'You are a helpful assistant.',
      model: 'gpt-4',
      locked: false,
      messages: [],
      streaming: true,
      tintColor: randomColor,
    };

    setCanvases(canvases.map(c =>
      c.id === activeCanvasId
        ? { ...c, chatBoxes: [...c.chatBoxes, newBox] }
        : c
    ));

    // Focus the newly created box
    setFocusedWindowId(newBoxId);
  };

  // Save all state to file
  const saveStateToFile = React.useCallback(async (stateData) => {
    if (!window.electron?.storage?.save) {
      console.warn('[Pegboard] Electron storage API not available');
      return;
    }

    try {
      await window.electron.storage.save(stateData);
      console.log('[Pegboard] State saved to file successfully');
    } catch (error) {
      console.error('[Pegboard] Failed to save state to file:', error);
    }
  }, []);

  const saveApiKey = (provider, key) => {
    console.log(`[Pegboard] Saving ${provider} API key:`, {
      keyLength: key?.length,
      keyPreview: key?.substring(0, 20) + '...',
    });

    const newApiKeys = { ...apiKeys, [provider]: key };
    setApiKeys(newApiKeys);

    // Save to file immediately
    saveStateToFile({
      apiKeys: newApiKeys,
      canvases,
      activeCanvasId,
      isLocked
    });
  };

  const deleteApiKey = (provider) => {
    console.log(`[Pegboard] Deleting ${provider} API key`);

    const newApiKeys = { ...apiKeys, [provider]: '' };
    setApiKeys(newApiKeys);
    setTempApiKeys({ ...tempApiKeys, [provider]: '' });

    // Save to file immediately
    saveStateToFile({
      apiKeys: newApiKeys,
      canvases,
      activeCanvasId,
      isLocked
    });
  };

  // Initialize temp API keys when settings modal opens
  React.useEffect(() => {
    if (isSettingsOpen) {
      setTempApiKeys(apiKeys);
    }
  }, [isSettingsOpen, apiKeys]);

  // Load all saved state from file on mount
  React.useEffect(() => {
    const loadStateFromFile = async () => {
      if (!window.electron?.storage?.load) {
        console.warn('[Pegboard] Electron storage API not available');
        setIsInitialLoad(false);
        return;
      }

      try {
        console.log('[Pegboard] Loading state from file...');
        const savedState = await window.electron.storage.load();

        if (savedState) {
          console.log('[Pegboard] State loaded from file successfully');

          if (savedState.apiKeys) {
            setApiKeys(savedState.apiKeys);
          }

          if (savedState.canvases && savedState.canvases.length > 0) {
            setCanvases(savedState.canvases);

            // Load the last active canvas
            if (savedState.activeCanvasId && savedState.canvases.find(c => c.id === savedState.activeCanvasId)) {
              setActiveCanvasId(savedState.activeCanvasId);
            } else {
              setActiveCanvasId(savedState.canvases[0].id);
            }
          }

          if (savedState.isLocked !== undefined) {
            setIsLocked(savedState.isLocked);
          }
        } else {
          console.log('[Pegboard] No saved state found');
        }
      } catch (error) {
        console.error('[Pegboard] Failed to load state from file:', error);
      }

      // Mark initial load as complete
      setIsInitialLoad(false);
    };

    loadStateFromFile();
  }, []);

  // Save state to file whenever it changes (but not on initial load)
  // Debounced to avoid excessive file writes
  React.useEffect(() => {
    if (!isInitialLoad) {
      const timeoutId = setTimeout(() => {
        const stateData = {
          apiKeys,
          canvases,
          activeCanvasId,
          isLocked
        };
        saveStateToFile(stateData);
      }, 500); // Debounce for 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [canvases, activeCanvasId, isLocked, apiKeys, isInitialLoad, saveStateToFile]);

  // Center view on content after initial load completes
  const hasCenteredRef = useRef(false);
  useEffect(() => {
    if (!isInitialLoad && !hasCenteredRef.current) {
      hasCenteredRef.current = true;
      // Use a short delay to ensure DOM is ready and state is settled
      const timeoutId = setTimeout(() => {
        handleFitToScreen();
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [isInitialLoad]);

  const checkCollision = (id, newX, newY, newWidth, newHeight, type = 'chat') => {
    // Check collision with chat boxes
    for (const box of chatBoxes) {
      if (type === 'chat' && box.id === id) continue;

      const boxRight = box.x + box.width;
      const boxBottom = box.y + box.height;
      const newRight = newX + newWidth;
      const newBottom = newY + newHeight;

      // Check if rectangles overlap
      if (!(newX >= boxRight || newRight <= box.x || newY >= boxBottom || newBottom <= box.y)) {
        return true; // Collision detected
      }
    }

    // Check collision with text boxes
    for (const box of textBoxes) {
      if (type === 'text' && box.id === id) continue;

      const boxRight = box.x + box.width;
      const boxBottom = box.y + box.height;
      const newRight = newX + newWidth;
      const newBottom = newY + newHeight;

      // Check if rectangles overlap
      if (!(newX >= boxRight || newRight <= box.x || newY >= boxBottom || newBottom <= box.y)) {
        return true; // Collision detected
      }
    }

    return false; // No collision
  };

  const updateChatBox = (id, updates) => {
    // If position or size is being updated, check for collisions (but skip if window is being dragged)
    if ((updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.height !== undefined) && draggingWindowId !== id) {
      const box = chatBoxes.find(b => b.id === id);
      if (!box) return;

      const newX = updates.x !== undefined ? updates.x : box.x;
      const newY = updates.y !== undefined ? updates.y : box.y;
      const newWidth = updates.width !== undefined ? updates.width : box.width;
      const newHeight = updates.height !== undefined ? updates.height : box.height;

      // Check if the new position/size would cause a collision
      if (checkCollision(id, newX, newY, newWidth, newHeight, 'chat')) {
        return; // Prevent the update if it would cause a collision
      }
    }

    setCanvases(canvases.map(c =>
      c.id === activeCanvasId
        ? {
            ...c,
            chatBoxes: c.chatBoxes.map(box =>
              box.id === id ? { ...box, ...updates } : box
            ),
          }
        : c
    ));
  };

  const removeChatBox = (id) => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this window? It will be archived and can be restored later.');

    if (!confirmed) {
      return;
    }

    // Archive the box instead of deleting it
    setCanvases(canvases.map(c =>
      c.id === activeCanvasId
        ? {
            ...c,
            chatBoxes: c.chatBoxes.map(box =>
              box.id === id
                ? { ...box, archived: true, archivedAt: Date.now() }
                : box
            ),
          }
        : c
    ));
  };

  const addTextBox = () => {
    // Auto-unlock when adding a new text box
    setIsLocked(false);

    const width = 8;
    const height = 4;
    const freePos = findFreePosition(width, height);

    const newTextBoxId = Date.now().toString();
    const newTextBox = {
      id: newTextBoxId,
      x: freePos.x,
      y: freePos.y,
      width: width,
      height: height,
      text: 'Your text here',
      fontFamily: 'sans-serif',
      fontSize: '24px',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textColor: '#ffffff',
      dropShadow: 'none',
      locked: false,
    };

    setCanvases(canvases.map(c =>
      c.id === activeCanvasId
        ? { ...c, textBoxes: [...c.textBoxes, newTextBox] }
        : c
    ));

    // Focus the newly created text box
    setFocusedWindowId(newTextBoxId);
  };

  const updateTextBox = (id, updates) => {
    // If position or size is being updated, check for collisions (but skip if window is being dragged)
    if ((updates.x !== undefined || updates.y !== undefined || updates.width !== undefined || updates.height !== undefined) && draggingWindowId !== id) {
      const box = textBoxes.find(b => b.id === id);
      if (!box) return;

      const newX = updates.x !== undefined ? updates.x : box.x;
      const newY = updates.y !== undefined ? updates.y : box.y;
      const newWidth = updates.width !== undefined ? updates.width : box.width;
      const newHeight = updates.height !== undefined ? updates.height : box.height;

      // Check if the new position/size would cause a collision
      if (checkCollision(id, newX, newY, newWidth, newHeight, 'text')) {
        return; // Prevent the update if it would cause a collision
      }
    }

    setCanvases(canvases.map(c =>
      c.id === activeCanvasId
        ? {
            ...c,
            textBoxes: c.textBoxes.map(box =>
              box.id === id ? { ...box, ...updates } : box
            ),
          }
        : c
    ));
  };

  const removeTextBox = (id) => {
    // Show confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this text box? It will be archived and can be restored later.');

    if (!confirmed) {
      return;
    }

    // Archive the box instead of deleting it
    setCanvases(canvases.map(c =>
      c.id === activeCanvasId
        ? {
            ...c,
            textBoxes: c.textBoxes.map(box =>
              box.id === id
                ? { ...box, archived: true, archivedAt: Date.now() }
                : box
            ),
          }
        : c
    ));
  };

  const handleSendToWindow = (targetWindowId, text) => {
    // Find the target window and set its input
    const targetWindow = chatBoxes.find(box => box.id === targetWindowId);
    if (targetWindow) {
      // Update the target window with the text and trigger auto-send
      updateChatBox(targetWindowId, {
        pendingInput: { text, autoSend: true }
      });
      // Focus the target window
      setFocusedWindowId(targetWindowId);
    }
  };

  // Window drag handlers
  const handleWindowDragStart = (id) => {
    setDraggingWindowId(id);
  };

  const handleWindowDragEnd = (id, type) => {
    // Find the nearest free position and snap to it
    const box = type === 'chat'
      ? chatBoxes.find(b => b.id === id)
      : textBoxes.find(b => b.id === id);

    if (box) {
      const freePos = findNearestFreePosition(id, box.x, box.y, box.width, box.height, type);

      if (type === 'chat') {
        updateChatBox(id, { x: freePos.x, y: freePos.y });
      } else {
        updateTextBox(id, { x: freePos.x, y: freePos.y });
      }
    }

    setDraggingWindowId(null);
  };

  // Zoom functions
  const handleZoomIn = () => {
    setZoom(prevZoom => Math.min(prevZoom + 0.1, 3)); // Max 300%
  };

  const handleZoomOut = () => {
    setZoom(prevZoom => Math.max(prevZoom - 0.1, 0.25)); // Min 25%
  };

  const handleZoomReset = () => {
    if (!containerRef.current) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    const allBoxes = [...chatBoxes, ...textBoxes];
    if (allBoxes.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    // Center on content at zoom=1
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight - 40;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    allBoxes.forEach(box => {
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    const contentWidth = (maxX - minX) * GRID_SIZE;
    const contentHeight = (maxY - minY) * GRID_SIZE;
    const centerX = (containerWidth - contentWidth) / 2 - (minX * GRID_SIZE);
    const centerY = (containerHeight - contentHeight) / 2 - (minY * GRID_SIZE);

    setZoom(1);
    setPan({ x: centerX, y: centerY });
  };

  const handleFitToScreen = () => {
    if (!containerRef.current || !canvasRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight - 40; // Subtract bottom tabs height

    // Calculate the bounding box of all elements
    const allBoxes = [...chatBoxes, ...textBoxes];
    if (allBoxes.length === 0) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    allBoxes.forEach(box => {
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    // Add padding (in grid units)
    const padding = 4;
    minX = minX - padding;
    minY = minY - padding;
    maxX = maxX + padding;
    maxY = maxY + padding;

    // Convert to pixels
    const contentWidth = (maxX - minX) * GRID_SIZE;
    const contentHeight = (maxY - minY) * GRID_SIZE;

    // Calculate zoom to fit
    const zoomX = containerWidth / contentWidth;
    const zoomY = containerHeight / contentHeight;
    const newZoom = Math.min(zoomX, zoomY, 2); // Cap at 200% for fit-to-screen

    setZoom(Math.max(0.25, newZoom)); // Ensure minimum zoom

    // Center the content
    const scaledContentWidth = contentWidth * newZoom;
    const scaledContentHeight = contentHeight * newZoom;
    const centerX = (containerWidth - scaledContentWidth) / 2 - (minX * GRID_SIZE * newZoom);
    const centerY = (containerHeight - scaledContentHeight) / 2 - (minY * GRID_SIZE * newZoom);

    setPan({ x: centerX, y: centerY });
  };

  // Pan/drag handlers
  const handleMouseDown = (e) => {
    // Only start dragging if not clicking on a box or button
    // Check if the click is on the canvas background or grid
    const target = e.target;
    const isBackground = target === containerRef.current ||
                        target === canvasRef.current ||
                        target.classList.contains('grid-background') ||
                        target.classList.contains('canvas-background');

    if (isBackground) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - pan.x,
        y: e.clientY - pan.y
      });
      e.preventDefault();
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Add mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, pan]);

  // Helper to remove scroll highlight
  const removeScrollHighlight = () => {
    if (scrollHighlightRef.current) {
      scrollHighlightRef.current.style.boxShadow = '';
      scrollHighlightRef.current = null;
    }
  };

  // Handle pinch-to-zoom and two-finger scroll (touchpad)
  const handleWheel = (e) => {
    // Check if the target is inside a scrollable element (like chat messages)
    // Returns the scrollable element if found, null otherwise
    const findScrollableElement = (element) => {
      while (element && element !== containerRef.current) {
        const style = window.getComputedStyle(element);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;

        if (overflowY === 'auto' || overflowY === 'scroll' ||
            overflowX === 'auto' || overflowX === 'scroll') {
          // Check if element actually has scrollable content
          const hasVerticalScroll = element.scrollHeight > element.clientHeight;
          const hasHorizontalScroll = element.scrollWidth > element.clientWidth;
          if (hasVerticalScroll || hasHorizontalScroll) {
            return element;
          }
        }
        element = element.parentElement;
      }
      return null;
    };

    // Check if this is a pinch gesture (Ctrl+wheel on most touchpads)
    if (e.ctrlKey) {
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      // Get mouse position relative to container
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Calculate zoom delta (negative deltaY means zoom in)
      const delta = -e.deltaY;
      const zoomSpeed = 0.01;
      const zoomDelta = delta * zoomSpeed;

      // Calculate new zoom level
      const newZoom = Math.max(0.25, Math.min(3, zoom + zoomDelta));

      // Calculate the point in canvas coordinates before zoom
      const canvasX = (mouseX - pan.x) / zoom;
      const canvasY = (mouseY - pan.y) / zoom;

      // Calculate new pan to keep the point under the cursor
      const newPanX = mouseX - canvasX * newZoom;
      const newPanY = mouseY - canvasY * newZoom;

      setZoom(newZoom);
      setPan({ x: newPanX, y: newPanY });
    } else {
      // If panning is not active, check if inside a scrollable element
      const scrollableElement = findScrollableElement(e.target);

      if (!isPanningRef.current && scrollableElement) {
        // Highlight the scrollable element
        if (scrollHighlightRef.current !== scrollableElement) {
          removeScrollHighlight();
          scrollHighlightRef.current = scrollableElement;
          scrollableElement.style.boxShadow = 'inset 0 0 0 2px rgba(59, 130, 246, 0.5)';
        }

        // Clear existing timeout and set new one to remove highlight
        if (scrollHighlightTimeoutRef.current) {
          clearTimeout(scrollHighlightTimeoutRef.current);
        }
        scrollHighlightTimeoutRef.current = setTimeout(() => {
          removeScrollHighlight();
        }, 300);

        return; // Don't prevent default, allow normal scrolling
      }

      // Remove any scroll highlight when panning
      removeScrollHighlight();

      // Start or continue panning
      isPanningRef.current = true;

      // Clear existing timeout
      if (panningTimeoutRef.current) {
        clearTimeout(panningTimeoutRef.current);
      }

      // Reset panning state after gesture ends (no wheel events for 150ms)
      panningTimeoutRef.current = setTimeout(() => {
        isPanningRef.current = false;
      }, 150);

      // Two-finger scroll for panning (no Ctrl key)
      // Scale pan speed inversely with zoom so panning feels consistent at all zoom levels
      e.preventDefault();

      setPan(prevPan => ({
        x: prevPan.x - e.deltaX / zoom,
        y: prevPan.y - e.deltaY / zoom
      }));
    }
  };

  // Add wheel event listener for pinch-to-zoom and two-finger scroll panning
  // Use capture phase to intercept events before they reach child elements
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    return () => {
      container.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [zoom, pan]);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          ref={containerRef}
          className="relative h-full w-full bg-slate-900 overflow-hidden"
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            // Clear focus when clicking on canvas background
            if (e.target === e.currentTarget || e.target.classList.contains('grid-background')) {
              setFocusedWindowId(null);
            }
          }}
        >
          <div
            ref={canvasRef}
            className="absolute inset-0 bottom-10 origin-top-left"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              width: `${100 / zoom}%`,
              height: `${100 / zoom}%`,
              transition: isDragging ? 'none' : 'transform 0.2s',
            }}
          >
            {/* Clickable background layer for dragging */}
            <div
              className="canvas-background absolute"
              style={{
                top: '-10000px',
                left: '-10000px',
                width: '20000px',
                height: '20000px',
                zIndex: 0,
              }}
            />

            {/* Grid background */}
            <div
              className="grid-background absolute opacity-20 pointer-events-none"
              style={{
                backgroundImage: `
                  linear-gradient(to right, #475569 1px, transparent 1px),
                  linear-gradient(to bottom, #475569 1px, transparent 1px)
                `,
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
                top: '-10000px',
                left: '-10000px',
                width: '20000px',
                height: '20000px',
              }}
            />

            {/* Chat boxes */}
            <div style={{ position: 'relative', zIndex: 10 }}>
              {chatBoxes.map(box => (
                <ChatBox
                  key={box.id}
                  {...box}
                  gridSize={GRID_SIZE}
                  isLocked={isLocked}
                  isFocused={focusedWindowId === box.id}
                  isDragging={draggingWindowId === box.id}
                  apiKeys={apiKeys}
                  allWindows={chatBoxes}
                  hasActiveWidget={activeFloatingWidgets.has(box.id)}
                  onWidgetCreated={() => onWidgetCreated(box.id)}
                  onUpdate={(updates) => updateChatBox(box.id, updates)}
                  onRemove={() => removeChatBox(box.id)}
                  onFocus={() => setFocusedWindowId(box.id)}
                  onSendToWindow={handleSendToWindow}
                  onDragStart={() => handleWindowDragStart(box.id)}
                  onDragEnd={() => handleWindowDragEnd(box.id, 'chat')}
                />
              ))}
            </div>

            {/* Text boxes */}
            <div style={{ position: 'relative', zIndex: 10 }}>
              {textBoxes.map(box => (
                <TextBox
                  key={box.id}
                  {...box}
                  gridSize={GRID_SIZE}
                  isLocked={isLocked}
                  isFocused={focusedWindowId === box.id}
                  isDragging={draggingWindowId === box.id}
                  onUpdate={(updates) => updateTextBox(box.id, updates)}
                  onRemove={() => removeTextBox(box.id)}
                  onFocus={() => setFocusedWindowId(box.id)}
                  onDragStart={() => handleWindowDragStart(box.id)}
                  onDragEnd={() => handleWindowDragEnd(box.id, 'text')}
                />
              ))}
            </div>
          </div>

          {/* Minimap - positioned in bottom right */}
          {(() => {
            const allBoxes = [...chatBoxes, ...textBoxes];
            if (allBoxes.length === 0) return null;

            // Calculate bounds of all elements
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            allBoxes.forEach(box => {
              minX = Math.min(minX, box.x);
              minY = Math.min(minY, box.y);
              maxX = Math.max(maxX, box.x + box.width);
              maxY = Math.max(maxY, box.y + box.height);
            });

            // Add padding
            const padding = 2;
            minX = minX - padding;
            minY = minY - padding;
            maxX = maxX + padding;
            maxY = maxY + padding;

            const contentWidth = (maxX - minX) * GRID_SIZE;
            const contentHeight = (maxY - minY) * GRID_SIZE;

            // Minimap dimensions
            const minimapWidth = 160;
            const minimapHeight = 120;

            // Calculate scale to fit content in minimap
            const scaleX = minimapWidth / contentWidth;
            const scaleY = minimapHeight / contentHeight;
            const minimapScale = Math.min(scaleX, scaleY, 0.1); // Cap at 10% scale

            // Viewport rectangle in minimap
            const container = containerRef.current;
            const viewportWidth = container ? container.clientWidth : 800;
            const viewportHeight = container ? (container.clientHeight - 40) : 600;

            // Calculate viewport position in canvas coordinates
            const viewportX = (-pan.x / zoom - minX * GRID_SIZE) * minimapScale;
            const viewportY = (-pan.y / zoom - minY * GRID_SIZE) * minimapScale;
            const viewportW = (viewportWidth / zoom) * minimapScale;
            const viewportH = (viewportHeight / zoom) * minimapScale;

            const handleMinimapClick = (e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const clickY = e.clientY - rect.top;

              // Convert click position to canvas coordinates
              const canvasX = (clickX / minimapScale) + minX * GRID_SIZE;
              const canvasY = (clickY / minimapScale) + minY * GRID_SIZE;

              // Center the viewport on the clicked position
              setPan({
                x: -(canvasX - viewportWidth / zoom / 2) * zoom,
                y: -(canvasY - viewportHeight / zoom / 2) * zoom,
              });
            };

            return (
              <div
                className="absolute bottom-14 right-4 z-50 bg-slate-800/90 rounded-lg p-2 shadow-lg border border-slate-700 cursor-pointer"
                onClick={handleMinimapClick}
              >
                <div
                  className="relative overflow-hidden rounded"
                  style={{
                    width: `${minimapWidth}px`,
                    height: `${minimapHeight}px`,
                    backgroundColor: '#1e293b',
                  }}
                >
                  {/* Render minimap boxes */}
                  {allBoxes.map(box => {
                    const isChatBox = chatBoxes.some(cb => cb.id === box.id);
                    return (
                      <div
                        key={box.id}
                        className="absolute rounded-sm"
                        style={{
                          left: `${(box.x - minX) * GRID_SIZE * minimapScale}px`,
                          top: `${(box.y - minY) * GRID_SIZE * minimapScale}px`,
                          width: `${Math.max(2, box.width * GRID_SIZE * minimapScale)}px`,
                          height: `${Math.max(2, box.height * GRID_SIZE * minimapScale)}px`,
                          backgroundColor: isChatBox ? (box.tintColor || '#3b82f6') : '#94a3b8',
                          opacity: 0.8,
                        }}
                      />
                    );
                  })}

                  {/* Viewport indicator */}
                  <div
                    className="absolute border-2 border-white/60 rounded-sm pointer-events-none"
                    style={{
                      left: `${Math.max(0, viewportX)}px`,
                      top: `${Math.max(0, viewportY)}px`,
                      width: `${viewportW}px`,
                      height: `${viewportH}px`,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    }}
                  />
                </div>
              </div>
            );
          })()}

          {/* Zoom controls - positioned in bottom left, outside scaled canvas */}
          <div className="absolute bottom-14 left-4 z-50 flex flex-col gap-2 bg-slate-800 rounded-lg p-2 shadow-lg">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleZoomIn}
              className="w-10 h-10 text-slate-300 hover:text-white hover:bg-slate-700"
              title="Zoom In"
            >
              <ZoomIn className="h-5 w-5" />
            </Button>
            <div className="text-xs text-center text-slate-400 px-1 select-none">
              {Math.round(zoom * 100)}%
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleZoomOut}
              className="w-10 h-10 text-slate-300 hover:text-white hover:bg-slate-700"
              title="Zoom Out"
            >
              <ZoomOut className="h-5 w-5" />
            </Button>
            <div className="w-full h-px bg-slate-600 my-1" />
            <Button
              size="icon"
              variant="ghost"
              onClick={handleFitToScreen}
              className="w-10 h-10 text-slate-300 hover:text-white hover:bg-slate-700"
              title="Fit to Screen"
            >
              <Maximize2 className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleZoomReset}
              className="w-10 h-10 text-slate-300 hover:text-white hover:bg-slate-700 text-xs"
              title="Reset Zoom (100%)"
            >
              1:1
            </Button>
          </div>

          {/* Control buttons */}
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            {/* Settings button */}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="secondary"
              className="rounded-full w-12 h-12 shadow-lg"
            >
              <Settings className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-4xl h-[600px] p-0 gap-0 overflow-hidden">
            <div className="flex h-full w-full">
              {/* Sidebar */}
              <div className="w-64 bg-slate-800/50 border-r border-slate-700 p-4 flex-shrink-0">
                <div className="mb-6 px-2">
                  <h1 className="text-slate-100 text-xl font-semibold">Settings</h1>
                </div>

                <nav className="space-y-1">
                  <button
                    onClick={() => setSettingsCategory('api-keys')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      settingsCategory === 'api-keys'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <Key className="h-5 w-5" />
                    <span className="font-medium">API Keys</span>
                  </button>

                  <button
                    onClick={() => setSettingsCategory('appearance')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      settingsCategory === 'appearance'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <Palette className="h-5 w-5" />
                    <span className="font-medium">Appearance</span>
                  </button>

                  <button
                    onClick={() => setSettingsCategory('display')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      settingsCategory === 'display'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <Monitor className="h-5 w-5" />
                    <span className="font-medium">Display</span>
                  </button>

                  <button
                    onClick={() => setSettingsCategory('notifications')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                      settingsCategory === 'notifications'
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700/50'
                    }`}
                  >
                    <Bell className="h-5 w-5" />
                    <span className="font-medium">Notifications</span>
                  </button>
                </nav>
              </div>

              {/* Main Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                  {settingsCategory === 'api-keys' && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-100 mb-2">API Keys</h2>
                        <p className="text-sm text-slate-400">Configure your API keys for different LLM providers. Keys are stored securely and cannot be viewed after saving.</p>
                      </div>

                      <div className="bg-slate-800/50 border border-slate-700 rounded-lg divide-y divide-slate-700">
                        {/* OpenAI */}
                        <div className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Bot className="h-5 w-5 text-green-500" />
                            </div>
                            <div className="min-w-[160px]">
                              <h3 className="font-semibold text-slate-200">OpenAI</h3>
                              <p className="text-xs text-slate-500">platform.openai.com</p>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                              {apiKeys.openai ? (
                                <>
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    API key is configured
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteApiKey('openai')}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 text-xs ml-auto"
                                  >
                                    Delete
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Input
                                    type="password"
                                    value={tempApiKeys.openai || ''}
                                    placeholder="Enter API key"
                                    onChange={(e) => setTempApiKeys({ ...tempApiKeys, openai: e.target.value })}
                                    className="bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 h-9 font-mono flex-1 min-w-0"
                                    autoComplete="off"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => saveApiKey('openai', tempApiKeys.openai)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 flex-shrink-0"
                                  >
                                    Save
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Claude */}
                        <div className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Sparkles className="h-5 w-5 text-orange-500" />
                            </div>
                            <div className="min-w-[160px]">
                              <h3 className="font-semibold text-slate-200">Claude</h3>
                              <p className="text-xs text-slate-500">console.anthropic.com</p>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                              {apiKeys.claude ? (
                                <>
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    API key is configured
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteApiKey('claude')}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 text-xs ml-auto"
                                  >
                                    Delete
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Input
                                    type="password"
                                    value={tempApiKeys.claude || ''}
                                    placeholder="Enter API key"
                                    onChange={(e) => setTempApiKeys({ ...tempApiKeys, claude: e.target.value })}
                                    className="bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 h-9 font-mono flex-1 min-w-0"
                                    autoComplete="off"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => saveApiKey('claude', tempApiKeys.claude)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 flex-shrink-0"
                                  >
                                    Save
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Gemini */}
                        <div className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Brain className="h-5 w-5 text-blue-500" />
                            </div>
                            <div className="min-w-[160px]">
                              <h3 className="font-semibold text-slate-200">Gemini</h3>
                              <p className="text-xs text-slate-500">makersuite.google.com</p>
                            </div>
                            <div className="flex items-center gap-2 flex-1">
                              {apiKeys.gemini ? (
                                <>
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    API key is configured
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => deleteApiKey('gemini')}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-950/30 h-8 text-xs ml-auto"
                                  >
                                    Delete
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Input
                                    type="password"
                                    value={tempApiKeys.gemini || ''}
                                    placeholder="Enter API key"
                                    onChange={(e) => setTempApiKeys({ ...tempApiKeys, gemini: e.target.value })}
                                    className="bg-slate-900 border-slate-600 text-slate-100 placeholder:text-slate-500 h-9 font-mono flex-1 min-w-0"
                                    autoComplete="off"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => saveApiKey('gemini', tempApiKeys.gemini)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 flex-shrink-0"
                                  >
                                    Save
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center pt-4">
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          Keys are encrypted and stored locally
                        </p>
                      </div>
                    </div>
                  )}

                  {settingsCategory === 'appearance' && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Appearance</h2>
                        <p className="text-sm text-slate-400">Customize the look and feel of your workspace.</p>
                      </div>

                      <div className="space-y-4 mt-8">
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="font-medium text-slate-200">Theme</p>
                            <p className="text-sm text-slate-500">Currently using dark mode</p>
                          </div>
                          <div className="text-sm text-slate-400">Coming soon</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsCategory === 'display' && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Display</h2>
                        <p className="text-sm text-slate-400">Adjust display and grid settings.</p>
                      </div>

                      <div className="space-y-4 mt-8">
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="font-medium text-slate-200">Grid Size</p>
                            <p className="text-sm text-slate-500">Current: {GRID_SIZE}px</p>
                          </div>
                          <div className="text-sm text-slate-400">Coming soon</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {settingsCategory === 'notifications' && (
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-semibold text-slate-100 mb-2">Notifications</h2>
                        <p className="text-sm text-slate-400">Manage notification preferences.</p>
                      </div>

                      <div className="space-y-4 mt-8">
                        <div className="flex items-center justify-between py-3">
                          <div>
                            <p className="font-medium text-slate-200">Desktop Notifications</p>
                            <p className="text-sm text-slate-500">Get notified when tasks complete</p>
                          </div>
                          <div className="text-sm text-slate-400">Coming soon</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lock toggle */}
        <div className="flex items-center gap-2 bg-slate-800 rounded-full px-4 h-12 shadow-lg">
          <span className="text-sm font-medium text-slate-300">Lock Canvas</span>
          <Switch
            checked={isLocked}
            onCheckedChange={setIsLocked}
          />
        </div>

        {/* Add button - always visible */}
        <button
          onClick={addChatBox}
          className="text-blue-500 hover:text-blue-400 transition-colors"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

          {/* Bottom Canvas Tabs (Excel-style) */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-slate-800 border-t border-slate-700 flex items-center px-2 gap-1 overflow-x-auto z-50">
        {canvases.map((canvas) => (
          <ContextMenu key={canvas.id}>
            <ContextMenuTrigger asChild>
              <div
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-t border-t-2 cursor-pointer transition-colors ${
                  canvas.id === activeCanvasId
                    ? 'bg-slate-900 border-blue-500 text-white'
                    : 'bg-slate-700 border-transparent text-slate-300 hover:bg-slate-600'
                }`}
                onClick={() => setActiveCanvasId(canvas.id)}
              >
                {editingCanvasId === canvas.id ? (
                  <input
                    type="text"
                    value={canvas.name}
                    onChange={(e) => renameCanvas(canvas.id, e.target.value)}
                    onBlur={() => setEditingCanvasId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setEditingCanvasId(null);
                      }
                    }}
                    className={`bg-transparent border-none outline-none text-sm w-24 ${
                      canvas.id === activeCanvasId ? 'text-white' : 'text-slate-300'
                    }`}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  <span className="text-sm select-none">{canvas.name}</span>
                )}
                {canvases.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      initiateDeleteCanvas(canvas.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className="bg-slate-800 border-slate-700 text-slate-100 shadow-xl opacity-100">
              <ContextMenuItem
                onClick={() => setEditingCanvasId(canvas.id)}
                className="cursor-pointer text-slate-100 hover:bg-slate-700"
              >
                Rename
              </ContextMenuItem>
              {canvases.length > 1 && (
                <ContextMenuItem
                  onClick={() => initiateDeleteCanvas(canvas.id)}
                  className="cursor-pointer text-red-400 hover:bg-slate-700"
                >
                  Delete
                </ContextMenuItem>
              )}
            </ContextMenuContent>
          </ContextMenu>
        ))}
        <Button
          onClick={addCanvas}
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-slate-400 hover:text-white"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-slate-800 border-slate-700 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-slate-100">Delete Canvas</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-300">
              Are you sure you want to delete "
              {canvasToDelete && canvases.find(c => c.id === canvasToDelete)?.name}"?
            </p>
            <p className="text-sm text-slate-400 mt-2">
              All chat boxes on this canvas will be permanently deleted.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={cancelDeleteCanvas}
              className="border-slate-600 text-slate-200 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteCanvas}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent className="bg-slate-800 border-slate-700 text-slate-100 shadow-xl opacity-100">
        <ContextMenuItem onClick={addChatBox} className="cursor-pointer text-slate-100 hover:bg-slate-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Window
        </ContextMenuItem>
        <ContextMenuItem onClick={addTextBox} className="cursor-pointer text-slate-100 hover:bg-slate-700">
          <Type className="mr-2 h-4 w-4" />
          Add Text Box
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export default Pegboard;
