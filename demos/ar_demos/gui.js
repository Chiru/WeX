(function ( namespace, undefined ) {

/* ---- */
/*  str2html - convert any string for safe display in html
    ========
   
    This converts characters not allowed in html strings to well behaving
    html character entities.           
    
    str2html(rawstr: string): string;
        rawstr - string not controlled for contents
        
        *result - safe, well behaving html representation of the input string
        
    Example: "Rat & Arms" -> "Rat &amp; Arms"    
*/        
        
var str2html_table = {
	"<": "&lt;",
	"&": "&amp;",
	"\"": "&quot;",
	"'": "&apos;",
	">": "&gt;",
};

function str2html (rawstr) {
	var result = "";
	for (var i = 0; i < rawstr.length; i++) {
		result = result + (str2html_table[rawstr[i]] ? 
				(str2html_table[rawstr[i]]) : (rawstr[i]));
	}
	return result;
}
/**/
    // Util shortcuts
    var extend = namespace.Util.extend,
        log = namespace.Util.log,

        AR = namespace.AR;

        AR.GUI = (function () {

        var infoPanel, bChangeCamera;

        var handleOrientation = function ( e ) {

            if ( !infoPanel ) {
                return;
            }

            var x = e.beta,  // In degree in the range [-180,180]
                y = e.gamma, // In degree in the range [-90,90]
                z = e.alpha;
                absolute = e.absolute;
                //accuracy = e.accuracy;
                
            if ( x === null || y === null || z === null ) {
                infoPanel.innerHTML = "No orientation data available.";
                return;
            }

            infoPanel.innerHTML = "beta : " + x.toFixed( 2 ) + "  ";
            infoPanel.innerHTML += "gamma: " + y.toFixed( 2 ) + "  ";
            infoPanel.innerHTML += "alpha: " + z.toFixed( 2 ) + "  ";
            infoPanel.innerHTML += "absolute: " + absolute + "\n";
            //infopanel.innerHTML += "accuracy:  " + accuracy + "\n";
        };

        function observeOrientation( signal ) {
            signal.add( handleOrientation );

        }
        
        function clearData() {
            var el;
            
            el = document.getElementById( "raw_data" );
            if ( el !== null ) {
                var d;

                el.innerHTML = "";
                d = el.scrollHeight - el.clientHeight;
                el.scrollTop = d;
            };
        
       }
    
       function showData(poi_data, uuid) {
            //var poi_data = miwi_ar_pois[uuid];
            var el;
            
            if (poi_data) {
                el = document.getElementById( "raw_data" );
                if ( el !== null ) {
                    el.innerHTML += "<pre>" + 
                    //str2html(JSON.stringify(data, null, "  ")) +
                    "UUID: " + uuid + "\n" + formatData(poi_data, 0) +
                    "</pre>";
                    var d = el.scrollHeight - el.clientHeight;
                    el.scrollTop = d;
                };
            
            }
        }
    
        function formatData(data, level) { // : string
            if (typeof data == 'number') {
                result = "" + data + "\n";
            }
            if (typeof data == 'string') {
                result = str2html(data) + "\n";
            }
            if (typeof data == 'boolean') {
                result = "" + data + "\n";
            }
            if (typeof data == 'object') {
                var result = "\n";
                var key, i;
                
                for (key in data) { 
                    // indent element lines
                    for (i = 0; i < level; i++) {
                        result += "  ";
                    }
                    result += str2html(key) + ": " + 
                        formatData(data[key], level + 1);
                }
                
            }
            return result;
        }

        function init() {
            infoPanel = document.querySelector( '#infoPanel' );
            if ( !infoPanel ) {
                handleOrientation = function () {};
            }
            
            clearData();      
        }

        return {
            init: init,
            observeOrientation: observeOrientation,
            clearData : clearData,
            showData : showData
        };

    }());


}( window['wex'] = window['wex'] || {} ));
