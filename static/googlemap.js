
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



