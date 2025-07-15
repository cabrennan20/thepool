const express = require('express');
const { authenticateToken } = require('./auth');
const router = express.Router();

// GET /api/admin-messages - Get all admin messages
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await req.db.query(
      `SELECT 
        am.message_id,
        am.title,
        am.content,
        am.created_at,
        am.updated_at,
        am.is_pinned,
        am.send_email,
        u.username as author_username,
        u.first_name as author_first_name,
        u.last_name as author_last_name
      FROM admin_messages am
      LEFT JOIN users u ON am.author_id = u.user_id
      ORDER BY am.is_pinned DESC, am.created_at DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    // Get total count
    const countResult = await req.db.query(
      'SELECT COUNT(*) as total FROM admin_messages'
    );

    res.json({
      messages: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit,
      offset
    });

  } catch (error) {
    console.error('Get admin messages error:', error);
    res.status(500).json({ error: 'Failed to fetch admin messages' });
  }
});

// POST /api/admin-messages - Create new admin message (admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, content, is_pinned = false, send_email = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await req.db.query(
      `INSERT INTO admin_messages (title, content, author_id, is_pinned, send_email, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING message_id, title, content, created_at, updated_at, is_pinned, send_email`,
      [title, content, req.user.userId, is_pinned, send_email]
    );

    const newMessage = result.rows[0];

    // TODO: If send_email is true, integrate with email notification system
    if (send_email) {
      console.log(`Email notification requested for message: ${newMessage.title}`);
      // This would integrate with your existing email system
    }

    res.status(201).json({
      message: 'Admin message created successfully',
      data: newMessage
    });

  } catch (error) {
    console.error('Create admin message error:', error);
    res.status(500).json({ error: 'Failed to create admin message' });
  }
});

// PUT /api/admin-messages/:messageId - Update admin message (admin only)
router.put('/:messageId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const messageId = parseInt(req.params.messageId);
    const { title, content, is_pinned, send_email } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await req.db.query(
      `UPDATE admin_messages 
       SET title = $1, content = $2, is_pinned = $3, send_email = $4, updated_at = NOW()
       WHERE message_id = $5
       RETURNING message_id, title, content, created_at, updated_at, is_pinned, send_email`,
      [title, content, is_pinned, send_email, messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin message not found' });
    }

    res.json({
      message: 'Admin message updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update admin message error:', error);
    res.status(500).json({ error: 'Failed to update admin message' });
  }
});

// DELETE /api/admin-messages/:messageId - Delete admin message (admin only)
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const messageId = parseInt(req.params.messageId);

    const result = await req.db.query(
      'DELETE FROM admin_messages WHERE message_id = $1 RETURNING message_id',
      [messageId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin message not found' });
    }

    res.json({
      message: 'Admin message deleted successfully'
    });

  } catch (error) {
    console.error('Delete admin message error:', error);
    res.status(500).json({ error: 'Failed to delete admin message' });
  }
});

module.exports = router;