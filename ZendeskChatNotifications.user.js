// ==UserScript==
// @name        Zendesk Chat Notifications
// @namespace   http://www.software-architects.at
// @description Adds desktop notifications to zendesk chat.
// @match       https://*.zendesk.com/agent/*
// @grant       none
// @version     1.0
// @copyright   2014 software architects gmbh
// ==/UserScript==

var currentNotifications = new Array();
var chatsDiv = null;

function processChatsAdded(event) {
    // find invite nodes
    if (Notification.permission === "granted") {
        var invites = chatsDiv.find('.ember-view.invite');
        $.each(invites, function( index, value ) {
            if ($.inArray(value, currentNotifications) < 0) {
                var username = chatsDiv.find('a.username').text();
                var subject = chatsDiv.find('div.chat-subject').text();
                if (username && subject) {
					console.debug('ZendeskChat: new chat request found - notifying');
                    var notification = new Notification(username + ": " + subject);
                    currentNotifications.push(value);
                    $(value).on("remove", function () {
                        console.debug('ZendeskChat: chat request ended - removing notification');
                        currentNotifications.splice( $.inArray(this, currentNotifications), 1 );
                        notification.close();
                	});
                }
            }
        });
    }
}

// try to find the main chat dom element
function findChat() {
    chatsDiv = $('#incoming-chats');
    if (chatsDiv.length == 0) {
        // not found -> DOM not fully built -> retry in due time
        window.setTimeout(function () { findChat()}, 1000);
    }
    else {
		console.debug('ZendeskChat: found incoming-chats');
        // if the current div gets lost -> look for it again
        chatsDiv.on("remove", function () {
			console.debug('ZendeskChat: incoming-chats lost - rediscovering');
            findChat();
        });
        
        chatsDiv.on('DOMNodeInserted', processChatsAdded);
        
        // if permissions were not yet granted provide button
        if (Notification.permission !== "granted" && Notification.permission !== 'denied') {
			console.debug('ZendeskChat: notification permission not yet granted - offering request');

            var button = $('<a class="attachment">enable notifications</a>');
            $('#chat-header').append(button);
            button.click(function() {
				console.debug('ZendeskChat: requesting notification permission');
                Notification.requestPermission(function (permission) {
					console.debug('ZendeskChat: notification permission request handled: ' + permission);
            		if(!('permission' in Notification)) {
                		Notification.permission = permission;
            		}
                    
                    button.remove();
                });
            });
        }
    }
}

// check for notification support
if (("Notification" in window)) {
	console.debug('ZendeskChat: notifications supported');
	window.setTimeout(function () { findChat()}, 500);
}
else {
	console.debug('ZendeskChat: notifications not supported');
}