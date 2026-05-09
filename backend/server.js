require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static uploads folder
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

// Make Socket.io accessible in routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.log('❌ MongoDB Connection Error: ', err));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));

app.get('/', (req, res) => {
  res.send('Smart Task Manager API is running!');
});

// Real-time connection setup
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // You can listen to custom events here, e.g., task updates
  socket.on('join_workspace', (data) => {
    socket.join(data.workspaceId);
    console.log(`User ${socket.id} joined workspace ${data.workspaceId}`);
  });

  // Chat implementation
  socket.on('send_message', async (data) => {
    try {
      const Message = require('./models/Message');
      const newMessage = new Message({
        sender: data.senderId,
        recipient: data.isGroup ? null : data.recipientId,
        content: data.content,
        isGroup: data.isGroup
      });
      await newMessage.save();
      
      const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'name avatar');
      
      if (data.isGroup) {
        io.emit('receive_message', populatedMessage);
      } else {
        // Send to specific recipient and back to sender
        io.emit(`receive_private_${data.recipientId}`, populatedMessage);
        io.emit(`receive_private_${data.senderId}`, populatedMessage);
      }
    } catch (err) {
      console.error('Socket Chat Error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Export the app (useful for testing or serverless)
module.exports = app;

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
