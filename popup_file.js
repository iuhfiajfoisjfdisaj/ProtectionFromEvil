

if (typeof String.prototype.startsWith != 'function') 
{
	// see below for better implementation!
	String.prototype.startsWith = function (str)
	{
	return this.indexOf(str) == 0;
	};
}

function DnDFileController(selector, onDropCallback) 
{
	var el_ = document.querySelector(selector);

	this.dragenter = function(e) 
	{
		e.stopPropagation();
		e.preventDefault();
		el_.classList.add('dropping');
	};

	this.dragover = function(e) 
	{
		e.stopPropagation();
		e.preventDefault();
	};

	this.dragleave = function(e) 
	{
		e.stopPropagation();
		e.preventDefault();
		//el_.classList.remove('dropping');
	};

	this.drop = function(e) 
	{
		e.stopPropagation();
		e.preventDefault();

		el_.classList.remove('dropping');

		onDropCallback(e.dataTransfer)
	};

	el_.addEventListener('dragenter', this.dragenter, false);
	el_.addEventListener('dragover', this.dragover, false);
	el_.addEventListener('dragleave', this.dragleave, false);
	el_.addEventListener('drop', this.drop, false);
};

var dnd = new DnDFileController('body', function(data) {
	var item = data.items[0];
	console.log(item);
	console.log();

	var fileEntry = item.webkitGetAsEntry();

	var extension = ".dat";

	if(fileEntry && fileEntry.name.indexOf(".") >= 0)
	{
	extension = "." + fileEntry.name.split(".").pop();
	}

	var reader = new FileReader();
reader.onload = function(e) {
	popupGenerator.encrypt(e.target.result, extension);
};
	reader.readAsBinaryString(item.getAsFile());

	
});

var popupGenerator = 
{

	showError : function(error) 
	{
		console.log(error);
		alert(error);
	},
	

	str2ab : function(str) 
	{
		var buf = new ArrayBuffer(str.length); 
		var bufView = new Uint8Array(buf);
		
		for (var i=0, strLen=str.length; i<strLen; i++) 
		{
			bufView[i] = str.charCodeAt(i);
		}

		return bufView;
	},
	
	encrypt : function(imgDataToEncrypt, extension)
	{
		var selectTable = document.getElementById("select");
		var keyPhrase = selectTable.options[selectTable.selectedIndex].keyPhrase;
		console.log(keyPhrase);
		//keyPhrase = "secret key";
		//var textToEncrypt = document.getElementById("textToEncrypt").value;
		var outputField = document.getElementById("output");
		
		var encryptedData = sjcl.encrypt(keyPhrase, imgDataToEncrypt);

		// base64 encode it
		encryptedData = btoa(encryptedData);

		console.log("size is "+ encryptedData.length)

		var arrayBufferedImage = popupGenerator.str2ab(encryptedData);

		var blob = new Blob([arrayBufferedImage]);
		var y = new Uint8Array(arrayBufferedImage);
		var x= "";
		//var x = String.fromCharCode.apply(null, y);
		for (var i=0; i<y.byteLength; i++) {
			x += String.fromCharCode(y[i])
		}
		x = "{{{PFE:" + x + "}}}";
		var imgString = "data:image/jpeg;base64," + btoa(x);
		
		/*
		var imgNode = document.createElement("img");
		imgNode.src = imgString;
		document.body.appendChild(imgNode);
		*/

		var fileName = sjcl.codec.hex.fromBits(sjcl.hash.sha256.hash(encryptedData))  + extension;

		var a = document.createElement("a");
		a.href = imgString;
		a.download = fileName;
		a.innerHTML = fileName;

		document.body.appendChild(a);
		document.body.appendChild(document.createElement("br"))

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

				}
			 });
		 });
	},
	
	constructWindow : function() 
	{
		popupGenerator.constructSelectTable();
	},
	
};

document.addEventListener('DOMContentLoaded', function () {
	popupGenerator.constructWindow()
});
