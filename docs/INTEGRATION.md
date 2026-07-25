# Integración del núcleo en otro script

La lógica está separada por responsabilidad para poder trasladarla sin copiar
una UI completa.

| Componente | Archivo | Responsabilidad |
|---|---|---|
| Arranque temprano | `extension/src/early-main.js` | Configuración oficial, atlas low, DPR 1x y región |
| Runtime ligero | `extension/src/content.js` | Reposo del lobby, auto-tuner, métricas bajo demanda y UI lazy |
| Red MV3 | `extension/src/background.js` | Activar/desactivar rulesets sin hooks por solicitud |
| Reglas | `extension/rules/*.json` | Terceros observados, acotados por dominio iniciador |

## Orden obligatorio

1. Ejecutar la configuración temprana en mundo `MAIN` y `document_start`.
2. Restaurar `devicePixelRatio` inmediatamente después de que `#cvs` solicite su
   contexto; nunca mantener el getter modificado durante toda la sesión.
3. No reemplazar `requestAnimationFrame`, `WebSocket`, `send`, `fetch` ni
   `console` en la ruta caliente.
4. Aplicar bloqueo de terceros con DNR o una API equivalente fuera de la página.
5. No construir la UI al cargar: crearla con `F8` y detener sus monitores al cerrarla.
6. Calibrar solo en el lobby, persistir el resultado y no repetirlo en cada carga.
7. Preservar `/api/find_game`, `/play`, `/ptc`, autenticación, CAPTCHA y assets.

## Configuraciones reutilizables

- `lowResTextures`: escribe `highResTex=false` antes de crear ResourceManager.
- `renderAt1x`: ventana breve de DPR 1 durante la inicialización de Pixi.
- `lockSelectedRegion`: escribe `regionSelected=true` solo si `region` existe.
- `smartRegion`: reutiliza por 72 h la región que midió el juego; invalida el
  lease ante cambio de red y deja que `/ptc` vuelva a elegir al caducar.
- `autoTune`: mide cuatro segundos en lobby, detecta refresco y recomienda
  Balance/FPS; su informe dura siete días por dispositivo/pantalla.
- `sleepMonitorInGame`: cancela RAF, intervalos, observer y listeners propios.
- `blockThirdParty`: mensaje al service worker para el ruleset del sitio actual.

## Invariantes de seguridad y rendimiento

- Ningún paquete de juego se modifica, retrasa, agrupa, descarta o fabrica.
- No se abre un socket de ping adicional.
- No se consulta la red para actualizar el contador.
- Toda palanca es reversible y las que cambian arranque requieren recarga.
- Si el juego cambia claves, selectores o hosts, la optimización falla cerrada:
  no aplica el cambio en vez de adivinar globals minificados.
