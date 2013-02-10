
var map = null;
function initialize() {
	var mapOptions = {
			center : new google.maps.LatLng(50, 0),
			zoom : 4,
			mapTypeId : google.maps.MapTypeId.ROADMAP
	};
	map = new google.maps.Map(document.getElementById("map"),
			mapOptions);
}


function addHeatmapLayer () {
	/* Data points defined as a mixture of WeightedLocation and LatLng objects */
	var heatMapData = [];
	
	var number_of_places = places.length;
	for (var i = 0; i < number_of_places; i++) {
		var current_place = places[i];
		var latLong = new google.maps.LatLng(current_place.location.latitude, current_place.location.longitude);
		
		heatMapData.push(latLong);
	}

	var heatmap = new google.maps.visualization.HeatmapLayer({
	  data: heatMapData
	});
	heatmap.setMap(map);
}

var start_place = null;
var end_place = null;
var via_points = new Array();

function gm_place_autocomplete () {
	var start_input = document.getElementById('start_input');
	autocomplete1 = new google.maps.places.Autocomplete(start_input);
	
	
	var end_input = document.getElementById('end_input');
	autocomplete2 = new google.maps.places.Autocomplete(end_input);
	addAutocompleteListener(autocomplete2, 1);
	
	
	addAutocompleteListener(autocomplete1, 0);
}

function gm_addAutoComplete (viaPointNumber) {
	var via = document.getElementById('via' + viaPointNumber + "_input");
//	console.log(via);
	viaPoint_autocomplete = new google.maps.places.Autocomplete(via);
	
	addAutocompleteListener(viaPoint_autocomplete, 2);
}

function addAutocompleteListener (autocomplete, option) {
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
			  via_points.push = place;
		  }

//		  // If the place has a geometry, then present it on a map.
//		  if (place.geometry.viewport) {
//		    // Use the viewport if it is provided.
//		    map.fitBounds(place.geometry.viewport);
//		  } else {
//		    // Otherwise use the location and set a chosen zoom level.
//		    map.setCenter(place.geometry.location);
//		    map.setZoom(17);
//		  }
//		  
//		  var marker = new google.maps.Marker({
//			  positoin : new google.maps.LatLng(-25.363882,131.044922),
//			  map: map
//		  });
//		  
//		  var image = new google.maps.MarkerImage(
//		      place.icon, new google.maps.Size(71, 71),
//		      new google.maps.Point(0, 0), new google.maps.Point(17, 34),
//		      new google.maps.Size(35, 35));
//		  marker.setIcon(image);
//		  marker.setPosition(place.geometry.location);
//		  
//		  var infowindow = new google.maps.InfoWindow();
//		  infowindow.setContent(place.name);
//		  infowindow.open(map, marker);
		});
}


//THIS PROCESS IS PAUSED. WAIT FOR ROUTE TO BE COMPLETED
var place_ids = new Array();
var markers = new Array();
function googlemap_set_marker(place) {
	var place_id = place.id;
	
	if (place_id in place_ids) {
		// Update marker
	} else { // New place
		place_ids.push(place_id);
	}
	
	var place_name = place.name;
	var place_lat = place.location.latitude;
	var place_long = place.location.longitude;
	
	
}

//"place": {
//	"id": "149203025119254", 
//	"name": "Dover Ferry Port", 
//	"location": {
//		"street": "Glasdon Unit East Camber Eastern Dock, Dover, Kent", 
//		"city": "Dover", 
//		"state": "", 
//		"country": "United Kingdom", 
//		"zip": "CT16 1JA", 
//		"latitude": 51.126521704244, 
//		"longitude": 1.3329200119598
//	}
//}


/*
 * Knowing two points and via points (waypoint), generate the route and display on Google map.
 */

