
var map = null;

var routesDisplayed = new Array();// store route ids (i.e. route creation time)
var routesMarkers = new Array();// routesMarkers[0] => array of markers in route 0. 
var routesItems = new Array();// store objects (contains route ID, markers)

var _polylineStrokeWeight = 7;
var _polylineStrokeWeightMouseOver = 14

function initialize() {
	var stylesArray = [{
		featureType: 'road',
		stylers: [{
			weight: '0.5',
			visibility: 'simplified'
		}]
	}];
	
	var mapOptions = {
			center : new google.maps.LatLng(50, 0),
			zoom : 4,
			styles: stylesArray,
			mapTypeId : google.maps.MapTypeId.ROADMAP,
			mapTypeControl: true,
			mapTypeControlOptions: {
		        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
		        position: google.maps.ControlPosition.TOP_LEFT
		    }
	};
	map = new google.maps.Map(document.getElementById("map"),
			mapOptions);
}


var curr_infoWindow;
var heatmap;
function gm_addHeatmapLayer (selectedFriendIds) {
	if (selectedFriendIds.length !== 0) {
		/* Data points defined as a mixture of WeightedLocation and LatLng objects */
		// Get bounds of the current map
		var bounds = map.getBounds();
		var ne = bounds.getNorthEast(); // LatLng of the north-east corner
		var sw = bounds.getSouthWest(); // LatLng of the south-west corder
		
		var nw = new google.maps.LatLng(ne.lat(), sw.lng());
		var se = new google.maps.LatLng(sw.lat(), ne.lng());
		
		console.log ("lonLeft:" + sw.lng());
		console.log ("lonRight:" + ne.lng());
		console.log ("latTop:" + ne.lat());
		console.log ("latBot:" + sw.lat());
		
		$.post('/bound', { lonLeft:sw.lng(), lonRight:ne.lng(), latTop:ne.lat(), latBot:sw.lat(), friendList:JSON.stringify(selectedFriendIds)} , function(data) {
			console.log('=====store=data===========');
			console.log(data);
			console.log('==end=store=data========');
			if (data) {
				data = data.substring(1,data.length-1)
				var n=data.split(", ");
				
				var heatMapData = [];
				
				for (var i = 0; i < n.length; i++) {
					var latLon = n[i].substring(1,n[i].length-1)
					var lat = latLon.split(":")[0];
					var lon = latLon.split(":")[1];
					var latLong = new google.maps.LatLng(parseFloat(lat), parseFloat(lon));
					heatMapData.push(latLong);
				}
				heatmap = new google.maps.visualization.HeatmapLayer({
					data: heatMapData
				});
				heatmap.setMap(map);
				
				google.maps.event.addListener(map, 'click', function(event) {
					// 3 seconds after the center of the map has changed, pan back to the
					// marker.
					var lat = event.latLng.Ya;
					var lon = event.latLng.Za;
					
					console.log(lat + " " + lon);
					gm_showInfoWindow(event.latLng);
				});
				f_changeHeatMapButtonText();
				return heatmap;
			} else {
				console.log("no data returned");
				return false;
			}
		});
		
		// Set all polyline weight to 3.
		for (var key in routes) {
			var routeStamp = key.split(';')[0];
			var routeComponent = key.split(';')[1];
			if (parseInt(routeComponent) || parseInt(routeComponent) === 0) {
				console.log(key);
				var routePolyline = routes[key];
				addListenersToPolyline (routePolyline, 3, 6, 3);
			} else {
				console.log(key);
			}
		}
	}
}

function gm_removeHeatmapLayer () {
	if (heatmap) {
		heatmap.setMap(null);
		for (var key in routes) {
			var routeStamp = key.split(';')[0];
			var routeComponent = key.split(';')[1];
			if (parseInt(routeComponent) || parseInt(routeComponent) === 0) {
				var routePolyline = routes[key];
				addListenersToPolyline (routePolyline, _polylineStrokeWeight, _polylineStrokeWeightMouseOver, _polylineStrokeWeight);
			}
		}
	}
}

function gm_showInfoWindow (latLng) {
	curr_infoWindow.close();
	var contentString = '<div id="content">'+
    '<div id="siteNotice">'+
    '</div>'+
    '<h2 id="firstHeading" class="firstHeading">Uluru</h2>'+
    '<div id="bodyContent">'+
    '<p>Attribution: Uluru, <a href="http://en.wikipedia.org/w/index.php?title=Uluru&oldid=297882194">'+
    'http://en.wikipedia.org/w/index.php?title=Uluru</a> (last visited June 22, 2009).</p>'+
    '</div>'+
    '</div>';
	var infowindow = new google.maps.InfoWindow({
	    content: contentString
	});
	curr_infoWindow = infowindow;
	
	infowindow.setPosition(latLng);
	infowindow.open(map);
}


