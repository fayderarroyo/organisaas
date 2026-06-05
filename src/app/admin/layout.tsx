import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Building2, LogOut } from 'lucide-react'
import { signOut } from '@/app/login/actions'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  if (user.user_metadata?.role !== 'superadmin') {
    redirect('/login?message=Acceso denegado')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 text-green-700">
          <Building2 className="w-6 h-6" />
          <h1 className="text-xl font-bold tracking-tight">OrganiSaaS <span className="text-gray-400 font-medium">| Panel Maestro</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full">{user.email}</span>
          <form action={signOut}>
            <button className="text-red-600 hover:bg-red-50 p-2 rounded-md transition-colors flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-bold">Salir</span>
            </button>
          </form>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  )
}
