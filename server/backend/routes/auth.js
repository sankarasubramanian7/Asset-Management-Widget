const express = require('express')
const router = express.Router()
const pool = require('../db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const SECRET = 'kseb_secret_key'

/* =========================
   REGISTER
========================= */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body

    const hashed = await bcrypt.hash(password, 10)

    const user = await pool.query(
      'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *',
      [username, hashed]
    )

    res.json(user.rows[0])
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

/* =========================
   LOGIN (FIXED + CLEAN)
========================= */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    const user = await pool.query(
      'SELECT * FROM users WHERE username=$1',
      [username]
    )

    // USER NOT FOUND
    if (user.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' })
    }

    const dbUser = user.rows[0]

    // PASSWORD CHECK
    const match = await bcrypt.compare(password, dbUser.password)

    if (!match) {
      return res.status(400).json({ error: 'Invalid password' })
    }

    // TOKEN GENERATION
    const token = jwt.sign(
      {
        id: dbUser.id,
        role: dbUser.role,
        username: dbUser.username
      },
      SECRET,
      { expiresIn: '1d' }
    )

    // FINAL RESPONSE (IMPORTANT FOR YOUR WIDGET)
    res.json({
      token,
      role: dbUser.role,
      username: dbUser.username
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router