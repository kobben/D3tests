
//global constants
const lines = 315, columns = 266;
const cellSize = 1;


var SVGwidth = 266, SVGheight = 315;


// RD=RijksDriehoekstelsel=Dutch national projection system bounds:
var minx = 13600;
var miny = 306900;
var maxx = 278000;
var maxy = 619300;
// use RD limits to calculate scale and bounds needed for
// affine transformation of RD coordinates to screen coordinates
var dataHeight = maxy - miny;
var dataWidth = maxx - minx;

var scale, y_offset, x_offset, mapDiv, svg;

//choose scale that fills box
xscale = SVGwidth/dataWidth;
yscale = SVGheight/dataHeight;
scale = Math.min(xscale,yscale);

// AffineTransformation as a basic pseudo-projection of RD coords to screen coords
// http://en.wikipedia.org/wiki/Transformation_matrix#Affine_transformations
function AffineTransformation(a, b, c, d, tx, ty) {
    return {
        //overrides normal D3 projection stream (to avoid adaptive sampling)
        stream: function(output) {
            return {
                point: function(x, y) { output.point(a * x + b * y + tx, c * x + d * y + ty); },
                sphere: function() { output.sphere(); },
                lineStart: function() { output.lineStart(); },
                lineEnd: function() { output.lineEnd(); },
                polygonStart: function() { output.polygonStart(); },
                polygonEnd: function() { output.polygonEnd(); }
            };
        }
    };
}


//global vars
//var gridData = Array(4);
//var ctx = Array(4);
var gridData = Array;
var ctx = Array;
var minDay = 36, day = minDay; maxDay = 54;
var noDataCol = 'rgb(240,240,255)',
    backgroundCol = 'rgb(200,200,200)',
    dataCol = 'rgb(100,200,100)';

var animationRunning, beingSetUp;
var currentStep;
var step_display;

var dayText;

//create 2-dim array (a pain in JS ;-)
var cells = new Array(lines);
for (var i = 0; i <=columns; i++) {
  cells[i] = new Array(columns);
}


var colourScale = d3.scale.linear()
    .domain([minDay, maxDay])
    .range([255, 150]);



function init() {

    dayText = document.getElementById("dayTxt");

    for (var i = 1; i < 1; i++) {
        var year = 2005 + i;
        d3.text('SIx_' + year + '.csv', function (error, data) {
            gridData = d3.csv.parseRows(data);
            ctx = document.getElementById('myCanvas'+i).getContext('2d');

            alert("data " + i + " loaded...");

            //draw cells of NL
            drawGrid(ctx, 0, 0, noDataCol, dataCol, backgroundCol);
            //dayText.innerHTML = day;
        });
    }

    mapDiv = d3.select("#myCanvas");

    //svg = mapDiv.append("svg")
    //    .attr("id", "theMapSVG")
    //    .attr("width", SVGwidth)
    //    .attr("height", SVGheight)
    //;
    //
    ////choose scale that fills box
    //xscale = SVGwidth/dataWidth;
    //yscale = SVGheight/dataHeight;
    //scale = Math.min(xscale,yscale);
    //
    //y_offset = (maxy * scale);
    //x_offset = -(minx * scale);
    //
    //var RDpath = d3.geo.path().projection(AffineTransformation(scale, 0, 0, -scale, x_offset, y_offset));
    //d3.json("../data/nl_rd.json", function(json) {
    //    // nl_rd.json = small map of Netherlands, using RD (EPSG:28992)
    //    // RD = Rijksdriehoeksstelsel = Double-Stereographic projection on the Bessel ellipsoid
    //    nl=json;
    //    svg.selectAll("path")
    //        .data(nl.features)
    //        .enter()
    //        .append("path")
    //        .attr("class", "boundary")
    //        .attr("d", RDpath)
    //    ;
    //});
    //
    //svg.append("rect")
    //    .attr("class", "svgFrame")
    //    .attr("x1", 0)
    //    .attr("y1", 0)
    //    .attr("width", SVGwidth)
    //    .attr("height", SVGheight)
    //;
    //
    //d3.select("#width").attr("value", SVGwidth);
    //d3.select("#height").attr("value", SVGheight);
    //d3.select("#mapscale").html(Math.round(100000*scale)/100000);
    //d3.select("#xoffset").html(Math.round(x_offset));
    //d3.select("#yoffset").html(Math.round(y_offset));



} //end init()



// requestAnimation Polyfill  by Erik Möller
(function() {
  var lastTime = 0;
  var vendors = ['webkit', 'moz'];
  for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
    window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
    window.cancelAnimationFrame =
      window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
  }

  if (!window.requestAnimationFrame)
    window.requestAnimationFrame = function(callback, element) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = window.setTimeout(function() { callback(currTime + timeToCall); },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

  if (!window.cancelAnimationFrame)
    window.cancelAnimationFrame = function(id) {
      clearTimeout(id);
    };
}());


function drawGrid(ctx, noDataVal, dayVal, noDataCol, dataCol, backgroundCol) {
    for (var x = 0; x < columns; x++) {
        for (var y = 0; y < lines; y++) {
            var theVal = +gridData[y][x];
            if (theVal == noDataVal) {
                rgbStr = noDataCol;
            } else {
                if (dayVal >= theVal) {
                    var greenVal = Math.round(colourScale(theVal));
                    var dataCol = 'rgb(100,' + greenVal + ',100)';
                    rgbStr = dataCol;
                } else {
                    rgbStr = backgroundCol;
                }
            }
            ctx.fillStyle = rgbStr;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            //ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }
}


function animateForward() {
    if (day >= maxDay) {
        day = maxDay;
    }  else {
        day++;
    }
    drawGrid(0, day, noDataCol, dataCol, backgroundCol);
    dayText.innerHTML = day;
}

function animateBack() {
    if (day <= minDay) {
        day = minDay;
    }  else {
        day--;
    }
    drawGrid(0, day, noDataCol, dataCol, backgroundCol);
    dayText.innerHTML = day;
}

function animateBegin() {
    day = minDay;
    drawGrid(0, day, noDataCol, dataCol, backgroundCol);
    dayText.innerHTML = day;
}

function animateEnd() {
    day = maxDay;
    drawGrid(0, day, noDataCol, dataCol, backgroundCol);
    dayText.innerHTML = day;
}



function getMousePos(canvas, evt) {
  // get canvas position
  var obj = canvas;
  var top = 0;
  var left = 0;
  while (obj && obj.tagName != 'BODY') {
    top += obj.offsetTop;
    left += obj.offsetLeft;
    obj = obj.offsetParent;
  }
  // return relative mouse position
  var mouseX = evt.clientX - left + window.pageXOffset;
  var mouseY = evt.clientY - top + window.pageYOffset;
  return {
    x:mouseX,
    y:mouseY
  };
}