var start_place = null;
var end_place = null;
var inputIdPlace = new Array(); // Used in google autocomplete for photos without GPS

function gm_place_autocomplete (inputId) {
	var input = document.getElementById(inputId);
	autocomplete = new google.maps.places.Autocomplete(input);
	addAutocompleteListener(inputId, autocomplete, 2);
}


function addAutocompleteListener (inputId, autocomplete, option) {
	google.maps.event.addListener(autocomplete, 'place_changed', function() {
		var place = autocomplete.getPlace();
		if (!place.geometry) {
			// Inform the user that a place was not found and return.
			return;
		}

		if (option === 0) { // Start place
			start_place = place;
		} else if (option === 1) {
			end_place = place;
		} else if (option === 2) {
			gm_setPlaceByInputId (inputId, place);
		}
	});
}

function gm_getPlaceByInputId (inputId) {
	return inputIdPlace[inputId];
}

function gm_setPlaceByInputId (inputId, place) {
	inputIdPlace[inputId] = place;
}

/*
 * Knowing two points and via points (waypoint), generate the route and display on Google map.
 */
var infoWindow;
function gm_display_route (id_place_pairs, sNId, sNName, timestamp) {
	// [vvvvvvv]via_places: places of photos with geographical information
	// [xxxxxxx]via_places: key -> value pairs: photo ID, places of photos with geographical information
	var via_photos_ids = new Array();
	var via_places = new Array();
	for (var i = 0; i < id_place_pairs.length; i++) {
		var pId = id_place_pairs[i].photoId;
		var place = id_place_pairs[i].place;// place could be from Facebook, Google or empty
		if (place) {
			via_photos_ids.push(pId);
			via_places.push(place);
		}
	}
	
	var lats = new Array();
	var lons = new Array();
	
	var route = {};
//	route['title'] = "abc";
	route['waypoints'] = [];
	
	for (var i=0; i < via_photos_ids.length; i++) {
		route['waypoints'].push({});
		route['waypoints'][i]['api'] = sNName;
		route['waypoints'][i]['type'] = "photo";
		route['waypoints'][i]['id'] = via_photos_ids[i];
		route['waypoints'][i]['place'] = via_places[i];

		if (via_places[i].location) {
			lats.push(via_places[i].location.latitude);
			lons.push(via_places[i].location.longitude);
		} else if (via_places[i].geometry) {
			var gp_location = via_places[i].geometry.location;
			lats.push(gp_location[Object.keys(gp_location)[0]]);
			lons.push(gp_location[Object.keys(gp_location)[1]]);
		}
	}
	
	$.post('/allRoute', { sNId: sNId, sNName : sNName } , function(data) {
		var result = JSON.parse(data);
		route['id'] = timestamp;
		
		// This is adding route.
		result.push(route);
		
		$.post('/store', { postOption : "route", sNId: sNId, sNName : sNName, start_place : "sa", end_place : "ea", route : JSON.stringify(result), itemIds:JSON.stringify(via_photos_ids), lats:JSON.stringify(lats), lons:JSON.stringify(lons) } , function(data) {
		});
	});
	
	var waypoints = gm_convert_waypoints(via_places); // 40 points -> 41 routes
	
	infoWindow = new google.maps.InfoWindow();
	var i = 0;
	
	for (var j = 0; j < via_photos_ids.length; j++) {
		via_photos_ids[j] = sNName + ":photo:" + via_photos_ids[j];
	}
	var key = sNId + ":" + sNName + ":" + timestamp;
	routesDisplayed.push(key);
	routesItems.push(new Array());// store objects
	routesMarkers.push(new Array());// store google map markers 
	
	temp2(i, waypoints, 0, start_place, end_place, via_photos_ids, key, "create");
	
	var markerBounds = new google.maps.LatLngBounds();
	for (var j = 0; j < waypoints.length; j++) {
		var wp = new google.maps.LatLng( waypoints[j].split(",")[0], waypoints[j].split(",")[1] );
		markerBounds.extend(wp);
	}
	map.fitBounds(markerBounds);
	// TODO: issue: when create new one, need to remove old routes.
}


