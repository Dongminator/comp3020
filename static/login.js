var _ipinfodbAPIKey = "1902d940963f8a010cda2909819504d60670e7f129b8641eb0b620d1aac1f4c4";
var loginButton;
$(document).ready(function(){
	ipToLocation();
});

function initialize(center) {
	var zoomLevel = 8;
	if (!center) {
		center = new google.maps.LatLng(0, 0);
		zoomLevel = 2;
	}
	var mapOptions = {
			draggable: false,
			zoomControl: false,
			scrollwheel: false, 
			disableDoubleClickZoom: true,
			center: center,
			zoom: 12,
			mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	var map = new google.maps.Map(document.getElementById("map"), mapOptions);
	
	contentSetup();
}

function ipToLocation () {
	var url = "http://api.ipinfodb.com/v3/ip-city/?key=" + _ipinfodbAPIKey + "&format=json&callback=dataCallback";
	try {
		script = document.createElement('script');
		script.src = url;
		document.body.appendChild(script);
	} catch(err) {}
	
	dataCallback = function(data){
		lat = data.latitude;
		lon = data.longitude;
	    if (lat && lon) {
	    	initialize(new google.maps.LatLng(lat, lon));
	    }
	};
}


function contentSetup () {
	loginButton = $('<button>').prependTo('#content').button({
		label: "Sign in with Facebook"
	}).click(function( event ) {
		login();
    }).css('margin', '20px auto 10px auto').css('width', '350px');;

	$('#leftInfo').css('float', 'left').css('margin', '0px 0px 0px 10px');
	$('#rightInfo').css('float', 'right').css('margin', '0px 10px 0px 0px');
	
	var newSize = $(window).height()*100/610;
	$('p').css('font-size', newSize + "%");
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
	var newSize = $(window).height()*100/610;
	$('p').css('font-size', newSize + "%");
});

