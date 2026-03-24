//When page loads, empty values and empty list, not really needed unless we use a storage option
document.addEventListener("DOMContentLoaded", function() {
    longitude.value = "";
    latitude.value = "";
    emptyList();
})
//

//Map
const map = new ol.Map({
  target: 'map', //where to render the map, id map here
  layers: [
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        attributions: '© OpenStreetMap © CARTO'
      })
    })
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([23.7275, 37.9838]), //Where to center the map when page loads
    zoom: 10 //Zoom level to show map
  })
});

const vectorSource = new ol.source.Vector(); //This is the collection of pins and lines

const vectorLayer = new ol.layer.Vector({  //vectorLayer is where we display pins and lines
  source: vectorSource,
  style: function(feature) {
    if (feature.get('type') === 'route') {
      return new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: '#4f6ef7',
          width: 3
        })
      });
    }

    const index = locations.findIndex(l => l.feature === feature);
    const location = locations[index];
    const isSelected = location ? location.selected : false;
    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: 12,
        fill: new ol.style.Fill({ color: isSelected ? '#4fdb9a' : '#4f6ef7' }),
        stroke: new ol.style.Stroke({ color: '#fff', width: 2 })
      }),
      text: new ol.style.Text({
        text: String(index + 1),
        fill: new ol.style.Fill({ color: '#fff' }),
        font: 'bold 11px sans-serif'
      })
    });
    }
});
//

//Right click on map, removes clicked pins
map.on('contextmenu', function(event) {
    event.originalEvent.preventDefault();
    const feature = map.forEachFeatureAtPixel(event.pixel, function(f) { return f; });
    if (feature && feature.get('type') !== 'route') {
        const index = locations.findIndex(l => l.feature === feature);
        if (index !== -1) { //If no matching location is found
            vectorSource.removeFeature(feature);
            locations.splice(index, 1);
            clearRoute();
            renderLocations();
        }
    }
});
//

//Change mouse when hover pin
map.on('pointermove', function(event) {
    const feature = map.forEachFeatureAtPixel(event.pixel, function(f) { return f; });
    if (feature && feature.get('type') !== 'route') {
        map.getViewport().style.cursor = 'pointer';
    } else {
        map.getViewport().style.cursor = '';
    }
});
//

map.addLayer(vectorLayer); //This makes the vector data which are pins and routes visible on map

const locations = []; //Array list of locations
let nextId = 1; //Location number in name

//When we click on map, if there's no pin there it adds it, also adds it in renderLocations() list
map.on('singleclick', function(event) {
  const feature = map.forEachFeatureAtPixel(event.pixel, function(f) { return f; });

  if (feature && feature.get('type') !== 'route') {
    const loc = locations.find(l => l.feature === feature);
    if (loc) {
      loc.selected = !loc.selected;
      renderLocations();
      return;
    }
  }

  const coords = ol.proj.toLonLat(event.coordinate);
  addLocation(coords[0], coords[1]);
});
//

let dragSrcId = null; //Variable for drag and drop

//Main function to render the locations in list
function renderLocations() {
  const locationsList = document.getElementById("locations");
  locationsList.innerHTML = "";
  document.getElementById("locationError").textContent = "";

  locations.forEach(location => {
    const liLocation = document.createElement("li");
    liLocation.className = 'location-item';
    liLocation.draggable = true;
    liLocation.title = location.name;

    if (location.selected) {
      liLocation.classList.add('selected');
    }

    liLocation.addEventListener('click', function() {
      location.selected = !location.selected;
      renderLocations();
    });

    liLocation.addEventListener('dragstart', function() {
      dragSrcId = location.id;
    });

    liLocation.addEventListener('dragover', function(e) {
      e.preventDefault();
    });

    liLocation.addEventListener('drop', function() {
      if (dragSrcId === location.id) return;
      const srcIndex = locations.findIndex(l => l.id === dragSrcId);
      const tgtIndex = locations.findIndex(l => l.id === location.id);
      const [moved] = locations.splice(srcIndex, 1);
      locations.splice(tgtIndex, 0, moved);
      clearRoute();
      renderLocations();
    });

    const dragHandle = document.createElement("span");
    dragHandle.textContent = "⠿";
    dragHandle.classList.add("dragHandle");
    dragHandle.title = "Drag to reorder";

    const numberSpan = document.createElement("span");
    numberSpan.textContent = locations.indexOf(location) + 1;
    numberSpan.classList.add("loc-number");

    const nameSpan = document.createElement("span");
    nameSpan.textContent = location.name + ' (' + location.lon.toFixed(4) + ', ' + location.lat.toFixed(4) + ')';
    nameSpan.classList.add("loc-name");

    const renameDelete = document.createElement("span");
    renameDelete.classList.add("renameDelete");
    const renameButton = document.createElement("button");
    renameButton.textContent = "✎";
    renameButton.title = "Rename";
    renameButton.classList.add("renameButton");
    renameButton.addEventListener("click", function(e) {
      e.stopPropagation();
      const input = document.createElement("input");
      input.type = "text";
      input.value = location.name;
      input.classList.add("loc-name-input");
      nameSpan.replaceWith(input);
      input.focus();

      input.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
          location.name = input.value.trim().charAt(0).toUpperCase() + input.value.trim().slice(1) || location.name;
          renderLocations();
        }
      });

      input.addEventListener("blur", function() {
        location.name = input.value.trim().charAt(0).toUpperCase() + input.value.trim().slice(1) || location.name;
        renderLocations();
      });
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "X";
    deleteButton.classList.add("deleteButton");
    deleteButton.title = "Delete";
    deleteButton.addEventListener('click', function(e) {
      e.stopPropagation();
      const index = locations.findIndex(l => l.id === location.id);
      locations.splice(index, 1);
      vectorSource.removeFeature(location.feature);
      clearRoute();
      renderLocations();
    });

    liLocation.appendChild(dragHandle);
    liLocation.appendChild(numberSpan);
    liLocation.appendChild(nameSpan);
    renameDelete.appendChild(renameButton);
    renameDelete.appendChild(deleteButton);
    liLocation.appendChild(renameDelete);
    locationsList.appendChild(liLocation);
  });

  const hint = document.getElementById("locations-hint");
  hint.style.display = locations.length > 0 ? "block" : "none";

  vectorLayer.changed();
  emptyList();

  document.getElementById("clearListButton").disabled = locations.length === 0;

  const selectedCount = locations.filter(l => l.selected).length;
  const calculateBtn = document.getElementById("calculateRoute");
  calculateBtn.disabled = selectedCount < 2;
  calculateBtn.title = selectedCount < 2 ? "Select at least 2 locations to calculate a route" : "";
}
//

