'use client'

import React, { useState } from 'react'
import { LogOut, KeyRound } from 'lucide-react'
import { signOut } from '@/app/login/actions'
import ChangePasswordModal from './dashboard/ChangePasswordModal'

export default function HeaderActions({ email }: { email: string }) {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 hidden md:inline-block">
        {email}
      </span>
      
      <button 
        onClick={() => setIsPasswordModalOpen(true)}
        className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors border border-gray-200"
      >
        <KeyRound className="w-4 h-4" />
        <span className="hidden sm:inline">Contraseña</span>
      </button>

      <form action={signOut}>
        <button className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-100">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Salir</span>
        </button>
      </form>

      <ChangePasswordModal 
        isOpen={isPasswordModalOpen} 
        onClose={() => setIsPasswordModalOpen(false)} 
      />
    </div>
  )
}
