-- Limpieza de producción: deja solo al usuario dueño.
--
-- Uso (PowerShell, desde la raíz del repo; primero SIEMPRE con ROLLBACK):
--   Get-Content -Raw scripts/cleanup-prod.sql | docker run --rm -i postgres:17 psql "$env:DATABASE_URL" -v owner=tu@correo.com -v finish=ROLLBACK -f -
-- Si el resumen final es el esperado, repite con -v finish=COMMIT
--
-- Verifica antes los nombres de tablas con:  \dt
-- (Prisma usa los nombres de los modelos: "User", "Client", "Quote", "QuoteItem", "RefreshToken", "PricingSettings", "Service")

\set ON_ERROR_STOP on
BEGIN;

-- 0) Guardia: aborta si el dueño no existe
-- (psql no sustituye variables dentro de bloques DO $$, por eso se usa \gset / \if)
SELECT count(*) = 1 AS owner_exists FROM "User" WHERE email = :'owner' \gset
\if :owner_exists
  \echo 'Dueño encontrado: ' :owner
\else
  \echo 'ERROR: el usuario dueño no existe. No se borra nada.'
  \quit
\endif

-- 1) Antes
SELECT 'ANTES' AS momento,
  (SELECT count(*) FROM "User")   AS usuarios,
  (SELECT count(*) FROM "Client") AS clientes,
  (SELECT count(*) FROM "Quote")  AS cotizaciones;

-- 2) Datos de los usuarios que NO son el dueño
DELETE FROM "QuoteItem"       WHERE "quoteId" IN (SELECT q.id FROM "Quote" q JOIN "User" u ON u.id = q."userId" WHERE u.email <> :'owner');
DELETE FROM "Quote"           WHERE "userId" IN (SELECT id FROM "User" WHERE email <> :'owner');
DELETE FROM "Client"          WHERE "userId" IN (SELECT id FROM "User" WHERE email <> :'owner');
DELETE FROM "Service"         WHERE "userId" IN (SELECT id FROM "User" WHERE email <> :'owner');
DELETE FROM "PricingSettings" WHERE "userId" IN (SELECT id FROM "User" WHERE email <> :'owner');
DELETE FROM "RefreshToken"    WHERE "userId" IN (SELECT id FROM "User" WHERE email <> :'owner');
DELETE FROM "User"            WHERE email <> :'owner';

-- 3) Sesiones del dueño: fuerza un nuevo login (sirve también como "cerrar todas las sesiones")
DELETE FROM "RefreshToken";

-- 4) OPCIONAL: borrar clientes/cotizaciones de PRUEBA del dueño.
--    Revisa primero:  SELECT id, name FROM "Client";
--    Luego descomenta y pon los ids de prueba (nunca borres todo si ya hay clientes reales).
-- DELETE FROM "QuoteItem" WHERE "quoteId" IN (SELECT id FROM "Quote" WHERE "clientId" IN ('ID_PRUEBA_1','ID_PRUEBA_2'));
-- DELETE FROM "Quote"     WHERE "clientId" IN ('ID_PRUEBA_1','ID_PRUEBA_2');
-- DELETE FROM "Client"    WHERE id IN ('ID_PRUEBA_1','ID_PRUEBA_2');
--
--    Si borraste TODAS las cotizaciones del dueño, reinicia el folio:
-- UPDATE "User" SET "lastQuoteNumber" = 0 WHERE email = :'owner';

-- 5) Después
SELECT 'DESPUES' AS momento,
  (SELECT count(*) FROM "User")   AS usuarios,
  (SELECT count(*) FROM "Client") AS clientes,
  (SELECT count(*) FROM "Quote")  AS cotizaciones;

SELECT email, "lastQuoteNumber" FROM "User";

:finish;
