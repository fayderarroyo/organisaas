import { createClient } from '@/utils/supabase/server'
import CreateCompanyForm from './components/CreateCompanyForm'
import CompanyList from './components/CompanyList'
import DownloadAccessesButton from './components/DownloadAccessesButton'

export default async function AdminPage() {
  const supabase = await createClient()
  
  // Obtener todas las empresas
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Resumen General</h2>
          <p className="text-gray-600">Bienvenido al área de gestión de OrganiSaaS. Aquí puedes dar de alta nuevos clientes y administrar sus accesos.</p>
        </div>
        <div>
          <DownloadAccessesButton companies={companies || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <CreateCompanyForm />
        </div>
        
        <div className="xl:col-span-2">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm min-h-full">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-4 mb-4">Empresas Registradas</h2>
            
            {error && <p className="text-red-500 text-sm">Error cargando empresas: {error.message}</p>}
            
            <CompanyList companies={companies || []} />
          </div>
        </div>
      </div>
    </div>
  )
}
