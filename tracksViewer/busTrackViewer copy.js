/**
 * TRACKING GEOGRAPHY & TIME
 D3.js Javascript web-app to generate interactive web pages from multiple tracks
 © Barend Köbben, ITC-University of Twente
 Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 License.
 see http://creativecommons.org/licenses/by-nc-sa/3.0/
 @author Barend Kobben <b.j.kobben@utwente.nl>

 **** IMPROVISED version for multiple bus tracks ****
 @version 0.1.0 [May 2014]
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
var svgMapPanel = d3.select("body")
    .append("svg")
    .attr("id", "svgMapPanel")
    .attr("width", mapWidth)
    .attr("height", mapHeight)
  ;
if (background_image != "") {
  svgMapPanel.append("image")
    .attr("xlink:href", background_image)
    .attr("x", background_shiftX)
    .attr("y", background_shiftY)
    .attr("width", mapWidth + background_widthPlus)
    .attr("height", mapHeight + background_heightPlus)
  ;
}
svgMapPanel.append("text")
  .attr("x", 5)
  .attr("y", 20)
  .attr("class", "panelTitle")
  .text("GEOGRAPHY")
;
//create maps + legend:
var svgMap = new Array(numTimeSeries);
for (i=0; i < numTimeSeries; i++) {
  svgMapPanel.append("circle")
    .attr("cx", 7)
    .attr("cy", 37 + (i*12))
    .attr("r", stopSize)
    .attr("class", "distancecircle_" + i)
  ;
  svgMapPanel.append("text")
    .attr("x", 20)
    .attr("y", 40 + (i*12))
    .attr("class", "panelLegend")
    .text("Series " + i)
  ;
  svgMap[i] = svgMapPanel.append("g")
    .attr("id", "mapSVG_"+ i)
  ;
}
//create "exploding" effect for series viewing
svgMapPanel
  .on("mousedown", function (d) {
    svgMap[0].transition().ease("elastic").duration(1500).attr("transform","translate(-120,-15)")
    svgMap[2].transition().ease("elastic").duration(1500).attr("transform","translate(120,15)")
  } )
  .on("mouseup", function (d) {
    svgMap[0].transition().ease("elastic").duration(1500).attr("transform","translate(0,0)")
    svgMap[2].transition().ease("elastic").duration(1500).attr("transform","translate(0,0)")
  } )
;





// *******************
// prepareTime-distance panels:
// *******************
var distScale,  timeScale
var SVGscaleWidth = 650, SVGscaleHeight = 170;
var xMargin = 10, yT = 160;
var scaleLength=600;
var track, lines;
var rectHeight = 6; //for rects in scales

// DATE & TIME FIDDLING:
//first use original date format to parse,
// gets dates wrt 1900/1/1 :
var nullTime = dateFormat.parse("00:00:00");
var T_nullTime = +nullTime;
var earliestTime = new Array;
var latestTime = new Array;
var ET = new Array;
var LT = new Array;
var LTmax = -999999999999999;

// synchronise & harmonise times
for (i=0; i < numTimeSeries; i++) {
  earliestTime[i] = dateFormat.parse(earliestTimeStr[i]);
  latestTime[i] = dateFormat.parse(latestTimeStr[i]);
  ET[i] = +earliestTime[i]; //convert to milliseconds
  LT[i] = +latestTime[i];
  earliestTime[i] = new Date(T_nullTime);
  latestTime[i] = new Date(T_nullTime + (LT[i] - ET[i]));
  if (LT[i] > LTmax) {LTmax = LT[i] };
}

//parses datestring to D3 Date object
function parseMyDate(DateStr, TimeSeries) {
  if (TimeSeries == undefined ||TimeSeries < 0 || TimeSeries > numTimeSeries-1) {
    console.log("invalid TimeSeries [" + TimeSeries + "] in parseMyDate(DateStr, TimeSeries)")
    return NaN;
  } else {
    var T = dateFormat.parse(DateStr).getTime();
    var TT = new Date(T_nullTime + (T - ET[TimeSeries]));
    return TT;
  }
}

LTmax = new Date(LTmax);
LTmaxStr = dateFormat(LTmax);

//domains for the scales
var timeScale = d3.time.scale()
  .domain([earliestTime[0], latestTime[0]])//TODO: latest should be found automatically!
  .range([0, scaleLength]);
var distScale = new Array(numTimeSeries);
for (i=0; i < numTimeSeries; i++) {
  distScale[i] = d3.scale.linear()
    .domain([smallestDist[i], largestDist[i]])
    .range([0, scaleLength]);
}

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
    .attr("id", "svgGeo2TimeBig")
    .attr("width", SVGscaleWidth)
    .attr("height", SVGscaleHeight*2)
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

//create generalized axes for all...
var distAxisGen = new Array(numTimeSeries);
for (i=0; i < numTimeSeries; i++) {
  distAxisGen[i] = d3.svg.axis()
    .scale(distScale[i])
    .orient("top")
    .ticks(distLabelledTicksValue)
    .tickSize(10, 0);
  ;
}
//create detailed axes for all...
var distAxisDet = new Array(numTimeSeries);
for (i=0; i < numTimeSeries; i++) {
  distAxisDet[i] = d3.svg.axis()
    .scale(distScale[i])
    .orient("top")
    .ticks(distUnLabelledTicksValue)
    .tickSize(6, 0);
  ;
}

//drawing for Geo2Time panel:
// for all
for (i=0; i < numTimeSeries; i++) {
  svgGeo2Time.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + xMargin + "," + (yT - (i*50)) + ")")
    .call(distAxisGen[i])
  ;
  svgGeo2Time.append("g")
    .attr("class", "axisNoLabels")
    .attr("transform", "translate(" + xMargin + "," + (yT - (i*50)) + ")")
    .call(distAxisDet[i])
  ;
  svgGeo2Time.append("line")
    .attr("class", "axis")
    .attr("x1", xMargin)
    .attr("y1", (yT - (i*50)) - 6)
    .attr("x2", xMargin + scaleLength)
    .attr("y2", (yT - (i*50)) - 6)
  ;
  svgGeo2Time.append("text")
    .attr("x", xMargin)
    .attr("y", (yT - (i*50)) - 22)
    .attr("fill", "grey")
    .attr("font-size", 10)
    .text("DISTANCE for series " + i)
  ;
}

//TIME
//create generalized axis...
var timeAxisGen = d3.svg.axis()
    .scale(timeScale)
    .orient("bottom")
    .ticks(timeLabelledTicksUnit, timeLabelledTicksValue)
    .tickSize(10, 0)
  ;
//create detailed axis...
var timeAxisDet = d3.svg.axis()
    .scale(timeScale)
    .orient("bottom")
    .ticks(timeUnLabelledTicksUnit, timeUnLabelledTicksValue)
    .tickSize(6, 0)
  ;

// and draw for Time2Geo panel:
svgTime2Geo.append("g")
  .attr("class", "axis")
  .attr("transform", "translate(" + xMargin + "," + (yT-20) +")" )
  .call(timeAxisGen)
;
svgTime2Geo.append("g")
  .attr("class", "axisNoLabels")
  .attr("transform", "translate(" + xMargin + "," + (yT-20) +")" )
  .call(timeAxisDet)
;
svgTime2Geo.append("line") //for time axis
  .attr("class","axis")
  .attr("x1",xMargin)
  .attr("y1",(yT-20) + 6)
  .attr("x2",xMargin + scaleLength)
  .attr("y2",(yT-20) + 6)
;
svgTime2Geo.append("text")
  .attr("x", xMargin)
  .attr("y", (yT-20)+30)
  .attr("fill", "grey")
  .attr("font-size", 10)
  .text("TIME for all")
;

for (i=0; i < numTimeSeries; i++) {
  svgTime2Geo.append("text")
    .attr("x", xMargin)
    .attr("y", (yT - 110) + (i*30) )
    .attr("fill", "grey")
    .attr("font-size", 10)
    .text("Series " + i)
  ;
}


// create infoPanel:
infoDiv = d3.select("body").append("div")
  .attr("id", "infoDiv")
  .text("...")
;

// **********************
// Load in points data and start visualisations
// use queue to handle a-sync loading
// **********************
var allPoints = new Array(numTimeSeries);
var theStops = new Array(numTimeSeries);

//TODO: make proper loop iso this monster...

queue()
  .defer(d3.json, dataFile[0])
  .defer(d3.json, dataFile[1])
  .defer(d3.json, dataFile[2])
  .await(drawAllSeries)
;

function drawAllSeries(error, a,b,c) {
  if (error !=null) console.log(error);
  allPoints[0] = a.features;
  allPoints[1] = b.features;
  allPoints[2] = c.features;
  theStops[0] = allPoints[0].filter(function(d){ return (d.properties.stop == 1|| d.properties.stop == -1); });
  theStops[1] = allPoints[1].filter(function(d){ return (d.properties.stop == 1 || d.properties.stop == -1); });
  theStops[2] = allPoints[2].filter(function(d){ return (d.properties.stop == 1 || d.properties.stop == -1); });
  for (i=0; i < numTimeSeries; i++) {
    drawMap(i, allPoints[i]);
    drawTime2GeoPanel(theStops[i], i);
//    drawGeo2TimePanel(theStops[i], i);
  }
}

// **********************
// Map Panels:
// **********************
function drawMap(nr, data) {
  //draw connectors first
  svgMap[nr].selectAll("line")
    .data(data)
    .enter()
    .append("line")
    .filter(function(d,i) {return (i+1) < data.length}) //no connector for last point!
    .attr("class", "connectors")
    .attr("x1", function (d) {return projection(d.geometry.coordinates)[0]})
    .attr("y1", function (d) {return projection(d.geometry.coordinates)[1]})
    .attr("x2", function (d,i) {return projection(data[(i+1)].geometry.coordinates)[0]})
    .attr("y2", function (d,i) {return projection(data[(i+1)].geometry.coordinates)[1]})
  ;
  //then draw circles
  svgMap[nr].selectAll("circle")
    .data(data)
    .enter()
    .append("circle")
    .attr("id", function (d) {return "m_d_" + nr + "_" + d.properties.id})
    .attr("cx", function (d) {return projection(d.geometry.coordinates)[0];})
    .attr("cy", function (d) {return projection(d.geometry.coordinates)[1];})
    .attr("r", function (d) {
      if (d.properties.stop == 1) {
        return stopSize;
      } else if (d.properties.stop == -1)  {
        return 2;
      } else {
        return noStopSize;
      }
    })
    .attr("class", function (d) {
      if (d.properties.stop == 1) {
        return ("distancecircle_" + nr);
      } else if (d.properties.stop == -1)  {
        return "nostop";
      } else {
        return "nostop";
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
function drawTime2GeoPanel(data, series) {

// create distline:
  svgTime2Geo.append("line")
    .attr("class","axis")
    .attr("x1",xMargin)
    .attr("y1",(yT - 100) + (series*30))
    .attr("x2",xMargin + (timeScale(latestTime[series])) )
    .attr("y2",(yT - 100) + (series*30))
  ;
  svgTime2Geo.append("circle")
    .attr("class","nostop")
    .attr("cx",xMargin)
    .attr("cy",(yT - 100) + (series*30))
    .attr("r",2)
  ;
  svgTime2Geo.append("circle")
    .attr("class","nostop")
    .attr("cx",xMargin + (timeScale(latestTime[series])) )
    .attr("cy",(yT - 100) + (series*30))
    .attr("r",2)
  ;
//create time rects
  svgTime2Geo.selectAll(".distancecircle_"+ series)
    .data(data)
//            .data(data.filter(function(d){ return d.properties.stop == 1; })) //filter out non-stops
    .enter()
    .append("rect")
    .attr("id", function (d) {return "t2g_t_" + d.properties.id})
    .attr("class", "distancecircle_"+ series)
    .attr("x", function(d) {
      var startX = xMargin + 0;
      if (d.properties.arrival != null) {
        startX = xMargin+(timeScale(parseMyDate(d.properties.arrival, series)))
      }
      return startX;
    })
    .attr("y", (yT - 100) + (series*30) -3 )
    .attr("height", rectHeight)
    .attr("width", function(d) {
      var startX, endX;
      if (d.properties.departure != null) {
        endX = xMargin+(timeScale(parseMyDate(d.properties.departure, series)))
      }
      if (d.properties.arrival != null) {
        startX = xMargin+(timeScale(parseMyDate(d.properties.arrival, series)))
      }
      return (endX - startX);
    })
    .on("mouseover", function (d) {selectMe(this, d); })
    .on("mouseout", function (d) {unselectMe(this); })
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
  var dataID = elem.getAttribute("id").split("_")[3];
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
  var theName = eval("data.properties." + nameAttr);
  var infoStr = "";
  infoStr += "<h1>" + (theName == undefined ? "": (nameLabel + " " + theName)) + "</h1>";
  infoStr += "<hr>";
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
  var dataID = elem.getAttribute("id").split("_")[3];
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
  var dataID = elem.getAttribute("id").split("_")[3];
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
  var theName = eval("data.properties." + nameAttr);
  var infoStr = "";
  infoStr += "<h1>" + (theName == undefined ? "": (nameLabel + " " + theName)) + "</h1>";
  infoStr += "<hr>";
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
  var dataID = elem.getAttribute("id").split("_")[3];
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