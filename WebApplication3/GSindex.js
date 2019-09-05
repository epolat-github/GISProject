var geoJsonObject = {};
var modifyButton = document.getElementById("modify");
var snapButton = document.getElementById("snap");
var combo = document.getElementById("drawTypes"); //combo box
var currentInter; //interaction holder
var lastId = 0;
var geoFormat = new ol.format.GeoJSON;


//OSM Raster layer
const rasterSource = new ol.source.OSM();
const rasterLayer = new ol.layer.Tile({
    type: "base",
    source: rasterSource,
    title: "OSM Raster"
});

//XYZ Raster layer
const xyzSource = new ol.source.XYZ({
    url: 'https://{a-c}.tile.thunderforest.com/cycle/{z}/{x}/{y}.png' +
        '?apikey=6794f5053b024ec3afebc80a67f5c5f9'
});
const xyzLayer = new ol.layer.Tile({
    source: xyzSource,
    type: "base",
    title: "XYZ Raster"
});

//Bing Raster Layer
const bingSource = new ol.source.BingMaps({
    key: 'Aggs4w9zy4myZUovZQJAK2O7z5wQOZDi2rQaPgHbUHTBVdgv69zrnpMjxNYUMTOU',
    imagerySet: 'RoadOnDemand'
});
const bingLayer = new ol.layer.Tile({
    source: bingSource,
    type: "base",
    title: "Bing Raster"
});

//Stamen Raster layer
const stamenSource = new ol.source.Stamen({
    layer: "watercolor"
});
const stamenLayer = new ol.layer.Tile({
    source: stamenSource,
    type: "base",
    title: "Stamen Raster"
});

//ImageWMS Layer
const wmsLayerSource = new ol.source.ImageWMS({
    url: 'http://localhost:8090/geoserver/wms?Format=image/png&request=GetMap&layers=nyc:FEATURES&srs=EPSG:3857'
});
const wmsLayer = new ol.layer.Image({
    source: wmsLayerSource,
    title: "WMS Features"
});

//Features as vector layer
const vectorSource = new ol.source.Vector();
const vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    title: "Drawings"
});

//Layer Groups
const featuresGroup = new ol.layer.Group({
    fold: 'open',
    title: "Features",
    layers: [wmsLayer, vectorLayer]
});

const rasterGroup = new ol.layer.Group({
    fold: 'open',
    //type: 'base',
    title: "Rasters",
    layers: [bingLayer, xyzLayer, stamenLayer, rasterLayer]
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
    layers: [rasterGroup, featuresGroup],
    target: 'map',
    overlays: [overlay],
    view: new ol.View({
        center: [9149941.76628828, 5093518.010970779],
        zoom: 3
    })
});

//Layer Switcher
var layerSwitcher = new ol.control.LayerSwitcher({
    groupSelectStyle: "none",
    enableOpacitySliders: true
});
map.addControl(layerSwitcher);

//Layer Opacity Slider
//var slider = document.getElementById("opacitySlider");
//slider.oninput = function () {
//    rasterGroup.setOpacity(this.value / 100);
//}

//Add popup
function addPopup(data) {
    var id = data.getId();
    if (id === undefined) {
        $('#propTable').html("Not yet uploaded to DB");
        //var coordinateArray = data.getGeometry().extent_;
        var type = data.getGeometry().getType();
    }
    else {
        id = data.values_.gid;
        var name = data.getId();
        var type = data.getGeometry().getType();
        var coordinateArray = data.getGeometry().extent_;
        var coorText = ol.coordinate.toStringHDMS(ol.proj.toLonLat(coordinateArray));
        var innerHtml = "<table>" + coorText + "</table><tr><th>ID</th><td>" + id + "</td></tr><tr>" +
            "<th>Name</th><td>" + name + "</td></tr><tr><th>Type</th>" +
            "<td>" + type + "</td></tr><tr><th>Coords</th>" +
            "<td></td></tr>";
        $("#propTable").html(innerHtml);
    }

    //sets overlay position
    switch (type) {
        case ("Point"):
            overlay.setPosition(data.getGeometry().getCoordinates());
            break;
        case ("LineString"):
            overlay.setPosition(data.getGeometry().getCoordinates()[0]);
            break;
        case ("Polygon"):
            overlay.setPosition(data.getGeometry().getCoordinates()[0][0]);
            break;
        default:
            console.log("Unknown style!");
    }

    //overlay.setPosition(coordinateArray[0][0], coordinateArray[0][1]);
    //alert("Successfully selected!");
    console.log(data);
}

