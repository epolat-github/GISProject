var geoJsonObject = {};
var modifyButton = document.getElementById("modify");
var snapButton = document.getElementById("snap");
var combo = document.getElementById("drawTypes"); //combo box
var currentInter; //interaction holder
var lastId = 0;
var geoFormat = new ol.format.GeoJSON;


//Raster layer
const rasterSource = new ol.source.OSM();
const rasterLayer = new ol.layer.Tile({
    source: rasterSource
})

//Feature layer as image
const wmsLayerSource = new ol.source.ImageWMS({
    url: 'http://localhost:8090/geoserver/wms?styles=line&Format=image/png&request=GetMap&layers=nyc:FEATURES&srs=EPSG:3857'
});
const wmsLayer = new ol.layer.Image({
    source: wmsLayerSource
});

//Features as vector layer
const vectorSource = new ol.source.Vector({
    format: geoFormat,
    url: 'http://localhost:8090/geoserver/nyc/ows?service=WFS&version=1.0.0&' +
        'request=GetFeature&typeName=nyc%3AFEATURES&outputFormat=application%2Fjson',
});
const vectorLayer = new ol.layer.Vector({
    source: vectorSource
});

//selection
var select = new ol.interaction.Select({
    toggleCondition: ol.events.condition.never //disables shift multi select
});

//Overlay
var overlay = new ol.Overlay({
    element: document.getElementById('popup'),
    positioning: 'bottom-center',
    autoPan: true
});

//Map
const map = new ol.Map({
    layers: [rasterLayer, vectorLayer, wmsLayer],
    target: 'map',
    view: new ol.View({
        center: [0, 0],
        zoom: 2
    }),
    overlays: [overlay]
});

//Add popup
function addPopup(data) {
    var id = data.features[0].properties.gid;
    var name = data.features[0].id;
    var type = data.features[0].geometry.type;
    var coordinateArray = data.features[0].geometry.coordinates[0];
    var coorText = ol.coordinate.toStringHDMS(ol.proj.toLonLat(coordinateArray[0]));
    var innerHtml = "<table>" + coorText + "</table><tr><th>ID</th><td>" + id + "</td></tr><tr>" +
        "<th>Name</th><td>" + name + "</td></tr><tr><th>Type</th>" +
        "<td>" + type + "</td></tr><tr><th>Coords</th>" +
        "<td></td></tr>";
    $("#propTable").html(innerHtml);
    overlay.setPosition(coordinateArray[0]);
    //overlay.setPosition(coordinateArray[0][0], coordinateArray[0][1]);
    //alert("Successfully selected!");
    console.log(data);
}

//Getting info of selected feature from GeoServer
select.on("select", function (e) {
    if (e.selected.length === 0) {      //popup removing
        overlay.setPosition(undefined);
        return;
    }
    var selected = e.selected;
    var props = selected[0].getProperties(); //properties object
    var geomObj = props.geometry;            //geometry object
    var extentArray = geomObj.getExtent();   //extend array
    var extentString = extentArray.join();
    $.ajax({
        url: 'http://localhost:8090/geoserver/nyc/wms?' +
            '&INFO_FORMAT=application/json' +
            '&REQUEST=GetFeatureInfo' +
            '&SRS=EPSG: 3857' +
            '&SERVICE=WMS' +
            '&VERSION=1.1.0' +
            '&WIDTH=966&HEIGHT=482&X=486&Y=165' +
            '&QUERY_LAYERS=nyc:FEATURES' +
            '&LAYERS=nyc:FEATURES' +
            '&BBOX=' + extentString,
        method: "post",
        success: function (data) {
            addPopup(data);         //popup feature
        },
        error: function (req, textStatus, errorThrown) {
            alert('ERROR: ' + textStatus + ' ' + errorThrown);
        }
    });
});
var selectSitu = false;
$(function () {
    $("#select").click(function () {
        if (selectSitu) {
            map.removeInteraction(select);
            map.addInteraction(currentInter);
            $("#select").toggleClass("buttonEnabled"); //for CSS
            selectSitu = false;
        }
        else {
            selectSitu = true;
            $("#select").toggleClass("buttonEnabled"); //for CSS
            map.removeInteraction(currentInter);
            map.addInteraction(select);
        }
    });
});

//defines drawings
addInter("Point");

function addInter(type) {
    currentInter = new ol.interaction.Draw({
        type: type,
        source: vectorSource
    });
    map.addInteraction(currentInter);
}

combo.addEventListener("click", changeDrawType);

function changeDrawType() {
    //var selection = document.getElementById("drawTypes");
    var selectedType = combo.value;

    map.removeInteraction(currentInter);

    if (selectedType !== "None") {
        addInter(selectedType);
    }
}

//add Modify feature
var modify = new ol.interaction.Modify({
    source: vectorSource
});
var modSituation = false; //false, not modifying; true, modifying
var comboBox = document.getElementById("drawTypes");