// RouteType: create, or display
function temp2 (i, waypoints, pause_time, rStart, rEnd, itemIds, timestamp, routeType, keyStartIndex, travelMode) {
	if (waypoints.length === 1) {// Just show a marker. Bug #9
		var latlon 
		var markerLatLong = new google.maps.LatLng( waypoints[0].split(",")[0], waypoints[0].split(",")[1] );
		var markerIcon = 'static/marker_blue.png';
		marker = new google.maps.Marker({
			position: markerLatLong,
			map: map,
			icon: markerIcon
		});
	}
	var wpNumber = 0;
	if (rStart || rEnd) {
		wpNumber = waypoints.length + 1;
	} else {
		wpNumber = waypoints.length - 1;
	}
	if (i < wpNumber) {
		var tempfunction = temp (i, waypoints, rStart, rEnd, itemIds, timestamp, routeType, keyStartIndex, travelMode);
		setTimeout(tempfunction, pause_time);
	}
}

var overlays = new Array();


function temp (i, waypoints, rStart, rEnd, itemIds, timestamp, routeType, keyStartIndex, travelMode) {
	return function () {
		var start_place_string;
		var end_place_string;
		
		if (rStart || rEnd) {
			if (i === 0) { // start route
				start_place_string = start_place.formatted_address;
				start_place_string = start_place_string.replace(/\s+/g, '');// Remove all spaces
				end_place_string = waypoints[0];
			} else if (i === waypoints.length) { // last route
				start_place_string = waypoints[waypoints.length - 1];
				
				end_place_string = end_place.formatted_address;
				end_place_string = end_place_string.replace(/\s+/g, '');// Remove all spaces
			} else {
				start_place_string = waypoints[i - 1];
				end_place_string = waypoints[i];
			}
		} else {
			start_place_string = waypoints[i];
			end_place_string = waypoints[i + 1];
		}
		
		var directionsDisplay;
		var directionsService = new google.maps.DirectionsService();

		var rendererOptions = {
				draggable : true,
				suppressMarkers : true
		}
		directionsDisplay = new google.maps.DirectionsRenderer(rendererOptions);

		directionsDisplay.setMap(map);
		overlays.push(directionsDisplay);// TODO
		
		if (routeType === "create" || routeType === "edit") {
			google.maps.event.addListener(directionsDisplay, 'directions_changed', function() {// Listen when users drag the route.
				// Add the waypoint to array.
				
//				var waypointsArray = "the waypoints array";
//				var indexToInsertTheObject = "";
//				var obj = {
//					api: 'GM',
//					place: directionsDisplay.directions.
//				};
				
				// Find the new waypoint. There should be just one. 
				var directionDisplaydirections = directionsDisplay.directions;
				var NbOrHb = directionDisplaydirections[Object.keys(directionDisplaydirections)[2]];
				var newWP = NbOrHb.waypoints;
				if (newWP) {
					console.log(newWP);
					// Remove this route.
					var newWPLat = newWP[0].location[Object.keys(newWP[0].location)[0]];
					var newWPLon = newWP[0].location[Object.keys(newWP[0].location)[1]];
//					console.log(newWPLat + " " + newWPLon + " " + waypoints.length);
					// Find the closest marker to this waypoint
					var indexOfDisplayedRoute = routesDisplayed.indexOf(timestamp);
					var closestMarker = findClosestPointToNewWaypoint(newWPLat, newWPLon, routesMarkers[indexOfDisplayedRoute]);
					var closestMarkerIndex = routesMarkers[indexOfDisplayedRoute].indexOf(closestMarker);
					var closestMarkerPosition = closestMarker.position;
					var closestMarkerLat = closestMarkerPosition[Object.keys(closestMarkerPosition)[0]];
					var closestMarkerLon = closestMarkerPosition[Object.keys(closestMarkerPosition)[1]];
					// Find start and end points of this route
					var startLocation = directionsDisplay.directions.routes[0].legs[0].start_location; 
					var startLat = startLocation[Object.keys(startLocation)[0]];
					var startLon = startLocation[Object.keys(startLocation)[1]];
					var endLocation = directionsDisplay.directions.routes[0].legs[0].end_location;
					var endLat = endLocation[Object.keys(endLocation)[0]];
					var endLon = endLocation[Object.keys(endLocation)[1]];
					
					// Check the closest point is not start/end marker.
					if (
							( Math.abs(closestMarkerLat - startLat) < 0.001 && Math.abs(closestMarkerLon - startLon) < 0.0001)
							|| (Math.abs(closestMarkerLat - endLat) < 0.001 && Math.abs(closestMarkerLat - endLon) < 0.0001)
					) {
						console.log("Closest marker cannot be start/end marker");
					} else {
						directionsDisplay.setMap(null);
						var numberOfItems = 0;
						for (var j = 0; j < routesItems[indexOfDisplayedRoute].length; j++) {
							numberOfItems = numberOfItems + routesItems[indexOfDisplayedRoute][j].length;
						}
						// j is the number of route stored in the route array. 'stamp;j'
						for (var j = 0; j < numberOfItems - 1; j ++) {
							console.log(routes[timestamp+";"+j]);
							console.log(j + " " + numberOfItems);
							if (routes[timestamp+";"+j] === directionsDisplay) {
								// Create new waypoints and push start, new waypoint and end point.
								var newWaypoints = new Array();
								newWaypoints.push(startLat + "," + startLon);
								newWaypoints.push(newWPLat + "," + newWPLon);
								newWaypoints.push(endLat + "," + endLon);

								// Modify keys after this route.
								for (var k = numberOfItems - 2; k > j; k--) {
									if ( routes[timestamp + ";" + k] ) {
										var numberOfNewItems = 1; // TODO this needed to be the number of items on the new marker.
										routes[timestamp + ";" + (k + numberOfNewItems)] = routes[timestamp + ";" + k];
										delete routes[timestamp + ";" + k];
									}
								}
								// Draw two new routes.
								temp2 (0, newWaypoints, 0, '', '', null, timestamp, "edit", j);
								
								$.post('/allRoute', { sNId: sNId, sNName : sNName } , function(data) {
									var result = JSON.parse(data);
									// the new route should be the last one.
									for (var routeIndex = 0; routeIndex < result.length; routeIndex++) {
										var route = result[routeIndex];
										console.log('=====');
										console.log(route);
										console.log(route['id']);
										console.log(timestamp.split(":")[2]);
										
										if (route['id'] === timestamp.split(":")[2]) {
											var routeWPs = route['waypoints'];
											// Push to the right index.
											// j is the index to push after. Because there are j items before the route j
											var itemString = routesItems[indexOfDisplayedRoute][closestMarkerIndex][0].content;
											var snApi = $(itemString).find('p').attr('data-api');
											var snSCid = $(itemString).find('p').attr('data-scid');
											
											// TODO need place.
											var itemPlace = routesMarkers[indexOfDisplayedRoute][closestMarkerIndex].position;
											var itemToPush = {
													api: snApi,
													id: snSCid,
													place: itemPlace
											};
											console.log(j);
											routeWPs.splice(j + 1, 0, itemToPush);
											
											route['waypoints'] = routeWPs;
											
											console.log('=====');
											console.log(route);
											
											result[routeIndex] = route;
										}
									}
									
									$.post('/store', { postOption : "title", sNId: sNId, sNName : sNName, route : JSON.stringify(result) } , function(data) {
									});
								});
								// If the route is found, stop for loop.
								break;
							}
						}
					}
				}
				// Store item into array.

			});
		}
		
		var request = {
				origin:start_place_string,
				destination:end_place_string,
				travelMode: travelMode ? travelMode : google.maps.TravelMode.DRIVING
		};
		
		if (waypoints[i] === waypoints[i + 1]) {
			gm_displayItems(i, waypoints, itemIds, timestamp);
			i++;
			temp2(i, waypoints, 0, rStart, rEnd, itemIds, timestamp, routeType, keyStartIndex, travelMode);
		} else {
			directionsService.route(request, function(result, status) {
				if (status == google.maps.DirectionsStatus.OK) {
					var myRoute = result.routes[0].legs[0];
					var key = timestamp+";"+i;
					if (keyStartIndex) {
						console.log("ssssss:" + keyStartIndex);
						key = timestamp+";"+ (i + keyStartIndex);
					}
					if (routeType === "create" || routeType === "edit") {
						directionsDisplay.setDirections(result);
						directionsDisplay.setOptions({ preserveViewport: true });
						routes[key] = directionsDisplay;
					} else {
						var points = new Array();
						for (var j = 0; j < myRoute.steps.length; j++) {
			                for (var k = 0; k < myRoute.steps[j].lat_lngs.length; k++) {
			                    points.push(myRoute.steps[j].lat_lngs[k]);
			                }
			            }
						var color = gm_createColor (i, waypoints.length);
						routes[key] = drawRoute(points, color);
					}
					if (routeType !== "edit") {
						gm_displayItems(i, waypoints, itemIds, timestamp);
					}
					i++;
					temp2(i, waypoints, 0, rStart, rEnd, itemIds, timestamp, routeType, keyStartIndex, null);
				} else if (status == google.maps.DirectionsStatus.ZERO_RESULTS) {
					temp2(i, waypoints, 0, rStart, rEnd, itemIds, timestamp, routeType, keyStartIndex, google.maps.TravelMode.WALKING);
				} else if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
					temp2(i, waypoints, 500, rStart, rEnd, itemIds, timestamp, routeType, keyStartIndex, travelMode);// TODO 500 can be optimized. if too small, useful query will run only every second. 
				}
			});
		}
	}
}