//Getting info of selected feature from GeoServer
map.on('click', function (evt) {
    //var url = wmsLayerSource.getGetFeatureInfoUrl(
    //    evt.coordinate, map.getView().getResolution(),
    //    map.getView().getProjection());
    //if (url !== undefined) {
    //    console.log("clicked");
    //}
    if (drawSitu === true || modSituation === true) {
        return;
    }
    overlay.setPosition(undefined);

    //vectorSource.forEachFeature(function (e) { //clears the vector source
    //    vectorSource.removeFeature(e)
    //});

    map.forEachLayerAtPixel(evt.pixel, function (layer) {
        if (layer.getType() === "IMAGE") {      //if clicked to wmsLayer(to a feature)
            var url = wmsLayerSource.getGetFeatureInfoUrl(
                evt.coordinate, map.getView().getResolution(),
                map.getView().getProjection(), {
                    'INFO_FORMAT': 'application/json',
                    'QUERY_LAYERS': 'nyc:FEATURES'
                });

            if (url !== undefined) {
                $.ajax({
                    url: url,
                    method: 'post',
                    success: function (data) {
                        var featureObj = geoFormat.readFeature(data.features[0]);
                        vectorSource.addFeature(featureObj);
                        selectedFeature = featureObj;
                        addPopup(featureObj);
                    },
                    error: function (req, textStatus, errorThrown) {
                        console.log("Error" + textStatus + errorThrown);
                    }
                })
            }
        }
    })

});

//select.on("select", function (e) {
//    if (e.selected.length === 0) {
//        overlay.setPosition(undefined);
//        return;
//    }
//    var selected = e.selected;
//    vectorSource.getFeatures().forEach(function (t) {
//        if (selected[0] === t) {
//            addPopup(t);
//        }
//    });
//});
//select.on("select", function (e) {
//    if (e.selected.length === 0) {      //popup removing
//        overlay.setPosition(undefined);
//        return;
//    }
//    var selected = e.selected;
//    var props = selected[0].getProperties(); //properties object
//    var geomObj = props.geometry;            //geometry object
//    var extentArray = geomObj.getExtent();   //extend array
//    var extentString = extentArray.join();
//    $.ajax({
//        url: 'http://localhost:8090/geoserver/nyc/wms?' +
//            '&INFO_FORMAT=application/json' +
//            '&REQUEST=GetFeatureInfo' +
//            '&SRS=EPSG: 3857' +
//            '&SERVICE=WMS' +
//            '&VERSION=1.1.0' +
//            '&WIDTH=966&HEIGHT=482&X=486&Y=165' +
//            '&QUERY_LAYERS=nyc:FEATURES' +
//            '&LAYERS=nyc:FEATURES' +
//            '&BBOX=' + extentString,
//        method: "post",
//        success: function (data) {
//            addPopup(data);         //popup feature
//        },
//        error: function (req, textStatus, errorThrown) {
//            alert('ERROR: ' + textStatus + ' ' + errorThrown);
//        }
//    });
//});

//var selectSitu = true;
//$(function () {
//    $("#select").click(function () {
//        if (selectSitu) {
//            map.removeInteraction(select);
//            map.addInteraction(currentInter);
//            $("#select").toggleClass("buttonEnabled"); //for CSS
//            selectSitu = false;

//            vectorSource.forEachFeature(function (e) { //clears the vector source
//                vectorSource.removeFeature(e);
//            });
//        }
//        else {
//            selectSitu = true;
//            $("#select").toggleClass("buttonEnabled"); //for CSS
//            map.removeInteraction(currentInter);
//            map.addInteraction(select);
//        }
//    });
//});

//defines drawings

//addInter("Point");
var drawSitu = false;

