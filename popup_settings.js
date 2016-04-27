

if (typeof String.prototype.startsWith != 'function') 
{
  // see below for better implementation!
  String.prototype.startsWith = function (str)
  {
    return this.indexOf(str) == 0;
  };
}

var popupGenerator = 
{

	showError : function(error) 
	{
		console.log(error);
		alert(error);
	},
	

	
	setKey : function()
	{
		var currentKeyPhrase = document.getElementById("currentKeyPhrase").value;
		var newKeyPhrase = document.getElementById("newKeyPhrase").value;
		
		//var globalKeyPhrase = chrome.extension.getBackgroundPage().globalKeyPhrase;
		
		if(!currentKeyPhrase)
			return;
		
		if(!newKeyPhrase && currentKeyPhrase)
		{
			chrome.extension.getBackgroundPage().globalKeyPhrase = currentKeyPhrase;
			return;
		}
			

		chrome.storage.local.get("keyList", function(fetchedData) 
		{
			if(!fetchedData.keyList) 
			{
				return;
			}
			
			for(var i = 0; i < fetchedData.keyList.length; i++)
			{
				var keyEntry = fetchedData.keyList[i];
				
				var decryptedName = sjcl.decrypt(currentKeyPhrase, keyEntry.keyName);
				var decryptedRegex = sjcl.decrypt(currentKeyPhrase, keyEntry.urlRegex);
				var decryptedPhrase = sjcl.decrypt(currentKeyPhrase, keyEntry.keyPhrase);
				
				var keyName = sjcl.encrypt(newKeyPhrase, decryptedName);
				var keyPhrase = sjcl.encrypt(newKeyPhrase, decryptedPhrase);
				var urlRegex = sjcl.encrypt(newKeyPhrase, decryptedRegex);
				
				fetchedData.keyList[i].urlRegex = urlRegex;
				fetchedData.keyList[i].keyName = keyName;
				fetchedData.keyList[i].keyPhrase = keyPhrase;
			}
			chrome.extension.getBackgroundPage().globalKeyPhrase = newKeyPhrase;
			chrome.storage.local.set(fetchedData);
			
			document.location = "popup.html";
		});
	},
	
	back : function()
	{
		document.location = "popup.html";
	},
	
	clear : function()
	{
	
		if(!window.confirm("Really delete all data?"))
			return;
	
		chrome.storage.local.clear();
		document.location = "popup.html";
	},
	
	constructWindow : function() 
	{
		var buttonDiv = document.getElementById("theform");
		
		var button = document.createElement("input");
		button.type = "button";
		button.value = "Set key";
		button.onclick = this.setKey;
		
		buttonDiv.appendChild(button);
		
		button = document.createElement("input");
		button.type = "button";
		button.value = "Back";
		button.onclick = this.back;
		
		buttonDiv.appendChild(button);
		
		
		button = document.createElement("input");
		button.type = "button";
		button.value = "Clear all data";
		button.onclick = this.clear;
		
		buttonDiv.appendChild(button);
	},
	


};

document.addEventListener('DOMContentLoaded', function () {
	popupGenerator.constructWindow()
});
