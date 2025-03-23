import { normalizeMarkdownText } from './markdown';

// Sample quiz question with bold formatting and options
const quizWithBoldOptions = `Which data structure is best suited for storing unique, unordered elements? Options: **- A. ** List

**- B. ** Tuple

**- C. ** Set ✓ (Correct answer)

**- D. ** Dictionary

Your Answer: A ❌ Wrong`;

// Sample quiz question with normal formatting
const quizWithNormalOptions = `What is the purpose of the __init__ method in a Python class? Options: A. To destroy an object
B. To initialize an object's attributes ✅ 👉 C. To define the class's name
D. To call the parent class's methods
Your Answer: C ❌ Wrong
Correct answer was B`;

// Sample quiz question with no spacing
const quizWithNoSpacing = `How do you declare a constant in JavaScript? A. const myVar = 10 ✓ B. let myVar = 10 C. var myVar = 10 D. constant myVar = 10`;

// Sample quiz question with different parenthesis format
const quizWithParenthesis = `When was Python first released? 
A) 1991 ✓
B) 1995
C) 2000 
D) 2005
Your Answer: C ❌`;

// Sample quiz with different format for correct/incorrect answers
const quizWithDifferentAnswerFormat = `What command is used to create a new Git repository?
- A. git init (Correct answer)
- B. git start
- C. git create
- D. git new (Your answer - Incorrect)`;

// Test the normalizeMarkdownText function
console.log('Original Quiz 1:');
console.log(quizWithBoldOptions);
console.log('\nNormalized Quiz 1:');
console.log(normalizeMarkdownText(quizWithBoldOptions));

console.log('\n\nOriginal Quiz 2:');
console.log(quizWithNormalOptions);
console.log('\nNormalized Quiz 2:');
console.log(normalizeMarkdownText(quizWithNormalOptions));

console.log('\n\nOriginal Quiz 3:');
console.log(quizWithNoSpacing);
console.log('\nNormalized Quiz 3:');
console.log(normalizeMarkdownText(quizWithNoSpacing));

console.log('\n\nOriginal Quiz 4:');
console.log(quizWithParenthesis);
console.log('\nNormalized Quiz 4:');
console.log(normalizeMarkdownText(quizWithParenthesis));

console.log('\n\nOriginal Quiz 5:');
console.log(quizWithDifferentAnswerFormat);
console.log('\nNormalized Quiz 5:');
console.log(normalizeMarkdownText(quizWithDifferentAnswerFormat));

// Export a dummy component for TypeScript
export const TestMarkdown = () => <div>Test</div>; 