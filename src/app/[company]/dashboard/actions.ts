'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

export async function verifyPassword(companySlug: string, passwordAttempt: string) {
  const supabase = await createClient()
  const { data: company } = await supabase
    .from('companies')
    .select('viewer_password')
    .eq('slug', companySlug)
    .single()

  if (company?.viewer_password === passwordAttempt) {
    const cookieStore = await cookies()
    cookieStore.set(`access_${companySlug}`, passwordAttempt, { path: '/', maxAge: 60 * 60 * 24 * 30 }) // 30 days
    return { success: true }
  } else {
    return { error: 'Contraseña incorrecta' }
  }
}

export async function addEmployee(companyId: string, data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('employees').insert({
    company_id: companyId,
    name: data.name,
    position: data.position,
    hierarchy_level: data.hierarchy_level || null,
    photo_url: data.photo_url || null,
    parent_id: data.parent_id || null,
    secondary_parent_id: data.secondary_parent_id || null
  })
  if (error) return { error: error.message }
  return { success: true }
}

export async function updateEmployee(id: string, data: any) {
  const supabase = await createClient()
  const { error } = await supabase.from('employees').update({
    name: data.name,
    position: data.position,
    hierarchy_level: data.hierarchy_level || null,
    photo_url: data.photo_url || null,
    parent_id: data.parent_id || null,
    secondary_parent_id: data.secondary_parent_id || null
  }).eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteEmployee(id: string) {
  const supabase = await createClient()
  
  const { data: employee } = await supabase.from('employees').select('parent_id').eq('id', id).single()
  
  if (employee) {
    await supabase.from('employees').update({ parent_id: employee.parent_id }).eq('parent_id', id)
  }

  const { error } = await supabase.from('employees').delete().eq('id', id)
  if (error) return { error: error.message }
  return { success: true }
}
