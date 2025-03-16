/**
 * Normalizes text by cleaning up markdown content
 * - Replaces <br> tags with newlines
 * - Normalizes excessive spaces and line breaks
 * - Ensures proper spacing around headers
 */
export const normalizeMarkdownText = (text: string): string => {
  return text
    .replace(/<br\s*\/?>/gi, '\n') // Replace <br> tags with newlines
    .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace triple+ line breaks with double
    .replace(/\s{3,}/g, ' ') // Replace excessive spaces with single space
    .replace(/## /g, '\n## ') // Ensure headers have space before them
    .replace(/\n\n\n+/g, '\n\n') // Normalize multiple consecutive line breaks
    .trim();
}; 