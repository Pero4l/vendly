const { Notification } = require('../models');

let ioInstance = null;

/**
 * Attaches the Socket.IO instance to the service.
 */
function setIo(io) {
  ioInstance = io;
}

/**
 * Creates a notification in the DB and broadcasts it via WebSocket if connected.
 */
async function notifyUser(userId, title, message, type = 'info') {
  try {
    const notif = await Notification.create({
      userId,
      title,
      message,
      type
    });

    if (ioInstance) {
      // Emit to user specific room
      ioInstance.to(`user:${userId}`).emit('notification', {
        id: notif.id,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        read: notif.read,
        createdAt: notif.createdAt
      });
    }

    return notif;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

module.exports = {
  setIo,
  notifyUser
};
