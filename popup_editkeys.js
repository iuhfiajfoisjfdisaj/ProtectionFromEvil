

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
	updateKeyForSite : function(keyName,keyPhrase, htmlEncode, enabled, oldKeyname) 
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
			
			var found = -1;
			
			for(var i = 0; i < fetchedData.keyList.length; i++)
			{
				var decryptedKeyName = sjcl.decrypt(globalKeyPhrase, fetchedData.keyList[i].keyName);
				
				if(decryptedKeyName == oldKeyname)
				{
					found = i;
				}

				if(oldKeyname != keyName && decryptedKeyName == keyName)
				{
					popupGenerator.showError("Can't create 2 keys with the same name");
					return;
				}
			}
			
			if(found != -1)
			{
				keyName = sjcl.encrypt(globalKeyPhrase, keyName);
				keyPhrase = sjcl.encrypt(globalKeyPhrase, keyPhrase);

				fetchedData.keyList[found].keyName = keyName;
				fetchedData.keyList[found].keyPhrase = keyPhrase;
				fetchedData.keyList[found].htmlEncode = htmlEncode;
				fetchedData.keyList[found].enabled = enabled;
			}

	
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
	
	editKey : function() 
	{

		var keyName = document.getElementById("keyName").value;
		var keyPhrase = document.getElementById("keyPhrase").value;
		var htmlEncode = document.getElementById("htmlEncode").checked;
		var enabled = document.getElementById("enabled").checked;
		
		var queryInfo = new Object();
		queryInfo.active = true;
		queryInfo.currentWindow = true;

		keyPhrase = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(keyPhrase));
		
		if(keyPhrase.length < 10)
		{
			popupGenerator.showError("Come on bro that key is way short. Wee're storing this key for you so mash your face into the keyboard serveral times and that is your new key phrase, ok? Ok.");
		}
		
		popupGenerator.updateKeyForSite(keyName, keyPhrase, htmlEncode, enabled, popupGenerator.keyName);
		
		//document.location = "popup.html";
	},
	
	fillInFormText : function(keyName, keyPhrase, htmlEncode, enabled) 
	{
		var globalKeyPhrase = chrome.extension.getBackgroundPage().globalKeyPhrase;
			

		document.getElementById("keyName").value = sjcl.decrypt(globalKeyPhrase, keyName);
	//	document.getElementById("keyPhrase").value = sjcl.decrypt(globalKeyPhrase, keyPhrase);
		document.getElementById("htmlEncode").checked = htmlEncode;
		document.getElementById("enabled").checked = enabled;
	},
	
	deleteKey : function()
	{
		var selectTable = document.getElementById("select");
		var keyName = selectTable.options[selectTable.selectedIndex].value;
		
		if(!window.confirm("Really delete " + keyName))
			return;
		
		chrome.storage.local.get("keyList", function(fetchedData) 
		{
			var globalKeyPhrase = chrome.extension.getBackgroundPage().globalKeyPhrase;
			
			if(!fetchedData.keyList) 
			{
				return;
			}
			
			for(var i = 0; i < fetchedData.keyList.length; i++)
			{
				var decryptedName = sjcl.decrypt(globalKeyPhrase, fetchedData.keyList[i].keyName);
				
				if(decryptedName == keyName)
				{
					fetchedData.keyList.splice(i, 1);
					chrome.storage.local.set(fetchedData);
					location.reload();
				}
			}
		});
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
		button.value = "Update key";
		button.onclick = this.editKey;
		
		buttonDiv.appendChild(button);
		
		button = document.createElement("input");
		button.type = "button";
		button.value = "Delete key";
		button.onclick = this.deleteKey;
		
		buttonDiv.appendChild(button);
		
		button = document.createElement("input");
		button.type = "button";
		button.value = "Back";
		button.onclick = this.back;
		
		buttonDiv.appendChild(button);
	},
	
	selectionChange : function(sel)
	{
		var keyName = sel.target.options[sel.target.selectedIndex].value;
		
		popupGenerator.keyName = keyName;
		
		chrome.storage.local.get("keyList", function(fetchedData) 
		{
			var globalKeyPhrase = chrome.extension.getBackgroundPage().globalKeyPhrase;
			
			for(var i = 0; i < fetchedData.keyList.length; i++)
			{
				var keyEntry = fetchedData.keyList[i];
				var decryptedName = sjcl.decrypt(globalKeyPhrase, keyEntry.keyName);
				
				if(decryptedName == keyName)
				{
					popupGenerator.fillInFormText(keyEntry.keyName, keyEntry.keyPhrase, keyEntry.htmlEncode, keyEntry.enabled);
					return;
				}
			}
		
		});
	},
	

	
	// 
	constructSelectTable : function() 
	{
		  chrome.storage.local.get("keyList", function(fetchedData) 
		  {
		  	var queryInfo = new Object();
			queryInfo.active = true;
			queryInfo.currentWindow = true;
			
			chrome.tabs.query( queryInfo, function(tabs) 
			{
				var globalKeyPhrase = chrome.extension.getBackgroundPage().globalKeyPhrase;
				var selectTable = document.getElementById("select");
				
				selectTable.onchange = popupGenerator.selectionChange;
				
				if(!fetchedData.keyList) 
				{
					// XXX put up a message about there being no keys!
					return;
				}
				
				
				for(var i = 0; i < fetchedData.keyList.length; i++)
				{
					var keyEntry = fetchedData.keyList[i];
					var decryptedName = sjcl.decrypt(globalKeyPhrase, keyEntry.keyName);
					
					// default fill it in
					if(i == 0)
					{
						popupGenerator.fillInFormText(keyEntry.keyName, keyEntry.keyPhrase, keyEntry.htmlEncode, keyEntry.enabled);
						popupGenerator.keyName = decryptedName;
					}
					

					optionElement = document.createElement("option");			
					optionElement.value = decryptedName;
					
					var textNode = document.createTextNode(decryptedName);
					
					optionElement.appendChild(textNode);
					selectTable.appendChild(optionElement);
					
					
					if(tabs != undefined && tabs.length >= 1)
					{

					}
				}
			});
		});
	},

};

document.addEventListener('DOMContentLoaded', function () {
	popupGenerator.keyName = "";
	popupGenerator.constructSelectTable();
	popupGenerator.constructButtons();
});