//Longitude/latitude form, to also work by pressing Enter
const longitude = document.getElementById("longitude");
const latitude = document.getElementById("latitude");

document.getElementById("longitude").addEventListener("keydown", function(e) {
    if (e.key === "Enter") document.getElementById("manualLocationButton").click();
});

document.getElementById("latitude").addEventListener("keydown", function(e) {
    if (e.key === "Enter") document.getElementById("manualLocationButton").click();
});
//

//Button that clears the list
document.getElementById("clearListButton").addEventListener("click", function() {
    locations.length = 0;
    vectorSource.clear();
    emptyList();
    nextId = 1;
    clearRoute();
    renderLocations();
})
// 

//Empties location list
function emptyList() {
    const trips = document.getElementById("trips");
    if (locations.length === 0) {
        trips.textContent = "No locations selected.";
        nextId = 1;
    } else {
        trips.textContent = "";
    }
}
// 

//Errors in long/lat
document.getElementById("manualLocationButton").addEventListener("click", function() {
    const long = parseFloat(longitude.value);
    const lat = parseFloat(latitude.value);

    if (longitude.value.trim() === "" || latitude.value.trim() === "") {
        showError("Please enter both longitude and latitude.");
        return;
    }
    if (isNaN(long) || isNaN(lat)) {
        showError("Coordinates must be valid numbers (e.g. 23.7275, 37.9838).");
        return;
    }
    if (long < -180 || long > 180) {
        showError("Longitude must be between -180 and 180.");
        return;
    }
    if (lat < -90 || lat > 90) {
        showError("Latitude must be between -90 and 90.");
        return;
    }

    addLocation(long, lat);
    longitude.value = "";
    latitude.value = "";
    });

function showError(message) {
    const error = document.getElementById("locationError");
    error.textContent = message;
}
//

//Errors in Routes
function showRouteError(message) {
    document.getElementById("routeError").textContent = message;
}

document.getElementById("calculateRoute").addEventListener("click", function() {
    const selected = locations.filter(l => l.selected); //Only takes the selected locations

    if (selected.length < 2) {
        showRouteError("Please select at least 2 locations to calculate a route.");
        return;
    }

    if (routeFeature) { //If there's a previous route, it deletes it
        vectorSource.removeFeature(routeFeature);
    }

    const coords = selected.map(l => ol.proj.fromLonLat([l.lon, l.lat])); //Converts coordinates for open layers

    routeFeature = new ol.Feature({ //Creates a vector feature, a line
    geometry: new ol.geom.LineString(coords),
    type: 'route'
});

    vectorSource.addFeature(routeFeature); //Adds the route to the map
});
//

let routeFeature = null; //When page loads, it has no routes

//Deletes the route
function clearRoute() {
    if (routeFeature) {
        vectorSource.removeFeature(routeFeature); //Removes the line in the route
        routeFeature = null; //Removes the route
    }
}
//

//Fix for map when scrolling far left or far right(it would not add pins correctly)
function addLocation(lon, lat) {
    lon = ((lon + 180) % 360 + 360) % 360 - 180;
    
    const coords = ol.proj.fromLonLat([lon, lat]);
    const feature = new ol.Feature({
        geometry: new ol.geom.Point(coords)
    });
    vectorSource.addFeature(feature);
    const newLocation = {
        id: nextId,
        name: 'Location ' + nextId,
        lon: lon,
        lat: lat,
        feature: feature,
        selected: false
    };
    locations.push(newLocation);
    nextId++;
    renderLocations();
}
//

renderLocations();