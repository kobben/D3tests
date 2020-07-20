D3 API used to map a geojson with cartesian coordinates (instead of lat-lon's).
Uses an override of standard D3 geo projection behaviour:
don't perform a full projection and resampling, but only a 1st order (affine) translation and
scaling to transform real-world XY-coordinates into SVG screen coordinates...
