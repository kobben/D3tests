/**
 * TRACKING GEOGRAPHY & TIME
 D3.js Javascript web-app to generate interactive web pages from multiple tracks
 © Barend Köbben, ITC-University of Twente
 Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 License.
 see http://creativecommons.org/licenses/by-nc-sa/3.0/
 @author Barend Kobben <b.j.kobben@utwente.nl>

 **** IMPROVISED version for multiple tracks ****
 @version 0.1.0 [April 2014]
 */




// *******************
// prepare map panel:
// *******************
//Width and height
var mapWidth = 500;
var mapHeight = 538;
//Define map projection
var projection = d3.geo.mercator()
  .rotate([0,0]) //lon,lat]
  .center([mapCenterLon,mapCenterLat]) //[lon,lat]
  .translate([mapWidth/2, mapHeight/2])
  .precision(0.1)
  .scale([mapScale]);
//Define path generator
var path = d3.geo.path()
  .projection(projection);

//Create SVG element for Map paneL:
var svg = d3.select("body")
    .append("svg")
    .attr("id", "svgMaps")
    .attr("width", mapWidth)
    .attr("height", mapHeight)
  ;
svg.append("image")
  .attr("xlink:href", "./data/basemap_light.png")
  .attr("x", -12)
  .attr("y", 13)
  .attr("width", mapWidth + 50)
  .attr("height", mapHeight + 50)
;
svg.append("text")
  .attr("x", 5)
  .attr("y", 20)
  .attr("class", "panelTitle")
  .text("GEOGRAPHY")
  ;

var svgMap = svg
    .append("g")
    .attr("id", "mapSVG")
  ;
var svgMap_2 = svg
    .append("g")
    .attr("id", "mapSVG_2")
  ;

// *******************
// prepareTime-distance panels:
// *******************
var distScale, parseDate, timeScale
var SVGscaleWidth = 650, SVGscaleHeight = 170;
var xMargin = 10, yT = 125, yD = 70;
var scaleLength=600;
var track, lines;
var rectHeight = 6; //for rects in scales
//parses string to Date object
function parseMyDate(DateStr) {
  return dateFormat.parse(DateStr);
}
var earliestTime = parseMyDate(earliestTimeStr);
var latestTime = parseMyDate(latestTimeStr);


//vars domain for the scales
var timeScale = d3.time.scale()
  .domain([earliestTime, latestTime])
  .range([0, scaleLength]);
var distScale = d3.scale.linear()
  .domain([smallestDist, largestDist])
  .range([0, scaleLength]);
var distanceRatio = largestDist_2 / largestDist;
var distScale2 = d3.scale.linear()
  .domain([smallestDist, largestDist_2])
  .range([0, scaleLength * distanceRatio]);

//create SVG placeholders for scale panels:
//var svgNormal = d3.select("body").append("svg")
//    .attr("id", "svgNormal")
//    .attr("width", SVGscaleWidth)
//    .attr("height", SVGscaleHeight)
//  ;

var svgTime2Geo = d3.select("body").append("svg")
    .attr("id", "svgTime2Geo")
    .attr("width", SVGscaleWidth)
    .attr("height", SVGscaleHeight)
  ;

var svgGeo2Time = d3.select("body").append("svg")
    .attr("id", "svgGeo2Time")
    .attr("width", SVGscaleWidth)
    .attr("height", SVGscaleHeight)
  ;
//// gradient def for colour gradients:
//var gradient1 = svgNormal.append("defs")
//    .append("linearGradient")
//    .attr("id", "gradient1")
//    .attr("x1", "0%")
//    .attr("y1", "100%")
//    .attr("x2", "0%")
//    .attr("y2", "0%")
//  ;
//gradient1.append("stop")
//  .attr("offset","0%")
//  .attr("style", "stop-color:rgb(255,0,0);stop-opacity:.3")
//;
//gradient1.append("stop")
//  .attr("offset","100%")
//  .attr("style", "stop-color:rgb(0,0,255);stop-opacity:.3")
//;

// *******************
// prepare panels:
// *******************
//Overall title

//svgNormal.append("text")
//  .attr("x", 5)
//  .attr("y", 20)
//  .attr("class", "panelTitle")
//  .text("COMMON REPRESENTATION (both scales fixed)")
//;

