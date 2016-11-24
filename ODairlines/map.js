var mapDiv, mapSVG;
var directCheckElem;
var yearsSVG, yearsDiv, yearsScale, yearsBrush;
var timesSVG, timesDiv, timesScale, timesBrush;

//Init filter variables:
var years = [2016,2017],
    times = [new Date(0,0,1,0,0,0),new Date(0,0,1,1,0,0)],
    onlyDirect = true;

var mapscale = 300;

// var useGreatCircles = true;
var tooltip;
//global to be used by sliders/brushes:
var arcNodes;
var projection, projectedPath;
var countries, arcs;

var DEBUG;

function initMap() {

    timesDiv = d3.select("#timesDiv");
    yearsDiv = d3.select("#yearsDiv");
    mapDiv = d3.select("#mapDiv");

    var mapWidth, mapHeight,
        π = Math.PI,
        radians = π / 180,
        radius = 6371,
        format = d3.format(",.0f"),
        projCentre = [-22.605556, 63.985]; //= Kefklavik
    ;

    mapHeight = parseInt(mapDiv.style("height"));
    mapWidth = parseInt(mapDiv.style("width"));

    mapSVG = mapDiv.append("svg")
        .attr("id", "mapSVG")
        .attr("width", mapWidth)
        .attr("height", mapHeight)
    ;

    //set years control/brush stuff:

    //first set W/H to full
    var yearsHeight = parseInt(yearsDiv.style("height"));
    var yearsWidth = parseInt(yearsDiv.style("width"));

    yearsSVG = yearsDiv.append("svg")
        .attr("id", "yearsSVG")
        .attr("width", yearsWidth)
        .attr("height", yearsHeight)
    ;
    // make actual brush & axis smaller
    yearsHeight = yearsHeight - 0;
    yearsWidth = yearsWidth - 0;
    var yearsTextshiftX = 5;
    var yearsTextshiftY = 20;


    //set times control/brush stuff:

    //first set W/H to full
    var timesHeight = parseInt(timesDiv.style("height"));
    var timesWidth = parseInt(timesDiv.style("width"));

    timesSVG = timesDiv.append("svg")
        .attr("id", "timesSVG")
        .attr("width", timesWidth)
        .attr("height", timesHeight)
    ;
    // make actual brush & axis smaller
    timesHeight = timesHeight - 10;
    timesWidth = timesWidth - 0;
    var timesTextshiftX = 5;
    var timesTextshiftY = 0;

    projection = d3.geoAzimuthalEquidistant()
            .translate([mapWidth / 2, mapHeight / 2])
            .clipAngle(180 - 1e-3)
            .scale(mapscale)
            .precision(.1)
            .rotate([-projCentre[0], -projCentre[1]])
        ;

    projectedPath = d3.geoPath()
        .projection(projection);

//    var arc = d3.geo.greatArc().precision(3) //3);
//    use geoPath : see http://stackoverflow.com/questions/39982729/drawing-connecting-lines-great-arcs-on-a-d3-symbol-map

    countries = mapSVG.append("g").attr("id", "countries");
    arcs = mapSVG.append("g").attr("id", "arcs");

    mapSVG.append("text")
        .attr("id", "loading")
        .attr("x", 5)
        .attr("y", 45)
        .text("Loading...")
    ;
    

    d3.loadData()
        .json('countries', '../data/world-110m.json')
        .csv('nodes', 'airports.dat.csv')
        .csv('flows', 'flights_acc.csv')
        .onload(function (data) {

            d3.select("#loading").attr("visibility", "hidden");

            directCheckElem = document.getElementById("directCheck");

            //Set up years control:
            yearsScale = d3.scaleLinear()
                .domain([d3.min(data.flows, function(d) { return +d.year; }),
                    d3.max(data.flows, function(d) { return +d.year; }) + 1 ]) //+1 to include upper limit
                .range([0, yearsHeight]);

            yearsSVG.append("g")
                .attr("class", "axis axis--grid")
                .attr("transform", "translate(" + yearsWidth + ", 0)")
                .call(d3.axisRight(yearsScale)
                    .tickSize(-yearsWidth)
                    .tickFormat(function() { return null; }))
            ;
            yearsSVG.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(" + yearsTextshiftX + ", " + yearsTextshiftY + ")")
                .call(d3.axisRight(yearsScale)
                    .ticks()
                    .tickSize(0)
                    .tickFormat(d3.format("d"))
                    .tickPadding(0))
                .attr("text-anchor", "middle")
                .selectAll("text")
                .attr("x", yearsWidth/2 - yearsTextshiftX);

            yearsBrush = d3.brushY()
                .extent([[0, 0], [yearsWidth, yearsHeight]])
                .on("end", doYearBrush)
                ;
            yearsSVG.append("g")
                .attr("class", "brush")
                .call(yearsBrush)
                .call(yearsBrush.move , years.map(yearsScale)) //init - years set in global vars;
            ;


            //Set up times control:
            timesScale = d3.scaleTime()
                .domain( [ new Date(0,0,1,0,0,0), new Date(0,0,1,24,0,0) ] )
                .range([10, timesHeight]);

            timesSVG.append("g")
                .attr("class", "axis axis--grid")
                .attr("transform", "translate(" + timesWidth + ", 0)")
                .call(d3.axisRight(timesScale)
                    .ticks(d3.timeHour.every(1))
                    .tickSize(-timesWidth)
                    .tickFormat(function() { return null; }))
            ;
            timesSVG.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(" + timesTextshiftX + ", " + timesTextshiftY + ")")
                .call(d3.axisRight(timesScale)
                    .ticks(d3.timeHour.every(1))
                    .tickSize(0)
                    .tickFormat(d3.timeFormat("%H:%M"))
                    .tickPadding(0))
                .attr("text-anchor", "middle")
                .selectAll("text")
                .attr("x", timesWidth/2 - timesTextshiftX);

            timesBrush = d3.brushY()
                .extent([[0, 10], [timesWidth, timesHeight]])
                .on("end", doTimeBrush)
            ;
            timesSVG.append("g")
                .attr("class", "brush")
                .call(timesBrush)
                .call(timesBrush.move , times.map(timesScale)) //init - times set in global vars;
            ;

            var nodeDataByName = {}, links = [];
            var maxMagnitude =
                d3.max(data.flows, function (d) {
                    return parseFloat(d.flights_pw) //flights per week
                });

            var arcWidth = d3.scaleLinear().domain([1, 7]).range([1, 7]);
            var arcColor = 'rgb(8, 48, 107)';


            var globe = {type: "Sphere"};
            var graticule = d3.geoGraticule()();
            var land = topojson.feature(data.countries, data.countries.objects.land);
            var borders = topojson.mesh(data.countries, data.countries.objects.countries);

            countries.append("path")
                .datum(globe)
                .attr("class", "globe")
                .attr("d", projectedPath)
            ;
            countries.append("path")
                .datum(graticule)
                .attr("class", "graticule")
                .attr("d", projectedPath)
            ;
            countries.append("path")
                .datum(land)
                .attr("class", "land")
                .attr("d", projectedPath)
                .attr("class", "land")
            ;
            countries.append("path")
                .datum(borders)
                .attr("class", "borders")
                .attr("d", projectedPath)
            ;

            function nodeCoords(node) {
                var lon = parseFloat(node.lon), lat = parseFloat(node.lat);
                if (isNaN(lon) || isNaN(lat)) return null;
                return [lon, lat];
            }

            data.nodes.forEach(function (node) {
                node.coords = nodeCoords(node);
                node.projection = node.coords ? projection(node.coords) : undefined;
                nodeDataByName[node.iata] = node;
            });


            data.flows.forEach(function (flow) {
                var o = nodeDataByName[flow.origin];
                var co = o.coords, po = o.projection;
                var d = nodeDataByName[flow.dest];
                var cd = d.coords, pd = d.projection;
                var magnitude = parseFloat(flow.flights_pw);
                // var hub = (flow.hub == 0 ? false : true);
                var hub = flow.hub;

                if (co && cd && !isNaN(magnitude)) {
                    links.push({
                        source: co, target: cd,
                        magnitude: magnitude,
                        hub: hub,
                        year: flow.year,
                        deptime_1: flow.deptime_1,
                        origin: o, dest: d,
                        originp: po, destp: pd
                    });
                }
            });



            function splitPath(path) {
                var avgd = 0, i, d;
                var c, pc, dx, dy;
                var points = path.split("L");
                if (points.length < 2) return path;
                var newpath = [points[0]];
                var coords = points.map(function (d, i) {
                    return d.substr(i > 0 ? 0 : 1).split(","); // remove M and split
                });

                // calc avg dist between points
                for (i = 1; i < coords.length; i++) {
                    pc = coords[i - 1];
                    c = coords[i];
                    dx = c[0] - pc[0];
                    dy = c[1] - pc[1];
                    d = Math.sqrt(dx * dx + dy * dy);
                    c.push(d);  // push dist as last elem of c
                    avgd += d;
                }
                avgd /= coords.length - 1;

                // for points with long dist from prev use M instead of L
                for (i = 1; i < coords.length; i++) {
                    c = coords[i];
                    newpath.push((c[2] > 5 * avgd ? "M" : "L") + points[i]);
                }
                return newpath.join("");
            }


            arcNodes = arcs.selectAll("path")
                .data(links)
                .enter().append("path")
                .attr("visibility", "hidden")
                .attr("class" , function(d) {
                    if (d.hub != "") {
                        return "indirect"
                    } else {
                        return "direct";
                    }
                })
                .attr("stroke-width", function (d) {
                    return arcWidth(d.magnitude);
                })
                .attr("d", function (d) {
                    return projectedPath({
                        type: "LineString",
                        coordinates: [d.source, d.target]
                    });
                })
                .on("mousemove", function (d) {
                    d3.select(this)
                        .attr("stroke", "blue")
                    ;
                    toolTipMove(d3.event)
                })
                .on("mouseleave", function () {
                    d3.select(this)
                        .attr("stroke", "red")
                    ;
                    toolTipHide()
                })
                .on("mouseenter", function (d) {
                    var theHTML =
                    d.deptime_1 + " to " + d.dest.name
                        + "<br>" + d.dest.city + " (" + d.dest.country + ")<br>"
                        + d.magnitude + " days p/week";
                    if (d.hub) {
                        theHTML += "<br>via " + d.hub;
                    }
                    toolTipShow(theHTML);
                })
                .sort(function (a, b) {
                    var a = a.magnitude, b = b.magnitude;
                    if (isNaN(a)) if (isNaN(b)) return 0; else return -1;
                    if (isNaN(b)) return 1;
                    return d3.ascending(a, b);
                });

            doFilter(onlyDirect, years, times);

        });

//create tooltip divs:
    tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
    ;
    tooltip.append("div")
        .attr("class", "tooltip-text")
    ;

    function toolTipMove(d) {
        tooltip.style("left", (d.pageX + 7) + "px")
            .style("top", (d.pageY + 12) + "px");
    }

    function toolTipHide() {
        tooltip.transition()
            .duration(250)
            .style("opacity", 0);
    }

    function toolTipShow(txt) {
        tooltip.transition()
            .duration(250)
            .style("opacity", 1);
        tooltip.select('.tooltip-text')
            .html(txt);
    }
} //of initMap



