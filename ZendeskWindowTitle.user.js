// ==UserScript==
// @name        Zendesk Window Title
// @namespace   http://www.software-architects.at
// @description Writes the title of the zendesk tab into the title of the browser tab
// @match       https://*.zendesk.com/agent/*
// @grant       none
// @version     1
// ==/UserScript==


setInterval(function () { changeTitle()}, 1000);

function changeTitle() {
	var tabTextElements = document.getElementsByClassName("tab_text");
	var subject = "";
	var error = "";
	var errorCounter = 0;
    var emberViewTabCounter = 0;
	for (var i = 0; i < tabTextElements.length; i++) {
        if (tabTextElements[i].parentNode.parentNode.className.indexOf("selected") != -1) {
        	subject = tabTextElements[i].innerHTML.toString();
            emberViewTabCounter = i;
        }
		else
			errorCounter++;
	}
   
    if (errorCounter >= tabTextElements.length)
		error = "software architects - Agent";
	if (error == "") {
		var helperString1 = subject.split('</script>');
		var helperString2 = helperString1[1].split('<script');

		var spanArray = document.getElementsByTagName("span");

		var filteredSpanArray = "";
        var divArray = document.getElementsByTagName("div");
        var filteredDivArray = new Array();
        for (var i = 0; i < divArray.length; i++) {
         	if (divArray[i].className == "ember-view workspace")
                	filteredDivArray.push(divArray[i]);
        }
        
		for (var i = 0; i < spanArray.length; i++) {
			if ((spanArray[i].className == "ember-view btn" || spanArray[i].className == "ember-view btn active") && spanArray[i].parentNode.parentNode.className == "pane left" && spanArray[i].parentNode.parentNode.parentNode.parentNode.parentNode.id == filteredDivArray[emberViewTabCounter].id)
				filteredSpanArray += spanArray[i].innerHTML.toString();
		}
		var helperString3 = filteredSpanArray.split('</script>');
        
		var comp = helperString3[1].split('<script');
		var empName = helperString3[3].split('<script');
	
		var company = comp[0];
		var employeeName = empName[0];

		var ticketId = window.location.href.split("/");
		var titleString = company + " - "  + employeeName + " - " + helperString2[0] + " - " + "#" + ticketId[ticketId.length - 1];
		document.title = titleString; 

		document.title = titleString; 
	}
	else
		document.title = error;
}
