// ==UserScript==
// @name        Zendesk Window Title
// @namespace   http://www.software-architects.at
// @description Improves the browser window title when using zendesk agent by adding info like ticket id.
// @match       https://*.zendesk.com/agent/*
// @grant       none
// @version     1.9
// @copyright   2014-2026 software architects gmbh
// @author      Simon
// ==/UserScript==

(function () {
    "use strict";

    function getTitle(id) {
        // the tab list lives in the (react) header toolbar, the tab for the ticket is identified by its entity id
        var tab = document.querySelector("[data-test-id='header-toolbar'] a[data-test-id='header-tab'][data-entity-id='" + id + "']");
        if (!tab) {
            console.debug('ZendeskWindowTitle: getTitle: tab not found');
            return null;
        }

        var tabHeader = tab.querySelector("[data-test-id='header-tab-title']");
        if (!tabHeader) {
            console.debug('ZendeskWindowTitle: getTitle: tab title not found');
            return null;
        }

        return tabHeader.innerText.trim();
    }

    function getVisibleWorkspace() {
        // #main_panes is not unique anymore and cached workspaces are hidden via visibility/opacity, not display
        var workspaces = document.querySelectorAll('main#main_panes div.workspace');
        for (var i = 0; i < workspaces.length; i++) {
            var ws = workspaces[i];
            if (!ws.classList.contains('is-cached') && window.getComputedStyle(ws).visibility !== 'hidden') {
                return ws;
            }
        }

        return null;
    }

    function getTicketInformation(id) {
        var workspace = getVisibleWorkspace();
        if (!workspace) {
            console.debug('ZendeskWindowTitle: getTicketInformation: workspace not found');
            return null;
        }

        var nav = workspace.querySelector("nav[aria-label='Ticket page location']");
        if (!nav) {
            console.debug('ZendeskWindowTitle: getTicketInformation: nav not found');
            return null;
        }

        var userButton = nav.querySelector("[data-test-id='tabs-nav-item-users']");
        var orgButton = nav.querySelector("[data-test-id='tabs-nav-item-organizations']");
        var user = userButton ? userButton.textContent.trim() : null;
        var org = orgButton ? orgButton.textContent.trim() : null;
        var title = getTitle(id);

        if (!org) {
            console.debug('ZendeskWindowTitle: getTicketInformation: no org');
        }

        if (title && user) {
            if (org) {
                return title + ' - ' + user + ' - ' + org;
            } else {
                return title + ' - ' + user;
            }
        }

        return null;
    }

    function getSection() {
        // e.g. /agent/tickets/123 -> tickets/123, /agent/home/tickets -> home/tickets
        var match = /^\/agent\/(.*?)\/*$/.exec(window.location.pathname);
        return match ? match[1] : '';
    }

    function buildSuffix() {
        var section = getSection();
        if (!section) {
            return '';
        }

        var ticket = /^tickets\/(\d+)/.exec(section);
        if (ticket) {
            var id = ticket[1];
            var info = getTicketInformation(id);
            return info ? ' - #' + id + ' - ' + info : ' - #' + id;
        }

        return ' - ' + section;
    }

    function updateWindowTitle() {
        // zendesk shows a dummy title while loading
        if (window.document.title === 'Zendesk...') {
            return;
        }

        // if the title is not the one we set last, zendesk changed it (navigation, notification count, ...)
        if (window.document.title !== lastSetTitle) {
            baseTitle = window.document.title;
        }

        // derived from scratch on every tick, so late loading data and edits are picked up
        var desired = baseTitle + buildSuffix();
        if (desired !== window.document.title) {
            window.document.title = desired;
        }
        lastSetTitle = desired;
    }

    var baseTitle = null;
    var lastSetTitle = null;

    window.setInterval(updateWindowTitle, 1000);
})();
