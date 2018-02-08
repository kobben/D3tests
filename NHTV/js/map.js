//GLOBALS:
var geodata, DEBUG, myProj;
var brushTimes, myTimeScale, parseTime;
var tracks = [];

// get width and height from mapDiv width
var SVGwidth = 1000;
var SVGheight = 500;

// fixed system bounds:
var minx = 5.061782535138475;
var miny = 51.56355146203369;
var maxx = 5.062072623034602;
var maxy = 51.5636965004679;

var scale, y_offset, x_offset, mapSVG, sliderSVG, brushSVG;


function init() {

  mapSVG = d3.select("#mapDiv").append("svg")
    .attr("id", "mapSVG")
    .attr("width", SVGwidth)
    .attr("height", SVGheight)
  ;

  initMessages(document.getElementById("mapDiv"), true);
  setMessage('Loading...', showMsg);

  d3.json("data/test_100.json", function (json) {
    geodata = json;

    numTracks = geodata.length;

    //// pre-processing data:
    //// 1. find min and max lat-lons
    //for (i = 0; i < numTracks; i++) {
    //  var numPoints = geodata[i].packet.payload.GpsLocations.NumberOfGpsLocations;
    //  for (j = 0; j < numPoints; j++) {
    //    var curPoint = geodata[i].packet.payload.GpsLocations.GpsLocations[j].GpsCoordinate;
    //    if (curPoint.longitude < minx) {
    //      minx = curPoint.longitude
    //    }
    //    ;
    //    if (curPoint.longitude > maxx) {
    //      maxx = curPoint.longitude
    //    }
    //    ;
    //    if (curPoint.latitude < miny) {
    //      miny = curPoint.latitude
    //    }
    //    ;
    //    if (curPoint.latitude > maxy) {
    //      maxy = curPoint.latitude
    //    }
    //    ;
    //  }
    //}
    //setMessage(minx + ',' + miny + '\n' + maxx + ',' + maxy, debugMsg);

    // use  limits to calculate scale and bounds needed for
    // affine transformation of RD coordinates to screen coordinates
    var dataHeight = maxy - miny;
    var dataWidth = maxx - minx;

    //choose scale that fills box
    xscale = SVGwidth / dataWidth;
    yscale = SVGheight / dataHeight;
    scale = Math.min(xscale, yscale);
    y_offset = (maxy * scale);
    x_offset = -(minx * scale);

    // AffineTransformation as a basic pseudo-projection of  latlons to screen coords
    // http://en.wikipedia.org/wiki/Transformation_matrix#Affine_transformations
    myProj = function ([lon, lat]) {
      var x = scale * lon + 0 * lat + x_offset;
      var y = 0 * lon + (-scale) * lat + y_offset;
      return [ Math.round(x*10)/10, Math.round(y*10)/10 ];
      //return [ x, y ];
    }

    var CBrange = colorbrewer["Spectral"][11];


    // Date/time formatted in json as "2017-10-27T23:09:33.095"
    parseTime = d3.timeParse("%Y-%m-%dT%H:%M:%S.%L");
    var earliestTS = parseTime("2999-01-01T00:00:00.00");
    var latestTS = parseTime("1899-01-01T00:00:00.00");

    // pre-processing data:
    // 1. use fixed min and max lat-lons
    // 2. create data structure
    // 3. fill with existing attribs, tracks & projected tracks
    // 4. find earliest and latest Timestamps
    for (i = 0; i < numTracks; i++) {
      //var strokeColor = CBrange[Math.round(Math.random()*10)];
      var strokeColor = CBrange[i % 11];
      var projPath = '';
      var numPoints = geodata[i].packet.payload.GpsLocations.NumberOfGpsLocations;
      var curTrack = {
        "id": i,
        "timeStart": geodata[i].packet.payload.TimeStart,
        "timeEnd": geodata[i].packet.payload.TimeEnd,
        "numPoints": numPoints,
        "points": [],
        "projPoints": []
      };
      if (parseTime(curTrack.timeStart) < earliestTS) {earliestTS = parseTime(curTrack.timeStart)}
      if (parseTime(curTrack.timeEnd) < earliestTS) {earliestTS = parseTime(curTrack.timeEnd)}
      if (parseTime(curTrack.timeStart) > latestTS) {latestTS = parseTime(curTrack.timeStart)}
      if (parseTime(curTrack.timeEnd) > latestTS) {latestTS = parseTime(curTrack.timeEnd)}
      for (j = 0; j < numPoints; j++) {
        var curPoint = geodata[i].packet.payload.GpsLocations.GpsLocations[j].GpsCoordinate;
        curTrack.points.push(curPoint);
        var curPointProj = myProj([curPoint.longitude, curPoint.latitude]);
        curTrack.projPoints.push(curPointProj);
        if (j==0) {
          projPath += 'M'
        } else {
          projPath += 'L'
        }
        projPath += curPointProj[0] + ',' + curPointProj[1];
      }
      tracks.push(curTrack);
      //setMessage(projPath, debugMsg);
      mapSVG.append("path")
        .attr("class", "track")
        .attr("id", "t_"+i)
        .style("stroke", strokeColor)
        .attr("d", projPath)
      ;
    }

    brushTimes = [earliestTS, latestTS];

    var sliderMargin = 4;

    var barHeight = 3;
    var axisHeight = 20;
    brushHeight =  axisHeight + (barHeight * numTracks);
    brushWidth = SVGwidth - (2 * sliderMargin);
    brushSVG = d3.select("#brushDiv")
      .style("padding-left", sliderMargin + "px")
      .style("padding-right", sliderMargin + "px")
      .append("svg")
      .attr("id", "brushSVG")
      .attr("left", sliderMargin)
      .attr("width", brushWidth)
      .attr("height",brushHeight - axisHeight)
    ;

    var scaleLength = brushWidth;
    myTimeScale = d3.scaleTime()
      .domain([earliestTS,latestTS])
      .range([0, scaleLength])
    ;



    //create axis...
    var timeLabelledTicks = d3.timeMinute.every(1);
    var timeAxis = d3.axisTop()
        .scale(myTimeScale)
        //.ticks(timeLabelledTicks)
        .tickSize(5, 0)
      ;
    //...and draw axes with labels
    brushSVG.append("g")
      .attr("class", "axis")
      .attr("transform", "translate(0," + axisHeight + ")")
      .call(timeAxis)
    ;
    brushSVG.append("line")
      .attr("class","axis")
      .attr("x1",myTimeScale(earliestTS))
      .attr("x1",myTimeScale(latestTS))
      .attr("y1",0)
      .attr("y2",0)
    ;
    for (i = 0; i < numTracks; i++) {
      var strokeColor = CBrange[i % 11];
      brushSVG.append("line")
        .attr("class", "trackbar")
        .attr("id", "bar_" + i)
        .style("stroke", "red")
        .style("stroke-width", barHeight + "px")
        .attr("x1",myTimeScale(parseTime(tracks[i].timeStart)))
        .attr("x2",myTimeScale(parseTime(tracks[i].timeEnd)))
        .attr("y1", axisHeight + (i * barHeight) )
        .attr("y2", axisHeight + (i * barHeight) )
      ;
    }
    timeBrush = d3.brushX()
      .extent([[0, axisHeight], [brushWidth, brushHeight - axisHeight]])
      //.handleSize([0])
      .on("end", doTimeBrush)
    ;
    brushSVG.append("g")
      .attr("class", "brush")
      .call(timeBrush)
      .call(timeBrush.move , brushTimes.map(myTimeScale)) //init - times set in global vars;
    ;


    var timeSlider = d3.select("#timeSlider")
        .style("width", (SVGwidth - sliderMargin - 2) +"px")
        .attr("max", scaleLength)
      ;

    //d3.select("#theWidth").attr("value", SVGwidth);
    //d3.select("#theHeight").attr("value", SVGheight);
    //d3.select("#mapscale").html(Math.round(10000 * scale) / 100000);
    //d3.select("#xoffset").html(Math.round(x_offset));
    //d3.select("#yoffset").html(Math.round(y_offset));


    setMessage('Loaded.', hideMsg);

  });

} // END init()


