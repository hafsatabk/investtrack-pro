import express from 'express';
import { dbGet, dbRun, dbAll } from '../db/init.js';
import { requireRole } from '../middleware/auth.js';
import { logActivity } from './activity.js';
import { createObjectCsvWriter } from 'csv-writer';
import ExcelJS from 'xlsx';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Get all settings
router.get('/', async (req, res) => {
  try {
    const settings = await dbAll('SELECT * FROM settings');
    const result = {};
    settings.forEach(setting => {
      result[setting.key] = setting.value;
    });
    res.json(result);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update setting
router.patch('/:key', requireRole('admin'), async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (!value) {
      return res.status(400).json({ error: 'Value required' });
    }

    const oldSetting = await dbGet('SELECT value FROM settings WHERE key = ?', [key]);

    if (!oldSetting) {
      await dbRun('INSERT INTO settings (key, value) VALUES (?, ?)', [key, value]);
    } else {
      await dbRun('UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [value, key]);
    }

    await logActivity(req.user.id, 'UPDATE', 'setting', null, oldSetting?.value, value);

    res.json({ message: 'Setting updated successfully' });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export members to CSV
router.get('/export/csv', requireRole('admin', 'data_entry'), async (req, res) => {
  try {
    const members = await dbAll('SELECT * FROM members ORDER BY date_joined DESC');

    if (members.length === 0) {
      return res.status(400).json({ error: 'No members to export' });
    }

    const headers = [
      { id: 'member_id', title: 'Member ID' },
      { id: 'full_name', title: 'Full Name' },
      { id: 'rank_position', title: 'Rank/Position' },
      { id: 'phone_number', title: 'Phone' },
      { id: 'email', title: 'Email' },
      { id: 'amount_invested', title: 'Amount Invested' },
      { id: 'number_of_shares', title: 'Shares' },
      { id: 'date_joined', title: 'Date Joined' },
      { id: 'last_payment_date', title: 'Last Payment' },
      { id: 'status', title: 'Status' }
    ];

    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const filename = `members_${Date.now()}.csv`;
    const filepath = path.join(exportsDir, filename);

    const writer = createObjectCsvWriter({
      path: filepath,
      header: headers
    });

    await writer.writeRecords(members);

    res.download(filepath, filename, () => {
      fs.unlinkSync(filepath);
    });

    await logActivity(req.user.id, 'EXPORT', 'members', null, null, 'CSV');
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export members to Excel
router.get('/export/excel', requireRole('admin', 'data_entry'), async (req, res) => {
  try {
    const members = await dbAll('SELECT * FROM members ORDER BY date_joined DESC');

    if (members.length === 0) {
      return res.status(400).json({ error: 'No members to export' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Members');

    worksheet.columns = [
      { header: 'Member ID', key: 'member_id', width: 15 },
      { header: 'Full Name', key: 'full_name', width: 20 },
      { header: 'Rank/Position', key: 'rank_position', width: 15 },
      { header: 'Phone', key: 'phone_number', width: 15 },
      { header: 'Email', key: 'email', width: 20 },
      { header: 'Amount Invested', key: 'amount_invested', width: 15 },
      { header: 'Shares', key: 'number_of_shares', width: 10 },
      { header: 'Date Joined', key: 'date_joined', width: 15 },
      { header: 'Last Payment', key: 'last_payment_date', width: 15 },
      { header: 'Status', key: 'status', width: 10 }
    ];

    worksheet.addRows(members);

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const filename = `members_${Date.now()}.xlsx`;
    const filepath = path.join(exportsDir, filename);

    await workbook.xlsx.writeFile(filepath);

    res.download(filepath, filename, () => {
      fs.unlinkSync(filepath);
    });

    await logActivity(req.user.id, 'EXPORT', 'members', null, null, 'Excel');
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export members to PDF
router.get('/export/pdf', requireRole('admin', 'data_entry'), async (req, res) => {
  try {
    const members = await dbAll('SELECT * FROM members ORDER BY date_joined DESC');
    const summary = await dbAll(`
      SELECT 
        COUNT(*) as total_members,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_members,
        COALESCE(SUM(amount_invested), 0) as total_invested,
        COALESCE(SUM(number_of_shares), 0) as total_shares
      FROM members
    `);

    if (members.length === 0) {
      return res.status(400).json({ error: 'No members to export' });
    }

    const doc = new PDFDocument();
    const exportsDir = path.join(__dirname, '../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const filename = `members_report_${Date.now()}.pdf`;
    const filepath = path.join(exportsDir, filename);

    doc.pipe(fs.createWriteStream(filepath));

    // Title
    doc.fontSize(24).font('Helvetica-Bold').text('Member Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown();

    // Summary section
    const sumData = summary[0];
    doc.fontSize(12).font('Helvetica-Bold').text('Summary', { underline: true });
    doc.fontSize(10).font('Helvetica');
    doc.text(`Total Members: ${sumData.total_members}`);
    doc.text(`Active Members: ${sumData.active_members}`);
    doc.text(`Total Invested: ${sumData.total_invested.toFixed(2)}`);
    doc.text(`Total Shares: ${sumData.total_shares}`);
    doc.moveDown();

    // Members table
    doc.fontSize(12).font('Helvetica-Bold').text('Members List', { underline: true });
    doc.moveDown(0.5);

    const tableTop = doc.y;
    const col1 = 50;
    const col2 = 120;
    const col3 = 200;
    const col4 = 280;
    const col5 = 370;
    const col6 = 450;
    const rowHeight = 20;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('ID', col1, tableTop);
    doc.text('Name', col2, tableTop);
    doc.text('Rank', col3, tableTop);
    doc.text('Phone', col4, tableTop);
    doc.text('Invested', col5, tableTop);
    doc.text('Status', col6, tableTop);

    doc.font('Helvetica').fontSize(8);
    let y = tableTop + rowHeight;

    for (const member of members.slice(0, 30)) {
      doc.text(member.member_id, col1, y);
      doc.text(member.full_name, col2, y);
      doc.text(member.rank_position, col3, y);
      doc.text(member.phone_number, col4, y);
      doc.text(member.amount_invested.toFixed(2), col5, y);
      doc.text(member.status, col6, y);
      y += rowHeight;
    }

    if (members.length > 30) {
      doc.fontSize(8).text(`... and ${members.length - 30} more members`);
    }

    doc.end();

    doc.on('finish', () => {
      res.download(filepath, filename, () => {
        fs.unlinkSync(filepath);
      });
    });

    await logActivity(req.user.id, 'EXPORT', 'members', null, null, 'PDF');
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;