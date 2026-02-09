import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Lock,
  Unlock,
  Settings,
  X,
  GripVertical,
  Type,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

function TextBox({
  id,
  x,
  y,
  width,
  height,
  text,
  fontFamily,
  fontSize,
  fontWeight,
  fontStyle,
  textColor,
  dropShadow,
  locked,
  gridSize,
  isLocked,
  isFocused,
  isDragging: isDraggingFromParent,
  onUpdate,
  onRemove,
  onFocus,
  onDragStart,
  onDragEnd,
}) {
  const [showSettings, setShowSettings] = useState(false);
  const [localText, setLocalText] = useState(text);
  const [localFontFamily, setLocalFontFamily] = useState(fontFamily);
  const [localFontSize, setLocalFontSize] = useState(fontSize);
  const [localFontWeight, setLocalFontWeight] = useState(fontWeight);
  const [localFontStyle, setLocalFontStyle] = useState(fontStyle);
  const [localTextColor, setLocalTextColor] = useState(textColor);
  const [localDropShadow, setLocalDropShadow] = useState(dropShadow);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const textBoxRef = useRef(null);

  const MIN_WIDTH = 4; // minimum grid units
  const MIN_HEIGHT = 2; // minimum grid units

  // Sync local state with props
  useEffect(() => {
    setLocalText(text);
  }, [text]);

  useEffect(() => {
    setLocalFontFamily(fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    setLocalFontSize(fontSize);
  }, [fontSize]);

  useEffect(() => {
    setLocalFontWeight(fontWeight);
  }, [fontWeight]);

  useEffect(() => {
    setLocalFontStyle(fontStyle);
  }, [fontStyle]);

  useEffect(() => {
    setLocalTextColor(textColor);
  }, [textColor]);

  useEffect(() => {
    setLocalDropShadow(dropShadow);
  }, [dropShadow]);

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

  const getDropShadowStyle = () => {
    if (localDropShadow === 'none') return '';
    if (localDropShadow === 'small') return '2px 2px 4px rgba(0, 0, 0, 0.5)';
    if (localDropShadow === 'medium') return '4px 4px 8px rgba(0, 0, 0, 0.5)';
    if (localDropShadow === 'large') return '6px 6px 12px rgba(0, 0, 0, 0.5)';
    return '';
  };

  return (
    <div
      ref={textBoxRef}
      onClick={(e) => {
        e.stopPropagation();
        onFocus();
      }}
      className={`absolute bg-transparent border-2 ${
        isLocked
          ? 'border-transparent'
          : locked
          ? 'border-slate-600'
          : 'border-purple-500'
      } rounded-lg flex flex-col select-none ${
        !isLocked
          ? isDragging
            ? 'cursor-grabbing'
            : 'cursor-grab'
          : 'cursor-default'
      }`}
      style={{
        left: `${x * gridSize}px`,
        top: `${y * gridSize}px`,
        width: `${width * gridSize}px`,
        height: `${height * gridSize}px`,
        zIndex: isDraggingFromParent ? 100 : 10,
        pointerEvents: 'auto',
        opacity: isDraggingFromParent ? 0.5 : 1,
        transition: isDraggingFromParent ? 'none' : 'opacity 0.2s',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-1 bg-slate-700/50 border-b border-slate-600 rounded-t-lg"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1 flex-1">
          {!isLocked && <GripVertical className="h-3 w-3 text-slate-400" />}
          <Type className="h-3 w-3 text-purple-400" />
          <span className="text-xs text-slate-300">Text</span>
        </div>
        <div className="flex items-center gap-1 no-drag">
          {!isLocked && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => setShowSettings(!showSettings)}
              >
                {showSettings ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5"
                onClick={() => onUpdate({ locked: !locked })}
              >
                {locked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  <Unlock className="h-3 w-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-5 w-5 text-red-400 hover:text-red-300"
                onClick={onRemove}
              >
                <X className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Text content area */}
      <div className="flex-1 p-4 overflow-auto flex items-center justify-center">
        <div
          className="no-drag select-text cursor-text"
          style={{
            fontFamily: localFontFamily,
            fontSize: localFontSize,
            fontWeight: localFontWeight,
            fontStyle: localFontStyle,
            color: localTextColor,
            textShadow: getDropShadowStyle(),
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {localText || 'Click chevron to edit text'}
        </div>
      </div>

      {/* Inline Settings Panel */}
      {showSettings && (
        <div className="border-t border-slate-600 p-3 bg-slate-750 no-drag overflow-y-auto max-h-64 cursor-default">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">Text</label>
              <Textarea
                value={localText}
                onChange={(e) => {
                  setLocalText(e.target.value);
                  onUpdate({ text: e.target.value });
                }}
                placeholder="Enter your text..."
                className="bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 text-xs select-text"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">Font</label>
                <Select
                  value={localFontFamily}
                  onValueChange={(value) => {
                    setLocalFontFamily(value);
                    onUpdate({ fontFamily: value });
                  }}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="sans-serif">Sans</SelectItem>
                    <SelectItem value="serif">Serif</SelectItem>
                    <SelectItem value="monospace">Mono</SelectItem>
                    <SelectItem value="cursive">Cursive</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">Size</label>
                <Select
                  value={localFontSize}
                  onValueChange={(value) => {
                    setLocalFontSize(value);
                    onUpdate({ fontSize: value });
                  }}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="12px">12px</SelectItem>
                    <SelectItem value="16px">16px</SelectItem>
                    <SelectItem value="20px">20px</SelectItem>
                    <SelectItem value="24px">24px</SelectItem>
                    <SelectItem value="32px">32px</SelectItem>
                    <SelectItem value="48px">48px</SelectItem>
                    <SelectItem value="64px">64px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">Weight</label>
                <Select
                  value={localFontWeight}
                  onValueChange={(value) => {
                    setLocalFontWeight(value);
                    onUpdate({ fontWeight: value });
                  }}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                    <SelectItem value="lighter">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-200">Style</label>
                <Select
                  value={localFontStyle}
                  onValueChange={(value) => {
                    setLocalFontStyle(value);
                    onUpdate({ fontStyle: value });
                  }}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="italic">Italic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={localTextColor}
                  onChange={(e) => {
                    setLocalTextColor(e.target.value);
                    onUpdate({ textColor: e.target.value });
                  }}
                  className="w-12 h-8 bg-slate-900 border-slate-700 p-1"
                />
                <Input
                  type="text"
                  value={localTextColor}
                  onChange={(e) => {
                    setLocalTextColor(e.target.value);
                    onUpdate({ textColor: e.target.value });
                  }}
                  className="flex-1 bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 h-8 text-xs select-text"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-200">Shadow</label>
              <Select
                value={localDropShadow}
                onValueChange={(value) => {
                  setLocalDropShadow(value);
                  onUpdate({ dropShadow: value });
                }}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-100 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Resize handles */}
      {!isLocked && !locked && isFocused && (
        <>
          {/* Corner handles */}
          <div
            className="absolute top-0 left-0 w-4 h-4 bg-green-500 border-2 border-green-300 cursor-nw-resize no-drag rounded-sm"
            onMouseDown={(e) => handleResizeMouseDown(e, 'top-left')}
          />
          <div
            className="absolute top-0 right-0 w-4 h-4 bg-green-500 border-2 border-green-300 cursor-ne-resize no-drag rounded-sm"
            onMouseDown={(e) => handleResizeMouseDown(e, 'top-right')}
          />
          <div
            className="absolute bottom-0 left-0 w-4 h-4 bg-green-500 border-2 border-green-300 cursor-sw-resize no-drag rounded-sm"
            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-left')}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-green-300 cursor-se-resize no-drag rounded-sm"
            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom-right')}
          />
          {/* Edge handles */}
          <div
            className="absolute top-0 left-4 right-4 h-2 cursor-n-resize no-drag hover:bg-green-500/70 bg-green-500/30 rounded-sm"
            onMouseDown={(e) => handleResizeMouseDown(e, 'top')}
          />
          <div
            className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize no-drag hover:bg-green-500/70 bg-green-500/30 rounded-sm"
            onMouseDown={(e) => handleResizeMouseDown(e, 'bottom')}
          />
          <div
            className="absolute left-0 top-4 bottom-4 w-2 cursor-w-resize no-drag hover:bg-green-500/70 bg-green-500/30 rounded-sm"
            onMouseDown={(e) => handleResizeMouseDown(e, 'left')}
          />
          <div
            className="absolute right-0 top-4 bottom-4 w-2 cursor-e-resize no-drag hover:bg-green-500/70 bg-green-500/30 rounded-sm"
            onMouseDown={(e) => handleResizeMouseDown(e, 'right')}
          />
        </>
      )}
    </div>
  );
}

export default TextBox;
