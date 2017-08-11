// width and height
var wh = Math.min(parseInt(d3.select("#mapDiv").style("width"),10), parseInt(d3.select("#mapDiv").style("height"),10));

// scale
var scl = parseInt(d3.select("#mapDiv").style("width"),10)/2.1;

//set random startpoint:
var startlon = (Math.random() * 360) - 180 ;
var startlat = (Math.random() * 180) - 90;

// map projection
var projection = d3.geoOrthographic()
	.scale(scl)
	.translate([ wh/2, wh/2 ])
	.rotate([startlon, startlat]) // rotate to random point
// var projection = d3.geoMollweide()
// 	.scale(140)
// 	.translate([ wh/2, wh/2 ])
// 	.rotate([startlon, startlat]) // rotate to random point
// 	.precision(.5);

// path generator
var path = d3.geoPath()
	.projection(projection);

// create SVG element
var svg = d3.select("#mapDiv")
	.append("svg")
	.attr("width", wh)
	.attr("height", wh)

// append g elements
var map = svg.append("g")
var dotsG = svg.append("g")

// enable drag
var drag = d3.drag()
	.on("start", dragstarted)
	.on("drag", dragged);

var gpos0, o0, gpos1, o1;
svg.call(drag);

var zoom = d3.zoom()
		.scaleExtent([0.75, 50])
		.on("zoom", zoomed)

svg.call(zoom)

// load TopoJSON data
d3.json("data/world-110m.json", function(error, json) {
	if (error) throw error;

	var globe = {type: "Sphere"},
		graticule = d3.geoGraticule()(),
		land = topojson.merge(json, json.objects.countries.geometries),
		borders = topojson.mesh(json, json.objects.countries, function(a, b) { return a !== b; })
		;

	map.append("path")
		.datum(globe)
		.attr("class", "ocean")
		.attr("d", path)
	;
	map.append("path")
		.datum(graticule)
		.attr("class", "graticule")
		.attr("d", path)
	;
	map.append("path")
		.datum(land)
		.attr("class", "land")
		.attr("d", path)
	;
	map.append("path")
		.datum(borders)
		.attr("class", "boundary")
		.attr("d", path)
	;
});

// DRAG FUNCTIONS //
function dragstarted() {
	gpos0 = projection.invert(d3.mouse(this));
	o0 = projection.rotate();
}

function dragged() {
	gpos1 = projection.invert(d3.mouse(this));
	o0 = projection.rotate();
	o1 = eulerAngles(gpos0, gpos1, o0);
	if (o1 !== null && o1 !== undefined) { //not sure why this happens, but it does :-(
		projection.rotate(o1);
		//redraw map
		map.selectAll("path").attr("d", path);
		dotsG.selectAll("path").attr("d", function(d) { return path(circle.center([d.lon, d.lat]).radius(1.5 / d3.zoomTransform(svg.node()).k)()); });
	};

}

// ZOOM FUNCTIONS //
function zoomed() {
	projection.scale(d3.event.transform.translate(projection).k * scl)
	//redraw map
	map.selectAll("path").attr("d", path);
	dotsG.selectAll("path").attr("d", function(d) { return path(circle.center([d.lon, d.lat]).radius(1.5/d3.event.transform.translate(projection).k)()); });
}


// SIZE CHANGE //

function sizeChange() {
	// check if window smaller than 768px (that's when the map size starts changing)
	if (window.innerWidth <= 768) {
		var wh = Math.min(parseInt(d3.select("#mapDiv").style("width"),10), parseInt(d3.select("#mapDiv").style("height"),10));

		// map projection
		projection.scale(wh/2.1).translate([ wh/2, wh/2 ])

		// update size SVG element
		svg.attr("width", wh).attr("height", wh)

		// update land masses, background circle and dots
		map.selectAll("path").attr("d", path);
		dotsG.selectAll("path").attr("d", function(d) { return path(circle.center([d.lon, d.lat]).radius(1.5)()); });
	}
	// else do nothing
}

// function to add dots to map, and options to dropdown
// called from data.js
function addLabsToMap() {

	circle = d3.geoCircle()

	dotsG
		.selectAll("path")
		.data(labs)
		.enter().append("path")
		.classed("pin", true)
		.attr("id", function(d) {return "pin" + d.id})
		.attr("d", function(d) { return path(circle.center([d.lon, d.lat]).radius(1.5/ d3.zoomTransform(svg.node()).k)()); })
		.on("mouseenter", function (d) {
			toolTipShow(d.name);
		})
		.on("mousemove", function (d) {
			toolTipMove(d3.event)
		})
		.on("mouseover", function(d) {
			d3.select(this).transition()
				.attr("d", function(d) { return path(circle.center([d.lon, d.lat]).radius(2/ d3.zoomTransform(svg.node()).k)()); });
		})
		.on("mouseout", function() {
			d3.select(this).transition()
				.attr("d", function(d) { return path(circle.center([d.lon, d.lat]).radius(1.5/ d3.zoomTransform(svg.node()).k)()); });
			toolTipHide();
		})
		.on("mousedown", function() {d3.event.stopPropagation()})
		.on("mouseup", function() {d3.event.stopPropagation()})
		.on("click", function(d) {
			d3.event.stopPropagation()
			react(d);
		});


	// add all universities to dropdown
	var dropdown  = d3.select("#selectUni")
		.data(labs)
		.on("change", function() {
			// var page = d3.selectAll(".switch").attr("value")
			var selectValue = d3.select("#selectUni").property("value")
			react(labs[selectValue])
		})

	dropdown.selectAll("option .new")
		.data(labs)
		.enter()
		.append("option")
		.text(function(d) { return d.name; })
		.attr("value", function(d, i) {return i})

}


function rotateTo (d) {
	svg.transition()
		.duration(1000)
		.tween("rotate", function() {
			var r = d3.interpolate(projection.rotate(), [-d.lon, -d.lat, 0]);
			return function (t) {
				projection.rotate(r(t));
				map.selectAll("path").attr("d", path);
				dotsG.selectAll("path").attr("d", function(d) { return path(circle.center([d.lon, d.lat]).radius(1.5/d3.zoomTransform(svg.node()).k)()); });
			}
		});
}