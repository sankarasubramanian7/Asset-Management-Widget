export const validateAssets = (assets: any[]) => {
  const ids = new Set()

  return assets.map((a) => {
    let status = "Valid"

    if (!a.id || !a.name || !a.type) {
      status = "Error"
    } else if (ids.has(a.id)) {
      status = "Duplicate"
    } else {
      ids.add(a.id)
    }

    return { ...a, status }
  })
}

export const normalizeRow = (row: any) => ({
  id: row.ID || row.id || "",
  name: row.Name || row.name || "",
  type: (row.Type || row.type || "").toLowerCase()
})