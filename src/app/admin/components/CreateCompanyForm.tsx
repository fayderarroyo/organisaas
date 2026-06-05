'use client'

import { useActionState, useState } from 'react'
import { createCompany } from '../actions'

const initialState = {
  error: '',
  success: false,
  message: ''
}

export default function CreateCompanyForm() {
  const [state, formAction, isPending] = useActionState(createCompany as any, initialState as any)
  const [isPublic, setIsPublic] = useState(true)

  return (
    <form action={formAction} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
      <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Registrar Nueva Empresa</h2>
      
      {state.error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm font-medium">{state.error}</div>}
      {state.success && <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm font-medium">{state.message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Nombre de la Empresa</label>
          <input name="name" type="text" placeholder="Ej: Acme Corp" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Slug (URL)</label>
          <input name="slug" type="text" placeholder="ej: acme-corp" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Color Principal (Hex)</label>
          <input name="primaryColor" type="color" defaultValue="#16a34a" className="border border-gray-300 rounded-lg h-10 w-full p-1 cursor-pointer" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Logo de la Empresa (Opcional)</label>
          <input name="logo" type="file" accept="image/*" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100 border border-gray-300 rounded-lg p-1 bg-white" />
        </div>
      </div>

      <h3 className="text-md font-bold text-gray-800 mt-4 border-t pt-4">Privacidad del Organigrama</h3>
      <div className="grid grid-cols-1 gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            name="is_public" 
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <span className="text-sm font-semibold text-gray-700">Acceso Público</span>
        </label>
        
        {!isPublic && (
          <div className="flex flex-col gap-1">
            <label className="text-sm font-semibold text-gray-700">Contraseña de Visitante</label>
            <input name="viewer_password" type="text" required={!isPublic} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-green-500 outline-none" placeholder="Contraseña para ver organigrama" />
          </div>
        )}
      </div>

      <h3 className="text-md font-bold text-gray-800 mt-4 border-t pt-4">Cuenta del Administrador (RRHH)</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Correo Electrónico</label>
          <input name="email" type="email" placeholder="admin@acme.com" required className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-semibold text-gray-700">Contraseña Inicial</label>
          <input name="password" type="password" placeholder="••••••••" required minLength={6} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:ring-2 focus:ring-green-500 outline-none" />
        </div>
      </div>

      <button 
        type="submit" 
        disabled={isPending}
        className="mt-4 bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
      >
        {isPending ? 'Creando...' : 'Crear Empresa y Usuario'}
      </button>
    </form>
  )
}
