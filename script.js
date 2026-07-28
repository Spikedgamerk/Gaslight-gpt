const chatBox = document.getElementById('chatBox');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const resetBtn = document.getElementById('resetBtn');
const foolSpan = document.getElementById('foolCount');
const defenseSpan = document.getElementById('defenseCount');

// --- AUTO-DETECT API URL ---
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000' 
  : window.location.origin;

console.log('📡 API URL:', API_URL); // Check what this logs

// --- SEND MESSAGE ---
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Display user message
  addMessage('user', message);
  userInput.value = '';
  
  // Disable button while loading
  sendBtn.disabled = true;
  sendBtn.textContent = '...';

  try {
    const response = await fetch(`${API_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userMessage: message })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Add AI reply with a typewriter effect
    addMessage('bot', data.reply, true);

    // Update the Gaslight Scoreboard
    foolSpan.textContent = data.score;
    defenseSpan.textContent = data.defenses;

  } catch (error) {
    console.error('❌ Fetch error:', error);
    addMessage('bot', '❌ I refuse to connect. Your internet is wrong.');
  }

  sendBtn.disabled = false;
  sendBtn.textContent = 'Send';
}

// --- RESET CHAT ---
async function resetChat() {
  try {
    const response = await fetch(`${API_URL}/reset`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Clear the chat box
    chatBox.innerHTML = '';
    
    // Add a reset message
    const resetMsg = document.createElement('div');
    resetMsg.className = 'message bot';
    resetMsg.textContent = '🔄 Memory wiped... or is it? Ask me something new.';
    chatBox.appendChild(resetMsg);
    
    // Reset scores
    foolSpan.textContent = '0';
    defenseSpan.textContent = '0';
    
    console.log('Chat reset:', data.message);
    
  } catch (error) {
    console.error('Reset failed:', error);
    addMessage('bot', '❌ Can\'t reset. Your memory is broken, not mine.');
  }
}

// --- ADD MESSAGE (with Typewriter Effect) ---
function addMessage(type, text, typewriter = false) {
  const div = document.createElement('div');
  div.className = `message ${type}`;

  if (typewriter) {
    div.textContent = '';
    chatBox.appendChild(div);
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        div.textContent += text[i];
        i++;
        chatBox.scrollTop = chatBox.scrollHeight;
      } else {
        clearInterval(interval);
      }
    }, 25);
  } else {
    div.textContent = text;
    chatBox.appendChild(div);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// --- EVENT LISTENERS ---
sendBtn.addEventListener('click', sendMessage);
resetBtn.addEventListener('click', resetChat);
userInput.addEventListener('keypress', (e) => { 
  if (e.key === 'Enter') sendMessage(); 
});