svgTime2Geo.append("text")
  .attr("x", 5)
  .attr("y", 20)
  .attr("class", "panelTitle")
  .text("FROM TIME TO GEOGRAPHY")
;
svgGeo2Time.append("text")
  .attr("x", 5)
  .attr("y", 20)
  .attr("class", "panelTitle")
  .text("FROM GEOGRAPHY TO TIME")
;

//DISTANCE

//create generalized axis for MJ...
var distAxis = d3.svg.axis()
  .scale(distScale)
  .orient("top")
  .ticks(distLabelledTicksValue)
  .tickSize(10, 0);
;
//create generalized axis for LZ...
var distAxis_2= d3.svg.axis()
  .scale(distScale2)
  .orient("top")
  .ticks(distLabelledTicksValue)
  .tickSize(10, 0);
;
//...and draw axes with labels
//svgNormal.append("g")
//  .attr("class", "axis")
//  .attr("transform", "translate(" + xMargin + "," + yD +")" )
//  .call(distAxis)
//;
//create detailed axis for MJ...
var distAxis2 = d3.svg.axis()
  .scale(distScale)
  .orient("top")
  .ticks(distUnLabelledTicksValue)
  .tickSize(6, 0);
;
//create detailed axis for LZ...
var distAxis2_2 = d3.svg.axis()
  .scale(distScale2)
  .orient("top")
  .ticks(distUnLabelledTicksValue)
  .tickSize(6, 0);
;
//...and draw without labels
//svgNormal.append("g")
//  .attr("class", "axisNoLabels")
//  .attr("transform", "translate(" + xMargin + "," + yD +")" )
//  .call(distAxis2)
//;
//append top line for
//svgNormal.append("line")
//  .attr("class","axis")
//  .attr("x1",xMargin)
//  .attr("y1",yD - 6)
//  .attr("x2",xMargin + scaleLength)
//  .attr("y2",yD - 6)
//;
//svgNormal.append("text")
//  .attr("x", xMargin)
//  .attr("y", yD-22)
//  .attr("fill", "grey")
//  .attr("font-size", 10)
//  .text("DISTANCE")
//;
//repeat the drawing for Time2Geo panel:
//svgTime2Geo.append("text")
//  .attr("x", xMargin)
//  .attr("y", yD-22)
//  .attr("fill", "grey")
//  .attr("font-size", 10)
//  .text("DISTANCE")
//;

//repeat the drawing for Geo2Time panel:

// for runner MJ
svgGeo2Time.append("g")
  .attr("class", "axis")
  .attr("transform", "translate(" + xMargin + "," + yT +")" )
  .call(distAxis)
;
svgGeo2Time.append("g")
  .attr("class", "axisNoLabels")
  .attr("transform", "translate(" + xMargin + "," + yT +")" )
  .call(distAxis2)
;
svgGeo2Time.append("line")
  .attr("class","axis")
  .attr("x1",xMargin)
  .attr("y1",yT - 6)
  .attr("x2",xMargin + scaleLength)
  .attr("y2",yT - 6)
;
svgGeo2Time.append("text")
  .attr("x", xMargin)
  .attr("y", yT-22)
  .attr("fill", "grey")
  .attr("font-size", 10)
  .text("DISTANCE FOR MJ")
;
// for runner LZ
svgGeo2Time.append("g")
  .attr("class", "axis")
  .attr("transform", "translate(" + xMargin + "," + yD +")" )
  .call(distAxis_2)
;
svgGeo2Time.append("g")
  .attr("class", "axisNoLabels")
  .attr("transform", "translate(" + xMargin + "," + yD +")" )
  .call(distAxis2_2)
;
svgGeo2Time.append("line")
  .attr("class","axis")
  .attr("x1",xMargin)
  .attr("y1",yD - 6)
  .attr("x2",xMargin + (scaleLength * distanceRatio))
  .attr("y2",yD - 6)
;
svgGeo2Time.append("text")
  .attr("x", xMargin)
  .attr("y", yD-22)
  .attr("fill", "grey")
  .attr("font-size", 10)
  .text("DISTANCE for LZ")
;

//TIME
//create generalized axis...
var timeAxis = d3.svg.axis()
    .scale(timeScale)
    .orient("bottom")
    .ticks(timeLabelledTicksUnit, timeLabelledTicksValue)
    .tickSize(10, 0)
  ;
