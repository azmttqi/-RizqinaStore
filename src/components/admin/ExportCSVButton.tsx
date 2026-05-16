'use client'

import { Download } from 'lucide-react'

interface ExportCSVButtonProps {
  data: any[]
  filename?: string
}

export default function ExportCSVButton({ data, filename = 'laporan_penjualan.csv' }: ExportCSVButtonProps) {
  function handleExport() {
    if (!data || data.length === 0) {
      alert('Tidak ada data untuk diexport.')
      return
    }

    // Ekstrak header dinamis dari data objek pertama
    const headers = Object.keys(data[0])
    
    // Tambahkan BOM (Byte Order Mark) agar Excel mendeteksi encoding UTF-8 dengan benar
    // Gunakan titik koma (;) sebagai delimiter karena Excel region Indonesia membacanya sebagai pemisah kolom
    let csvContent = '\uFEFF' + headers.join(';') + '\n'

    // Gabungkan tiap baris data
    data.forEach(row => {
      const values = headers.map(header => {
        const val = row[header]
        const escaped = (val === null || val === undefined) ? '' : String(val).replace(/"/g, '""')
        return `"${escaped}"`
      })
      csvContent += values.join(';') + '\n'
    })

    // Buat Blob dan trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button onClick={handleExport} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <Download size={18} />
      Export CSV
    </button>
  )
}
