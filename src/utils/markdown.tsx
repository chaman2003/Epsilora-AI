import React from 'react';
import CodeBlock from '../components/CodeBlock';

// Import the normalizeMarkdownText function from markdown.ts
import { normalizeMarkdownText } from './markdown';

/**
 * Processes text with code blocks to return properly rendered content
 * Splits content at ``` markers and renders code blocks appropriately
 */
export const processCodeBlocks = (text: string): JSX.Element => {
  const processedText = normalizeMarkdownText(text);
  
  if (processedText.includes('```')) {
    return (
      <div className="text-left whitespace-pre-wrap break-words">
        {processedText.split('```').map((part, index) => {
          // Even indexes are normal text, odd indexes are code
          if (index % 2 === 0) {
            return <span key={index}>{part}</span>;
          } else {
            // Extract language and code
            const codeLines = part.trim().split('\n');
            const language = codeLines[0] ? codeLines[0].trim() : undefined;
            // Ensure proper line breaks
            const code = codeLines.slice(1).join('\n');
            
            // Use the CodeBlock component
            return <CodeBlock key={index} code={code} language={language} />;
          }
        })}
      </div>
    );
  }
  
  return <span>{processedText}</span>;
}; 