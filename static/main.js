//All pages need to check login status.
//Only login page will invoke login function.

//TODO: ISSUE: if more than 1 album is fetched, photos from diff albums are mixed. 
var access_token;
var sNName = "Facebook";
var sNId = "";

var SelectedAlbumIds = new Array();
var AllAlbumPhotos = new Array();
var SelectedPhotos = new Array();
var SelectedPhotosWithoutGPS = new Array();


$(document).ready(function(){
	$( "button" ).button();
	$( "#tabs" ).tabs();
	
	$("#tabs").hover(function(){
	    $(this).stop(true, false).animate({ opacity:0.8  });// in
	}, function() {
	    $(this).stop(true, false).animate({ opacity:0.2 });// out
	});
	
	$('<button>').appendTo('#navigation').button({
		label: "Logout"
	}).click(function( event ) {
		logout();
    }).css({height:'25px', 'padding-top': '0px', 'font-size': '10pt', 'margin-left':$(window).width()-100, 'margin-right':'0px'});
	
	$(window).resize(function() {
		$('#navigation').find('button').css({'margin-left':$(window).width()-100});
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

//function get_album_ids(parsedDate, callback){
//	var albums_updated_after_parsedDate = new Array();
//
//	FB.api('/me?fields=albums', function(response) {
//
//		var data_array = response.albums.data;
//		var length = data_array.length,
//		element = null;
//		for (var i = 0; i < length; i++) {
//			element = data_array[i];
//			date = element.updated_time;
//			var update_time_in_milliseconds = Date.parse(date);
//			if (update_time_in_milliseconds > parsedDate) { // photo date is after 12.31
//				albums_updated_after_parsedDate.push(element.id);
//			}
//		}
//		$('#loading_dialog').dialog( "close" );
//		callback(albums_updated_after_parsedDate, parsedDate);// album_selection_dialog
//	});
//}

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
	$('#loading_dialog').dialog( "close" );
	$("#facebook_album_selection_dialog").dialog({ 
		closeOnEscape: false,
		width: 1400,
		height: 600,
		draggable: false,
		buttons: {
			Next: function(){
				$('#select_album_form').find('.highlighted').find('img').each(function(){
					SelectedAlbumIds.push( $(this).attr('data-albumId') );
				});
				console.log(SelectedAlbumIds);
				if (SelectedAlbumIds.length === 0) {
					dialog_alert("chooseAtLeastOneAlbum", "Please choose at least one album.");
				} else {
					$( this ).dialog( "close" ); // Close dialog
					photo_selection_dialog(SelectedAlbumIds, parsedDate);
				}
			}, 
			Cancel: function(){
				$( this ).dialog( "close" ); // Close dialog
				clearAllDialogContentAndVariable();
			}
		}
	});

	var number_of_albums = album_id_array.length;
	var row;
	var images_each_row = 4; // TODO This need to be dynamically generated given the width of the window.
	var cover_photo_table = document.getElementById("album_cover_photo_table");
	
	for (var i = 0; i < number_of_albums; i++) {
		var curr_album_id = album_id_array[i];
		if (i%images_each_row === 0) {
			row = cover_photo_table.insertRow(-1);// Insert a row at last position
		}
		var cell1 = row.insertCell(i%images_each_row);
		fb_getCoverPhoto(i, curr_album_id, cell1);
		console.log($('#select_album_form td:last'));
		$('#select_album_form td:last').click(function() {
			if ( $(this).hasClass('highlighted') ) {
				$(this).removeClass('highlighted');
			} else {
				$(this).addClass('highlighted');
			}
		});
	}
}

function fb_getCoverPhoto(index, albumId, cell){
	FB.api('/' + albumId, function(response) {
		var album_name = response.name;
		var album_cover_id = response.cover_photo;
		var album_count = response.count;
		var album_id = response.id;
		FB.api('/' + album_cover_id, function(response) {
			var images = response.images;
			var photoHeight = response.height;
			var photoWidth = response.width;
			var photoId = response.id;
			var curr_album_cover_url = response.source;
			$('#select_album_form').find("[data-albumId='" + album_id + "']").attr('src', curr_album_cover_url);
			populatePhotoTable(index, photoHeight, photoWidth, curr_album_cover_url, album_id, cell, "data-albumId", $("#album_cover_photo_table").find("[data-albumId='" + photoId + "']"));
		});
	});
}

function populatePhotoTable (index, photoHeight, photoWidth, albumUrl, photoId, cell, dataAttr, domObj) {
	// Generate HTML
//	cell1.innerHTML = "<img src='' data-albumId=\"" + album_id_array[i] + "\">";
	var dialogWidth = 1400;
	var imgDisplayW, imgDisplayH;
	var imgWH = dialogWidth/4 - 20; // if dialogWidth if 1200, imgWH = 285
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
	
	cell.innerHTML = "<div class='crop'><img src='" + albumUrl + "' " +
			dataAttr + "='" + photoId + "' " +
			"width='" + imgDisplayW +"' " +
			"height='" + imgDisplayH + "' " + 
			"></div>" + 
			"";
	
	$('.crop').css('width' , imgWH).css('height', imgWH);
	domObj.css('margin', margin);
}


var curr_album_photos_count_after_given_date = 0;
var curr_album_photos_ids_after_given_date = new Array();
function photo_selection_dialog (albumIds, parsedDate) {
	loading_dialog("Loading your photos...");
	// TODO validate at least one album is chosen.
	if (albumIds.length === 1) {
		// Display photos in FB.api callback function.
		AllAlbumPhotos.push( new Array() );
		SelectedPhotos.push( new Array() );
		fb_get_photos('/' + albumIds[0] + '?fields=photos', parsedDate, 0);
	} else {
		AllAlbumPhotos.push( new Array() );
		SelectedPhotos.push( new Array() );
		fb_get_photos('/' + albumIds[0] + '?fields=photos', parsedDate, 0);
	}
}

function sc_select_dialog (parsedDate) {
	$("#fb_sc_select_dialog").dialog({ 
		closeOnEscape: false,
		width: 1200,
		height: 600,
		draggable: false,
		buttons: {
			Done: function(){
				$( this ).dialog( "close" ); // Close dialog
				// TODO next to load status and check-in
				
				$('#sc_list_ul').find('.highlighted').each(function(){
					selected_statusCheckin.push( $(this).attr('data-scId') );
				});
				
				getSCLocation(editRouteId, selected_statusCheckin);
				addEditRouteNameText();
				
				clearAllDialogContentAndVariable();
			}
		}
	});

	var unordered_list = $('<ul></ul>').attr('id', 'sc_list_ul').attr('class', 'ipList'); // Create a ul tag
	$('#fb_sc_select_dialog').append(unordered_list); // Append ul to the dialog div
	$("#sc_list_ul").before("<a href=\"javascript:void(0)\" onClick=\"selectAllStatusCheckin('fb_sc_select_dialog')\">Select All</a> ");// TODO selectAllStatusAndCheckIn

	// Get status & check-ins
	fb_get_statusOrCheckin('/me?fields=statuses.limit(10)', "status");// parsedDate = 1352160000000 -> Tue Nov 06 2012 00:00:00 GMT+0000 (GMT Standard Time)
	fb_get_statusOrCheckin('/me?fields=checkins.limit(10)', "checkin");
}

function addEditRouteNameText () {
	if ( document.getElementById("my_route_list") ) {
	} else {
		var unordered_list = $('<ul></ul>').attr('id', 'my_route_list').attr('class', 'ipList'); // Create a ul tag
		$('#me').append(unordered_list); // Append ul to the dialog div
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


function fb_get_photos (url, parsedDate, albumIndex) {
	FB.api(url, function(response) {
		console.log(url);
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
				AllAlbumPhotos[albumIndex].push(photo.id);
				curr_album_photos_ids_after_given_date.push(photo.id);
			}
		}

		// Go to next page
		if (response.photos) { // first page of photos. 
			if(response.photos.paging && response.photos.paging.next) {
				new_url = response.photos.paging.next.substring(26);// 26: https://graph.facebook.com/
				fb_get_photos(new_url, parsedDate, albumIndex); // TODO https://graph.facebook.com/10200193006046072/photos?limit=25&after=MTAyMDAxOTMwMjUyODY1NTM=
			} else {
				// No more photos
				displayPhotos ();
				if (SelectedAlbumIds.length > 1) {
					var nextAlbum = albumIndex + 1;
					if (SelectedAlbumIds[nextAlbum]) {
						AllAlbumPhotos.push( new Array() );
						fb_get_photos ('/' + SelectedAlbumIds[nextAlbum] + '?fields=photos', parsedDate, nextAlbum);
					}
				}
			}
		} else { // not first page -> 2,3,4... pages. Only have one data field. 
			if (response.paging.next) {
				new_url = response.paging.next.substring(26);
				fb_get_photos(new_url, parsedDate, albumIndex); // TODO https://graph.facebook.com/10200193006046072/photos?limit=25&after=MTAyMDAxOTMwMjUyODY1NTM=
			} else {
				// No more photos
				displayPhotos ();
				if (SelectedAlbumIds.length > 1) {
					var nextAlbum = albumIndex + 1;
					if (SelectedAlbumIds[nextAlbum]) {
						AllAlbumPhotos.push( new Array() );
						fb_get_photos ('/' + SelectedAlbumIds[nextAlbum] + '?fields=photos', parsedDate, nextAlbum);
					}
				}
			}
		}
	});
}


var sc_list_ulPopulateDone = false;
var sc_objs = new Array();
var sc_sum = 0;
var status_next_url;
var checkin_next_url;
function fb_get_statusOrCheckin (url, option) {
	FB.api(url, function(response) {
		var items = null;
		if (response.data) {
			items = response.data;
			checkin_next_url = response.paging.next.substring(26);
		} else {
			if (option === 'status') {
				items = response.statuses.data;
				status_next_url = response.statuses.paging.next.substring(26);
			} else {
				items = response.checkins.data;
				checkin_next_url = response.checkins.paging.next.substring(26);
			}
		}
		for (var i = 0; i < items.length; i++) {
			var item = items[i];
			var fb_date = item.updated_time ? fb_date = item.updated_time : fb_date = item.created_time;
			var obj = {
					id : item.id,
					date : fb_date,
					msg : item.message,
					place : item.place
			};
			sc_objs.push(obj);
		}
		
		if (sc_sum === 0) {
			sc_sum += items.length;
			displayStatusCheckin(0, sc_sum, option);
		} else {
			while ( !sc_list_ulPopulateDone ) {
				console.log("aaa");
			}
			var oldSum = sc_sum;
			sc_sum += items.length;
			displayStatusCheckin(oldSum, sc_sum, option);
		}
	});
}

var selected_statusCheckin = new Array();
var id_time = new Array();
var FbSmallLogoTag = "<img src='static/facebook_logo.png' alt='facebook_logo' height='30'>";
function displayStatusCheckin (startIndex, endIndex, option) { // curr_status_count curr_status_ids
	for (var i = startIndex; i < endIndex; i ++ ) {
		var obj = sc_objs[i];
		var fb_id = obj.id;
		var fb_date = obj.date;
		var fb_place = obj.place;
		var fb_message = obj.msg;
		var li;
		if ( !$("#sc_list_ul li").length ) { // No li in ul.
			li = $('<li/>').attr('data-scId', fb_id).attr('data-api', 'facebook').appendTo($('#sc_list_ul'));
			scListLiAddMsgPlace (li, fb_message, fb_place);
			id_time[fb_id] = Date.parse(fb_date);
		} else {
			$($("#sc_list_ul li").get().reverse()).each(function(index) {
				if (Date.parse(fb_date) > id_time[$(this).attr('data-scid')]) {
					/*
					 * If this is the only li => last li and number of li equals 1
					 * OR
					 * this is the top li => index = number of li - 1 => means have to insert new li before this
					 */ 
					if ( 
							(
									$('#sc_list_ul li').last().attr('data-scId') === $(this).attr('data-scId')
									&& 
									$("#sc_list_ul li").length === 1
							)
							|| 
							index === $("#sc_list_ul li").length - 1
						) 
					{
						li = $('<li/>').attr('data-scId', fb_id).attr('data-api', 'facebook');
						$(this).before(li);
						scListLiAddMsgPlace (li, fb_message, fb_place);
						id_time[fb_id] = Date.parse(fb_date);
						return false;
					} else {
						// Do nothing. Skip to next li.
					}
				} else {
					// insert content below this.
					li = $('<li/>').attr('data-scId', fb_id).attr('data-api', 'facebook');
					$(this).after(li);
					scListLiAddMsgPlace (li, fb_message, fb_place);
					id_time[fb_id] = Date.parse(fb_date);
					return false;
				}
			});
		}
		addListenerToLi (li);
	}
	sc_list_ulPopulateDone = true;
}

function scListLiAddMsgPlace (li, fb_message, fb_place) {
	li.append(FbSmallLogoTag);
	if (!fb_message) {
		li.append("<p>" + fb_place.name + "</p>");
	} else if (!fb_place) {
		li.append("<p>" + fb_message + "</p>");
	} else {
		li.append("<p>" + fb_message + " - at " + fb_place.name + "</p>");
	}
}

function addListenerToLi (li) {
	li.click(function() {
		if ( $(this).hasClass('highlighted') ) { // SC exists in array -> remove.
			$(this).removeClass('highlighted');
		} else {
			$(this).addClass('highlighted');
		}
	});
}

function getSCLocation (editRouteId, selected_scId) {
	for (var i = 0; i < selected_scId.length; i++) {
		var id = selected_scId[i];
		
		FB.api('/' + id, function(response) {
			var uId = response.from.id;
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
	var parentDiv;
	if ( $("#facebook_photo_selection_dialog").length === 0 ){
		parentDiv = $('<div>').attr('id', 'facebook_photo_selection_dialog').addClass('dialog').attr('title', 'Photos from Facebook').appendTo('body');
	} else {
		parentDiv = $('#facebook_photo_selection_dialog');
	}
	
	var images_per_row = 5;
	
	$('#loading_dialog').dialog( "close" );
	$("#facebook_photo_selection_dialog").dialog({ 
		closeOnEscape: false,
		width: 1200,
		height: 600,
		draggable: false,
		buttons: {
			Next: function(){
				$( this ).dialog( "close" ); // Close dialog
				$('#facebook_photo_selection_dialog').find('.highlighted').each(function(){
					SelectedAlbumIds.push( $(this).attr('data-photoId') );
					selected_photos.push($(this).attr('data-photoId'));
				});
				console.log(selected_photos);
				check_photo_location();
				dialog_photos_without_gps();
			}, 
			Cancel: function(){
				$( this ).dialog( "close" ); // Close dialog
				clearAllDialogContentAndVariable();
			}
		}
	});
	
	var currAlbumIndex = AllAlbumPhotos.length - 1;
	var currAlbumId = SelectedAlbumIds[currAlbumIndex];
	
	var parentOfTable;
	if (SelectedAlbumIds.length === 1) {
		parentOfTable = parentDiv;
		parentDiv.append("<a href=\"javascript:void(0)\" onClick=\"selectAllPhotos('facebook_photo_selection_dialog')\">Select All</a> ");
	} else {
		// Display photos at AllAlbumPhotos.length - 1
		var divId = 'select-album-' + currAlbumId;
		var albumDiv = $('<div>').attr('id', divId).appendTo(parentDiv);
		var titleBarDiv = $('<div>').appendTo(albumDiv).css('text-align', 'center').css('background-color', 'grey');
		var tableDiv = $('<div>').appendTo(albumDiv);
		parentOfTable = tableDiv;
		var toggleButton = $('<button>').css('float', 'left').appendTo(titleBarDiv).button({
			icons: {
                primary: "ui-icon-triangle-1-s"
            },
            text: false
		}).click(function( event ) {
			tableDiv.toggle( 'Blind');
	    });
		
		var albumTitle = $('<p>').text(" ").css('display', 'inline').appendTo(titleBarDiv);
		FB.api('/' + currAlbumId, function(response) {
			var fb_album_name = response.name;
			albumTitle.text(fb_album_name);
		});
		var selectAllLink = $('<a>').attr('href', 'javascript:void(0)').attr('onClick', 'selectAllPhotos("' + divId + '")').text("Select All").css('float', 'right').appendTo(titleBarDiv);
	}
	
	// Append table
	var photos_table = $('<table></table>').attr('id', 'album-photos-table-' + currAlbumId); // Create a table
	parentOfTable.append(photos_table); // Append table to the div
	var photos_table2 = document.getElementById('album-photos-table-' + currAlbumId);
	var row;

	for (var i = 0; i < AllAlbumPhotos[currAlbumIndex].length; i++) {
		var photo_id = AllAlbumPhotos[currAlbumIndex][i];
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
			$('#album-photos-table-' + currAlbumId).find("[data-photoId='" + fb_picture_id + "']").attr('src', fb_picture_url);
		});
	}
	
	// Add click listener
	$('#album-photos-table-' + currAlbumId + ' img').click(function() {
		if ( $(this).hasClass('highlighted')) {
			$(this).removeClass('highlighted');
		} else {
			$(this).addClass('highlighted');
		}
	});
}

function selectAllPhotos (div_name) {
	var select = '#' + div_name + ' img';
	$('#' + div_name + ' img').addClass('highlighted');
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
}

/*
 * Allow users to add GPS information to photos without GPS
 */
function dialog_photos_without_gps () {
	var dialogWidth = 1200;
	var dialogDiv = $('<div></div>').attr('id', 'photos_without_gps_dialog').attr('class', 'dialog').attr('title', 'Add loation information to photos');
	$('body').append(dialogDiv);
	$("#photos_without_gps_dialog").dialog({ 
		closeOnEscape: false,
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
					var selected_photo_id = $(this).find('img').attr('data-photoId');
					var inputId = $(this).find('input').attr('id');
					var place = gm_getPlaceByInputId(inputId);
					if (place) {
						var obj = {
								photoId : selected_photo_id, 
								place : place
						};
						// Find index to modify
						var index = selected_photos.indexOf(selected_photo_id);
						via_places[index] = obj;
					}
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
			}, 
			Cancel: function(){
				$( this ).dialog( "close" ); // Close dialog
				clearAllDialogContentAndVariable();
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
		
		
		populatePhotoTable (i, photoHeight, photoWidth, photoUrl, photoId, cell1, "data-photoId", $("#photos_without_gps_table").find("[data-photoId='" + photoId + "']"));
//		var imgDisplayW, imgDisplayH;
//		var imgWH = dialogWidth/4 - 20; // if dialogWidth if 1200, imgWH = 285
//		var margin = "";
//		if (photoHeight > photoWidth) {
//			imgDisplayW = imgWH;
//			imgDisplayH = imgDisplayW*photoHeight/photoWidth;
//			margin = (0 - (imgDisplayH - imgDisplayW)/2) + 'px 0px 0px 0px';
//		} else {
//			imgDisplayH = imgWH;
//			imgDisplayW = imgDisplayH*photoWidth/photoHeight;
//			margin = '0px 0px 0px ' + (0 - (imgDisplayW - imgDisplayH)/2) + 'px';
//		}
//		
//		cell1.innerHTML = "<div class='crop'><img src='" + photoUrl + "' " +
//				"data-photoId='" + photoId + "' " +
//				"width='" + imgDisplayW +"' " +
//				"height='" + imgDisplayH + "' " + 
//				"></div>" + 
//				"";
		var inputId = "location_of_" + photoId;
		var input = $('<input>').attr('type', 'text').attr('name', photoId).attr('id', inputId);
		cell1.innerHTML = cell1.innerHTML + $('<div>').append(input.clone()).html();
		gm_place_autocomplete(inputId);
//		
//		$('.crop').css('width' , imgWH).css('height', imgWH);
//		$("#photos_without_gps_table").find("[data-photoId='" + photoId + "']").css('margin', margin);
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


function selectAllStatusCheckin (div_name) {
	$('#' + div_name + ' li').addClass('highlighted');
}


function fb_getImageUrl (itemId, gm_callback, indexOfDisplayedRoute, indexOfMarker, indexOfObj, lastPoint) {
	FB.api('/' + itemId, function(response) {
//		var image = response.images[5];// TODO determine the size of the photo
//		var url = image.source;
//		var height = image.height;
//		var width = image.width;
		var description = response.name;
		var url = response.source;
//		gm_callback(itemId, url, height, width, "Facebook", indexOfDisplayedRoute, indexOfMarker, indexOfObj, lastPoint);
		gm_callback(itemId, url, description, "Facebook", indexOfDisplayedRoute, indexOfMarker, indexOfObj, lastPoint);
	});
	
}

function fb_getSC (itemId, gm_callback, routeTimestamp) {
	FB.api('/' + itemId, function(response) {
		var uId = response.from.id;
		var sId = response.id;
		var sMsg = response.message;
		var sPlace = response.place;
		gm_callback(uId, 'Facebook', sId, sPlace, sMsg, routeTimestamp);// gm_displayStatus
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
				selectedRoutes.push($(this).attr('data-rId'));
				
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


function dialog_alert (id, msg) {
	var alertDialog = $("<div>").attr('id', id);
	var alertContent = $("<p>").text(msg).appendTo(alertDialog);
	
	alertDialog.dialog({
		width: 'auto',
	});
}


function clearAllDialogContentAndVariable () {
	$('#album_cover_photo_table').empty();
	$('#facebook_photo_selection_dialog').remove();
	$('#photos_without_gps_dialog').remove();
	$('#fb_sc_select_dialog').empty();
	
	allAlbumIds = [];
	AllAlbumPhotos = [];
	checkin_next_url = "";
	curr_album_photos_count_after_given_date = 0;
	curr_album_photos_ids_after_given_date = [];
	
//	main.js.editRouteId
//	main.js.FbSmallLogoTag
	id_time = [];
	photo_location_table = [];
	photoIdUrl = [];
	sc_list_ulPopulateDone = false;
	sc_objs = [];
	sc_sum = 0;
	selected_photos = [];
	selected_photos_without_gps = [];
	selected_statusCheckin = [];
	SelectedAlbumIds = [];
	SelectedPhotos = [];
	SelectedPhotosWithoutGPS = [];
	selectedRoutes
//	main.js.sNId
//	main.js.sNName
	status_next_url = "";
	via_places = [];
}