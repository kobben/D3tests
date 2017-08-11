// FUNCTIONS FOR INFO BOX

function showInfo(data, page) {

	var len = data.length

	// reset the dropdown
	document.getElementById("selectUni").selectedIndex = 0

	// remove existing info divs from wrappers
	d3.select("#" + page + "Wrapper").selectAll("*").remove();

	// no data: show welcome message
	if (len == 0) {
		addDiv(page).html("<h3>Welcome to the GeoForAll Labs map!</h3> \
			<p>Click on a lab in the map or use 'Find Lab' - Dragging will rotate the globe, using the mouse-wheel will let you zoom in and out. </p>\
			<p>The data presented here is retrieved from the GeoForAll wiki.</p>");
	}
	else {
		var row0 = "" // name of uni
		var row1 = "" // country, city + url
		var row2 = "" // description
		var row3 = "" // contact
		var row4 = "" // date
		data.forEach(function(lab, index) {
			row0 += "<h3>" + lab.name + "</h3>";
			if (lab.url != null && lab.url != '' && lab.url != undefined) {
				row0 += "<a href=" + lab.url + " target='_blank' class='weblink'>" + lab.url + "</a>"
			}
			row1 += "<h4>" + lab.city + ", " + lab.country + "</h4>";
			row2 += lab.contact_name + " (" + lab.contact_email +") <br>";
			row3 += lab.date + "<hr>";
			row4 += lab.notes;
		});

		addDiv(page).html(row0 +  row1 +  row2 +  row3 +  row4);

	}
}


function addDiv(page) {
	return d3.select("#" + page + "Wrapper").append("div").classed("infoDivs", true)
}



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
		.text(txt);
}