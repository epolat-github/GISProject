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

//Turkey Roads
const turkeyRoadSource = new ol.source.ImageWMS({    
    url: 'http://localhost:8090/geoserver/nyc/wms?service=WMS&version=1.1.0&request=GetMap&layers=nyc%3ATurkey_Roads&srs=EPSG%3A4326&format=image%2Fpng',
})
const turkeyRoadLayer = new ol.layer.Image({
    source: turkeyRoadSource,
    title: "Turkey Roads"
})

//Turkey Buildings
const turkeyBuildingSource = new ol.source.ImageWMS({
    url: 'http://localhost:8090/geoserver/nyc/wms?service=WMS&version=1.1.0&request=GetMap&layers=nyc%3ATurkey_Buildings&srs=EPSG%3A4326&format=image%2Fpng'
})
const turkeyBuildingLayer = new ol.layer.Image({
    source: turkeyBuildingSource,
    title: "Turkey Buildings"
})

//Turkey Points
const turkeyPointsSource = new ol.source.ImageWMS({
    url: 'http://localhost:8090/geoserver/nyc/wms?service=WMS&version=1.1.0&request=GetMap&layers=nyc%3ATurkey_Points&srs=EPSG%3A4326&format=image%2Fpng'
})
const turkeyPointsLayer = new ol.layer.Image({
    source: turkeyPointsSource,
    title: "Turkey Points"
})

//Turkey Places
const turkeyPlacesSource = new ol.source.ImageWMS({
    url: 'http://localhost:8090/geoserver/cite/wms?service=WMS&version=1.1.0&request=GetMap&layers=cite%3ATurkey_Places&srs=EPSG%3A4326&format=image%2Fpng'
})
const turkeyPlacesLayer = new ol.layer.Image({
    source: turkeyPlacesSource,
    title: "Turkey Places"
})

//Layer Groups
const turkeyGroup = new ol.layer.Group({
    fold: 'open',
    title: 'Turkey',
    layers: [turkeyRoadLayer, turkeyBuildingLayer, turkeyPointsLayer, turkeyPlacesLayer]
})

const featuresGroup = new ol.layer.Group({
    fold: 'open',
    title: "Features",
    layers: [wmsLayer, vectorLayer]
});

const rasterGroup = new ol.layer.Group({
    fold: 'open',
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
        center: [3658658.33, 4855126.83],
        zoom: 9
    })
});

//Layer Switcher
var layerSwitcher = new ol.control.LayerSwitcher({
    groupSelectStyle: "none",
    enableOpacitySliders: true
});
map.addControl(layerSwitcher);

//Snap feature
var snap = new ol.interaction.Snap({
    source: vectorSource
});