function findClosestPointToNewWaypoint(newWPLat, newWPLon, gmMarkersArray) {
	var closestDistance = 255, closestMarker;
	for (var i = 0; i < gmMarkersArray.length; i++) {
		var markerPosition = gmMarkersArray[i].position;
		var currLat = markerPosition[Object.keys(markerPosition)[0]];
		var currLon = markerPosition[Object.keys(markerPosition)[1]];
		var currDistance = Math.sqrt( (newWPLat - currLat)*(newWPLat - currLat) + (newWPLon - currLon)*(newWPLon - currLon) );
		if (closestDistance > currDistance) {
			closestDistance = currDistance;
			closestMarker = gmMarkersArray[i];
		}
	}
	return closestMarker;
}

function gm_createColor (index, length) {//color start from Green #00FF00 rgb(0,255,0) -> Yellow #FFFF00 rgb(255,255,0) -> Red #FF0000 rgb(255,0,0)
	var color = "";
	var r, g, b = '0';
	if ( Math.abs(index - length/2) < 1 ) { // include index === length/2 
		color = 'rgb(255,255,0)';
	} else if (index < length/2) {
		r = Math.round(255*index*2/length);
		g = '255';
		color = 'rgb(' + r + ',' + g + ',' + b + ')';
	} else {
		r = '255';
		g = Math.round(255 - 255*(2*index - length)/length);
		color = 'rgb(' + r + ',' + g + ',' + b + ')';
	}
	return color;
}

