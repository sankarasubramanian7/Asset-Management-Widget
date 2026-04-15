require('dotenv').config()

const express = require('express')
const cors = require('cors')

const assetRoutes = require('./routes/assets')
const authRoutes = require('./routes/auth')

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/assets', assetRoutes)
app.use('/api/auth', authRoutes)

app.listen(5000, () => {
  console.log('KSEB Backend running on port 5000')
})