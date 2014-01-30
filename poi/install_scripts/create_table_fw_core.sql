-- Table: fw_core

CREATE TABLE fw_core
(
  uuid uuid NOT NULL,
  name character varying(64),
  category character varying(64),
  description character varying(512),
  label character varying(256),
  url text,
  location geography,
  geometry geometry,
  osm_id integer, -- OpenStreetMap ID (for POIs imported from OSM)
  thumbnail text,
  timestamp bigint,
  userid uuid,
  CONSTRAINT "pkey" PRIMARY KEY (uuid)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE fw_core
  OWNER TO gisuser;
COMMENT ON TABLE fw_core
  IS 'Table containing the core POI data';
COMMENT ON COLUMN fw_core.osm_id IS 'OpenStreetMap ID (for POIs imported from OSM)';


-- Index: fw_core_geog_gix

CREATE INDEX fw_core_geog_gix
  ON fw_core
  USING gist
  (location );

