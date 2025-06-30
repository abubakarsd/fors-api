// routes/chatRoutes.js
const express = require('express');
const router = express.Router();
const supabase = require('../config/supabaseClient');
const { authenticateToken } = require('../middleware/authMiddleware'); // All users can chat

// @route GET /api/chats/:receiverId
// @desc Get chat messages between the authenticated user and a specific receiver
// @access Private (Authenticated Users)
router.get('/:receiverId', authenticateToken, async (req, res) => {
    const { receiverId } = req.params;
    const senderId = req.user.userId; // Authenticated user's ID

    try {
        // Fetch messages where:
        // (sender is me AND receiver is them) OR (sender is them AND receiver is me)
        const { data: chats, error } = await supabase
            .from('chats')
            .select(`
                id,
                message,
                timestamp,
                sender:users!sender_id(
                    id,
                    full_name
                ),
                receiver:users!receiver_id(
                    id,
                    full_name
                )
            `)
            .or(`and(sender_id.eq.${senderId},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${senderId})`)
            .order('timestamp', { ascending: true }); // Order chronologically

        if (error) throw error;
        res.status(200).json(chats);
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

// @route POST /api/chats
// @desc Send a new chat message
// @access Private (Authenticated Users)
router.post('/', authenticateToken, async (req, res) => {
    const { receiverId, message } = req.body;
    const senderId = req.user.userId; // Authenticated user's ID

    if (!receiverId || !message) {
        return res.status(400).json({ message: 'Receiver ID and message are required.' });
    }

    // Optional: Prevent sending messages to self, though the database schema allows it.
    if (senderId === receiverId) {
        return res.status(400).json({ message: 'Cannot send message to yourself.' });
    }

    try {
        // Verify receiver exists
        const { data: receiverUser, error: receiverError } = await supabase
            .from('users')
            .select('id')
            .eq('id', receiverId)
            .single();

        if (receiverError || !receiverUser) {
            return res.status(404).json({ message: 'Receiver user not found.' });
        }

        const { data: newChat, error } = await supabase
            .from('chats')
            .insert({
                sender_id: senderId,
                receiver_id: receiverId,
                message: message
            })
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Message sent successfully.', chat: newChat });
    } catch (error) {
        console.error('Error sending chat message:', error);
        res.status(500).json({ message: 'Server error.', error: error.message });
    }
});

module.exports = router;