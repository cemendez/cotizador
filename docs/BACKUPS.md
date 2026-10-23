# Respaldos

Un respaldo que nunca se ha restaurado no es un respaldo. Este documento cubre cómo se hacen, dónde viven y cómo probarlos.

## Cómo funcionan

- `.github/workflows/backup.yml` corre todos los días (y a mano desde *Actions → Backup → Run workflow*).
- Hace `pg_dump --format=custom` con el cliente de PostgreSQL 17, lo **cifra con `age`** usando una llave pública y lo sube a un bucket privado de Cloudflare R2.
- La **llave privada** vive solo en tu gestor de contraseñas y en un respaldo offline. No va en el repo, ni en los secretos de GitHub, ni en el bucket.
- Si el workflow falla, GitHub te manda correo.

## Configuración (una sola vez)

1. **Llaves `age`** (en tu computadora):
   ```bash
   docker run --rm -v "${PWD}:/k" -w /k alpine sh -c "apk add --no-cache age >/dev/null && age-keygen -o cotizador-backup.key"
   ```
   Imprime `Public key: age1...`. Guarda `cotizador-backup.key` en tu gestor de contraseñas y borra el archivo suelto. **Sin esta llave los respaldos no se pueden abrir.**
2. **Cloudflare R2**: crea un bucket privado (p. ej. `cotizador-backups`) y un token de API con permiso de lectura/escritura solo sobre ese bucket. Anota el *Account ID*.
   - Agrega una regla de ciclo de vida para borrar objetos de más de 30 días.
3. **Secretos del repositorio** (*Settings → Secrets and variables → Actions*):

   | Secreto | Valor |
   | --- | --- |
   | `BACKUP_DATABASE_URL` | URL **directa** de Neon (no la del pooler), con `sslmode=require` |
   | `AGE_PUBLIC_KEY` | `age1...` |
   | `R2_ACCOUNT_ID` | Account ID de Cloudflare |
   | `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Del token de R2 |
   | `R2_BUCKET` | Nombre del bucket |

4. Corre el workflow a mano una vez y confirma que aparece el archivo en el bucket.

> GitHub desactiva los workflows programados tras 60 días sin actividad en el repositorio. Revisa de vez en cuando la pestaña *Actions* o haz un commit de mantenimiento.

## Respaldo manual rápido

```powershell
docker run --rm -v "${PWD}:/out" postgres:17 pg_dump --format=custom --no-owner --dbname "$env:DATABASE_URL" -f /out/cotizador.dump
```

(No uses `>` en PowerShell: corrompe archivos binarios.) Verifica que no esté vacío y que se pueda leer:

```powershell
Get-Item cotizador.dump | Select-Object Length
docker run --rm -v "${PWD}:/out" postgres:17 pg_restore --list /out/cotizador.dump
```

## Restaurar (prueba mensual recomendada)

Siempre restaura primero en una base **desechable**, nunca encima de producción.

```powershell
# 1. Descifrar (necesitas la llave privada)
age -d -i cotizador-backup.key -o cotizador.dump cotizador-AAAAMMDDTHHMMSSZ.dump.age

# 2. BD temporal
docker run -d --name restore-test -e POSTGRES_PASSWORD=test -p 5440:5432 postgres:17

# 3. Restaurar
docker cp cotizador.dump restore-test:/tmp/cotizador.dump
docker exec restore-test pg_restore -U postgres -d postgres --no-owner /tmp/cotizador.dump

# 4. Revisar que los datos estén
docker exec restore-test psql -U postgres -c "SELECT count(*) FROM \"Quote\";"

# 5. Limpiar
docker rm -f restore-test
```

Si tienes `age` instalado en Windows úsalo directo; si no, ejecútalo en un contenedor `alpine` con `apk add age`.

Para una restauración real (desastre): crea un proyecto/rama nueva en Neon, restaura ahí, actualiza `DATABASE_URL` en Render y vuelve a desplegar.
