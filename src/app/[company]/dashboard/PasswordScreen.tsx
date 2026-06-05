'use client'

import React, { useState } from 'react'
import { verifyPassword } from './actions'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function PasswordScreen({ company }: { company: any }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const res = await verifyPassword(company.slug, password)
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.refresh()
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50 p-6 h-full">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-8 h-8 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Organigrama Protegido</h2>
        <p className="text-gray-500 text-sm mb-6">
          El organigrama de <strong>{company.name}</strong> es privado. Ingresa la contraseña de visitante para continuar.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {error && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md border border-red-100">{error}</div>}
          
          <input 
            type="password" 
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:ring-2 outline-none w-full"
            style={{ '--tw-ring-color': 'var(--brand-color)' } as React.CSSProperties}
            placeholder="Contraseña de acceso"
          />
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full px-4 py-3 text-white font-bold rounded-lg hover:brightness-90 transition-all disabled:opacity-50 mt-2 shadow-sm"
            style={{ backgroundColor: 'var(--brand-color)' }}
          >
            {loading ? 'Verificando...' : 'Desbloquear'}
          </button>
        </form>
      </div>
    </div>
  )
}
