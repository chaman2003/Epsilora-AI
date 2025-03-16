import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setIsCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Format code for better organization based on bracket placement
  const formatCode = (codeStr: string): string => {
    // Don't format if the code is already well-formatted or too short
    if (!codeStr || codeStr.length < 10 || !shouldFormatCode(language)) {
      return codeStr;
    }

    try {
      // Normalize line breaks
      let result = codeStr.replace(/\r\n/g, '\n');
      
      // Handle bracket formatting for languages that use them
      if (language && ['javascript', 'typescript', 'jsx', 'tsx', 'java', 'c', 'cpp', 'csharp', 'php'].includes(language.toLowerCase())) {
        // Ensure opening brackets have proper line breaks and spacing
        result = result
          // Add linebreak after opening brackets if not already there
          .replace(/\{(?!\n)/g, '{\n')
          // Add linebreak before closing brackets if not preceded by linebreak
          .replace(/([^\n])\}/g, '$1\n}')
          // Ensure semicolons have proper spacing
          .replace(/;(?!\n| |$)/g, ';\n');
          
        // Split the code into lines for indentation processing
        const lines = result.split('\n');
        let indentLevel = 0;
        const indentedLines = lines.map(line => {
          // Trim the line to remove whitespace
          const trimmedLine = line.trim();
          
          // Adjust indent level based on closing brackets at start of line
          if (trimmedLine.startsWith('}') || trimmedLine.startsWith(')')) {
            indentLevel = Math.max(0, indentLevel - 1);
          }
          
          // Create the indentation string
          const indent = '  '.repeat(indentLevel);
          
          // Add indentation to the line
          const indentedLine = trimmedLine ? indent + trimmedLine : '';
          
          // Adjust indent level based on opening brackets at end of line
          if (trimmedLine.endsWith('{') || trimmedLine.endsWith('(') && !trimmedLine.includes(')')) {
            indentLevel++;
          }
          
          return indentedLine;
        });
        
        result = indentedLines.join('\n');
      }
      
      return result;
    } catch (error) {
      // If something goes wrong, return the original code
      console.error('Error formatting code:', error);
      return codeStr;
    }
  };

  // Determine if we should format the code based on language
  const shouldFormatCode = (lang?: string): boolean => {
    if (!lang) return false;
    
    const formatLanguages = [
      'javascript', 'js', 
      'typescript', 'ts', 
      'jsx', 'tsx', 
      'java', 
      'c', 'cpp', 'c++', 'csharp', 'c#',
      'php',
      'ruby',
      'swift',
      'kotlin',
      'go'
    ];
    
    return formatLanguages.includes(lang.toLowerCase());
  };

  const formattedCode = formatCode(code);

  return (
    <div className="relative my-2 bg-white dark:bg-black">
      {/* Purple border for more eye-catching appearance - all gray removed */}
      <div className="border-2 border-purple-400 dark:border-purple-600 rounded-md bg-white dark:bg-black">
        <div className="flex justify-between items-center py-1.5 px-3 border-b-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950">
          {/* Language tag with purple styling */}
          {language && (
            <div className="text-xs font-semibold font-mono text-purple-700 dark:text-purple-300">
              {language}
            </div>
          )}
          
          {/* Copy button with text */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-purple-600 hover:text-purple-800 dark:text-purple-300 dark:hover:text-purple-200 transition-colors font-medium"
            aria-label="Copy code"
          >
            {isCopied ? (
              <>
                <Check size={14} className="text-purple-600 dark:text-purple-300" />
                <span className="text-xs">Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-purple-600 dark:text-purple-300" />
                <span className="text-xs">Copy</span>
              </>
            )}
          </button>
        </div>
        
        {/* Code content with non-gray text */}
        <pre className="px-3 pb-3 pt-2 overflow-x-auto text-sm bg-white dark:bg-black">
          <code className="font-mono whitespace-pre-wrap break-words font-medium text-purple-900 dark:text-purple-50">
            {formattedCode}
          </code>
        </pre>
      </div>
    </div>
  );
};

export default CodeBlock; 