// ==UserScript==
// @name        Zendesk Chat Notifications
// @namespace   http://www.software-architects.at
// @description Adds desktop notifications to zendesk chat.
// @match       https://*.zendesk.com/agent/*
// @grant       none
// @version     1.5
// @copyright   2014 software architects gmbh
// ==/UserScript==

var currentNotifications = [];
var chatsDiv = null;
var loopTimer = null;
var enableDesktop = false;
var enableLoop = false;

function getStorageOrDefault(key, defaultValue) {
    var text = localStorage.getItem(key);
    console.debug('ZendeskChat: getStorage ' + text + ' (' + typeof text + ')');
    if (text === null) {
        console.debug('ZendeskChat: getStorage returning default ' + defaultValue + ' (' + typeof defaultValue + ')');
        return defaultValue;
    } else {
        var val = JSON.parse(text);
        console.debug('ZendeskChat: getStorage returning ' + val + ' (' + typeof val + ')');
        return val;
    }
}

function setStorage(key, val) {
    var text = JSON.stringify(val);
    console.debug('ZendeskChat: setStorage ' + val + ' (' + typeof val + ') as ' + text + ' (' + typeof text + ')');
    localStorage.setItem(key, text);
}

function processChatsAdded(event) {
    if ((enableDesktop && Notification.permission === "granted") || enableLoop) {
        // find invite nodes
        var invites = chatsDiv.find('.ember-view.invite');
        $.each(invites, function( index, value ) {
        
            // only handle each request once
            if ($.inArray(value, currentNotifications) < 0) {
                var username = chatsDiv.find('a.username').text();
                var subject = chatsDiv.find('div.chat-subject').text();
                
                // only if we could gather all the info
                if (username && subject) {
                    console.debug('ZendeskChat: new chat request - notifying');
                    var title = "Chat request: " + username;
                    var options = {
                        body : subject,
                        icon : 'http://www.zendesk.com/favicon.ico'
                    };
                    
                    if (enableDesktop) {
                        var notification = new Notification(title, options);
                        notification.onclick = function(x) { window.focus(); };
                    }
                    currentNotifications.push(value);
                    
                    // sound looping
                    if (enableLoop && loopTimer === null) {
                        console.debug('ZendeskChat: looping sound');
                        loopTimer = window.setInterval(function () {
                            soundManager.sounds.invite.play();
                            console.debug('ZendeskChat: beeping');
                        }, 4000);
                    }
                    
                    // when the zendesk-internal notification closes
                    $(value).on("remove", function () {
                        console.debug('ZendeskChat: chat request ended');
                        currentNotifications.splice( $.inArray(this, currentNotifications), 1 );
                        if (currentNotifications.length === 0 && loopTimer !== null) {
                            console.debug('ZendeskChat: ending sound loop');
                            window.clearInterval(loopTimer);
                            loopTimer = null;
                        }
                        
                        notification.close();
                    });
                }
            }
        });
    }
}

// try to find the main chat dom element
function findChat() {
    console.debug('ZendeskChat: looking for incoming-chats');
    chatsDiv = $('#incoming-chats');
    if (chatsDiv.length === 0) {
        // not found -> DOM not fully built -> retry in due time
        window.setTimeout(function () { findChat(); }, 1000);
    }
    else {
        console.debug('ZendeskChat: found incoming-chats');
        // if the current div gets lost -> look for it again
        chatsDiv.on("remove", function () {
            console.debug('ZendeskChat: incoming-chats lost - rediscovering');
            findChat();
        });
        
        chatsDiv.on('DOMNodeInserted', processChatsAdded);
        
        // for pre-1.4 scripts assume that a granted permission means notify
        if (localStorage.getItem('ChatNotifications.Desktop') === null && Notification.permission === "granted") {
            console.debug('ZendeskChat: setting legacy desktop notification');
            setStorage('ChatNotifications.Desktop', true);
        }
        
        // add notify checkbox
        var notifications = $('<input type="checkbox" style="margin-left:10px;" />');
        enableDesktop = getStorageOrDefault('ChatNotifications.Desktop', false);
        notifications.prop('checked', enableDesktop);
        notifications.change(function() {
            enableDesktop = $(this).is(':checked');
            setStorage('ChatNotifications.Desktop', enableDesktop);
            if (enableDesktop && Notification.permission !== "granted" && Notification.permission !== 'denied') {
                console.debug('ZendeskChat: requesting notification permission');
                Notification.requestPermission(function (permission) {
                    console.debug('ZendeskChat: permission: ' + permission);
                    if(!('permission' in Notification)) {
                        Notification.permission = permission;
                    }
                });
            }
        });
        
        // add loop checkbox
        var loop = $('<input type="checkbox" style="margin-left:10px;" />');
        enableLoop = getStorageOrDefault('ChatNotifications.Loop', false);
        loop.prop('checked', enableLoop);
        loop.change(function() {
            enableLoop = $(this).is(':checked');
            setStorage('ChatNotifications.Loop', enableLoop);
        });

        var span = $('<span class="dialer-title" style="font-weight:normal;vertical-align:top;" />');
        span.append(notifications);
        span.append(document.createTextNode('notify'));
        span.append(loop);
        span.append(document.createTextNode('loop'));
        $('#chat-header').append(span);

    }
}

// check for notification support
if (("Notification" in window)) {
    console.debug('ZendeskChat: notifications supported');
    window.setTimeout(function () { findChat(); }, 500);
}
else {
    console.debug('ZendeskChat: notifications not supported');
}