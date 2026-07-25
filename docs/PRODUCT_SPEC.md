# Especificación de producto y metas

## Objetivo principal

Conseguir la mejor estabilidad posible hasta **75 FPS visibles**, usando el menor
trabajo de CPU/GPU razonable y sin degradar mecánicas, red ni equidad.

El objetivo efectivo es:

```text
min(75 FPS, frecuencia real del monitor)
```

En un panel de 60 Hz, 60 FPS estables con buen p95 es éxito. Generar 75 callbacks
no sincronizados no lo es.

## Criterios de aceptación

En una misma partida, mapa, tamaño de ventana y navegador:

- FPS promedio no inferior al modo original.
- 1% low igual o mayor.
- p95 de frame time igual o menor.
- menos long tasks y menos stutter perceptible.
- ninguna diferencia en input, protocolo, colisiones o información visible.
- restauración a la configuración original en un clic.
- sin errores nuevos en consola durante una sesión de 15 minutos.

No se publicará una cifra porcentual hasta tener al menos tres corridas A/B por
perfil y por juego.

## Modos

| Modo | Texturas | Render | Interpolación | Audio | Uso |
|---|---|---|---|---|---|
| Calidad | original | original | sí | original | Equipos rápidos |
| Balance | low | 1x en HiDPI | sí | original | Predeterminado |
| FPS | low | 1x en HiDPI | sí | original | Prioriza estabilidad |
| Competitivo | low | 1x en HiDPI | sí | original | Estabilidad, respuesta y UI en reposo |
| Extremo | low | 1x en HiDPI | no | apagado | Hardware muy limitado |
| Original | restaurado | original | restaurado | restaurado | A/B y rollback |

Balance y FPS son iguales en v0.1 porque todavía no hay una tercera palanca
segura. Se separan desde ahora para que FPS pueda recibir presupuesto de
partículas/resolución adaptativa cuando exista una integración robusta.

### Lógica competitiva limpia

El perfil Competitivo aplica las optimizaciones seguras de Balance, conserva el
audio y la interpolación por su valor informativo, y repliega el panel al detectar
que comienza una partida. Con el panel cerrado detiene completamente su RAF,
`PerformanceObserver`, intervalos métricos y listeners de muestreo. F8 los reactiva
bajo demanda. También informa el p95 desde un evento local de teclado o puntero
hasta el siguiente `requestAnimationFrame`; es una medida del navegador, no
latencia de red ni input-to-photon.

Este modo no modifica WebSocket, paquetes, puntería, visibilidad, controles,
recoil, hitboxes ni temporizadores de juego. La meta es reducir trabajo cosmético
sin producir una ventaja artificial ni romper la semántica competitiva.

### Red y latencia

- **Región inteligente:** tras una sesión válida conserva durante 72 horas la
  región elegida por las pruebas oficiales. El lease se invalida al cambiar la
  conexión o caducar; entonces el juego vuelve a medir. No abre sockets propios.
- **Fijar región elegida:** activa la clave oficial `regionSelected` solo cuando
  existe una región guardada. Es el override manual y no caduca; puede subir el
  ping al viajar o cambiar de red.
- **Red ligera de terceros:** rulesets nativos y reversibles, desactivados por
  defecto. Reducen scripts, frames y solicitudes publicitarias/analytics; pueden
  desactivar anuncios con recompensa.
- **RTT pasivo:** `navigator.connection.rtt` se muestra como estimación redondeada,
  nunca como ping del socket de juego y sin generar solicitudes nuevas.

### Auto-tuner y coste propio

En la primera carga, o cada siete días/cambio de dispositivo, el auto-tuner toma
una muestra de cuatro segundos únicamente en el lobby. Estima la frecuencia de
pantalla desde los intervalos RAF, limita el objetivo a `min(75, Hz)` y elige
Balance o FPS según p95, 1% low, long tasks, memoria y núcleos disponibles. No
cambia perfiles explícitos como Competitivo, Calidad o Extremo.

La UI no se construye al arrancar. `F8` crea el Shadow DOM bajo demanda; cerrarlo
detiene RAF, `PerformanceObserver`, intervalos y listeners. Tras una calibración
vigente y con el panel cerrado, el coste continuo del runtime es cero salvo el
observer de atributos del contenedor de partida, que solo reacciona a cambios.

## Protocolo A/B

1. Cierra pestañas y extensiones no necesarias; mantén energía y temperatura.
2. Usa el mismo navegador, escala, mapa, región y duración.
3. Ejecuta 2 minutos de calentamiento.
4. Mide 5 minutos en Original y guarda FPS, 1% low, p95 y long tasks.
5. Recarga en Balance y repite el recorrido/escenario.
6. Alterna el orden en la siguiente corrida para reducir sesgo térmico.
7. Repite tres veces y usa la mediana.

## Roadmap técnico

### v0.1 — base segura

- Perfiles y restauración.
- Atlas low.
- Render 1x en HiDPI.
- Reposo visual del lobby.
- Métricas de estabilidad.

### v0.2 — competitivo limpio y compatibilidad

- Perfil competitivo sin cambios de mecánicas o red.
- Panel en reposo durante la partida.
- Métrica local input→siguiente frame.

- Exportar resultados A/B en JSON.
- Detector de versión/build de cada juego.
- Autodiagnóstico de WebGL, frecuencia estimada y thermal throttling.
- Tests E2E contra fixtures de ambos DOM.

### v0.3 — red ligera y coste casi cero

- Rulesets MV3 opcionales y acotados por sitio.
- Región fija mediante configuración oficial.
- Monitor completamente dormido durante partida competitiva.
- Auditor de dominios y RTT pasivo sin pings adicionales.

### v0.4 — adaptación y coste bajo demanda

- UI lazy mediante F8.
- Auto-tuner de lobby con caché de siete días.
- Región inteligente con lease de 72 horas e invalidación por red.
- Botón de recalibración explícita y diagnóstico visible.

### v0.5 — optimización profunda condicionada

- Solo si existe API upstream o firma de bundle verificada:
  presupuesto de partículas cosméticas, culling fuera de cámara y resolución
  dinámica con histéresis.
- Kill switch remoto no; rollback local y versionado sí.

## Riesgos conocidos de v0.4

- El override temprano de DPR termina cuando `#cvs` solicita su contexto de
  renderizado, después de que Pixi leyó la resolución. El módulo `device` puede
  conservar 1 como valor interno durante la pestaña; CSS usa píxeles CSS, por lo
  que el riesgo principal es una decisión distinta de layout cerca de 850–900 px.
- Cambiar texturas/resolución exige recarga.
- La API Long Tasks no está disponible en todos los navegadores.
- Las modificaciones futuras de los repos pueden cambiar claves o selectores;
  por eso se necesita detector de build antes de optimizaciones profundas.
