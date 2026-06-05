'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return redirect('/login?message=Could not authenticate user')
  }

  // Redireccionar según el rol
  const { data: { user } } = await supabase.auth.getUser()
  const role = user?.user_metadata?.role

  revalidatePath('/', 'layout')
  
  if (role === 'superadmin') {
    return redirect('/admin')
  } else if (role === 'hr_admin' && user?.user_metadata?.company_id) {
    // Buscar el slug de la empresa
    const { data: company } = await supabase.from('companies').select('slug').eq('id', user.user_metadata.company_id).single()
    if (company) {
      return redirect(`/${company.slug}/dashboard`)
    }
  }

  // Fallback
  return redirect('/')
}

export async function signup(formData: FormData) {
  // En este SaaS, los usuarios normales NO se registran.
  // Son creados por el Super-Admin o el Admin de la empresa.
  // Dejamos esta función por si el Super-Admin inicial necesita registrarse.
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signUp(data)

  if (error) {
    return redirect('/login?message=Could not create user')
  }

  revalidatePath('/', 'layout')
  redirect('/admin')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/login')
}
