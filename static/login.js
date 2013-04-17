var _ipinfodbAPIKey = "1902d940963f8a010cda2909819504d60670e7f129b8641eb0b620d1aac1f4c4";
var _buttonHeight = 36;
var _h2Height = 27;
var loginButton;
$(document).ready(function(){
	ipToLocation();
});

function initialize(center, zoomLevel) {
	if (!center) {
		center = new google.maps.LatLng(0, 0);
		zoomLevel = 1;
	}
	var mapOptions = {
			draggable: false,
			zoomControl: false,
			scrollwheel: false, 
			disableDoubleClickZoom: true,
			center: center,
			zoom: zoomLevel,
			mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	var map = new google.maps.Map(document.getElementById("map"), mapOptions);
	contentSetup();
}

function ipToLocation () {
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(displayLocation, displayDefaultLocation);
	} else {
		initialize(new google.maps.LatLng(0, 0), 1);
	}
}

function displayLocation (position) {
	initialize(new google.maps.LatLng(position.coords.latitude, position.coords.longitude), 11);
}

function displayDefaultLocation (error) {
	switch (error.code) {
	case error.PERMISSION_DENIED:
		initialize(new google.maps.LatLng(0, 0), 1);
			break;
	case error.POSITION_UNAVAILABLE:
		initialize(new google.maps.LatLng(0, 0), 1);
			break;
	case error.TIMEOUT:
		initialize(new google.maps.LatLng(0, 0), 1);
			break;
	case error.UNKNOWN_ERROR:
		initialize(new google.maps.LatLng(0, 0), 1);
			break;
	}
}

/*
 * Old version. The ipinfodb is not accurate because users of the website contribute to their database.
 */
//function ipToLocation () {
//	var url = "http://api.ipinfodb.com/v3/ip-city/?key=" + _ipinfodbAPIKey + "&format=json&callback=dataCallback";
//	try {
//		script = document.createElement('script');
//		script.src = url;
//		document.body.appendChild(script);
//	} catch(err) {}
//	
//	dataCallback = function(data){
//		lat = data.latitude;
//		lon = data.longitude;
//	    if (lat && lon) {
//	    	initialize(new google.maps.LatLng(lat, lon));
//	    }
//	};
//}

function contentSetup () {
	loginButton = $('<button>').prependTo('#content').button({
		label: "Sign in with Facebook"
	}).click(function( event ) {
		login();
    }).css('margin', '20px auto 10px auto').css('width', '350px');;

	$('#leftInfo').css('float', 'left').css('margin', '0px 0px 0px 5px');
	$('#rightInfo').css('float', 'right').css('margin', '0px 5px 0px 0px');
	
	resizeContent();
}

function resizeContent () {
	var contentButtonH2Height = $('.infoContent').offset().top - $('#content').offset().top;
	var contentHeight = $('#content').height();
	$('p').css('font-size', '120%');
	$('.infoContent').css('overflow-y', 'auto').css('height', contentHeight - contentButtonH2Height);
//	var newSize = $(window).height()*100/650;
//	if (newSize < 100) {
//		$('.infoContent').css('overflow-y', 'scroll').css('height', contentHeight - contentButtonH2Height);
//		$('p').css('font-size', '100%');
//	} else {
//		$('.infoContent').css('overflow-y', 'hidden').css('height', contentHeight - contentButtonH2Height);;
//		$('p').css('font-size', newSize + "%");
//	}
}

window.fbAsyncInit = function() {
	FB.init({
		appId      : '151350358347579', // App ID
		channelUrl : '//donglinpu-comp3020.appspot.com/channel.html', // Channel File
		status     : true, // check login status
		cookie     : true, // enable cookies to allow the server to access the session
		xfbml      : true  // parse XFBML
	});

	// Only redirect to home page if user is connected. 
	// If user has previously visited this site and connected to Facebook
	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			// connected
			// Redirect to home.html
			window.location = "/home";
		}
	});
	
	// If the user visits the site for the first time and goes through the log in process. 
	// Need to listen to auth.login event.
	FB.Event.subscribe('auth.login', function(response) {
		window.location = "/home";
	});
};

function login() {
	FB.login(function(response) {
		if (response.authResponse) {
			// connected
		} else {
			// cancelled
		}
	}, {scope: 'user_status, email, user_photos, friends_photos, read_mailbox, read_friendlists'});
//	add permission
	/*
	 * read_friendlists : read friend list.
	 */
}

// Load the SDK Asynchronously
(function(d){
	var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement('script'); js.id = id; js.async = true;
	js.src = "//connect.facebook.net/en_US/all.js";
	ref.parentNode.insertBefore(js, ref);
}(document));


$(window).resize(function() {
	resizeContent();
});

