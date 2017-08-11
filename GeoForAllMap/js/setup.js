// initialise resize function
d3.select(window)
	.on("resize", sizeChange);

// import data files
d3.queue()
	.defer(d3.csv, "data/OSGEoLabs.csv")
	.await(function (error, labdata) {

		window.labs = labdata;

		// add labs to map
		addLabsToMap()

		// initialise explore page
		showInfo([], "exp")

		// initialise compare page
		window.selectedLabs = selectedLabs()
		d3.select("#clearSelection").on("click", selectedLabs.clear)

	})

//create tooltip divs:
tooltip = d3.select("body")
	.append("div")
	.attr("class", "tooltip")
	.style("opacity", 0)
;
tooltip.append("div")
	.attr("class", "tooltip-text")
;