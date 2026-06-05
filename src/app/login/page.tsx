import { login, signup } from './actions'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { Building2 } from 'lucide-react'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message: string }>
}) {
  const params = await searchParams;
  const message = params.message;
  
  // Si ya está autenticado, redirigir
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    const role = user.user_metadata?.role
    if (role === 'superadmin') {
      return redirect('/admin')
    } else if (role === 'hr_admin' && user.user_metadata?.company_id) {
      const { createAdminClient } = await import('@/utils/supabase/admin')
      const adminSupabase = createAdminClient()
      const { data: company } = await adminSupabase.from('companies').select('slug').eq('id', user.user_metadata.company_id).single()
      if (company) {
        return redirect(`/${company.slug}/dashboard`)
      }
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto min-h-screen">
      <div className="flex flex-col items-center justify-center mb-8 gap-4">
        <div className="w-16 h-16 bg-green-700 rounded-2xl flex items-center justify-center shadow-lg">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">OrganiSaaS</h1>
        <p className="text-gray-500 text-sm font-medium">Gestión jerárquica inteligente</p>
      </div>

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <label className="text-md font-semibold text-gray-700" htmlFor="email">
          Correo Electrónico
        </label>
        <input
          className="rounded-lg px-4 py-3 bg-gray-50 border border-gray-200 mb-6 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 transition-all shadow-sm"
          name="email"
          placeholder="tu@empresa.com"
          required
        />
        
        <label className="text-md font-semibold text-gray-700" htmlFor="password">
          Contraseña
        </label>
        <input
          className="rounded-lg px-4 py-3 bg-gray-50 border border-gray-200 mb-6 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 transition-all shadow-sm"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        
        <button
          formAction={login}
          className="bg-green-700 hover:bg-green-800 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors w-full mb-2"
        >
          Iniciar Sesión
        </button>
        
        {/* Descomentar si necesitas registrar tu primer usuario SuperAdmin */}
        {/* <button
          formAction={signup}
          className="bg-transparent border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-bold py-3 px-4 rounded-lg transition-colors w-full"
        >
          Crear cuenta principal
        </button> */}

        {message && (
          <p className="mt-4 p-4 bg-red-50 text-red-600 text-center text-sm font-medium rounded-lg border border-red-100">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
