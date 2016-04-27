//
//
// Protection From Evil (PFE) - http://www.d20srd.org/srd/spells/protectionFromEvil.htm
//
//

if (typeof String.prototype.startsWith != 'function') {
  String.prototype.startsWith = function (str){
    return this.slice(0, str.length) == str;
  };
}

if (typeof String.prototype.endsWith != 'function') {
	String.prototype.endsWith = function(suffix) {
	    return this.indexOf(suffix, this.length - suffix.length) !== -1;
	};
}


//var encrypted = CryptoJS.AES.encrypt('<html><body><h1>It works!</h1><br><br><b>ok lets do this</b><br><img src="enc.png"></body></html>', 'secret key');

var PFE =
{
	init : function()
	{
		PFE.MARKER_START = "{{{PFE:";
		PFE.MARKER_END = "}}}";	
	},

	attemptBinaryDecryption : function(nodeValue, keyPhrase)
	{
		var end = nodeValue.indexOf(PFE.MARKER_END);
		
		if(-1 == end)
		{
			return;
		}
		
	//	console.log("asfsaf");
		var encryptedData = nodeValue.substr( PFE.MARKER_START.length, end - PFE.MARKER_END.length - 4);

		//unbase64 it
		encryptedData = atob(encryptedData);

	//	console.log("unbase64d");
		//console.log(encryptedData);

		try
		{
			var decryptedData = sjcl.decrypt(keyPhrase, encryptedData);
		}
		catch(e)
		{
			return "";
		}
	//	console.log(decryptedData.substr(0,20));
		
		return decryptedData;
	},

	escapeHTML : function (str)
	{
	   var div = document.createElement('div');
	   var text = document.createTextNode(str);
	   div.appendChild(text);
	   return div.innerHTML;
	},

	attemptDecryption : function(location, nodeValue, keyPhrase, htmlEncode) 
	{
		var newNodeData = nodeValue;
		
		while(-1 != location) 
		{
			var end = newNodeData.indexOf(PFE.MARKER_END);
			
			if(-1 == end)
			{
				return;
			}
			
			var encryptedData = newNodeData.substr(location + PFE.MARKER_START.length, end - location - PFE.MARKER_END.length - 4);		
			//unbase64 it
			encryptedData = atob(encryptedData);

			//console.log("unbasexx64d");
			//console.log(encryptedData);

			try
			{
				var decryptedData = sjcl.decrypt(keyPhrase, encryptedData);

				if(!htmlEncode) 
				{
					decryptedData = PFE.escapeHTML(decryptedData);
				}
			
				newNodeData = newNodeData.replace(PFE.MARKER_START + encryptedData + PFE.MARKER_END, decryptedData);
			}
			catch(e)
			{
			//	console.log(e);
				// just continue on
			}
			
			
			location = newNodeData.indexOf(PFE.MARKER_START);
		}

		return newNodeData;
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
	
	splitTextByMarkers : function(nodeText)
	{
		ret = [];
	
		arr = nodeText.split(PFE.MARKER_START)
		
		for(var i = 0 ; i < arr.length; i++)
		{
			// text before it
			if(arr[i].indexOf(PFE.MARKER_END) == -1)
			{
				ret.push(arr[i])
			}
			else
			{
				splitText = arr[i].split(PFE.MARKER_END);
				
				if(splitText.length != 2)
				{
					continue;
				}
				
				ret.push(PFE.MARKER_START + splitText[0] + PFE.MARKER_END);
				ret.push(splitText[1]);
				
			}
		}
		
		return ret;
	},
	
	splitTextByMarkers2 : function(nodeText)
	{
		ret = [];
		
		var location = nodeText.indexOf(PFE.MARKER_START)
		var end = nodeText.indexOf(PFE.MARKER_END);
		
		while(-1 != location)
		{
			end = nodeText.indexOf(PFE.MARKER_END);
			
			if( -1 == end )
			{
				break;
			}
			
			text = nodeText.substr(location + PFE.MARKER_START.length, end - location - PFE.MARKER_END.length - 4);
			ret.push(text);
			
			nodeText = nodeText.replace( PFE.MARKER_START + text + PFE.MARKER_END, "");
			
			location = nodeText.indexOf(PFE.MARKER_START);
		}
		
	
		return ret;
	},
	
	walkDOMButDoNotIframe : function( node, keyPhrase )
	{
		var node = node.firstChild;
		
		if(PFE.idIndex == undefined)
		{
			PFE.idIndex = 0;
		}
		
		// This counter is used to create a unique iframe id
		if(PFE.imageIframes == undefined)
		{
			PFE.imageIframes = new Array();
		}
		
		while(node) 
		{
			// Saved because we might replace the node with an iframe
			// losing its nextSibilings
			var nextSibiling = node.nextSibling;

		
			if(node.childNodes.length == 0 &&  node.textContent.indexOf(PFE.MARKER_START) != -1)
			{
				base64EncryptedData = PFE.splitTextByMarkers(node.textContent);
				
				var parent = node.parentNode;
				var parentFunkiness = false;
				
				// sometimes people put weird shit to break up lines like 4chan,
				// we take a gamble and wipe out all children below
				// XXX need to test lots of sites to see if this will break shit...
				if(0 == base64EncryptedData.length)
				{
					base64EncryptedData = PFE.splitTextByMarkers(parent.textContent);
					
					if(0 != base64EncryptedData.length)
					{
						parentFunkiness = true;
					}
				}
					
				for(var i = 0; i < base64EncryptedData.length; i++)
				{
					var divNode = document.createElement("div");
				
					var decryptedData = base64EncryptedData[i];
					
					if(decryptedData.indexOf(PFE.MARKER_START) != -1)
					{
						decryptedData = decryptedData.replace(PFE.MARKER_START, "").replace(PFE.MARKER_END, "");
						decryptedData = atob(decryptedData);
						decryptedData = sjcl.decrypt(keyPhrase, decryptedData);
					}

					
					if(parentFunkiness)
					{
						while( parent.hasChildNodes() )
						{
							parent.removeChild(parent.lastChild);
						}
						parent.appendChild(divNode);
					}
					
					// Replace the text node first time, else append it to our parent
					else if(0 == i)
					{		
						parent.replaceChild(divNode, node);
					}
					else
					{
						parent.appendChild(divNode);
					}
					
					PFE.idIndex++;
					

					
					divNode.innerHTML = decryptedData;
				}

			}
			
			else if(node.tagName == "IMG" && node.src != "" && !node.done) 
			{
				var oReq = new XMLHttpRequest();
				oReq.open("GET", node.src, true);
				
				node.done = true;

				// Save the node for later so we can access it in onload()
				oReq.node = node;
				
				oReq.onload = function(e) 
				{
					if(null == oReq.response)
						return;

					if(oReq.response.startsWith(PFE.MARKER_START))
					{

						var newImageData = PFE.attemptBinaryDecryption(oReq.response, keyPhrase);
						
						if(newImageData)
						{
							var arrayBufferedImage = PFE.str2ab(newImageData);

							var blob = new Blob([arrayBufferedImage]);
							
							var imgString = "data:image/jpeg;base64," + btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBufferedImage)));
							
							oReq.node.src = imgString;
						}
						
					}	
				}
				oReq.send();
				
			}
			
			// recurse!
			if(node.children)
				PFE.walkDOMButDoNotIframe(node, keyPhrase);
			
			if(node == node.nextSibiling)
			{
				break;
			}
			
			node = nextSibiling;
			
			
		}
	},

	walkDOM : function (node, keyPhrases) 
	{
		var node = node.firstChild;
		
		if(PFE.idIndex == undefined)
		{
			PFE.idIndex = 0;
		}
		
		// This counter is used to create a unique iframe id
		if(PFE.imageIframes == undefined)
		{
			PFE.imageIframes = new Array();
		}
		
		
		
		while(node) 
		{
			// Saved because we might replace the node with an iframe
			// losing its nextSibilings
			var nextSibiling = node.nextSibling;
			
			if(node.childNodes.length == 0 &&  node.textContent.indexOf(PFE.MARKER_START) != -1)
			{
				var parent = node.parentNode;
				var parentFunkiness = false;


				// sometimes people put weird shit to break up lines like 4chan,
				// we take a gamble and wipe out all children below
				// XXX need to test lots of sites to see if this will break shit...
				if(-1 == node.textContent.indexOf(PFE.MARKER_END))
				{
					base64EncryptedData = PFE.splitTextByMarkers(parent.textContent);

					if(0 != base64EncryptedData.length)
					{
						parentFunkiness = true;
					}

				}
				else
				{
					base64EncryptedData = PFE.splitTextByMarkers(node.textContent);
				}

				var totalDecryptedData = "";
				var found = false;
				
				for(var i = 0; i < base64EncryptedData.length; i++)
				{
					var decryptedData = base64EncryptedData[i];
					
					
					if(decryptedData.indexOf(PFE.MARKER_START) != -1)
					{
						for(var j = 0 ; j < keyPhrases.length ; j++)
						{
							try
							{
								decryptedData = decryptedData.replace(PFE.MARKER_START, "").replace(PFE.MARKER_END, "");
								decryptedData = atob(decryptedData);
								decryptedData = sjcl.decrypt(keyPhrases[j], decryptedData);
							}
							catch (e)
							{
								decryptedData = base64EncryptedData[i];
								continue;
							}

							found = true;
							break;
						}
					}

					totalDecryptedData += decryptedData;
				}

				if(found)
				{
					var iframe = document.createElement("iframe");
				
					iframe.height = 1;
					iframe.width = "100%";
					iframe.src = chrome.runtime.getURL("sandboxed.html");
					iframe.id = "iframe_index_" + PFE.idIndex.toString();

					PFE.idIndex++;

					var seamlessAttribute = document.createAttribute("seamless");
					iframe.attributes.setNamedItem(seamlessAttribute);


					if(parentFunkiness)
					{
						while( parent.hasChildNodes() )
						{
							parent.removeChild(parent.lastChild);
						}
						parent.appendChild(iframe);
					}
					else
					{
						parent.replaceChild(iframe, node);					
					}


					var ourPostMessage = function(iframe, message, func) 
					{
						if(iframe.style.cssText == "")
						{
							iframe.contentWindow.postMessage({"message":message, "id" : iframe.id}, "*");
							setTimeout(func, 100,  iframe, message);
						}
					};
					
					setTimeout(ourPostMessage, 100,  iframe, totalDecryptedData, ourPostMessage);
				}

			}
			
			else if(node.tagName == "IMG" && node.src != "" && node.done == undefined) 
			{
				var oReq = new XMLHttpRequest();
				oReq.open("GET", node.src, true);

				node.done = true;
				node.id = "iframe_index_" + PFE.idIndex.toString();
				PFE.idIndex++;
			//	console.log("BLAH" + node.id)

				// Save the node for later so we can access it in onload()
				oReq.node = node;
				oReq.called = 0;
				
				oReq.onload = function(e) 
				{
					if(null == oReq.response)
						return;

					var origRequestElement = e.srcElement;


					if(origRequestElement.response.startsWith(PFE.MARKER_START))
					{
						for(var j = 0 ; j < keyPhrases.length ; j++)
						{
							var newImageData = PFE.attemptBinaryDecryption(origRequestElement.response, keyPhrases[j]);

							if(newImageData)
							{
								var arrayBufferedImage = PFE.str2ab(newImageData);

								var blob = new Blob([arrayBufferedImage]);
								
								var iframe = document.createElement("iframe");
								
								var imgString = "data:image/jpeg;base64," + btoa(String.fromCharCode.apply(null, new Uint8Array(arrayBufferedImage)));
								
								
								iframe.height = 1;
								iframe.width = 1;
								iframe.src = chrome.runtime.getURL("sandboxed_image.html");
								iframe.id = "iframe_index_" + PFE.idIndex.toString();
								
								PFE.idIndex++;
							
								var seamlessAttribute = document.createAttribute("seamless");
								iframe.attributes.setNamedItem(seamlessAttribute);
								
								origRequestElement.node.parentNode.replaceChild(iframe, origRequestElement.node);

								var ourPostMessage = function(iframe, message, func) 
								{
									if(iframe.style.cssText == "")
									{
										iframe.contentWindow.postMessage({"message":message, "id" : iframe.id}, "*");
										setTimeout(func, 100,  iframe, message);
									}
								};
								
								setTimeout(ourPostMessage, 100,  iframe, imgString, ourPostMessage);
							}
						}
					}	
				}
			
				oReq.send();
			}
			
			// recurse!
			if(node.children)
			{
				PFE.walkDOM(node, keyPhrases);
			}
			
			if(node == node.nextSibiling || node == null)
			{
				break;
			}
			
			node = nextSibiling;
		}
	},
	
	
	decryptEntireSite : function(body, keyPhrase)
	{
		if(body && body. # && body.textContent.startsWith(PFE.MARKER_START))
		{
			var decryptedPage = PFE.attemptBinaryDecryption(body.textContent, keyPhrase);
			
			var iframe = document.createElement("iframe");
		
			iframe.height = "100%";
			iframe.width = "100%";
			iframe.src = chrome.runtime.getURL("sandboxed_page.html");

			var seamlessAttribute = document.createAttribute("seamless");
			iframe.attributes.setNamedItem(seamlessAttribute);
			
			var divNode = document.createElement("div");
	
			divNode.innerHTML = decryptedPage;
			console.log(divNode.innerHTML);
			
			PFE.walkDOMButDoNotIframe(divNode, keyPhrase);			
			
			body.parentNode.replaceChild(iframe, body);

			console.log("iframe thing ins " + iframe.src)
			
			// this needs to happen later once the walkDOM function has finished...
			// xxx
			var ourPostMessage = function(iframe, divNode) 
			{
				iframe.contentWindow.postMessage({"message": divNode.innerHTML, "id" : iframe.id}, iframe.src);
			};
			
			setTimeout(ourPostMessage, 2000,  iframe, divNode);

			return  iframe;	
		}	
	},


		
	decryptPFEMarkers2 : function (node, keyPhrase, htmlEncode) 
	{
		var found = node.innerHTML.indexOf(PFE.MARKER_START)
		
		if(-1 != found) 
		{
			 node.innerHTML = PFE.attemptDecryption(found, node.innerHTML, keyPhrase, htmlEncode);
		}
	},
	
	decryptPFEMarkers : function (node, keyPhrase, htmlEncode) 
	{
		var found = node.innerHTML.indexOf(PFE.MARKER_START)
		
		if(-1 != found) 
		{
			 node.innerHTML = PFE.attemptDecryption(found, node.innerHTML, keyPhrase, htmlEncode);
		}
	},
	
	onsubmit : function()
	{
		console.log("safsa");
		alert(1);
	},
	
	// interrupt the form request, look up if
	encryptPostRequest : function(evt)
	{
		var form = evt.srcElement;
		console.log(evt);
		evt.preventDefault();
		chrome.storage.local.get("keyList", function(fetchedData) 
		{
			console.log( form.target);
			
			for(var i = 0; i < form.elements.length; i++)
			{
				var element = form.elements[i];
				console.log(element);
				if(element.name == "q")
				{
					element.value = "qqq";
				}
			}
			
			form.submit();
		});
	},
	
	
	interceptForms : function ()
	{
		chrome.storage.local.get("keyList", function(fetchedData) 
		{
			var allForms = document.getElementsByTagName("form");
			
			for(var i = 0; i < allForms.length; i++)
			{
				var element = allForms[i];
				console.log("found element" + element.action+ " " + element.id);
				

				element.addEventListener("submit",function(evt) 
				{
					PFE.encryptPostRequest(evt);
				});
			}
		});
	},
	
	
	injectFunctions : function ()
	{
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.text = "var functionReturningImage = function(input)	{return input;	}";
		document.body.appendChild(script);
	},

	goTime : function() 
	{
		PFE.init();

		chrome.runtime.sendMessage({message: "requesting key"}, function(response) 
		{
			chrome.storage.local.get("keyList", function(fetchedData)
			{		
				
				var body = document.body;
				var keyPhrases = [];


				for(var i = 0; i < fetchedData.keyList.length; i++) 
				{
					var entry = fetchedData.keyList[i];

					if(entry.enabled && !entry.htmlEncode)
					{
						keyPhrases.push(sjcl.decrypt(response.keyPhrase, entry.keyPhrase));
					}

					var decryptedKeyPhrase = sjcl.decrypt(response.keyPhrase, entry.keyPhrase);

/*
					var decryptedRegex = sjcl.decrypt(response.keyPhrase,entry.urlRegex);
					
					
					var re = new RegExp(decryptedRegex);
*/
					if(entry.enabled && entry.htmlEncode)// && re.exec(document.location))
					{
						PFE.decryptEntireSite(body,decryptedKeyPhrase);
					}
				}

				if(keyPhrases.length)
				{
					PFE.walkDOM(body, keyPhrases);
				}
			});
		});
	},
	

}


window.addEventListener('message', function (e) 
{
	iframe = document.getElementById(e.data.id);
	
	if(iframe)
	{
		height = e.data.height;
		width = e.data.width;
		iframe.style.height = height+"px";
		iframe.style.width = width+"px";
		//console.log('Result: ' + e.data.id + " width " + width + " " + height);
	}
});


PFE.goTime();
