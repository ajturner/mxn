mxn.register('esri', {

Mapstraction: {
	
	init: function(element, api) {
		var me = this, p;
		dojo.require("esri.map");
		dojo.require("esri.layers.FeatureLayer");

		var esriMap = new esri.Map(element.id, {
			wrapAround180: true
		});
		//var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer");
    //esriMap.addLayer(basemap);
		console.log("esri map made");
    dojo.connect(esriMap, "onLoad",function() {
				console.log("esri map loaded");
				dojo.connect(esriMap, "onClick", function(evt){
					console.log("map clicked");
					me.click.fire({location: new mxn.LatLonPoint(evt.mapPoint.y, evt.mapPoint.x)});
				});
				dojo.connect(esriMap, "onMouseDown", function(evt){
					console.log("esrimap mouse down");
					//esriMap.onPanStart.apply(esriMap.extent, evt.mapPoint);
				});
				dojo.connect(esriMap, "onMouseDragStart", function(evt){
					console.log("mouse drag started");
					//esriMap.onPanStart.apply(esriMap.extent, evt.mapPoint);
				})
				dojo.connect(esriMap, "onMouseDragEnd", function(evt){
					console.log("mouse drag ended");
					//esriMap.centerAt(evt.mapPoint);
					me.endPan.fire();
				})
        ////var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer");
        ////map.addLayer(basemap);
    });


		// map.addEventListener('moveend', function(){
		// 	me.endPan.fire();
		// }); 
		//map.on("click", function(e) {
		//	console.log("map clicked");
		// 	me.click.fire({'location': new mxn.LatLonPoint(e.latlng.lat, e.latlng.lng)});
		 //});
		// map.on("popupopen", function(e) {
		// 	if (e.popup._source.mxnMarker) {
		// 		e.popup._source.mxnMarker.openInfoBubble.fire({'bubbleContainer': e.popup._container});
		// 	}
		// });
		// map.on("popupclose", function(e) {
		// 	if (e.popup._source.mxnMarker) {
		// 		e.popup._source.mxnMarker.closeInfoBubble.fire({'bubbleContainer': e.popup._container});
		// 	}
		// });
		
		this.layers = {};
		this.features = [];
		this.maps[api] = esriMap;
		this.setMapType();
		//this.currentMapType = mxn.Mapstraction.SATELLITE;
		this.loaded[api] = true;
		for(p in this.options){
			console.log( p + ": " + this.options[p]);
		}

	},
	
	applyOptions: function(){
		if (this.options.enableScrollWheelZoom) {
			// this.maps[this.api].enableScrollWheelZoom();
		} else {
			// this.maps[this.api].disableScrollWheelZoom();
		}
		return;
	},

	resizeTo: function(width, height){
		this.currentElement.style.width = width;
		this.currentElement.style.height = height;
		this.maps[this.api].invalidateSize();
	},

	addControls: function(args) {
		var map = this.maps[this.api];
		if (args.zoom) {
			map.showZoomSlider();
		} else {
			map.hideZoomSlider();
		}
		if (args.map_type) {
			var basemapGallery = new esri.dijit.BasemapGallery({
				showArcGISBasemaps: true,
				map: map
			}, "basemapGallery");

			basemapGallery.startup();
		}
	},

	addSmallControls: function() {
		this.addControls({zoom: true, map_type: true});
	},

	addLargeControls: function() {
		throw 'Not implemented';
	},

	addMapTypeControls: function() {
		this.addControls({map_type: true});
	},

	setCenterAndZoom: function(point, zoom) { 
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.centerAndZoom(pt, zoom); 
	},
	
	addMarker: function(marker, old) {
		var map = this.maps[this.api];
		var pin = marker.toProprietary(this.api);
        map.graphics.add(pin);
        return pin;
	},

	removeMarker: function(marker) {
		// var map = this.maps[this.api];
		// map.removeLayer(marker.proprietary_marker);
	},
	
	declutterMarkers: function(opts) {
		throw 'Not implemented';
	},

	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		polyline = polyline.toProprietary(this.api);
        map.graphics.add(polyline);

		this.features.push(polyline);
		return polyline;
	},

	removePolyline: function(polyline) {
		// var map = this.maps[this.api];
		// map.removeLayer(polyline.proprietary_polyline);
	},

	getCenter: function() {
		var map = this.maps[this.api];
		var pt = esri.geometry.webMercatorToGeographic(map.extent.getCenter());
		return new mxn.LatLonPoint(pt.y, pt.x);
	},

	setCenter: function(point, options) {
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		map.centerAt(pt);
	},

	setZoom: function(zoom) {
		var map = this.maps[this.api];
		map.centerAndZoom(map.extent.getCenter(), zoom);
	},
	
	getZoom: function() {
		var map = this.maps[this.api];
		return map.getLevel();
	},

	getZoomLevelForBoundingBox: function(bbox) {
		//var map = this.maps[this.api];
		//var bounds = new L.LatLngBounds(
			//bbox.getSouthWest().toProprietary(this.api),
			//bbox.getNorthEast().toProprietary(this.api));
		//return map.getBoundsZoom(bounds);
	},

	setMapType: function(type) {
		var map = this.maps[this.api], baseMapLayer, baseMapUrl, i;
		console.log("esriMap: " + map);
		if (! map){
			return;
		}
		
		for (i = 0; i < map.layerIds.length; i++){
			if (map.getLayer(map.layerIds[i]) instanceof esri.layers.ArcGISTiledMapServiceLayer){
				baseMapLayer = map.getLayer(map.layerIds[i]);
				break;
			}
		}
		
		if (baseMapLayer){
			map.removeLayer(baseMapLayer);
		}
		// map.removeAllLayers();
		switch(type) {
			case mxn.Mapstraction.ROAD:
                //dojo.require("esri.layers.osm"); // this can cause a race condition
                //var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer");
                //map.addLayer(basemap,0);
								map.addLayer(new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"),0);
                this.currentMapType = mxn.Mapstraction.ROAD;
                break;
            case mxn.Mapstraction.SATELLITE:
                //var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer");
                //map.addLayer(basemap,0);
								map.addLayer(new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"),0);
                this.currentMapType = mxn.Mapstraction.SATELLITE;
                break;
            case mxn.Mapstraction.HYBRID:
                //var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Terrain_Base/MapServer");
                //map.addLayer(basemap);
                map.addLayer(new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer"),0);
                break;
            default:
                this.setMapType(mxn.Mapstraction.ROAD);
             }
         },

	getMapType: function() {
		return this.currentMapType;
	},

	getBounds: function () {
		var map = this.maps[this.api];
		var box = esri.geometry.webMercatorToGeographic(map.extent);
		return new mxn.BoundingBox(box.ymin, box.xmin, box.ymax, box.xmax);
	},

	setBounds: function(bounds){
		var map = this.maps[this.api];
		var sw = bounds.getSouthWest().toProprietary(this.api);
		var ne = bounds.getNorthEast().toProprietary(this.api);
		var newBounds = new esri.geometry.Extent(sw.x,sw.y,ne.x,ne.y);
		map.setExtent(newBounds); 
	},

	addImageOverlay: function(id, src, opacity, west, south, east, north) {
		throw 'Not implemented';
	},

	setImagePosition: function(id, oContext) {
		throw 'Not implemented';
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		throw 'Not implemented';
	},

	addTileLayer: function(tile_url, options) {
		// var layerName;
		// if (options && options.name) {
		// 	layerName = options.name;
		// 	delete options.name;
		// } else {
		// 	layerName = 'Tiles';
		// }
		// this.layers[layerName] = new L.TileLayer(tile_url, options || {});
		// var map = this.maps[this.api];
		// map.addLayer(this.layers[layerName]);
	},

	toggleTileLayer: function(tile_url) {
		throw 'Not implemented';
	},

	getPixelRatio: function() {
		throw 'Not implemented';
	},
	
	mousePosition: function(element) {
		throw 'Not implemented';
	},

	openBubble: function(point, content) {
		var map = this.maps[this.api];
		map.showInfoWindow(marker);
	},

	closeBubble: function() {
		var map = this.maps[this.api];
		map.hideInfoWindow();
	}
},

LatLonPoint: {
	
	toProprietary: function() {
		return esri.geometry.geographicToWebMercator( new esri.geometry.Point(this.lon, this.lat, new esri.SpatialReference({ wkid: 4326 })));
	},

	fromProprietary: function(point) {
		this.lat = point.y;
		this.lon = point.x;
	}
	
},

Marker: {
	
	toProprietary: function() {
		var me = this;
        var thisIcon = new esri.symbol.PictureMarkerSymbol(this.iconUrl,25,25);

		if (me.iconSize) {
            thisIcon.setWidth(me.iconSize[0]);
            thisIcon.setHeight(me.iconSize[1]);
		}
		if (me.iconAnchor) {
            thisIcon.setOffset(me.iconAnchor[0], me.iconAnchor[1]);
		}
		// if (me.iconShadowUrl) {
		// 	thisIcon = thisIcon.extend({
		// 		shadowUrl: me.iconShadowUrl
		// 	});
		// }
		// if (me.iconShadowSize) {
		// 	thisIcon = thisIcon.extend({
		// 		shadowSize: new L.Point(me.iconShadowSize[0], me.iconShadowSize[1])
		// 	});
		// }

        var marker = new esri.Graphic(this.location.toProprietary(this.api),thisIcon);
		return marker;
	},

	openBubble: function() {
		var pin = this.proprietary_marker;
		if (this.infoBubble) {
			map.infoWindow.show();
		}
	},
	
	closeBubble: function() {
		var pin = this.proprietary_marker;
		map.infoWindow.hide();

	},

	hide: function() {
		var map = this.mapstraction.maps[this.api];
		map.removeLayer(this.proprietary_marker);
	},

	show: function() {
		var map = this.mapstraction.maps[this.api];
		map.addLayer(this.proprietary_marker);
	},
	
	isHidden: function() {
		var map = this.mapstraction.maps[this.api];
		if (map.hasLayer(this.proprietary_marker)) {
			return false;
		} else {
			return true;
		}
	},

	update: function() {
		throw 'Not implemented';
	}
	
},

Polyline: {

	toProprietary: function() {
        var points = []
            , p = null
            , path = null
            , fill = null,
            i;
        var style = new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID, this.fillColor || "#FFFFFF", this.width || 3);
        for (i = 0,  length = this.points.length ; i < length; i+=1){
            p = this.points[i].toProprietary(this.api);
            points.push([p.x, p.y]);
        }
        if (this.closed) {
            path = new esri.geometry.Polygon(new esri.SpatialReference({wkid:4326}));
            style = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID, style, this.fillColor || "#FFFFFF");
            path.addRing(points)
        } else {
            path = new esri.geometry.Polyline(new esri.SpatialReference({wkid:4326}));
            path.addPath(points)
        }

        return new esri.Graphic(path,style);
	},
	
	show: function() {
		this.map.add(this.proprietary_polyline);
	},

	hide: function() {
		this.map.remote(this.proprietary_polyline);
	},
	
	isHidden: function() {
		// if (this.map.hasLayer(this.proprietary_polyline)) {
		// 	return false;
		// } else {
		// 	return true;
		// }
	}
}

});

