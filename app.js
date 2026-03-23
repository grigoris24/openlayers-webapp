

const map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.XYZ({
        url: 'https://{a-c}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        attributions: '© OpenStreetMap © CARTO'
      })
    })
  ],
  view: new ol.View({
    center: ol.proj.fromLonLat([23.7275, 37.9838]),
    zoom: 6
  })
});

const vectorSource = new ol.source.Vector();

const vectorLayer = new ol.layer.Vector({
  source: vectorSource,
  style: function(feature) {
    const index = locations.findIndex(l => l.feature === feature);
    return new ol.style.Style({
      image: new ol.style.Circle({
        radius: 12,
        fill: new ol.style.Fill({ color: '#4f6ef7' }),
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

map.addLayer(vectorLayer);

const locations = [];
let nextId = 1;

map.on('singleclick', function(event) {
  const coords = ol.proj.toLonLat(event.coordinate);
  const feature = new ol.Feature({
    geometry: new ol.geom.Point(event.coordinate)
  });
  vectorSource.addFeature(feature);
  
  const newLocation = {
    id: nextId,
    name: 'Location ' + nextId,
    lon: coords[0],
    lat: coords[1],
    feature: feature
  };
  
  locations.push(newLocation);
  nextId++;
  renderLocations();
});

let dragSrcId = null;

function renderLocations() {
  const locationsList = document.getElementById("locations");
  locationsList.innerHTML = "";
  locations.forEach(location => {
    const liLocation = document.createElement("li");
    liLocation.className = 'location-item';
    liLocation.draggable = true;

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
      renderLocations();
    });

    const nameSpan = document.createElement("span");
    nameSpan.textContent = location.name;
    nameSpan.classList.add("loc-name");
    liLocation.appendChild(nameSpan);

    const renameButton = document.createElement("button");
    renameButton.textContent = "✎";
    renameButton.classList.add("renameButton");
    renameButton.addEventListener("click", function() {
      const input = document.createElement("input");
      input.type = "text";
      input.value = location.name;
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
    deleteButton.addEventListener('click', function() {
      const index = locations.findIndex(l => l.id === location.id);
      locations.splice(index, 1);
      vectorSource.removeFeature(location.feature);
      renderLocations();
    });

    liLocation.appendChild(renameButton);
    liLocation.appendChild(deleteButton);
    locationsList.appendChild(liLocation);
    vectorLayer.changed();
  });
}