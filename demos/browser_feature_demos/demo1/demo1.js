var log = wex.Util.log;

function geoLocationSupport()
{
    if (navigator.geolocation) 
    {
        log("Geolocation is supported");
        document.getElementById("GPS").innerHTML = "No sensor available"
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
        document.getElementById("orientation").innerHTML = "No sensor available"
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
        document.getElementById("acceleration").innerHTML = "No sensor available"
        document.getElementById("accelerationIncludingGravity").innerHTML = "No sensor available"
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
        document.getElementById("ambientLight").innerHTML = "No sensor available";
        window.addEventListener("devicelight", ambientLightUpdate, false);
    }
    else
    {
        log("DeviceLightEvent is not supported");
        document.getElementById("ambientLight").innerHTML = "Not supported";
    }
}

function proximitySupport()
{
    if(window.DeviceProximityEvent)
    {
        log("DeviceProximity is supported");
        document.getElementById("proximity").innerHTML = "No sensor available";
        window.addEventListener("deviceproximity", proximityUpdate, false);
    }
    else
    {
        log("DeviceProximity is not supported");
        document.getElementById("proximity").innerHTML = "Not supported";
    }
}

function temperatureSupport()
{

    if(window.AmbientTemperatureEvent)
    {
        log("AmbientTemperatureEvent is supported");
        document.getElementById("temperature").innerHTML = "No sensor available";
        window.addEventListener("ambienttemperature", temperatureUpdate, false);
    }
    else
    {
        log("DeviceTemperatureEvent is not supported");
        document.getElementById("temperature").innerHTML = "Not supported";
    }
}

function atmosphericPressureSupport()
{
    if(window.AtmPressureEvent)
    {
        log("AtmPressureEvent is supported");
        document.getElementById("atmPressure").innerHTML = "No sensor available";
        window.addEventListener("atmpressure", atmosphericPressureUpdate, false);
    }
    else
    {
        log("AtmPressureEvent is not supported");
        document.getElementById("atmPressure").innerHTML = "Not supported";
    }
}

function ambientHumiditySupport()
{
    if(window.AmbientHumidityEvent)
    {
        log("AmbientHumidityEvent is supported");
        document.getElementById("ambientHumidity").innerHTML = "No sensor available";
        window.addEventListener("ambienthumidity", ambientHumidityUpdate, false);
    }
    else
    {
        log("AmbientHumidityEvent is not supported");
        document.getElementById("ambientHumidity").innerHTML = "Not supported";
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

function proximityUpdate(eventData)
{
    proximityStr = "[" + eventData.value + "]";
    document.getElementById("proximity").innerHTML = proximityStr;
}

function temperatureUpdate(eventData)
{
    temperatureStr = "[" + eventData.c + "]";
    document.getElementById("temperature").innerHTML = temperatureStr;
}

function atmosphericPressureUpdate(eventData)
{
    atmosphericPressureStr = "[" + eventData.value + "]";
    document.getElementById("atmPressure").innerHTML = atmosphericPressureStr;
}

function ambientHumidityUpdate(eventData)
{
    ambientHumidityStr = "[" + eventData.value + "]";
    document.getElementById("ambientHumidity").innerHTML = atmosphericPressureStr;
}

geoLocationSupport();
deviceOrientationEventSupport();
deviceMotionEventSupport();
ambientLightSupport();
proximitySupport();
temperatureSupport();
atmosphericPressureSupport();
ambientHumiditySupport();