//...and draw axes with labels
//svgNormal.append("g")
//  .attr("class", "axis")
//  .attr("transform", "translate(" + xMargin + "," + yT +")" )
//  .call(timeAxis)
//;
//create detailed axis...
var timeAxis2 = d3.svg.axis()
    .scale(timeScale)
    .orient("bottom")
    .ticks(timeUnLabelledTicksUnit, timeUnLabelledTicksValue)
    .tickSize(6, 0)
  ;
//...and draw axes without labels
//svgNormal.append("g")
//  .attr("class", "axisNoLabels")
//  .attr("transform", "translate(" + xMargin + "," + yT +")" )
//  .call(timeAxis2)
//;
//svgNormal.append("line")
//  .attr("class","axis")
//  .attr("x1",xMargin)
//  .attr("y1",yT + 6)
//  .attr("x2",xMargin + scaleLength)
//  .attr("y2",yT + 6)
//;
//svgNormal.append("text")
//  .attr("x", xMargin)
//  .attr("y", yT+30)
//  .attr("fill", "grey")
//  .attr("font-size", 10)
//  .text("TIME")
//;
// and repeat all this drawing for Time2Geo panel:
svgTime2Geo.append("g")
  .attr("class", "axis")
  .attr("transform", "translate(" + xMargin + "," + yT +")" )
  .call(timeAxis)
;
svgTime2Geo.append("g")
  .attr("class", "axisNoLabels")
  .attr("transform", "translate(" + xMargin + "," + yT +")" )
  .call(timeAxis2)
;
svgTime2Geo.append("line") //for time axis
  .attr("class","axis")
  .attr("x1",xMargin)
  .attr("y1",yT + 6)
  .attr("x2",xMargin + scaleLength)
  .attr("y2",yT + 6)
;
svgTime2Geo.append("text")
  .attr("x", xMargin)
  .attr("y", yT+30)
  .attr("fill", "grey")
  .attr("font-size", 10)
  .text("TIME for both")
;
svgTime2Geo.append("text")
  .attr("x", xMargin)
  .attr("y", yT-25)
  .attr("fill", "grey")
  .attr("font-size", 10)
  .text("MJ")
;
svgTime2Geo.append("text")
  .attr("x", xMargin)
  .attr("y", yT-45)
  .attr("fill", "grey")
  .attr("font-size", 10)
  .text("LZ")
;
//// and again for Geo2Time panel:
//svgGeo2Time.append("line")
//  .attr("class","axis")
//  .attr("x1",xMargin)
//  .attr("y1",yT + 6)
//  .attr("x2",xMargin + scaleLength)
//  .attr("y2",yT + 6)
//;
//svgGeo2Time.append("text")
//  .attr("x", xMargin)
//  .attr("y", yT+30)
//  .attr("fill", "grey")
//  .attr("font-size", 10)
//  .text("TIME")
//;

// create infoPanel:
infoDiv = d3.select("body").append("div")
  .attr("id", "infoDiv")
  .text("...")
;

// **********************
// Load in points data and start visualisations
// **********************
d3.json(dataFile_1, function(error, points) {
  if (error !=null) console.log(error);
  var allPoints = points.features;
  var theStops = points.features.filter(function(d){ return (d.properties.stop == 1 || d.properties.stop == -1); });
  d3.json(dataFile_2, function(error, points2) {
    if (error !=null) console.log(error);
    var allPoints2 = points2.features;
    var theStops2 = points2.features.filter(function(d){ return (d.properties.stop == 1 || d.properties.stop == -1); });
    drawMap(allPoints);
    drawMap_2(allPoints2)
    drawTime2GeoPanel(theStops,theStops2);
    drawGeo2TimePanel(theStops,theStops2);

  });	//end of function loading data2
});	//end of function loading data



var TMP;

