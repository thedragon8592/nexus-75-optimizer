# Nexus 75 Optimizer — Tampermonkey

## Instalación

1. Instala Tampermonkey en Chrome, Edge o un navegador Chromium compatible.
2. Abre el panel de Tampermonkey y crea un script nuevo.
3. Borra el contenido de ejemplo.
4. Copia todo el archivo `userscript/Nexus-75-Optimizer.user.js`.
5. Guarda con `Ctrl+S` y abre `https://survev.io/` o
   `https://resurviv.biz/`.
6. Nexus 75 Optimizer se abrirá automáticamente. Usa `F8` para ocultarlo o
   volverlo a mostrar.

El idioma inicial es inglés. El selector `EN / ES` en la cabecera cambia toda la
interfaz a español y conserva la elección.

## Cómo funciona

- Se ejecuta en `document-start` y cambia únicamente claves confirmadas de
  `surviv_config`.
- Puede elegir los atlas low incluidos por el juego y crear el canvas Pixi a
  resolución 1x en pantallas HiDPI.
- Reduce trabajo visual del lobby durante la partida.
- El auto-tuner mide cuatro segundos visibles en el lobby y guarda su resultado
  durante siete días.
- La interfaz aparece abierta al cargar. Al cerrarla con `F8`, o al ocultar la
  pestaña, detiene RAF, intervalos, Long Tasks observer y muestreo de entrada.
- Región Inteligente reutiliza durante 72 horas la región obtenida por las
  pruebas oficiales del juego y no genera pings propios.

## Promoción de Nexus Chat

Cada quinta apertura del juego aparece inmediatamente una bienvenida grande de
Nexus Chat, siempre en inglés. Resume las funciones reales —salas automáticas,
Global, Nexus ID, amigos y mensajes directos— e incluye una vista previa
construida solo con HTML/CSS.

`Explore Nexus Chat` abre únicamente la web oficial
`https://wnexuschat.netlify.app/`; el userscript no descarga archivos. La `×` y
`Not now` cierran solo la aparición actual. El contador reinicia su ciclo y la
promoción vuelve a mostrarse tras otras cinco aperturas. No se cargan imágenes,
scripts ni fuentes externas para presentar el anuncio.

## Diferencias frente a la extensión

Tampermonkey no proporciona el service worker ni las reglas DNR de Manifest V3.
Por seguridad y rendimiento, esta edición no intenta reemplazarlas mediante
hooks de `fetch`, XHR o WebSocket. No modifica paquetes, matchmaking, puntería,
visibilidad ni mecánicas.
