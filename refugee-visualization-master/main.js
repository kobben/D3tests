//Depends on the following libraries:
//D3.js   http://d3js.org/
//C3.js  http://c3js.org/
//D3.tip   https://github.com/Caged/d3-tip
//cartogram.js

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}
function replaceAll(str, find, replace) {
  str = str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "");
  return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

//state variables of the application
var currentView = "Origin"; //Destination
var currentData = 'Continent'; //Country
var currentYear = ["2014"]; //2003 - 2014
var typeOfLine = 'animated'; //curved, svgflowline, animated, none
var typeOfBackground = 'normal'; //normal, choropleth, cartogram
var minimumRefugees = 100; //minimum amount of refugee to show in a flowline
var animationInterval = 1000; //interval in miliseconds between steps of the animation
var aggregateTime = false; //true, false

var continentElements = ['Asia', 'Europe', 'Africa','America','Australia'];

//var countryOriginSource = ['Afghanistan','Iraq','Somalia','Sudan','Syrian Arab Rep.','Dem. Rep. of the Congo','Viet Nam','Burundi'];
//var countryOriginTarget = ['Pakistan','Iran (Islamic Rep. of)','Syrian Arab Rep.','Jordan','Lebanon','Turkey','Kenya','Yemen','Ethiopia','Uganda','Chad','United Rep. of Tanzania','Congo','Rwanda','China'];
var countryOriginSource = ['Afghanistan','Iraq','Somalia','Syrian Arab Rep.','Sudan','Dem. Rep. of the Congo','Viet Nam'];
var countryOriginTarget = ['Pakistan','Iran (Islamic Rep. of)','Syrian Arab Rep.','Jordan','Kenya','China','Chad','Turkey','Lebanon','Uganda','Yemen'];

//var countryDestinationSource = ['Pakistan','Iran (Islamic Rep. of)','Germany','Syrian Arab Rep.','United Rep. of Tanzania','United States of America','Kenya','China','Jordan'];
//var countryDestinationTarget = ['Iraq','Syrian Arab Rep.','Afghanistan','Turkey','Serbia and Kosovo (S/RES/1244 (1999))','Burundi','Dem. Rep. of the Congo','Somalia','Sudan','Viet Nam','China','Bosnia and Herzegovina'];
var countryDestinationSource = ['Pakistan','Iran (Islamic Rep. of)','Germany','United States of America','Syrian Arab Rep.','Jordan'];
var countryDestinationTarget = ['Sri Lanka','China','Colombia','Croatia','Eritrea','Haiti','Iran (Islamic Rep. of)','Iraq','Afghanistan','Pakistan','Russian Federation','Serbia','Viet Nam','Somalia','Bosnia and Herzegovina','Sudan','Syrian Arab Rep.','Turkey','Ukraine'];


var availableYears = ['2003','2004','2005','2006','2007','2008','2009','2010','2011','2012','2013','2014'];

//Converts continent code to Names
function continentName(value){
	switch (value) {
	    case "1":
	        return "Asia";
	    case "2":
	        return "Europe";
	    case "3":
	        return "Africa";
	    case "4":
	        return "America";
	    case "5":
	        return "Australia";
	}
}

//global variables to load the parts of visualization
var loadElements;
var loadMap;
var loadBaseMap;

//global variable for choropleph
var aggregatedData;
var aggregated;
var topo;
//global variable for time slider
var worldData =[];

//load the data
queue()
	.defer(d3.json, "data/continents.json")
	.defer(d3.json, "data/odMatrixPrepared.json")
	.defer(d3.json, "data/stackBarPrepared.json")
	.defer(d3.json, "data/mapPrepared.json")
	.defer(d3.json, "data/aggregatedData.json")
	.defer(d3.json, "data/worldcountries.json")
	.await(Data_loading);

function Data_loading(error, continentJSON, odMatrixPrepared, stackBarPrepared, mapPrepared, agg, countriesTopo){

	//loads the time slider
		for(var i=1; i<=availableYears.length;i++){
			var aux = {};
			aux.year = availableYears[i-1];
			var val = 0;
			stackBarPrepared.continent.origin.forEach(function(d){
				val += d[i];
			});
			aux.value = val;
			worldData.push(aux);				
		}

	timeSlider();
	topo = countriesTopo;
	aggregatedData = agg;

	//loads the OD matrix and the stacked bar graph and the legend for the ODmatrix
	loadElements = function(){
		if(currentData === 'Continent'){
			if(currentView ==='Origin'){
				var sum = 0;
				odMatrixPrepared.fixed.continent.origin.forEach(function(item){
					sum+=item.value;
				});
				stackedBarGraph(continentElements,stackBarPrepared.continent.origin);
				odMatrix(odMatrixPrepared.fixed.continent.origin, odMatrixPrepared.empty.continent, continentElements, continentElements);
				legendOdMatrix("#od_matrix_legend", [0,290759,446371,5737198],["#ffffcc", "#a1dab4", "#41b6c4", "#225ea8"],7638277,sum);

			} else {
				var sum = 0;
				odMatrixPrepared.fixed.continent.destination.forEach(function(item){
					sum+=item.value;
				});
				stackedBarGraph(continentElements,stackBarPrepared.continent.destination);
				odMatrix(odMatrixPrepared.fixed.continent.destination, odMatrixPrepared.empty.continent, continentElements, continentElements);			
				legendOdMatrix("#od_matrix_legend", [0,290759,446371,5737198],["#ffffd4", "#fed98e", "#fe9929", "#cc4c02"],7638277,sum);
			}
		} else {
			if(currentView === 'Origin'){
				var sum = 0;
				odMatrixPrepared.fixed.country.origin.forEach(function(item){
					sum+=item.value;
				});
				stackedBarGraph(countryOriginSource,stackBarPrepared.country.origin);
				odMatrix(odMatrixPrepared.fixed.country.origin, odMatrixPrepared.empty.country.origin, countryOriginSource, countryOriginTarget);
				legendOdMatrix("#od_matrix_legend", [0,72349,109107,1545306],["#ffffcc", "#a1dab4", "#41b6c4", "#225ea8"],2034416,sum);
			} else {
				var sum = 0;
				odMatrixPrepared.fixed.country.destination.forEach(function(item){
					sum+=item.value;
				});
				stackedBarGraph(countryDestinationSource,stackBarPrepared.country.destination);
				odMatrix(odMatrixPrepared.fixed.country.destination, odMatrixPrepared.empty.country.destination, countryDestinationSource, countryDestinationTarget);
				legendOdMatrix("#od_matrix_legend", [0,17358,62006,1165241],["#ffffd4", "#fed98e", "#fe9929", "#cc4c02"],2034416,sum);
			}
		}
		highlightYear();
	};

	//loads the basemap (can be normal, choropleth or cartogram)
	loadBaseMap = function(){
		//make sure that there is no created basemap
		$("#baseMap").remove();
		$("#choroplephLegendSvg").remove();

		if(currentData === 'Continent'){
			baseMap(continentJSON);
		} else {
			baseMap(topo);
		}
		if(typeOfBackground === 'cartogram'){
			if(currentData === 'Country'){
				changeCartogram();
				changeLegendChoropleph();
			}

		} else if(typeOfBackground === 'choropleth'){
			changeChoropleth();
			changeLegendChoropleph();
		}

		loadMap(null,null);

	};

	//load the arcs
	loadMap = function(o,d){

		//make sure there is no arc created
		$("#arcs").remove();
		//only loads if the type is not none.
		if(typeOfLine !== 'none'){
			if(currentData === 'Continent'){
				if(currentView ==='Origin'){
					mapLines(mapPrepared.max.continent,mapPrepared.links.continent,o,d);
				} else {	
					mapLines(mapPrepared.max.continent,mapPrepared.links.continent,o,d);
				}
			} else {
				if(currentView === 'Origin'){
					if(o === null && d === null){
						o = countryOriginSource;
						d = countryOriginTarget;
					}				
					mapLines(mapPrepared.max.country,mapPrepared.links.country,o,d);
				} else {
					if(o === null && d === null){
						d = countryDestinationSource;
						o = countryDestinationTarget;
					}	
					mapLines(mapPrepared.max.country,mapPrepared.links.country,o,d);
				}
			}
		}
	};
	//initially load the elements in the aplication
	loadElements();
	loadBaseMap();
}