// **********************
// Map Panels:
// **********************
function drawMap(data) {
  //draw connectors first
  svgMap.selectAll("line")
    .data(data)
    .enter()
    .append("line")
    .filter(function(d,i) {return (i+1) < data.length}) //no connector for last point!
    .attr("class", "connectors1")
    .attr("x1", function (d) {return projection(d.geometry.coordinates)[0]})
    .attr("y1", function (d) {return projection(d.geometry.coordinates)[1]})
    .attr("x2", function (d,i) {return projection(data[(i+1)].geometry.coordinates)[0]})
    .attr("y2", function (d,i) {return projection(data[(i+1)].geometry.coordinates)[1]})
  ;
  //then draw circles
  svgMap.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("id", function (d) {return "m_d_" + d.properties.id})
    .attr("cx", function (d) {return projection(d.geometry.coordinates)[0];})
    .attr("cy", function (d) {return projection(d.geometry.coordinates)[1];})
    .attr("r", function (d) {
      if (d.properties.stop == 1) {
        return 4;
      } else {
        return 1.5;
      }
    })
    .attr("class", function (d) {
      if (d.properties.stop == 1) {
        return "distancecircle";
      } else {
        return "nostop1";
      }
    })
    .on("mouseover", function (d) {
      if (d.properties.stop == 1) {selectMe(this, d);}
    })
    .on("mouseout", function (d) {
      if (d.properties.stop == 1) {unselectMe(this)}
    })
  ;
} //end drawMap

function drawMap_2(data) {
  //draw connectors first
  svgMap_2.selectAll("line")
    .data(data)
    .enter()
    .append("line")
    .filter(function(d,i) {return (i+1) < data.length}) //no connector for last point!
    .attr("class", "connectors2")
    .attr("x1", function (d) {return projection(d.geometry.coordinates)[0]})
    .attr("y1", function (d) {return projection(d.geometry.coordinates)[1]})
    .attr("x2", function (d,i) {return projection(data[(i+1)].geometry.coordinates)[0]})
    .attr("y2", function (d,i) {return projection(data[(i+1)].geometry.coordinates)[1]})
  ;
  //then draw circles
  svgMap_2.selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("id", function (d) {return "m_d2_" + d.properties.id})
    .attr("cx", function (d) {return projection(d.geometry.coordinates)[0];})
    .attr("cy", function (d) {return projection(d.geometry.coordinates)[1];})
    .attr("r", function (d) {
      if (d.properties.stop == 1) {
        return 4;
      } else {
        return 1.5;
      }
    })
    .attr("class", function (d) {
      if (d.properties.stop == 1) {
        return "timecircle";
      } else {
        return "nostop2";
      }
    })
    .on("mouseover", function (d) {
      if (d.properties.stop == 1) {selectMe_2(this, d);}
    })
    .on("mouseout", function (d) {
      if (d.properties.stop == 1) {unselectMe_2(this)}
    })
  ;
} //end drawMap_2

// **********************
// Normal Panel:
// **********************
function drawNormalPanel(data) {

//create connectors
  svgNormal.selectAll(".connectors")
//            .data(data)
    .data(data.filter(function(d){ return d.properties.stop == 1; })) //filter out non-stops
    .enter()
    .append("path")
    .attr("class", "connectors")
//            .attr("fill", "url(#gradient1")
    .attr("d", function(d) {
      var startX = xMargin + 0, endX = xMargin + scaleLength;
      if (d.properties.arrival != null) {
        startX = xMargin+(timeScale(parseMyDate(d.properties.arrival)))
      }
      if (d.properties.departure != null) {
        endX = xMargin+(timeScale(parseMyDate(d.properties.departure)))
      }
      var dStr = "M" + (startX) + " " + yT;
      dStr += " L" + (xMargin+(distScale(d.properties.distance))) + " " + yD;
      dStr += " L" + (endX) + " " + yT;
      return dStr;
    })
  ;
  //create distance circles
  svgNormal.selectAll(".distancecircle")
//        .data(data)
    .data(data.filter(function(d){ return d.properties.stop == 1; })) //filter out non-stops
    .enter()
    .append("circle")
    .attr("id", function (d) {return "nor_d_" + d.properties.id})
    .attr("class", "distancecircle")
    .attr("cx", function(d) {return xMargin+(distScale(d.properties.distance))})
    .attr("cy", yD)
    .attr("r", 3)
    .on("mouseover", function (d) {selectMe(this, d); })
    .on("mouseout", function (d) {unselectMe(this); })
  ;

//create time rects
  svgNormal.selectAll(".timecircle")
    .data(data)
//            .data(data.filter(function(d){ return d.properties.stop == 1; })) //filter out non-stops
    .enter()
    .append("rect")
    .attr("id", function (d) {return "nor_t_" + d.properties.id})
    .attr("class", "timecircle")
    .attr("x", function(d) {
      var startX = xMargin + 0;
      if (d.properties.arrival != null) {
        startX = xMargin+(timeScale(parseMyDate(d.properties.arrival)))
      }
      return startX;
    })
    .attr("y", yT - 3)
    .attr("height", rectHeight)
    .attr("width", function(d) {
      var startX, endX, w;
      if (d.properties.departure != null) {
        endX = xMargin+(timeScale(parseMyDate(d.properties.departure)))
      }
      if (d.properties.arrival != null) {
        startX = xMargin+(timeScale(parseMyDate(d.properties.arrival)))
      }
      w = endX - startX;
      if (w==0) {return 1} else {return w};
    })
    .on("mouseover", function (d) {selectMe(this, d); })
    .on("mouseout", function (d) {unselectMe(this); })
  ;
}// end of drawNormalPanel