function drawRoute (points, color) {
	var routLine = new google.maps.Polyline(
			{
				path: points,
				strokeColor: color,
				strokeOpacity: 0.5,
				strokeWeight: 7
//				editable: true
			}
	);
	routLine.setMap(map);

	// Add a listener for the rightclick event on the routLine
	google.maps.event.addListener(routLine, 'mouseover', function(){
		routLine.setOptions({
			strokeWeight: _polylineStrokeWeightMouseOver
		});
	});
	google.maps.event.addListener(routLine, 'mouseout', function(){
		routLine.setOptions({
			strokeWeight: _polylineStrokeWeight
		});
	});
	return routLine;
}


function gm_displayItems (index, waypoints, itemIds, timestamp) {
	var curr_wp = waypoints[index];
	var curr_item = itemIds[index];
	
	var curr_itemApi = curr_item.split(":")[0];
	var curr_itemType = curr_item.split(":")[1];
	var curr_itemId = curr_item.split(":")[2];
	
	var firstItemAtThisLocation;
	var lastPoint;
	if (waypoints.indexOf(curr_wp) !== index) {
		// This location has more than one image
		firstItemAtThisLocation = itemIds[waypoints.indexOf(curr_wp)];
		firstItemAtThisLocation = firstItemAtThisLocation.split(':')[2];
	}
	var markerIcon = 'static/marker_blue.png';
	if (index === 0) {
		markerIcon = 'static/marker_start.png';
	} else if (index === waypoints.length - 1) {
		markerIcon = 'static/marker_end.png';
		lastPoint = true;
	}
	var wp = waypoints[index];
	var markerLatLong = new google.maps.LatLng( wp.split(",")[0], wp.split(",")[1] );
	var marker;
	var indexOfDisplayedRoute = routesDisplayed.indexOf(timestamp);
	var obj = new Object();
	if (firstItemAtThisLocation) {// firstItemAtThisLocation is the item ID
		marker = routes[timestamp + ";marker:" + firstItemAtThisLocation];
		routesItems[ indexOfDisplayedRoute ][ routesMarkers[indexOfDisplayedRoute].indexOf(marker) ].push(obj);
		
		if (lastPoint) {
			// substitute last marker to end marker.
		}
		
	} else {
		marker = new google.maps.Marker({
			position: markerLatLong,
			map: map,
			icon: markerIcon
		});
		var key = timestamp + ";marker:" + curr_itemId;
		routes[key] = marker;
		routesMarkers[indexOfDisplayedRoute].push(marker);
		routesItems[ indexOfDisplayedRoute ].push( [obj] );
	}

	// display the last item on the route
	if (index === waypoints.length - 2 ) { 
		gm_displayItems (index + 1, waypoints, itemIds, timestamp);
	}
	
	var indexOfMarker = routesMarkers[indexOfDisplayedRoute].indexOf(marker);
	var indexOfObj = routesItems[indexOfDisplayedRoute][indexOfMarker].indexOf(obj);
	if (curr_itemApi === "Facebook") {
		if (curr_itemType === "photo") {
			// only need FB api to get image url. need to create marker here, not in the callback.
			// fb callback needs to know where to put the image. 
			fb_getImageUrl(curr_itemId, gm_displayItems_callback, indexOfDisplayedRoute, indexOfMarker, indexOfObj, lastPoint);
		} else {
			// only need FB api to get image url. need to create marker here, not in the callback.
			// fb callback needs to know where to put the image. 
			var routeTimestamp = routesDisplayed[indexOfDisplayedRoute].split(':')[2];
			console.log(routeTimestamp);
			fb_getSC(curr_itemId, gm_displayStatus, routeTimestamp);
		}
	}
}

