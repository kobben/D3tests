/**
 * Messages.js:
 *
 * messaging system used for messages as well as errors and debug info
 * and for tooltips on D3 elements
 *
 * Licensed under a Creative Commons Attribution-NonCommercial-ShareAlike 3.0 License.
 * see http://creativecommons.org/licenses/by-nc-sa/3.0/
 *
 * @author Barend Kobben - b.j.kobben@utwente.nl
 * @version 1.0 [October 2017]
 *
 */


function initMessages(mapDiv, debugOn) {
  // approx in center of map div:
  var mapCX = (mapDiv.clientWidth / 2) + mapDiv.offsetLeft - 7;
  var mapCY = (mapDiv.clientHeight / 2) + mapDiv.offsetTop - 12;
  centerOfMap = {"pageX": mapCX, "pageY": mapCY};
  //create tooltip divs:
  tooltipDiv = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 1)
  ;
  tooltipDiv.append("div")
    .attr("class", "tooltip-text")
  ;
  errorMsg = 0, showMsg = 1, hideMsg = 2; debugMsg = 3;
  debugMessages = debugOn;
}

function setMessage(messageStr, messageType) {
  //first some checking and if necessary repairing:
  if (messageStr == null || messageStr == undefined) { //no message:
    messageStr = "No message string!";
  }
  if (messageType == showMsg) { //log message and display message box
    toolTipMove(centerOfMap);
    toolTipShow(messageStr);
  } else if (messageType == hideMsg) { //log message and hide messagebox
    toolTipHide(messageStr);
  } else if (messageType == errorMsg) { //Error: display Javascript alert
    alert(messageStr);
  }
  if (debugMessages) { // if debugOn, all messageTypes are logged in console;
                       // debugMsg is always logged in console
    console.log(messageStr);
  }
}

function toolTipMove(d) { // d contains data with x & y
  tooltipDiv.style("left", (d.pageX + 7) + "px")
    .style("top", (d.pageY + 12) + "px");
}

function toolTipHide() {
  tooltipDiv.transition()
    .duration(250)
    .style("opacity", 0);
}

function toolTipShow(theText) {
  tooltipDiv.transition()
    .duration(250)
    .style("opacity", 1);
  tooltipDiv.select('.tooltip-text')
    .text(theText);
}