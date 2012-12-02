/** Mapstraction provider for the Esri JS API
* 
* Author: Andrew Turner (@ajturner)
* Date: December 1, 2012
* 
* http://help.arcgis.com/en/webapi/javascript/arcgis/
*/

mxn.register('esri', {

Mapstraction: {
	
	init: function(element, api) {
		var me = this, p;
		dojo.require("esri.map");
		dojo.require("esri.layers.FeatureLayer");
		dojo.require("esri.dijit.BasemapGallery");

		var map = new esri.Map(element.id, {
			wrapAround180: true
		});
    	dojo.connect(map, "onLoad",function() {
				dojo.connect(map, "onClick", function(evt){
					var pt = esri.geometry.webMercatorToGeographic(evt.mapPoint);
					me.click.fire({location: new mxn.LatLonPoint(pt.y, pt.x)});
				});
				dojo.connect(map, "onMouseDown", function(evt){
					map.onPanStart.apply(map.extent, evt.mapPoint);
				});
				dojo.connect(map, "onMouseDragStart", function(evt){
					map.onPanStart.apply(map.extent, evt.mapPoint);
				});
				dojo.connect(map, "onMouseDragEnd", function(evt){
					map.centerAt(evt.mapPoint);
					me.endPan.fire();
				});
				dojo.connect(map.graphics, "onClick", function(evt) {
					// FIXME: esri - need to over-ride the Marker.setInfoBubble method to set the graphics content
					var g = evt.graphic;
					map.infoWindow.setContent(g.getContent());
					map.infoWindow.setTitle(g.getTitle());
					map.infoWindow.show(evt.screenPoint,map.getInfoWindowAnchor(evt.screenPoint));
		        });

	        // var basemap = new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer");
    	    // map.addLayer(basemap);
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
		this.maps[api] = map;
		this.setMapType();
		//this.currentMapType = mxn.Mapstraction.SATELLITE;
		this.loaded[api] = true;
		// for(p in this.options){
		// 	console.log( p + ": " + this.options[p]);
		// }

	},
	
	applyOptions: function(){
		// FIXME: esri - 'applyOptions not implemented' (ajturner)

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
		this.addControls({zoom: true, map_type: true});
	},

	addMapTypeControls: function() {
		this.addControls({map_type: true});
	},

	setCenterAndZoom: function(point, zoom) { 
		var map = this.maps[this.api];
		var pt = point.toProprietary(this.api);
		// FIXME: if this is called too soon on map loading then the extent is null.
		if(map.extent !== null) {
			map.centerAndZoom(pt, zoom);
		}
	},
	
	addMarker: function(marker, old) {
		var map = this.maps[this.api];
		var pin = marker.toProprietary(this.api);
        map.graphics.add(pin);
        return pin;
	},

	removeMarker: function(marker) {
		throw 'removeMarkers not implemented';
		// var map = this.maps[this.api];
		// map.removeLayer(marker.proprietary_marker);
	},
	
	declutterMarkers: function(opts) {
		throw 'declutterMarkers not implemented';
	},

	addPolyline: function(polyline, old) {
		var map = this.maps[this.api];
		polyline = polyline.toProprietary(this.api);
        map.graphics.add(polyline);

		this.features.push(polyline);
		return polyline;
	},

	removePolyline: function(polyline) {
		throw 'removePolyline not implemented';
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
		throw "getZoomLevelForBoundingBox not implemented."
	},

	setMapType: function(type) {
		var map = this.maps[this.api], baseMapLayer, baseMapUrl, i;
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

		switch(type) {
			case mxn.Mapstraction.ROAD:
				map.addLayer(new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer"),0);
                this.currentMapType = mxn.Mapstraction.ROAD;
                break;
            case mxn.Mapstraction.SATELLITE:
				map.addLayer(new esri.layers.ArcGISTiledMapServiceLayer("http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer"),0);
                this.currentMapType = mxn.Mapstraction.SATELLITE;
                break;
            case mxn.Mapstraction.HYBRID:
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
		throw 'addImageOverlay not implemented';
	},

	setImagePosition: function(id, oContext) {
		throw 'setImagePosition not implemented';
	},
	
	addOverlay: function(url, autoCenterAndZoom) {
		throw 'addOverlay not implemented';
	},

	addTileLayer: function(tile_url, options) {
		throw "addTileLayer not implemented."
	},

	toggleTileLayer: function(tile_url) {
		throw 'toggleTileLayer not implemented';
	},

	getPixelRatio: function() {
		throw 'getPixelRatio not implemented';
	},
	
	mousePosition: function(element) {
		throw 'mousePosition not implemented';
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
		var iconUrl = (this.iconUrl) ? this.iconUrl : "http://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png";
        var thisIcon = new esri.symbol.PictureMarkerSymbol(iconUrl,25,25);

		if (me.iconSize) {
            thisIcon.setWidth(me.iconSize[0]);
            thisIcon.setHeight(me.iconSize[1]);
		}
		if (me.iconAnchor) {
            thisIcon.setOffset(me.iconAnchor[0], me.iconAnchor[1]);
		} else  {
			thisIcon.setOffset([0,16])
		}


		// FIXME: esri - add support for iconShadowUrl and iconShadowSize (ajturner)
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
		var map = this.mapstraction.maps[this.api];
		
		if(this.labelText) {
	        map.infoWindow.setTitle(this.labelText)
		}

		if (this.infoBubble) {
			map.infoWindow.setContent(this.infoBubble);			
			map.infoWindow.show(pin.geometry,map.getInfoWindowAnchor(pin.geometry));
		}
	},
	
	closeBubble: function() {
		var pin = this.proprietary_marker;
		var map = this.mapstraction.maps[this.api];
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
		throw 'Marker.update not implemented';
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
		throw 'Polyline.isHidden not implemented';
	}
}

});

