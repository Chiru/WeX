INSERT INTO core_pois(
            uuid, name, category, location)
    SELECT uuid_generate_v4(), name, amenity, Geography(ST_Transform(way,4326))
    FROM linnanmaa_osm_point
    WHERE amenity is not NULL and name is not NULL;