d3.loadData = function () {
    var loadedCallback = null;
    var toload = {};
    var data = {};
    var loaded = function (name, d) {
        delete toload[name];
        data[name] = d;
        return notifyIfAll();
    };
    var notifyIfAll = function () {
        if ((loadedCallback != null) && d3.keys(toload).length === 0) {
            loadedCallback(data);
        }
    };
    var loader = {
        json: function (name, url) {
            toload[name] = url;
            d3.json(url, function (d) {
                return loaded(name, d);
            });
            return loader;
        },
        csv: function (name, url) {
            toload[name] = url;
            d3.csv(url, function (d) {
                return loaded(name, d);
            });
            return loader;
        },
        onload: function (callback) {
            loadedCallback = callback;
            notifyIfAll();
        }
    };
    return loader;
};

function directCheck() {
    if (directCheckElem.checked) {
        onlyDirect = true;
    } else {
        onlyDirect = false;
    }
    doFilter(onlyDirect,years, times);
}

function doYearBrush() {
    if (d3.event.sourceEvent == null) return; // needed to avoid triggering on setting first brush??
    if (d3.event.sourceEvent.type === "end") return;
    var yearsRaw, yearsSnapped = years; //inherit previous settings
    if (d3.event.selection != null) {// new selection made
        yearsRaw = d3.event.selection.map(yearsScale.invert) //lower & upper bounds from brush
        yearsSnapped = yearsRaw.map(function (d) {
            return Math.round(d)
        }); //same rounded to whole years
    }
    if (yearsSnapped[0] == yearsSnapped[1]) {//avoid no year selection
        if (yearsSnapped[1] >= yearsScale.domain()[1]) { //if at max
            yearsSnapped[0]--; //extent range downwoards
        }
        else yearsSnapped[1]++; //else extent upwards
    }
    years = yearsSnapped;
    d3.select(this).call(d3.event.target.move, years.map(yearsScale)); //set brush to snapped values
    doFilter(onlyDirect, years, times);

}

