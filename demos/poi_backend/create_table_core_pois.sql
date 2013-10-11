CREATE TABLE core_pois
(
  uuid uuid NOT NULL,
  name character varying(64),
  category character varying(64),
  description character varying(512),
  label character varying(256),
  url text,
  location geography,
  geometry geometry,
  CONSTRAINT uuid PRIMARY KEY (uuid)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE core_pois
  OWNER TO gisuser;
COMMENT ON TABLE core_pois
  IS 'Table containing the core POI data';

-- Index: core_pois_geog_gix

-- DROP INDEX core_pois_geog_gix;

CREATE INDEX core_pois_geog_gix
  ON core_pois
  USING gist
  (location);


