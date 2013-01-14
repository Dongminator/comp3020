//Additional JS functions here

// All pages need to check login status.

// Only login page will invoke login function.

var access_token;

window.fbAsyncInit = function() {
	FB.init({
		appId      : '151350358347579', // App ID
		channelUrl : '//donglinpu-comp3020.appspot.com/channel.html', // Channel File
		status     : true, // check login status
		cookie     : true, // enable cookies to allow the server to access the session
		xfbml      : true  // parse XFBML
	});

	// Only redirect to home page if user is connected. 
	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			// connected
			document.getElementById('fb-logout').style.display = 'block';
			access_token = response.authResponse.accessToken
		} else {
			// Redirect to login.html
			window.location = "/login";
			document.getElementById('fb-logout').style.display = 'block';
		}
	});
	
	FB.Event.subscribe('auth.logout', function(response) {
		window.location = "/";
	});
	
};

function logout() {
    FB.logout(function(response) {
        console.log('User is now logged out');
    });

}

var album_ids = new Array();
var compare_date = "2012-12-31T23:59:59+0000";
var milli_second = Date.parse(compare_date);

function testAPI() {
	console.log('Welcome!  Fetching your information.... ');
	FB.api('/me?fields=albums', function(response) {
		
		var data_array = response.albums.data;
		console.log('Good to see you, ' + data_array[0].updated_time + '.' + data_array.length + ".");
		
		var length = data_array.length,
		element = null;
		for (var i = 0; i < length; i++) {
			element = data_array[i];
			date = element.updated_time;
			var update_time_in_milliseconds = Date.parse(date);
			if (update_time_in_milliseconds > milli_second) { // photo date is after 12.31
				console.log(element.name + ' album ' + element.id + ' updated after new year: ' + date + '.');
				album_ids.push(element.id);
			}
		}
		
		var number_of_albums = album_ids.length, album = null;
		var number_of_photos = 0;
		
		for (var i = 0; i < number_of_albums; i++) {
			album = album_ids[i];
			get_photos('/' + album + '?fields=photos');
		}
		
	});
}

var count = 0;


function get_photos (url) {
	FB.api(url, function(response) {
		console.log(response);
		output_photos(response);

		if (response.photos) { // first page of photos. 
			if (response.photos.paging.next) {
				new_url = response.photos.paging.next.substring(26);
				console.log(new_url);
				get_photos(new_url); // TODO https://graph.facebook.com/10200193006046072/photos?limit=25&after=MTAyMDAxOTMwMjUyODY1NTM=
			}
		} else { // not first page -> 2,3,4... pages. Only have one data field. 
			if (response.paging.next) {
				new_url = response.paging.next.substring(26);
				console.log(new_url);
				get_photos(new_url); // TODO https://graph.facebook.com/10200193006046072/photos?limit=25&after=MTAyMDAxOTMwMjUyODY1NTM=
			}
		}
		
	});
}


var places = [];

/*
 * TODO: should let user know when the photo loading process is finished. 
 */
function output_photos (response) {
	var photos = null;
	
	if (response.photos) {
		photos = response.photos.data;
	} else {
		photos = response.data;
	}

	var number_of_photos = photos.length;
	var photo = null;
	for (var j = 0; j < number_of_photos; j++) {
		photo = photos[j];
		var created_time = photo.created_time;
		var created_time_millisecond = Date.parse(created_time);
		
		
		if (created_time_millisecond > milli_second) {
			var img = document.createElement("img");
			url = photo.images[4].source; // TODO size of photo
			img.src = url;
			var src = document.getElementById("feed");
			src.appendChild(img);
			count = count + 1;
			
			/*
			 * TODO: location should be stored in the database with the number of visits. 
			 * If user manually modifies the location i.e. drag the marker, the location information should be overwriten and stored in the DB.
			 */
			if (photo.place) { // Check place property is set for the photo.
				var place = photo.place; // load the place fields. (include .lat, .long, .zip etc)
				places.push(place);
			} 
		}

	}
}