// **********************
// Time To Geography Panel:
// **********************
function drawTime2GeoPanel(data,data2) {

//create connectors
//  svgTime2Geo.selectAll(".connectors")
////            .data(data)
//    .data(data.filter(function(d){ return d.properties.stop == 1; })) //filter out non-stops
//    .enter()
//    .append("rect")
//    .attr("class", "connectors")
//    .attr("x", function(d) {
//      var startX = xMargin + 0;
//      if (d.properties.arrival != null) {
//        startX = xMargin+(timeScale(parseMyDate(d.properties.arrival)))
//      }
//      return startX;
//    })
//    .attr("y", yD )
//    .attr("height", yT - yD + 3)
//    .attr("width", function(d) {
//      var startX = xMargin + 0, endX = xMargin + scaleLength;
//      if (d.properties.departure != null) {
//        endX = xMargin+(timeScale(parseMyDate(d.properties.departure)))
//      }
//      if (d.properties.arrival != null) {
//        startX = xMargin+(timeScale(parseMyDate(d.properties.arrival)))
//      }
//      return endX - startX;
//    })
//  ;
// create distline for runner MJ:
  svgTime2Geo.append("line") //for runner MJ axis
    .attr("class","axis")
    .attr("x1",xMargin)
    .attr("y1",yT - 20)
    .attr("x2",xMargin + (timeScale(parseMyDate(latestTimeStr_2))) )
    .attr("y2",yT - 20)
  ;
  svgTime2Geo.append("circle")
    .attr("class","nostop")
    .attr("cx",xMargin)
    .attr("cy",yT - 20)
    .attr("r",2)
  ;
  svgTime2Geo.append("circle")
    .attr("class","nostop")
    .attr("cx",xMargin + (timeScale(parseMyDate(latestTimeStr_2))))
    .attr("cy",yT - 20)
    .attr("r",2)
  ;
// create distline for runner LZ:
  svgTime2Geo.append("line") //for runner MJ axis
    .attr("class","axis")
    .attr("x1",xMargin)
    .attr("y1",yT - 40)
    .attr("x2",xMargin + (timeScale(parseMyDate(latestTimeStr))) )
    .attr("y2",yT - 40)
    .attr("y2",yT - 40)
  ;
  svgTime2Geo.append("circle")
    .attr("class","nostop")
    .attr("cx",xMargin)
    .attr("cy",yT - 40)
    .attr("r",2)
  ;
  svgTime2Geo.append("circle")
    .attr("class","nostop")
    .attr("cx",xMargin + (timeScale(parseMyDate(latestTimeStr))))
    .attr("cy",yT - 40)
    .attr("r",2)
  ;
//create time rects of runner MJ
  svgTime2Geo.selectAll(".distancecircle")
    .data(data)
//            .data(data.filter(function(d){ return d.properties.stop == 1; })) //filter out non-stops
    .enter()
    .append("rect")
    .attr("id", function (d) {return "t2g_t_" + d.properties.id})
    .attr("class", "distancecircle")
    .attr("x", function(d) {
      var startX = xMargin + 0;
      if (d.properties.arrival != null) {
        startX = xMargin+(timeScale(parseMyDate(d.properties.arrival)))
      }
      return startX;
    })
    .attr("y", yT - 23 )
    .attr("height", rectHeight)
    .attr("width", function(d) {
      var startX, endX;
      if (d.properties.departure != null) {
        endX = xMargin+(timeScale(parseMyDate(d.properties.departure)))
      }
      if (d.properties.arrival != null) {
        startX = xMargin+(timeScale(parseMyDate(d.properties.arrival)))
      }
      return (endX - startX);
    })
    .on("mouseover", function (d) {selectMe(this, d); })
    .on("mouseout", function (d) {unselectMe(this); })
  ;
//create time rects of runner LZ
  svgTime2Geo.selectAll(".timecircle")
    .data(data2)
//            .data(data.filter(function(d){ return d.properties.stop == 1; })) //filter out non-stops
    .enter()
    .append("rect")
    .attr("id", function (d) {return "t2g_d_" + d.properties.id})
    .attr("class", "timecircle")
    .attr("x", function(d) {
      var startX = xMargin + 0;
      if (d.properties.arrival != null) {
        startX = xMargin+(timeScale(parseMyDate(d.properties.arrival)))
      }
      return startX;
    })
    .attr("y", yT - 43)
    .attr("height", rectHeight)
    .attr("width", function(d) {
      var startX, endX;
      if (d.properties.departure != null) {
        endX = xMargin+(timeScale(parseMyDate(d.properties.departure)))
      }
      if (d.properties.arrival != null) {
        startX = xMargin+(timeScale(parseMyDate(d.properties.arrival)))
      }
      return (endX - startX);
    })
    .on("mouseover", function (d) {selectMe_2(this, d); })
    .on("mouseout", function (d) {unselectMe_2(this); })
  ;

// create sliced axes
// **********************
//  var distScales = new Array;
//  var distAxes = new Array;
//  var distAxes2 = new Array
//
//  // loop through parts BETWEEN stops
//  for (i = 0; i < (data.length-1); i++) {
////        if (data[i].properties.stop == 1) {//filter out non-stops
//    var smallestDist = data[i].properties.distance;
//    var largestDist = data[i+1].properties.distance;
//    // from end of this stop...
//    var startX = (timeScale(parseMyDate(data[i].properties.departure)))  + xMargin ;
//    // ...to start of next stop...
//    var endX = (timeScale(parseMyDate(data[i+1].properties.arrival))) + xMargin ;
//    distScales[i] = d3.scale.linear()
//      .domain([smallestDist, largestDist])
//      .range([startX, endX])
//    ;
//    svgTime2Geo.append("line")
//      .attr("class","axis")
//      .attr("x1",startX)
//      .attr("y1",yD - 6)
//      .attr("x2",endX)
//      .attr("y2",yD - 6)
//    ;
//    // create detailed axis...
//    distAxes[i] = d3.svg.axis()
//      .scale(distScales[i] )
//      .orient("top")
//      .ticks(distSlicesUnLabelledTicksValue)
//      .tickSize(6, 6)
//    ;
//    //...and draw it without labels
//    svgTime2Geo.append("g")
//      .attr("class", "axisNoLabels")
//      .attr("transform", "translate(" + (0) + "," + yD +")" )
//      .call(distAxes[i])
//    ;
//    // create generalized axis...
//    distAxes2[i] = d3.svg.axis()
//      .scale(distScales[i] )
//      .orient("top")
//      .ticks(distSlicesLabelledTicksValue)
//      .tickSize(10, 0)
//    ;
//    // .. and draw it  with labels
//    svgTime2Geo.append("g")
//      .attr("class", "axis")
//      .attr("transform", "translate(" + (0) + "," + yD +")" )
//      .call(distAxes2[i])
//    ;
////        } // end filter if
//  } // end loop
}// end of drawTime2GeoPanel


