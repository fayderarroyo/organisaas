# OrganiSaaS - Plataforma Inteligente de Gestión Jerárquica

OrganiSaaS es una plataforma B2B (Software as a Service) diseñada para revolucionar la forma en que los departamentos de Recursos Humanos visualizan, gestionan y comparten los organigramas corporativos.

## 🚀 Arquitectura y Roles del Sistema

El sistema está diseñado con una arquitectura de múltiples inquilinos (Multi-Tenant) que separa estrictamente los accesos en tres niveles de seguridad:

### 1. El Super Administrador (Dueño del SaaS)
- **Acceso:** Vía `/login` -> Redirige al Panel Maestro (`/admin`).
- **Capacidades:**
  - Tiene control absoluto del negocio.
  - Puede crear, visualizar, editar y eliminar empresas clientes.
  - Al dar de alta una empresa, le asigna un color corporativo, su logo, una URL personalizada (slug) y le crea automáticamente un usuario (correo y contraseña temporal) para el encargado de Recursos Humanos (GH) de dicha empresa.

### 2. El Administrador de Recursos Humanos (Cliente B2B)
- **Acceso:** Vía `/login` -> Redirige a su entorno privado (`/[empresa]/dashboard`).
- **Capacidades:**
  - Recibe la plataforma como "Marca Blanca" (Con el logo y colores de su empresa).
  - Activa el "Modo Edición" para estructurar su organigrama.
  - Puede crear nodos (empleados), asignarles un cargo, subirles una fotografía y establecer la jerarquía (quién reporta a quién).
  - Puede cambiar su propia contraseña.
  - Configura una "Contraseña de Visitante" general para proteger el organigrama público de su empresa.

### 3. Empleados y Público (Visitantes)
- **Acceso:** Vía el enlace directo que comparta GH (ej. `organisaas.com/miempresa/dashboard`).
- **Capacidades:**
  - Solo acceso de lectura.
  - El sistema detecta que no tienen sesión iniciada y oculta automáticamente todos los botones de edición y correos administrativos por seguridad.
  - Si la empresa configuró una clave de acceso público, deberán ingresarla antes de poder ver el gráfico.
  - Pueden navegar, hacer zoom y arrastrar el organigrama interactivo de su empresa de forma intuitiva.

## 🛠️ Stack Tecnológico

El proyecto está construido con herramientas modernas de alto rendimiento:

- **Frontend:** [Next.js 15](https://nextjs.org/) (App Router) y React 19.
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/) para un diseño responsivo y moderno.
- **Gráficos Interactivos:** [React Flow](https://reactflow.dev/) para el motor de renderizado de nodos del organigrama.
- **Backend & Base de Datos:** [Supabase](https://supabase.com/) (PostgreSQL).
- **Autenticación:** Supabase Auth con JWT y Middleware de Next.js para protección de rutas.
- **Almacenamiento:** Supabase Storage (Buckets) para alojar los logos de las empresas y las fotos de los empleados.
- **Despliegue:** Alojado en [Vercel](https://vercel.com/) con CI/CD (Despliegue automático con cada cambio en GitHub).

## 🔒 Seguridad y Privacidad

- **Middleware Inteligente:** Protege las rutas administrativas. Si alguien intenta forzar la URL `/admin`, el middleware intercepta la petición, verifica si el JWT tiene el rol de `superadmin` y, si no lo tiene, bloquea el acceso.
- **Aislamiento de Datos:** Mediante metadatos en los usuarios, un administrador de la *Empresa A* jamás podrá modificar ni acceder a los datos de la *Empresa B*.
- **Row Level Security (RLS):** Implementado a nivel de base de datos en Supabase. Aunque alguien obtenga las llaves públicas de la API, la base de datos rechazará cualquier consulta que no pertenezca a la empresa del usuario autenticado.

## 💻 Desarrollo Local

Para correr el proyecto en tu máquina local:

1. **Clonar y descargar dependencias:**
   ```bash
   npm install
   ```

2. **Variables de Entorno:**
   Crea un archivo `.env.local` en la raíz del proyecto y añade tus credenciales de Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_de_supabase
   SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_para_acciones_de_superadmin
   ```

3. **Iniciar el Servidor de Desarrollo:**
   ```bash
   npm run dev
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📦 Estructura de la Base de Datos

- `companies`: Almacena el nombre, logo, color principal, slug, correo del admin de RRHH y contraseñas de acceso público de los clientes.
- `employees`: Almacena los nodos del organigrama (nombre, cargo, foto, a quién reporta `reports_to` y a qué empresa pertenece).
- `auth.users` (Supabase): Maneja el acceso y los roles (`superadmin` o `hr_admin`) mediante el `raw_user_meta_data`.

---
*Desarrollado con ❤️ para llevar los Recursos Humanos al siguiente nivel.*