// Load the SDK Asynchronously
(function(d){
	var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement('script'); js.id = id; js.async = true;
	js.src = "//connect.facebook.net/en_US/all.js";
	ref.parentNode.insertBefore(js, ref);
}(document));


function create_route () {
	$("#create-route-dialog").dialog({ 
		width: 550,
		height: 400,
		draggable: false,
		buttons: {
			Create: function(){
				
				var datepicker_date = $( "#create-route-datapicker" ).datepicker( "getDate" ); // Get Date from datepicker. return "Tue Jan 01 2013 00:00:00 GMT+0000 (GMT Standard Time)"
				
				var timezone_tag = document.getElementById("timezone"); // #timezone select tag
				var timezone_value = timezone_tag.options[timezone_tag.selectedIndex].value; // Timezone value. return "00:00,1"
				
				var offset_int = parseInt(timezone_value.split(":")[0]); // Get "00" then convert string to int
				
				var utc = datepicker_date.getTime() + (datepicker_date.getTimezoneOffset() * 60000); // Return 1356998400000
				
				var actual_date = new Date(utc - (3600000*offset_int)); // Now you have actual Date with correct timezone. return "Mon Dec 31 2012 16:00:00 GMT+0000 (GMT Standard Time) "
				console.log(actual_date);
				
				//TODO convert this number to facebook date format. then get photos after that Date.
				
				$( this ).dialog( "close" ); // Close dialog
			},
			Cancel: function(){
				$( this ).dialog( "close" ); // Close dialog
			}
		}
	});
	
	// Datapicker from jQuery UI libruary
	$("#create-route-datapicker").datepicker({
	    dateFormat: 'yy-mm-dd '
	});
	
	calculate_time_zone();
}



// The next two functions (calculate_time_zone & convert) by Josh Fraser (http://www.onlineaspect.com)
function calculate_time_zone() {
	var rightNow = new Date();
	var jan1 = new Date(rightNow.getFullYear(), 0, 1, 0, 0, 0, 0);  // jan 1st
	var june1 = new Date(rightNow.getFullYear(), 6, 1, 0, 0, 0, 0); // june 1st
	var temp = jan1.toGMTString();
	var jan2 = new Date(temp.substring(0, temp.lastIndexOf(" ")-1));
	temp = june1.toGMTString();
	var june2 = new Date(temp.substring(0, temp.lastIndexOf(" ")-1));
	var std_time_offset = (jan1 - jan2) / (1000 * 60 * 60);
	var daylight_time_offset = (june1 - june2) / (1000 * 60 * 60);
	var dst;
	if (std_time_offset == daylight_time_offset) {
		dst = "0"; // daylight savings time is NOT observed
	} else {
		// positive is southern, negative is northern hemisphere
		var hemisphere = std_time_offset - daylight_time_offset;
		if (hemisphere >= 0)
			std_time_offset = daylight_time_offset;
		dst = "1"; // daylight savings time is observed
	}
	var i;
	// check just to avoid error messages
	if (document.getElementById('timezone')) {
		for (i = 0; i < document.getElementById('timezone').options.length; i++) {
			if (document.getElementById('timezone').options[i].value == convert(std_time_offset)+","+dst) {
				document.getElementById('timezone').selectedIndex = i;
				break;
			}
		}
	}
}

function convert(value) {
	var hours = parseInt(value);
	value -= parseInt(value);
	value *= 60;
	var mins = parseInt(value);
	value -= parseInt(value);
	value *= 60;
	var secs = parseInt(value);
	var display_hours = hours;
	// handle GMT case (00:00)
	if (hours == 0) {
		display_hours = "00";
	} else if (hours > 0) {
		// add a plus sign and perhaps an extra 0
		display_hours = (hours < 10) ? "+0"+hours : "+"+hours;
	} else {
		// add an extra 0 if needed 
		display_hours = (hours > -10) ? "-0"+Math.abs(hours) : hours;
	}

	mins = (mins < 10) ? "0"+mins : mins;
	return display_hours+":"+mins;
}

