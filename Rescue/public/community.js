const socket = io();
const messageInput = document.getElementById('message-input');
const chatBox = document.getElementById('chat-box');
const typingIndicator = document.getElementById('typing-indicator');

function sendMessage() {
  const message = messageInput.value;
  if (message) {
    socket.emit('chat message', message);
    messageInput.value = '';
    stopTyping();
  }
}

socket.on('chat message', (msg) => {
  const messageElement = document.createElement('p');
  messageElement.textContent = msg;
  chatBox.appendChild(messageElement);
});

function notifyTyping() {
  socket.emit('typing', 'User');
}

function stopTyping() {
  socket.emit('stop typing', 'User');
}

socket.on('typing', (user) => {
  typingIndicator.textContent = `${user} is typing...`;
});

socket.on('stop typing', () => {
  typingIndicator.textContent = '';
});
