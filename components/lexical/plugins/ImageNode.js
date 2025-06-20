import {
  $createNodeSelection,
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
  COMMAND_PRIORITY_EDITOR,
  COMMAND_PRIORITY_LOW,
  createCommand,
  DecoratorNode,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  KEY_ENTER_COMMAND,
  KEY_ESCAPE_COMMAND,
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useLexicalNodeSelection } from '@lexical/react/useLexicalNodeSelection';
import { mergeRegister } from '@lexical/utils';
import React, { useCallback, useEffect, useRef, useState } from 'react';

export const INSERT_IMAGE_COMMAND = createCommand();

export class ImageNode extends DecoratorNode {
  __src;
  __altText;
  __width;
  __height;
  __maxWidth;
  __showCaption;
  __caption;
  __captionsEnabled;

  constructor(
    src,
    altText,
    width,
    height,
    maxWidth,
    showCaption,
    caption,
    captionsEnabled,
    key,
  ) {
    super(key);
    this.__src = src;
    this.__altText = altText;
    this.__width = width;
    this.__height = height;
    this.__maxWidth = maxWidth;
    this.__showCaption = showCaption || false;
    this.__caption = caption || '';
    this.__captionsEnabled = captionsEnabled || false;
  }

  static getType() {
    return 'image';
  }

  static clone(node) {
    return new ImageNode(
      node.__src,
      node.__altText,
      node.__width,
      node.__height,
      node.__maxWidth,
      node.__showCaption,
      node.__caption,
      node.__captionsEnabled,
      node.__key,
    );
  }

  static importJSON(serializedNode) {
    const { src, altText, width, height, maxWidth, showCaption, caption, captionsEnabled } =
      serializedNode;
    
    return $createImageNode({
      src,
      altText,
      width,
      height,
      maxWidth,
      showCaption,
      caption,
      captionsEnabled,
    });
  }

  exportJSON() {
    return {
      type: 'image',
      version: 1,
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
      maxWidth: this.__maxWidth,
      showCaption: this.__showCaption,
      caption: this.__caption,
      captionsEnabled: this.__captionsEnabled,
    };
  }

  createDOM() {
    const div = document.createElement('div');
    div.className = 'image-container';
    return div;
  }

  updateDOM() {
    return false;
  }

  getSrc() {
    return this.__src;
  }

  getAltText() {
    return this.__altText;
  }

  getWidth() {
    return this.__width;
  }

  getHeight() {
    return this.__height;
  }

  setWidth(width) {
    const writable = this.getWritable();
    writable.__width = width;
  }

  setHeight(height) {
    const writable = this.getWritable();
    writable.__height = height;
  }

  decorate() {
    return (
      <ImageComponent
        src={this.__src}
        altText={this.__altText}
        width={this.__width}
        height={this.__height}
        maxWidth={this.__maxWidth}
        nodeKey={this.__key}
        showCaption={this.__showCaption}
        caption={this.__caption}
        captionsEnabled={this.__captionsEnabled}
      />
    );
  }
}

function ImageResizer({ onResizeStart, onResizeEnd, imageRef }) {
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(0);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startWidthRef = useRef(0);
  const startHeightRef = useRef(0);
  const resizerRef = useRef(null);

  const startResize = (event) => {
    event.preventDefault();
    const image = imageRef.current;
    if (!image) return;
    
    const { width, height } = image.getBoundingClientRect();
    setIsResizing(true);
    startXRef.current = event.clientX;
    startYRef.current = event.clientY;
    startWidthRef.current = width;
    startHeightRef.current = height;
    setCurrentWidth(width);
    setCurrentHeight(height);
    
    if (onResizeStart) {
      onResizeStart();
    }

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
  };

  const handleResize = (event) => {
    if (!isResizing) return;
    
    const deltaX = event.clientX - startXRef.current;
    const width = startWidthRef.current + deltaX;
    const aspectRatio = startWidthRef.current / startHeightRef.current;
    const height = width / aspectRatio;
    
    setCurrentWidth(width);
    setCurrentHeight(height);
  };

  const stopResize = () => {
    if (isResizing) {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
      
      if (onResizeEnd) {
        onResizeEnd(currentWidth, currentHeight);
      }
    }
  };

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleResize);
      document.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing]);

  return (
    <>
      <div
        className="image-resizer-se"
        ref={resizerRef}
        onMouseDown={startResize}
      />
    </>
  );
}