function changeLegendChoropleph(){
	if(currentData === 'Continent'){
		if(currentView === 'Origin'){
			legendChoropleph("#choropleth_legend", [0,0.0008,0.0056,0.0094,0.2,0.1609,0.3590,0.5241],['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486'],0.6310);
		} else {
			legendChoropleph("#choropleth_legend", [0,0.0410,0.0789,0.1492,0.2,0.2842,0.4549,0.575],['#fff5eb','#fee6ce','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#8c2d04'],0.6028);
		}
	} else {
		if(currentView === 'Origin'){
			legendChoropleph("#choropleth_legend", [0,0.0006,0.0017,0.0048,0.0107,0.0240,0.0471,0.1349],['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486'],0.2951);
		} else {
			legendChoropleph("#choropleth_legend", [0,0.0006,0.0020,0.008,0.0096,0.0181,0.0331,0.0779],['#fff5eb','#fee6ce','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#8c2d04'],0.1836);					
		}
	}	
}

//clear previous elements when changing the type of view (country vs continent vs origin vs destination)
function clearSelected(){
	//clear selected country in the map
	selected = '';
	d3.select("#countries").selectAll("path.mapBackgroundSelect")
          .attr("class", 'mapBackground');

	d3.select("#countries").selectAll("path.mapBorder")          
		  .classed("mapBorder", false);

}

function clearElements(){
	//unload C3.js bargraph
	chart.unload();
	//remove the od matrix
	$("#od_matrix :first-child").remove();

	clearSelected();
}


//--------------------------------------------------------------------------------------------------------------
//Iteraction with the buttons in the interface (and also the elements inside the configuration modal)
$( "#continentBtn" ).click(function() {
 	if(!$( "#continentBtn" ).hasClass( "btn-primary" )){
		$( "#continentBtn" ).toggleClass('btn-primary').toggleClass('active').toggleClass('btn-secondary');
		$( "#countryBtn" ).toggleClass('btn-primary').toggleClass('active').toggleClass('btn-secondary');

		if(typeOfBackground === 'cartogram'){
            typeOfBackground = 'normal';
            $("input[name=backgroundType][value=normal]").prop('checked', true);			
		}

		currentData = 'Continent';
		clearElements();
		loadElements();
		loadBaseMap();
	}
});
$( "#countryBtn" ).click(function() {
 	if(!$( "#countryBtn" ).hasClass( "btn-primary" )){
		$( "#continentBtn" ).toggleClass('btn-primary').toggleClass('active').toggleClass('btn-secondary');
		$( "#countryBtn" ).toggleClass('btn-primary').toggleClass('active').toggleClass('btn-secondary');
		currentData = 'Country';
		clearElements();
		loadElements();
		loadBaseMap();
	}
});
$( "#originBtn" ).click(function() {
  if(!$( "#originBtn" ).hasClass( "btn-primary" )){
	  $( "#originBtn" ).toggleClass('btn-primary').toggleClass('active').toggleClass('btn-secondary');
	  $( "#destinationBtn" ).toggleClass('btn-primary').toggleClass('active').toggleClass('btn-secondary');
	  currentView = 'Origin';
	  clearElements();
	  loadElements();
	  loadMap(null,null);
	  if(typeOfBackground === 'choropleth'){
	  	changeChoropleth();
	  	changeLegendChoropleph();
	  }
	  if(typeOfBackground === 'cartogram' && currentData === 'Country'){
	  	changeCartogram();
	  	changeLegendChoropleph();
	  }
  }
});
$( "#destinationBtn" ).click(function() {
 	if(!$( "#destinationBtn" ).hasClass( "btn-primary" )){
		$( "#originBtn" ).toggleClass('btn-primary').toggleClass('active').toggleClass('btn-secondary');
		$( "#destinationBtn" ).toggleClass('btn-primary').toggleClass('active').toggleClass('btn-secondary');
		currentView = 'Destination';
		clearElements();
		loadElements();
		loadMap(null,null);
	  if(typeOfBackground === 'choropleth'){
	  	changeChoropleth();
	  	changeLegendChoropleph();
	  }
	  if(typeOfBackground === 'cartogram' && currentData === 'Country'){
	  	changeCartogram();
	  	changeLegendChoropleph();
	  }
	}
});

$(document).ready(function() {
    $('input:radio[name=lineType]').change(function() {
    	var back = $('input:radio[name=backgroundType]').filter(":checked").val();
    	console.log(back)
    	if(back === 'cartogram'){
    		$("input[name=lineType][value=none]").prop('checked', true);			
    		alert('Cartogram should be used without lines');
    		typeOfLine = 'none';
    	} else {
	        if (this.value == 'quadratic') {
	            typeOfLine = 'curved';
	        }
	        else if (this.value == 'animated') {
	            typeOfLine = 'animated';
	        } else if (this.value == 'svgflowline') {
	        	typeOfLine = 'svgflowline';
	        } else {
	        	typeOfLine = 'none';
	        }
	        //reload the lines when changing the type of line
	        loadMap(null,null);
	        clearSelected();
    	}
    });

    $('input:radio[name=backgroundType]').change(function() {
        if (this.value == 'cartogram') {
        	if(currentData === 'Continent'){
        		$("input[name=backgroundType][value=normal]").prop('checked', true);			
        		alert('Cartogram should be used in Country level');
        	} else {
	            typeOfBackground = 'cartogram';
	            typeOfLine = 'none';
	            $("input[name=lineType][value=none]").prop('checked', true);
        	}
        }
        else if (this.value == 'choropleth') {
            typeOfBackground = 'choropleth';
        } else {
        	typeOfBackground = 'normal';
        }
        //reload the background when change the type
        loadBaseMap();
        clearSelected();

    });

    $('input:radio[name=aggregated]').change(function() {
        if (this.value == 'true') {
            aggregateTime = true;
        }
        else {
        	aggregateTime = false;
        }
        //reload the time slider
        timeSlider();
    });

	$("input[type=number][name=minRefugee]").bind('keyup input', function(){
	    var $this = $(this);
	    clearTimeout($this.data('timer'));
	    $this.data('timer', setTimeout(function(){
	    	minimumRefugees = $this[0].value;
	        //reload the lines when changing the type of line
	        loadMap(null,null);
        	clearSelected();
	    }, 1000));	    
	});

	$("input[type=number][name=timeInterval]").bind('keyup input', function(){
	    var $this = $(this);
	    clearTimeout($this.data('timer'));
	    $this.data('timer', setTimeout(function(){
	    	animationInterval = $this[0].value;
	        //reload the lines when changing the type of line
	    }, 1000));	    
	});
});

//--------------------------------------------------------------------------------------------------------------

//chart variable is for the stacked bar graph (c3.js). It needs to be global so its API can be used by other elements
var chart;

//Stacked Bar Graph
//uses C3.js
//function that builds the Stacked Bar Graph
//the data is open and this function is called later on in the code
function stackedBarGraph(dataElements, stackData){
	//generates the chart
	chart = c3.generate({
	    data: {
	        columns: stackData,
	        type: 'bar',
	        bindto: '#chart',
	        groups: [
	            dataElements
	        ],
	        //change colors of the data in the graph
			// colors: {
			// 	Asia: '#fb9a99',
			// 	Europe: '#377eb8',
			// 	Africa: '#4daf4a',
			// 	America: '#ff7f00',
			// 	Australia: '#984ea3'
			// }
	    },
	    grid: {
	        y: {
	            lines: [{value:0}]
	        }
	    },
	    axis: {
	        x: {
	            type: 'category',
	            categories: ['2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014']
	        },
	        y: {
	            label: {
	                text: 'Refugees population based on '+currentView,
	                position: 'outer-middle'
	                // inner-top : default
	                // inner-middle
	                // inner-bottom
	                // outer-top
	                // outer-middle
	                // outer-bottom
	            }
	        }
	    },
	    //shows the total value of each bar in the tooltip title
	    tooltip: {
	        contents: function (d, defaultTitleFormat, defaultValueFormat, color) {
	            var sum = 0;
	            d.forEach(function (e) {
	                sum += e.value;
	            });
	            defaultTitleFormat = function () {
	                return sum;
	            };
	            return c3.chart.internal.fn.getTooltipContent.apply(this, arguments);
	        }
	    },
	    legend: {
		  item: {
		  	//iteraction of mouseover of the legend with the map
		    onmouseover: function (id) {
		    	id = replaceAll(id," ","_");
			    var countrySvg = d3.select('#'+id);
		    	if(typeOfBackground == 'normal'){
			        if(countrySvg.classed('mapBackgroundSelect') === false){
				            countrySvg
				              .attr("class", 'mapBackgroundHighlight');
			        }
		    	} else {
			        if(countrySvg.classed('mapBorder') === false){
				            countrySvg
				              .classed("mapBorderHigh", true);
			        }    		
		    	}		        
		    },
		    onmouseout: function (id) {
		    	id = replaceAll(id," ","_");
		    	var countrySvg = d3.select('#'+id);
		    	if(typeOfBackground == 'normal'){
			        if(countrySvg.classed('mapBackgroundSelect') === false){
				            countrySvg
				              .attr("class", 'mapBackground');
			        }
		    	} else {
			        if(countrySvg.classed('mapBorder') === false){
				            countrySvg
				              .classed("mapBorderHigh", false);
			        }    		
		    	}		        
		    }
		  }
		}
	});
}

