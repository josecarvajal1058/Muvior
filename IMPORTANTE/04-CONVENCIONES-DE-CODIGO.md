# 💻 04: CONVENCIONES DE CÓDIGO

Reglas sobre cómo escribir y organizar el código para que sea legible y mantenible.

---

## 🗣️ Lenguaje y Tono

- **Código Base:** Nombres de variables, funciones y clases siempre en **Inglés** (ej: `fetchBusinesses`, `handleLogin`).
- **Contenido UI:** Todo el texto visible para el usuario debe ser en **Español Dominicano** coherente (ej: "Tomar turno", "Locales cerca de ti").
- **Regla Estricta de Comentarios:**
  - **NUNCA** usar inglés en los comentarios, ni siquiera al generar código automático.
  - **NUNCA** comentar el código por defecto "para explicar todo". Evita la sobre-documentación.
  - Solo comenta lógica que sea genuinamente compleja o vital.
  - El estilo del comentario debe ser el de apuntes personales de un "programador técnico universitario": breve, al grano, como un recordatorio para uno mismo del *por qué* se hizo así, no del *qué* hace (ej. `// Se usa timeout provisional por latencia del túnel loca.lt`).

---

## 📁 Organización de Archivos

- **Constants:** No definir colores o fuentes directamente en los componentes. Usar `src/constants/theme.ts`.
- **Hooks:** Lógica compleja de fetching o estados globales debe vivir en `/hooks`.
- **Components:** Crear componentes atómicos para elementos repetitivos (Cards, Badges, Buttons).

---

## 🤖 Reglas Generales para la IA

1. **Academic Rigor:** Evitar datos de prueba genéricos como "Business A". Usar nombres creativos y realistas.
2. **Atomic Commits:** Si una tarea es grande, documentar cada paso en `task.md`.
3. **No Placeholders:** Prohibido dejar comentarios `// TODO` o funciones vacías. Si lo escribes, debe ser funcional.
4. **Respeto al Plan:** Antes de codear, proponer el plan y esperar aprobación del usuario.
