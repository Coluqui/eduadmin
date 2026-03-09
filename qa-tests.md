# QA Tests — EduAdmin
> Última actualización: 2026-03-09 · Criterio de aceptación: ≥ 90% de tests en ✅ para release

---

## 1. Autenticación

### QA-AUTH-01: Login con credenciales correctas
**Pasos:**
1. Abrir la app en `/` o `#login`
2. Ingresar email: `director@agustinalvarez.edu.ar`
3. Ingresar la contraseña correcta
4. Hacer clic en "Iniciar sesión"

**Resultado esperado:**
- Redirección inmediata al Dashboard
- El sidebar muestra el nombre y rol del usuario
- Toast de bienvenida visible

**Estado:** ⏳ Pendiente

---

### QA-AUTH-02: Login con contraseña incorrecta
**Pasos:**
1. Abrir `#login`
2. Ingresar email: `director@agustinalvarez.edu.ar`
3. Ingresar contraseña incorrecta: `wrongpass`
4. Hacer clic en "Iniciar sesión"

**Resultado esperado:**
- Permanece en la página de login
- Se muestra banner de error con mensaje descriptivo
- No se navega al dashboard

**Estado:** ⏳ Pendiente

---

### QA-AUTH-03: Login con email inexistente
**Pasos:**
1. Abrir `#login`
2. Ingresar email: `noexiste@escuela.edu.ar`
3. Ingresar cualquier contraseña
4. Hacer clic en "Iniciar sesión"

**Resultado esperado:**
- Permanece en la página de login
- Banner de error visible
- No se navega al dashboard

**Estado:** ⏳ Pendiente

---

### QA-AUTH-04: Cerrar sesión y restricción de vuelta atrás
**Pasos:**
1. Iniciar sesión correctamente
2. Navegar al Dashboard
3. Hacer clic en el avatar del usuario → "Cerrar sesión"
4. Confirmar en el modal
5. Presionar el botón "Atrás" del navegador

**Resultado esperado:**
- Redirección al login luego de cerrar sesión
- El botón Atrás no devuelve al dashboard (el usuario permanece en login o muestra login)
- No se puede ver contenido protegido sin autenticarse de nuevo

**Estado:** ⏳ Pendiente

---

## 2. Roles y Menú lateral

### QA-ROLES-01: Rol super_admin — menú completo
**Pasos:**
1. Iniciar sesión como `director@agustinalvarez.edu.ar` (rol: `super_admin`)
2. Observar el sidebar

**Resultado esperado:**
Sidebar muestra exactamente:
- ✅ Dashboard
- ✅ Alumnos
- ✅ Analíticos
- ✅ Usuarios
- ✅ Configuración

**Estado:** ⏳ Pendiente

---

### QA-ROLES-02: Rol secretaria — menú parcial
**Pasos:**
1. Iniciar sesión con un usuario de rol `secretaria`
2. Observar el sidebar

**Resultado esperado:**
- ✅ Dashboard
- ✅ Alumnos
- ✅ Analíticos
- ❌ Usuarios (no debe aparecer)
- ❌ Configuración (no debe aparecer)

**Estado:** ⏳ Pendiente

---

### QA-ROLES-03: Rol atencion — menú mínimo
**Pasos:**
1. Iniciar sesión con un usuario de rol `atencion`
2. Observar el sidebar

**Resultado esperado:**
- ✅ Dashboard
- ✅ Alumnos
- ❌ Analíticos (no debe aparecer)
- ❌ Usuarios (no debe aparecer)
- ❌ Configuración (no debe aparecer)

**Estado:** ⏳ Pendiente

---

### QA-ROLES-04: Rol director — menú parcial
**Pasos:**
1. Iniciar sesión con un usuario de rol `director`
2. Observar el sidebar

**Resultado esperado:**
- ✅ Dashboard
- ✅ Alumnos
- ✅ Analíticos
- ❌ Usuarios (no debe aparecer)
- ❌ Configuración (no debe aparecer)

**Estado:** ⏳ Pendiente

---

### QA-ROLES-05: Sin sesión — acceso bloqueado
**Pasos:**
1. Asegurarse de no tener sesión activa
2. Intentar navegar directamente a `#dashboard`
3. Intentar navegar a `#analiticos`
4. Intentar navegar a `#usuarios`

**Resultado esperado:**
- Redirección automática a `#login` en todos los casos
- No se muestra contenido protegido

**Estado:** ⏳ Pendiente

---

## 3. Aislamiento entre escuelas

### QA-ISO-01: Un usuario sólo ve datos de su institución
**Pasos:**
1. Iniciar sesión como usuario del Agustín Álvarez
2. Navegar a Alumnos
3. Verificar que todos los alumnos pertenecen a esa escuela
4. Navegar a Analíticos
5. Verificar que todos los analíticos corresponden a alumnos de esa escuela

**Resultado esperado:**
- No aparecen alumnos ni analíticos del Tomás Godoy Cruz ni de ninguna otra institución
- Los datos están fielmente filtrados por `institution_id` en Supabase (RLS)

**Estado:** ⏳ Pendiente

---

### QA-ISO-02: No se puede acceder a recursos de otra escuela por URL directa
**Pasos:**
1. Iniciar sesión como usuario del Agustín Álvarez
2. Obtener el ID de un analítico del Tomás Godoy Cruz
3. Navegar a `#analiticos/{id_de_otra_escuela}`

**Resultado esperado:**
- Pantalla de "No encontrado" o "Sin acceso"
- No se muestran datos de la otra institución

**Estado:** ⏳ Pendiente

---

## 4. Analíticos — flujo de estados

