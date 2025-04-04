const fetch = require('node-fetch');

async function testDeleteAllChats() {
  try {
    const token = '';
    
    console.log('Testing DELETE /api/chat-history/all endpoint...');
    
    const response = await fetch('http://localhost:3001/api/chat-history/all', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    console.log('Response status:', response.status);
    console.log('Response data:', data);
    
  } catch (error) {
    console.error('Error testing endpoint:', error);
  }
}

testDeleteAllChats(); 