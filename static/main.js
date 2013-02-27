//All pages need to check login status.
//Only login page will invoke login function.

//TODO: ISSUE: if more than 1 album is fetched, photos from diff albums are mixed. 
var access_token;
var sNName = "Facebook";
var sNId = "";

$(document).ready(function(){
	$( "button" ).button();
	$( "#tabs" ).tabs();
	
	$("#tabs").hover(function(){
	    $(this).stop(true, false).animate({ opacity:0.8  });// in
	}, function() {
	    $(this).stop(true, false).animate({ opacity:0.2 });// out
	});
});

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
			access_token = response.authResponse.accessToken
			sNId = response.authResponse.userID;
//			FB.api('/' + sNId, function(response) {
//				var name = response.name;
//				$('#meTab').find('a:first').text('My routes');
//			});
			// Post store. 
			$.post('/store', { postOption: "connect", sNName : sNName,  sNId : sNId } , function(data) {
			});
			
			addSelectAllButton();
			loadFriendList('/me/friends?fields=installed');// in friend.js
			
			populateMyRoutes(sNId, 'Facebook');
		} else {
			// Redirect to login.html
			window.location = "/login";
//			document.getElementById('fb-logout').style.display = 'block';
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

//Load the SDK Asynchronously
(function(d){
	var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
	if (d.getElementById(id)) {return;}
	js = d.createElement('script'); js.id = id; js.async = true;
	js.src = "//connect.facebook.net/en_US/all.js";
	ref.parentNode.insertBefore(js, ref);
}(document));


function choosePhotoOption () {
	// Use photos from Facebook or Upload photos
	$("#choose-photo-option").dialog({ 
		width: 350,
		height: 'auto',
		draggable: false,
		buttons: {
			Cancel: function(){
				$( this ).dialog( "close" ); // Close dialog
			}
		}
	});
}

function dialog_load_photos_from_facebook () {
	$("#choose-photo-option").dialog( "close" ); // Close dialog
//	load_photos_from_facebook_title();
	loading_dialog("Loading your albums information...");
	getAllAlbumsIds("/me?fields=albums", album_selection_dialog);
}

function upload_photo () {
	$("#choose-photo-option").dialog( "close" ); // Close dialog
}

//function load_photos_from_facebook_title () {
//	$("#facebook_photo_date_location_dialog").dialog({ 
//		width: 500,
//		height: 350,
//		draggable: false,
//		buttons: {
//			Next: function(){
//				var datepicker_date = $( "#create-route-datapicker" ).datepicker( "getDate" ); // Get Date from datepicker. return "Tue Jan 01 2013 00:00:00 GMT+0000 (GMT Standard Time)"
//				var timezone_tag = document.getElementById("timezone"); // #timezone select tag
//				var timezone_value = timezone_tag.options[timezone_tag.selectedIndex].value; // Timezone value. return "00:00,1"
//				var offset_int = parseInt(timezone_value.split(":")[0]); // Get "00" then convert string to int
//				var utc = datepicker_date.getTime() + (datepicker_date.getTimezoneOffset() * 60000); // Return 1356998400000
//				var actual_date = new Date(utc - (3600000*offset_int)); // Now you have actual Date with correct timezone. return "Mon Dec 31 2012 16:00:00 GMT+0000 (GMT Standard Time) "
//
//				//TODO convert this number to facebook date format ISO-8601. then get photos after that Date.
//				// Now need to load fb albums.
//
//				get_album_ids(Date.parse(actual_date), album_selection_dialog);
//				$( this ).dialog( "close" ); // Close dialog
//				// Next dialog: edit via points dialog
//				loading_dialog("Loading your albums information...");
//			}
//		}
//	});
//
//	// Datapicker from jQuery UI libruary
//	$("#create-route-datapicker").datepicker({
//		dateFormat: 'yy-mm-dd '
//	});
//
//	calculate_time_zone();
//	gm_place_autocomplete();
//}

function get_album_ids(parsedDate, callback){
	var albums_updated_after_parsedDate = new Array();

	FB.api('/me?fields=albums', function(response) {

		var data_array = response.albums.data;
		var length = data_array.length,
		element = null;
		for (var i = 0; i < length; i++) {
			element = data_array[i];
			date = element.updated_time;
			var update_time_in_milliseconds = Date.parse(date);
			if (update_time_in_milliseconds > parsedDate) { // photo date is after 12.31
				albums_updated_after_parsedDate.push(element.id);
			}
		}
		$('#loading_dialog').dialog( "close" );
		callback(albums_updated_after_parsedDate, parsedDate);// album_selection_dialog
	});
}

var allAlbumIds = new Array();
function getAllAlbumsIds (url, callback) {
	FB.api(url, function(response) {
		var data;
		var paging;
		if (response.albums) {
			data = response.albums.data;
			paging = response.albums.paging;
		} else if (response.data) {
			data = response.data;
			paging = response.paging;
		}
		for (var i = 0; i < data.length; i++) {
			var album = data[i];
			allAlbumIds.push(album.id);
		}
		if (paging && paging.next) {
			var newUrl = paging.next.substring(26);// 26: https://graph.facebook.com/
			getAllAlbumsIds (newUrl, callback)
		} else {
			callback(allAlbumIds, 0);// album_selection_dialog
		}
	});
}

function album_selection_dialog (album_id_array, parsedDate) {
	var selected_album_ids = new Array();
	$('#loading_dialog').dialog( "close" );
	$("#facebook_album_selection_dialog").dialog({ 
		width: 1400,
		height: 600,
		draggable: false,
		buttons: {
			Next: function(){
				$( this ).dialog( "close" ); // Close dialog
				photo_selection_dialog(selected_album_ids, parsedDate);
			}
		}
	});

	var number_of_albums = album_id_array.length;
	var images_each_row = 4; // TODO This need to be dynamically generated given the width of the window. 

	var cover_photo_table = document.getElementById("album_cover_photo_table");
	var row;
	for (var i = 0; i < number_of_albums; i++) {
		var curr_album_id = album_id_array[i];
		var curr_album_cover_url = "";

		FB.api('/' + curr_album_id, function(response) {
			var album_name = response.name;
			var album_cover_id = response.cover_photo;
			var album_count = response.count;
			var album_id = response.id;

			FB.api('/' + album_cover_id, function(response) {
				var images = response.images;
				curr_album_cover_url = images[5].source;
				$('#select_album_form').find("[data-albumId='" + album_id + "']").attr('src', curr_album_cover_url);
			});
		});

		// Generate HTML
		if (i%images_each_row === 0) {
			row = cover_photo_table.insertRow(-1);// Insert a row at last position
		}
		var cell1 = row.insertCell(i%images_each_row);
		cell1.innerHTML = "<img src='' data-albumId=\"" + album_id_array[i] + "\">";
	}

	$('#select_album_form img').click(function() {
		var selected_album_id = $(this).attr('data-albumId');
		// Set the form value
		if (selected_album_ids.indexOf(selected_album_id) !== -1) {
			var index = selected_album_ids.indexOf(selected_album_id);
			selected_album_ids.splice(index, 1);
			// Unhighlight all the images
			$(this).removeClass('highlighted');
		} else {
			selected_album_ids.push(selected_album_id);
			// Highlight the newly selected image
			$(this).addClass('highlighted');
		}
	});
}


var curr_album_photos_count_after_given_date = 0;
var curr_album_photos_ids_after_given_date = new Array();
function photo_selection_dialog (albumIds, parsedDate) {
	loading_dialog("Loading your photos...");
	// TODO validate at least one album is chosen.
	if (albumIds.length === 1) {
		// Display photos in FB.api callback function.
		fb_get_photos('/' + albumIds[0] + '?fields=photos', parsedDate);
	} else {
//		console.log ("More than one albums are chosen:" + albumIds);
	}
}

function sc_select_dialog (parsedDate) {
	$("#fb_sc_select_dialog").dialog({ 
		width: 1200,
		height: 600,
		draggable: false,
		buttons: {
			Done: function(){
				$( this ).dialog( "close" ); // Close dialog
//				console.log(selected_statusCheckin);
				// TODO next to load status and check-in
				getSCLocation(editRouteId, curr_status_ids_after_given_date, curr_checkins_ids_after_given_date);
				addEditRouteNameText();
			}
		}
	});

	var unordered_list = $('<ul></ul>').attr('id', 'sc_list_ul').attr('class', 'ipList'); // Create a ul tag
	$('#fb_sc_select_dialog').append(unordered_list); // Append ul to the dialog div
	$("#sc_list_ul").before("<a href=\"javascript:void(0)\" onClick=\"selectAllStatusCheckin('fb_sc_select_dialog')\">Select All</a> ");// TODO selectAllStatusAndCheckIn

	// Get status & check-ins
	fb_get_status('/me?fields=statuses', parsedDate);// parsedDate = 1352160000000 -> Tue Nov 06 2012 00:00:00 GMT+0000 (GMT Standard Time)
	fb_get_checkin('/me?fields=checkins', parsedDate);
}

function addEditRouteNameText () {
	if ( document.getElementById("my_route_list") ) {
	} else {
		var unordered_list = $('<ul></ul>').attr('id', 'my_route_list').attr('class', 'ipList'); // Create a ul tag
		$('#me').append(unordered_list); // Append ul to the dialog div
		console.log('not');
	}
	var newRouteDefault = "New untitled route";
	var input = $('<input />').attr('rows', '1').val(newRouteDefault).focus().bind('keyup', function(e) {
		if(e.keyCode==13){ // Enter pressed
			input.remove();
			var li = $('<li/>').attr('data-sNId', sNId).attr('data-api', sNName).attr('data-rId', editRouteId);
			li.append("<p>" + input.val() + "</p>");
			$('#me ul').prepend(li);
			// TODO store route title
			$.post('/allRoute', { sNId: sNId, sNName : sNName } , function(data) {
				
				var result = JSON.parse(data);
				for (var i = 0; i < result.length; i++){
					if (result[i].id === editRouteId){ 
						result[i].title = input.val();
						break;
					}
				}
				$.post('/store', { postOption : "title", sNId: sNId, sNName : sNName, route : JSON.stringify(result) } , function(data) {
				});
			});
			
		}
	}).click(function () {
		if (input.val() === newRouteDefault) {
			input.val("");	
		}
	});
	$('#me ul').prepend(input);
	$('#youHaveNoRoute').remove();
	//TODO onclick of the new route.
	// TODO edit route on route list
}

function fb_get_photos (url, parsedDate) {
	FB.api(url, function(response) {
		var photos = null;
		if (response.photos) {
			photos = response.photos.data;
		} else {
			photos = response.data;
		}
		var number_of_photos = photos.length;
		for (var i = 0; i < number_of_photos; i++) {
			var photo = photos[i];
			var created_time = photo.created_time;
			var created_time_millisecond = Date.parse(created_time);
			if (created_time_millisecond > parsedDate) { // Store ID.
				curr_album_photos_count_after_given_date++ ;
				curr_album_photos_ids_after_given_date.push(photo.id);
			}
		}

		// Go to next page
		if (response.photos) { // first page of photos. 
			if(response.photos.paging && response.photos.paging.next) {
				new_url = response.photos.paging.next.substring(26);// 26: https://graph.facebook.com/
//				console.log(new_url);
				fb_get_photos(new_url, parsedDate); // TODO https://graph.facebook.com/10200193006046072/photos?limit=25&after=MTAyMDAxOTMwMjUyODY1NTM=
			} else {
				// No more photos
				displayPhotos ();
			}
		} else { // not first page -> 2,3,4... pages. Only have one data field. 
			if (response.paging.next) {
				new_url = response.paging.next.substring(26);
				console.log(new_url);
				fb_get_photos(new_url, parsedDate); // TODO https://graph.facebook.com/10200193006046072/photos?limit=25&after=MTAyMDAxOTMwMjUyODY1NTM=
			} else {
				// No more photos
				displayPhotos ();
			}
		}

	});
}

var curr_status_count_after_given_date = 0;
var curr_status_ids_after_given_date = new Array();
function fb_get_status (url, parsedDate) { // me?fields=statuses
	FB.api(url, function(response) {
		var statuses = null;
		if (response.data) {
			statuses = response.data;
		} else {
			statuses = response.statuses.data;
		}
		// TODO else no status at all
		var process_next_page = true;
		for (var i = 0; i < statuses.length; i++) {
			var status = statuses[i];
			var created_time = status.updated_time;
			var created_time_millisecond = Date.parse(created_time);
			if (created_time_millisecond > parsedDate) { // Store ID.
				curr_status_count_after_given_date++ ;
				curr_status_ids_after_given_date.push(status.id);
			} else {
				// If status is created before the given date, then the rest of the statuses will all be before the given date. thus no need to continue.
				process_next_page = false;
				break;
			}
		}

//		console.log(process_next_page);
		// Go to next page
		if (process_next_page && response.statuses) { // first page of photos. 
			if(response.statuses.paging && response.statuses.paging.next) {
				new_url = response.statuses.paging.next.substring(26);// 26: https://graph.facebook.com/
				fb_get_status(new_url, parsedDate); // TODO https://graph.facebook.com/10200193006046072/photos?limit=25&after=MTAyMDAxOTMwMjUyODY1NTM=
			} else {
				// No more photos
				displayStatusCheckin(curr_status_count_after_given_date, curr_status_ids_after_given_date, "status");
			}
		} else if (process_next_page && response.data) { // not first page -> 2,3,4... pages. Only have one data field. 
			if (response.data.length !== 0 && response.paging.next) {
				new_url = response.paging.next.substring(26);
				fb_get_status(new_url, parsedDate); // TODO https://graph.facebook.com/10200193006046072/photos?limit=25&after=MTAyMDAxOTMwMjUyODY1NTM=
			} else {
				// No more photos
				displayStatusCheckin(curr_status_count_after_given_date, curr_status_ids_after_given_date, "status");
			}
		} else {
			displayStatusCheckin(curr_status_count_after_given_date, curr_status_ids_after_given_date, "status");
		}
	});
}

var curr_checkins_count_after_given_date = 0;
var curr_checkins_ids_after_given_date = new Array();
function fb_get_checkin (url, parsedDate) {
	FB.api(url, function(response) {
		// TODO: no check in at all.
		var checkins = null;
		if (response.data) {
			checkins = response.data;
		} else {
			checkins = response.checkins.data;
		}
		// TODO else no status at all
		var process_next_page = true;
		for (var i = 0; i < checkins.length; i++) {
			var checkin = checkins[i];
			var created_time = checkin.created_time;
			var created_time_millisecond = Date.parse(created_time);
			if (created_time_millisecond > parsedDate) { // Store ID.
				curr_checkins_count_after_given_date++ ;
				curr_checkins_ids_after_given_date.push(checkin.id);
			} else {
				// If status is created before the given date, then the rest of the statuses will all be before the given date. thus no need to continue.
				process_next_page = false;
				break;
			}
		}

//		console.log(process_next_page);
		// Go to next page
		if (process_next_page && response.checkins) { // first page of photos. 
			if(response.checkins.paging && response.checkins.paging.next) {
				new_url = response.checkins.paging.next.substring(26);// 26: https://graph.facebook.com/
				fb_get_checkin(new_url, parsedDate); // TODO https://graph.facebook.com/10200193006046072/photos?limit=25&after=MTAyMDAxOTMwMjUyODY1NTM=
			} else {
				// No more photos
				displayStatusCheckin(curr_checkins_count_after_given_date, curr_checkins_ids_after_given_date, "checkin");
			}
		} else if (process_next_page && response.data) { // not first page -> 2,3,4... pages. Only have one data field. 
			if (response.data.length !== 0 && response.paging.next) {
				new_url = response.paging.next.substring(26);
				fb_get_checkin(new_url, parsedDate); // TODO https://graph.facebook.com/10200193006046072/photos?limit=25&after=MTAyMDAxOTMwMjUyODY1NTM=
			} else {
				// No more photos
				displayStatusCheckin(curr_checkins_count_after_given_date, curr_checkins_ids_after_given_date, "checkin");
			}
		} else if (!process_next_page) {
			displayStatusCheckin(curr_checkins_count_after_given_date, curr_checkins_ids_after_given_date, "checkin");
		}
	});
}


function getSCLocation (editRouteId, statusIds, checkinIds) {
	for (var i = 0; i < statusIds.length + checkinIds.length; i++) {
		var id = statusIds[i];
		if ( i >= statusIds.length) {
			id = checkinIds[i - statusIds.length];
		}
		FB.api('/' + id, function(response) {
			var uId = response.from.id
			var sId = response.id;
			var sMsg = response.message;
			var sPlace = response.place;
			gm_displayStatus(uId, 'Facebook', sId, sPlace, sMsg, editRouteId);
		});
	}
	
}

var selected_photos = new Array(); // In the select photo dialog, the photos selected by the users. These photos will be shown on route.
var photo_location_table = {};
var photoIdUrl = {};
function displayPhotos () {
	$('#loading_dialog').dialog( "close" );
	$("#facebook_photo_selection_dialog").dialog({ 
		width: 1200,
		height: 600,
		draggable: false,
		buttons: {
			Next: function(){
				$( this ).dialog( "close" ); // Close dialog
				check_photo_location();
				dialog_photos_without_gps();
			}
		}
	});
	
	var images_per_row = 5;

	$('#facebook_photo_selection_dialog').append("<a href=\"javascript:void(0)\" onClick=\"selectAllPhotos('facebook_photo_selection_dialog')\">Select All</a> ");

	var photos_table = $('<table></table>').attr('id', 'photos_table'); // Create a table

	$('#facebook_photo_selection_dialog').append(photos_table); // Append table to the div

	var photos_table2 = document.getElementById("photos_table");
	var row;
	// Load photos from this album

	// Get number of photos to be displayed. I.E. store IDs of photos.
	// After that, append photos.
	if (curr_album_photos_count_after_given_date === curr_album_photos_ids_after_given_date.length) {
//		console.log("number equal");
	} else {
//		console.log("number !equal");
	}

	for (var i = 0; i < curr_album_photos_count_after_given_date; i++) {
		var photo_id = curr_album_photos_ids_after_given_date[i];
		if (i%images_per_row === 0) {
			row = photos_table2.insertRow(-1);// Insert a row at last position
		}
		var cell = row.insertCell (i%images_per_row);
		cell.innerHTML = "<img src='' data-photoId=\"" + photo_id + "\">";

		FB.api('/' + photo_id, function(response) {
			var fb_picture_url = response.picture;
			var fb_source_url = response.source;
			var fb_source_height = response.height;
			var fb_source_width = response.width;
			var fb_picture_id = response.id;
			
			photoIdUrl[fb_picture_id] = fb_source_url + "^" + fb_source_height + "^" + fb_source_width;
			if (response.place) {
				photo_location_table[fb_picture_id] = response.place;
			}
			$('#photos_table').find("[data-photoId='" + fb_picture_id + "']").attr('src', fb_picture_url);
		});

	}

	// Add click listener
	$('#photos_table img').click(function() {
		var selected_photo_id = $(this).attr('data-photoId');
		// Set the form value
		if (selected_photos.indexOf(selected_photo_id) !== -1) { // Photo exists in array -> remove.
			var index = selected_photos.indexOf(selected_photo_id);
			selected_photos.splice(index, 1);

			// Unhighlight all the images
			$(this).removeClass('highlighted');
		} else {
			selected_photos.push(selected_photo_id);

			// Highlight the newly selected image
			$(this).addClass('highlighted');
		}
	});
}

function selectAllPhotos (div_name) {
//	console.log(div_name);
	var select = '#' + div_name + ' img';
	$('#' + div_name + ' img').addClass('highlighted');

//	console.log(selected_photos.length);
	selected_photos.splice(0, selected_photos.length);
//	console.log(selected_photos.length);
	$('#' + div_name + ' img').each ( function () {
		selected_photos.push( $(this).data("photoid").toString() ); // Note: store string.
	});
//	console.log(selected_photos.length);
//	console.log(selected_photos);
}

var editRouteId;
var selected_photos_without_gps = new Array();
var via_places = new Array();
function check_photo_location() {
	for (var i = 0; i < selected_photos.length; i++) {
		var place = "";
		if ( photo_location_table[selected_photos[i]] ) {
			place = photo_location_table[selected_photos[i]];
		} else {
			selected_photos_without_gps.push(selected_photos[i]);
		}
		var obj = {
				photoId : selected_photos[i],
				place : place
		};
		via_places.push(obj);
	}
	console.log(via_places);
}

/*
 * Allow users to add GPS information to photos without GPS
 */
function dialog_photos_without_gps () {
	var dialogWidth = 1200;
	var dialogDiv = $('<div></div>').attr('id', 'photos_without_gps_dialog').attr('class', 'dialog').attr('title', 'Add loation information to photos');
	$('body').append(dialogDiv);
	$("#photos_without_gps_dialog").dialog({ 
		width: dialogWidth,
		height: 600,
		draggable: false,
		buttons: {
			Next: function () {
				$( this ).dialog( "close" ); // Close dialog
				// TODO Do something
				/*
				 * add listeners
				 * insert photos into via_places array at right index
				 * redraw the route.
				 */

				$('#photos_without_gps_table').find('.highlighted').each(function(){
					console.log(this);
					var selected_photo_id = $(this).find('img').attr('data-photoId');
					var inputId = $(this).find('input').attr('id');
					var place = gm_getPlaceByInputId(inputId);
					
					var obj = {
							photoId : selected_photo_id, 
							place : place
					};
					// Find index to modify
					var index = selected_photos.indexOf(selected_photo_id);
					via_places[index] = obj;
				});
				
				editRouteId = new Date().getTime() + "";
				gm_display_route(via_places, sNId, sNName, editRouteId);
				sc_select_dialog(0);
			},
			Skip: function () {
				$( this ).dialog( "close" ); // Close dialog
				editRouteId = new Date().getTime() + "";
				gm_display_route(via_places, sNId, sNName, editRouteId);
				sc_select_dialog(0);
			}
			
		}
	});
	dialogDiv.append($('<p></p>').text("You have " + selected_photos_without_gps.length + " photos without location information. You can add them manually in this section."));
	
	var photoTable1 = $('<table><table>').attr('id', 'photos_without_gps_table').appendTo('#photos_without_gps_dialog');
	var photoTable = document.getElementById("photos_without_gps_table");
	var images_each_row = 4; // TODO This need to be dynamically generated given the width of the window. 
	var row;
	for (var i = 0; i < selected_photos_without_gps.length; i++) {
		var photoId = selected_photos_without_gps[i];
		var photoInfo = photoIdUrl[selected_photos_without_gps[i]].split('^');
		var photoUrl = photoInfo[0];
		var photoHeight = parseInt(photoInfo[1]);
		var photoWidth = parseInt(photoInfo[2]);
		
		// Generate HTML
		if (i%images_each_row === 0) {
			row = photoTable.insertRow(-1);// Insert a row at last position
		}
		var cell1 = row.insertCell(i%images_each_row);
		
		var imgDisplayW, imgDisplayH;
		var imgWH = dialogWidth/4 - 15; // if dialogWidth if 1200, imgWH = 285
		var margin = "";
		if (photoHeight > photoWidth) {
			imgDisplayW = imgWH;
			imgDisplayH = imgDisplayW*photoHeight/photoWidth;
			margin = (0 - (imgDisplayH - imgDisplayW)/2) + 'px 0px 0px 0px';
		} else {
			imgDisplayH = imgWH;
			imgDisplayW = imgDisplayH*photoWidth/photoHeight;
			margin = '0px 0px 0px ' + (0 - (imgDisplayW - imgDisplayH)/2) + 'px';
		}
		
		cell1.innerHTML = "<div class='crop'><img src='" + photoUrl + "' " +
				"data-photoId='" + photoId + "' " +
				"width='" + imgDisplayW +"' " +
				"height='" + imgDisplayH + "' " + 
				"></div>" + 
				"";
		var inputId = "location_of_" + photoId;
		var input = $('<input>').attr('type', 'text').attr('name', photoId).attr('id', inputId);
		cell1.innerHTML = cell1.innerHTML + $('<div>').append(input.clone()).html();
		gm_place_autocomplete(inputId);
		
		$('.crop').css('width' , imgWH).css('height', imgWH);
		$("#photos_without_gps_table").find("[data-photoId='" + photoId + "']").css('margin', margin);
	}
	
	// Add click listener
	$('#photos_without_gps_table td').click(function() {
		if ($(this).hasClass('highlighted')) {
			$(this).removeClass('highlighted');
		} else {
			$(this).addClass('highlighted');
		}
	});
	
}

function getImageTag(pId, callback, marker) {
	FB.api('/' + pId, function(response) {
		var image_url = response.source;
		var imageTag = "<img src='" + image_url + "' data-photoId='" + pId + "'>";
		callback (marker, imageTag);
	});
}


// TODO code in this function need to be optimised.
var selected_statusCheckin = new Array();
var id_time = new Array();
function displayStatusCheckin (count, ids, service) {
	if (count === ids.length) {
		console.log("number equal:" + count);
	} else {
		console.log("number !equal");
	}

	// Put status on HTML
	for (var i = 0; i < count; i++) {
		var id = ids[i]; // e.g. dongminator fb status ID 125260037650058
		// TODO alter image
		var img_html = "<img src='static/facebook_logo.png' alt='facebook_logo' height='30'>"; // TODO facebook icon height
		
		// Find data from FB
		FB.api('/' + id, function(response) {
			var fb_id = response.id;
			var fb_date;
			if (response.updated_time) {// status
				fb_date = response.updated_time;
			} else if (response.created_time) {// checkin
				fb_date = response.created_time;
			}
			var fb_message = response.message;
			var fb_place = response.place;
			
			// get the last li. get its id. find the date_time in array. compare with this date_time. 
			$($("#sc_list_ul li").get().reverse()).each(function(index) {
				if (Date.parse(fb_date) > id_time[$(this).attr('data-scid')]) {
					if ( $('#sc_list_ul li').last().attr('data-scId') === $(this).attr('data-scId') ) {
						var li = $('<li/>').attr('data-scId', fb_id).attr('data-api', 'facebook');
						$(this).before(li);
						
						li.append(img_html);
						if (!fb_message) {
							li.append("<p>" + fb_place.name + "</p>");
						} else if (!fb_place) {
							li.append("<p>" + fb_message + "</p>");
						} else {
							li.append("<p>" + fb_message + " - at " + fb_place.name + "</p>");
						}
						
						id_time[fb_id] = Date.parse(fb_date);
						
						$('#sc_list_ul li').click(function() {
							$(this).addClass('highlighted');
							var selected_sc_id = $(this).attr('data-scId');
//							console.log(selected_sc_id);
							// Set the form value
							if (selected_sc.indexOf(selected_sc_id) !== -1) { // SC exists in array -> remove.
								var index = selected_sc.indexOf(selected_sc_id);
								selected_sc.splice(index, 1);
								// Unhighlight all the images
								$(this).removeClass('highlighted');
							} else {
								selected_sc.push(selected_sc_id);
								// Highlight the newly selected image
								$(this).addClass('highlighted');
							}
						});
						return false;
					} else {
						console.log("not lst li");
					}
					// next
				} else {
					// insert content below this.
					var li = $('<li/>').attr('data-scId', fb_id).attr('data-api', 'facebook');
					$(this).after(li);
					
					li.append(img_html);
					if (!fb_message) {
						li.append("<p>" + fb_place.name + "</p>");
					} else if (!fb_place) {
						li.append("<p>" + fb_message + "</p>");
					} else {
						li.append("<p>" + fb_message + " - at " + fb_place.name + "</p>");
					}
					
					id_time[fb_id] = Date.parse(fb_date);
					
					$('#sc_list_ul li').click(function() {
						$(this).addClass('highlighted');
						var selected_sc_id = $(this).attr('data-scId');
						// Set the form value
						if (selected_sc.indexOf(selected_sc_id) !== -1) { // SC exists in array -> remove.
							var index = selected_sc.indexOf(selected_sc_id);
							selected_sc.splice(index, 1);
							// Unhighlight all the images
							$(this).removeClass('highlighted');
						} else {
							selected_sc.push(selected_sc_id);
							// Highlight the newly selected image
							$(this).addClass('highlighted');
						}
					});
					return false;
				}
			});
			
			if ( !$("#sc_list_ul li").length) {
				var li = $('<li/>').attr('data-scId', fb_id).attr('data-api', 'facebook').appendTo($('#sc_list_ul'));
				li.append(img_html);
				if (!fb_message) {
					li.append("<p>" + fb_place.name + "</p>");
				} else if (!fb_place) {
					li.append("<p>" + fb_message + "</p>");
				} else {
					li.append("<p>" + fb_message + " - at " + fb_place.name + "</p>");
				}
				
				id_time[fb_id] = Date.parse(fb_date);
				
				$('#sc_list_ul li').click(function() {
					$(this).addClass('highlighted');
					var selected_sc_id = $(this).attr('data-scId');
					// Set the form value
					if (selected_sc.indexOf(selected_sc_id) !== -1) { // SC exists in array -> remove.
						var index = selected_sc.indexOf(selected_sc_id);
						selected_sc.splice(index, 1);
						// Unhighlight all the images
						$(this).removeClass('highlighted');
					} else {
						selected_sc.push(selected_sc_id);
						// Highlight the newly selected image
						$(this).addClass('highlighted');
					}
				});
			}
		});
	}

	// Add click listener
	var selected_sc = new Array();
}

function selectAllStatusCheckin (div_name) {
	$('#' + div_name + ' li').addClass('highlighted');
	selected_statusCheckin.splice(0, selected_statusCheckin.length);
	$('#' + div_name + ' li').each ( function () {
		selected_statusCheckin.push( $(this).data("scid").toString() ); // Note: store string.
	});
}


function edit_via_points () {
	$("#facebook_photo_confirm_dialog").dialog({ 
		width: 500,
		height: 300,
		draggable: true,
		buttons: {
			Next: function(){
				$( this ).dialog( "close" ); // Close dialog
			}
		}
	});
	document.getElementById('start_point_td').textContent = start_place.formatted_address; // From googlemap.js

	var via_points_edit_table = document.getElementById("via_points_edit_table");
	var row = via_points_edit_table.insertRow(-1);
	var cell1 = row.insertCell(0);
	var cell2 = row.insertCell(1);
	cell1.innerHTML = "Via:";
	cell2.innerHTML = "LOCATION FROM FACEBOOK PHOTO";
}


function fb_getImageUrl (itemId, gm_callback, indexOfDisplayedRoute, indexOfMarker, indexOfObj, lastPoint) {
	FB.api('/' + itemId, function(response) {
//		var image = response.images[5];// TODO determine the size of the photo
//		var url = image.source;
//		var height = image.height;
//		var width = image.width;
		var url = response.source;
//		gm_callback(itemId, url, height, width, "Facebook", indexOfDisplayedRoute, indexOfMarker, indexOfObj, lastPoint);
		gm_callback(itemId, url, "Facebook", indexOfDisplayedRoute, indexOfMarker, indexOfObj, lastPoint);
	});
	
}

//The next two functions (calculate_time_zone & convert) by Josh Fraser (http://www.onlineaspect.com)
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


function loading_dialog (displayedText) {
	$("#loading_dialog").dialog({ 
		width: 'auto', 
		height: 130,
		draggable: false
	});
	$('#loading_dialog p').text(displayedText);
}

function deletePoints () {
	$.post('/delete', { option: "allPoints"} , function(data) {
		
	});
}

var selectedRoutes = new Array();
function populateMyRoutes (id, sn) {
	$('<button></button>', {
		text: 'Display All',
		click: function () { 
			selectedRoutes.splice(0, selectedRoutes.length);
			var timestamps = new Array();
			$('#my_route_list li').each(function( index ) {
				$(this).addClass('highlightedRoute');
				selectedRoutes.push($(this).attr('data-routeId'));
				
				var timestamp = new Date().getTime();
				while (timestamps.indexOf(timestamp) !== -1) {
					timestamp = new Date().getTime();
				}
				timestamps.push(timestamp);
				$(this).attr('data-timestamp', timestamp);
			});
			gm_displayAllRoute (id, sn);
		}
	}).appendTo('#me').button();
	
	$.post('/allRoute', { sNId: id, sNName : sn } , function(data) {
		var routes = JSON.parse(data);
		
		var numberOfRoutes = routes.length;
		if (numberOfRoutes === 0) {
			$('<p></p>').attr('id', 'youHaveNoRoute').text("You have not created any route.").appendTo('#me');
		} else {
			var heightOfDiv = $('#tabs').height();
			var heightOfButton = 36;
			var heightOfScroll = heightOfDiv - heightOfButton - 100;
			var unordered_list = $('<ul></ul>').attr('id', 'my_route_list').attr('class', 'ipList tabDiv').css('height', heightOfScroll); // Create a ul tag
			$(window).resize(function() {
				heightOfDiv = $('#tabs').height();
				heightOfScroll = heightOfDiv - heightOfButton - 100;
				unordered_list.css('height', heightOfScroll)
			});
			$('#me').append(unordered_list); // Append ul to the dialog div
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
				for (var j = 0; j < rWaypoints.length; j++) {
					var wp = rWaypoints[j];
					via_places[wp.id] = wp.place;
					itemIds.push(wp.api + ":" + wp.type + ":" + wp.id);
				}
				
				if (!rTitle) {
					rTitle = "Untitled route " + (i + 1);
				}
				var li = $('<li/>').attr('data-sNId', id).attr('data-api', sn).attr('data-rId', rId).appendTo(unordered_list);
				li.append("<p>" + rTitle + "</p>");

				$(li).click((function(via_places, rStart, rEnd, itemIds) {
					return function () {
						var selectedRoute = $(this).attr('data-rid');
						if (selectedRoutes.indexOf(selectedRoute) !== -1) {
							var index = selectedRoutes.indexOf(selectedRoute);
							var stamp = $(this).attr('data-sNId') + ':' + $(this).attr('data-api') + ':' + $(this).attr('data-rId');
							gm_removeRoute(stamp);
							selectedRoutes.splice(index, 1);
							// Unhighlight all the images
							$(this).removeClass('highlightedRoute');
						} else {
							selectedRoutes.push(selectedRoute);
							// Highlight the newly selected image
							var stamp = $(this).attr('data-sNId') + ':' + $(this).attr('data-api') + ':' + $(this).attr('data-rId');
							gm_displayRoute (via_places, rStart, rEnd, itemIds, stamp);
							$(this).addClass('highlightedRoute');
						}
					}
					
				})(via_places, rStart, rEnd, itemIds));
			}
		}
	});
}

