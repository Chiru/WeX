# TODO/Known Bugs

## Bugs

## In Ubuntu

### FireFox
    * XML3D.js renderer has some issues: PERFORMANCE WARNING: Attribute 0 is disabled. This has signficant performance penalty <-- depending on hardware
                                         PERFORMANCE WARNING: Some textures are unrenderable.
### Chrome
    * XML3D.js renderer has some issues: PERFORMANCE WARNING: Attribute 0 is disabled. This has signficant performance penalty <-- depending on hardware
                                         PERFORMANCE WARNING: Some textures are unrenderable.

## Android:

### FireFox Nightly:
1. FireFox on Android limits available rendering contexts greatly, and XML3D uses several contexts. Rendering on several contexts is thus very difficult, utilising single contexts would be adviced.
 * Tested drawing video stream (a video file, but not web cam stream. Reason below.) on texture in webgl context and then drawing 3D object on top of the texture: WORKED!.
2. Getting video stream for XML3D using an ObjectURL for the stream object seems to be bugging on FireFox Nightly. The reason is still unknown. When the XML3D is left out of the picture, getting the video stream using the same technique works fine. XML3D might be messing with the video element somehow...

## TODO

### Basic Features
1. Move code from main.js to respective manager objects
2- Add basic functionality to Manager objects
3. Create basic Framework
4. Add example of AR app framework initialisation and usage into main.js
5. Plan how to integrate XFlow + XML3D structure more deeply in the AR App architecture

### Basic Demo
1. Utilise Sensor Manager for fetching device orientation information and rotation matrix
2. Utilise Sensor Manager for getting current GPS location
3. Add functionality for managing AR metadata/POI data. Utilise AR WSManager for fetching the data.
4. Utilise InputManager for fetching video stream from device camera
5. Fetch POI data
  1. Use current GPS location and query POI data from backend.
  2. Fetch 3D/2D assets from Asset Server using asset references in POI data,
  3. Utilise AssetManager for categorizing and storing the asset data
  4. Store POI data somewhere (general data manager for AR/POI data might well be needed)
6. Draw POIs on top of the video stream
  1. Utilise rotation matrix and GPS location from Input Manager
  2. Utilise POI assets stored in AssetManager, and POI location data
  3. Use e.g. haversine distance between current GPS location and drawable POI location to determine size and visibility of POI 2d/3d graphic
  4. Use rotation matrix from Sensor manager to determine POI locations and orientations on top of the video stream