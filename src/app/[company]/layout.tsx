import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import HeaderActions from './HeaderActions'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ company: string }> }): Promise<Metadata> {
  const companySlug = (await params).company
  const supabase = await createClient()
  const { data: company } = await supabase.from('companies').select('name').eq('slug', companySlug).single()

  if (!company) {
    return { title: 'Empresa no encontrada | OrganiSaaS' }
  }

  return {
    title: `Portal RRHH - ${company.name}`,
    description: `Portal de Recursos Humanos y Organigrama de ${company.name}`
  }
}

export default async function CompanyLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ company: string }>
}) {
  const companySlug = (await params).company

  const supabase = await createClient()
  
  // 1. Obtener usuario (sin redirigir si no existe, ya que las vistas públicas lo manejan)
  const { data: { user } } = await supabase.auth.getUser()

  // 2. Obtener datos de la empresa por su slug
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('slug', companySlug)
    .single()

  if (companyError || !company) {
    // Si la empresa no existe, redirigir
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Empresa no encontrada</h1>
          <p className="text-gray-500 mt-2">La URL /{companySlug} no existe en nuestro sistema.</p>
        </div>
      </div>
    )
  }

  // TODO: Aquí verificaríamos si el user.user_metadata.company_id === company.id
  // para que un HR de Acme no pueda entrar a Globex.

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col" style={{ '--brand-color': company.primary_color } as React.CSSProperties}>
      <header className="bg-white border-b shadow-sm relative z-10" style={{ borderBottomColor: 'var(--brand-color)', borderBottomWidth: '4px' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <div className="h-16 max-w-[300px] flex items-center justify-start">
                <img src={company.logo_url} alt={`${company.name} Logo`} className="h-full w-auto object-contain drop-shadow-sm" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-md flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0" style={{ backgroundColor: 'var(--brand-color)' }}>
                {company.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black tracking-tight text-gray-800">{company.name}</h1>
              <span className="text-xs font-semibold text-gray-500 tracking-widest uppercase">
                Portal de RRHH
              </span>
            </div>
          </div>

          {user && (
            <HeaderActions email={company.hr_email || user.email || ''} />
          )}
        </div>
      </header>

      <main className="flex-1 w-full relative">
        {children}
      </main>
    </div>
  )
}