//OD MATRIX

//Functions used by both OD-Matrix and Map
function gradientNameFun(d) { return "grd"+replaceAll(d.origin," ","_")+"_"+replaceAll(d.destination," ","_"); }
function gradientRefNameFun(d) { return "url(#"+gradientNameFun(d)+")"; }

//auxiliary function that classifies the data into the CSS classes
//probably is needed this function since we cannot use a standard choropleth distribution.
function od_scale(value){
	var bounds;
	if(currentData === 'Continent'){
		bounds = [0,290759,446371,5737198];
	} else {
		if(currentView === 'Origin'){
			bounds = [0,72349,109107,1545306];
		} else {
			bounds = [0,17358,62006,1165241];			
		}
	}
	var sufix;
	if(currentView === 'Origin'){
		sufix = 'O';
	} else{
		sufix = 'D';
	}

	if(value > bounds[3]) return "odmatrix odmatrix4"+sufix;
	if(value > bounds[2]) return "odmatrix odmatrix3"+sufix;
	if(value > bounds[1]) return "odmatrix odmatrix2"+sufix;

	return "odmatrix odmatrix1"+sufix;
}

//function that builds the OD matrix
function odMatrix(dataFixed, emptyData,originArray,destinationArray){
	//Uses the library D3.tip to easily generate tooltips for the elements
	//cell size of the matrix
	var odCellSizeX;
	var odCellSizeY;
	var matrixSizeX;
	var matrixSizeY; 

	var width = parseInt(d3.select('#od_matrix').style('width'));

	matrixSizeY = originArray.length;
	matrixSizeX = destinationArray.length;
	if(currentData === 'Continent'){
		odCellSizeX = width/94;
		odCellSizeY = width/94;
	} else {
		odCellSizeX = width/125;
		odCellSizeY = width/125;
	}

	var total=0;
	dataFixed.forEach(function(obj){
		total+=obj.value;
	});
	//tooltips in the od matrix
	if(currentView ==='Origin'){
		od_tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return "<center><strong><span style='color:steelblue'>Origin: "+originArray[d.origin]+"<br>Destination: "+destinationArray[d.destination]+"<br>Year: "+availableYears[d.year]+"</span></strong><br>"+(100*d.value/total).toFixed(2)+"% ("+d.value+")</center>"; });
	} else{		
		od_tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return "<center><strong><span style='color:steelblue'>Destination: "+originArray[d.origin]+"<br>Origin: "+destinationArray[d.destination]+"<br>Year: "+availableYears[d.year]+"</span></strong><br>"+(100*d.value/total).toFixed(2)+"% ("+d.value+")</center>"; });
	}

	var margin = {top: 55, right: 0, bottom: 0, left: 100};


	var od_svg = d3.select("#od_matrix").append("svg")
	    .attr("width", odCellSizeX*matrixSizeX*12 + margin.left + margin.right)
	    .attr("height", odCellSizeY*matrixSizeY + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	//part of the D3.tip library
	od_svg.call(od_tip);
	//add the squares
	//first add squares using empty data that contains every possible combination of origin and destination
	//this is done because the actual data does not have every possible combination
	od_svg.selectAll("rect")
		.data(emptyData)
		.enter()
		.append("rect")
	    .attr("width", odCellSizeX)
	    .attr("height", odCellSizeY)
	    .attr("id", function(d){
	    	return "rect_"+replaceAll(originArray[d.origin], " ", "_")+"_"+replaceAll(destinationArray[d.destination], " ", "_")+"_"+availableYears[d.year];
	    })
	    .attr("x", function(d, i) {
					return d.year * odCellSizeX + d.destination * odCellSizeX * 12; 
	    })
	    .attr("y", function(d, i) {
				return d.origin * odCellSizeY; 
	    })
	    //D3.tip library
	    .on('mouseover', function(d){
	    	od_tip.show(d);
	    	if(currentYear.indexOf(availableYears[d.year]) != -1){
		    	if(currentView === 'Origin'){
					d3.select("#lines_"+replaceAll(originArray[d.origin], " ", "_")+"_"+replaceAll(destinationArray[d.destination], " ", "_")+"_"+currentYear.join("_"))
						.attr("stroke", "#b10026")
						.attr('marker-end', 'url(#arrowHead)');
		    	} else {
					d3.select("#lines_"+replaceAll(originArray[d.destination], " ", "_")+"_"+replaceAll(destinationArray[d.origin], " ", "_")+"_"+currentYear.join("_"))
						.attr("stroke", "#b10026")
						.attr('marker-end', 'url(#arrowHead)');
		    	}
	    	}
	    })
	    .on('mouseout', function(d){
	    	od_tip.hide(d);
	    	if(currentYear.indexOf(availableYears[d.year]) != -1){
		    	if(currentView === 'Origin'){
					d3.select("#lines_"+replaceAll(originArray[d.origin], " ", "_")+"_"+replaceAll(destinationArray[d.destination], " ", "_")+"_"+currentYear.join("_"))
		          		.attr("stroke", gradientRefNameFun)
		          		.attr('marker-end', 'none');
		    	} else {
					d3.select("#lines_"+replaceAll(originArray[d.destination], " ", "_")+"_"+replaceAll(destinationArray[d.origin], " ", "_")+"_"+currentYear.join("_"))
		          		.attr("stroke", gradientRefNameFun)
		          		.attr('marker-end', 'none');
		    	}
	    	}
	    });

    //load the actual data
	od_svg.selectAll("rect")
		.data(dataFixed, function(d){
			return replaceAll(originArray[d.origin], " ", "_")+"_"+replaceAll(destinationArray[d.destination], " ", "_")+"_"+availableYears[d.year];
		})
	    .attr("class", function(d) { return od_scale(d.value); })
	    .exit()
	    //classifies the no data values
	    .attr("class", function(d){
			var sufix;
			if(currentView === 'Origin'){
				sufix = 'O';
			} else{
				sufix = 'D';
			}
			return "odmatrix odmatrix1"+sufix;
    });


	var originText = od_svg.append('g').attr('id','originText');
	var destinationText = od_svg.append('g').attr('id','destinationText');
	var yearText = od_svg.append('g').attr('id','yearText');

	//add the years text
	yearText.selectAll('g').data(destinationArray).enter().append('g').each(function(d,i){
		d3.select(this).selectAll('text').data(availableYears).enter().append("text")
			.attr("x", function(c, j) {
				if(currentView == "Origin"){
					return j * odCellSizeX + i * odCellSizeX*12 + odCellSizeX/2; 
				} else {
					return j * odCellSizeX + i * odCellSizeX*12 + odCellSizeX/2; 
				}
			})
			.attr("y", -5)
			.attr("text-anchor", "middle")
			.attr("font-size", "10")
			.attr('fill', "#B5B6B7")
			//strip the text to only show the final two numbers
			.text(function(c,j){return availableYears[j].substring(2, 4);});
	});

	// add the vertical names
	originText.selectAll('text').data(originArray).enter().append("text")
		.attr("y", function(d, i) {
			return i * odCellSizeY + odCellSizeY/2; 
		})
		.attr("x", -5)
		.attr("text-anchor", "end")
		.attr("font-size", "12")
		.attr('fill', "#B5B6B7")
		.attr('font-weight', 'bold')
		.text(function(d,i){
			//change long names
			if(originArray[i] === 'Dem. Rep. of the Congo'){
				return 'Rep. Congo';
			}
			if(originArray[i] === 'Syrian Arab Rep.'){
				return 'Syria';
			}
			if(originArray[i] === 'Iran (Islamic Rep. of)'){
				return 'Iran';
			}
			if(originArray[i] === 'United Rep. of Tanzania'){
				return 'Tanzania';
			}
			if(originArray[i] === 'United States of America'){
				return 'USA';
			}
			return originArray[i];
		});

		var height;
	originText.append("text")
		.attr("x", -85)
		.attr("y", function(d) {
			height = matrixSizeY*odCellSizeY/2;
			return height;
		})
		.attr("text-anchor", "middle")
		.attr("font-size", "16")
		.attr('fill', "#B5B6B7")
		.attr('font-weight', 'bold')
		.attr("transform", "rotate(270,-85,"+height+")")
		//.style('writing-mode','tb')
		.text(function(d,i){
			return currentView;
		});

	// add the horizontal names
	destinationText.selectAll('text').data(destinationArray).enter().append("text")
		.attr("x", function(d, i) {
			return i * odCellSizeX*12 + odCellSizeX*6;
		})
		.attr("y", -20)
		.attr("text-anchor", "middle")
		.attr("font-size", "12")
		.attr('fill', "#B5B6B7")
		.attr('font-weight', 'bold')
		.text(function(d,i){return destinationArray[i];});

	destinationText.append("text")
		.attr("x", function(d) {
			return matrixSizeX * odCellSizeX*6;
		})
		.attr("y", -40)
		.attr("text-anchor", "middle")
		.attr("font-size", "16")
		.attr('fill', "#B5B6B7")
		.attr('font-weight', 'bold')
		.text(function(d,i){
			if(currentView ==='Origin'){
				return 'Destination';
			} else {
				return 'Origin';
			}
		});

	// add the divisor lines
	od_svg.append("g").attr("id","linesGroup").selectAll("line").data(destinationArray.slice(1))
		.enter().append("line")
		.attr("x1", function(d, i) {
			return 12*odCellSizeX  + i * odCellSizeX*12; 
		})
		.attr("x2", function(d, i) {
			return 12*odCellSizeX  + i * odCellSizeX*12; 
		})
		.attr("y1", 0)
		.attr("y2", matrixSizeY * odCellSizeY)
		.attr("class", "divisor_line");
}


