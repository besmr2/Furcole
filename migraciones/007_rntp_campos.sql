-- 007_rntp_campos.sql
-- Agrega columnas de datos RNTP a transportista_perfil
-- Estos campos se llenan automáticamente desde la Edge Function verificar-patente

ALTER TABLE transportista_perfil
  ADD COLUMN IF NOT EXISTS tipo_servicio    text,
  ADD COLUMN IF NOT EXISTS capacidad        integer,
  ADD COLUMN IF NOT EXISTS region           text,
  ADD COLUMN IF NOT EXISTS marca            text,
  ADD COLUMN IF NOT EXISTS modelo           text,
  ADD COLUMN IF NOT EXISTS anio_fabricacion integer;

COMMENT ON COLUMN transportista_perfil.tipo_servicio    IS 'Tipo de servicio RNTP (ej: ESCOLAR - URBANO MINIBUS ESCOLAR)';
COMMENT ON COLUMN transportista_perfil.capacidad        IS 'Capacidad de pasajeros según RNTP';
COMMENT ON COLUMN transportista_perfil.region           IS 'Región del vehículo según RNTP';
COMMENT ON COLUMN transportista_perfil.marca            IS 'Marca del vehículo según RNTP';
COMMENT ON COLUMN transportista_perfil.modelo           IS 'Modelo del vehículo según RNTP';
COMMENT ON COLUMN transportista_perfil.anio_fabricacion IS 'Año de fabricación del vehículo según RNTP';