function gm_displayItems_callback (itemId, url, description, type, indexOfDisplayedRoute, indexOfMarker, indexOfObj, lastPoint) {
//function gm_displayItems_callback (itemId, url, height, width, type, indexOfDisplayedRoute, indexOfMarker, indexOfObj, lastPoint) {
	// Put content into routesItems
	var obj = {
			href : url,
			title : description || ""
	};
	
	routesItems[indexOfDisplayedRoute][indexOfMarker][indexOfObj] = obj;
	
	if (lastPoint) {
		for (var i = 0; i < routesMarkers[indexOfDisplayedRoute].length; i++) {
			google.maps.event.clearListeners(routesMarkers[indexOfDisplayedRoute][i], 'click');// Remove old listener.
			addListenersToMarkers (routesMarkers[indexOfDisplayedRoute][i], i, indexOfDisplayedRoute);
		}
	}
}

/*
 * This function is created as a closure. 
 * See Google Map Events tutorial about 'Using Closure in Event Listeners': https://developers.google.com/maps/documentation/javascript/events#EventClosures
 */
function addListenersToMarkers (marker, i, indexOfDisplayedRoute) {// i is the index of the marker
	google.maps.event.addListener(marker, 'click', function(event) {
		var objs = new Array();
		if (curr_infoWindow) {
			curr_infoWindow.close();
		}
//		infowindow.open(map,marker);
//		curr_infoWindow = infowindow;
		for (var j = 0; j < routesItems[indexOfDisplayedRoute][i].length; j ++ ) {
			objs.push(routesItems[indexOfDisplayedRoute][i][j]);
		}
		
		$.fancybox.open(objs, {
			helpers : {
				thumbs : {
					width: 75,
					height: 50
				}
			}
		});
	});
}

function addListenersToPolyline (routePolyline, initialWeight, mouseOverWeight, mouseOutWeight) {
	routePolyline.setOptions({
		strokeWeight: initialWeight
	});
	google.maps.event.clearListeners(routePolyline, 'mouseOver');
	google.maps.event.clearListeners(routePolyline, 'mouseout');
	google.maps.event.addListener(routePolyline, 'mouseover', function(){
		routePolyline.setOptions({
			strokeWeight: mouseOverWeight
		});
	});
	google.maps.event.addListener(routePolyline, 'mouseout', function(){
		routePolyline.setOptions({
			strokeWeight: mouseOutWeight
		});
	});
}

function gm_displayAllRoute (sNId, sNName) {
	$.post('/allRoute', { sNId: sNId, sNName : sNName } , function(data) {
		var routes = JSON.parse(data);
		
		var numberOfRoutes = routes.length;
		
		if (numberOfRoutes === 0) {
			console.log("No route.");
		} else {
			console.log(numberOfRoutes + " route(s) being loaded...");
			for (var i = 0; i < numberOfRoutes; i++) {
				var route = routes[i];
				var rTitle = route.title;
				var rId = route.id;
				var rWaypoints = route.waypoints;
				var itemIds = new Array();
				// TODO start place, end place
				var rStart = '';
				var rEnd = '';
				
				var via_places = new Array();
				console.log("Loading route " + i + ". There are " + rWaypoints.length + " waypoint(s).");
				for (var j = 0; j < rWaypoints.length; j++) {
					var wp = rWaypoints[j];
					via_places[wp.id] = wp.place;
					itemIds.push(wp.api + ":" + wp.type + ":" + wp.id);
				}
//				gm_displayRoute (via_places, rStart, rEnd, itemIds, timestamps[i]);
				gm_displayRoute (via_places, rStart, rEnd, itemIds, sNId + ":" + sNName + ":" + rId);
			}
		}
	});
}

