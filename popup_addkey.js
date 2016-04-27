

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
	
	setKeyForSite : function(keyName, keyPhrase, htmlEncode) 
	{
		var globalKeyPhrase = chrome.extension.getBackgroundPage().globalKeyPhrase;
		
		chrome.storage.local.get("keyList", function(fetchedData) 
		{
			//first time running?
			if(!fetchedData.keyList) 
			{
				console.log("asfsafsa");
				fetchedData.keyList = []
			}

			keyPhrase = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(keyPhrase));

			
			for(var i = 0; i < fetchedData.keyList.length; i++)
			{
				var decryptedKeyName = sjcl.decrypt(globalKeyPhrase, fetchedData.keyList[i].keyName);
				if(decryptedKeyName == keyName)
				{
					popupGenerator.showError("Can't create 2 keys with the same name");
					return;
				}
			}
			
			keyName = sjcl.encrypt(globalKeyPhrase, keyName);
			keyPhrase = sjcl.encrypt(globalKeyPhrase, keyPhrase);
			
			console.log("encrypted stuff with " + globalKeyPhrase + "aaa " +keyName);
			
			newEntry = new Object();
			
			newEntry.keyName = keyName;
			newEntry.keyPhrase = keyPhrase;
			newEntry.htmlEncode = htmlEncode;
			newEntry.enabled = true;
			
			fetchedData.keyList.push(newEntry);
			
			console.log(fetchedData.keyList);
	
			chrome.storage.local.set(fetchedData);
		});

	},
	
	regexOk : function (regex) 
	{
		try 
		{
			var re = new RegExp(regex);
		}
		catch(err) 
		{
			console.log(err);
			return false;
		}
		
		return true;
	},
	
	
	showError : function(error) 
	{
		console.log(error);
		alert(error);
	},
	
	addKey : function() 
	{
		var keyName = document.getElementById("keyName").value;
		var keyPhrase = document.getElementById("keyPhrase").value;
		var htmlEncode = document.getElementById("htmlEncode").checked;
		
		var queryInfo = new Object();
		queryInfo.active = true;
		queryInfo.currentWindow = true;


		if(keyPhrase.length < 10)
		{
			popupGenerator.showError("Come on bro that key is way short. Wee're storing this key for you so mash your face into the keyboard serveral times and that is your new key phrase, ok? Ok.");
		}
		
		popupGenerator.setKeyForSite(keyName, keyPhrase, htmlEncode);
		//document.location = "popup.html";
	
	},
	
	back : function()
	{
		document.location = "popup.html";
	},
	
	constructButtons : function() 
	{
		var buttonDiv = document.getElementById("theform");
		
		var button = document.createElement("input");
		button.type = "button";
		button.value = "Add key";
		button.onclick = this.addKey;
		
		buttonDiv.appendChild(button);
		
		button = document.createElement("input");
		button.type = "button";
		button.value = "Back";
		button.onclick = this.back;
		
		buttonDiv.appendChild(button);
	},
	
	
	
	createRegexForUser : function() 
	{
		var queryInfo = new Object();
		queryInfo.active = true;
		queryInfo.currentWindow = true;
		
		chrome.tabs.query( queryInfo, function(tabs) 
		{
			var url = tabs[0].url;
			
			if(url.startsWith("http://") || url.startsWith("https://")) 
			{
				var originalUrl = url;
				
				// lazy :)
				url = url.replace("http://", "^https?://");
				url = url.replace("https://", "^https?://");
				
				if(url.indexOf("/", 8) != -1) 
				{
					var newUrl = url.substr(0, url.indexOf("/", 10));
					var regexElement = document.getElementById("urlRegex");
					regexElement.value = newUrl  + "/.*";
					
					var keyName = newUrl;
					
					if(keyName.indexOf("//") !=  -1) 
					{
						keyName = keyName.substr(keyName.indexOf("//")+2, url.length);
					} 
					
					var keyNameElement = document.getElementById("keyName");
					keyNameElement.value = keyName;
				}
			}
		});	
		
	},

};

document.addEventListener('DOMContentLoaded', function () {
	popupGenerator.constructButtons()
	//popupGenerator.createRegexForUser()
});
