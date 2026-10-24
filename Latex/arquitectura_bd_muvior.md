# Arquitectura de la Base de Datos: Muvior App

Este documento explica de forma detallada cómo está estructurada la base de datos de la aplicación **Muvior** (SQLite) y cómo funciona el sistema de turnos en tiempo real mediante tablas relacionales.

## 1. El Cerebro del Sistema: SQLite

La aplicación utiliza una base de datos relacional ligera llamada **SQLite**. Todo el contenido, los perfiles y los turnos se guardan en un archivo local llamado `muvior.db` en el backend.

## 2. Las Tres Tablas Principales

La base de datos está normalizada y conformada por tres tablas interconectadas que manejan toda la lógica de la aplicación: `users` (Usuarios), `businesses` (Negocios) y `appointments` (Turnos/Citas).

### A. Tabla: `users` (Usuarios)

Esta tabla almacena a todas las personas que interactúan con la aplicación. Es una tabla unificada que maneja tanto a los clientes normales como a los dueños de negocios mediante roles.

- `id`: Identificador único (Primary Key).
- `email`: Correo electrónico (Único, usado para el login).
- `password`: Contraseña.
- `name`: Nombre completo de la persona.
- `role`: Define los permisos. Puede ser `"dueño"` (quien administra un negocio) o `"cliente"` (quien hace las filas).

### B. Tabla: `businesses` (Negocios)

Esta tabla alberga la información de los establecimientos físicos (barberías, spa, etc.). Cada negocio *le pertenece* a un usuario registrado con rol de "dueño".

- `id`: Identificador único del negocio (Primary Key).
- `owner_id`: **(Clave Foránea)** Hace referencia al `id` del dueño en la tabla `users`. Un dueño puede tener varios locales (Ej: "Carlos Cuts Branch 2").
- `username`: Un arroba o alias único para la URL del perfil del local.
- `name`: Nombre comercial.
- `description`: Detalles del negocio.
- `location`: Ciudad o dirección.
- `category`: El tipo de servicio (ej. "Barbería", "Uñas").
- `image_url`: Un link a la foto de portada del local.
- `distance`: Un texto simulando a qué distancia se encuentra geográficamente del cliente actual.

### C. Tabla: `appointments` (El Motor de los Turnos)

**Aquí reside la magia del conteo dinámico.** Esta tabla registra el historial de interacciones cuando un `cliente` decide sacar un turno en un `negocio`.

- `id`: Identificador único del turno (Ticket).
- `business_id`: **(Clave Foránea)** Hace referencia al negocio donde se sacó el turno.
- `user_id`: **(Clave Foránea)** Hace referencia al cliente que está esperando en la cola.
- `status`: El estado actual del turno. Por defecto es `'waiting'` (esperando). Otros estados pueden ser `'in_progress'`, `'completed'` o `'cancelled'`.
- `created_at`: La fecha y hora exacta en la que se tomó el turno.

## 3. ¿Cómo se calcula cuánto mide la fila ("En cola")?

Para evitar desincronizaciones y no tener números falsos flotando en el código, la aplicación **no guarda estáticamente "5 en cola" en la tabla del negocio.**

En su lugar, la magia ocurre a nivel de API (`main.py`) mediante una consulta SQL optimizada con sub-queries.

Cada vez que abres la aplicación móvil, el servidor de Python ejecuta la siguiente lógica en la base de datos:

```sql
SELECT b.*, 
  (SELECT COUNT(*) FROM appointments a WHERE a.business_id = b.id AND a.status = 'waiting') as queue_size
FROM businesses b;
```

**Explicación del proceso paso a paso:**

1. Traer todos los negocios (`b.*`).
2. Por cada negocio encontrado, hacer un conteo rápido (`COUNT(*)`) en la tabla `appointments` (`a`).
3. La condición del conteo es estricta: Solo sumar los turnos que pertenezcan a este negocio específico (`a.business_id = b.id`) **y** cuyo estado siga siendo de espera (`a.status = 'waiting'`).
4. El resultado final del conteo de cada negocio se empaqueta en una variable o campo temporal llamado `queue_size` y se envía al frontend (React Native).

## 4. El Ciclo de Vida de los Datos

Al usar este modelo relacional:

- Si un nuevo cliente presiona "Sacar Turno" en la app móvil, simplemente se hace un `INSERT` de un nuevo récord en `appointments` con el estado en `'waiting'`. Como el volumen subió, el `COUNT()` devolverá un número mayor la próxima vez y todos los clientes lo verán en sus celulares.
- Cuando el dueño del negocio termina de atender a alguien y presiona "Siguiente" en su panel, el sistema hace un `UPDATE` cambiando el `status` de ese cliente de `'waiting'` a `'completed'`. Esto significa que dejará de ser contado y mágicamente el número de personas "En cola" en la app principal disminuirá instantáneamente.
