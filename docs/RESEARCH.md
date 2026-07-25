# Investigación técnica

Fecha de corte: **19 de julio de 2026**.

## Código revisado

- [survev/survev](https://github.com/survev/survev), commit auditado
  `e3e4478f016798c8e473ccbc888f79944065af84` del 17 de julio de 2026.
- [NAMERIO/resurviv](https://github.com/NAMERIO/resurviv), commit auditado
  `3965b53e05bdb55e4d59ab41892690856156e986` del 19 de julio de 2026.
- [Kisakay/KxsClient](https://github.com/Kisakay/KxsClient), versión 3.0.0
  archivada.
- Catálogo completo de Greasy Fork para `survev.io` y código público relevante:
  Kxs, Alguien Client, Nova Client, Glxy Client, Canadian100, Survev Counters,
  Survev Overlay, Dark Cyan FPS/Ping y Nexus Optimizer Pro. Los scripts de
  aimbot, x-ray, autoloot y multibox se clasificaron, pero no se reutilizaron.

Las copias de investigación se descargaron fuera del proyecto y no se incluye
código de terceros en la extensión.

## Arquitectura común de los juegos

Ambos clientes son TypeScript compilado con Vite y comparten la misma base:

1. `main.ts` crea una `PIXI.Application` de `pixi.js-legacy` 7.4.3.
2. Pixi ejecuta el bucle principal mediante su ticker y
   `requestAnimationFrame`.
3. `Game.update` actualiza jugadores, mapa, proyectiles, explosiones, humo,
   partículas, cadáveres, decals, UI, cámara y orden de capas cada frame.
4. `ResourceManager` elige atlas `high` o `low` con la clave persistente
   `highResTex`.
5. La configuración se guarda en `localStorage` bajo `surviv_config`.

Resurviv contiene más modos, UI y efectos que Survev, pero conserva el mismo
camino crítico de renderizado. La extensión puede compartir un núcleo y mantener
adaptadores DOM por sitio.

## Palancas reales encontradas

### 1. Resolución de renderizado

Los dos `main.ts` calculan:

```text
window.devicePixelRatio > 1 ? 2 : 1
```

Por tanto, una pantalla HiDPI dibuja a 2x en cada dimensión: hasta cuatro veces
más píxeles que 1x. Es la palanca GPU más fuerte accesible antes de crear Pixi.
La extensión permite 1x y restaura el DPR del navegador después del arranque.

Riesgo: imagen menos nítida. Debe medirse A/B y siempre ser reversible.

### 2. Atlas low/high

`ResourceManager` ya contiene atlas de dos resoluciones. Forzar `highResTex=false`
antes de inicializar el cliente reduce descarga, decodificación, VRAM y ancho de
banda de texturas sin inventar reemplazos incompatibles.

Riesgo: sprites menos nítidos. Requiere recarga porque los atlas se eligen al
crear `ResourceManager`.

### 3. Interpolación y sacudida

`Game.init` lee `interpolation` y `screenShake` para configurar la cámara. Quitar
sacudida es seguro pero de impacto pequeño. Desactivar interpolación reduce algo
de trabajo, aunque puede empeorar claramente la percepción de fluidez; por eso
se conserva en Balance y FPS y solo se apaga en Extremo.

### 4. Trabajo del lobby

El DOM incluye fondos grandes y varios contenedores publicitarios. Ocultar su
composición mientras `#game-area-wrapper` está visible evita trabajo visual en
segundo plano. No se bloquean solicitudes ni se destruyen nodos, para no romper
recompensas, monetización o scripts del sitio.

### 5. Partículas y culling

El motor preasigna 256 partículas y actualiza pools activos. No expone su
`Application`, `Game`, `Renderer` ni `ParticleBarn` en `window`: `const App = new
Application()` queda privado al módulo. Por ello una extensión externa no puede
aplicar Entity Culling o reducir partículas de forma robusta mediante supuestos
globals.

La ruta correcta para estas optimizaciones avanzadas es una de estas:

- una API oficial/upstream de calidad gráfica;
- un parche versionado del bundle con firmas y rollback;
- contribuciones a ambos repos para culling por cámara, presupuesto de partículas
  y resolución dinámica.

No se implementará un parche frágil que busque nombres minificados.

### 6. Región y pruebas de latencia oficiales

Los dos juegos crean sockets `/ptc` y envían seis muestras por zona para ordenar
regiones. Cuando `surviv_config.regionSelected` es verdadero, `main.ts` limita las
pruebas a la región guardada. La extensión expone esta palanca como opción: puede
reducir conexiones y tiempo de arranque, pero no debe activarse con una región
incorrecta porque eso puede aumentar el ping real.

La v0.4 evita mantener ese bloqueo indefinidamente: guarda un lease local de 72
horas asociado a la región y al tipo de conexión que expone el navegador. Si
caduca o cambia la red, pone `regionSelected=false` y deja que las pruebas `/ptc`
oficiales vuelvan a decidir. Al cerrar una sesión de al menos cinco segundos
renueva el lease con la región que quedó en `surviv_config`. No añade solicitudes.

### 6.1 Auto-tuner sin carga permanente

No hay una API fiable para conocer la frecuencia física del monitor. La v0.4 la
estima con la mediana de intervalos RAF durante cuatro segundos de lobby y la
ajusta al valor común más cercano. Combina ese dato con p95, 1% low, long tasks,
memoria y núcleos para elegir Balance o FPS. El informe se conserva siete días y
se invalida si cambia la firma de dispositivo/pantalla.

La UI se difiere completamente hasta `F8`. Sin panel y con calibración vigente no
se ejecuta el loop métrico, ni intervalos, ni Long Tasks observer, ni listeners de
entrada. Esto reduce el riesgo clásico de que un “optimizador” consuma los recursos
que pretende ahorrar.

El socket `/play` ya usa `binaryType="arraybuffer"`. La API WebSocket del navegador
solo permite observar la cola con `bufferedAmount`; no expone `TCP_NODELAY`, rutas,
QoS ni prioridad de paquetes. Reasignar `binaryType`, fabricar pings o envolver
cada `send()` no hace que los paquetes viajen más rápido.

### 7. Auditoría de red real

El auditor Playwright de `tests/audit-runtime.mjs` observó diez segundos de carga:

- Survev: 393 solicitudes al host principal y 91 a otros hosts.
- Resurviv: 464 solicitudes al host principal y 66 a otros hosts.
- Gran parte del tráfico principal son atlas, imágenes y datos necesarios; no se
  bloquea.
- Entre los terceros aparecieron NitroPay, DoubleClick, ID5, Criteo, Amazon Ads,
  Google Syndication y medición publicitaria. También aparecieron fuentes,
  consentimiento y Cloudflare, que se preservan.

La opción Red ligera usa dos rulesets estáticos MV3 desactivados por defecto y
acotados por `initiatorDomains`. No ejecuta un hook por solicitud y nunca coincide
con `/api/find_game`, `/play`, `/ptc`, la API del juego o los challenges de
Cloudflare. Puede impedir anuncios con recompensa y por eso requiere elección
explícita.

## Qué aprendimos de otros clientes

Kxs destaca por estructura modular, menú configurable y almacenamiento, pero
añade observers, WebSocket hooks, red social, audio y HUD: es un cliente de
funciones, no un optimizador mínimo.

Survev Overlay es un bundle de más de 1 MB con plugins e intervalos. Su mediana
de ping proviene de datos internos parcheados, una integración demasiado invasiva
para una capa pequeña y portable.

Dark Cyan reemplaza RAF y hace un `XMLHttpRequest` al documento cada 500 ms.
Glxy mantiene un segundo WebSocket `/ptc`. Canadian100 hace `HEAD` cada 500 ms y
además contiene numerosos intervalos de gameplay. Son ejemplos de contadores que
crean más trabajo y no de optimización de red.

Alguien, Glxy y Nova reemplazan RAF por `setTimeout(1)` para “uncap”. Esto puede
ejecutar callbacks a cientos de Hz sin sincronización con pantalla, aumentando
CPU y jitter. La extensión mantiene RAF nativo.

Canadian100 calcula “ping” con una petición `HEAD` cada 500 ms. Eso añade tráfico
y trabajo y no representa la latencia del socket de juego. No se copiará.

Survev Counters ofrece métricas más ricas, pero intercepta todos los WebSockets,
mantiene un socket `/ptc` adicional, dibuja una gráfica y ejecuta varios
intervalos. Tomamos la idea de percentiles, no sus hooks de red.

Nexus Optimizer Pro intenta modificar `window.game`, `window.app` y campos como
`maxFps` o `pingInterval`. Esos globals/campos no aparecen en los clientes
actuales. También cambia `binaryType`, que no reduce mágicamente el ping y puede
alterar el tipo de datos esperado. La nueva extensión actúa sobre claves y rutas
confirmadas en el código fuente.

## Límites de producto

- Nada de aimbot, ESP, x-ray, zoom competitivo, automatización o paquetes falsos.
- Nada de prometer “menos ping” mediante cambios cosméticos. La extensión reduce
  contención local y tráfico prescindible; distancia, ruta y servidor siguen
  determinando el RTT del juego.
- Nada de loops más rápidos que la pantalla.
- Nada de quitar humo, techos, jugadores, obstáculos o información necesaria.
- Cada cambio debe explicar impacto, coste visual, necesidad de recarga y método
  de restauración.

## Verificación en los despliegues reales

Se ejecutó un smoke test headless de Chrome sobre ambos dominios con DPR 2. El
resultado confirmado fue:

- `#cvs` quedó en 1280 píxeles internos para 1280 píxeles CSS (1x), en vez de
  2560 (2x);
- el DPR del navegador volvió a 2 inmediatamente después de que Pixi obtuvo el
  contexto del canvas;
- antes de `F8` la UI no existía; al pulsarlo se montó correctamente en Shadow DOM;
- `highResTex=false`, `interpolation=true` y `screenShake=false` fueron leídos
  desde la configuración persistente en ambos sitios.

Resurviv emitió un error de dimensiones de textura de dos píxeles. Una corrida de
control separada reprodujo el mismo error tanto con `highResTex=true` como con
`highResTex=false`; por tanto es un problema del despliegue actual y no una
regresión introducida por el optimizador. Debe vigilarse en próximas versiones.
