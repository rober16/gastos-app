# 💰 Mis Gastos — Personal Finance App

Aplicación web de gestión de gastos personales, accesible desde cualquier dispositivo con conexión a internet. Permite registrar ingresos y gastos mensuales organizados por categorías, visualizar el saldo disponible en tiempo real y analizar el gasto con gráficos interactivos.

---

## ✨ Funcionalidades

- 🔐 **Autenticación segura** con email y contraseña (Supabase Auth + JWT)
- 💼 **Registro de ingresos** — sueldo, trabajos extra y cobros de deudas
- 💸 **Registro de gastos** en 9 categorías con íconos (tarjetas de crédito, obra social, AFIP/monotributo, transporte, cafeterías, salidas sociales, kiosco/supermercado, servicios e internet, otros)
- ✏️ **Editar y eliminar** ingresos y gastos después de cargarlos
- 📊 **Dashboard** con resumen mensual: total ingresos, total gastos y saldo disponible
- 📈 **Gráficos** de torta y barras por categoría con porcentajes sobre el total
- 🗓️ **Filtro por mes** para consultar cualquier período histórico
- 📱 **Diseño responsive** optimizado para mobile, tablet y desktop

---

## 🛠️ Stack tecnológico

| Capa | Tecnología | Hosting |
|---|---|---|
| Frontend | React 18 + Vite | Vercel |
| Backend | Node.js + Express | Render |
| Base de datos | PostgreSQL | Supabase |
| Autenticación | Supabase Auth (JWT) | Supabase |

### Librerías principales

**Frontend**
- `@supabase/supabase-js` — cliente de autenticación y sesión
- `axios` — cliente HTTP con interceptor JWT automático
- `recharts` — gráficos de torta y barras
- `react-router-dom` — navegación SPA con rutas protegidas

**Backend**
- `express` — servidor HTTP y definición de rutas REST
- `pg` — cliente PostgreSQL para Node.js
- `cors` — habilitación de requests entre dominios
- `dotenv` — manejo de variables de entorno

---

## 🔒 Seguridad

La aplicación implementa defensa en múltiples capas:

- **Row Level Security (RLS)** en Supabase — cada usuario solo puede ver y modificar sus propios datos, filtrado directamente en la base de datos
- **Middleware JWT** en el backend — cada endpoint verifica el token antes de ejecutar cualquier operación
- **PrivateRoute** en el frontend — redirige al login si no hay sesión activa
- **HTTPS** automático en Vercel y Render
- **Variables de entorno** — ningún secreto expuesto en el código fuente

---

## 📁 Estructura del proyecto

```
gastos-app/
├── gastos-backend/
│   ├── index.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── expenses.js
│   │   └── incomes.js
│   └── package.json
└── gastos-frontend/
    ├── src/
    │   ├── components/
    │   │   └── Spinner.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   └── DashboardPage.jsx
    │   ├── api.js
    │   ├── categories.js
    │   ├── supabaseClient.js
    │   └── main.jsx
    └── package.json
```
| Frontend | Vercel | `gastos-frontend` |

Cada `git push` a la rama `main` redespliega ambos servicios automáticamente.
