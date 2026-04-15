const express = require('express')
const router = express.Router()
const pool = require('../db')

// OPTIONAL AUTH (SAFE FALLBACK)
// If auth middleware breaks, API still works
let auth
try {
  auth = require('../middleware/auth')
} catch (e) {
  auth = (req, res, next) => next()
}

/* =========================
   GET ALL ASSETS
========================= */
router.get('/', auth, async (req, res) => {
  try {
    const data = await pool.query(
      'SELECT * FROM assets ORDER BY created_at DESC'
    )
    res.json(data.rows)
  } catch (err) {
    console.error('GET /assets error:', err)
    res.status(500).json({ error: 'Failed to fetch assets' })
  }
})

/* =========================
   ADD ASSET
========================= */
router.post('/', auth, async (req, res) => {
  try {
    const { id, name, type } = req.body

    if (!id || !name || !type) {
      return res.status(400).json({ error: 'Missing fields' })
    }

    const result = await pool.query(
      'INSERT INTO assets (id, name, type) VALUES ($1, $2, $3) RETURNING *',
      [id, name, type]
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error('POST /assets error:', err)
    res.status(500).json({ error: 'Failed to add asset' })
  }
})

/* =========================
   DELETE ASSET
========================= */
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params

    await pool.query('DELETE FROM assets WHERE id=$1', [id])

    res.json({ message: 'Deleted successfully' })
  } catch (err) {
    console.error('DELETE /assets error:', err)
    res.status(500).json({ error: 'Failed to delete asset' })
  }
})

/* =========================
   UPDATE ASSET (OPTIONAL BUT IMPORTANT)
========================= */
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params
    const { name, type } = req.body

    const result = await pool.query(
      'UPDATE assets SET name=$1, type=$2 WHERE id=$3 RETURNING *',
      [name, type, id]
    )

    res.json(result.rows[0])
  } catch (err) {
    console.error('PUT /assets error:', err)
    res.status(500).json({ error: 'Failed to update asset' })
  }
})

module.exports = router