/*

 implemented in HTML5 using Canvas by B Köbben (March 2015)
 -- only properly tested in Chrome on MAC OSX!
 */


//global constants
const LEFT = 0, RIGHT = 1;
const lines = 315, columns = 266;
const cellSize = 1;

//global vars
var gridData;
var minDay = 36, day = minDay; maxDay = 54;

var animationRunning, beingSetUp;
var currentStep;
var step_display;

var dayText;

//create 2-dim array (a pain in JS ;-)
var cells = new Array(lines);
for (var i = 0; i <=columns; i++) {
  cells[i] = new Array(columns);
}


//var colourScale = d3.scale.linear()
//    .domain([minDay, day])
//    .range([255, 100]);

function init() {

    dayText = document.getElementById("dayTxt");

    d3.text('SIx_2008.csv', function (error, data) {
        gridData = d3.csv.parseRows(data);
        //alert("data loaded...");

        canvas = document.getElementById('myCanvas');
        ctx = canvas.getContext('2d');

        //set styles for cells
        ctx.fillStyle = 'rgb(240,240,255)';
        ctx.strokeStyle = '#BBBBBB';

        //draw cells
            drawGrid();
    });

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

//draw cells
function drawGrid() {
    for (var x = 0; x < columns; x++) {
        for (var y = 0; y < lines; y++) {
            theVal = +gridData[y][x];
            if (theVal == 0) {
                rgbStr = 'rgb(240,240,255)';
            } else {
                if (theVal > day) {
                    rgbStr = 'rgb(200,200,200)';
                } else {
                    rgbStr = 'rgb(100,200,100)';
                }
            }
            ctx.fillStyle = rgbStr;
            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            //ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
        }
    }
    dayText.innerHTML = day;
}


function animateForward() {
    if (day >= maxDay) {
        day = maxDay;
    }  else {
        day++;
    }
    drawGrid();
}

function animateBack() {
    if (day <= minDay) {
        day = minDay;
    }  else {
        day--;
    }
    drawGrid();
}

function animateBegin() {
    day = minDay;
    drawGrid();
}

function animateEnd() {
    day = maxDay;
    drawGrid();
}


function colourCell(x, y) {
  if (cells[x][y] > 0) {
    ctx.fillStyle = 'red';
  } else { // (cells[x][y] == 0)
    ctx.fillStyle = 'white';
  }
  ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
  ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
}

function switchState(x, y) {
  if (cells[x][y] == ON) {
    cells[x][y] = OFF;
  } else { // (cells[x, y] == OFF) {
    cells[x][y] = ON;
  }
  colourCell(x, y);
}

function turn(direction) {
  if (direction == RIGHT) {
    switch (currentAntDirection) {
      case NORTH:
        currentAntDirection=EAST; break;
      case SOUTH:
        currentAntDirection=WEST; break;
      case EAST:
        currentAntDirection=SOUTH; break;
      case WEST:
        currentAntDirection=NORTH; break;
    }
  } else { //direction == LEFT
    switch (currentAntDirection) {
      case NORTH:
        currentAntDirection=WEST; break;
      case SOUTH:
        currentAntDirection=EAST; break;
      case EAST:
        currentAntDirection=NORTH; break;
      case WEST:
        currentAntDirection=SOUTH; break;
    }
  }
}

function moveForward() {
  switch (currentAntDirection) {
    case NORTH:
      currentLine--; break;
    case SOUTH:
      currentLine++; break;
    case EAST:
      currentColumn++; break;
    case WEST:
      currentColumn--; break;
  }
}


function doStepAnt() {
  currentStep++;
  if (currentLine < 1 || currentLine > lines || currentColumn < 1 || currentColumn > columns) {
    step_display.innerHTML = "Out of Bounds...";
    return;
  } else {
    if (cells[currentColumn][currentLine] == OFF) { //white square
      turn(RIGHT);
    } else {  // (cells[currentColumn][currentLine] == ON) // red square
      turn(LEFT);
    }
    switchState(currentColumn, currentLine);
    moveForward();
    step_display.innerHTML = currentStep;
  }
  if (animationRunning) window.requestAnimationFrame(doStepAnt);
}

function startDir(dir) {
  currentAntDirection = dir;
  switch (currentAntDirection) {
    case NORTH:
      document.getElementById("dir_display").innerHTML = "NORTH"; break;
    case SOUTH:
      document.getElementById("dir_display").innerHTML = "SOUTH"; break;
    case EAST:
      document.getElementById("dir_display").innerHTML = "EAST"; break;
    case WEST:
      document.getElementById("dir_display").innerHTML = "WEST"; break;
  }
}

function setUpReady() {
  document.getElementById("instructions").style.display = "none";
  document.getElementById("running").style.display = "inline";
  beingSetUp = false;
}

function startAnt() {
  if (!animationRunning) {
    animationRunning = true;
    window.requestAnimationFrame(doStepAnt);
  }
}

function stepAnt() {
  animationRunning = false;
  doStepAnt();
}

function resetAnt() {
  window.cancelAnimationFrame;
  init();
  document.getElementById("instructions").style.display = "inline";
  document.getElementById("running").style.display = "none";
  currentStep = 0;
  step_display.innerHTML = currentStep;
}

function canvasClick(evt) {


  //if (beingSetUp) { //only work in setup mode
  //  var mousePos = getMousePos(canvas, evt);
  //  var cellX = Math.round(mousePos.x/cellSize)-1;
  //  var cellY = Math.round(mousePos.y/cellSize)-1;
  //  switchState(cellX,cellY);
  //}

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

