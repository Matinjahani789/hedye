HEDYE — photo folder
=====================

Matin: put Hedye's photographs in THIS folder (public/photos/).

Supported formats: .jpg  .jpeg  .png  .webp  .avif

Then, BEFORE building / deploying, regenerate the manifest:

    node scripts/index-photos.mjs
    npm run build

The script scans this folder and rewrites photos/manifest.json with the exact
file names found here. (A static website cannot scan folders by itself, so
this tiny development-time step is required. It is NOT part of the runtime app.)

Tips
 - Names are sorted naturally (photo-01.jpg, photo-02.jpg, photo-10.jpg ...).
   Rename files to control the order of the exhibition.
 - Every listed photo is cached for offline viewing the first time the gift is
   opened while online.
 - Prefer photos around 1600px on the long side to keep the offline cache light.
 - Alternative: inside the gallery scene (when the folder is empty) there is a
   button to pick photos from the phone. They are stored in the browser
   (IndexedDB) on that device only.
