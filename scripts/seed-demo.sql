-- Datos de demostración (ficticios) para capturas y para enseñar el proyecto.
--
-- SOLO PARA UNA BASE LOCAL Y VACÍA. Nunca contra producción.
-- Requisitos: el usuario ya existe (regístralo desde la app) y no tiene clientes ni cotizaciones.
--
-- Uso (PowerShell, desde la raíz del repo):
--   docker run --rm -e PGCLIENTENCODING=UTF8 -v "${PWD}/scripts:/s" postgres:17 psql $env:LOCAL_DB -v owner=demo@example.com -v confirm=LOCAL -f /s/seed-demo.sql
-- donde $env:LOCAL_DB apunta a tu base LOCAL (host.docker.internal:5434), no a Neon.
-- Se lee el archivo montado (no por tubería) para que los acentos lleguen bien en PowerShell.
-- Para recargar la demo sobre un usuario que ya la tiene, agrega: -v reset=1

\set ON_ERROR_STOP on

-- Guardia 1: exige confirmación explícita
\if :{?confirm}
\else
  \echo 'ERROR: agrega -v confirm=LOCAL para confirmar que es una base local de demostración.'
  \quit
\endif

-- Guardia 2: el usuario existe
SELECT count(*) = 1 AS owner_exists FROM "User" WHERE email = :'owner' \gset
\if :owner_exists
\else
  \echo 'ERROR: el usuario no existe. Regístralo primero desde la app.'
  \quit
\endif

-- Opcional: -v reset=1 borra antes los datos del usuario (para volver a cargar la demo)
\if :{?reset}
  DELETE FROM "QuoteItem" WHERE "quoteId" IN (SELECT q.id FROM "Quote" q JOIN "User" u ON u.id = q."userId" WHERE u.email = :'owner');
  DELETE FROM "Quote"           WHERE "userId" IN (SELECT id FROM "User" WHERE email = :'owner');
  DELETE FROM "Client"          WHERE "userId" IN (SELECT id FROM "User" WHERE email = :'owner');
  DELETE FROM "Service"         WHERE "userId" IN (SELECT id FROM "User" WHERE email = :'owner');
  DELETE FROM "PricingSettings" WHERE "userId" IN (SELECT id FROM "User" WHERE email = :'owner');
  UPDATE "User" SET "lastQuoteNumber" = 0 WHERE email = :'owner';
\endif

-- Guardia 3: el usuario no tiene datos (evita pisar datos reales)
SELECT (SELECT count(*) FROM "Client"  WHERE "userId" = u.id) = 0
   AND (SELECT count(*) FROM "Quote"   WHERE "userId" = u.id) = 0 AS is_empty
  FROM "User" u WHERE u.email = :'owner' \gset
\if :is_empty
\else
  \echo 'ERROR: el usuario ya tiene clientes o cotizaciones. No se inserta nada.'
  \quit
\endif

SELECT id AS uid FROM "User" WHERE email = :'owner' \gset

BEGIN;

-- Tarifa: (20000 + 3000) x 1.10 / 0.80 / 90 h = 351.39 -> sugerida 360
INSERT INTO "PricingSettings"
  (id, "userId", "monthlyNetIncome", "costEquipment", "costTools", "costOffice", "costTransport",
   "costServices", "costAdvertising", "marginPercent", "taxReservePercent",
   "billableHoursPerMonth", "hourlyRate", "updatedAt")
VALUES
  (gen_random_uuid()::text, :'uid', 20000, 800, 500, 600, 300, 500, 300, 10, 20, 90, 360, now())
ON CONFLICT ("userId") DO UPDATE SET
  "monthlyNetIncome" = EXCLUDED."monthlyNetIncome", "costEquipment" = EXCLUDED."costEquipment",
  "costTools" = EXCLUDED."costTools", "costOffice" = EXCLUDED."costOffice",
  "costTransport" = EXCLUDED."costTransport", "costServices" = EXCLUDED."costServices",
  "costAdvertising" = EXCLUDED."costAdvertising", "marginPercent" = EXCLUDED."marginPercent",
  "taxReservePercent" = EXCLUDED."taxReservePercent",
  "billableHoursPerMonth" = EXCLUDED."billableHoursPerMonth",
  "hourlyRate" = EXCLUDED."hourlyRate", "updatedAt" = now();

-- Catálogo de servicios
INSERT INTO "Service" (id, "userId", name, description, "estimatedHours", "fixedPrice", "updatedAt")
SELECT gen_random_uuid()::text, :'uid', v.name, v.descr, v.hours, v.fixed, now()
FROM (VALUES
  ('Sitio web de una página',      'Diseño y desarrollo de un sitio de una página, adaptable a móvil', 20, NULL::numeric),
  ('Automatización administrativa','Flujos para reducir tareas repetitivas de oficina',                 35, NULL),
  ('Agenda y gestión de clientes', 'Sistema para citas, clientes y recordatorios',                      50, NULL),
  ('Control de inventario',        'Entradas, salidas y existencias con reportes',                      70, NULL),
  ('Soporte mensual',              'Mantenimiento y soporte básico',                                     4, 1200)
) AS v(name, descr, hours, fixed);

