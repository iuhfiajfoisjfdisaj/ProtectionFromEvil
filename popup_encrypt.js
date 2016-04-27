
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
	
	
	back : function()
	{
		document.location = "popup.html";
	},
	
	encrypt : function()
	{
		var selectTable = document.getElementById("select");
		var keyPhrase = selectTable.options[selectTable.selectedIndex].keyPhrase;
		var textToEncrypt = document.getElementById("textToEncrypt").value;
		var outputField = document.getElementById("output");
		
		var encrypted = sjcl.encrypt(keyPhrase, textToEncrypt);

		var encrypted = btoa(encrypted);
		
		outputField.value = "{{{PFE:" + encrypted + "}}}";
		outputField.select()
		document.execCommand('copy')
	},
	
	constructWindow : function() 
	{
		var buttonDiv = document.getElementById("body");
		
		var button = document.createElement("input");
		button.type = "button";
		button.value = "Encrypt!";
		button.onclick = this.encrypt;
		
		buttonDiv.appendChild(button);
		
		button = document.createElement("input");
		button.type = "button";
		button.value = "Back";
		button.onclick = this.back;
		
		buttonDiv.appendChild(button);
		
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
					var decryptedRegex = sjcl.decrypt(globalKeyPhrase, keyEntry.urlRegex);
					

					optionElement = document.createElement("option");			
					optionElement.value = decryptedName;
					optionElement.keyPhrase = decryptedKeyPhrase
					
		
					var textNode = document.createTextNode(decryptedName);
					
					optionElement.appendChild(textNode);
					selectTable.appendChild(optionElement);
					
					if(tabs != undefined && tabs.length >= 1)
					{
						var re = new RegExp(decryptedRegex);
						
						if(re.exec(tabs[0].url)) 
						{
							selectTable.selectedIndex = i;
						}
					}
				}
			 });
		 });
	},
	


};

document.addEventListener('DOMContentLoaded', function () {
	popupGenerator.constructWindow()
	popupGenerator.constructSelectTable();
});
