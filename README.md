# Brow Atelier · Demo

Demo del sitio de Brow Atelier (Santa Ana, Costa Rica) con agenda en línea simulada por servicio y subpágina de venta de la Academy.

## Archivos

- `index.html`: home (servicios, resultados, testimonios, precios, resumen de la Academy, FAQ, contacto)
- `academia.html`: página de venta del Método Naturale Brows con agenda de llamada informativa
- `styles.css`: estilos compartidos
- `app.js`: agenda simulada, WhatsApp, animaciones, menú, FAQ y galería

## Configuración

En `app.js`:

- `WA_NUMBER` y `WA_MSG`: número y mensajes de WhatsApp
- `BOOKING.calendars`: días y horarios de cada agenda (Nicole, Luis, llamadas Academy)
- `BOOKING.services`: servicios, precios, duración y especialista
- `BOOKING.demo`: en `true` muestra la etiqueta "Modo demo"

Las imágenes se cargan desde `browateliercr.com/images/`.