function doTimeBrush() {
    if (d3.event.sourceEvent == null) return; // needed to avoid triggering on setting first brush??
    if (d3.event.sourceEvent.type === "end") return; // needed to avoid triggering if no selection made
    var timesRaw = timesSnapped = times; //inherit previous settings
    if (d3.event.selection != null) { // new selection made
        timesRaw = d3.event.selection.map(timesScale.invert) //lower & upper bounds from brush
        // var timesSnapped = timesRaw.map(function (d) {return Math.round(d)}); //same rounded to whole times
        // if (timesSnapped[0] == timesSnapped[1]) {//avoid no time selection
        //     if (timesSnapped[1] >= timesScale.domain()[1]) { //if at max
        //         timesSnapped[0]--; //extent range downwoards
        //     }
        //     else timesSnapped[1]++ ; //else extent upwards
        // }
    }
    times = timesRaw;
    d3.select(this).call(d3.event.target.move, times.map(timesScale)); //set brush to snapped values
    doFilter(onlyDirect, years, times);
}

function doFilter(onlyDirect, years, times) {
    arcNodes.attr("visibility", function (d) {
        var show = true;
        if (onlyDirect && d.hub != "") show = false;
        if (d.year < years[0] || d.year > years[1]) show = false;
        var HH = d.deptime_1.split(":")[0];
        var MM = d.deptime_1.split(":")[1];
        var TT = new Date(0,0,1,HH,MM,0);
        if (TT < times[0] || TT > times[1]) show = false;
        return show ?  "visible" : "hidden";
    });
}

function doZoom(change) {
    mapscale = mapscale + change;
    projection.scale(mapscale);
    countries.selectAll("path").attr("d", projectedPath);
    arcs.selectAll("path").attr("d", function (d) {
        return projectedPath({type: "LineString", coordinates: [d.source, d.target]});
    })
}