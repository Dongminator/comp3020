
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
	console.log(via);
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
function gm_display_route (id_place_pairs) {
	// via_places: places of photos with geographical information
	// via_places: key -> value pairs: photo ID, places of photos with geographical information
	var via_photos_ids = new Array();
	var via_places = new Array();
	for (var key in id_place_pairs) {
		via_photos_ids.push(key);
		via_places.push(id_place_pairs[key]);
	}
	console.log(via_places.length);
	
	var waypoints = gm_convert_waypoints(via_places); // 40 points -> 41 routes
	
	infoWindow = new google.maps.InfoWindow();
	var i = 0;
	
	temp2(i, waypoints);
//	for (var i = 0; i < waypoints.length + 1; i++) {
//		
//		
//	}
	// TODO: issue: when create new one, need to remove old routes.
}

function temp2 (i, waypoints) {
	if (i < waypoints.length + 1) {
//		console.log("l: " + waypoints.length + 1);
		var tempfunction = temp (i, waypoints);
		setTimeout(tempfunction, 1000);
		console.log("i:" + i);
	}
}
function temp (i, waypoints) {
	return function () {
		var start_place_string;
		var end_place_string;
		
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
		console.log(start_place_string + " " + end_place_string);
		
		
		directionsService.route(request, function(result, status) {
			console.log(status);
			if (status == google.maps.DirectionsStatus.OK) {
				directionsDisplay.setDirections(result);
				console.log(result);
				i++;
				temp2(i, waypoints);
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
				temp2(i, waypoints);
			}
		});
	}
	
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

