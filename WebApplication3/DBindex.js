﻿var geoJsonObject = {};
var modifyButton = document.getElementById("modify");
var snapButton = document.getElementById("snap");
var combo = document.getElementById("drawTypes"); //combo box
var currentInter; //interaction holder
var lastId = 0;
var geoFormat = new ol.format.GeoJSON;



const rasterSource = new ol.source.OSM();
const rasterLayer = new ol.layer.Tile({
    source: rasterSource
})

const vectorSource = new ol.source.Vector({
    wrapX: false,
    loader: function () {   //add features to vectorLayer at startup
        $(function () {
            $.ajax({
                url: "WebService1.asmx/startMap",
                contentType: "application/json; charset=utf-8",
                data: {},
                method: "post",
                dataType: "json",
                success: function (data) { //data.d
                    var i;
                    var tempFeature;
                    var featuresArray = data.d;
                    for (i = 0; i < featuresArray.length; i++) {
                        var feature = new ol.Feature();
                        tempFeature = featuresArray[i];
                        var tempGeo = JSON.parse(tempFeature.geometry);
                        var geo = geoFormat.readGeometry(tempGeo);
                        var id = tempFeature.id;
                        lastId = (id > lastId) ? id : lastId;
                        feature.setId(id);
                        feature.setGeometry(geo);
                        vectorSource.addFeature(feature);
                    }
                },
                error: function (req, textStatus, errorThrown) {
                    alert('ERROR AT STARTUP: ' + textStatus + ' ' + errorThrown);
                }
            });
        });
    }
});
const vectorLayer = new ol.layer.Vector({
    source: vectorSource,
    
});

const map = new ol.Map({
    layers: [rasterLayer, vectorLayer],
    target: 'map',
    view: new ol.View({
        center: [0, 0],
        zoom: 2
    })
});

//selection
var select = new ol.interaction.Select({
    toggleCondition: ol.events.condition.never //disables shift multi select
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

//add Snap feature
//snapButton.disabled = true; //snap feature DISABLED

var snap = new ol.interaction.Snap({
    source: vectorSource
});
var snapSituation = false; //false, not snapping; true, snapping
function Snap() {
    if (snapSituation) {
        map.removeInteraction(snap); // disables snap
        snapSituation = false;
        snapButton.style.backgroundColor = "#ea9595";
        snapButton.style.borderColor = "#c71d1d";
    }
    else {
        map.addInteraction(snap);
        snapSituation = true;
        snapButton.style.backgroundColor = "#5ebe82";
        snapButton.style.borderColor = "#00ff21";
    }
}

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

//Updates map
$(function () {
    $("#update").click(function () {
        if (select !== null) {
            var allFeatures = select.getFeatures();
            geoJsonObject = geoFormat.writeFeature(allFeatures.item(0));
        }

        $.ajax({
            url: "WebService1.asmx/updateDatabase",
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({ feature: geoJsonObject }),
            method: "post",
            dataType: "json",
            success: function () { //data.d
                alert("Successfully updated!");
            },
            error: function (req, textStatus, errorThrown) {
                alert('ERROR: ' + textStatus + ' ' + errorThrown);
            }
        });
    });
});

//Adds feature
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

//Clears map //NOT WORKING
function clearMap() {
    var featureList = vectorSource.getFeatures();

    $.ajax({
        url: "WebService1.asmx/truncateTable",
        data: {},
        method: "post",
        success: function () {
            featureList.forEach(function (item) {
                vectorSource.removeFeature(item)
            });
            alert("Successfully cleared!");
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

