import express from 'express';
import { dbGet, dbRun, dbAll } from '../db/init.js';
import { requireRole } from '../middleware/auth.js';
import { logActivity } from './activity.js';

const router = express.Router();

// Generate unique member ID
async function generateMemberId() {
  const lastMember = await dbGet(
    'SELECT member_id FROM members ORDER BY id DESC LIMIT 1'
  );

  if (!lastMember) {
    return 'MEM001';
  }

  const lastNum = parseInt(lastMember.member_id.substring(3)) + 1;
  return 'MEM' + String(lastNum).padStart(3, '0');
}

// Get all members
router.get('/', async (req, res) => {
  try {
    const { search, rank, status, startDate, endDate, minInvestment, maxInvestment, page = 1, limit = 10 } = req.query;

    let sql = 'SELECT * FROM members WHERE 1=1';
    const params = [];

    if (search) {
      sql += ' AND (full_name LIKE ? OR member_id LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (rank) {
      sql += ' AND rank = ?';
      params.push(rank);
    }

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (startDate) {
      sql += ' AND date_joined >= ?';
      params.push(startDate);
    }

    if (endDate) {
      sql += ' AND date_joined <= ?';
      params.push(endDate);
    }

    if (minInvestment) {
      sql += ' AND amount_invested >= ?';
      params.push(parseFloat(minInvestment));
    }

    if (maxInvestment) {
      sql += ' AND amount_invested <= ?';
      params.push(parseFloat(maxInvestment));
    }

    sql += ' ORDER BY date_joined DESC';
    
    const offset = (parseInt(page) - 1) * parseInt(limit);
    sql += ` LIMIT ${limit} OFFSET ${offset}`;

    const members = await dbAll(sql, params);
    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single member
router.get('/:id', async (req, res) => {
  try {
    const member = await dbGet('SELECT * FROM members WHERE id = ?', [req.params.id]);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(member);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create member
router.post('/', requireRole('admin', 'data_entry'), async (req, res) => {
  try {
    const {
      full_name,
      rank,
      phone,
      email,
      amount_invested,
      number_of_shares,
      date_joined,
      last_payment_date,
      status
    } = req.body;

    if (!full_name || !rank || !phone || !date_joined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const memberId = await generateMemberId();

    await dbRun(
      `INSERT INTO members (
        member_id, full_name, rank, phone, email,
        amount_invested, number_of_shares, date_joined, last_payment_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        memberId,
        full_name,
        rank,
        phone,
        email || null,
        amount_invested || 0,
        number_of_shares || 0,
        date_joined,
        last_payment_date || null,
        status || 'active'
      ]
    );

    await logActivity(req.user.id, 'create', 'member', null, null, JSON.stringify(req.body));

    res.status(201).json({
      message: 'Member created successfully',
      member_id: memberId
    });
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update member
router.put('/:id', requireRole('admin', 'data_entry'), async (req, res) => {
  try {
    const { id } = req.params;

    const existingMember = await dbGet('SELECT * FROM members WHERE id = ?', [id]);

    if (!existingMember) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const oldValues = { ...existingMember };

    const updates = [];
    const params = [];

    const fields = [
      'full_name', 'rank', 'phone', 'email',
      'amount_invested', 'number_of_shares', 'date_joined', 'last_payment_date', 'status'
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const sql = `UPDATE members SET ${updates.join(', ')} WHERE id = ?`;
    await dbRun(sql, params);

    await logActivity(req.user.id, 'update', 'member', id, JSON.stringify(oldValues), JSON.stringify(req.body));

    res.json({ message: 'Member updated successfully' });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete member
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const member = await dbGet('SELECT * FROM members WHERE id = ?', [id]);

    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    await dbRun('DELETE FROM members WHERE id = ?', [id]);

    await logActivity(req.user.id, 'delete', 'member', id, JSON.stringify(member), null);

    res.json({ message: 'Member deleted successfully' });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get distinct ranks
router.get('/distinct/ranks', async (req, res) => {
  try {
    const ranks = await dbAll('SELECT DISTINCT rank FROM members ORDER BY rank');
    res.json(ranks);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;