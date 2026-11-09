# Presentaciones de Seguridad · U.M. Pallancata – Selene

Presentaciones web interactivas con estilo Hochschild para las reuniones de la unidad.
**Funcionan sin internet**: todas las librerías, fuentes e imágenes están dentro de esta carpeta.

## Cómo abrir
- En línea: el sitio desplegado en Vercel desde este repositorio.
- Sin internet: descargar el repositorio (Code → Download ZIP), extraer y doble clic en `index.html`.

La página de inicio muestra carpetas; cada carpeta agrupa sus presentaciones. Para agregar una presentación o carpeta, editar `data/catalogo.js`.

| Tecla | Acción |
|---|---|
| → / Espacio / clic | Siguiente lámina |
| ← | Lámina anterior |
| F | Pantalla completa |
| O | Ver todas las láminas e ir a cualquiera |
| E | Modo edición: textos, cifras, imágenes y datos de gráficos (se actualizan en vivo) |
| M | Modo mover: arrastrar elementos, esquina dorada para el tamaño, flechas para ajuste fino |
| P | Guardar PDF (en el diálogo elegir «Guardar como PDF») |

El minero 3D (solo en la página de inicio) se puede girar arrastrándolo; con un clic saluda.

## Guardado en la nube (Supabase)
- Edición libre: no hay inicio de sesión. Todo lo que se edita (textos, cifras, gráficos, imágenes, posiciones, láminas ocultas) se guarda solo en la nube y todos lo ven al abrir.
- Botón **☁ Guardado**: muestra el estado y permite **restaurar una versión anterior** (se guardan las últimas 300 por presentación).
- Sin internet sigue funcionando con lo guardado en el equipo y sube los cambios cuando vuelve la conexión.
- Configuración en `data/nube.js`; estructura de la base en `supabase/instalar.sql`.

## Sin internet en el dominio
- Al abrir el sitio una vez con internet, se guarda todo en el navegador (páginas, gráficos, fuentes, imágenes y la última versión de la nube).
- Si luego se va el internet, el mismo link sigue abriendo y se puede presentar y editar; los cambios se suben solos al volver la conexión.
- Al subir cambios al repositorio: ejecutar `python3 tools/gen-sw.py` para actualizar la lista de archivos (sw.js).

## Presentar con proyector (HDMI)
1. Conectar el HDMI y pulsar **Windows + P** → **Duplicar** (lo más seguro: se ve lo mismo en la laptop y el proyector).
   Si usa **Extender**, arrastre la ventana del navegador a la pantalla del proyector antes de pulsar F.
2. Abrir la presentación y pulsar **F** (o F5 del control remoto) para pantalla completa.
3. Se adapta sola a cualquier resolución (1024×768, 1280×800, 1366×768, 1920×1080, 4K): si el proyector es 4:3 aparecen franjas negras arriba y abajo, sin cortar nada.
4. Control remoto (clicker): avanza con Av Pág / Re Pág o flechas. **B** o **.** = pantalla negra, **W** = pantalla blanca; cualquier tecla vuelve.
5. El cursor y la barra se ocultan solos; la pantalla no se apaga mientras la presentación está abierta.
6. Funciona sin internet. Probado también con la computadora a 1/4 de su velocidad: las animaciones siguen fluidas.

## Llevarla en USB para presentar
1. Copiar **toda la carpeta `presentaciones`** al USB (no solo el .html: necesita `assets/` y `data/`).
2. En la otra PC: abrir el USB y doble clic en `index.html` o en `csst-noviembre-2026.html`. No necesita internet ni instalar nada.
3. Recomendado: Chrome o Edge, tecla **F** para pantalla completa.

## Editar y que los cambios viajen en el USB
- Tecla **E** (o botón ✎ Editar): clic en cualquier texto o cifra y escribir. Las cifras siguen animándose con el valor nuevo y los medidores, barras y anillos se ajustan solos.
- Gráficos: en modo edición, botón **✎ Datos del gráfico** para cambiar meses, áreas y valores.
- Imágenes (Momento de seguridad, fotos de eventos): en modo edición, clic en el recuadro para elegir archivo, arrastrar la imagen o pegarla con Ctrl+V.
- Comentarios oscuros: en modo edición, botón «🚫 Ocultar comentario» / «👁 Mostrar comentario» encima de cada uno. Los ocultos no salen al presentar ni en el PDF.
- Ocultar láminas: botón **Láminas** (tecla O) → 🚫 Ocultar / 👁 Mostrar. Las ocultas no salen al presentar ni en el PDF.
- Los cambios se guardan solos **en ese navegador**. Para llevarlos a otra PC: **💾 Guardar cambios** descarga `csst-2026-11-cambios.js`; copiarlo en la carpeta `data/` del USB (reemplazando si existe). Al abrir en cualquier PC, los cambios ya aparecen.
- **📂 Abrir** carga un archivo de cambios sin copiarlo a `data/`.

## Presentaciones
| Archivo | Reunión | Fuente de datos |
|---|---|---|
| `csst-noviembre-2026.html` | Reunión ordinaria CSST · noviembre 2026 (resultados de octubre) | PPT CSST, cifras de octubre e informes de eventos ATP 01, INC 09 e INC 10 |
| `gum-octubre-2026.html` | Reunión GUM · hallazgos y OTO · octubre 2026 | Safety HOC (ConsultaEvento, OTOListaExcel) y programa OTO corregido |

## Estructura
```
index.html                 inicio con el minero 3D
csst-noviembre-2026.html   presentación CSST
data/*-cambios.js          ediciones guardadas con «Guardar cambios» (opcional)
gum-octubre-2026.html      presentación GUM
data/gum-data.js           cifras de la presentación GUM
assets/css/deck.css        estilo Hochschild (colores, tipografía, impresión)
assets/js/deck.js          motor: transiciones, animaciones, edición, PDF
assets/js/miner3d.js       minero 3D (Three.js)
assets/js/charts.js        tema de gráficos (Chart.js)
assets/js/csst*.js, gum*.js contenido y gráficos de cada presentación
assets/lib/                three.js, gsap, chart.js (sin red)
assets/fonts/              Montserrat
assets/img/                fotos y logos del PPT original
```

## Crear la presentación del próximo mes
1. Copiar `csst-noviembre-2026.html` (o la de GUM) con el nombre del nuevo mes.
2. Cambiar `data-deck="csst-2026-11"` y el nombre del archivo de cambios en el `<script src="data/...-cambios.js">` en `<body>` por el nuevo mes (así las ediciones no se mezclan).
3. Actualizar cifras en `assets/js/csst-build.js` / `csst.js` (CPI, eventos, inspecciones) o regenerar `data/gum-data.js`.
4. Agregar la tarjeta en `index.html`.

## Atributos útiles al editar el HTML
- `data-a="up|down|left|right|zoom|pop|fade|flip|grow|rise|blur"`: animación de entrada. `data-d=".3"` agrega retraso.
- `data-count="95.07" data-dec="2" data-suf="%"`: cifra que sube contando.
- `data-frag`: el elemento aparece con el siguiente clic.
- `data-transition="push|cube|zoom|fade|rise|flip"` en una `<section class="slide">`: transición de entrada.
- `data-miner="wave|point|thumbs|idle"`: minero 3D.
- `data-hidden` en una lámina: oculta por defecto.
- `.slot[data-slot]`: recuadro para pegar una imagen.
- `data-go="s-agenda"`: al hacer clic salta a esa lámina.

> Las presentaciones contienen datos internos con nombres de trabajadores. No publicarlas en un sitio abierto sin protección de acceso.
