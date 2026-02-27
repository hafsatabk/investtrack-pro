import express from 'express';
import { dbRun, dbAll } from '../db/init.js';
import { requireRole } from '../middleware/auth.js';

const router = express.Router();

export async function logActivity(userId, action, entityType, entityId, oldValues, newValues) {
  try {
    await dbRun(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, action, entityType, entityId, oldValues, newValues]
    );
  } catch (error) {
    console.error('Activity logging error:', error);
  }
}

// Get activity logs
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const logs = await dbAll(`
      SELECT 
        al.id,
        al.action,
        al.entity_type,
        al.entity_id,
        al.old_values,
        al.new_values,
        al.created_at,
        u.full_name as user_name,
        'Member' as entity_name
      FROM activity_logs al
      JOIN users u ON al.user_id = u.id
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [parseInt(limit), offset]);

    res.json({ logs });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;