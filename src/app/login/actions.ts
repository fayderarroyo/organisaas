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

  // After login, we don't know the user's company slug yet.
  // We should redirect them to a generic dashboard or check their company.
  // For now, let's redirect to admin if they are the superadmin, or to a selector.
  // The superadmin email is usually defined. Let's redirect to /admin by default,
  // and the admin page will check permissions.
  revalidatePath('/', 'layout')
  redirect('/admin')
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
