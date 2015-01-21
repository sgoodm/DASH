// ++
// ++ js for DASH
// ++

$(document).ready(function () {

	//	pending and submission data objects
	var s, p = {
		method:"",
		country:"",
		continent:"",
		adm:"",
		adm_alt:"",
		rasters:[],
		weights_obj:{},
		weights:[],
		files_obj:{},
		files:[],
		id:""
	};

	//dynamic point info data
	var d = {
		type:"",
		start_year:2005,
		end_year:2010
	};

	// stores info on current options loaded in ui (raster file paths, selected options, valid selections)
	var temp = {
		rasters: {},
		weights: {},
		gapanalysis: {},
		valid: {
			weights:false,
			gapanalysis:false
		}
	};

	// select element class names for each method
	var selectors = {
		weights:"ro",
		gapanalysis:"ga"
	}

	var continent_list = {
		"Nepal":"Asia",
		"Uganda":"Africa",
		"Malawi":"Africa"
	};

	// messages
	var m = {
		init:"<p>Welcome to AidData - - DASH - -</p><p>To start, please select the country and the administrative level you would like to explore.</p><p>(You can change these later.)</p>",
		method:"<p>Choose a method for visualizing data.</p>",
		weights:"<p>Select rasters from the drop down menus and assign weights.</p>",
		gapanalysis:"<p>Create a gap analysis using 2 data layers.</p>",
		pointdata:"<p>Overlay project point data on the map.</p>",
		toggle:"<p>You can toggle this tab by clicking anywhere on the tab.</p>"
	}

	// init ui
	$('#country').val('-----')
	$('#adm').val('-----')
	$('#adm').prop('disabled', true);
	message(m.init, "static");
	$('#map_options_content').slideDown(500);


	// --------------------------------------------------
	// build options


	// toggle options
	$('#map_options_toggle').click(function () {
		$('#map_options_content').slideToggle();
	})

	// toggle tooltip popver
	$('#map_options_popover').click(function () {
		if ( $(this).data('collapsed') == true ) {
		    $(this).animate({
		      left: -225
		    });
		    $(this).data('collapsed', false)
		} else {
		    $(this).animate({
		      left: -5
		    });
		    $(this).data('collapsed', true)
		}
	})

	// change country
	$('#country').on('change', function () {
		
		var $blank = $('#blank_country_option')
		if ($blank.length) { 
			$blank.remove() 
			$('#adm').prop('disabled', false);
		}

		p.country = $(this).val()

		// continent needed to access data using current DET file structure
		p.continent = continent_list[p.country];

		// add country polygon to map
		addCountry()

		// build point layer if a point layer was being viewed for previous country
		if (d.type != "") {
			addPointData()
		}

		buildRasterList()

	})

	// change adm
	$('#adm').on('change', function () {

		var $blank = $('#blank_adm_option')
		if ($blank.length) { 
			$blank.remove()
			$('#method').show(); 
			message(m.method, "static");
		}

		p.adm = $(this).val()

		// alternate method for identifying the adm of data in the DET tool
		// needed to access old DET data that has not been recreated using new adm naming system
		p.adm_alt = "__"+p.adm.substr(3) +"_"

		buildRasterList()

	})

	// change methods
	$('#method li').click(function () {
		$('#method li').removeClass("active");
		$(this).addClass("active");
		var method = $(this).attr("id").split("_")[1];
		p.method = method;
		$('.method').hide();
		$('#'+method).show();

		message("", "static");
		message(m[method]+m.toggle);
		if ( $('#map_options_popover').data('collapsed') == true ) {
			$('#map_options_popover').click();
		}

		// buildRasterList()
	})

	// selectors for weights and gapanalysis methods
	$('.method_select').on('change', function () {
		var item = ( $(this).val() == "-----" ? "" : $(this).val() );
		var id = $(this).attr('id');

		// disable weights number input if nothing is selected
		if ( p.method == "weights" && item == "" ) {
			$(this).next().prop('disabled', true);
			item = "";		
		} else if ( p.method == "weights" && item != "" ) {
			$(this).next().prop('disabled', false);	
		}

		// update raster list
		var method = _.invert(selectors)[id.substr(0,2)]
		if ( item == "" ) {
			delete temp[method][id];
		} else {
			temp[method][id] = item;
		}

		validateOptions();


		// disable select options if they are already selected somewhere else 
		$('.'+selectors[p.method]).each(function () {
			var sub_item = $(this).val();
			var sub_id = $(this).attr('id');

			$(this).find('option').each(function () {
				$(this).prop("disabled",false);	
				if ( temp[method][sub_id] != $(this).val() && _.values(temp[method]).indexOf( $(this).val() ) > -1 ) {
					$(this).prop("disabled",true);
				}
			})

		})

	})

	$('.wo').on('keyup change', function () {
		validateOptions();
	})

	$('.map_options_submit button').click(function () {

		console.log(temp)

		validateOptions();

		if ( temp.valid[p.method] == false ) {
			console.log("invalid options selected")
			return;
		}

		cleanOptions(2)

		// compile option data for submission
		$('.'+selectors[p.method]).each(function () {
			var option = $(this).val()
			if ( option != "-----") {
				p.rasters.push(option)
				p.files_obj[option] = temp.rasters[option]
				if (p.method == "weights") {
					var weight = $(this).next().val()
					p.weights_obj[option] = weight
				}
			}
		})


		// sort rasters list to preserve naming system
		// prevents identical calls creating different files due to naming system
		if (p.method == "weights"){
			p.rasters.sort()
		}

		// generate unique id
		p.id = p.country +"_"+ p.adm
		for (var i=0, ix=p.rasters.length; i<ix; i++) {
			p.files[i] = p.files_obj[p.rasters[i]]
			if ( p.method == "weights" ) {
				p.weights[i] = p.weights_obj[p.rasters[i]]
				p.id += "_" + p.rasters[i] +"_"+ p.weights[i]
			} else {
				p.id += "_" + p.rasters[i]
			}
		}

		// copy pending data object to submission data object
		s = (JSON.parse(JSON.stringify(p)));
		console.log(s)

		if ( p.method == "weights" ) {
			// build weighted geojson
			prepWeights()
		} else if ( p.method == "gapanalysis" ) {
			prepGapAnalysis()
		}


	})


	function buildRasterList() {
		if (p.continent != "" && p.country != "" && p.adm != "") {
			
			// clear all selectors used by a method
			$('.method_select').each(function () {
				$(this).empty()
			})

			$('.map_options_submit').hide();

			// clean all objects
			cleanOptions(1)

			// build
			process({ type: "scan", path: "/"+p.continent.toLowerCase().toLowerCase()+"/"+p.country.toLowerCase()+"/cache" }, function (options) {
					var op_count = 0;
				    for (var op in options) {
				    	if (options[op].indexOf(p.adm) != -1 || options[op].indexOf(p.adm_alt) != -1){
				    			var option = filterOptionName(options[op], "__", 4, 4);
				    			temp.rasters[option] = options[op];
				    			addOptionToGroup(option);
				    			op_count ++;
				    	}
				    }
				    if (op_count == 0) {
   						$('.method_select').each(function () {
   							$(this).prepend('<option class="no-data">No Data Available</option>');
   							$(this).prop('disabled', true);
   						})

				    } else {
   						$('.method_select').each(function () {
   							$(this).prepend('<option selected value="-----">-----</option>');
							if ( $(this).hasClass('ro') ) {
								$(this).next().prop('disabled', true);		
				    		}
				    		$(this).prop('disabled', false);
				    	})
				    }
		    })
		}
	}

	// add raster of format 'type__sub__year' to lists of available rasters
	// raster file location stored in temp.rasters object
	function addOptionToGroup(option) {
    	var type = option.substr(0,option.indexOf("__"))
    	$('.method_select').each(function () {
    		if ( !$(this).find(".optgroup_"+type).length ) {
    
    			$(this).append('<optgroup class="optgroup_'+type+'" label="'+type+'"></optgroup>')
    
    		}

		})

        $('.method_select').find(".optgroup_"+type).each(function () {
        	$(this).append('<option class="'+option+'" value="' + option + '">' + filterOptionName(option,"__",1,0) + '</option>')   
        })
	}

	// option = string, m = search char, n = nth occurence, p = offset from end of string
	function filterOptionName(option, m, n, p) {
		if (!p){p = 0}
		var i = 0, index = null, offset = 0

		while (i < n && index != -1) {
			index = option.indexOf(m, index+m.length)
			i++
		}

		if (index == -1) {
			return option
		}
		
		if (m.length > 0){ offset = m.length }
		var end = option.substr(index+offset).length - p
		return option.substr(index+offset, end)
	}

	// update tooltip with message
 	function message(html, option) {
 		if ( option && option == "static") {
 			$('#map_options_message').html(html);
 		}
 		$('#map_options_popover').html(html);
 	}

 	// different methods for cleaning up
 	function cleanOptions(c) {
		
		if ( c == 1 || c == 2 ){

			p.rasters = []
			p.weights = []
			p.files = []
			p.weight_obj = {}
			p.files_obj={}
		}

		if ( c == 1 || c == 3 ){
			temp.weights = {};
			temp.gapanalysis = {};
			temp.valid = {
				weights:false,
				gapanalysis:false
			};
 		}
 	}

 	function validateOptions() {

		temp.valid.weights = ( _.size(temp.weights) > 0 );

		$('.wo').each(function () {
			var val = parseInt( $(this).val() );
			if ( val < -10 || val > 10 || isNaN(val) ) {
				temp.valid.weights = false;
			}
		})

		temp.valid.gapanalysis = ( _.size(temp.gapanalysis) == 2 );

		if ( $('#'+p.method+'_submit').length && temp.valid[p.method] == true ) {
			$('#'+p.method+'_submit').show();
		} else {
			$('#'+p.method+'_submit').hide();
		}

 	}


	// --------------------------------------------------
	// point data options


	// init year slider object
	$('#slider').dragslider({
		animate: true,
		range: true,
		rangeDrag: true,
		min:2001,
		max:2013,
		step: 1,
		values: [d.start_year, d.end_year]
	}); 
 	
 	// init slider years ui
    var v = $("#slider").dragslider("values")
    $('#slider_value').text(v[0]+" - "+v[1]);
    var min = $('#slider').dragslider('option', 'min')
    var max = $('#slider').dragslider('option', 'max')
    $('#slider_min').text(min);
    $('#slider_max').text(max);

    // slider events
    var onPoint = false
    $('#slider').dragslider({
    	slide: function (event, ui) {
	    	v = ui.values
	        $('#slider_value').text(v[0]+" - "+v[1]);
	   	},
    	change: function (event, ui) {
	        d.start_year = $("#slider").dragslider("values")[0]
	    	d.end_year = $("#slider").dragslider("values")[1]

	    	// prevents attempt to build points if no type has been selected
	        if (onPoint){ addPointData() }
    	}
    });

	// manage menu display
	$(".menu_item").click(function () {
		if (p.country == ""){return}
		
		$(this).siblings().removeClass("active_menu")
		$(this).addClass("active_menu")
	})

	// point type selection
	$("#data_type ul li").on("click", function () {
		if (p.country == ""){ return }

		onPoint = true
		d.type = $(this).attr("id")
		addPointData()
	
	})

	// clear current point data / options / ui
	$('#clear_points button').click(function () {
		cleanMap("point");
		onPoint = false;
		$('.menu_item').each(function(){
			$(this).removeClass("active_menu");
		})
	})


	// --------------------------------------------------
	// map


	// init
	L.mapbox.accessToken = 'pk.eyJ1Ijoic2dvb2RtIiwiYSI6InotZ3EzZFkifQ.s306QpxfiAngAwxzRi2gWg'

	var map = L.mapbox.map('map', {})

	var tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap contributors</a>'
			}).addTo(map)

	map.setView([0,0], 3);

	map.options.maxZoom = 11
	map.options.minZoom = 2

	// bounds objects
	var allCountryBounds = { global:{_northEast:{lat:90, lng:180}, _southWest:{lat:-90, lng:-180}} }

	// addCountry vars: countryLayer
	// addPointData vars: markers, geojsonPoints
	// addPolyData vars: geojson, info, legend
	var countryLayer, markers, geojsonPoints, geojson, info, legend; 

	var mapinfo = {}
	
	mapinfo.pointdata =  function(feature, layer) {
		var a = feature.properties

		var html = ""
		html += "<b>Location Info</b>" 
		html += "<br>Geoname: " + a.geoname
		html += "<br>ADM1: " + a.ADM1_NAME
		if (a.ADM2_NAME) { html += "<br>ADM2: " + a.ADM2_NAME }
		if (a.ADM3_NAME) { html += "<br>ADM3: " + a.ADM3_NAME }

		html += "<br><br><b>Project Info</b>"
		html += "<br>Date of Agreement: " + a.date_of_agreement
		html += "<br>Donors: " + a.donor
		html += "<br>Project Sites: " + a.count

		html += "<br>Years: "
		var c = 0
		for (var y = d.start_year; y<=d.end_year; y++) {
			if ( parseFloat(a["d_"+y]) > 0 ) {
				if (c>0) { html += ", "}
				html += y
				c++							
			}
		}
		html += "<br>USD: "
		c = 0
		for (var y = d.start_year; y<=d.end_year; y++) {
			if ( parseInt(a["d_"+y]) > 0 ) {
				if (c>0) { html += ", "}
				html += ( parseInt(a["d_"+y]) ).toLocaleString()
				c++							
			}
		}

		layer.bindPopup(html);
	}

	mapinfo.weights = function(props) {
		var html =  '<h4>Weight Result</h4>'

		if (props) {
			html += '<b>' + props["NAME_"+s.adm.substr(3)] + '</b><br />' 
	        
	        html += "<table id='map_table'><thead><tr><th>Raster</th><th>Raw</th><th>Weighted</th></tr></thead><tbody>"
	        for (var i=0, ix=s.rasters.length; i<ix; i++) {

			    html += '<tr><td>' + s.rasters[i] + '</td><td>' + roundxy( props[s.rasters[i]] ) + '</td><td>' + (props[s.rasters[i]+"_weighted"] ? roundxy(props[s.rasters[i]+"_weighted"]) : "" ) + '</td></tr>'

	        }
	        html += "</tbody></table>"

	        html += 'Result: ' + roundxy(props.result) 
		
		} else {
			html = 'Hover over an area'
		}

	    this._div.innerHTML = html
	}

	mapinfo.gapanalysis = function(props) {
		var html =  '<h4>Gap Analysis Result</h4>'

		if (props) {
			html += '<b>' + props["NAME_"+s.adm.substr(3)] + '</b><br />' 
	        
	        html += "<table id='map_table'><thead><tr><th>Raster</th><th>Raw</th><th>Percent</th></tr></thead><tbody>"
	        for (var i=0, ix=s.rasters.length; i<ix; i++) {

			    html += '<tr><td>' + s.rasters[i] + '</td><td>' + roundxy( props[s.rasters[i]] ) + '</td><td>' + roundxy( props[s.rasters[i]+"_percent"] )  + '</td></tr>'

	        }
	        html += "</tbody></table>"

	        html += 'Ratio: ' + roundxy(props.ratio) + '<br>' 
	        html += 'Result: ' + roundxy(props.result) 
		
		} else {
			html = 'Hover over an area'
		}

	    this._div.innerHTML = html
	}

	// methods for cleaning up the map
	function cleanMap(method) {

		if (method == "point" || method == "all") {
			if (map.hasLayer(markers)){
				map.removeLayer(markers);
			}
		}

		if (method == "poly" || method == "all") {
			if (map.hasLayer(countryLayer)) {
				map.removeLayer(countryLayer);
			}

			if (map.hasLayer(geojson)) {
				map.removeLayer(geojson);
				info.removeFrom(map);
				legend.removeFrom(map);		
			}
		}
	}

	function addCountry() {
		var file = "/aiddata/DET/resources/"+p.continent.toLowerCase()+"/"+p.country.toLowerCase()+"/shapefiles/Leaflet.geojson"

		var geojsonFeature, error
		readJSON(file, function (request, status, e) {
			geojsonFeature = request
			error = e
		})

		if (error) {
			console.log(error)
			return 1
		}

		cleanMap("poly")

		countryLayer = L.geoJson(geojsonFeature, {style: style})
		countryLayer.addTo(map)

		var countryBounds = countryLayer.getBounds()
		map.fitBounds( countryBounds )

		allCountryBounds[p.country] = countryBounds
		
		function style(feature) {
		    return {
		        fillColor: 'red',
		        weight: 1,
		        opacity: 1,
		        color: 'black',
		        fillOpacity: 0.25
		    };
		}
	}

	function addPointData() {

		cleanMap("point")

		map.spin(true)
		$.ajax ({
	        url: "process.php",
	        data: {type: "pointdata", country:p.country, pointType: d.type, start_year:d.start_year, end_year:d.end_year},
	        dataType: "json",
	        type: "post",
	        async: false,
	        success: function (geojsonContents) {
				
				geojsonPoints = geojsonContents

				markers = new L.MarkerClusterGroup({
					disableClusteringAtZoom: 12
				});

				var geojsonLayer = L.geoJson(geojsonContents, {
					onEachFeature: mapinfo.pointdata,
					pointToLayer: function (feature, latlng) {
				        return L.marker(latlng, {
				            // radius: 5
				        })
				    }
				});

				markers.addLayer(geojsonLayer);
				map.addLayer(markers);
				map.spin(false)

	        }
	    })

	}

	// ajax to run Rscript which builds weighted geojson
	function prepWeights() {
		map.spin(true)
		$.ajax ({
	        url: "process.php",
	        data: {type: "weights", continent: s.continent, country: s.country, adm: s.adm, name:s.id, rasters: s.rasters, weights: s.weights, files: s.files},
	        dataType: "text",
	        type: "post",
	        async: false,
	        success: function (result) {
	        	addPolyData("../data/weights/"+result+".geojson")
       	       	map.spin(false)
	        }
	    })
	}

	// ajax to run Rscript which builds gapanalysis geojson
	function prepGapAnalysis() {
		map.spin(true)
		$.ajax ({
	        url: "process.php",
	        data: {type: "gapanalysis", continent: s.continent, country: s.country, adm: s.adm, name:s.id, rasters: s.rasters, files: s.files},
	        dataType: "text",
	        type: "post",
	        async: false,
	        success: function (result) {
	        	addPolyData("../data/gapanalysis/"+result+".geojson")
       	       	map.spin(false)
	        }
	    })
	}

	function addPolyData(file) {

		cleanMap("poly")
		
		var geojsonFeature, error
		readJSON(file, function (request, status, e) {
			geojsonFeature = request
			error = e
		})

		if (error) {
			console.log(error)
			return 1
		}

	    var grades = {
	    	weights: [0.15, 0.30, 0.45, 0.60, 0.85, 1],
	    	gapanalysis: [-1.5, -1.0, -0.5, 0.5, 1.0, 1.5, 2]
	    };

		function getColor(d) {
			if (s.method == "weights") {

			    return d <= 0.15 ? '#de2d26' :
			           d <= 0.30 ? '#fc9272' :
			           d <= 0.45 ? '#fee0d2' :

			           d <= 0.60 ? '#fff7bc' :
			           d <= 0.85 ? '#e5f5e0' :
	   		           			   '#a1d99b' ; 

   		    } else if (s.method == "gapanalysis") {

			    return d <= -1.5 ? '#de2d26' :
			           d <= -1.0 ? '#fc9272' :
			           d <= -0.5 ? '#fee0d2' :

			           d <= 0.5 ? '#fff7bc' :
			           d <= 1.0 ? '#e5f5e0' :
	   		           d <= 1.5 ? '#a1d99b' :
	   		           			  '#31a354';
   		    }
		}

		function style(feature) {
		    return {
		        fillColor: getColor(feature.properties.result),
		        weight: 1,
		        opacity: 1,
		        color: 'black',
		        fillOpacity: 0.75
		    };
		}

		function highlightFeature(e) {
		    var layer = e.target;

		    layer.setStyle({
		        weight: 5,
		        color: '#666',
		        dashArray: '',
		        fillOpacity: 0.7
		    });

		    if (!L.Browser.ie && !L.Browser.opera) {
		        layer.bringToFront();
		    }

   		    info.update(e.target.feature.properties);

		}

		function resetHighlight(e) {
		    geojson.resetStyle(e.target);
		    info.update();
		}

		function zoomToFeature(e) {
	    	// map.fitBounds(e.target.getBounds());
		}

		function onEachFeature(feature, layer) {
		    layer.on({
		        mouseover: highlightFeature,
		        mouseout: resetHighlight,
		        click: zoomToFeature
		    });
		}

		geojson = L.geoJson(geojsonFeature, {
		    style: style,
		    onEachFeature: onEachFeature
		})

		map.addLayer(geojson, true);

		map.fitBounds( geojson.getBounds() )


		info = L.control({
			position:'bottomleft'
		});

		info.onAdd = function (map) {
		    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
		    this.update();
		    return this._div;
		};

		// method that we will use to update the control based on feature properties passed
		info.update = mapinfo[s.method]  

		info.addTo(map);

		// manage legend
		legend = L.control({position: 'bottomright'});

		legend.onAdd = function (map) {

		    var div = L.DomUtil.create('div', 'info legend');

		    // loop through grades and generate a label with a colored square for each interval
			for (var i = 0, ix=grades[s.method].length; i < ix; i++) {
		        div.innerHTML += '<i style="background:' + getColor(grades[s.method][i]) + '"></i> '
		       
		        if ( s.method == "gapanalysis" && !grades[s.method][i+1] ) {
		        	div.innerHTML += grades[s.method][i-1]  + '+<br>'
		        } else {
		        	div.innerHTML += "<= " + grades[s.method][i]  + '<br>'
		        }
		    }

		    return div;
		};

		legend.addTo(map);

	}


	// --------------------------------------------------
	// general functions


	function roundxy(x,y) {
		y = ( y == undefined ? 3 : y );
		var pow = Math.pow(10,y);
		return Math.floor(x*pow)/(pow);
	}

	// generic ajax call to process.php
	function process(data, callback) {
		$.ajax ({
	        url: "process.php",
	        data: data,
	        dataType: "json",
	        type: "post",
	        async: false,
	        success: function (result) {
			    callback(result);
			}
	    })
	}

	// read in a json file and return object
	function readJSON(file, callback) {
	    $.ajax({
	    	type: "GET",
			dataType: "json",
			url: file,
			async: false,
	    	success: function (request){
	    		callback(request, "good", 0);
	    	},    
	    	error: function (request, status, error) {
        		callback(request, status, error);
    		}
	    })
	    
	};


	function readHash() {
		var h;
		h = window.location.hash.substring(1);
		if ( h == "" ) { 
			return 
		}

		process({type:"exists", name:h}, function (result) {
			if (result == true) {
				console.log(h);
				$('#build_toggle').slideDown()
				$("#build_toggle").click();
				addPolyData("data/"+h+".geojson");
			} else {
				console.log("bad hash");
			}

		})

	};

	readHash();
	
})
