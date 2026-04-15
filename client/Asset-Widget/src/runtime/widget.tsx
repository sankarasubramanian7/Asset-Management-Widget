/** @jsx jsx */
import { React, jsx } from 'jimu-core'
import * as XLSX from 'xlsx'
import { validateAssets, normalizeRow } from './utils'

const API_URL = 'http://localhost:5000/api/assets'

export default function Widget() {
  const [assets, setAssets] = React.useState<any[]>([])
  const [form, setForm] = React.useState({
    id: '',
    name: '',
    type: 'pole'
  })
  const [editIndex, setEditIndex] = React.useState<number | null>(null)

  const [token, setToken] = React.useState<string | null>(null)
  const [role, setRole] = React.useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)

  const [loginForm, setLoginForm] = React.useState({
    username: '',
    password: '',
    role: 'admin'
  })

  /* ================= LOGIN ================= */
  /* ================= LOGIN ================= */
const handleLogin = () => {
  fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginForm)
  })
    .then(res => res.json())
    .then(data => {

      //  BLOCK WRONG ROLE LOGIN (IMPORTANT FIX)
      if (data.role !== loginForm.role) {
        // eslint-disable-next-line no-alert
        alert(`Access Denied: You selected ${loginForm.role} but account is ${data.role}`)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.role)

      setToken(data.token)
      setRole(data.role)
      setIsLoggedIn(true)

      loadAssets(data.token)
    })
}

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')

    setToken(null)
    setRole(null)
    setIsLoggedIn(false)
    setAssets([])
  }

  React.useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedRole = localStorage.getItem('role')

    if (savedToken) {
      setToken(savedToken)
      setRole(savedRole)
      setIsLoggedIn(true)
      loadAssets(savedToken)
    }
  }, [])

  const loadAssets = (authToken: string | null) => {
  fetch(API_URL, {
    headers: {
      Authorization: authToken || localStorage.getItem('token')
    }
  })
    .then(res => res.json())
    .then(data => {

      const currentRole = localStorage.getItem('role')

      if (!Array.isArray(data)) {
        setAssets([])
        return
      }

      // SAFE ROLE FILTERING
      if (currentRole === 'viewer') {
        setAssets(data.filter(a => a.createdByRole === 'viewer'))
      }
      else if (currentRole === 'custodian') {
        setAssets(data.filter(a =>
          a.createdByRole === 'viewer' || a.createdByRole === 'custodian'
        ))
      }
      else {
        setAssets(data) // admin sees all
      }

    })
    .catch(err => {
      console.error('Load assets error:', err)
      setAssets([])
    })
}

  const updateAssets = (data: any[]) => {
    const validated = validateAssets(data)
    setAssets(validated)
  }

  const handleChange = (e: { target: { name: any; value: any } }) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const addAsset = () => {
  const payload = form

  if (!form.id || !form.name) {
    // eslint-disable-next-line no-alert
    alert('ID and Name cannot be empty')
    return
  }

  // ✅ FIXED DUPLICATE CHECK (ignores current edit item)
  const duplicate = assets.find((a, i) =>
    a.id === form.id && i !== editIndex
  )

  if (duplicate) {
    // eslint-disable-next-line no-alert
    alert('Duplicate ID not allowed')
    return
  }

  if (editIndex !== null) {
    const updated = [...assets]
    updated[editIndex] = form
    updateAssets(updated)
    setEditIndex(null)
  } else {
    fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token || localStorage.getItem('token')
      },
      body: JSON.stringify({
  ...payload,
  status: 'Pending',
  createdByRole: role || 'viewer'
})
    })
      .then(res => res.json())
      .then(newAsset => {
        setAssets([...assets, newAsset])
      })
  }

  setForm({ id: '', name: '', type: 'pole' })
}

  const handleEdit = (index: number) => {
    const asset = assets[index]
    setForm({
      id: asset.id,
      name: asset.name,
      type: asset.type
    })
    setEditIndex(index)
  }

  const handleDelete = (index: number) => {
    const id = assets[index].id

    fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: token || localStorage.getItem('token')
      }
    }).then(() => {
      const newData = assets.filter((_, i) => i !== index)
      updateAssets(newData)
    })
  }

  const handleFile = (e: { target: { files: any[] } }) => {
    const file = e.target.files[0]
    const reader = new FileReader()

    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: 'binary' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const data = XLSX.utils.sheet_to_json(sheet)
      const formatted = data.map(normalizeRow)
      updateAssets([...assets, ...formatted])
    }

    reader.readAsBinaryString(file)
  }

  const exportValid = () => {
    const valid = assets.filter(a => a.status === 'Valid')
    const ws = XLSX.utils.json_to_sheet(valid)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'ValidAssets')
    XLSX.writeFile(wb, 'kseb_valid_assets.xlsx')
  }

  const canEdit = role === 'admin' || role === 'custodian'
  const canDelete = role === 'admin'

  /* ================= LOGIN UI (MODERN SWITCH) ================= */
  if (!isLoggedIn) {
    return (
      <div style={loginWrap}>
        <div style={loginCard}>
          <h2 style={{ marginBottom: 15 }}>⚡ KSEB Login</h2>

          <input
            placeholder="Username"
            value={loginForm.username}
            onChange={(e) =>
              { setLoginForm({ ...loginForm, username: e.target.value }) }
            }
            style={inputStyle}
          />

          <input
            placeholder="Password"
            type="password"
            value={loginForm.password}
            onChange={(e) =>
              { setLoginForm({ ...loginForm, password: e.target.value }) }
            }
            style={inputStyle}
          />

          {/* ROLE SWITCH UI */}
          <div style={{ display: 'flex', gap: 10, marginTop: 15 }}>
            {['admin', 'custodian', 'viewer'].map((r) => (
              <div
                key={r}
                onClick={() =>
                  { setLoginForm({ ...loginForm, role: r }) }
                }
                style={{
                  flex: 1,
                  padding: 10,
                  textAlign: 'center',
                  borderRadius: 8,
                  cursor: 'pointer',
                  border:
                    loginForm.role === r
                      ? '2px solid #1976d2'
                      : '1px solid #ccc',
                  background:
                    loginForm.role === r ? '#e3f2fd' : '#fff',
                  fontWeight: 600
                }}
              >
                {r.toUpperCase()}
              </div>
            ))}
          </div>

          <button
            style={{ ...primaryBtn, width: '100%' }}
            onClick={handleLogin}
          >
            Login as {loginForm.role}
          </button>
        </div>
      </div>
    )
  }

  /* ================= MAIN UI ================= */
  return (
    <div style={pageWrap}>
      <div style={header}>
        <h2>⚡ KSEB Asset Intake</h2>
        <div>
          <span style={{ marginRight: 10 }}>Role: {role}</span>
          <button style={deleteBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      <div style={grid}>
        <div style={card}>
          <h4>Manual Entry</h4>

          <input
  name="id"
  value={form.id}
  onChange={handleChange}
  style={inputStyle}
  placeholder="Enter Asset ID"
/>

<input
  name="name"
  value={form.name}
  onChange={handleChange}
  style={inputStyle}
  placeholder="Enter Asset Name"
/>

          <select name="type" value={form.type} onChange={handleChange} style={inputStyle}>
            <option value="pole">Pole</option>
            <option value="transformer">Transformer</option>
            <option value="line">Line</option>
          </select>

          <button style={primaryBtn} onClick={addAsset}>
            {editIndex !== null ? 'Update Asset' : 'Add Asset'}
          </button>
        </div>

        <div style={card}>
          <h4>Upload Spreadsheet</h4>
          <input type="file" onChange={handleFile} />
        </div>
      </div>

      <button style={secondaryBtn} onClick={exportValid}>
        ⬇ Download Valid Data
      </button>

      <div style={tableWrap}>
        <table style={table}>
          <thead>
            <tr>
              <th style={th}>ID</th>
              <th style={th}>Name</th>
              <th style={th}>Type</th>
              <th style={th}>Status</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {assets.map((a, i) => (
              <tr key={i}>
                <td style={td}>{a.id || '-'}</td>
                <td style={td}>{a.name || '-'}</td>
                <td style={td}>{a.type || '-'}</td>

                <td style={{ ...td, color: getStatusColor(a.status), fontWeight: 600 }}>
                  {a.status || 'Pending'}
                </td>

                <td style={td}>
                  {canEdit && (
                    <button style={editBtn} onClick={() => { handleEdit(i); }}>
                      Edit
                    </button>
                  )}

                  {canDelete && (
                    <button style={deleteBtnSmall} onClick={() => { handleDelete(i) }}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ================= UI STYLES ================= */

const loginWrap = {
  display: 'flex',
  justifyContent: 'center',
  marginTop: 80
}

const loginCard = {
  padding: 20,
  background: '#fff',
  borderRadius: 10,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  width: 320
}

const pageWrap = {
  padding: 20,
  fontFamily: 'Arial',
  background: '#f4f6f8',
  minHeight: '100vh'
}

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 20
}

const grid = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20,
  marginBottom: 20
}

const card = {
  background: '#fff',
  padding: 15,
  borderRadius: 10,
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
}

const tableWrap = {
  background: '#fff',
  marginTop: 15,
  borderRadius: 10,
  overflow: 'hidden'
}

const table = {
  width: '100%',
  borderCollapse: 'collapse'
}

const tr = {
  borderBottom: '1px solid #eee'
}

const th = {
  textAlign: 'left',
  padding: 10,
  background: '#f0f0f0'
}

const td = {
  padding: 10
}

const inputStyle = {
  padding: 10,
  marginTop: 10,
  width: '100%',
  border: '1px solid #ccc',
  borderRadius: 6
}

const primaryBtn = {
  marginTop: 15,
  background: '#1976d2',
  color: '#fff',
  padding: 10,
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer'
}

const secondaryBtn = {
  marginTop: 10,
  background: '#2e7d32',
  color: '#fff',
  padding: 10,
  border: 'none',
  borderRadius: 6
}

const deleteBtn = {
  background: '#d32f2f',
  color: '#fff',
  padding: 6,
  border: 'none',
  borderRadius: 6
}

const deleteBtnSmall = {
  background: '#d32f2f',
  color: '#fff',
  padding: '4px 8px',
  border: 'none',
  borderRadius: 4
}

const editBtn = {
  background: '#0288d1',
  color: '#fff',
  padding: '4px 8px',
  border: 'none',
  borderRadius: 4,
  marginRight: 5
}

const getStatusColor = (status) => {
  if (status === 'Valid') return '#2e7d32'
  if (status === 'Duplicate') return '#ed6c02'
  return '#d32f2f'
}