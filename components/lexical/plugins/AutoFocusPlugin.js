import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

export function AutoFocusPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Focus the editor when the component is mounted
    editor.focus();
  }, [editor]);

  return null;
}

export default AutoFocusPlugin;