var infoWindow;
var markerArray = [];
function gm_display_route (id_place_pairs, sNId, sNName) {
	// via_places: places of photos with geographical information
	// via_places: key -> value pairs: photo ID, places of photos with geographical information
	var via_photos_ids = new Array();
	var via_places = new Array();
	for (var key in id_place_pairs) {
		via_photos_ids.push(key);
		via_places.push(id_place_pairs[key]);
	}
	
	var route = {};
	route['title'] = "abc";
	route['waypoints'] = [];
	
	for (var i=0; i < via_photos_ids.length; i++) {
		route['waypoints'].push({});
		route['waypoints'][i]['api'] = sNName;
		route['waypoints'][i]['type'] = "photo";
		route['waypoints'][i]['id'] = via_photos_ids[i];
		route['waypoints'][i]['place'] = via_places[i];
	}
	
	$.post('/allRoute', { sNId: sNId, sNName : sNName } , function(data) {
		console.log('=============data===========');
		console.log(data);
		
		var result = JSON.parse(data);
		route['id'] = result.length;
		
		// This is adding route.
		result.push(route);
		
//		console.log(JSON.stringify(result));
		$.post('/store', { postOption : "route", sNId: sNId, sNName : sNName, start_place : "start address", end_place : "end address", via_photos_ids : JSON.stringify(result) } , function(data) {
			console.log('=============data===========');
			console.log(data);
		});

	});
	
//	console.log(via_places.length);
	
	var waypoints = gm_convert_waypoints(via_places); // 40 points -> 41 routes
	
	infoWindow = new google.maps.InfoWindow();
	var i = 0;
	
	temp2(i, waypoints, 0, start_place, end_place);
//	for (var i = 0; i < waypoints.length + 1; i++) {
//		
//		
//	}
	// TODO: issue: when create new one, need to remove old routes.
}

function test_storeData () {
	var send1 = new Array();
	send1.push("100");
	send1.push("101");
	
	var send2 = new Array();
	send2.push("via 1");
	send2.push("via 2");
	
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
	
	var send3 = new Array();
	send3.push("200");
	send3.push("201");
	var send4 = new Array();
	send4.push("via 3");
	send4.push("via 4");
	
	// route2
	var route2 = {};
	route2['title'] = "abc";
	route2['waypoints'] = [];
	
	for (var i=0; i < send3.length; i++) {
		route2['waypoints'].push({});
		route2['waypoints'][i]['api'] = "twitter";
		route2['waypoints'][i]['type'] = "photo";
		route2['waypoints'][i]['id'] = send3[i];
		route2['waypoints'][i]['place'] = send4[i];
	}
	
	// push to route JSON
	myObject.push(route2);
	
	console.log(JSON.stringify(myObject));
	
	

	
	$.post('/route', { sNId: "1179454137", sNName : "Facebook" } , function(data) {
		console.log('=============data===========');
		console.log(data);
		
		var result = JSON.parse(data);
		console.log(result.length);
		route2['id'] = result.length;
		// This is adding route.
		result.push(route2);
		
		$.post('/store', { postOption : "route", sNId: "1179454137", sNName : "Facebook", start_place : "start address", end_place : "end address", via_photos_ids : JSON.stringify(result) } , function(data) {
			console.log('=============data===========');
			console.log(data);

			// decode json
//			var result = JSON.parse(data);

//			var route1 = result[0];
//			var title = route1.title;

//			console.log(title);

//			var route1waypoints = route1.waypoints;

//			for (var i = 0; i<route1waypoints.length; i++) {
//			console.log(route1waypoints[i].api);
//			}
		});

	});
	
}

