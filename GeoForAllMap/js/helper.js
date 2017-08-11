function mean(x) {
	// calculates mean of an array while ignoring NaN values
	var sum = 0; var len = 0
	while (x.length > 0) {
		y = x.pop()
		if (!(isNaN(y) || y == 0)) {sum += y; len++}
	}
	return sum / len
}

function round(value, decimals) {
  return Number(Math.round(value+'e'+decimals)+'e-'+decimals);
}

function switchTo(page) {
	document.getElementById("#radio"+ page).checked = true;
	d3.selectAll(".container").classed("hidden", true)
	d3.select("#"+ page + "Container").classed("hidden", false)
}

function selectedLabs () {
	var box = d3.select("#selectedLabs");

	var selection = [];

	showInfo(selection, "comp");

	return {
		get: function ()  {
			return selection;
		},
		add: function (uni)  {
			// check if already selected
			if (selection.indexOf(uni) == -1 && selection.length <= 3) {
				// add to selection
				var index = selection.push(uni) - 1
				
				// show in box at the top
				var a = box.append("div")
					.classed("selUniBox", true)
					.attr("id", "selbox" + index)
				
				a.text(uni.uni)
				a.append("div")
					.attr("id", "del" + uni.id)
					.html("&times;")
					.on("click", function() {
						// delete
						selection.splice(index, 1)
						a.remove()
						d3.select("#saveLink").html(getLink(selection))
						d3.select("#pin" + uni.id).classed("selected", false).classed("selectedcomp", false)
						showInfo(selection, "comp")
					})
				
				d3.select("#saveLink").html(getLink(selection))

				d3.select("#pin" + uni.id).classed("selected", true).classed("selectedcomp", true)
				
				// update info box
				showInfo(selection, "comp")
			}
			else if (selection.length > 3) {
				alert("You've already selected four universities. To add more, you first need to remove some from the selection.")
			}
		},
		clear: function () {
			selection = []
			box.selectAll("div").remove()
			d3.select("#saveLink").html("")
			d3.selectAll(".pin").classed("selected", false).classed("selectedcomp", false)
			showInfo(selection, "comp")
		}
	}
}

function getLink(selection) {
	if (selection.length == 0) {return ""}
	else {
		var link = "To save this selection, drag this <a href='" + 
			"https://sa-atlantis.nl/abroaddatabase/?labs="
		selection.forEach(function(uni) {
			link += uni.id + "&"
		})
		link = link.slice(0,-1)
		link += "'>link</a> to your bookmarks bar."
		return link
	}
}

function react(data) {
	// function determines what to do when the user selects from the drop down or clicks a dot on the map
	var page = "exp";
	// var page = d3.select('input[name="page"]:checked').property("value");

	rotateTo(data)

	if (page == "exp") {
		d3.select(".selectedexp").classed("selected", false).classed("selectedexp", false)
		d3.select("#pin" + data.id).classed("selected", true).classed("selectedexp", true)
		showInfo([data], "exp")
	}

	else if (page == "comp") {
		selectedLabs.add(data)
	}

	else {
		switchTo("exp")
		d3.select("#pin" + data.id).classed("selected", true).classed("selectedexp", true)
		showInfo([data], "exp")
	}
}