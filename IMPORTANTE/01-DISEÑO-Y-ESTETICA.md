# 🎨 01: DISEÑO Y ESTÉTICA PROFESIONAL

Este documento define la identidad visual de Muvior. El objetivo es que la aplicación se sienta **Premium, Moderna y Dominicana**.

---

## 🎨 Paleta de Colores (Design Tokens)

| Token | Color (HEX) | Uso Principal |
| :--- | :--- | :--- |
| **Colors.core.tint** | `#d9320d` (Orange) | Acciones primarias, botones, indicadores de carga, estados activos. |
| **Colors.core.background** | `#1E1E1E` | Fondo principal oscuro, profundidad. |
| **Colors.core.card** | `#2C2C2C` | Superficies de contenedores, tarjetas de negocios. |
| **Colors.core.text** | `#F5F5F5` | Texto principal (alto contraste). |
| **Colors.core.textSecondary** | `#999999` | Subtítulos, hints, texto desactivado. |

---

## ⏳ Estados de Carga (Spinners)

**Queda estrictamente prohibido el uso de colores por defecto (gris, blanco o azul) para los estados de carga.**

1. **ActivityIndicator:** Siempre debe llevar `color={Colors.core.tint}`.
2. **Skeleton Screens:** Si se implementan, deben seguir la paleta de grises del `card` y `background`.
3. **Carga Inicial:** Debe ser fluida y centrada, siempre reflejando el color naranja de la marca.

---

## ⌨️ Inputs y Formularios (Focus Management)

En la web, los navegadores añaden anillos de enfoque (focus rings) que rompen la estética oscura de Muvior.

- **Regla:** Todos los `TextInput` deben tener `outlineStyle: 'none'` cuando se detecta plataforma web.
- **Feedback Visual:** El feedback de foco debe hacerse mediante cambios sutiles en el `borderColor` usando `Colors.core.tint` o `Colors.core.border`.

---

## 📐 Espaciados y Radios

- **BorderRadius:** El radio estándar para tarjetas y botones es `10` a `16`. No usar bordes rectos.
- **Padding:** Mantener márgenes consistentes de `16` o `24` para el contenido principal.
- **Coherencia:** Si una sección usa un espaciado inter-elemento de `12`, todas las secciones similares del mismo nivel deben respetarlo.

---

## ✨ Micro-interacciones

- **Botones:** Siempre usar `activeOpacity={0.8}` o similar para dar feedback táctil.
- **Transiciones:** Preferir `slide_from_right` para navegación entre pantallas para una sensación de continuidad.