// MAP
//function that builds the Map
//the data is open and this function is called later on in the code
//global variable for selected country
function mapChoropleph(value){
	var colors;
	if(currentView === 'Origin'){
		//colors choropleh
		colors = ['#fcfbfd','#efedf5','#dadaeb','#bcbddc','#9e9ac8','#807dba','#6a51a3','#4a1486'];
	} else{
		colors = ['#fff5eb','#fee6ce','#fdd0a2','#fdae6b','#fd8d3c','#f16913','#d94801','#8c2d04'];
	}


//['#fff7fb','#ece7f2','#d0d1e6','#a6bddb','#74a9cf','#3690c0','#0570b0','#034e7b']
//['#fff7ec','#fee8c8','#fdd49e','#fdbb84','#fc8d59','#ef6548','#d7301f','#990000']

	if(isNaN(value)){
		return colors[0];
	}
	var bounds;

	if(currentData === 'Continent'){
		if(currentView === 'Origin'){
			//calculate bounds for origin choropleph
			bounds = [0,0.0008,0.0056,0.0094,0.2,0.1609,0.3590,0.5241]; //max 0.6310
		} else {
			//calculate bounds for destination
			bounds = [0,0.0410,0.0789,0.1492,0.2,0.2842,0.4549,0.575];	//max 0.6028	
		}
	} else {
		if(currentView === 'Origin'){
			//calculate bounds for origin
			bounds = [0,0.0006,0.0017,0.0048,0.0107,0.0240,0.0471,0.1349]; //max 0.2951
		} else {
			//calculate bounds for destination
			bounds = [0,0.0006,0.0020,0.008,0.0096,0.0181,0.0331,0.0779];	//max 0.1836	
		}
	}
	var position = bounds.length;
	for(var i=1; i<bounds.length;i++){
		if(value>bounds[i-1] && value<bounds[i]){
			position = i;
		}
	}
	return colors[position-1];
}



var selected = '';
var projection;

function prepareData(){
	if(currentData === 'Continent'){
		if(currentView ==='Origin'){
			aggregated = aggregatedData.continent.origin;
		} else {	
			aggregated = aggregatedData.continent.destination;
		}
	} else {
		if(currentView ==='Origin'){
			aggregated = aggregatedData.country.origin;
		} else {	
			aggregated = aggregatedData.country.destination;
		}			
	}
	var merged;
	merged= {};
	currentYear.forEach(function(d){
		for (var key in aggregated[d]) {
		    if(merged[key]){
		    	merged[key].value += aggregated[d][key];
		    	merged[key].number += 1;
		    } else {
		    	merged[key] = {};
		    	merged[key].value = aggregated[d][key];
		    	merged[key].number = 1;
		    }
		}
	});
	var data = {}
	for(var key in merged){
		data[key] = merged[key].value/merged[key].number;
	}

	var sum = 0;
	Object.keys( data ).forEach(function(d){
		sum += data[d];
	});
	return [data,sum];	
}


function changeChoropleth(){
	var data = prepareData();

    d3.select("#countries").selectAll("path")
    		.transition()
      		.duration(animationInterval/2)
            .style("fill", function(d){
            	if(currentData === 'Continent'){
            		return mapChoropleph(data[0][d.properties.CONTINENT]/data[1]);
            	} else {
            		return mapChoropleph(data[0][idToName(d.id)]/data[1]);
            	}
            })
            .style('opacity',0.5);

    d3.select("#countries").selectAll("title")
      .text(function(d) {
		if(currentData === 'Continent'){
			return d.properties.CONTINENT+" - "+(100*data[0][d.properties.CONTINENT]/data[1]).toFixed(2)+"%";
		} else {
			if(data[0][idToName(d.id)]){
				return idToName(d.id)+" - "+(100*data[0][idToName(d.id)]/data[1]).toFixed(2)+"%";
	      	} else {
	      		return idToName(d.id)+" - 0%";
	      	}
		}		
    });	

}
var carto;
var ctrSvg;
function changeCartogram(){
	var data = prepareData();

    var features = carto.features(topo, topo.objects.countries).features;

	var value = function(d) {
		if(data[0][idToName(d.id)]){
			return data[0][idToName(d.id)];
      	} else {
      		return 1;
      	}
	},
      values = features
        .map(value)
        .filter(function(n) {
          return !isNaN(n);
        })
        .sort(d3.ascending),
      lo = values[0],
      hi = values[values.length - 1];

	var scale = d3.scale.linear()
		.domain([lo, hi])
		.range([1, 1000]);

	carto.value(function(d) {
		return scale(value(d));
	});
    // generate the new features, pre-projected
      features = carto(topo, topo.objects.countries).features;

      ctrSvg = ctrSvg.data( features );
      
      var centroids = {};

      ctrSvg.transition()
          .duration(animationInterval/2)
          .ease("linear")
          .attr("d", carto.path)
			.style("fill", function(d){
				return mapChoropleph(data[0][idToName(d.id)]/data[1]);
				 })
		.style('opacity',0.5);

    d3.select("#countries").selectAll("title")
      .text(function(d) {
		if(currentData === 'Continent'){
			return d.properties.CONTINENT+" - "+(100*data[0][d.properties.CONTINENT]/data[1]).toFixed(2)+"%";
		} else {
			if(data[0][idToName(d.id)]){
				return idToName(d.id)+" - "+(100*data[0][idToName(d.id)]/data[1]).toFixed(2)+"%";
	      	} else {
	      		return idToName(d.id)+" - 0%";
	      	}
		}		
    });	 

  // if(typeOfLine != "none"){
	 // d3.select("#countries").selectAll("path")
		// .each(function(d){
		// 	var centroid = path.centroid(d);
		// 	if(!isNaN(centroid[0]) && !isNaN(centroid[1])){
		// 		centroids[idToName(d.id)] = centroid;
		// 	}
		// });

  //  	 d3.selectAll("path.lines")    
  //     .attr("d", function(d) { //curved, svgflowline, //animated
  //     	var x,y;
  //     	if(centroids[d.origin] && centroids[d.destination]){
	 //      	x = centroids[d.origin];
	 //      	y = centroids[d.destination];
  //     	} else {
  //     		x = projection(d.source);
  //     		y = projection(d.target);
  //     	}
  //     	return line([x,y]);
  //  //      if(typeOfLine == 'svgflowline'){
		// 	// return flowLine(line([x,y]),arcWidth(d.value));
  //  //    	} else {
  //  //    		return createArcs(line([x,y]));
  //  //    	}
  //     });
  // }


}

