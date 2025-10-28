import { verifySocketToken } from '../middlewares/auth.middleware.js';
import User from '../models/User.model.js';
import Message from '../models/Message.model.js';

const initializeSocket = (io) => {
  // Middleware to authenticate socket connections
  io.use(verifySocketToken);

  io.on('connection', async (socket) => {
    try {
      // Mark user as online
      await User.findByIdAndUpdate(socket.userId, {
        online: true,
        lastSeen: new Date()
      });

      // Join user's personal room
      socket.join(socket.userId);

      // Broadcast user's online status
      io.emit('user:online', { userId: socket.userId });

      // Handle message sending
      socket.on('message:send', async ({ chatId, to, text, messageId }) => {
        try {
          // Check if recipient has blocked the sender
          const recipient = await User.findById(to).select('blockedUsers chatList');
          if (recipient && recipient.blockedUsers.map(String).includes(String(socket.userId))) {
            socket.emit('error', { message: 'Unable to deliver message: recipient has blocked you' });
            return;
          }

          let message;
          if (messageId) {
            // If messageId is provided, find the existing message
            message = await Message.findById(messageId);
          } else {
            // Create new message if no messageId
            message = new Message({
              chatId,
              senderId: socket.userId,
              receiverId: to,
              text,
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
            });
            await message.save();

            // Update chat lists for both users
            const [sender, receiverUpdate] = await Promise.all([
              User.findById(socket.userId),
              User.findById(to)
            ]);

            // Add users to each other's chat lists if not already there
            if (!sender.chatList.includes(to)) {
              sender.chatList.push(to);
              await sender.save();
            }
            if (!receiverUpdate.chatList.includes(socket.userId)) {
              receiverUpdate.chatList.push(socket.userId);
              await receiverUpdate.save();
            }
          }

          // Populate sender information
          await message.populate('senderId', 'username avatar');
          
          // Send to recipient immediately
          io.to(to).emit('message:receive', message);
          
          // Send acknowledgment to sender immediately
          socket.emit('message:sent', message);
          
          // Broadcast to all clients in the chat room
          io.to(chatId).emit('message:new', message);

          // Set timeout to emit message:removed event when message expires
          setTimeout(() => {
            io.to(to).emit('message:removed', { messageId: message._id });
            io.to(socket.userId).emit('message:removed', { messageId: message._id });
          }, 60 * 60 * 1000); // 1 hour

        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing:start', ({ chatId, to }) => {
        socket.to(to).emit('typing:start', {
          chatId,
          userId: socket.userId
        });
      });

      socket.on('typing:stop', ({ chatId, to }) => {
        socket.to(to).emit('typing:stop', {
          chatId,
          userId: socket.userId
        });
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        try {
          await User.findByIdAndUpdate(socket.userId, {
            online: false,
            lastSeen: new Date()
          });

          io.emit('user:offline', {
            userId: socket.userId,
            lastSeen: new Date()
          });
        } catch (error) {
          console.error('Disconnect error:', error);
        }
      });

    } catch (error) {
      console.error('Socket connection error:', error);
      socket.disconnect(true);
    }
  });
};

export default initializeSocket;