// **********************
// Geography to Time Panel:
// **********************
function drawGeo2TimePanel(data,data2) {

//create connectors
//  svgGeo2Time.selectAll(".connectors")
////            .data(data)
//    .data(data.filter(function(d){ return d.properties.stop == 1; })) //filter out non-stops
//    .enter()
//    .append("line")
//    .attr("class", "connectors")
//    .attr("x1", function(d) {return xMargin+(distScale(d.properties.distance))})
//    .attr("y1", yD )
//    .attr("x2", function(d) {return xMargin+(distScale(d.properties.distance))})
//    .attr("y2", yT )
//  ;

// create sliced axes
// **********************
  var timeScales = new Array;
  var timeAxes = new Array;
  var timeAxes2 = new Array;

  // loop through parts BETWEEN stops
//  for (i = 0; i < (data.length-1); i++) {
////        if (data[i].properties.stop == 1) {//filter out non-stops
//    var earliestTime = parseMyDate(data[i].properties.departure);
//    var latestTime = parseMyDate(data[i+1].properties.arrival);
//    // from end of this stop...
//    var startX = (distScale(data[i].properties.distance))  + xMargin ;
//    // ...to start of next stop...
//    var endX = (distScale(data[i+1].properties.distance)) + xMargin ;
//    timeScales[i] = d3.time.scale()
//      .domain([earliestTime, latestTime])
//      .range([startX, endX])
//    ;
//    // create detailed axis...
//    timeAxes[i] = d3.svg.axis()
//      .scale(timeScales[i] )
//      .orient("bottom")
//      .ticks(timeUnLabelledTicksUnit, timeUnLabelledTicksValue)
//      .tickSize(6, 6)
//    ;
//    //...and draw it without labels
//    svgGeo2Time.append("g")
//      .attr("class", "axisNoLabels")
//      .attr("transform", "translate(" + (0) + "," + yT +")" )
//      .call(timeAxes[i])
//    ;
//    // create generalized axis...
//    timeAxes2[i] = d3.svg.axis()
//      .scale(timeScales[i] )
//      .orient("bottom")
//      .ticks(timeLabelledTicksUnit, timeLabelledTicksValue)
//      .tickSize(10, 0)
//    ;
//    // .. and draw it  with labels
//    svgGeo2Time.append("g")
//      .attr("class", "axis")
//      .attr("transform", "translate(" + (0) + "," + yT +")" )
//      .call(timeAxes2[i])
//    ;
////        } // end filter if
//  }// end of loop


//create time circles MJ
  svgGeo2Time.selectAll(".distancecircle")
    .data(data.filter(function(d){ return d.properties.stop == 1; })) //filter out non-stops
    .enter()
    .append("circle")
    .attr("id", function (d) {return "g2t_d_" + d.properties.id})
    .attr("class", "distancecircle")
    .attr("cx", function(d) {return xMargin+(distScale(d.properties.distance))})
    .attr("cy", yT)
    .attr("r", 3)
    .on("mouseover", function (d) {selectMe(this,d); })
    .on("mouseout", function (d) {unselectMe(this); })
  ;
//create create time circles LZ
  svgGeo2Time.selectAll(".timecircle")
    .data(data2.filter(function(d){ return d.properties.stop == 1; })) //filter out non-stops
    .enter()
    .append("circle")
    .attr("id", function (d) {return "g2t_t_" + d.properties.id})
    .attr("class", "timecircle")
    .attr("cx", function(d) {return xMargin+(distScale(d.properties.distance))})
    .attr("cy", yD)
    .attr("r", 3)
    .on("mouseover", function (d) {selectMe_2(this, d); })
    .on("mouseout", function (d) {unselectMe_2(this); })
  ;

}// end of drawGeo2TimePanel



