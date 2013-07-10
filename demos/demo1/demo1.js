var log = wex.Util.log;

function geoLocationSupport()
{
    if (navigator.geolocation) 
    {
        log("Geolocation is supported");
        navigator.geolocation.getCurrentPosition(positionUpdate)
    }
    else 
    {
        log("Geolocation is not supported");
        document.getElementById("GPS").innerHTML = "Not supported";
    }
}

function deviceOrientationEventSupport()
{
    if (window.DeviceOrientationEvent) 
    {
        log("DeviceOrientationEvent is supported");
        window.addEventListener("deviceorientation",orientationUpdate , false);
        
    }
    else if (window.OrientationEvent) 
    {
        log("MozOrientation is supported");
        window.addEventListener("MozOrientation",function(){} , false);
    }
    else 
    {
        log("DeviceOrientationEvent not supported");
        document.getElementById("orientation").innerHTML = "Not supported";
    }
}

function deviceMotionEventSupport()
{
    if (window.DeviceMotionEvent) 
    {
        log("DeviceMotionEvent is supported");
        window.addEventListener("devicemotion", accelerometerUpdate, false);
    }
    else 
    {

        log("DeviceMotionEvent not supported");
        document.getElementById("acceleration").innerHTML = "Not supported";
        document.getElementById("accelerationIncludingGravity").innerHTML = "Not supported";
    }
}

function ambientLightSupport()
{
    if(window.DeviceLightEvent)
    {
        log("DeviceLightEvent is supported");
        window.addEventListener("devicelight", ambientLightUpdate, false);
    }
    else
    {
        log("DeviceLightEvent is not supported");
        document.getElementById("ambientLight").innerHTML = "Not supported";
    }
}

function positionUpdate(position)
{
    var altitude = position.coords.altitude;
    var GPSStr = "[" + position.coords.latitude + ", " + position.coords.longitude + "]"
    document.getElementById("GPS").innerHTML = GPSStr;
}

function accelerometerUpdate(eventData)
{
    var acceleration = eventData.acceleration;
    var accelerationIncludingGravity = eventData.accelerationIncludingGravity;

    var accelarationStr = "[" +  Math.round(acceleration.x) + ", " + Math.round(acceleration.y) + ", " + Math.round(acceleration.z) + "]"; 
   
    var accelarationIncludingGravityStr = "[" + Math.round(accelerationIncludingGravity.x) + ", " 
                                              + Math.round(accelerationIncludingGravity.y) + ", " 
                                              + Math.round(accelerationIncludingGravity.z) + "]";


    document.getElementById("acceleration").innerHTML = accelarationStr;
    document.getElementById("accelerationIncludingGravity").innerHTML = accelarationIncludingGravityStr;

}

function orientationUpdate(eventData)
{
    var orientationStr = "[" + Math.round(eventData.alpha) + ", " + Math.round(eventData.beta) + ", " + Math.round(eventData.gamma) + "]"; 
    document.getElementById("orientation").innerHTML = orientationStr;
}

function ambientLightUpdate(eventData)
{
    ambientLightStr = "[" + eventData.value + "]";
    document.getElementById("ambientLight").innerHTML = ambientLightStr;
}

geoLocationSupport();
deviceOrientationEventSupport();
deviceMotionEventSupport();
ambientLightSupport();

