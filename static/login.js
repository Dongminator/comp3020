//Additional JS functions here

// All pages need to check login status.

// Only login page will invoke login function.


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
			testAPI();
		} else {
			// cancelled
		}
	}, {scope: 'email, user_photos, friends_photos'});
//	add permission
}

function testAPI() {
	console.log('Welcome!  Fetching your information.... ');
	FB.api('/me', function(response) {
		console.log('Good to see you, ' + response.name + '.');
	});
}

// Load the SDK Asynchronously
(function(d){
	var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement('script'); js.id = id; js.async = true;
	js.src = "//connect.facebook.net/en_US/all.js";
	ref.parentNode.insertBefore(js, ref);
}(document));




