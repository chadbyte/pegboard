import React, { useState, useEffect } from 'react';
import Pegboard from './components/Pegboard';
import ChatBox from './components/ChatBox';

function App() {
  const [isFloating, setIsFloating] = useState(false);
  const [chatboxId, setChatboxId] = useState(null);
  const [windowData, setWindowData] = useState(null);

  useEffect(() => {
    // Check if this is a floating window
    const params = new URLSearchParams(window.location.search);
    const floating = params.get('floating');
    const id = params.get('chatboxId');

    console.log('[App] URL params:', { floating, id, search: window.location.search });

    if (floating === 'true' && id) {
      console.log('[App] Detected floating mode for chatbox:', id);
      setIsFloating(true);
      setChatboxId(id);

      // Listen for initial data from main process
      if (window.electron?.floating) {
        window.electron.floating.onInit((data) => {
          console.log('[App] Received floating init data:', data);
          setWindowData(data.windowData);
        });

        // Also request data in case init was missed
        window.electron.floating.getData(id).then((data) => {
          if (data && !windowData) {
            console.log('[App] Got floating data from request:', data);
            setWindowData(data);
          }
        });
      }
    }
  }, []);

  if (isFloating && chatboxId) {
    console.log('[App] Rendering floating ChatBox:', chatboxId, windowData);

    // Show loading while waiting for data
    if (!windowData) {
      return (
        <div className="dark h-screen w-screen overflow-hidden bg-slate-800 flex items-center justify-center">
          <div className="text-slate-400">Loading...</div>
        </div>
      );
    }

    return (
      <div className="dark h-screen w-screen overflow-hidden bg-slate-900">
        <ChatBox
          id={chatboxId}
          name={windowData.name || 'Widget'}
          x={0}
          y={0}
          width={100}
          height={100}
          prompt={windowData.systemPrompt || ''}
          model={windowData.model || 'gpt-4o-mini'}
          tintColor={windowData.tintColor || '#3b82f6'}
          gridSize={1}
          isLocked={false}
          isFocused={true}
          isDragging={false}
          streaming={true}
          apiKeys={windowData.apiKeys || {}}
          allWindows={[]}
          isFloatingWidget={true}
          onUpdate={() => {}}
          onRemove={() => {
            if (window.electron?.floating) {
              window.electron.floating.close(chatboxId);
            }
          }}
          onFocus={() => {}}
          onDragStart={() => {}}
          onDragEnd={() => {}}
        />
      </div>
    );
  }

  return (
    <div className="dark h-screen w-screen overflow-hidden">
      <Pegboard />
    </div>
  );
}

export default App;
