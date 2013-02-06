$(document).ready(function(){
	console.log("ready");
});

var friend_ids = new Array();
function loadFriendList (url) {
	FB.api(url, function(response) {
		
		var fb_friend = response.data;
		var fb_paging = response.paging;
		
		for (var i = 0; i < fb_friend.length; i++) {
			if (fb_friend[i].installed) {
				friend_ids.push(fb_friend[i]);
			}
		}
		
		if (fb_paging.next) {
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
		var unordered_list = $('<ul></ul>').attr('id', 'friend_list'); // Create a ul tag
		
	}
	
}