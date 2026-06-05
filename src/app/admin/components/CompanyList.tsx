'use client'

import React, { useState } from 'react'
import { Building2, Users } from 'lucide-react'
import EditCompanyModal from './EditCompanyModal'

export default function CompanyList({ companies }: { companies: any[] }) {
  const [editingCompany, setEditingCompany] = useState<any>(null)

  if (!companies || companies.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No hay ninguna empresa registrada todavía.</p>
        <p className="text-sm mt-1">Utiliza el formulario de la izquierda para empezar.</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {companies.map(company => (
          <div key={company.id} className="border border-gray-100 rounded-lg p-5 hover:shadow-md transition-shadow relative overflow-hidden group bg-white">
            <div className="absolute top-0 left-0 w-1.5 h-full transition-all group-hover:w-2" style={{ backgroundColor: company.primary_color }}></div>
            
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                  {company.logo_url && (
                    <img src={company.logo_url} alt="Logo" className="w-6 h-6 object-contain border rounded-full bg-white" />
                  )}
                  {company.name}
                </h3>
                <div className="mt-1 mb-4">
                  <span className="text-xs text-gray-600 font-mono bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
                    /{company.slug}/dashboard
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setEditingCompany(company)}
                className="text-gray-400 hover:text-gray-900 transition-colors p-1"
                title="Editar Empresa"
              >
                ⚙️
              </button>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-gray-500 font-medium">
                <Users className="w-4 h-4 text-gray-400"/> Admin asignado
              </span>
              <a href={`/${company.slug}/dashboard`} className="text-gray-900 font-bold hover:text-green-700 transition-colors flex items-center gap-1">
                Ver App <span className="text-lg leading-none">→</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      <EditCompanyModal 
        key={editingCompany?.id || 'empty'}
        isOpen={!!editingCompany} 
        onClose={() => setEditingCompany(null)} 
        company={editingCompany} 
      />
    </>
  )
}
