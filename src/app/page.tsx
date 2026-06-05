import { redirect } from 'next/navigation'

export default function Home() {
  // Redirigir a login por defecto. 
  // Más adelante, aquí podría ir una Landing Page comercial pública.
  redirect('/login')
}
