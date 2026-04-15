const jwt = require('jsonwebtoken')

const SECRET = 'kseb_secret_key'

module.exports = (req, res, next) => {
  const token = req.header('Authorization')

  if (!token) return res.status(401).send('Access denied')

  try {
    const verified = jwt.verify(token, SECRET)
    req.user = verified
    next()
  } catch {
    res.status(400).send('Invalid token')
  }
}