function idToName(id){
	var test = {
	 "name": [ "-99", "AE", "AF", "AG", "AL", "AM", "AO", "AQ", "AR", "AT", "AU", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BN", "BO", "BR", "BS", "BT", "BW", "BY", "BZ", "CA", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FR", "GA", "GB", "GE", "GF", "GH", "GL", "GM", "GN", "GP", "GQ", "GR", "GT", "GU", "GW", "GY", "HK", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IQ", "IR", "IS", "IT", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KP", "KR", "KW", "KZ", "LA", "LB", "LC", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MD", "ME", "MG", "MH", "MK", "ML", "MM", "MN", "MP", "MR", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SI", "SK", "SL", "SN", "SO", "SR", "SS", "ST", "SV", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "US", "UY", "UZ", "VA", "VC", "VE", "VI", "VN", "VU", "WF", "WS", "XK", "YE", "YT", "ZA", "ZM", "ZW" ],
	"fullname": [ "Null", "United Arab Emirates", "Afghanistan", "Antigua and Barbuda", "Albania", "Armenia", "Angola", "Antarctica", "Argentina", "Austria", "Australia", "Azerbaijan", "Bosnia and Herzegovina", "Barbados", "Bangladesh", "Belgium", "Burkina Faso", "Bulgaria", "Bahrain", "Burundi", "Benin", "Brunei Darussalam", "Bolivia, Plurinational State of", "Brazil", "Bahamas", "Bhutan", "Botswana", "Belarus", "Belize", "Canada", "Dem. Rep. of the Congo", "Central African Republic", "Congo", "Switzerland", "Côte d'Ivoire", "Cook Islands", "Chile", "Cameroon", "China", "Colombia", "Costa Rica", "Cuba", "Cape Verde", "Curaçao", "Cyprus", "Czech Republic", "Germany", "Djibouti", "Denmark", "Dominica", "Dominican Republic", "Algeria", "Ecuador", "Estonia", "Egypt", "Western Sahara", "Eritrea", "Spain", "Ethiopia", "Finland", "Fiji", "Falkland Islands", "Micronesia", "France", "Gabon", "United Kingdom", "Georgia", "French Guiana", "Ghana", "Greenland", "Gambia", "Guinea", "Guadeloupe", "Equatorial Guinea", "Greece", "Guatemala", "Guam", "Guinea-Bissau", "Guyana", "Hong Kong", "Honduras", "Croatia", "Haiti", "Hungary", "Indonesia", "Ireland", "Israel", "Isle of Man", "India", "Iraq", "Iran (Islamic Rep. of)", "Iceland", "Italy", "Jamaica", "Jordan", "Japan", "Kenya", "Kyrgyzstan", "Cambodia", "Kiribati", "Comoros", "Korea, Democratic People's Republic of", "Korea, Republic of", "Kuwait", "Kazakhstan", "Laos", "Lebanon", "Saint Lucia", "Sri Lanka", "Liberia", "Lesotho", "Lithuania", "Luxembourg", "Latvia", "Libya", "Morocco", "Moldova", "Montenegro", "Madagascar", "Marshall Islands", "Macedonia", "Mali", "Myanmar", "Mongolia", "Northern Mariana Islands", "Mauritania", "Malta", "Mauritius", "Maldives", "Malawi", "Mexico", "Malaysia", "Mozambique", "Namibia", "New Caledonia", "Niger", "Norfolk Island", "Nigeria", "Nicaragua", "Netherlands", "Norway", "Nepal", "Nauru", "Niue", "New Zealand", "Oman", "Panama", "Peru", "French Polynesia", "Papua New Guinea", "Philippines", "Pakistan", "Poland", "Puerto Rico", "Palestinian", "Portugal", "Palau", "Paraguay", "Qatar", "Réunion", "Romania", "Serbia", "Russian Federation", "Rwanda", "Saudi Arabia", "Solomon Islands", "Seychelles", "Sudan", "Sweden", "Singapore", "Slovenia", "Slovakia", "Sierra Leone", "Senegal", "Somalia", "Suriname", "South Sudan", "São Tomé and Príncipe", "El Salvador", "Syrian Arab Rep.", "Swaziland", "Turks and Caicos Islands", "Chad", "French Southern Territories", "Togo", "Thailand", "Tajikistan", "Tokelau", "East Timor", "Turkmenistan", "Tunisia", "Tonga", "Turkey", "Trinidad and Tobago", "Tuvalu", "Taiwan", "United Rep. of Tanzania", "Ukraine", "Uganda", "United States of America", "Uruguay", "Uzbekistan", "Vatican City", "Saint Vincent and the Grenadines", "Venezuela, Bolivarian Republic of", "U.S. Virgin Islands", "Viet Nam", "Vanuatu", "Wallis and Futuna", "Samoa", "Kosovo", "Yemen", "Mayotte", "South Africa", "Zambia", "Zimbabwe" ]}

	var fixedId = test.name.indexOf(id);
	if(fixedId != -1){
		return test.fullname[fixedId];
	} else{
		return -1;
	}
}

