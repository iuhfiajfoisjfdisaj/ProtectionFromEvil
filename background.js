//
//
// Protection From Evil (PFE) - http://www.d20srd.org/srd/spells/protectionFromEvil.htm
//
//

var globalKeyPhrase = "blah";

chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) 
{
	if (request.message == "requesting key") 
	{
	  sendResponse({keyPhrase: globalKeyPhrase});
	  //sendResponse({farewell: "goodbye"});
	}
	if(request.settingKey)
	{
		globalKeyPhrase = request.settingKey;
	}
});