function doTimeBrush() {
  if (d3.event.sourceEvent == null) return; // needed to avoid triggering on setting first brush??
  if (d3.event.sourceEvent.type === "end") return;
  //var timesRaw, timesSnapped = brushTimes; //inherit previous settings
  if (d3.event.selection != null) {// new selection made
    brushTimes = d3.event.selection.map(myTimeScale.invert) //lower & upper bounds from brush
    //timesSnapped = timesRaw.map(function (d) {
    //  return Math.round(d)
    //}); //same rounded to whole times
  }
  //if (timesSnapped[0] == timesSnapped[1]) {//avoid no time selection
  //  if (timesSnapped[1] >= timesScale.domain()[1]) { //if at max
  //    timesSnapped[0]--; //extent range downwoards
  //  }
  //  else timesSnapped[1]++; //else extent upwards
  //}
  //times = timesSnapped;
  d3.select(this).call(d3.event.target.move, brushTimes.map(myTimeScale)); //set brush
  doFilter(brushTimes);

}

function doFilter(times) {
  for (i = 0; i < numTracks; i++) {
    d3.selectAll("#t_"+i).style("display","none");
    if (parseTime(tracks[i].timeStart) >= times[0] && parseTime(tracks[i].timeStart) <= times[1]) {
      d3.selectAll("#t_"+i).style("display","inline");
    }
  }
}

function setTimeSlider(sliderVal) {
  for (i = 0; i < numTracks; i++) {
    d3.selectAll("#t_"+i).style("stroke-width",".2px");
    if (myTimeScale(parseTime(tracks[i].timeStart)) <= sliderVal
      && myTimeScale(parseTime(tracks[i].timeEnd)) >= sliderVal) {
      d3.selectAll("#t_"+i).style("stroke-width","5px");
    }
  }

}


function fitToBox() {
  SVGwidth = d3.select("#theWidth").property("value");
  SVGheight = d3.select("#theHeight").property("value");
//			console.log(SVGwidth + " , " + SVGheight);
  mapSVG.remove();
  init();
}

