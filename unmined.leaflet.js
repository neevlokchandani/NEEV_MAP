function Unmined() {

    this.map = function (mapId, options, regions) {

        var minMapX = options.minRegionX * 512;
        var minMapY = options.minRegionZ * 512;
        var mapWidth = (options.maxRegionX + 1 - options.minRegionX) * 512;
        var mapHeight = (options.maxRegionZ + 1 - options.minRegionZ) * 512;
        var zoomOffset = 0 - options.minZoom;

        var unminedLayer = new L.TileLayer.Functional(
            function (view) {
                var zoom = view.zoom - zoomOffset;
                zoomFactor = Math.pow(2, zoom);

                var tileSize = 256;

                var minTileX = Math.floor(minMapX * zoomFactor / tileSize);
                var minTileY = Math.floor(minMapY * zoomFactor / tileSize);
                var maxTileX = Math.ceil((minMapX + mapWidth) * zoomFactor / tileSize) - 1;
                var maxTileY = Math.ceil((minMapY + mapHeight) * zoomFactor / tileSize) - 1;

                var tileX = view.tile.column;
                var tileY = view.tile.row;

                var tileBlockSize = tileSize / zoomFactor;
                var tileBlockPoint = {
                    x: tileX * tileBlockSize,
                    z: tileY * tileBlockSize
                };

                var intersectsWithTile = function (region) {
                    return (tileBlockPoint.x < (region.x + 1) * 512)
                        && (tileBlockPoint.x + tileBlockSize > region.x * 512)
                        && (tileBlockPoint.z < (region.z + 1) * 512)
                        && (tileBlockPoint.z + tileBlockSize > region.z * 512);
                };

                if (tileX >= minTileX
                    && tileY >= minTileY
                    && tileX <= maxTileX
                    && tileY <= maxTileY
                    && ((regions === undefined) || regions.some(intersectsWithTile))) {
                    var url = ('tiles/zoom.{z}/{xd}/{yd}/tile.{x}.{y}.' + options.imageFormat)
                        .replace('{z}', zoom)
                        .replace('{yd}', Math.floor(tileY / 10))
                        .replace('{xd}', Math.floor(tileX / 10))
                        .replace('{y}', view.tile.row)
                        .replace('{x}', view.tile.column);
                    return url;
                }
                else
                    return "tiles/empty." + options.imageFormat;
            },
            {
                detectRetina: false,
                bounds: [[minMapX, minMapY], [minMapX + mapWidth, minMapY + mapHeight]]
            });

        var map = L.map(mapId, {
            crs: L.CRS.Simple,
            minZoom: options.minZoom + zoomOffset,
            maxZoom: options.maxZoom + zoomOffset,
            layers: [unminedLayer],
            maxBoundsViscosity: 1.0
        }).setView([0, 0], options.defaultZoom + zoomOffset);

        this.leafletMap = map;

        var Position = L.Control.extend({
            _container: null,
            options: {
                position: 'topright'
            },

            onAdd: function (map) {
                var domElement = L.DomUtil.create('div', 'mouseposition');
                this._domElement = domElement;
                return domElement;
            },

            updateHTML: function (x, z) {                
                this._domElement.innerHTML = '<span class="mousepositioncoord">' + x.toLocaleString() + '</span>, <span class="mousepositioncoord">' + z.toLocaleString() + '</span>';
            }
        });

        this.position = new Position();
        this.leafletMap.addControl(this.position);
        this.leafletMap.addEventListener('mousemove', (event) => {
            var p = map.project(event.latlng, zoomOffset);
            let x = Math.round(p.x);
            let z = Math.round(p.y);
            this.position.updateHTML(x, z);
        });
    }   
}