function Modify() {
    if (modSituation) { // modify button = off
        map.removeInteraction(modify);
        modSituation = false;
        map.addInteraction(currentInter); // adds drawings back
        comboBox.disabled = false;
    }
    else {              // modify button = on
        map.removeInteraction(currentInter); //to prevent from having two dots on the screen
        modSituation = true;
        map.addInteraction(modify);
        comboBox.disabled = true;
    }
    $("#modify").toggleClass("buttonEnabled");
}

//SNAP FEATURE 
//add Snap feature
//snapButton.disabled = true;
//var snap = new ol.interaction.Snap({
//    source: vectorSource
//});
//var snapSituation = false; //false, not snapping; true, snapping
//function Snap() {
//    if (snapSituation) {
//        map.removeInteraction(snap); // disables snap
//        snapSituation = false;
//        snapButton.style.backgroundColor = "#ea9595";
//        snapButton.style.borderColor = "#c71d1d";
//    }
//    else {
//        map.addInteraction(snap);
//        snapSituation = true;
//        snapButton.style.backgroundColor = "#5ebe82";
//        snapButton.style.borderColor = "#00ff21";
//    }
//}

//Synchronize map
$(function () {
    $("#update").click(function () {

        var allFeatures = vectorSource.getFeatures();
        var i;
        for (i = 0; i < allFeatures.length; i++) {
            let feature = allFeatures[i];            

            if (feature.id_ === undefined) { //new features don't assigned id
                geoJsonObject = geoFormat.writeFeature(feature);
                addFeature(geoJsonObject);
            }
            else {
                var tempID = feature.getId(); //ID as string(FEATURES.3)
                var newID = parseInt(tempID.substring(9)); //ID as integer(3)
                feature.setId(newID);
                geoJsonObject = geoFormat.writeFeature(feature);
                updateFeature(geoJsonObject);
            }            
        }
    });
});

//Update feature
function updateFeature(geoJson) {
    $.ajax({
        url: "WebService1.asmx/updateFeature",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({ feature: geoJson }),
        method: "post",
        dataType: "json",
        success: function () { //data.d
            console.log("Successfully updated!");
            wmsLayerSource.refresh();
        },
        error: function (req, textStatus, errorThrown) {
            alert('Update Feature Error: ' + textStatus + ' ' + errorThrown);
        }
    });
};

//Adds feature
function addFeature(geoJson) {
    $.ajax({
        url: "WebService1.asmx/addFeature",
        contentType: "application/json; charset=utf-8",
        data: JSON.stringify({ feature: geoJson }),
        method: "post",
        dataType: "json",
        success: function () { //data.d
            console.log("Successfully added!");
            wmsLayerSource.refresh();
        },
        error: function (req, textStatus, errorThrown) {
            alert('Add Feature Error: ' + textStatus + ' ' + errorThrown);
        }
    });
};


$(function () {
    $("#add").click(function () {
        if (select !== null) {
            var allFeatures = select.getFeatures();
            var feature = allFeatures.item(0);
            //feature.setProperties({'id': (lastId + 1)});
            feature.setId((++lastId));
            geoJsonObject = geoFormat.writeFeature(allFeatures.item(0));
        }

        $.ajax({
            url: "WebService1.asmx/addFeature",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({ feature: geoJsonObject }),
            method: "post",
            dataType: "json",
            success: function () { //data.d
                alert("Successfully added!");
            },
            error: function (req, textStatus, errorThrown) {
                alert('ERROR: ' + textStatus + ' ' + errorThrown);
            }
        });
    });
});

//Deletes feature
$(function () {
    $("#delete").click(function () {
        if (select !== null) {
            var allFeatures = select.getFeatures();
            var featToDel = allFeatures.item(0);
            var deleteId = featToDel.getId();
        }

        $.ajax({
            url: "WebService1.asmx/deleteFeature",
            data: { id: deleteId },
            method: "post",
            success: function () { //data.d
                vectorSource.removeFeature(featToDel);
                $("#select").trigger('click');
                alert("Successfully deleted!");
            },
            error: function (req, textStatus, errorThrown) {
                $("#select").trigger('click');
                alert('ERROR: ' + textStatus + ' ' + errorThrown);
            }
        });
    });
});

//Clears map
function clearMap() {
    if (!(confirm("Are you sure?"))) {
        return;
    }
    var featureList = vectorSource.getFeatures();

    $.ajax({
        url: "WebService1.asmx/clearMap",
        data: {},
        method: "post",
        success: function () {
            featureList.forEach(function (item) {
                vectorSource.removeFeature(item)
            });
            alert("Successfully cleared!");
            wmsLayerSource.refresh();
        },
        error: function (req, textStatus, errorThrown) {
            alert('ERROR: ' + textStatus + ' ' + errorThrown);
        }
    });
}

//loads map from geoJsonObject
function loadMap() {
    if (geoJsonObject != null) {
        var feature = geoFormat.readFeatures(geoJsonObject);
        vectorSource.addFeatures(feature);
    }
}

//saves map to geoJsonObject
function saveMap() {
    var features = vectorSource.getFeatures();
    geoJsonObject = geoFormat.writeFeatures(features);
}