function modifyJson () {
	$.post('/route', { sNId: "1179454137", sNName : "Facebook" } , function(data) {
		console.log('===data===');
		console.log(data);
		
		var result = JSON.parse(data);
		
		// .each is slow comparing to for loop
//		$(result).each( function() {
//			if (this.id === 1) this.title = "oo";
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

function temp2 (i, waypoints, pause_time, rStart, rEnd) {
	var wpNumber = 0;
	if (rStart || rEnd) {
		wpNumber = waypoints.length + 1;
	} else {
		wpNumber = waypoints.length - 1;
	}
	
	if (i < wpNumber) {
		var tempfunction = temp (i, waypoints, rStart, rEnd);
		setTimeout(tempfunction, pause_time);
	}
}
function temp (i, waypoints, rStart, rEnd) {
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
		
		var request = {
				origin:start_place_string,
				destination:end_place_string,
				travelMode: google.maps.TravelMode.DRIVING
		};
//		console.log(start_place_string + " " + end_place_string);
		
		
		directionsService.route(request, function(result, status) {
//			console.log(status);
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(result);
//				console.log(result);
				i++;
				temp2(i, waypoints, 0, rStart, rEnd);
//				var myRoute = result.routes[0].legs[0];// 9 legs in total for 8 waypoints
//				var numberOfWaypoints = result.routes[0].legs.length - 1;
//				console.log("Number of waypoints:" + numberOfWaypoints);
//				for (var i = 0; i < numberOfWaypoints; i++) {
//					var leg = result.routes[0].legs[i];
//					var marker = new google.maps.Marker({
//						position: leg.end_location,
//						map: map
//					});
//					// TODO get photos
////					attachInstructionText(marker, myRoute.steps[i].instructions);
//					var imageTag = getImageTag(via_photos_ids[i], attachInstructionText, marker);// pass function as callback
////					attachInstructionText(marker, imageTag);
//					markerArray[i] = marker;
//				}
			} else if (status == google.maps.DirectionsStatus.ZERO_RESULTS) {
				i++;
				temp2(i, waypoints, 0, rStart, rEnd);
			} else if (status == google.maps.DirectionsStatus.OVER_QUERY_LIMIT) {
				temp2(i, waypoints, 500, rStart, rEnd);// TODO 500 can be optimized. if too small, useful query will run only every second. 
			}
		});
	}
	
}


function gm_displayAllRoute (sNId, sNName) {
	console.log(sNId);
	console.log(sNName);
	
	$.post('/allRoute', { sNId: sNId, sNName : sNName } , function(data) {
		console.log('=============data===========');
		console.log(data);
		
		var routes = JSON.parse(data);
		
		var numberOfRoutes = routes.length;
		
		if (numberOfRoutes === 0) {
			console.log("No route.");
		} else {
			for (var i = 0; i < numberOfRoutes; i++) {
				var route = routes[i];
				var rTitle = route.titlel
				var rId = route.id;
				var rWaypoints = route.waypoints;
				// TODO start place, end place
				var rStart = '';
				var rEnd = '';
				
				var via_places = new Array();
				for (var j = 0; j < rWaypoints.length; j++) {
					var wp = rWaypoints[j];
					via_places[wp.id] = wp.place;
				}
				
				gm_displayRoute (via_places, rStart, rEnd)
			}
		}
	});
}

function gm_displayRoute (id_place_pairs, rStart, rEnd) {
	var via_photos_ids = new Array();
	var via_places = new Array();
	for (var key in id_place_pairs) {
		via_photos_ids.push(key);
		via_places.push(id_place_pairs[key]);
	}
	
	var waypoints = gm_convert_waypoints(via_places); // 40 points -> 41 routes
	
	infoWindow = new google.maps.InfoWindow();
	var i = 0;
	
	temp2(i, waypoints, 0, rStart, rEnd);
}

function attachInstructionText(marker, text) {
	  google.maps.event.addListener(marker, 'click', function() {
		  infoWindow.setContent(text);
		  infoWindow.open(map, marker);
	  });
	}

function gm_convert_waypoints (via_places) {
	var waypoints = [];

	// via_places.length => 8 if has only one route. Maximum of waypoints in one route is 8.
	for (var i = 0; i < via_places.length; i++) {
		waypoints.push(via_places[i].location.latitude + ', ' +via_places[i].location.longitude);
	}
	return waypoints;
}
//"place": {
//"id": "149203025119254", 
//"name": "Dover Ferry Port", 
//"location": {
//	"street": "Glasdon Unit East Camber Eastern Dock, Dover, Kent", 
//	"city": "Dover", 
//	"state": "", 
//	"country": "United Kingdom", 
//	"zip": "CT16 1JA", 
//	"latitude": 51.126521704244, 
//	"longitude": 1.3329200119598
//}
//}

