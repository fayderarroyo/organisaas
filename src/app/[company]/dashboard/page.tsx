import { createClient } from '@/utils/supabase/server'
import ClientOrgChart from './ClientOrgChart'
import { cookies } from 'next/headers'
import PasswordScreen from './PasswordScreen'

export default async function DashboardPage({ params }: { params: Promise<{ company: string }> }) {
  const companySlug = (await params).company
  
  const supabase = await createClient()
  
  // 1. Obtener el ID de la empresa
  const { data: company } = await supabase
    .from('companies')
    .select('id, name, is_public, slug, viewer_password')
    .eq('slug', companySlug)
    .single()

  if (!company) {
    return <div className="p-8">Empresa no encontrada</div>
  }

  const { data: { user } } = await supabase.auth.getUser()
  const isHrAdmin = user?.user_metadata?.company_id === company.id || user?.user_metadata?.role === 'superadmin'

  // Verificar privacidad
  if (company.is_public === false) {
    const cookieStore = await cookies()
    const accessCookie = cookieStore.get(`access_${company.slug}`)
    
    const hasValidCookie = accessCookie?.value === company.viewer_password

    if (!isHrAdmin && !hasValidCookie) {
      return <PasswordScreen company={company} />
    }
  }

  // 2. Renderizar el componente cliente que manejará el organigrama interactivo
  return (
    <div className="w-full h-[calc(100vh-75px)] overflow-hidden relative">
      <ClientOrgChart companyId={company.id} isAdmin={isHrAdmin} />
    </div>
  )
}
