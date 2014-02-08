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

function notify(text) {
    if (Notification.permission === "granted") {
        var notification = new Notification(text);
    }
}

function processChatsAdded(event) {
    // find invite nodes
    var invites = chatsDiv.find('.ember-view.invite');
    $.each(invites, function( index, value ) {
        if ($.inArray(value, currentNotifications) < 0) {
            currentNotifications.push(value);
            
            var username = "test";
            var subject = "test";
            
            notify(username + ": " + subject);
            
            $(value).on("remove", function () {
                currentNotifications.splice( $.inArray(this, currentNotifications), 1 );
            });
        }
    });
}

// try to find the main chat DOM element
function findChat() {
    chatsDiv = $('#incoming-chats');
    if (chatsDiv.length == 0)
    {
        window.setTimeout(function () { findChat()}, 500);
    }
    else
    {
        chatsDiv.on('DOMNodeInserted', processChatsAdded);
		$('#chat-control').click(function() {
            if (Notification.permission !== "granted" && Notification.permission !== 'denied') {
                Notification.requestPermission(function (permission) {
            		if(!('permission' in Notification)) {
                		Notification.permission = permission;
            		}
                });
            }
		});
    }
}

// check for notification support
if (("Notification" in window)) {
	window.setTimeout(function () { findChat()}, 500);
}