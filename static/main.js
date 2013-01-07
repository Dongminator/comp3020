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
			testAPI();
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

		if (response.photos) {
			if (response.photos.paging.next) {
				new_url = response.photos.paging.next.substring(26);
			}
		} else {
			if (response.paging.next) {
				new_url = response.paging.next.substring(26);
			}
		}
		console.log(new_url);
		get_photos(new_url); // TODO https://graph.facebook.com/10200193006046072/photos?limit=25&after=MTAyMDAxOTMwMjUyODY1NTM=
		
	});
}

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
