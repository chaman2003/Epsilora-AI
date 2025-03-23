/**
 * Normalizes text by cleaning up markdown content
 * - Replaces <br> tags with newlines
 * - Normalizes excessive spaces and line breaks
 * - Ensures proper spacing around headers
 * - Improves list formatting with emojis
 * - Enhances table formatting for better readability
 * - Formats quiz questions and answers for better readability
 */
export const normalizeMarkdownText = (text: string): string => {
  if (!text) return '';
  
  // Extract question with options and answers
  const extractQuizFormat = (text: string): string => {
    // Find the question part - match common question patterns
    const questionMatch = /(Which|What|How|Why|When|Where|Who)[\w\s,.'?:;()-]+\?/.exec(text);
    if (!questionMatch) return text;
    
    const question = questionMatch[0];
    
    // If we have Options: marker, use that to split
    if (text.includes("Options:")) {
      const parts = text.split("Options:");
      if (parts.length < 2) return text;
      
      const optionsText = parts[1].trim();
      
      // Process each option to ensure it's on its own line
      let options = optionsText
        // Handle bold formatted options with dash
        .replace(/\*\*-\s*([A-D])\.\s*\*\*\s*(.*?)(?=\n\s*\*\*-\s*[A-D]\.|\n\s*Your Answer:|\s*$)/gs, '- $1. $2\n')
        // Handle bold options without dash
        .replace(/\*\*([A-D])\.\s*\*\*\s*(.*?)(?=\n\s*\*\*[A-D]\.|\n\s*Your Answer:|\s*$)/gs, '- $1. $2\n')
        // Handle plain lettered options
        .replace(/^([A-D])[.)] (.*?)$/gm, '- $1. $2')
        // Remove duplicate newlines
        .replace(/\n\s*\n/g, '\n')
        // Process user's incorrect answer line
        .replace(/Your Answer:\s*([A-D])\s*❌\s*Wrong/g, '- $1. (Your answer - Incorrect)')
        // Mark correct answers when specified separately
        .replace(/Correct answer was ([A-D])/g, '- $1. (Correct answer)');
      
      // Process answer indicators (checkmarks, emojis, etc)
      options = options
        // Format correct answers with various indicators
        .replace(/- ([A-D])\.\s*(.*?)\s*✓\s*\(Correct answer\)/gm, '- $1. $2 ✓ (Correct answer)')
        .replace(/- ([A-D])\.\s*(.*?)\s*✅/gm, '- $1. $2 ✓ (Correct answer)')
        .replace(/- ([A-D])\.\s*(.*?)\s*👉/gm, '- $1. $2 ✓ (Correct answer)')
        // Format incorrect answers with X mark
        .replace(/- ([A-D])\.\s*(.*?)\s*❌\s*\(Incorrect\)/gm, '- $1. $2 ❌ (Incorrect)')
        .replace(/- ([A-D])\.\s*(.*?)\s*❌/gm, '- $1. $2 ❌ (Incorrect)')
        // Remove emoji pointers
        .replace(/👉/g, '');
      
      // Ensure proper spacing between question and options
      return `${question}\n\n${options}`;
    }
    
    // If no "Options:" marker but still looks like a quiz,
    // try to extract options and format them appropriately
    const optionsPattern = /([A-D])[.)]\s*(.*?)(?=\s*[A-D][.)]|\s*$)/gs;
    const optionsMatch = text.match(optionsPattern);
    
    if (optionsMatch) {
      let formattedOptions = '';
      let questionText = text;
      
      // Remove the options from the question text
      optionsMatch.forEach(option => {
        questionText = questionText.replace(option, '');
      });
      
      // Clean up question text and find any "Your Answer" or "Correct answer" indicators
      questionText = questionText
        .replace(/Your Answer:.+$/gm, '')
        .replace(/Correct answer was.+$/gm, '')
        .trim();
      
      // Format each option
      optionsMatch.forEach(option => {
        const optionLetter = option.match(/([A-D])[.)]/)?.[1] || '';
        const optionText = option.replace(/[A-D][.)]\s*/, '').trim();
        
        // Determine if this is a correct answer
        const isCorrectAnswer = option.includes('✓') || option.includes('✅') || option.includes('👉');
        // Determine if this was user's incorrect answer
        const isUserIncorrect = text.includes(`Your Answer: ${optionLetter}`) && text.includes('❌');
        
        if (isCorrectAnswer) {
          formattedOptions += `- ${optionLetter}. ${optionText.replace(/✓|✅|👉/g, '')} ✓ (Correct answer)\n`;
        } else if (isUserIncorrect) {
          formattedOptions += `- ${optionLetter}. ${optionText} ❌ (Your answer - Incorrect)\n`;
        } else {
          formattedOptions += `- ${optionLetter}. ${optionText}\n`;
        }
      });
      
      // Process "Your Answer" and "Correct answer" from the end of the text
      const userAnswerMatch = text.match(/Your Answer:\s*([A-D])\s*❌/);
      const correctAnswerMatch = text.match(/Correct answer was\s*([A-D])/);
      
      if (userAnswerMatch && correctAnswerMatch) {
        // If we have both user answer and correct answer, update the formatted options
        formattedOptions = formattedOptions
          .replace(new RegExp(`- ${userAnswerMatch[1]}\\.(.*)$`, 'm'), `- ${userAnswerMatch[1]}.$1 ❌ (Your answer - Incorrect)`)
          .replace(new RegExp(`- ${correctAnswerMatch[1]}\\.(.*)$`, 'm'), `- ${correctAnswerMatch[1]}.$1 ✓ (Correct answer)`);
      }
      
      return `${questionText}\n\n${formattedOptions}`;
    }
    
    return text;
  };
  
  // Try to apply special formatting for quiz questions first
  if (/(Which|What|How|Why|When|Where|Who)[\w\s,.'?:;()-]+\?/.test(text) && 
      (text.includes("Options:") || 
       text.includes("**- A. **") || 
       text.includes("**- B. **") ||
       text.match(/[A-D][.)]\s*[A-Za-z]/) ||
       text.includes("✓") ||
       text.includes("✅") ||
       text.includes("❌"))) {
    return extractQuizFormat(text);
  }
  
  // Handle common issues in markdown text
  return text
    // Remove excessive blank lines (more than 2 consecutive)
    .replace(/\n{3,}/g, '\n\n')
    
    // Fix table formatting issues
    .replace(/\|\s*\n\s*\|/g, '|\n|') // Fix empty table rows
    .replace(/\|-+\|/g, match => match.replace(/-/g, ' - ').replace(/\s{3,}/g, ' -- ')) // Fix table headers with too few dashes
    .replace(/\n(\s*\|)/g, '\n$1') // Fix indented table rows
    .replace(/(\|[^|]*\|)\s*\n\s*(?!\|)/g, '$1\n\n') // Add spacing after tables
    
    // Fix broken table headers (missing separators)
    .replace(/\|(.*)\|\n(?!\|)/g, (match, content) => {
      // If this looks like a table header row but is missing the separator row
      if (content.includes('|') && !match.includes('---')) {
        // Count the columns
        const columns = content.split('|').length - 1;
        // Create a separator row
        const separator = '|' + ' --- |'.repeat(columns) + '\n';
        return match + separator;
      }
      return match;
    })
    
    // Fix table separator rows with incorrect dash counts
    .replace(/\|([\s-]*)\|/g, (match) => {
      return match.replace(/(\s*-+\s*)/g, ' --- ');
    })
    
    // Clean up quiz question formatting with options
    .replace(/(Which|What|How|Why|When|Where|Who).*?\?\s*Options:\s*/g, '$&\n\n') // Add line break after "Options:"
    
    // Fix options formatting with bold markdown - multiple patterns to catch different formats
    .replace(/\*\*-\s*([A-D])\.\s*\*\*\s*(.*?)(?=\n\n|\n\*\*-|$)/gm, '- $1. $2\n') // Format bold options like **- A. ** Text
    .replace(/\n\s*\*\*-\s*([A-D])\.\s*\*\*\s*(.*?)(?=\n|\s*$)/gm, '\n- $1. $2\n') // Another bold pattern
    .replace(/\n\s*\*\*([A-D])\.\s*\*\*\s*(.*?)(?=\n|\s*$)/gm, '\n- $1. $2\n') // Format bold options like **A. ** Text
    .replace(/^\s*\*\*-\s*([A-D])\.\s*\*\*\s*(.*?)$/gm, '- $1. $2') // Format starting line with bold options
    
    // Format other option patterns
    .replace(/^([A-D])[.)] (.*?)$/gm, '- $1. $2') // Convert "A. Text" to "- A. Text"
    .replace(/(?<=\n)([A-D])[.)] (.*?)$/gm, '- $1. $2') // Convert "A. Text" to "- A. Text" mid-text
    
    // Format quiz questions and answer options (for cases not handled above)
    .replace(/(What|Which|How|Why|When|Where|Who)[\w\s]+\?(\s*)([A-D]\.)/gm, '$1$2$3'.replace('$2', '\n\n- ')) // Add line breaks after questions
    .replace(/([A-D])\.[\s]*(.*?)(?=(?:[A-D]\.)|$)/gm, '- $1. $2\n') // Format each option on its own line
    
    // Format quiz answers with correct formatting
    .replace(/- ([A-D])\.\s*(.*?)\s*✓\s*\(Correct answer\)/gm, '- $1. $2 ✓ (Correct answer)') // Format correct answers
    .replace(/- ([A-D])\.\s*(.*?)\s*✅/gm, '- $1. $2 ✓ (Correct answer)') // Format correct answers with checkmark
    .replace(/- ([A-D])\.\s*(.*?)\s*❌\s*\(Incorrect\)/gm, '- $1. $2 ❌ (Incorrect)') // Format incorrect answers
    .replace(/- ([A-D])\.\s*(.*?)\s*❌/gm, '- $1. $2 ❌ (Incorrect)') // Format incorrect answers with X
    .replace(/Your Answer:\s*([A-D])\s*❌\s*Wrong/gm, '') // Remove redundant "Your Answer" text
    .replace(/Correct answer was ([A-D])/gm, '') // Remove redundant "Correct answer was" text
    .replace(/👉/g, '') // Remove pointer emoji
    
    // Enhance quiz answer formatting
    .replace(/^- \*\*([A-D])\.\*\* (.*)/gm, '- $1. $2') // Remove bold formatting from answer options
    .replace(/^([A-D])\.\s+/gm, '- $1. ') // Convert "A. Text" to "- A. Text" for list formatting
    .replace(/\(Your answer - (Correct|Incorrect)\)/g, '($1)') // Simplify feedback text
    
    // Fix common spacing issues in headings
    .replace(/^(#{1,6})\s*(.+?)\s*$/gm, '$1 $2') // Ensure single space after # in headings
    
    // Reduce line spacing between list items
    .replace(/^\s*[*-]\s+(.+?)\n\n/gm, '- $1\n') // Convert double newlines after list items to single
    
    // Normalize spacing for lists with reduced spacing
    .replace(/^(\s*[*-])\s+/gm, '$1 ') // Normalize spacing after list markers
    .replace(/^(\s*\d+\.)\s+/gm, '$1 ') // Normalize spacing after numbered list items
    
    // Clean up question formatting with tighter spacing
    .replace(/^####\s*(\d+)\.\s+(.+?)(\n+)/gm, '#### $1. $2\n') // Remove excess newlines after questions
    
    // Fix HR spacing with reduced space
    .replace(/\n---\n/g, '\n---\n') // Ensure minimal spacing around horizontal rules
    .replace(/\n\n---\n\n/g, '\n---\n') // Remove extra spacing around horizontal rules
    
    // Fix code block spacing
    .replace(/```(\w*)\n\n/g, '```$1\n') // Remove extra newline after code block opening
    .replace(/\n\n```/g, '\n```') // Remove extra newline before code block closing
    
    // Reduce paragraph spacing
    .replace(/\n\n\n/g, '\n\n') // Convert triple newlines to double
    .replace(/\n\n([^#\-*\d])/g, '\n$1') // Reduce spacing before paragraphs that don't start with formatting characters
    
    // Remove trailing whitespace
    .replace(/[ \t]+$/gm, '')
    
    // Reduce vertical spacing around elements
    .replace(/(\*\*.*?\*\*)\n\n/g, '$1\n') // Reduce spacing after bold text
    .replace(/(\*.*?\*)\n\n/g, '$1\n') // Reduce spacing after italic text
    
    // Add user answer indicators
    .replace(/Your Answer:\s*([A-D])\s*❌/gm, (_, letter) => {
      // Find the option with this letter and mark it as the user's incorrect answer
      const regex = new RegExp(`- (${letter})\\. ([^\\n]+)`, 'gm');
      return text.replace(regex, `- $1. $2 ❌ (Your answer - Incorrect)`);
    })
    
    // Process the specific format from the user query
    .replace(/(Which|What|How|Why|When|Where|Who).*?\?(?:\s*Options:)?\s*\n+/g, (match) => {
      // Make sure there's a double newline after the question
      return match.trim() + '\n\n';
    })
    
    // Ensure options are on separate lines
    .replace(/(?<=[A-D]\.)\s+(?=[A-D]\.)/g, '\n')
    
    // Trim extra whitespace at start/end
    .trim();
};