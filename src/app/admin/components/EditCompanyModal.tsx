'use client'

import React, { useActionState, useEffect } from 'react'
import { updateCompany } from '../actions'

const initialState = {
  error: '',
  success: false,
  message: ''
}

export default function EditCompanyModal({ isOpen, onClose, company }: { isOpen: boolean, onClose: () => void, company: any }) {
  const [state, formAction, isPending] = useActionState(updateCompany as any, initialState as any)
  const [isPublic, setIsPublic] = React.useState(true)

  useEffect(() => {
    if (company) {
      setIsPublic(company.is_public ?? true)
    }
  }, [company])

  useEffect(() => {
    if (state.success && !isPending) {
      onClose() // Cierra al ser exitoso
      // Reseteamos el estado manualmente modificando la key del componente padre si es necesario
      // pero como se desmonta, está bien.
    }
  }, [state, isPending, onClose])

  if (!isOpen || !company) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-xl font-bold text-gray-800">Editar Empresa</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        
        <form action={formAction} className="p-6 flex flex-col gap-4">
          {state.error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{state.error}</div>}
          
          <input type="hidden" name="id" value={company.id} />
          <input type="hidden" name="currentLogoUrl" value={company.logo_url || ''} />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Nombre de la Empresa</label>
            <input name="name" type="text" defaultValue={company.name} required className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Slug (URL)</label>
            <input name="slug" type="text" defaultValue={company.slug} required className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Color Principal (Hex)</label>
            <input name="primaryColor" type="color" defaultValue={company.primary_color || '#16a34a'} className="border border-gray-300 rounded-lg h-10 w-full p-1 cursor-pointer" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-gray-700">Nuevo Logo (Dejar vacío para mantener el actual)</label>
            <input name="logo" type="file" accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 border border-gray-300 rounded-lg p-1 bg-white" />
          </div>

          <div className="flex flex-col gap-1.5 border-t pt-4 mt-2 border-gray-100">
            <h3 className="text-sm font-bold text-gray-800">Privacidad del Organigrama</h3>
            <label className="flex items-center gap-2 cursor-pointer mt-1">
              <input 
                type="checkbox" 
                name="is_public" 
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-semibold text-gray-700">Acceso Público</span>
            </label>
            
            {!isPublic && (
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-sm font-semibold text-gray-700">Contraseña de Visitante</label>
                <input name="viewer_password" type="text" defaultValue={company.viewer_password || ''} required={!isPublic} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nueva contraseña de visitante" />
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={isPending} className="flex-1 px-4 py-2 bg-gray-900 text-white font-bold rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50">
              {isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
