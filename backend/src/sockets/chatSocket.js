const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middlewares/auth');
const notificationService = require('../services/notificationService');

function initSocket(io) {
  notificationService.setIo(io);

  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    
    if (!token) {
      return next(new Error('Authentication token required'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error('Invalid token'));
      }
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    console.log(`Socket client connected: ${socket.id} (User: ${socket.user.id})`);

    // Join user specific room for direct alerts routing
    socket.join(`user:${socket.user.id}`);

    // Join admin channel if user is admin
    if (socket.user.role === 'ADMIN') {
      socket.join('admins');
      console.log(`Admin joined admins channel: ${socket.user.id}`);
    }

    socket.on('disconnect', () => {
      console.log(`Socket client disconnected: ${socket.id}`);
    });
  });
}

module.exports = {
  initSocket
};
