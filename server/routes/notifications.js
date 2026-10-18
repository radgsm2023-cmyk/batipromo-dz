const express = require('express');
const router = express.Router();
const { db } = require('../db');

// List notifications (optionally filtered by user_id or unread_only)
router.get('/', (req, res) => {
  try {
    const { unread_only, user_id, limit = 50 } = req.query;

    let query = `
      SELECT n.*, u.name as user_name
      FROM notifications n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (user_id) {
      query += ` AND (n.user_id = ? OR n.user_id IS NULL)`;
      params.push(user_id);
    }

    if (unread_only === 'true' || unread_only === '1') {
      query += ` AND n.is_read = 0`;
    }

    query += ` ORDER BY n.created_at DESC, n.id DESC LIMIT ?`;
    params.push(Number(limit) || 50);

    const notifications = db.prepare(query).all(...params);

    const unreadCountRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE is_read = 0 ${user_id ? 'AND (user_id = ? OR user_id IS NULL)' : ''}
    `).get(...(user_id ? [user_id] : []));

    res.json({
      notifications,
      unread_count: unreadCountRow ? unreadCountRow.count : 0
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark single notification as read
router.put('/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    res.json({ success: true, message: 'Notification marquée comme lue' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', (req, res) => {
  try {
    const { user_id } = req.body;
    if (user_id) {
      db.prepare('UPDATE notifications SET is_read = 1 WHERE (user_id = ? OR user_id IS NULL)').run(user_id);
    } else {
      db.prepare('UPDATE notifications SET is_read = 1').run();
    }
    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a notification
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM notifications WHERE id = ?').run(id);
    res.json({ success: true, message: 'Notification supprimée' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
