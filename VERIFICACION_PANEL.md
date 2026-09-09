# Verificación del panel y del diseño — 9 septiembre 2026

## Correcciones

- La inicialización de Auth y la comprobación de propietaria tienen un tiempo máximo de 10 segundos por operación, manejo de errores y reintento.
- Una migración ausente se distingue de una cuenta sin permisos. Un error de conexión nunca concede acceso.
- Las respuestas antiguas no pueden volver a conceder permisos después de cerrar sesión.
- El lema del pie de página se adapta a varias líneas: antes desbordaba a 375 px.

## Comprobado localmente

- 12 pruebas unitarias: configuración de zonas, procesamiento y estados de autenticación.
- 22 pruebas de navegador aprobadas; 2 omitidas por corresponder a otro dispositivo.
- Inicio, colecciones, servicios, contacto y eventos: revisión a 375, 768, 1024 y 1440 px, más fotografías de demostración. Se comprueban imágenes cargadas, intersecciones entre sus rectángulos y desbordamiento horizontal.
- Panel en móvil y escritorio: formulario, todas las zonas, denegación a otra cuenta, migración ausente, espera agotada y reintento.
- Un JPEG real pasa por el selector y el recortador del navegador; la interfaz espera la respuesta de publicación. Un fallo conserva la foto anterior.
- Compilación de producción correcta.

## Verificación en el proyecto real

Tras iniciar sesión en Supabase CLI, se vinculó el proyecto ytnuqlnqsmyvxjirvtja, se verificó ACTIVE_HEALTHY y se desplegaron las dos migraciones y las funciones publish-photo y cleanup-media.

- Copias separadas en ../floristeria-backup-20260909/: schema.sql, data.sql (incluye Auth), roles.sql, configuración anterior y los seis objetos de Storage.
- Comprobación inicial de la migración dentro de una transacción revertida, antes de aplicarla. No se creó un proyecto remoto de preparación independiente.
- Una sola cuenta propietaria configurada y cero políticas all_authenticated restantes. Se desactivaron los registros públicos.
- Prueba real del panel a 390 px: sesión de la cuenta existente mediante enlace generado administrativamente sin enviar correo ni cambiar contraseña; carga de un JPEG, recorte y publicación en Storage y Postgres.
- Verificada lectura pública del derivado, inaccesibilidad pública del original e historial, eliminación y restauración con una URL nueva.
- Verificado rechazo de una revisión obsoleta sin perder la foto activa. Se corrigió el código SQL de conflicto para evitar reintentos de infraestructura.
- Verificado bloqueo de escrituras directas en photos: las modificaciones pasan por las funciones validadas.
- La foto de prueba y sus archivos e historial se retiraron al terminar; se mantuvieron las cuatro fotos anteriores. Se cerró la sesión creada para la prueba.
- Limpieza diaria programada a las 03:15 UTC; secreto en Vault y Edge secrets. Las lecturas de limpieza se paginan y los fallos de lectura detienen la operación antes de eliminar archivos.
- Compilación y 12 pruebas unitarias aprobadas después del despliegue.

## Pendiente

No se ha probado un HEIC de un iPhone real ni todos los escenarios de concurrencia y retención de 30 días. Las 22 pruebas automatizadas de navegador usan respuestas simuladas; la prueba real descrita arriba se ejecutó por separado. Las rutas de recuperación están configuradas para localhost:5173; al desplegar la web habrá que añadir su dominio real. Los datos de negocio todavía contienen información pendiente de confirmar.

## Repetir

```powershell
pnpm test
pnpm test:e2e
pnpm build
```

Playwright guarda capturas de móvil y escritorio en test-results durante la matriz visual. Para ver el diseño con fotografías de muestra sin acceder al panel: http://localhost:5173/demo (solo desarrollo).
