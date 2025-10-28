import User from '../models/User.model.js';

export const getAllUsers = async (req, res) => {
  try {
    // Get all users except the current user
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password')
      .sort('-online -lastSeen');

    res.json(users);
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { status, avatar } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (status) updateData.status = status;
    if (avatar) updateData.avatar = avatar;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      error: 'Server error',
      details: error.message
    });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ error: 'User not found' });

    if (!me.blockedUsers.map(String).includes(String(userId))) {
      me.blockedUsers.push(userId);
      await me.save();
    }

    res.json({ message: 'User blocked' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ error: 'User not found' });

    me.blockedUsers = me.blockedUsers.filter(id => String(id) !== String(userId));
    await me.save();

    res.json({ message: 'User unblocked' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const followUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const [me, userToFollow] = await Promise.all([
      User.findById(req.user._id),
      User.findById(userId)
    ]);

    if (!me || !userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if already following
    if (!me.following.includes(userId)) {
      me.following.push(userId);
      userToFollow.followers.push(req.user._id);
      await Promise.all([me.save(), userToFollow.save()]);
    }

    res.json({ message: 'User followed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const [me, userToUnfollow] = await Promise.all([
      User.findById(req.user._id),
      User.findById(userId)
    ]);

    if (!me || !userToUnfollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    me.following = me.following.filter(id => String(id) !== String(userId));
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => String(id) !== String(req.user._id)
    );

    await Promise.all([me.save(), userToUnfollow.save()]);
    res.json({ message: 'User unfollowed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const getChatList = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('chatList', '-password')
      .select('chatList');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.chatList);
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

export const setNickname = async (req, res) => {
  try {
    const { userId, nickname } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const me = await User.findById(req.user._id);
    if (!me) return res.status(404).json({ error: 'User not found' });

    const existing = me.nicknames.find(n => String(n.target) === String(userId));
    if (existing) {
      existing.nickname = nickname;
    } else {
      me.nicknames.push({ target: userId, nickname });
    }

    await me.save();
    res.json({ message: 'Nickname saved' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};