var routes = new Array();
function gm_displayRoute (id_place_pairs, rStart, rEnd, itemIds, stamp) {
	routesDisplayed.push(stamp);
	routesItems.push(new Array());// store objects
	routesMarkers.push(new Array());// store google map markers 
	
	var via_photos_ids = new Array();
	var via_places = new Array();
	for (var key in id_place_pairs) {
		via_photos_ids.push(key);
		via_places.push(id_place_pairs[key]);
	}
	var waypoints = gm_convert_waypoints(via_places); // 40 points -> 41 routes
	
	infoWindow = new google.maps.InfoWindow();
	var i = 0;
	
	temp2(i, waypoints, 0, rStart, rEnd, itemIds, stamp);
}

function gm_convert_waypoints (via_places) {
	var waypoints = [];
	for (var i = 0; i < via_places.length; i++) {
		if (via_places[i].location) {
			waypoints.push(via_places[i].location.latitude + ', ' +via_places[i].location.longitude);
		} else if (via_places[i].geometry) {
			var gp_location = via_places[i].geometry.location;
			waypoints.push(gp_location[Object.keys(gp_location)[0]] + ', ' + gp_location[Object.keys(gp_location)[1]]);
		} else {
			waypoints.push(via_places[i][Object.keys(via_places[i])[0]] + ',' + via_places[i][Object.keys(via_places[i])[1]]);
		}
	}
	return waypoints;
}


function gm_removeRoute (stamp) {// stamp example: 100004981873901:Facebook:0 snId:snName:routeId
	for (var key in routes) {
		if (stamp === key.split(';')[0]) {
			routes[key].setMap(null);
			delete routes[key];
		} else {
			console.log('not remove' + stamp + " " + key);// because other routes exist on map
		}
	}
}


function gm_displayStatus (uId, sNName, sId, sPlace, sMsg, rId) {
	console.log (uId + " " + sNName + " " + sId + " " + sPlace + " " + sMsg + " " + rId) ;
	if (sPlace) {
		var contentString;
		if (sMsg) {
			contentString = '<div><p data-sNId="' + uId + '" data-api="' + sNName + '"' + ' data-scId="' + sId + '">' + sMsg + ' - at ' + sPlace.name + '.</p></div>';
		} else {
			contentString = '<div><p data-sNId="' + uId + '" data-api="' + sNName + '"' + ' data-scId="' + sId + '">Checked in at ' + sPlace.name + '</p></div>';
		}
		var obj = {
				content: contentString
		};
		
		var lat = sPlace.location.latitude;
		var lon = sPlace.location.longitude;
		var marker;
		
		var stamp = uId + ":" + sNName + ":" + rId;
		var currRouteIndex = routesDisplayed.indexOf(stamp);
		var currMarkers = routesMarkers[currRouteIndex];
		for (var i = 0; i < currMarkers.length; i++) {
			var markerPosition = currMarkers[i].position;
			var mLat = markerPosition[Object.keys(markerPosition)[0]];
			var mLon = markerPosition[Object.keys(markerPosition)[1]];
			if ( Math.abs(mLat - lat) < 0.00000000001 && Math.abs(mLon - lon) < 0.00000000001) {
				console.log(obj);
				marker = currMarkers[i];
				// Push status/checkin to routesItems objects array. 
				
				if ( routesItems[ currRouteIndex ][ i ].length ===  1 && routesItems[ currRouteIndex ][ i ][0]) {// when displaying routes, an empty item will be pushed to this array. So if that is the case, we need to replace the empty object.
					routesItems[ currRouteIndex ][ i ][0] = obj;
				} else {
					routesItems[ currRouteIndex ][ i ].push(obj);
				}
				
				google.maps.event.clearListeners(marker, 'click');// Remove old listener.
				addListenersToMarkers (marker, i, currRouteIndex);// Add new listener with objects updated
				break;
			}
		}
		
		if (!marker) {
			console.log("new marker");
			var markerIcon = 'static/marker_blue.png';
			var markerLatLong = new google.maps.LatLng( lat, lon );
			marker = new google.maps.Marker({
				position: markerLatLong,
				map: map,
				icon: markerIcon
			});
			var key = stamp + ";marker:" + sId;
			routes[key] = marker;
			routesMarkers[currRouteIndex].push(marker);
			routesItems[ currRouteIndex ].push( [obj] );
			
			addListenersToMarkers (marker, routesItems[currRouteIndex].length - 1, currRouteIndex);
		}
		
		// Old way of showing status: use infowindow.
//		var infowindow = new google.maps.InfoWindow({
//		    content: contentString,
//		    maxWidth: 1000
//		});
//		
//		var key = uId + ":" + sNName + ":" + rId + ";marker:" + sId;
//		routes[key] = marker;
//		
//		google.maps.event.addListener(marker, 'click', function() {
//			if (curr_infoWindow) {
//				curr_infoWindow.close();
//			}
//			infowindow.open(map,marker);
//			curr_infoWindow = infowindow;
//		});
	}
	
}
















