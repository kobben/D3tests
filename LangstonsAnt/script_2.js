/*
 Javascript version of Langton's Ant:
 Langton's ant is a two-dimensional Turing machine with a
 very simple set of rules but complicated emergent behavior.
 It was invented by Chris Langton in 1986
 see http://en.wikipedia.org/wiki/Langton's_ant
 implemented in HTML5 using Canvas by B Köbben (June 2013)
 -- only properly tested in Chrome on MAC OSX!
 */


//global constants
const ON = 1, OFF = 0;
const NORTH=0, EAST=1, SOUTH=2, WEST=3;
const LEFT = 0, RIGHT = 1;
const lines = 150, columns = 150;
const cellSize = 5;

//global vars
var currentAntDirection;
var currentLine, currentColumn;
var animationRunning, beingSetUp;
var currentStep;
var step_display;

//create 2-dim array (a pain in JS ;-)
var cells = new Array(lines)
for (var i = 0; i <=columns; i++) {
  cells[i] = new Array(columns);
};

function init() {

  canvas = document.getElementById('myCanvas');
  ctx = canvas.getContext('2d');

  //set styles for cells
  ctx.fillStyle = '#FF0000';
  ctx.strokeStyle = '#BBBBBB';

  //initialize cells
  for (var x = 0; x <= lines; x++) {
    for (var y = 0; y <= columns; y++) {
      cells[x][y] = OFF;
      colourCell(x, y);
    }
  }

  step_display = document.getElementById("step_display");

    //always start in center...
  currentStep = 0;
  currentLine = 75;
  currentColumn = 75;
  currentAntDirection = NORTH;
  startDir(NORTH);
  // show start pos:
  ctx.fillStyle = 'blue';
  ctx.fillRect(currentColumn * cellSize, currentLine * cellSize, cellSize, cellSize);
  step_display.innerHTML = currentStep;
  animationRunning = false;
  beingSetUp = true;
}

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


function colourCell(x, y) {
  if (cells[x][y] == ON) {
    ctx.fillStyle = 'red';
  } else { // (cells[x][y] == OFF)
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
  if (beingSetUp) { //only work in setup mode
    var mousePos = getMousePos(canvas, evt);
    var cellX = Math.round(mousePos.x/cellSize)-1;
    var cellY = Math.round(mousePos.y/cellSize)-1;
    switchState(cellX,cellY);
  }

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

