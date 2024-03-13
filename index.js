// server.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Store active chat groups
const activeGroups = {};

// Generate a random group ID
function generateGroupId() {
  return Math.random().toString(36).substr(2, 9);
}

// HTTP endpoint to create a group
app.post('/createGroup', (req, res) => {
  const groupId = generateGroupId();
  const groupName = req.body.groupName;
  activeGroups[groupId] = { name: groupName, users: [] };
  res.json({ groupId });
});

// API endpoint to list sent messages along with sender name in the chat group
app.get('/group/:groupId/messages', (req, res) => {
    const groupId = req.params.groupId;
    if (activeGroups[groupId]) {
      res.json(activeGroups[groupId].messages || []);
    } else {
      res.status(404).json({ error: 'Group not found' });
    }
  });

io.on('connection', (socket) => {
  console.log('A user connected');

  // Join a chat group
  socket.on('joinGroup', (groupId) => {
    if (activeGroups[groupId]) {
      activeGroups[groupId].users.push(socket.id);
      socket.join(groupId);
    }
  });

  // Broadcast message to a specific chat group
  socket.on('sendMessage', (data) => {
    const { groupId, message } = data;
    if (activeGroups[groupId]) {
      io.to(groupId).emit('messageReceived', message);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});