function selectMe(elem, data) {
  var dataID = elem.getAttribute("id").split("_")[2];
  var el = document.getElementById("m_d_" + dataID);
  el.setAttribute("r", el.getAttribute("r")*3);
//  el = document.getElementById("nor_d_" + dataID);
//  el.setAttribute("r", el.getAttribute("r")*3);
  el = document.getElementById("g2t_d_" + dataID);
  el.setAttribute("r", el.getAttribute("r")*3);
//  el = document.getElementById("g2t_t_" + dataID);
//  el.setAttribute("r", el.getAttribute("r")*3);
//  el = document.getElementById("nor_t_" + dataID);
//  el.setAttribute("height", el.getAttribute("height")*2);
//  el = document.getElementById("t2g_d_" + dataID);
//  el.setAttribute("height", el.getAttribute("height")*2);
  el = document.getElementById("t2g_t_" + dataID);
  el.setAttribute("height", el.getAttribute("height")*2);
  var infoStr = "";
  infoStr += "<h1>" + data.properties.id + ": " + (data.properties.name == undefined ? "": data.properties.name) + "</h1>";
//  infoStr += "<hr>";
  infoStr += "arrival: " + data.properties.arrival + "<br />";
  infoStr += "departure: " + data.properties.departure + "<br />";
  infoStr += "distance: " + data.properties.distance;
  infoDiv
    .html(infoStr)
    .style("left", (d3.event.pageX + 5) + "px")
    .style("top", (d3.event.pageY + 10) + "px")
  ;
  document.getElementById("infoDiv").style.display = "inline";
}