-- Clientes ficticios
INSERT INTO "Client" (id, "userId", name, company, email, phone, notes, "updatedAt")
SELECT gen_random_uuid()::text, :'uid', v.name, v.company, v.email, v.phone, v.notes, now()
FROM (VALUES
  ('Mariana Solís',   'Café Aurora',               'mariana@cafe-aurora.example.com',  '222 000 0001', 'Cafetería con dos sucursales'),
  ('Luis Rivas',      'Despacho Contable Rivas',   'luis@rivas-contadores.example.com','222 000 0002', 'Prefiere recibir todo por correo'),
  ('Andrea Montoya',  'Taller Montoya',            'andrea@tallermontoya.example.com', '222 000 0003', NULL),
  ('Dr. Paco Duarte', 'Clínica Dental Sonrisa',    'contacto@sonrisa.example.com',     '222 000 0004', 'Agenda con muchas cancelaciones'),
  ('Raúl Ortega',     'Remodelaciones Ortega',     'raul@ortega-obras.example.com',    '222 000 0005', NULL)
) AS v(name, company, email, phone, notes);

-- Cotizaciones en todos los estados
INSERT INTO "Quote"
  (id, "userId", "clientId", number, title, status, notes, terms, "validUntil", "sentAt", "acceptedAt", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, :'uid', c.id, v.number, v.title, v.status::"QuoteStatus", v.notes,
       'Anticipo del 50 % al aceptar y el resto al entregar. Vigencia indicada en esta cotización.',
       v.valid_until, v.sent_at, v.accepted_at, v.created_at, now()
FROM (VALUES
  (1, 'Café Aurora',             'Sitio web con menú y ubicación',     'ACCEPTED', 'Incluye dominio y hosting el primer año',
      now() + interval '10 days', now() - interval '40 days', now() - interval '35 days', now() - interval '42 days'),
  (2, 'Despacho Contable Rivas', 'Agenda y gestión de clientes',       'ACCEPTED', NULL,
      now() + interval '5 days',  now() - interval '25 days', now() - interval '20 days', now() - interval '27 days'),
  (3, 'Taller Montoya',          'Control de inventario',              'SENT',     'Precio especial por contratar en este mes',
      now() + interval '12 days', now() - interval '6 days',  NULL,                       now() - interval '8 days'),
  (4, 'Clínica Dental Sonrisa',  'Automatización de recordatorios',    'DRAFT',    NULL,
      NULL,                       NULL,                       NULL,                       now() - interval '2 days'),
  (5, 'Remodelaciones Ortega',   'Sitio web de portafolio de obras',   'REJECTED', NULL,
      now() - interval '5 days',  now() - interval '30 days', NULL,                       now() - interval '33 days'),
  (6, 'Café Aurora',             'Soporte mensual',                    'EXPIRED',  NULL,
      now() - interval '15 days', now() - interval '45 days', NULL,                       now() - interval '46 days')
) AS v(number, client_name, title, status, notes, valid_until, sent_at, accepted_at, created_at)
JOIN "Client" c ON c.name <> '' AND c.company = v.client_name AND c."userId" = :'uid';

-- Conceptos (con horas estimadas para que se vea la tarifa efectiva)
INSERT INTO "QuoteItem" (id, "quoteId", description, unit, quantity, "unitPrice", position, amount, "estimatedHours")
SELECT gen_random_uuid()::text, q.id, v.descr, v.unit, v.qty, v.price, v.pos, v.qty * v.price, v.hours
FROM (VALUES
  (1, 'Sitio web de una página',        'servicio', 1, 7200,  1, 20::numeric),
  (1, 'Dominio y hosting (primer año)', 'servicio', 1, 1500,  2, NULL),
  (2, 'Agenda y gestión de clientes',   'servicio', 1, 18000, 1, 50),
  (3, 'Control de inventario',          'servicio', 1, 21000, 1, 70),
  (4, 'Automatización administrativa',  'servicio', 1, 12600, 1, 35),
  (5, 'Sitio web de una página',        'servicio', 1, 7200,  1, 20),
  (5, 'Galería de obras',               'servicio', 1, 2400,  2, NULL),
  (6, 'Soporte mensual',                'mes',      1, 1200,  1, 4)
) AS v(qnum, descr, unit, qty, price, pos, hours)
JOIN "Quote" q ON q."userId" = :'uid' AND q.number = v.qnum;

-- Totales (IVA 16 %)
UPDATE "Quote" q
SET subtotal    = s.sub,
    "taxAmount" = round(s.sub * q."taxRate" / 100, 2),
    total       = s.sub + round(s.sub * q."taxRate" / 100, 2)
FROM (SELECT "quoteId", sum(amount) AS sub FROM "QuoteItem" GROUP BY "quoteId") s
WHERE s."quoteId" = q.id AND q."userId" = :'uid';

UPDATE "User" SET "lastQuoteNumber" = 6 WHERE id = :'uid';

COMMIT;

SELECT number, title, status, subtotal, total FROM "Quote" WHERE "userId" = :'uid' ORDER BY number;