//Add popup
function addPopup(data) {
    var id = data.getId();
    if (id === undefined) {
        $('#propTable').html("Not yet uploaded to DB");
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
    console.log(data);
}

//Add additional info popup
$(function () {
    $("#infoBut").click(function () {
        $(".pop-outer").fadeIn("slow");
        var name;
        var type;
        var comment;
        var props = selectedFeature.getProperties();
        var id = props.gid;

        $.ajax({
            url: "WebService1.asmx/getAdditionalInfo",
            contentType: "application/json; charset=utf-8",
            method: 'post',
            data: JSON.stringify({ id: id }),
            success: function (data) {
                var infos = JSON.parse(data.d);
                if (infos.length !== 0) {
                    name = infos[0];
                    type = infos[1];
                    comment = infos[2];
                }
                else {
                    name = "Not entered before";
                    type = "Not entered before";
                    comment = "Not entered before";
                }

                $("#id").html(id);
                $("#name").html(name);
                $("#type").html(type);
                $("#comment").html(comment);
            },
            error: function (req, textStatus, errorThrown) {
                console.log("Error" + textStatus + errorThrown + "\n info not found");
            }
        })
    });
    $(".close").click(function () { //close popup
        $(".pop-outer").fadeOut("fast");
        $("#resetInput").hide();
        $("#submit").hide();
        $("#edit").show();

        setTimeout(function () {
            $("#name").html("Not entered before").attr("contenteditable", "false");
            $("#type").html("Not entered before").attr("contenteditable", "false");
            $("#comment").html("Not entered before").attr("contenteditable", "false");
        }, 500);
    });
})

//Edit additional info
$(function () {
    $("#edit").click(function () {
        $("#name").attr("contenteditable", "true");
        $("#type").attr("contenteditable", "true");
        $("#comment").attr("contenteditable", "true");

        $("#edit").hide();

        $("#resetInput").show().click(function () {
            if (!(confirm("Infos will be deleted!"))) {
                return;
            }
            $("#name").html("Not entered before").attr("contenteditable", "false");
            $("#type").html("Not entered before").attr("contenteditable", "false");
            $("#comment").html("Not entered before").attr("contenteditable", "false");

            var id = selectedFeature.getProperties().gid;
            $.ajax({
                url: "WebService1.asmx/deleteAdditionalInfo",
                method: 'post',
                data: { id: id },
                error: function (req, textStatus, errorThrown) {
                    console.log("Error" + textStatus + errorThrown + "\n info not found");
                }
            })

            $("#resetInput").hide();
            $("#edit").show();

        });

        $("#submit").show().click(function () {
            var newId = $("#id").html();
            var newName = $("#name").html();
            var newType = $("#type").html();
            var newComment = $("#comment").html();

            if (newName === "" && newType === "" && newComment === "") {
                alert("Check the inputs!");
                return;
            }

            $.ajax({
                url: "WebService1.asmx/addAdditionalInfo",
                method: "post",
                data: {
                    "id": newId,
                    "name": newName,
                    "type": newType,
                    "comment": newComment
                },
                success: function () {
                    $("#name").attr("contenteditable", "false");
                    $("#type").attr("contenteditable", "false");
                    $("#comment").attr("contenteditable", "false");
                },
                error: function (textStatus, errorThrown) {
                    console.log("Error: " + textStatus + " " + errorThrown);
                }
            })
        });
    })
})

//Getting info of selected feature from GeoServer
map.on('click', function (evt) {
    if (drawSitu === true || modSituation === true) {
        return;
    }
    overlay.setPosition(undefined);

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
                        if (data.features.length === 0) {
                            return;
                        }
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

//defines drawings
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
    measureFeatures();
}

combo.addEventListener("click", changeDrawType);

function changeDrawType() {

    var selectedType = combo.value;

    map.removeInteraction(currentInter);

    if (selectedType !== "None") {
        addInter(selectedType);
    }
}

//Add measure feature
var calcLength = function (line) {
    var length = ol.sphere.getLength(line);
    var output;
    if (length > 100) {
        output = (Math.round(length / 1000 * 100) / 100) +
            ' ' + 'km';
    } else {
        output = (Math.round(length * 100) / 100) +
            ' ' + 'm';
    }
    return output;
};

var calcArea = function (polygon) {
    var area = ol.sphere.getArea(polygon);
    var output;
    if (area > 10000) {
        output = (Math.round(area / 1000000 * 100) / 100) + ' km<sup>2</sup>';
    } else {
        output = (Math.round(area * 100) / 100) + ' m<sup>2</sup>';
    }
    return output;
};

function measureFeatures() {
    currentInter.on('drawstart', function (evt) {
        evt.feature.getGeometry().on('change', function (evt) {
            var geom = evt.target;
            if (geom instanceof ol.geom.Polygon) {
                var result = calcArea(geom);
                $("#measureSpan").html(result);
            }
            else if (geom instanceof ol.geom.LineString) {
                var result = calcLength(geom);
                $("#measureSpan").html(result);
            }
        })
    })
}

$("#measure").click(function () {
    if ($(this).prop("checked") == true) {
        $("#measureSpan").removeAttr("hidden");
    }
    else {
        $("#measureSpan").attr("hidden", "true").html("");
    }
})

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
            console.log('Update Feature Error: ' + textStatus + ' ' + errorThrown);
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
        overlay.setPosition(undefined);
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

