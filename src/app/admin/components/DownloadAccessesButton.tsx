'use client'

import React from 'react'
import { Download } from 'lucide-react'

export default function DownloadAccessesButton({ companies }: { companies: any[] }) {
  const handleDownload = () => {
    const lines = [
      "=========================================================",
      "               ACCESOS ORGANISAAS MAESTRO                ",
      "=========================================================",
      "",
      "🌐 URL Principal de Producción:",
      "https://organisaas.vercel.app/login",
      "(Entrar aquí para administrar cualquier empresa)",
      "",
      "---------------------------------------------------------",
      "              LISTADO DE EMPRESAS Y ACCESOS              ",
      "---------------------------------------------------------",
      ""
    ]

    if (!companies || companies.length === 0) {
      lines.push("Aún no hay empresas registradas.")
    } else {
      companies.forEach(company => {
        lines.push(`▶ EMPRESA: ${company.name}`)
        lines.push(`  URL de Visualización: https://organisaas.vercel.app/${company.slug}/dashboard`)
        lines.push(`  Admin RRHH Correo:    ${company.hr_email || 'Sin correo'}`)
        lines.push(`  Admin RRHH Password:  ${company.hr_password || '*** (No se guardó / Usar opción editar)'}`)
        
        if (company.is_public) {
          lines.push(`  Clave para Empleados: ${company.viewer_password || '(Acceso sin contraseña)'}`)
        } else {
          lines.push(`  Acceso Empleados:     Restringido (Organigrama no es público)`)
        }
        lines.push("")
        lines.push("---------------------------------------------------------")
        lines.push("")
      })
    }

    const textContent = lines.join('\n')
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Accesos_OrganiSaaS.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors shadow-sm"
    >
      <Download className="w-4 h-4" />
      Descargar Accesos (.txt)
    </button>
  )
}