### QA-ANA-01: Crear analítico en borrador
**Pasos:**
1. Iniciar sesión como secretaria
2. Ir a Analíticos → "Nuevo analítico"
3. Completar el wizard (7 pasos) con datos válidos
4. Hacer clic en "Crear analítico"

**Resultado esperado:**
- El analítico aparece en el listado con estado `Borrador`
- Se redirige al detalle del analítico recién creado

**Estado:** ⏳ Pendiente

---

### QA-ANA-02: Enviar analítico a revisión
**Pasos:**
1. Abrir un analítico en estado `Borrador`
2. Hacer clic en "Enviar a revisión"

**Resultado esperado:**
- El estado cambia a `En revisión`
- El historial registra la transición con usuario y timestamp correcto

**Estado:** ⏳ Pendiente

---

### QA-ANA-03: Director aprueba un analítico
**Pasos:**
1. Iniciar sesión como director/super_admin
2. Abrir un analítico en estado `En revisión`
3. Hacer clic en "Aprobar analítico"

**Resultado esperado:**
- El estado cambia a `Aprobado`
- El historial registra la aprobación con usuario y timestamp

**Estado:** ⏳ Pendiente

---

### QA-ANA-04: Director devuelve un analítico con observación
**Pasos:**
1. Iniciar sesión como director/super_admin
2. Abrir un analítico en estado `En revisión`
3. Hacer clic en "Devolver con observación"
4. Escribir una observación en el modal
5. Confirmar

**Resultado esperado:**
- El estado cambia a `Devuelto`
- La observación aparece en el historial
- El banner de "Devuelto" muestra el texto de la observación en la vista de detalle

**Estado:** ⏳ Pendiente

---

### QA-ANA-05: Historial de cambios inmutable
**Pasos:**
1. Realizar dos o más transiciones en un analítico (borrador → revisión → aprobado)
2. Ver el historial en el panel derecho del detalle

**Resultado esperado:**
- Cada transición aparece listada en orden cronológico descendente
- Cada entrada muestra: acción, usuario responsable y timestamp
- No hay entradas faltantes ni duplicadas

**Estado:** ⏳ Pendiente

---

## 5. Alumnos

### QA-ALU-01: Buscar alumno por nombre
**Pasos:**
1. Ir a Alumnos
2. Escribir el nombre completo o parcial de un alumno conocido
3. Ver los resultados

**Resultado esperado:**
- La lista filtra en tiempo real y muestra solo alumnos cuyo nombre coincide
- Si no hay coincidencias, se muestra el estado vacío con mensaje orientador

**Estado:** ⏳ Pendiente

---

### QA-ALU-02: Buscar alumno por DNI
**Pasos:**
1. Ir a Alumnos
2. Escribir el DNI de un alumno conocido

**Resultado esperado:**
- La lista muestra al alumno cuyo DNI coincide
- El resultado incluye nombre, curso y estado del analítico

**Estado:** ⏳ Pendiente

---

### QA-ALU-03: Ver legajo completo de un alumno
**Pasos:**
1. Ir a Alumnos
2. Hacer clic en el ícono de ojo de cualquier alumno

**Resultado esperado:**
- Se navega al detalle del alumno
- Se muestran: datos personales, DNI, fecha de nacimiento, año de egreso, curso
- Se listan los analíticos asociados al alumno

**Estado:** ⏳ Pendiente

---

## 6. Configuración y permisos

### QA-CFG-01: Solo super_admin accede a Configuración
**Pasos:**
1. Iniciar sesión como `super_admin`
2. Navegar a `#configuracion`

**Resultado esperado:**
- Se muestra la página de Configuración correctamente
- El sidebar muestra la opción "Configuración" activa

**Estado:** ⏳ Pendiente

---

### QA-CFG-02: Rol atencion no puede acceder a Configuración
**Pasos:**
1. Iniciar sesión con rol `atencion`
2. Intentar navegar directamente a `#configuracion`

**Resultado esperado:**
- Se muestra la pantalla de "Sin permisos" o redirección
- El sidebar NO muestra la opción "Configuración"
- No se visualiza ningún dato sensible de configuración

**Estado:** ⏳ Pendiente

---

## 7. Supabase y conectividad

### QA-SUP-01: Los datos del dashboard vienen de Supabase
**Pasos:**
1. Iniciar sesión correctamente
2. Ir al Dashboard
3. Verificar las métricas (analíticos en proceso, aprobados, con problemas, total alumnos)
4. Crear un nuevo analítico y volver al Dashboard

**Resultado esperado:**
- Los contadores reflejan el estado real de la base de datos
- Al crear un analítico, el contador "En proceso" sube en 1

**Estado:** ⏳ Pendiente

---

### QA-SUP-02: Comportamiento sin conexión a Supabase
**Pasos:**
1. Cortar la conexión a internet o revocar temporalmente las credenciales de Supabase
2. Intentar iniciar sesión

**Resultado esperado:**
- La app muestra un mensaje de error amigable (no pantalla en blanco, no stack trace)
- El botón de login vuelve a su estado normal para reintentar

**Estado:** ⏳ Pendiente

---

## Resumen de cobertura

| Sección            | Total tests | ✅ Pasan | ❌ Fallan | ⏳ Pendientes |
|--------------------|-------------|----------|-----------|---------------|
| Autenticación      | 4           | 0        | 0         | 4             |
| Roles y menú       | 5           | 0        | 0         | 5             |
| Aislamiento        | 2           | 0        | 0         | 2             |
| Analíticos         | 5           | 0        | 0         | 5             |
| Alumnos            | 3           | 0        | 0         | 3             |
| Configuración      | 2           | 0        | 0         | 2             |
| Supabase           | 2           | 0        | 0         | 2             |
| **TOTAL**          | **23**      | **0**    | **0**     | **23**        |
