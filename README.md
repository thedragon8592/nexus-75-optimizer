# Nexus 75 Optimizer

Extensión Chromium enfocada exclusivamente en rendimiento para **survev.io** y
**resurviv.biz**. No añade automatización, información oculta, alteraciones del
protocolo ni ventajas de juego.

Esta versión aplica optimizaciones que sí existen en el código actual de
ambos juegos:

- atlas de texturas de baja resolución;
- renderizado 1x opcional en pantallas HiDPI;
- desactivación opcional de sacudida de cámara y audio;
- reducción del trabajo visual del lobby mientras se juega;
- auto-tuner de cuatro segundos solo en el lobby, con resultado válido siete
  días y objetivo adaptado a la frecuencia real de pantalla;
- interfaz y monitor cargados únicamente al pulsar `F8`; al cerrarlos se detienen
  RAF, intervalos, observers y listeners propios;
- monitor ligero de FPS, 1% low, p95 de frame time y long tasks bajo demanda;
- perfil **Competitivo limpio**, con audio e interpolación preservados, panel en
  reposo durante la partida y medición de input→siguiente frame;
- monitor competitivo realmente dormido: detiene su RAF, observer, intervalos y
  muestreo mientras el panel está cerrado;
- región inteligente con lease de 72 horas: reutiliza la selección oficial y
  vuelve a medir al caducar o al cambiar de red, sin crear pings adicionales;
- región fija manual opcional usando la configuración oficial del juego;
- red ligera opcional mediante reglas MV3 nativas para publicidad y analytics
  observados, sin interceptar el WebSocket ni los paquetes del juego;
- perfiles Calidad, Equilibrado, Rendimiento, Competitivo y Extremo;
- restauración de la configuración original capturada.

No se reemplaza `requestAnimationFrame` por `setTimeout(1)`. Esa técnica,
popular en otros clientes, no crea fotogramas visibles adicionales y puede
aumentar el uso de CPU.

## Instalación de desarrollo

1. Abre `chrome://extensions` o `edge://extensions`.
2. Activa **Modo de desarrollador**.
3. Pulsa **Cargar descomprimida**.
4. Selecciona la carpeta `extension` de este proyecto.
5. Abre uno de los juegos y usa `F8` para mostrar u ocultar el panel.

Los cambios que afectan texturas o resolución se guardan y requieren recargar.
El botón **Aplicar y recargar** lo hace automáticamente.

## Estado

Esta es la base v0.4.0. Antes de afirmar ganancias concretas se debe ejecutar el
protocolo A/B descrito en [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) sobre
hardware real. El objetivo de 75 FPS está limitado por la frecuencia del monitor:
en una pantalla de 60 Hz el resultado correcto es 60 FPS estables, no callbacks
artificiales a 75.

Consulta [docs/RESEARCH.md](docs/RESEARCH.md) para el análisis técnico y las
fuentes revisadas.

Para reutilizar el núcleo en otro cliente o userscript, consulta
[docs/INTEGRATION.md](docs/INTEGRATION.md).

## Edición Tampermonkey

El archivo único `userscript/Nexus-75-Optimizer.user.js` contiene la edición
Tampermonkey bilingüe (inglés por defecto, español seleccionable), optimización
en `document-start`, panel abierto automáticamente y controlable con F8,
explicación integrada y una promoción en inglés de Nexus Chat que aparece cada
cinco aperturas y enlaza únicamente a la web oficial.

Las instrucciones y diferencias respecto a Manifest V3 están en
[docs/TAMPERMONKEY.md](docs/TAMPERMONKEY.md).

## Publicación con Render

El repositorio incluye un Blueprint `render.yaml` para publicar la edición
Tampermonkey como sitio estático. Render ejecuta `npm run build:render` y sirve
el contenido generado en `dist/`:

- `Nexus-75-Optimizer.user.js`: versión instalable actual;
- `version.json`: versión, ruta y SHA-256 de la compilación;
- `index.html`: página oficial de instalación.

Cada commit nuevo en `main` activa un despliegue automático. La versión
publicada siempre se genera desde `userscript/Nexus-75-Optimizer.user.js`; no se
descarga ni ejecuta código remoto dentro de la edición de Greasy Fork.
