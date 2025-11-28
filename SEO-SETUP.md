# 🚀 Guía de Optimización SEO - Zeneidas Surf

## ✅ YA IMPLEMENTADO

### 1. Meta Tags Completos
- **Title**: "Zeneidas Surf - Santa Teresa Surf Camp | Surf, Yoga & Ice Baths in Costa Rica"
- **Description**: Optimizada con keywords "Santa Teresa surf camp"
- **Keywords**: 13 keywords relacionadas con surf en Santa Teresa
- **Open Graph** y **Twitter Cards** para redes sociales

### 2. Datos Estructurados (Schema.org)
- JSON-LD implementado con información de negocio
- Google puede mostrar rich snippets en resultados
- Ubicación, servicios, amenidades incluidas

### 3. Hero Section con H1
- H1 principal: "Santa Teresa Surf Camp"
- Subtitle con "Zeneidas Surf" y keywords
- Video de fondo para engagement

### 4. Sitemap y Robots.txt
- `/sitemap.xml` - Generado automáticamente
- `/robots.txt` - Configurado para indexación óptima
- Soporte multiidioma (ES/EN)

### 5. Alt Text Optimizado
- Todas las imágenes tienen alt text descriptivo
- Incluyen keywords: "Santa Teresa surf camp", "Costa Rica", etc.
- Mejora accesibilidad y SEO

### 6. URLs Canónicas
- Configuradas para ES/EN
- Evita contenido duplicado

---

## 📋 PRÓXIMOS PASOS (Hazlo tú)

### 1. Google Search Console (IMPORTANTE)
**¿Qué es?** Herramienta gratuita de Google para monitorear tu sitio.

**Pasos:**
1. Ve a: https://search.google.com/search-console
2. Clic en "Agregar propiedad"
3. Ingresa: `https://surfcampwidget.duckdns.org`
4. Google te dará un código de verificación
5. **Agrégalo aquí:**
   - Archivo: `app/layout.tsx`
   - Línea 72-75 (está comentado)
   - Reemplaza `'tu-codigo-de-verificacion'` con el código real

```typescript
verification: {
  google: 'TU-CODIGO-AQUI',  // ← Pega el código aquí
},
```

6. Guarda y haz deploy
7. Vuelve a Google Search Console y verifica
8. Envía el sitemap: `https://surfcampwidget.duckdns.org/sitemap.xml`

### 2. Google Business Profile
**¿Por qué?** Aparece en Google Maps y búsquedas locales.

**Pasos:**
1. Ve a: https://business.google.com
2. Clic "Administrar ahora"
3. Completa información:
   - Nombre: **Zeneidas Surf**
   - Categoría: **Escuela de surf**
   - Dirección: Santa Teresa, Puntarenas, Costa Rica
   - Teléfono: +541153695627
   - Sitio web: https://surfcampwidget.duckdns.org

4. Agrega fotos de:
   - Surf
   - Alojamiento
   - Actividades
   - Logo

5. Pide reviews a tus clientes

### 3. Google Analytics (Opcional pero recomendado)
**¿Para qué?** Ver cuántas personas visitan tu sitio.

**Pasos:**
1. Ve a: https://analytics.google.com
2. Crea una propiedad
3. Obtendrás un código "GA4"
4. Instálalo con:

```bash
npm install @next/third-parties
```

5. Agrega en `app/layout.tsx`:

```typescript
import { GoogleAnalytics } from '@next/third-parties/google'

// Dentro del <body>
<GoogleAnalytics gaId="G-TU-ID-AQUI" />
```

### 4. Optimización de Imágenes
**Reduce el tamaño sin perder calidad:**

```bash
# Instala herramienta de optimización
npm install -D next-image-export-optimizer

# O usa este servicio online:
# https://tinypng.com (arrastra tus fotos ahí)
```

**Objetivo:** Todas las fotos < 500KB

### 5. Backlinks (Enlaces externos)
**Conseguir que otros sitios enlacen al tuyo:**

- Directorios de turismo:
  - TripAdvisor
  - Booking.com
  - Airbnb Experiences
  - Costa Rica tourism boards

- Bloggers de surf/viajes:
  - Contacta bloggers que escriban sobre Santa Teresa
  - Ofrece estadía gratis a cambio de review + link

- Redes sociales:
  - Instagram: @zeneidas.surf (ya está en Schema)
  - Facebook page con link al sitio
  - YouTube con videos de surf

### 6. Contenido Regular
**Agrega blog posts (opcional):**
- "Mejores spots de surf en Santa Teresa"
- "Qué llevar a un surf camp en Costa Rica"
- "Beneficios del ice bath después del surf"

Esto atrae más visitas y mejora SEO.

---

## 📊 MONITOREO

### Cada semana revisa:
1. **Google Search Console**
   - ¿Cuántos clicks?
   - ¿Qué búsquedas te encuentran?
   - ¿Hay errores?

2. **Google Analytics** (si lo instalaste)
   - Visitantes totales
   - De dónde vienen
   - Qué páginas visitan más

### Keywords objetivo:
Deberías rankear alto para:
- ✅ "Santa Teresa surf camp"
- ✅ "Santa Teresa surf"
- ✅ "surf camp Costa Rica"
- ✅ "surf lessons Santa Teresa"
- ✅ "yoga surf retreat Costa Rica"

---

## 🎯 RESULTADOS ESPERADOS

**En 1-2 semanas:**
- Google empieza a indexar tu sitio
- Apareces en búsquedas de "Zeneidas Surf"

**En 1-2 meses:**
- Rankeas para "Santa Teresa surf camp"
- Empiezas a recibir tráfico orgánico

**En 3-6 meses:**
- Top 3 en búsquedas locales
- Rich snippets con estrellas (si tienes reviews)
- Apareces en Google Maps

---

## ❓ AYUDA

Si tienes dudas:
1. Revisa este documento
2. Busca tutoriales en YouTube: "Google Search Console tutorial"
3. Usa ChatGPT/Claude para preguntas específicas

## 🔗 LINKS ÚTILES

- Google Search Console: https://search.google.com/search-console
- Google Business: https://business.google.com
- Google Analytics: https://analytics.google.com
- TinyPNG (optimizar fotos): https://tinypng.com
- Revisar SEO: https://web.dev/measure/

---

**¡Todo listo! El sitio está optimizado. Ahora solo falta conectar con Google y empezar a recibir visitas. 🚀**
