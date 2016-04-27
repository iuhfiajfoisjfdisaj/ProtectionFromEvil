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

if (typeof String.prototype.startsWith != 'function') 
{
  // see below for better implementation!
  String.prototype.startsWith = function (str
  ){
    return this.indexOf(str) == 0;
  };
}


window.addEventListener('message', function (e) 
{
	document.body.innerHTML = e.data.message;
});


    