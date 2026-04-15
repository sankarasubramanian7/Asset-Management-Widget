const bcrypt = require('bcrypt')

async function run() {
  const admin = await bcrypt.hash('admin123', 10)
  const cust = await bcrypt.hash('cust123', 10)
  const viewer = await bcrypt.hash('view123', 10)

  console.log('ADMIN:', admin)
  console.log('CUSTODIAN:', cust)
  console.log('VIEWER:', viewer)
}

run()