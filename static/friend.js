$(document).ready(function(){
	console.log("ready");
});

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
					console.log(response.name);
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

function populateFriendList () {
	if (friend_ids.length === 0) {
		var invite_friend = $('<p></p>').attr('id', 'invite_friend').text("You have no friend using the application").appendTo('#friend_div'); // Create a ul tag
		// TODO invite friends to use the application
	} else {
		var unordered_list = $('<ul></ul>').attr('id', 'friend_list').attr('class', 'ipList').appendTo('#friend_div'); // Create a ul tag
		for (var i = 0; i < friend_ids.length; i++) {
			var li = $('<li/>').attr('data-friendId', friend_ids[i]).attr('data-api', 'facebook').appendTo('#friend_list');
//			var a = $('<a></a>').attr('href', "javascript:void(0)").attr('onclick', displayFriendRoute(friend_ids[i])).attr('style', "display:block");
//			li.append(a);
			li.append("<img src='' height='50px'></img>");
			
			
			li.append("<p>" + friend_names[i] + "</p>");
			
			$('#friend_list li').click(function() {
				displayFriendRoute( $(this).data("friendid"), "Facebook" );
				$(this).addClass('highlighted');
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