function baseMap(base){
	var data;

	var margin = {top: 10, left: 10, bottom: 10, right: 10};
	var width = parseInt(d3.select('#map').style('width'));
	width = width - margin.left - margin.right;
	var mapRatio = 0.5;
	var height = width * mapRatio;

	var svg = d3.select("#map")
			.append("svg")
			.attr("width",width)
			.attr("height",height)
			.attr("id","baseMap");

    projection = d3.geo.mercator()
    				.translate([width/2 -width/10, height/2])
    				.scale(width/10);

    path = d3.geo.path()
            .projection(projection);

	if(currentData === 'Country'){
	    carto = d3.cartogram()
	        .projection(projection)
	        .properties(function (d) {
	            return d.properties;
	        });
		data = carto.features(base, base.objects.countries).features;
	} else {
		data = base.features;
	}

    var countries = svg.append("g").attr("id", "countries");

    ctrSvg = countries.selectAll("path")
            .data(data)
            .enter()
            .append("path")
            .attr("class", function(d){
            		return 'mapBackground';
            })
            .attr("d", path)
            .attr("id", function(d){
            	if(currentData === 'Continent'){
            		return d.properties.CONTINENT;
            	} else {
            		return replaceAll(idToName(d.id)," ","_");
            	}
            })
            .on('mouseover',highlightCountry)
            .on('mouseout', clearHighlight)
            .on("click",selectCountry);

    ctrSvg.append("svg:title")
      .text(function(d) {
		if(currentData === 'Continent'){
			return d.properties.CONTINENT;
		} else {
			return idToName(d.id);
		}
    });	

    //interaction with the Stacked bar graph   
    function selectCountry(d){
    	var elementId;
    	if(currentData === 'Continent'){
    		elementId = d.properties.CONTINENT;
    	} else {
    		elementId = idToName(d.id);
    	}

    	//if the country is already selected
    	if(selected === elementId){
    		if(typeOfBackground == 'normal'){
	            d3.select(this)
	              .attr("class", 'mapBackground');
			} else {
	            d3.select(this).classed("mapBorder", false).classed("mapBorderHigh", false)
			}
            //clear all in the Stacked Bar Graph
    		chart.show();
    		//nothing is selected
    		selected = '';

    		//turns all lines visible
    		loadMap(null,null);

    	} else { //if is a different country being selected
    		//clear selected countries
    		if(typeOfBackground == 'normal'){
	            countries.selectAll("path.mapBackgroundSelect")
	              .attr("class", 'mapBackground');

	            //change color of the current country
	            d3.select(this)
	              .attr("class", 'mapBackgroundSelect');
            } else {
	            countries.selectAll("path.mapBorder")
	              .classed("mapBorder", false).classed("mapBorderHigh", false);
	            d3.select(this).classed("mapBorder", true);
			}

    		//interaction with bar chart
	        if(currentData === 'Continent'){
	    		chart.hide();
	        	chart.show([d.properties.CONTINENT]);
	        	selected = d.properties.CONTINENT;
	        } else {
			    selected = idToName(d.id);
	        	if(currentView === 'Origin'){
		        	if(countryOriginSource.indexOf(selected) !== -1){
		        		chart.hide();
			        	chart.show([selected]);
		        	} else {
		        		chart.show();
		        	}
	        	} else {
		        	if(countryDestinationSource.indexOf(selected) !== -1){
		        		chart.hide();
			        	chart.show([selected]);
		        	} else {
		        		chart.show();
		        	}
	        	}
	        }
	        //just turn the correspondent lines visible
	        if(currentView === 'Origin'){
	        	loadMap([selected],null);	        	
	        } else {
	        	loadMap(null,[selected]);
	        }

    	}
    	//highlight the year in the updated stacked bar graph
    	highlightYear();
    }

    function clearHighlight(d){
    	if(typeOfBackground == 'normal'){
	        if(d3.select(this).classed('mapBackgroundSelect') === false){
		            d3.select(this)
		              .attr("class", 'mapBackground');
	        }
    	} else {
	        if(d3.select(this).classed('mapBorder') === false){
		            d3.select(this)
		              .classed("mapBorderHigh", false);
	        }    		
    	}

    	chart.focus();

		d3.selectAll("rect.odmatrix")
			.classed("odHighlight", false);
    }

    function highlightCountry(d){
    	//highlight the country
    	if(typeOfBackground == 'normal'){
	        if(d3.select(this).classed('mapBackgroundSelect') === false){
	            d3.select(this)
	              .attr("class", 'mapBackgroundHighlight');
	        }
	    } else {
	        if(d3.select(this).classed('mapBorder') === false){
		            d3.select(this)
		              .classed("mapBorderHigh", true);
	        }    		
    	}

        //highlight the stacked bar graph
        var id;
        if(currentData === 'Continent'){
        	id = d.properties.CONTINENT;
    		chart.focus([id]);
        } else {
        	id = idToName(d.id);
        	if(currentView === 'Origin'){
	        	if(countryOriginSource.indexOf(id) !== -1){
	    			chart.focus([id]);
	        	}
        	} else {
	        	if(countryDestinationSource.indexOf(id) !== -1){
	    			chart.focus([id]);
	        	}	
        	}
        }

        //highlight the od matrrix
		d3.selectAll("rect.odmatrix")
			.filter(function(c){
				if(currentData === 'Continent'){
						return continentElements[c.origin] === id;
				} else {
					if(currentView === 'Origin'){
						return countryOriginSource[c.origin] === id;
					} else {
						return countryDestinationSource[c.origin] === id;
					}
				}
			})
			.classed("odHighlight", true);
    }
}

    //curved
    function createArcs(path){
    	var x1 = parseFloat(path.split("L")[0].substring(1).split(",")[0]);
    	var y1 = parseFloat(path.split("L")[0].substring(1).split(",")[1]);
    	var x2 = parseFloat(path.split("L")[1].split(",")[0]);
    	var y2 = parseFloat(path.split("L")[1].split(",")[1]);
    	var ax1 = 0;
    	var ay1 = 0;
    	var ax2 = 0;
    	var ay2 = 0;

    	var dx = 70;
    	var dy = 70;

    	var distance = Math.sqrt(Math.pow(x1-x2,2)+Math.pow(y1-y2,2));
    	//only create a bezier if the distance is long enough
    	if(distance>100){
	    	if(x2>x1){
	    		if(y2>y1){
	    			ax1 = (x1+x2)/2 - dx;
	    			ay1 = (y1+y2)/2 + dy;
	    		} else {
	    			ax1 = (x1+x2)/2 + dx;
	    			ay1 = (y1+y2)/2 + dy;
	    		}
	    	}
	    	else {
	    		if(y2>y1){
	    			ax1 = (x1+x2)/2 + dx;
	    			ay1 = (y1+y2)/2 - dy;
	    		} else {
	    			ax1 = (x1+x2)/2 - dx;
	    			ay1 = (y1+y2)/2 - dy;
	    		}        	
	    	}

	    	path = "M"+x1+","+y1+"Q"+ax1+","+ay1+" "+x2+","+y2;
    	}

    	return path;
    }
    //svgflowline
	function perpendicularSegment(a, b, length, p) {
	  var d, u, v, vnorm;
	  v = [b[0] - a[0], b[1] - a[1]];
	  vnorm = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
	  u = [v[0] / vnorm, v[1] / vnorm];
	  u = [-u[1], u[0]];
	  d = [u[0] * length / 2, u[1] * length / 2];
	  return [[+p[0] + d[0], +p[1] + d[1]], [+p[0] - d[0], +p[1] - d[1]]];
	}

	function vsubtract(a, b) {
	  return [a[0] - b[0], a[1] - b[1]];
	}

	function norm(v) {
	  return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
	}

	var gap = 1;
	var arrowheadLength = 2;  // as ratio of the thickness
	var arrowheadWidth = 0.75;

	function pointBetween(a, b, distFromB) {
	  var d, len, normalized;
	  d = vsubtract(a, b);
	  len = norm(d);
	  normalized = [d[0] / len, d[1] / len];
	  return [b[0] + distFromB * normalized[0], b[1] + distFromB * normalized[1]];
	}

	function flowLine(path, thickness, shortenOriginBy, shortenDestBy) {
		//adapted from https://github.com/ilyabo/svg-flowline
	var x1 = parseFloat(path.split("L")[0].substring(1).split(",")[0]);
	var y1 = parseFloat(path.split("L")[0].substring(1).split(",")[1]);
	var x2 = parseFloat(path.split("L")[1].split(",")[0]);
	var y2 = parseFloat(path.split("L")[1].split(",")[1]);

	var origin = [x1,y1];
	var dest = [x2,y2];

	  var a, b, p0, p1, p2, p3, p4, p_, len;
	  if (shortenOriginBy == null) {
	    shortenOriginBy = 6;
	  }
	  if (shortenDestBy == null) {
	    shortenDestBy = 6;
	  }
	  a = origin; b = dest;
	  b = pointBetween(a, b, shortenDestBy);
	  a = pointBetween(b, a, shortenOriginBy);
	  p0 = perpendicularSegment(a, b, gap * 2, a)[1];
	  p1 = perpendicularSegment(a, b, (gap + 2*thickness) * 2, a)[1];
	  p_ = perpendicularSegment(a, b, (gap + 2*thickness) * 2, b)[1];

	  len = norm(vsubtract(p1, p_));

	  p2 = pointBetween(p1, p_, Math.min(arrowheadLength * thickness, len * 0.7));  // the arrow head shouldn't be longer
	                                                                            // than 0.7 of the arrow length
	  p3 = perpendicularSegment(p1, p_, thickness * 2 * arrowheadWidth, p2)[1];
	  p4 = perpendicularSegment(a, b, gap * 2, b)[1];
  	  return 'M' + p0[0] + ',' + p0[1] + ' L' + p1[0] + ',' + p1[1] + ' L' + p2[0] + ',' + p2[1] + ' L' + p3[0] + ',' + p3[1] + ' L' + p4[0] + ',' + p4[1] + ' Z';
	}