function ImageComponent({
  src,
  altText,
  width,
  height,
  maxWidth,
  nodeKey,
  showCaption,
  caption,
  captionsEnabled,
}) {
  const ref = useRef(null);
  const imageRef = useRef(null);
  const [isSelected, setSelected, clearSelection] = useLexicalNodeSelection(nodeKey);
  const [editor] = useLexicalComposerContext();

  const onDelete = useCallback(
    (event) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        event.preventDefault();
        editor.update(() => {
          const node = $getNodeByKey(nodeKey);
          if ($isImageNode(node)) {
            node.remove();
          }
        });
      }
      return false;
    },
    [editor, isSelected, nodeKey],
  );

  const onEnter = useCallback(
    (event) => {
      if (isSelected && $isNodeSelection($getSelection())) {
        event.preventDefault();
        return true;
      }
      return false;
    },
    [isSelected],
  );

  const onEscape = useCallback(
    (event) => {
      if (isSelected) {
        event.preventDefault();
        setSelected(false);
        return true;
      }
      return false;
    },
    [isSelected, setSelected],
  );

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        KEY_DELETE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_BACKSPACE_COMMAND,
        onDelete,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ENTER_COMMAND,
        onEnter,
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        onEscape,
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, onDelete, onEnter, onEscape]);

  const onResizeEnd = (nextWidth, nextHeight) => {
    // Update the image dimensions in the editor
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if ($isImageNode(node)) {
        node.setWidth(nextWidth);
        node.setHeight(nextHeight);
      }
    });
  };

  const handleClick = useCallback(
    () => {
      setSelected(true);
    },
    [setSelected],
  );

  return (
    <div className="image-resizer" ref={ref}>
      <div className={`image-container ${isSelected ? 'selected' : ''}`}>
        <img
          src={src}
          alt={altText}
          ref={imageRef}
          style={{
            width: width !== 'auto' ? width : undefined,
            height: height !== 'auto' ? height : undefined,
            maxWidth: maxWidth || '100%',
          }}
          onClick={handleClick}
          draggable="false"
          width={width !== 'auto' ? width : undefined}
          height={height !== 'auto' ? height : undefined}
        />
        {isSelected && (
          <ImageResizer
            onResizeEnd={onResizeEnd}
            imageRef={imageRef}
          />
        )}
      </div>
      {showCaption && captionsEnabled && (
        <div className="image-caption-container">
          <div
            className="image-caption"
            contentEditable
            suppressContentEditableWarning
          >
            {caption}
          </div>
        </div>
      )}

      <style jsx>{`
        .image-container {
          position: relative;
          display: inline-block;
          margin: 0;
          max-width: 100%;
          line-height: 0;
        }
        
        .image-resizer {
          display: inline-block;
          position: relative;
          margin: 12px 0;
          height: auto;
          width: 100%;
        }
        
        img {
          max-width: 100%;
          border-radius: 4px;
          cursor: default;
          position: relative;
        }
        
        .selected img {
          outline: 2px solid #4385f5;
          border-radius: 4px;
        }
        
        .image-resizer-se {
          cursor: se-resize;
          height: 12px;
          width: 12px;
          position: absolute;
          right: -6px;
          bottom: -6px;
          background-color: #4385f5;
          border: 1px solid #fff;
          border-radius: 50%;
          z-index: 10;
        }
        
        .image-caption-container {
          margin-top: 4px;
        }
        
        .image-caption {
          border: 0;
          color: #666;
          display: block;
          font-size: 14px;
          padding: 4px;
          text-align: center;
        }
        
        .image-caption:focus {
          outline: none;
          border-radius: 4px;
          background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
}

export function $createImageNode({
  src,
  altText,
  width = 'auto',
  height = 'auto',
  maxWidth = '100%',
  showCaption = false,
  caption = '',
  captionsEnabled = false,
  key,
}) {
  return new ImageNode(
    src,
    altText,
    width,
    height,
    maxWidth,
    showCaption,
    caption,
    captionsEnabled,
    key,
  );
}

export function $isImageNode(node) {
  return node instanceof ImageNode;
}