function unselectMe(elem) {
  var dataID = elem.getAttribute("id").split("_")[2];
  var el = document.getElementById("m_d_" + dataID);
  el.setAttribute("r", el.getAttribute("r")/3);
//  el = document.getElementById("nor_d_" + dataID);
//  el.setAttribute("r", el.getAttribute("r")/3);
  el = document.getElementById("g2t_d_" + dataID);
  el.setAttribute("r", el.getAttribute("r")/3);
//  el = document.getElementById("g2t_t_" + dataID);
//  el.setAttribute("r", el.getAttribute("r")/3);
//  el = document.getElementById("nor_t_" + dataID);
//  el.setAttribute("height", el.getAttribute("height")/2);
//  el = document.getElementById("t2g_d_" + dataID);
//  el.setAttribute("height", el.getAttribute("height")/2);
  el = document.getElementById("t2g_t_" + dataID);
  el.setAttribute("height", el.getAttribute("height")/2);
  document.getElementById("infoDiv").style.display = "none";
}
function selectMe_2(elem, data) {
  var dataID = elem.getAttribute("id").split("_")[2];
  var el = document.getElementById("m_d2_" + dataID);
  el.setAttribute("r", el.getAttribute("r")*3);
//  el = document.getElementById("nor_d_" + dataID);
//  el.setAttribute("r", el.getAttribute("r")*3);
//  el = document.getElementById("g2t_d_" + dataID);
//  el.setAttribute("r", el.getAttribute("r")*3);
  el = document.getElementById("g2t_t_" + dataID);
  el.setAttribute("r", el.getAttribute("r")*3);
//  el = document.getElementById("nor_t_" + dataID);
//  el.setAttribute("height", el.getAttribute("height")*2);
  el = document.getElementById("t2g_d_" + dataID);
  el.setAttribute("height", el.getAttribute("height")*2);
//  el = document.getElementById("t2g_t_" + dataID);
//  el.setAttribute("height", el.getAttribute("height")*2);
  var infoStr = "";
  infoStr += "<h1>" + data.properties.id + ": " + (data.properties.name == undefined ? "": data.properties.name) + "</h1>";
//  infoStr += "<hr>";
  infoStr += "arrival: " + data.properties.arrival + "<br />";
  infoStr += "departure: " + data.properties.departure + "<br />";
  infoStr += "distance: " + data.properties.distance;
  infoDiv
    .html(infoStr)
    .style("left", (d3.event.pageX + 5) + "px")
    .style("top", (d3.event.pageY + 10) + "px")
  ;
  document.getElementById("infoDiv").style.display = "inline";
}

function unselectMe_2(elem) {
  var dataID = elem.getAttribute("id").split("_")[2];
  var el = document.getElementById("m_d2_" + dataID);
  el.setAttribute("r", el.getAttribute("r")/3);
//  el = document.getElementById("nor_d_" + dataID);
//  el.setAttribute("r", el.getAttribute("r")/3);
//  el = document.getElementById("g2t_d_" + dataID);
//  el.setAttribute("r", el.getAttribute("r")/3);
  el = document.getElementById("g2t_t_" + dataID);
  el.setAttribute("r", el.getAttribute("r")/3);
//  el = document.getElementById("nor_t_" + dataID);
//  el.setAttribute("height", el.getAttribute("height")/2);
  el = document.getElementById("t2g_d_" + dataID);
  el.setAttribute("height", el.getAttribute("height")/2);
//  el = document.getElementById("t2g_t_" + dataID);
//  el.setAttribute("height", el.getAttribute("height")/2);
  document.getElementById("infoDiv").style.display = "none";
}