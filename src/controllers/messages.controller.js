import Message from '../models/Message.model.js';
import User from '../models/User.model.js';

export const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const now = new Date();

    // If the current user has blocked the other participant, return empty
    const parts = chatId.split('-');
    const otherId = parts.find(p => p !== String(req.user._id));
    if (otherId) {
      const me = await User.findById(req.user._id).select('blockedUsers');
      if (me && me.blockedUsers.map(String).includes(String(otherId))) {
        return res.json([]);
      }
    }

    // Get messages that haven't expired yet
    const messages = await Message.find({
      chatId,
      expiresAt: { $gt: now }
    })
      .populate('senderId', 'username avatar')
      .populate('receiverId', 'username avatar')
      .sort('createdAt');

    res.json(messages);
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, to } = req.body;
    const senderId = req.user._id;

    // Check if recipient has blocked the sender
    const recipient = await User.findById(to).select('blockedUsers');
    if (recipient && recipient.blockedUsers.map(String).includes(String(senderId))) {
      return res.status(403).json({ error: 'You cannot send messages to this user' });
    }

    // Generate chatId
    const chatId = Message.generateChatId(senderId, to);

    // Create and save message
    const message = new Message({
      chatId,
      senderId,
      receiverId: to,
      text,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now
    });

    await message.save();

    // Populate sender information
    await message.populate('senderId', 'username avatar');
    await message.populate('receiverId', 'username avatar');

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

export const cleanupMessages = async (req, res) => {
  try {
    const now = new Date();
    
    // Delete expired messages
    const result = await Message.deleteMany({
      expiresAt: { $lte: now }
    });

    res.json({
      message: 'Cleanup completed',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};