# V11.3.1 — Volver al fondo blanco

Se elimina la foto de playa del fondo general del Home y ProductPage y se conserva íntegra en el carrusel/hero editable. Favoritos, categorías y fondo de producto quedan blancos, con un escenario neutro claro detrás de la foto real del producto y las transiciones editoriales verdes opacas.

No se modifica backend, stock, variantes, galerías, carrito, WhatsApp, base MySQL, uploads ni admin.

Desplegar en Hostinger con Node 22, `npm install`, `npm run build` y entrada `server.js`, preservando variables de entorno, uploads persistentes y base de datos. No ejecutar seeds ni reseteos. Hacer respaldo y probar en staging.