function test_storeData () {
	var send1 = new Array("100", "101");
	var send2 = new Array();
	
	var place1 = '"place": {"id": "149203025119254","location": {"street": "Glasdon Unit East Camber Eastern Dock, Dover, Kent", "city": "Dover","latitude": 51.126521704244, "longitude": 1.3329200119598}}'
	var place2 = '"place": {"id": "123456","location": {"street": "acv", "city": "dd","latitude": 1, "longitude": 2}}'
	send2.push(place1);
	send2.push(place2);
	
	var itemIds = new Array();
	var lats = new Array();
	var lons = new Array();
	
	for (var i = 0; i < send2.length; i++) {
		
	}
	
//	var myObject = {};//1
//	myObject.route = [];//1
//	myObject.route.push({});//number of routes
//	// for each route:
//	myObject.route[0]['title'] = "abc";
//
//	myObject.route[0]['waypoints'] = [];
//	for (var i=0; i < send1.length; i++) {
//		myObject.route[0]['waypoints'].push({});
//		
//		myObject.route[0]['waypoints'][i]['api'] = "facebook";
//		myObject.route[0]['waypoints'][i]['type'] = "photo";
//		myObject.route[0]['waypoints'][i]['id'] = send1[i];
//		myObject.route[0]['waypoints'][i]['place'] = send2[i];
//	}
	
	var myObject = [];
	myObject.push({});//number of routes
	myObject[0]['title'] = "abc";
	myObject[0]['waypoints'] = [];
	for (var i=0; i < send1.length; i++) {
		myObject[0]['waypoints'].push({});
		
		myObject[0]['waypoints'][i]['api'] = "facebook";
		myObject[0]['waypoints'][i]['type'] = "photo";
		myObject[0]['waypoints'][i]['id'] = send1[i];
		myObject[0]['waypoints'][i]['place'] = send2[i];
	}
	
	var send3 = new Array("200", "201");
	var send4 = new Array("via 3", "via 4");
	
	// route2
//	var route2 = {};
//	route2['title'] = "abc";
//	route2['waypoints'] = [];
//	
//	for (var i=0; i < send3.length; i++) {
//		route2['waypoints'].push({});
//		route2['waypoints'][i]['api'] = "twitter";
//		route2['waypoints'][i]['type'] = "photo";
//		route2['waypoints'][i]['id'] = send3[i];
//		route2['waypoints'][i]['place'] = send4[i];
//	}
//	
//	// push to route JSON
//	myObject.push(route2);
	
//	console.log(JSON.stringify(myObject));
	
	
	
//	$.post('/route', { sNId: "1179454137", sNName : "Facebook" } , function(data) {
//		console.log('=============data===========');
//		console.log(data);
//		
//		var result = JSON.parse(data);
//		console.log(result.length);
//		route2['id'] = result.length;
//		// This is adding route.
//		result.push(route2);
		
		$.post('/store', { postOption : "route", sNId: "1179454137", sNName : "Facebook", start_place : "sa", end_place : "ea", route : JSON.stringify(myObject), via_photos_ids : JSON.stringify(send1), via_places : JSON.stringify(send2) } , function(data) {
			console.log('=============data===========');
			console.log(data);
		});

//	});
	
}

function modifyJson () {
	$.post('/route', { sNId: "1179454137", sNName : "Facebook" } , function(data) {
		console.log('===data===');
		console.log(data);
		
		var result = JSON.parse(data);
		
		// .each is slow comparing to for loop
//		$(result).each( function() {
//			if (this.id === 1) this. = "oo";
//		});
		
		for (var i = 0; i < result.length; i++){
			if (result[i].id === 1){ 
				console.log("lol");
				result[i].title = "efg";
				break;
			}
		}
		// Write back to DB
		console.log(result);
	});
}


