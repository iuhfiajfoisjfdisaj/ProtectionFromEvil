//
//
// Protection From Evil (PFE) - http://www.d20srd.org/srd/spells/protectionFromEvil.htm
//
//
var id;
var height;
var width;
var mainWindow;
var origin;

if (typeof String.prototype.startsWith != 'function') {

  // see below for better implementation!
  String.prototype.startsWith = function (str)
  {
    return this.indexOf(str) == 0;
  };
}

reportHome = function() 
{
	height = document.body.scrollHeight;
	width = document.body.scrollWidth;
	mainWindow.postMessage({"id" : id, "height":height, "width":width}, origin); 
}

window.addEventListener('message', function (e) 
{
	// We accept messages from any origin, it's not great but I guess
	// worst case we get a goatse image or two...
	
	mainWindow = e.source;
	id = e.data.id
	origin = e.origin;
	
	/*
	if(!e.data.message.startsWith("data:image/jpeg;base64,"))
	{
		console.log("Received weird image data.z..");
		console.log(e.data.message);
	}
	*/
	
	var lines = e.data.message.split("\n");
	
	for(var i = 0; i < lines.length; i++)
	{
		var paragraphNode = document.createElement("p");
		var textNode = document.createTextNode(lines[i]);
		paragraphNode.appendChild(textNode);
		document.body.appendChild(paragraphNode);
	}

	
	reportHome();
});


    