# OrganiSaaS: Plan de Negocios y Arquitectura Técnica

Bienvenido al documento fundacional de **OrganiSaaS**, la evolución comercial del sistema de organigramas interactivos. Este documento detalla la hoja de ruta estratégica y técnica para transformar un desarrollo a la medida en una plataforma multi-empresa (SaaS - Software as a Service) altamente escalable y rentable.

---

## 1. Idea Principal
**OrganiSaaS** es una plataforma web B2B (Business-to-Business) orientada a PYMES (empresas de ~30 a 200 empleados). Ofrece a las empresas la capacidad de visualizar, editar y gestionar su estructura jerárquica y de talento humano de manera gráfica, en tiempo real y optimizada tanto para escritorio como para dispositivos móviles.

El objetivo es sustituir soluciones lentas y estáticas (como Excel o Visio) por una interfaz web drag-and-drop administrada de manera independiente por el departamento de Recursos Humanos de cada cliente.

---

## 2. Plan de Negocios (Modelo SaaS)
El modelo de negocio se basa en **suscripciones recurrentes** mensuales o anuales.
* **Mercado Objetivo:** PYMES que necesitan organizar su talento humano sin pagar licencias corporativas excesivas (ej. SAP, Workday).
* **Propuesta de Valor:** Un despliegue instantáneo, cero configuración técnica para el cliente, y marca blanca (la plataforma parece propia de la empresa).
* **Escalabilidad:** Gracias al enfoque Multi-Tenant (Multicliente), incorporar a la empresa número 1 o a la empresa número 100 tiene un impacto operativo y financiero casi nulo para la plataforma.

---

## 3. Arquitectura Tecnológica (El Stack)
Para garantizar máxima velocidad, escalabilidad y bajo costo inicial, el ecosistema técnico recomendado es:
* **Frontend y Servidor:** `Next.js` alojado en `Vercel`. Proporciona renderizado ultrarrápido y APIs integradas.
* **Base de Datos y Autenticación:** `Supabase` (PostgreSQL). Provee estructura relacional robusta (indispensable para aislar datos de clientes) y sistema de login.
* **Control de Versiones y Respaldo:** `GitHub` (Repositorios Privados). Actúa como bóveda de seguridad absoluta para el código fuente.

---

## 4. Estructura Multi-Tenant (Aislamiento de Bases de Datos)
El sistema pasará de un único archivo JSON a una tabla SQL robusta en Supabase.
* **El Reto:** 100 empresas usarán la misma aplicación simultáneamente sin que sus datos se crucen jamás.
* **La Solución (Row Level Security):** Cada registro de empleado tendrá una columna `company_id`. Al iniciar sesión, las políticas de seguridad de Supabase filtrarán de forma matemática los datos. Es **físicamente imposible** que un cliente vea a los empleados de otro, garantizando confidencialidad total.

---

## 5. Personalización (Marca Blanca o "White-Label")
Los clientes pagan por sentirse dueños de su plataforma. 
* Existirá una tabla en la base de datos llamada `empresas` con columnas clave: `nombre_empresa`, `logo_url`, `color_principal`, `color_secundario`.
* Al detectar de qué empresa es el usuario, el motor de Next.js inyectará dinámicamente estos colores en el sistema de diseño (botones, fondos, líneas).
* Para el usuario final, la herramienta sentirá que fue programada exclusivamente para ellos.

---

## 6. Autenticación y Sistema de Roles
Se abandonará la "contraseña única maestra" por un sistema de identidad gestionado por Supabase Auth.
* **Super Administrador (Tú):** Tienes acceso a un "Panel Maestro" invisible para los clientes. Desde aquí creas, suspendes o eliminas cuentas de empresas según su pago de suscripción.
* **Administrador de Cliente (RRHH):** Es la cuenta que le entregas a tu cliente. Ellos inician sesión con su correo y contraseña, y gestionan (añaden, editan, borran) únicamente a su propio personal.

---

## 7. Subdominios y Estrategia de URL
Para entregar una experiencia premium, la estructura de la URL será el principal diferenciador comercial y se puede dividir en "Tiers" o niveles de cobro:

* **Tier 1 (Básico - Rutas dinámicas):** `organisaas.com/empresa-a`
  La forma más rápida y económica. Todos comparten el dominio principal separados por carpetas virtuales.
* **Tier 2 (Pro - Subdominios Wildcard):** `empresa-a.organisaas.com`
  El estándar de la industria SaaS. Configurado automáticamente a través de los Wildcard Domains de Vercel y un archivo `middleware.js` en Next.js. El cliente siente exclusividad.
* **Tier 3 (Premium - Dominios Personalizados):** `organigrama.empresa-a.com`
  Vercel permite conectar dominios de terceros a tu aplicación programáticamente. La marca OrganiSaaS desaparece por completo y el cliente tiene una herramienta "In-House" en su propio dominio web corporativo.

---

## 8. Estimación y Proyección de Costos
El consumo de recursos de una plataforma de texto e imágenes optimizadas es excepcionalmente bajo.

### Fase Inicial (Validación y Primeros Clientes)
* **Inversión Mensual:** **$0 / mes**
* **Límites de la Capa Gratuita:**
  * **Ancho de banda (Vercel):** 100 GB (Sobra el 98% para 100 empresas).
  * **Almacenamiento Texto (Supabase):** 500 MB (Capacidad para >2 millones de registros).
  * **Almacenamiento Fotos (Supabase):** 1 GB (Capacidad para >15,000 empleados).
* **Único Costo:** Compra del dominio principal (ej. `organisaas.com`) por ~$15 USD/año.

### Fase de Crecimiento y Rentabilidad (Plan Pro)
Una vez superados los límites de la capa gratuita, la actualización de infraestructura cuesta aproximadamente **$45 USD/mes** ($20 Vercel Pro + $25 Supabase Pro).
* Con un enfoque en PYMES de <30 empleados, puedes alojar literalmente a docenas o cientos de empresas, generando ingresos que superan astronómicamente el costo operativo del servidor.

---

## 9. Control de la Plataforma (Gobernanza)
* **Propiedad Total:** A pesar de tener a muchas empresas utilizando el software en sus propios dominios, tú mantienes **un único repositorio de código en GitHub**. Si corriges un error o añades una nueva función, todas las empresas del mundo reciben la actualización simultáneamente.
* **Monitoreo:** El Panel de Control Maestro te permitirá rastrear qué empresas están activas, cuántos empleados tienen registrados y la salud general del sistema, dándote control absoluto sobre tu infraestructura comercial.
