'use server'

import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createCompany(prevState: any, formData: FormData) {
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const primaryColor = formData.get('primaryColor') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const logo = formData.get('logo') as File | null
  const isPublic = formData.get('is_public') === 'on'
  const viewerPassword = formData.get('viewer_password') as string

  if (!name || !slug || !email || !password) {
    return { error: 'Todos los campos obligatorios deben ser llenados' }
  }

  const supabase = await createClient()

  let finalLogoUrl = null

  if (logo && logo.size > 0) {
    const fileExt = logo.name.split('.').pop()
    const fileName = `${slug}-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, logo, { upsert: false })

    if (uploadError) {
      return { error: 'Error subiendo el logo (¿creaste el bucket "logos"?): ' + uploadError.message }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)

    finalLogoUrl = publicUrl
  }

  // 1. Crear Empresa
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .insert({ 
      name, 
      slug, 
      primary_color: primaryColor || '#16a34a', 
      logo_url: finalLogoUrl,
      is_public: isPublic,
      viewer_password: viewerPassword || null,
      hr_email: email
    })
    .select()
    .single()

  if (companyError) {
    return { error: 'Error creando la empresa: ' + companyError.message }
  }

  // 2. Crear Usuario Administrador (RRHH)
  const adminAuthClient = createAdminClient()
  const { data: user, error: userError } = await adminAuthClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      company_id: company.id,
      role: 'hr_admin'
    }
  })

  if (userError) {
    // Si falla el usuario, borramos la empresa para no dejar basura
    await supabase.from('companies').delete().eq('id', company.id)
    return { error: 'Error creando el usuario: ' + userError.message }
  }

  revalidatePath('/admin')
  return { success: true, message: 'Empresa y usuario creados con éxito' }
}

export async function updateCompany(prevState: any, formData: FormData) {
  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const slug = formData.get('slug') as string
  const primaryColor = formData.get('primaryColor') as string
  const logo = formData.get('logo') as File | null
  const currentLogoUrl = formData.get('currentLogoUrl') as string
  const isPublic = formData.get('is_public') === 'on'
  const viewerPassword = formData.get('viewer_password') as string

  if (!id || !name || !slug) {
    return { error: 'Faltan campos obligatorios' }
  }

  const supabase = await createClient()
  let finalLogoUrl = currentLogoUrl || null

  if (logo && logo.size > 0) {
    const fileExt = logo.name.split('.').pop()
    const fileName = `${slug}-${Date.now()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('logos')
      .upload(fileName, logo, { upsert: false })

    if (uploadError) {
      return { error: 'Error subiendo el nuevo logo: ' + uploadError.message }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logos')
      .getPublicUrl(fileName)

    finalLogoUrl = publicUrl
  }

  const { error: updateError } = await supabase
    .from('companies')
    .update({ 
      name, 
      slug, 
      primary_color: primaryColor, 
      logo_url: finalLogoUrl,
      is_public: isPublic,
      viewer_password: viewerPassword || null
    })
    .eq('id', id)

  if (updateError) {
    return { error: 'Error actualizando la empresa: ' + updateError.message }
  }

  revalidatePath('/admin')
  return { success: true, message: 'Empresa actualizada con éxito' }
}

export async function deleteCompany(companyId: string) {
  const supabase = await createClient()
  const adminAuthClient = createAdminClient()

  // 1. Obtener la empresa para saber qué usuario (HR Admin) tiene asociado
  const { data: company, error: getError } = await supabase
    .from('companies')
    .select('id')
    .eq('id', companyId)
    .single()

  if (getError || !company) {
    return { error: 'Empresa no encontrada' }
  }

  // 2. Buscar al usuario HR Admin de esta empresa para borrarlo de Supabase Auth
  // Hacemos una consulta usando la API de admin
  const { data: { users }, error: usersError } = await adminAuthClient.auth.admin.listUsers()
  
  if (!usersError && users) {
    const hrUser = users.find(u => u.user_metadata?.company_id === companyId && u.user_metadata?.role === 'hr_admin')
    if (hrUser) {
      await adminAuthClient.auth.admin.deleteUser(hrUser.id)
    }
  }

  // 3. Borrar la empresa de la base de datos (los empleados se borran solos si hay CASCADE, o los borramos manualmente si no)
  // Por precaución borramos los empleados primero
  await supabase.from('employees').delete().eq('company_id', companyId)
  
  const { error: deleteError } = await supabase.from('companies').delete().eq('id', companyId)
  
  if (deleteError) {
    return { error: 'Error borrando la empresa: ' + deleteError.message }
  }

  revalidatePath('/admin')
  return { success: true }
}
