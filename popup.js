

var popupGenerator = {


	
	constructHeader : function() 
	{
		var headerDiv = document.getElementById("heading");
		
		headerDiv.innerHTML = "<h1>Protection From Evil</h1>";
	},
	
	encryptData : function(event) 
	{
		var textToEncrypt = window.prompt("Text to encrypt:","");
		
		encryptedData = sjcl.encrypt(event.target.id, textToEncrypt);

		// base64 encode it
		encryptedData = btoa(encryptedData);

		var xxx= "{{{PFE:" + encryptedData + "}}}";
		console.log(xxx)
		var queryInfo = new Object();
		queryInfo.active = true;
		queryInfo.currentWindow = true;
		
		chrome.tabs.query( queryInfo, function(tabs) 
		{
			console.log(tabs[0]);
			tabs[0].clipboardData.setData("Text", xxx);
		});
	},	
	
	listKeysForSite : function(url) 
	{
		chrome.storage.local.get("keyList", function(fetchedData) 
		{
			var globalKeyPhrase = chrome.extension.getBackgroundPage().globalKeyPhrase;
			var keyListDiv = document.getElementById("keyList");
			var keyListHeading = document.getElementById("keyListHeading");
			
			if(!fetchedData.keyList) 
			{
				return;
			}
			
			
			for(var i = 0; i < fetchedData.keyList.length; i++) 
			{
				var keyEntry = fetchedData.keyList[i];
				
				var decryptedName = sjcl.decrypt(globalKeyPhrase, keyEntry.keyName);
				var decryptedKeyPhrase = sjcl.decrypt(globalKeyPhrase, keyEntry.keyPhrase);
			//	var decryptedRegex = sjcl.decrypt(globalKeyPhrase, keyEntry.urlRegex);

			//	var re = new RegExp(decryptedRegex);
				
				/*
				if(re.exec(url)) 
				{
					var newDiv = document.createElement("div");
					
					keyListHeading.innerHTML = "<p>Keys that match this url:</p>";
					newDiv.innerHTML = "<b>Keyname:</b>" +decryptedName + " <b>Regex:</b> " +decryptedRegex;
					
					var button = document.createElement("input");
					button.type = "button";
					button.value = "Encrypt data for this site";
					button.id = decryptedKeyPhrase;
					button.onclick = popupGenerator.encryptData;
									
					
					keyListDiv.appendChild(newDiv);
				}
				*/
			}
		});
	},
	
	listKeyForActiveSite : function() 
	{
		var queryInfo = new Object();
		queryInfo.active = true;
		queryInfo.currentWindow = true;
		
		chrome.tabs.query( queryInfo, function(tabs) 
		{
			for (var i = 0; i < tabs.length; i++) 
			{
				popupGenerator.listKeysForSite(tabs[i].url);
			}
		});
	},
	
	setKeyForSite : function(urlRegex,keyName,keyPhrase, htmlEncode) 
	{
		chrome.storage.local.get("keyList", function(fetchedData) 
		{
			//first time running?
			if(!fetchedData.keyList) {
				fetchedData.keyList = []
			}
			
			newEntry = new Object();
			
			newEntry.urlRegex = urlRegex;
			newEntry.keyName = keyName;
			newEntry.keyPhrase = keyPhrase;
			newEntry.htmlEncode = htmlEncode;
			newEntry.enabled = true;
			
			fetchedData.keyList.push(newEntry);
			
			console.log(fetchedData.keyList);
	
			chrome.storage.local.set(fetchedData);
		});
	},
	
	constructBody : function() 
	{
		var keyListHeadingDiv = document.getElementById("keyListHeading");
		var keyListDiv = document.getElementById("keyList");
		
//		keyListHeadingDiv.innerHTML = "<p>No keys match this url.</p>";
		this.listKeyForActiveSite();
	},
	
	addKey : function() 
	{
		document.location = "popup_addkey.html";
	},
	
	editKeys : function() 
	{
		document.location = "popup_editkeys.html";
	},
	
	settings : function() 
	{
		document.location = "popup_settings.html";
	},
	
	encryptText : function() 
	{
		document.location = "popup_encrypt.html";
	},

	encryptFile : function() 
	{
		document.location = "popup_file.html";
	},
	
	constructButtons : function() 
	{
		var buttonDiv = document.getElementById("buttons");
		
		var button = document.createElement("input");
		button.type = "button";
		button.value = "Add key";
		button.onclick = this.addKey;
		
		buttonDiv.appendChild(button);
		
		button = document.createElement("input");
		button.type = "button";
		button.value = "Edit keys";
		button.onclick = this.editKeys;
		
		buttonDiv.appendChild(button);
		
		/*
		button = document.createElement("input");
		button.type = "button";
		button.value = "Encrypt text";
		button.onclick = this.encryptText;
		
		buttonDiv.appendChild(button);
		*/
		
		button = document.createElement("input");
		button.type = "button";
		button.value = "Settings";
		button.onclick = this.settings;
		
		buttonDiv.appendChild(button);

		button = document.createElement("input");
		button.type = "button";
		button.value = "Encrypt file";
		button.onclick = this.encryptFile;
		
		buttonDiv.appendChild(button);
		
		// Encryption part
		
		var buttonDiv = document.getElementById("encrypt_body");
		
		var button = document.createElement("input");
		button.type = "button";
		button.value = "Encrypt!";
		button.onclick = this.encrypt;
		
		buttonDiv.appendChild(button);

		
	},
	
	encrypt : function()
	{
		var selectTable = document.getElementById("select");
		var keyPhrase = selectTable.options[selectTable.selectedIndex].keyPhrase;
		var textToEncrypt = document.getElementById("textToEncrypt").value;
		var outputField = document.getElementById("output");
		
		var encryptedData = sjcl.encrypt(keyPhrase, textToEncrypt);

		// base64 encode it
		encryptedData = btoa(encryptedData);
		
		outputField.value = "{{{PFE:" + encryptedData + "}}}";
		outputField.select()
		document.execCommand('copy')
	},
	
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
				
				if(!fetchedData.keyList) 
				{
					// XXX put up a message about there being no keys!
					return;
				}
				
				for(var i = 0; i < fetchedData.keyList.length; i++)
				{
					var keyEntry = fetchedData.keyList[i];
					var decryptedName = sjcl.decrypt(globalKeyPhrase, keyEntry.keyName);
					var decryptedKeyPhrase = sjcl.decrypt(globalKeyPhrase, keyEntry.keyPhrase);
					

					optionElement = document.createElement("option");			
					optionElement.value = decryptedName;
					optionElement.keyPhrase = decryptedKeyPhrase
					
		
					var textNode = document.createTextNode(decryptedName);
					
					optionElement.appendChild(textNode);
					selectTable.appendChild(optionElement);
					
					if(tabs != undefined && tabs.length >= 1)
					{
						/*
						var re = new RegExp(decryptedRegex);
						
						if(re.exec(tabs[0].url)) 
						{
							selectTable.selectedIndex = i;
						}
						*/
					}
				}
			 });
		 });
	},
	
	build : function() 
	{
	//	chrome.storage.local.clear();
		this.constructHeader();
		
		this.constructButtons();
		
		this.constructBody();
		
		this.constructSelectTable();
	//	this.setKeyForSite("localhost/.*", "localhost", 'secret key', 0);
	
	},

};

// Run our kitten generation script as soon as the document's DOM is ready.
document.addEventListener('DOMContentLoaded', function () {
  //kittenGenerator.requestKittens();
	popupGenerator.build()
});


//chrome.runtime.getBackgroundPage( function(page) {console.log(page)});