$("#draw").click(function () {
    if (!drawSitu) {
        combo.disabled = false;
        $("#draw").toggleClass("buttonEnabled");
        changeDrawType();
    }
    else {
        combo.disabled = true;
        $("#draw").toggleClass("buttonEnabled");
        map.removeInteraction(currentInter);
    }
    drawSitu = !drawSitu;
})

function addInter(type) {
    currentInter = new ol.interaction.Draw({
        type: type,
        source: vectorSource
    });
    map.addInteraction(currentInter);
}

combo.addEventListener("click", changeDrawType);

function changeDrawType() {
    
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

$("#modify").click(function () {
    if (!modSituation) {
        map.removeInteraction(currentInter);
        modSituation = true;
        map.addInteraction(modify); 
        map.removeOverlay(overlay);
    }
    else {
        map.removeInteraction(modify);
        modSituation = false;
        map.addOverlay(overlay);
        
    }
    $("#modify").toggleClass("buttonEnabled");
})

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
                if (modSituation) {
                    $("#modify").trigger("click");
                }
            }
        }
        vectorSource.forEachFeature(function (e) { //clears the vector source
            vectorSource.removeFeature(e)
        });
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
            wmsLayerSource.refresh();
            wmsLayerSource.updateParams({ "time": Date.now() });
            console.log("Successfully updated!");
        },
        error: function (req, textStatus, errorThrown) {
            //alert('Update Feature Error: ' + textStatus + ' ' + errorThrown);
        }
    });
};

//Add feature
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
            wmsLayerSource.updateParams({ "time": Date.now() });
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

//Deletes specific feature
var selectedFeature;
$("#delBut").click(function () {
    if (selectedFeature !== null) {

        var id = selectedFeature.getProperties().gid;

        $.ajax({
            url: "WebService1.asmx/deleteFeature",
            data: { id: id },
            method: "post",
            success: function () {
                vectorSource.removeFeature(selectedFeature);
                wmsLayerSource.refresh();
                wmsLayerSource.updateParams({ "time": Date.now() });
                overlay.setPosition(undefined);
                alert("Successfully deleted!");
            },
            error: function (req, textStatus, errorThrown) {
                select.getFeatures().clear();
                alert('Deletion Error: ' + textStatus + ' ' + errorThrown);
            }
        });
    }
});


//Deletes specific feature
//$(function () {
//    $("#delete").click(function () {
//        if (select.getFeatures().values_.length != 0) {
//            var allFeatures = select.getFeatures();
//            var featToDel = allFeatures.item(0);
//            var deleteId = featToDel.getId();   //string id
//            if (deleteId == undefined) {        //deletion before sync (no id appointed yet)
//                vectorSource.removeFeature(featToDel);
//                select.getFeatures().clear();
//                alert("Deleted");
//                return;
//            }
//            deleteId = parseInt(deleteId.substring(9)); //int id
//        }
//        else {
//            alert("No feature selected!");
//            return;
//        }

//        $.ajax({
//            url: "WebService1.asmx/deleteFeature",
//            data: { id: deleteId },
//            method: "post",
//            success: function () { //data.d
//                vectorSource.removeFeature(featToDel);
//                $("#select").trigger('click');
//                wmsLayerSource.refresh();
//                select.getFeatures().clear();
//                overlay.setPosition(undefined);
//                alert("Successfully deleted!");
//            },
//            error: function (req, textStatus, errorThrown) {
//                $("#select").trigger('click');
//                select.getFeatures().clear();
//                alert('Deletion Error: ' + textStatus + ' ' + errorThrown);
//            }
//        });
//    });
//});

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
            wmsLayerSource.updateParams({ "time": Date.now() });
        },
        error: function (req, textStatus, errorThrown) {
            alert('ERROR: ' + textStatus + ' ' + errorThrown);
        }
    });
}

//Deselect selected features
$("#deselect").click(function () {
    vectorSource.forEachFeature(function (e) { //clears the vector source
        vectorSource.removeFeature(e)
    });
})

//Clears Vector Layer (drawings)
$("#clearFeat").click(function () {
    vectorSource.clear();
})

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

