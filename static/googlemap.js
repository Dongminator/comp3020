
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
	
	addAutocompleteListener(autocomplete1, 0);
	addAutocompleteListener(autocomplete2, 1);
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
function display_route () {
	var directionsDisplay;
	var directionsService = new google.maps.DirectionsService();

	directionsDisplay = new google.maps.DirectionsRenderer();


	directionsDisplay.setMap(map);
	
	var start_place_string = start_place.formatted_address;
	var end_place_string = end_place.formatted_address;
	start_place_string = start_place_string.replace(/\s+/g, '');// Remove all spaces
	end_place_string = end_place_string.replace(/\s+/g, '');// Remove all spaces
	
	var start = start_place_string;
	var end = end_place_string;
	var request = {
			origin:start,
			destination:end,
			travelMode: google.maps.TravelMode.DRIVING
	};
	directionsService.route(request, function(result, status) {
		if (status == google.maps.DirectionsStatus.OK) {
			directionsDisplay.setDirections(result);
		}
	});
	
	// TODO: issue: when create new one, need to remove old routes.
	
}





