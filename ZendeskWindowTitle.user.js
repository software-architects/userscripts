// ==UserScript==
// @name        Zendesk Window Title
// @namespace   http://www.software-architects.at
// @description Improves the browser window title when using zendesk agent by adding info like ticket id.
// @match       https://*.zendesk.com/agent/*
// @grant       none
// @version     1.2
// @copyright   2014 software architects gmbh
// ==/UserScript==

var currentSection = null;
var isSectionPresent = false;
var initialWindowTitle = null;

function updateWindowTitle() {
    "use strict";
    if (!isSectionPresent) {
        if (Zd.hasOwnProperty('section')) {
            isSectionPresent = true;
            initialWindowTitle = window.document.title;
            console.debug('ZendeskWindowTitle: section present');
        } else {
            console.debug('ZendeskWindowTitle: section still missing');
            return;
        }
    }

    if (Zd.section !== currentSection) {
        currentSection = Zd.section;

        if (!currentSection) {
            console.debug('ZendeskWindowTitle: empty section');
            window.document.title = initialWindowTitle;
        } else if (currentSection.indexOf('#/tickets/') === 0) {
            var id = currentSection.substring(10);
            console.debug('ZendeskWindowTitle: focused ticket: ' + id);
            window.document.title = initialWindowTitle + ' - #' + id;
        } else {
            console.debug('ZendeskWindowTitle: focused: ' + Zd.section);
            window.document.title = initialWindowTitle + ' - ' + currentSection;
        }
    }
}

setInterval(updateWindowTitle, 1000);