function mapLines(maxMagnitude,originaLinks,origin,destination){

	var mergedlinks = [];
	currentYear.forEach(function(d){
		var filtered = originaLinks[d].filter(function(e){
			if(origin === null && destination === null){
				return true;
			}
			if(origin !== null && destination === null){
				if(origin.indexOf(e.origin) != -1){
					return true;
				} else {
					return false;
				}
			}
			if(origin === null && destination !== null){
				if(destination.indexOf(e.destination) != -1){
					return true;
				} else {
					return false;
				}
			}
			if(origin !== null && destination !== null){
				if(origin.indexOf(e.origin) != -1 && destination.indexOf(e.destination) != -1){
					return true;
				} else {
					return false;
				}
			}			
		});
		mergedlinks = mergedlinks.concat(filtered);
	});

	var fixedlinks = [];
	mergedlinks.forEach(function(d){
		var found = -1;
		fixedlinks.every(function(e,i){
			if(e.origin === d.origin && e.destination === d.destination){
				found = i;
				return false;
			}
			return true;
		});
		if(found != -1){
			var foundLink = $.extend({}, d);
			foundLink.value += fixedlinks[found].value;
			foundLink.number = fixedlinks[found].number + 1;
			fixedlinks[found] = foundLink;
		} else {
			var aux = $.extend({}, d);
			aux.number = 1;
			fixedlinks.push(aux);
		}
	});

	for(var i=0; i<fixedlinks.length;i++){
		fixedlinks[i].value= fixedlinks[i].value/fixedlinks[i].number;
	}

	var links = fixedlinks.filter(function(obj){
		return obj.value >= minimumRefugees;
	});

	var svg = d3.select("#baseMap");

    // var path = d3.geo.path()
    //         .projection(projection);

    line = d3.svg.line();

    //show the lines as curves. If false will show straight lines
    var arcs = svg.append("g").attr("id", "arcs");

    function arcWidth(value){
    	var bounds;
	    if(currentData === 'Continent'){
	    	bounds = [2755,19580,53231,132501,244264,335761,473006,602217];
	    } else {
	    	bounds = [2462,16744,50853,133454,299891,597821,1166179,2034416];
	    }
		var position = 1;
		for(var i=1; i<bounds.length;i++){
			if(value>=bounds[i-1] && value<=bounds[i]){
				position = i+1;
			}
		}

	    if(currentData === 'Continent'){
			switch(position) {
			    case 1:
			        return 2;
			    case 2:
			        return 5;
			    case 3:
			        return 7;
			    case 4:
			        return 9;
			    case 5:
			        return 11;
			    case 6:
			        return 13;
			    case 7:
			        return 15;
			    case 8:
			        return 17;		        		        
			}
	    } else {
			switch(position) {
			    case 1:
			        return 2;
			    case 2:
			        return 3;
			    case 3:
			        return 4;
			    case 4:
			        return 6;
			    case 5:
			        return 8;
			    case 6:
			        return 10;
			    case 7:
			        return 13;
			    case 8:
			        return 16;		        		        
			}
	    }		


    }

    // if(currentData === 'Continent'){
    // 	arcWidth = d3.scale.linear().domain([1, maxMagnitude]).range([3, 100]);
    // } else {
    // 	arcWidth = d3.scale.linear().domain([1, maxMagnitude]).range([2.5, 10]);    	
    // }

    //gradient color in lines
    if(typeOfLine === 'animated' || typeOfLine === 'curved'){
	    var minColor = '#f0f0f0';
	    var maxColor;
	    if(currentView === 'Origin'){
		    maxColor = 'rgb(8, 48, 107)';
	    } else {
		    maxColor = '#8A1E2F';    	
	    }
	    var arcColor = d3.scale.log().domain([1, maxMagnitude]).range([minColor, maxColor]);
	    var strokeFun = function(d) { return arcColor(d.value); };
	    var defs = svg.append("svg:defs");
	    // see http://apike.ca/prog_svg_patterns.html
	    defs.append("marker")
			.attr("id", "arrowHead")
			.attr("viewBox", "0 0 10 10")
			.attr("refX", 5)
			.attr("refY", 5)
			.attr("orient", "auto")
			.attr("markerUnits", "strokeWidth")
			//.attr("markerUnits", "userSpaceOnUse")
			.attr("markerWidth", 5)
			.attr("markerHeight", 3)
				.append("polyline")
				.attr("points", "0,0 10,5 0,10 1,5")
				.attr("fill", '#b10026')
			//.attr("opacity", 0.5)
			;

	    var gradient = defs.selectAll("linearGradient")
			.data(links)
			.enter()
			.append("svg:linearGradient")
				.attr("id", gradientNameFun)
				.attr("gradientUnits", "userSpaceOnUse")
				.attr("x1", function(d) { return projection(d.source)[0]; })
				.attr("y1", function(d) { return projection(d.source)[1]; })
				.attr("x2", function(d) { return projection(d.target)[0]; })
				.attr("y2", function(d) { return projection(d.target)[1]; });

			gradient.append("svg:stop")
				.attr("offset", "0%")
				.attr("stop-color", minColor)
				.attr("stop-opacity", 0.5);
			gradient.append("svg:stop")
				.attr("offset", "60%")
				.attr("stop-color", strokeFun)
				.attr("stop-opacity", 1.0);
			gradient.append("svg:stop")
				.attr("offset", "100%")
				.attr("stop-color", strokeFun)
				.attr("stop-opacity", 1.0);
    }

    arcNodes = arcs.selectAll("path.lines")
      .data(links)
      .enter().append("path")
      .attr("class",function(d){
      	if(typeOfLine == 'svgflowline'){
      		return "lines flowline"; 
      	} else if(typeOfLine == 'animated'){
      		return "lines linesMovement";       		
      	} else {
      		return "lines";
      	}
      })
      .attr("stroke", function(d){
      	if(typeOfLine == 'svgflowline'){
      		return "white"; 
      	} else {
      		return gradientRefNameFun(d);       		
      	}      	
      })
      .attr('stroke-dasharray', function(d){
      	if(typeOfLine == 'svgflowline'){
      		return null; 
      	} else {
      		return '15, 5, 5, 10';       		
      	}
      })
      .attr("stroke-linecap", "round")
      .attr("stroke-width", function(d) { 
      	if(typeOfLine == 'svgflowline'){
      		return 0.5; 
      	} else {
      		return arcWidth(d.value);       		
      	}
      })
		.attr("id", function(d){
			return "lines_"+replaceAll(d.origin," ","_")+"_"+replaceAll(d.destination," ","_")+"_"+currentYear.join("_");
		})
      .attr("d", function(d) { //curved, svgflowline, //animated
        if(typeOfLine == 'svgflowline'){
			return flowLine(line([projection(d.source),projection(d.target)]),arcWidth(d.value));
      	} else {
      		return createArcs(line([projection(d.source),projection(d.target)]));
      	}
      })
      .sort(function(d1, d2) {
        var a = d1.value, b = d2.value;
        if (isNaN(a)) if (isNaN(b)) return 0; else return -1; if (isNaN(b)) return 1;
        return d3.ascending(a, b); 
      });

    arcNodes.on("mouseover", function(d) { 
    	//add arrow and change colors
      	if(typeOfLine == 'svgflowline'){
			d3.select(this)
				.style("fill", "#b10026");
      	} else {
			d3.select(this)
				.attr("stroke", "#b10026")
				.attr('marker-end', 'url(#arrowHead)');
      	}
		//put the element on top
		this.parentNode.appendChild(this);

		//highlight the cell in OD-matrix
		var cells;
		currentYear.forEach(function(year){
			if(currentData === 'Continent'){
				if(currentView === 'Origin'){
					cells = d3.select("#rect_"+d.origin+"_"+d.destination+"_"+year);
					cells.classed("odHighlight", true);
					cells.node().parentNode.appendChild(cells.node());
				} else {
					cells = d3.select("#rect_"+d.destination+"_"+d.origin+"_"+year);
					cells.classed("odHighlight", true);
					cells.node().parentNode.appendChild(cells.node());
				}
			} else {
				if(currentView === 'Origin'){
					if(countryOriginSource.indexOf(d.origin)!==-1 && countryOriginTarget.indexOf(d.destination)!==-1){
						cells = d3.select("#rect_"+replaceAll(d.origin, " ", "_")+"_"+replaceAll(d.destination, " ", "_")+"_"+year);
						cells.classed("odHighlight", true);
						cells.node().parentNode.appendChild(cells.node());
					}
				} else {
					if(countryDestinationSource.indexOf(d.destination)!==-1 && countryDestinationTarget.indexOf(d.origin)!==-1){
						cells = d3.select("#rect_"+replaceAll(d.destination, " ", "_")+"_"+replaceAll(d.origin, " ", "_")+"_"+year);
						cells.classed("odHighlight", true);
						cells.node().parentNode.appendChild(cells.node());
					}
				}
			}
		});
    });
    arcNodes.on("mouseout", function(d) {
        if(typeOfLine == 'svgflowline'){
	        d3.select(this)
	          .style("fill", "rgb(8, 48, 107)");
      	} else {
	        d3.select(this)
	          .attr("stroke", gradientRefNameFun)
	          .attr('marker-end', 'none');
      	}

		currentYear.forEach(function(year){
			if(currentView === 'Origin'){
				d3.select("#rect_"+replaceAll(d.origin, " ", "_")+"_"+replaceAll(d.destination, " ", "_")+"_"+year)
					.classed("odHighlight", false);
			} else {
				d3.select("#rect_"+replaceAll(d.destination, " ", "_")+"_"+replaceAll(d.origin, " ", "_")+"_"+year)
					.classed("odHighlight", false);
			}
		});

		var lines = d3.select("#linesGroup");
		lines.node().parentNode.appendChild(lines.node());
	});

    arcNodes.append("svg:title")
      .text(function(d) {
      	if(currentYear.length >1){
        return d.origin+" -> "+d.destination+"\n"+
	               "Refugees in " +currentYear[0]+"-"+currentYear[currentYear.length-1]+": " +Math.round(d.value); 
      	} else {
	        return d.origin+" -> "+d.destination+"\n"+
	               "Refugees in " +currentYear[0]+": " +Math.round(d.value); 
      		
      	}
    });
}

