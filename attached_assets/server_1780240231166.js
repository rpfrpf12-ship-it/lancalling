const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

io.on('connection', (socket) => {
  console.log('✅ Device connected');
  
  socket.on('register-device', (data) => {
    console.log('📱 Device registered:', data.name);
    socket.broadcast.emit('device-online', data);
  });
  
  socket.on('private-message', (data) => {
    console.log('💬 Message from:', data.from);
    socket.broadcast.emit('private-message', data);
  });
  
  socket.on('call-offer', (data) => {
    console.log('📞 Call offer');
    socket.broadcast.emit('call-offer', data);
  });
  
  socket.on('call-answer', (data) => {
    console.log('📞 Call answer');
    socket.broadcast.emit('call-answer', data);
  });
});

const PORT = 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LAN Server running on port ${PORT}`);
});