WeX democode
------------

This repository contains demo code related to WeX project, and focusing on POI
and Augmented Reality activities.

Use-cases implemented: (F1-4 refer to included demo web layout image)

1. Read local sensor data, and display it locally. Following sensors are read:
Accelerometer, gyro, GPS, ambient light sensor.
 -> F1: title and description
 -> F2: Textual, formatted data read from the available sensors
 -> F3: Any relevant RAW data, maybe in JSON format
 -> F4: UI controls: stop sensing, start sensing

2. Read camera feed and store a screenshot to local device. With WebRTC?
 -> F1: title and desciption
 -> F2: real-time video feed from the camera
 -> F3: RAW camera initialization information, from chosen camera API
 -> F4: UI controls: stop video, start video, save video snapshot, choose
    between front and back camera.

3. Record audio from local microphone, and store is locally to the device. with WebRTC?
 -> F1: title and desciption
 -> F2: real-time video feed from the camera
 -> F3: RAW camera initialization information, from chosen camera API
 -> F4: UI controls: stop video, start video, save video snapshot

4. Show chosen POI queries as red dots on a map. Dots can be expanded with
hover, which opens a pop-up to display details. When map is updated (moved/scaled)
a new set of POI is retrieved.
 -> F1: title and desciption
 -> F2: A view from google maps, defaulting to Oulu and with default map controls
 -> F3: JSON queries POI backend, and received responses
 -> F4: UI controls: manual GPS coordinates via text fields. Automatic GPS coordinates
    via GPS device. toggle automatic update on/off.
    
5. Read camera feed and pass it to ALVAR for marker detection.
 -> F1: title and desciption
 -> F2: real-time video feed from the camera
 -> F3: shows the finded markers in JSON format
 -> F4: UI controls: start marker detection, stop marker detection.

Further down the road...

5. Extension to the POI case, enable adding new POI into the map, which are
saved to the custom database. Additional POI are showed with different color.

6. Send captured images to backend service, for further processing. The backend
service shall be a Gevent based python web server, which is able to save and
store files to local, and optionally run PCL or similar tool for image reconstruction.

7. Experiment OpenNI plugins, like WebNI, and how those could be integrated with
camera feed and utilized with augmented reality.