//Time slider
var brush;
function timeSlider(){
	//resets the current year to 2014;
	currentYear = ['2014'];
	$("#time_slider > svg").remove();

	var margin = {top: 30, right: 0, bottom: 0, left: 0},
	    width = 500 - margin.left - margin.right,
	    height = 65 - margin.top - margin.bottom;

	var x = d3.scale.linear()
	    .range([0, width])
	    .domain([2003,2015]);

	var svg = d3.select("#time_slider").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return "<center><span style='color:steelblue'>Total number: </span><strong>"+d.value+"</strong></center>"; });
	svg.call(tip);

	var timeScale = svg.selectAll("g")
		.data(worldData)
		.enter()
		.append("g")
	    .attr("class","yearsGroup")
		    .append("rect")
		    .attr("class", function(d){
		    	var bounds = [0,9358826,10251584,10375654];
				var position = bounds.length;
				for(var i=1; i<bounds.length;i++){
					if(d.value>bounds[i-1] && d.value<bounds[i]){
						position = i;
					}
				}
				if(!aggregateTime && d.year == currentYear[0]){
					return "world"+position+" selectedYear";
				} else {
		    		return "world"+position;
				}
		    })
			.attr("x", function(d, i) {
				return i * width/12; 
			})
			.attr("y", 0)
		    .attr("width", width/12)
		    .attr("height", height)
		    .attr("id",function(d){
		    	return "time"+d.year;
		    })
		    .on("click",function(d){
		    	if(!aggregateTime){
		    		selectYear(d.year);
		    	} else {
		    		return null;
		    	}
		    })
		    .on('mouseover',tip.show)
		    .on('mouseout', tip.hide);


	svg.selectAll(".yearsGroup")
		.data(worldData)
    	.append("text")
		.attr("x", function(d, i) {
			return i * width/12 + width/24; 
		})
		.attr("y", -5)
		.attr("text-anchor", "middle")
		.attr("font-size", "12")
		.attr('fill', "#B5B6B7")
		.attr('font-weight', 'bold')
		.text(function(d,i){return d.year;});

	function selectYear(d){
		if(currentYear[0] !== d){
	    	currentYear[0] = d;
	    	if(playing){
	    		stopTimer();
	    	}
	  		changeYear();
		}
	}


	function brushed() {
	  var extent0 = brush.extent(),
	      extent1;

	  // if dragging, preserve the width of the extent
	  if (d3.event.mode === "move") {
	    var d0 = Math.round(extent0[0]),
	        d1 = d0 + Math.round((extent0[1] - extent0[0]));
	    extent1 = [d0, d1];
	  }

	  // otherwise, if resizing, round both dates
	  else {
	    extent1= [Math.round(extent0[0]), Math.round(extent0[1])];

	    // if empty when rounded, use floor & ceil instead
	    if (extent1[0] >= extent1[1]) {
	      extent1[0] = Math.floor(extent0[0]);
	      extent1[1] = Math.ceil(extent0[1]);
	    }
	  }


		currentYear = [String(extent1[0])];
		for(var i=1; i<extent1[1]-extent1[0]; i++){
			currentYear.push(String(extent1[0]+i));
		}
		var $this = $(this);
		clearTimeout($this.data('timer'));
		$this.data('timer', setTimeout(function(){
			changeYear();
		}, 200));	   
	}

	if(aggregateTime){
		brush = d3.svg.brush()
		    .x(x)
		    .extent([2014, 2015])
		    .on("brush", brushed);

		var gBrush = svg.append("g")
		    .attr("class", "brush")
		    .call(brush);

		gBrush.selectAll("rect")
		    .attr("height", height);
	}
}

function highlightYear(){
	//hightlight in stacked bar graph
	$(".tick > text > tspan").css('font-weight', 'normal').css('font-size', '10px').css('fill','#B5B6B7');
	$("#yearText > g > text").css('font-weight', 'normal').css('font-size', '10px').css('fill','#B5B6B7');
	currentYear.forEach(function(year){
		$(".tick > text > tspan:contains('"+year+"')").css('font-weight', 'bold').css('font-size', '12px').css('fill','#b10026');
		//hightligh in the OD matrix
		$("#yearText > g > text:contains('"+year.substring(2, 4)+"')").css('font-weight', 'bold').css('font-size', '12px').css('fill','#b10026');
	});

}

function changeYear(){
	if(!aggregateTime){
		d3.selectAll('.selectedYear').classed('selectedYear', false);
		d3.select('#time'+currentYear[0]).classed('selectedYear', true);

	} else {
		d3.selectAll(".brush").call(brush.extent([currentYear[0],String(parseInt(currentYear[currentYear.length-1])+1)]));
	}

	highlightYear();

	if(typeOfBackground === 'choropleth'){
		changeChoropleth();
	} else if(typeOfBackground === 'cartogram') {
		changeCartogram();
	}

	if(selected !== ''){
        if(currentView === 'Origin'){
        	loadMap([selected],null);	        	
        } else {
        	loadMap(null,[selected]);
        }
	} else {
        	loadMap(null,null);
	}

	//when change year maintain selection
	if(selected !== ''){
        d3.selectAll("path.lines").attr("visibility", function(d){
            //filter lines
            if(currentView === 'Origin'){
            	if(d.origin != selected){
            		return "hidden";
            	} else {
            		return "visible";
            	}
            } else {
            	if(d.destination != selected){
            		return "hidden";
            	} else {
            		return "visible";
            	}           	
            }
        	
        });
	}
}

//global variables to manage animation
var playing = false;
var timer;

function stopTimer(){
	clearInterval(timer);
	playing = false;
	$( "#playnBtn > span" ).toggleClass('glyphicon-play');
	$( "#playnBtn > span" ).toggleClass('glyphicon-pause');
}

$( "#playnBtn" ).click(function() {
	$( "#playnBtn > span" ).toggleClass('glyphicon-play');
	$( "#playnBtn > span" ).toggleClass('glyphicon-pause');
	if(currentYear[currentYear.length-1] == '2014'){
		var length = currentYear.length;
		currentYear = ['2003'];
		for(var i=1; i<length; i++){
			currentYear.push(String(2003+i));
		}		
		changeYear();
	}

	if(playing){
		playing = false;
		clearInterval(timer);
	} else {
        timer = setInterval(function(){   // set a JS interval
          if(parseInt(currentYear[currentYear.length-1]) <= parseInt(availableYears[availableYears.length-1])-currentYear.length) {
          	for(var i=0; i<currentYear.length; i++){
              currentYear[i] = String(parseInt(currentYear[i])+currentYear.length);  // increment the current attribute counter
          	}
          } else {
          	stopTimer();
          }
          changeYear();  // update the representation of the map 
        }, animationInterval);

		playing = true;
	}

});

//legend for odmatrix
function legendOdMatrix(element,domain,range,max,sum){
	//caption is not in use
	$("#odMatrixLegendSvg").remove();

	var margin = {top: 0, right: 0, bottom: 20, left: 10},
	    width = 60*(domain.length+1)+300 - margin.left - margin.right,
	    height = 50 - margin.top - margin.bottom;

	var svg = d3.select(element).append("svg").attr("id","odMatrixLegendSvg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom);

	var g = svg.append("g")
	    .attr("class", "key")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var groups = g.selectAll("rect")
	    .data(domain)
	  .enter().append("g")
	  	.attr("class","odLegendGroup")
	  	.append("rect")
	    .attr("height", 15)
	    .attr("x", function(d,i) {
	     return 60*i; })
	    .attr("width", 60)
	    .style("fill", function(d,i) { return range[i]; });

	domain.push(max);

	 g.selectAll(".odLegendGroup").selectAll("text")
	 	.data(domain)
	 	.enter()
	 	.append("text")
		.attr("y", 30)
	    .attr("x", function(d,i) {
	     return 60*i; })
	    .attr("text-anchor", "middle")
		.attr("font-size", "12")
		.attr('fill', "#B5B6B7")
		.attr('font-weight', 'bold')
		.text(function(d,i){return (100*d/sum).toFixed(2)+"%";});

	g.selectAll(".odLegendGroup").append("text")
	    .attr("y", 12)
	    .attr("x", function(d){
	    	return 60*(domain.length-1)+10;
	    })
	    .attr("text-anchor", "left")
		.attr("font-size", "14")
		.attr('fill', "#B5B6B7")
	    .text("Percentage of refugee population based on "+currentView);
}

//legend for Choropleph
function legendChoropleph(element,domain,range,max){
	//caption is not in use
	$("#choroplephLegendSvg").remove();
	var size = 50;
	var margin = {top: 0, right: 0, bottom: 20, left: 10},
	    width = size*(domain.length+1) - margin.left - margin.right,
	    height = 55 - margin.top - margin.bottom;

	var svg = d3.select(element).append("svg").attr("id","choroplephLegendSvg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom);

	var g = svg.append("g")
	    .attr("class", "key")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	var groups = g.selectAll("rect")
	    .data(domain)
	  .enter().append("g")
	  	.attr("class","choroLegendGroup")
	  	.append("rect")
	    .attr("height", 15)
	    .attr("x", function(d,i) {
	     return size*i; })
	    .attr("width", size)
	    .style("fill", function(d,i) { return range[i]; })
	    .style('opacity', 0.5);

	domain.push(max);

	 g.selectAll(".choroLegendGroup").selectAll("text")
	 	.data(domain)
	 	.enter()
	 	.append("text")
		.attr("y", 30)
	    .attr("x", function(d,i) {
	     return size*i; })
	    .attr("text-anchor", "middle")
		.attr("font-size", "12")
		.attr('fill', "#B5B6B7")
		.attr('font-weight', 'bold')
		.text(function(d,i){return (100*d).toFixed(2)+"%";;});

	g.select(".choroLegendGroup").append("text")
	    .attr("y", 50)
	    .attr("x", function(d){
	    	return size*(domain.length-1)/2;
	    })
	    .attr("text-anchor", "middle")
		.attr("font-size", "14")
		.attr('fill', "#B5B6B7")
	    .text("Percentage of refugee population based on "+currentView);
}
