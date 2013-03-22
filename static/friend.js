var friend_ids = new Array();
var friend_names = new Array();
function loadFriendList (url) {
	FB.api(url, function(response) {
		
		var fb_friend = response.data;
		var fb_paging = response.paging;
		
		for (var i = 0; i < fb_friend.length; i++) {
			if (fb_friend[i].installed) {
				friend_ids.push(fb_friend[i].id);
				FB.api("/" + fb_friend[i].id, function(response) {
					friend_names.push(response.name);
					var li = $("#friend_list").find("[data-friendid='" + response.id + "']").find("p").text(response.name);
				});
			}
		}
		
		if (fb_paging && fb_paging.next) {// first check paging exist.
//			loadFriendList (url)
			new_url = response.paging.next.substring(26);
			loadFriendList(new_url);
		} else {
			populateFriendList();
		}
	});
}

var selectedFriendIds = new Array();
function populateFriendList () {
	if (friend_ids.length === 0) {
		var invite_friend = $('<p></p>').attr('id', 'invite_friend').text("You have no friend using the application").appendTo('#friend_div'); // Create a ul tag
		// TODO invite friends to use the application
	} else {
		var heightOfDiv = $('#tabs').height();
		var heightOfButton = 36;
		var heightOfScroll = heightOfDiv - heightOfButton - 100;
		var unordered_list = $('<ul></ul>').attr('id', 'friend_list').attr('class', 'ipList tabDiv').appendTo('#friend_div').css('height', heightOfScroll); // Create a ul tag
		$(window).resize(function() {
			heightOfDiv = $('#tabs').height();
			heightOfScroll = heightOfDiv - heightOfButton - 100;
			unordered_list.css('height', heightOfScroll)
		});
		for (var i = 0; i < friend_ids.length; i++) {
			var li = $('<li/>').attr('data-friendId', friend_ids[i]).attr('data-api', 'Facebook').appendTo('#friend_list');
			li.append("<img src='' height='50px'></img>");
			li.append("<p>" + friend_names[i] + "</p>");
			
			li.click(function() {
				var selectedId = $(this).attr('data-friendid');
				if (selectedFriendIds.indexOf(selectedId) !== -1) {
					var index = selectedFriendIds.indexOf(selectedId);
					selectedFriendIds.splice(index, 1);
					// Unhighlight all the images
					removeAllFriendRoutes( $(this).data("friendid"), $(this).data("api") );
					$(this).removeClass('highlightedFriend');
				} else {
					selectedFriendIds.push(selectedId);
					// Highlight the newly selected image
					displayFriendRoute( $(this).data("friendid"), $(this).data("api") );
					$(this).addClass('highlightedFriend');
				}
			});
			getFriendProfilePhoto (friend_ids[i]);
		}
	}
	
}

function getFriendProfilePhoto (friendId) {
	FB.api('/' + friendId + '?fields=picture', function(response) {
		var fb_id = response.id;
		var fb_url = response.picture.data.url;
		$('#friend_list').find("[data-friendId='" + fb_id + "']").find('img').attr('src', fb_url);
	});
}

function displayFriendRoute (sNId, sNName) {
	gm_displayAllRoute(sNId, sNName);
}

function removeAllFriendRoutes( sNId, sNName ) {
	$.post('/allRoute', { sNId: sNId, sNName : sNName } , function(data) {
		var routes = JSON.parse(data);
		
		var numberOfRoutes = routes.length;
		
		if (numberOfRoutes === 0) {
			console.log("No route.");
		} else {
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
				gm_removeRoute (sNId + ":" + sNName + ":" + rId);
			}
		}
	});
}

function addSelectAllButton () {
	$('<button></button>', {
		text: 'Select All',
		click: function () { 
			selectAllFriends (); 
		}
	}).appendTo('#friend_div').button();
	
	$('<button></button>', {
		text: 'Show heat map',
		click: function () { 
			if (this.childNodes[0].textContent === 'Show heat map') {
				gm_addHeatmapLayer(selectedFriendIds);
			} else {
				gm_removeHeatmapLayer();
				this.childNodes[0].textContent = 'Show heat map';
			}
		}
	}).appendTo('#friend_div').button();
	
	
}

function f_changeHeatMapButtonText () {
	$("button span:contains('Show heat map')").text('Hide heat map');
}

function selectAllFriends () {
	$('#friend_list li').addClass('highlightedFriend');
	selectedFriendIds.splice(0, selectedFriendIds.length);
	$('#friend_list li').each ( function () {
		selectedFriendIds.push( $(this).data("friendid").toString() ); // Note: store string.
		gm_displayAllRoute( $(this).data("friendid"), 'Facebook');
	});
}