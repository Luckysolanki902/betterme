import React, { useState } from 'react';
import { $createParagraphNode, $getSelection, $insertNodes } from 'lexical';
import { $createImageNode } from './ImageNode';

const InsertImageDialog = ({ activeEditor, onClose }) => {
  const [src, setSrc] = useState('');
  const [altText, setAltText] = useState('');

  const handleInsert = () => {
    if (src) {
      activeEditor.update(() => {
        const selection = $getSelection();
        const imageNode = $createImageNode({
          src,
          altText,
          width: 'auto',
          height: 'auto',
        });
        
        if (selection) {
          if (selection.insertParagraph) {
            selection.insertParagraph();
          }
          selection.insertNodes([imageNode]);
        }
      });
      onClose();
    }
  };

  return (
    <div className="image-dialog-overlay">
      <div className="image-dialog">
        <h2>Insert Image</h2>
        <div className="image-dialog-form">
          <div className="form-group">
            <label htmlFor="imageUrl">Image URL</label>
            <input
              type="text"
              id="imageUrl"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          <div className="form-group">
            <label htmlFor="imageAlt">Alt Text</label>
            <input
              type="text"
              id="imageAlt"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
              placeholder="Image description"
            />
          </div>
          <div className="dialog-buttons">
            <button onClick={onClose}>Cancel</button>
            <button onClick={handleInsert} className="primary">
              Insert
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .image-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .image-dialog {
          background-color: white;
          border-radius: 8px;
          padding: 24px;
          width: 400px;
          max-width: 90%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        h2 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 18px;
          font-weight: 600;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        label {
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
          font-weight: 500;
        }
        
        input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }
        
        .dialog-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 24px;
        }
        
        button {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          background-color: #f1f5f9;
        }
        
        button.primary {
          background-color: #4385f5;
          color: white;
        }
      `}</style>
    </div>
  );
};

export default InsertImageDialog;
