// ++
// ++ js for DASH
// ++

$(document).ready(function () {

	// track state of user
	var state = 'init';

	//	pending and submission data objects
	var s, p = {
		method:'',
		country:'',
		continent:'',
		adm:'',
		adm_alt:'',
		rasters:[],
		weights_obj:{},
		weights:[],
		files_obj:{},
		files:[],
		name:'',
		hash:''
	};

	// dynamic point info data
	var d = {
		type:"",
		start_year:2005,
		end_year:2010
	};

	// stores info on options loaded in ui (raster file paths, selected options, valid selections)
	// current is updated once options are used to generate 
	var current, temp = {
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
		weights:'ro',
		gapanalysis:'ga'
	};

	var continent_list = {
		'Nepal':'Asia',
		'Uganda':'Africa',
		'Malawi':'Africa'
	};

	// messages
	var m = {
		init:'<p>Welcome to AidData - - DASH - -</p><p>To start, please select the country and the administrative level you would like to explore.</p><p>(You can change these later.)</p>',
		start:'<p>Select a predefined analysis to view or click on the advanced options icon to create a custom analysis.</p>',
		themed:'<p>You can now view / edit the options used for this themed raster by selecting the "Build Layer" or "Select Aid Data" tabs. You can also add point data to the map using the "Add Point Data" tab.</p>',
		advanced:'<p>Advanced mode enabled.</p>',
		weights:'<p>Select rasters from the drop down menus and assign weights.</p>',
		gapanalysis:'<p>Create a gap analysis using 2 data layers.</p>',
		pointdata:'<p>Overlay project point data on the map.</p>',
		toggle:'<p>You can toggle this tab by clicking anywhere on the tab.</p>'
	};

	// init ui
	$('#country').val('-----');
	$('#adm').val('-----');
	$('#adm').prop('disabled', true);
	message(m.init, "static");
	$('#map_options_content').slideDown(500);


	// --------------------------------------------------
	// build options


	// toggle options
	$('#map_options_toggle').click(function () {
		$('#map_options_content').slideToggle();
	})
	$('#map_chart_toggle').click(function () {
		$('#map_chart').animate({width:'toggle'});
	})

	// toggle tooltip popver
	$('#map_options_popover').click(function () {
		if ( $(this).data('collapsed') == true ) {
		    $(this).animate({
		      left: -225
		    });
		    $(this).data('collapsed', false);
		} else {
		    $(this).animate({
		      left: -5
		    });
		    $(this).data('collapsed', true);
		}
	})

	// change country
	$('#country').on('change', function () {
		state = 'init'

		var $blank = $('#blank_country_option');
		if ($blank.length) { 
			$blank.remove() ;
			$('#adm').prop('disabled', false);
		}

		p.country = $(this).val();

		// continent needed to access data using current DET file structure
		p.continent = continent_list[p.country];

		// add country polygon to map
		addCountry();

		// build point layer if a point layer was being viewed for previous country
		// if (d.type != "") {
		// 	addPointData();
		// }

		buildRasterList();

	})

	// change adm
	$('#adm').on('change', function () {
		state = 'init'

		// clean up any existing weight / gap analysis layer
		cleanMap('all')
		addCountry();

		var $blank = $('#blank_adm_option');
		if ($blank.length) { 
			$blank.remove();
			$('#method').show(); 
			message(m.start, 'static');
		}

		p.adm = $(this).val();

		// alternate method for identifying the adm of data in the DET tool
		// needed to access old DET data that has not been recreated using new adm naming system
		p.adm_alt = '__'+p.adm.substr(3) +'_';

		// build point layer if a point layer was being viewed at previous adm
		if (d.type != "") {
			addPointData();
		}

		buildRasterList();

	})

	$('#start_submit').click(function () {
		console.log('themed default');
	})

	$('#start_advanced').click(function () {
		state = 'advanced';
		message(m[state]+m.weights)
		$('#method_weights').click();
	})

	// change methods
	$('#method li').click(function () {

		// console.log(state)
		if ( state == 'default') {
			return;
		}
		
		state = ( state == "init" ? "default" : state );

		$('#method li').removeClass("active");
		$(this).addClass("active");
		var method = $(this).attr("id").split("_")[1];
		p.method = method;
		$('.method').hide();
		$('#'+method).show();

		message("", "static");
		if (state == "advanced") {
			message(m[state] + m.weights);
		} else { 
			message(m[method], method);
		}

		state = (state == "default" ? "default" : method);

		if ( p.method == "start" ) {
			$('#map_options_popover').animate({
		      left: 0
		    });
		} else {
			$('#map_options_popover').animate({
		      left: -225
		    });
		}

		validateOptions();

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
		var method = _.invert(selectors)[id.substr(0,2)];
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

	$('#gapanalysis_option_2 a').click( function () {
		$('#method_weights').click();
	})

	$('#weights_submit').click(function () {

		validateOptions();

		if ( temp.valid[p.method] == false ) {
			console.log("invalid options selected");
			return;
		}

		cleanOptions(2);

		// compile option data for submission
		$('.'+selectors[p.method]).each(function () {
			var option = $(this).val();
			if ( option != "-----") {
				p.rasters.push(option);
				p.files_obj[option] = temp.rasters[option];
				var weight = $(this).next().val();
				p.weights_obj[option] = weight;
			}
		})

		// sort rasters list to preserve naming system
		// prevents identical calls creating different files due to naming system
		p.rasters.sort();
				
		// generate unique id
		p.name = p.country +"_"+ p.adm;
		for (var i=0, ix=p.rasters.length; i<ix; i++) {
			p.files[i] = p.files_obj[p.rasters[i]];
			p.weights[i] = p.weights_obj[p.rasters[i]];
			p.name += "_" + p.rasters[i] +"_"+ p.weights[i];
		}

		// copy pending data object to submission data object
		s = (JSON.parse(JSON.stringify(p)));

		$('#map_chart_toggle').hide();
		prepWeights();
	})

	$('#gapanalysis_submit').click(function () {

		validateOptions();

		if ( temp.valid[p.method] == false ) {
			console.log("invalid options selected");
			return;
		}

		cleanOptions(2);

		// compile option data for submission
		var option = $('#ga1').val();
		if ( option == "-----") {
			console.log("Bad #ga1 val.");
			return;
		}

		p.rasters.push(option);
		p.files_obj[option] = temp.rasters[option];

		p.rasters.push("custom_weighted_layer")
		p.files_obj["custom_weighted_layer"] = temp.rasters["custom_weighted_layer"];

		// generate unique id
		p.name = p.country +"_"+ p.adm;
		for (var i=0, ix=p.rasters.length; i<ix; i++) {
			p.files[i] = p.files_obj[p.rasters[i]];
			p.name += "_" + p.rasters[i];
		}

		// copy pending data object to submission data object
		s = (JSON.parse(JSON.stringify(p)));
		// update list of options used to generate current gap analysis
		current = (JSON.parse(JSON.stringify(temp)));

		$('#analysis_results').empty()
		$('#map_chart_toggle').show();
		prepGapAnalysis();
	})

	function buildRasterList() {
		if (p.continent != "" && p.country != "" && p.adm != "") {

			// go to start menu
			$('#method_start').click();
			
			// clear all selectors used by a method
			$('.method_select').each(function () {
				$(this).empty()
			})

			// hide all submit buttons
			$('.map_options_submit').hide();

			// clean all objects
			cleanOptions(1)

			// build
			process({ call: "scan", path: "/"+p.continent.toLowerCase().toLowerCase()+"/"+p.country.toLowerCase()+"/cache" }, function (options) {
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
   		
   		var aid_option = ( option.indexOf("aid") > -1 );
  
    	var type = option.substr(0,option.indexOf("__"));
  
    	$('.method_select').each(function () {

    		if ( ($(this).attr('id') == "ga1" && !aid_option) || ($(this).attr('id') != "ga1" && aid_option) ) {
    			return;
    		}

    		if ( !$(this).find(".optgroup_"+type).length ) {
    
    			$(this).append('<optgroup class="optgroup_'+type+'" label="'+type+'"></optgroup>');
    
    		}

	        $(this).find(".optgroup_"+type).each(function () {
	        	$(this).append('<option class="'+option+'" value="' + option + '">' + filterOptionName(option,"__",1,0) + '</option>');
	        })

		})
	}

	// option = string, m = search char, n = nth occurence, p = offset from end of string
	function filterOptionName(option, m, n, p) {
		if (!p){p = 0}
		var i = 0, index = null, offset = 0;

		while (i < n && index != -1) {
			index = option.indexOf(m, index+m.length);
			i++;
		}

		if (index == -1) {
			return option;
		}
		
		if (m.length > 0){ offset = m.length }
		var end = option.substr(index+offset).length - p;
		return option.substr(index+offset, end);
	}

	// update tooltip with message
 	function message(html, option, tab) {
 		tab = ( tab ? tab : true );
 		if ( option && option == "start") {
 			$('#start_message').html(html);
 		} else if ( option && option == "static") {
 			$('#map_options_message').html(html);

 		}
 		if ( tab ) {
 			$('#map_options_popover').html(html + m.toggle);
 		}
 	}

 	// different methods for cleaning up
 	function cleanOptions(c) {
		
		if ( c == 1 || c == 2 ){

			p.rasters = [];
			p.weights = [];
			p.files = [];
			p.weights_obj = {};
			p.files_obj={};
		}

		if ( c == 1 || c == 3 ){
			temp.rasters = {};
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
    var v = $("#slider").dragslider("values");
    $('#slider_value').text(v[0]+" - "+v[1]);
    var min = $('#slider').dragslider('option', 'min');
    var max = $('#slider').dragslider('option', 'max');
    $('#slider_min').text(min);
    $('#slider_max').text(max);

    // slider events
    var onPoint = false
    $('#slider').dragslider({
    	slide: function (event, ui) {
	    	v = ui.values;
	        $('#slider_value').text(v[0]+" - "+v[1]);
	   	},
    	change: function (event, ui) {
	        d.start_year = $("#slider").dragslider("values")[0];
	    	d.end_year = $("#slider").dragslider("values")[1];

	    	// prevents attempt to build points if no type has been selected
	        if (onPoint){ 
	        	addPointData(); 
	        }
    	}
    });

	// manage menu display
	$(".menu_item").click(function () {
		if (p.country == ""){
			return;
		}
		
		$(this).siblings().removeClass("active_menu");
		$(this).addClass("active_menu");
	})

	// point type selection
	$("#data_type ul li").on("click", function () {
		if (p.country == ""){ 
			return; 
		}

		onPoint = true;
		d.type = $(this).attr("id");
		addPointData();
	
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
	L.mapbox.accessToken = 'pk.eyJ1Ijoic2dvb2RtIiwiYSI6InotZ3EzZFkifQ.s306QpxfiAngAwxzRi2gWg';

	var map = L.mapbox.map('map', {});

	var tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap contributors</a>'
			}).addTo(map);

	map.setView([0,0], 3);

	map.options.maxZoom = 11;
	map.options.minZoom = 2;

	// bounds objects
	var allCountryBounds = { global:{_northEast:{lat:90, lng:180}, _southWest:{lat:-90, lng:-180}} };

	// addCountry vars: countryLayer
	// addPointData vars: markers, geojsonPoints
	// addPolyData vars: geojsonPolyData, geojson, info, legend, featureList
	var countryLayer, markers, geojsonPoints, geojsonPolyData, geojson, info, legend, featureList; 

	var mapinfo = {};
	
	mapinfo.pointdata =  function(feature, layer) {
		var a = feature.properties;

		var html = "";
		html += "<b>Location Info</b>"; 
		html += "<br>Geoname: " + a.geoname;
		html += "<br>ADM1: " + a.ADM1_NAME;

		html += ( a.ADM2_NAME ? "<br>ADM2: " + a.ADM2_NAME : "" );
		html += ( a.ADM3_NAME ? "<br>ADM3: " + a.ADM3_NAME : "" );


		html += "<br><br><b>Project Info</b>";
		html += "<br>Date of Agreement: " + a.date_of_agreement;
		html += "<br>Donors: " + a.donor;
		html += "<br>Project Sites: " + a.count;

		html += "<br>Years: ";
		var c = 0;
		for (var y = d.start_year; y<=d.end_year; y++) {
			if ( parseFloat(a["d_"+y]) > 0 ) {
				html += ( c > 0 ? ", " : "" );
				html += y;
				c++;				
			}
		}
		html += "<br>USD: ";
		c = 0;
		for (var y = d.start_year; y<=d.end_year; y++) {
			if ( parseInt(a["d_"+y]) > 0 ) {
				html += ( c > 0 ? ", " : "" );
				html += ( parseInt(a["d_"+y]) ).toLocaleString();
				c++;							
			}
		}

		layer.bindPopup(html);
	}

	mapinfo.weights = function(props) {
		var html =  '<h4>Weight Result</h4>';

		if (props) {
			html += '<b>' + props["NAME_"+s.adm.substr(3)] + '</b><br />';
	        
	        html += "<table id='map_table'><thead><tr><th>Raster</th><th>Raw</th><th>Weighted</th></tr></thead><tbody>";
	        for (var i=0, ix=s.rasters.length; i<ix; i++) {

			    html += '<tr><td>' + s.rasters[i] + '</td><td>' + roundxy( props[s.rasters[i]] ) + '</td><td>' + (props[s.rasters[i]+"_weighted"] ? roundxy(props[s.rasters[i]+"_weighted"]) : "" ) + '</td></tr>';

	        }
	        html += "</tbody></table>";

	        html += 'Result: ' + roundxy(props.result); 
		
		} else {
			html = 'Hover over an area';
		}

	    this._div.innerHTML = html;
	}

	mapinfo.gapanalysis = function(props) {
		var html =  '<h4>Gap Analysis Result</h4>';

		if (props) {
			html += '<b>' + props["NAME_"+s.adm.substr(3)] + '</b><br />'; 
	        
	        html += "<table id='map_table'><thead><tr><th>Raster</th><th>Raw</th><th>Percent</th></tr></thead><tbody>";
	        for (var i=0, ix=s.rasters.length; i<ix; i++) {

			    html += '<tr><td>' + s.rasters[i] + '</td><td>' + roundxy( props[s.rasters[i]] ) + '</td><td>' + roundxy( props[s.rasters[i]+"_percent"] )  + '</td></tr>';

	        }
	        html += "</tbody></table>";

	        html += 'Ratio: ' + roundxy(props.ratio) + '<br>';
	        html += 'Result: ' + roundxy(props.result);
		
		} else {
			html = 'Hover over an area';
		}

	    this._div.innerHTML = html;
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

		if (method == "chart" || method == "all") {
    		$('#map_chart').empty();
    		$('#map_chart').hide();
		}
	}

	function addCountry() {
		var file = "/aiddata/DET/resources/"+p.continent.toLowerCase()+"/"+p.country.toLowerCase()+"/shapefiles/Leaflet.geojson";

		var geojsonFeature, error
		readJSON(file, function (request, status, e) {
			geojsonFeature = request;
			error = e;
		})

		if (error) {
			console.log(error);
			return 1;
		}

		cleanMap("all");

		countryLayer = L.geoJson(geojsonFeature, {style: style});
		countryLayer.addTo(map);

		var countryBounds = countryLayer.getBounds();
		map.fitBounds( countryBounds );

		allCountryBounds[p.country] = countryBounds;
		
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

		cleanMap("point");

		map.spin(true);
		$.ajax ({
	        url: "process.php",
	        data: {call: "pointdata", country:p.country, pointType: d.type, start_year:d.start_year, end_year:d.end_year},
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
				map.spin(false);

	        }
	    });

	}

	// ajax to run Rscript which builds weighted geojson
	function prepWeights() {
		map.spin(true)
		$.ajax ({
	        url: "process.php",
	        data: {call: "weights", continent: s.continent, country: s.country, adm: s.adm, name:s.name, rasters: s.rasters, weights: s.weights, files: s.files},
	        dataType: "text",
	        type: "post",
	        async: false,
	        success: function (result) {
	        	s.hash = result
	        	addPolyData("../data/weights/" + result + ".geojson");
       	       	map.spin(false);
       	       	// runAnalysis();
	        }
	    });
	}

	// ajax to run Rscript which builds gapanalysis geojson
	function prepGapAnalysis() {
		map.spin(true)
		$.ajax ({
	        url: "process.php",
	        data: {call: "gapanalysis", continent: s.continent, country: s.country, adm: s.adm, name: s.name, rasters: s.rasters, files: s.files},
	        dataType: "text",
	        type: "post",
	        async: false,
	        success: function (result) {
	        	addPolyData("../data/gapanalysis/" + result + ".geojson");
       	       	map.spin(false);
        	    runAnalysis();
	        }
	    });
	}

	function addPolyData(file) {
		console.log("file:"+file)

		featureList = {};

		cleanMap("poly");
   		cleanMap("chart");

		var error
		readJSON(file, function (request, status, e) {
			geojsonPolyData = request;
			error = e;
		})

		if (error) {
			console.log(error);
			return 1;
		}

		console.log(temp)
		console.log(s)
		console.log(geojsonPolyData)

		if (s.method == "weights") {
   	       	// add weighted layer to gapanalysis data option (ga2)
   	       	console.log(s.hash)
	        temp.rasters["custom_weighted_layer"] = s.hash + ".csv";
	        temp.gapanalysis.ga2 = "custom_weighted_layer";
	        // temp.valid.gapanalysis = true;
	        // $('#gapanalysis_submit').show();
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

		function mouseoverFeature(e) {
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

		function mouseoutFeature(e) {
		    geojson.resetStyle(e.target);
		    info.update();
		}

		function clickFeature(e) {

			// zoom to feature
	    	// map.fitBounds(e.target.getBounds());

	    	if (s.method == "weights") {
	    		// add message
	    		return;
	    	}

	    	$('#map_chart').show();
	    	var map_chart_data = {
	    		raw: [],
	    		sum: 0,
	    		min: 0,
	    		categories:['', ''],
	    		series:[]
	    	};

	    	map_chart_data.series.push({
	    		name: s.rasters[0],
	    		data: [ roundxy(parseFloat(e.target.feature.properties[s.rasters[0]+"_percent"])) ],
	    		stack: 0
	    	})

	    	for ( var i = 0, ix = _.size(current.weights); i < ix; i++ ) {
	    		var val = parseFloat( e.target.feature.properties[_.values(current.weights)[i]+"_weighted"] )
	    		console.log(val, isNaN(val))
	    		map_chart_data.raw.push(val);
	    	}
	    	
	    	map_chart_data.min = ss.min(map_chart_data.raw);

	    	if ( map_chart_data.min < 0 ) {
		    	for ( var i = 0, ix = map_chart_data.raw.length; i < ix; i++ ) {
		    		map_chart_data.raw[i] = map_chart_data.raw[i] + map_chart_data.min;
		    	}
		    }

	    	map_chart_data.sum = ss.sum(map_chart_data.raw);

	    	for ( var i = 0, ix = map_chart_data.raw.length; i < ix; i++ ) {
	    		var val = roundxy( parseFloat(e.target.feature.properties[s.rasters[1]+"_percent"]) * map_chart_data.raw[i] / map_chart_data.sum )
	    		map_chart_data.series.push({
	    			name: _.values(current.weights)[i],
	    			data: [ val ],
	    			stack: 1
	    		})
	    	}

	    	console.log(map_chart_data)
			// console.log(e)
	    	// console.log(s)
	    	// console.log(current)

	    	var map_chart_options = {
		        chart: {
		        	type: 'bar'
		        },
		        title: {
		            text: e.target.feature.properties["NAME_"+s.adm.substr(3)]
		        },
		        subtitle: {
		            text: ''
		        },
		        xAxis: {
		            categories: map_chart_data.categories
		        },
		        yAxis: [{ 
		            title: {
		                text: 'Standarized Values (0-1)',
		                // style: {
		                //     color: Highcharts.getOptions().colors[1]
		                // }
		            }//,
		            // labels: {
		            //     format: '{value}',
		            //     style: {
		            //         color: Highcharts.getOptions().colors[1]
		            //     }
		            // },
		        }],
		        tooltip: {
		        	enabled:true//,
		        	// positioner: function () {
		         //        return { x: 0, y: -10 };
		         //    },
		         //    shadow: false,
		         //    borderWidth: 0,
		         //    shared: true
		        },
		         plotOptions: {
		         	bar: {
		            	stacking: 'normal',
		                dataLabels: {
		                    enabled: true,
		                    align:'right',
		                    color:'white'
		                }
		            }
		        },
		        legend: {
		        	enabled:false,
		            layout: 'horizontal',
		            align: 'left',
		            x: 75,
		            verticalAlign: 'top',
		            y: 20,
		            floating: true,
		            backgroundColor: 'rgba(255,255,255,0)'
		        },
		        credits:{
		        	enabled:false
		        },
		        series: map_chart_data.series
	    	 };

	    	$('#map_chart').highcharts(map_chart_options);
	    	console.log(map_chart_options)

		}

		function onEachFeature(feature, layer) {
		    layer.on({
		        mouseover: mouseoverFeature,
		        mouseout: mouseoutFeature,
		        click: clickFeature
		    });
		    var poly_id = "polygon_" +  feature.properties.ID;
		    layer._leaflet_id = poly_id;
		    featureList[ feature.properties["NAME_"+s.adm.substr(3)] ] = poly_id; 
		    // console.log(feature)
		    // console.log(layer)
		}

		geojson = L.geoJson(geojsonPolyData, {
		    style: style,
		    onEachFeature: onEachFeature
		})

		map.addLayer(geojson, true);

		map.fitBounds( geojson.getBounds() );


		info = L.control({
			position:'bottomleft'
		});

		info.onAdd = function (map) {
		    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
		    this.update();
		    return this._div;
		};

		// method that we will use to update the control based on feature properties passed
		info.update = mapinfo[s.method];

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
	// results analysis


	$('#analysis_tab').click(function () {
		// $('#analysis_tab').hide();
		// $('#analysis_title').show()

  //   	// var pan = map.getCenter();

		// $('#map').animate({height:'75%'}, function () {
		//     map.invalidateSize();

		// 	map.fitBounds( allCountryBounds[p.country] );
	 //      	// map.panTo(pan, {animate:true, duration:1.0});
		// 	$('#analysis').show();
		// 	if ( $('#gapanalysis_chart').length) {
		// 		$('#gapanalysis_chart').redraw();
		// 	}
	 //    });

	    $('html, body').animate({
	        scrollTop: $("#analysis").offset().top
	    }, 1000);

	    // console.log(map._layers)
	})


	$('#analysis_title').click(function () {
 	// 	$(this).hide();
		// $('#analysis_tab').show()
		
  //   	// var pan = map.getCenter();
	
		// $('#analysis').hide();

		// $('#map').animate({height:'100%'}, function () {
		//     map.invalidateSize();

		// 	map.fitBounds( allCountryBounds[p.country] );
	 //      	// map.panTo(pan, {animate:true, duration:1.0});
		// 	$('#analysis_tab').show();
	 //    });

	    $('html, body').animate({
	        scrollTop: $("#map").offset().top
	    }, 1000);
	})

	$( window ).scroll(function() {

		    var docViewTop = $(window).scrollTop();
		    var docViewBottom = docViewTop + $(window).height();

		    var analysisTop = $('#analysis').offset().top;
		    // var analysisBottom = analysisTop + $('#analysis').height();

		    if ( $('#analysis_tab').length && analysisTop <= docViewTop + 250 ) {
		    	$('#analysis_tab').hide();
		    	$('#analysis_title').show();

		    } else if ( $('#analysis_title').length && analysisTop >= docViewBottom - 300 ) {
		    	$('#analysis_title').hide();
		    	$('#analysis_tab').show();

		    }
			
			// console.log( docViewTop, docViewBottom, analysisTop, analysisBottom)
	});

	function runAnalysis() {
		$('#analysis').show();
		$('#analysis_tab').show();
		$('#report_container').show();
		// console.log(geojsonPolyData);

		var data = {
			raw: geojsonPolyData.features,
			keys: _.keys(geojsonPolyData.features),
			size: _.size(geojsonPolyData.features),
			props: {},
			results: {},
			primary: [],
			secondary: [],
			categories: []
		};

		var subtitle = ( data.size <= 10 ? 'Top 5 Underfunded / Top 5 Overfunded' : '')

		for ( var i = 0, ix = data.size; i < ix; i++ ) {
			data.props[i] = data.raw[data.keys[i]].properties;
			data.results[i] = parseFloat(data.props[i].result);
		}

		data.bot5 = _.values(data.results).sort( function(a, b) { return a-b } )[4];
		data.top5 = _.values(data.results).sort( function(a, b) { return b-a } )[4];

		for ( var i = 0, ix = data.size; i < ix; i++ ) {
			var item = data.props[data.keys[i]]; 
			if ( data.size <= 10 ) {
				data.primary.push( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );
				data.secondary.push( roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
				data.categories.push(item["NAME_" + s.adm.substr(3,1)]);
			}
			if ( data.size > 10 && parseFloat(item.result) <= data.bot5 ) {
				data.primary.unshift( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );
				data.secondary.unshift( roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
				data.categories.unshift(item["NAME_" + s.adm.substr(3,1)]);
			}
			if ( data.size > 10 && parseFloat(item.result) >= data.top5 ) {
				data.primary.push( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );
				data.secondary.push( roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
				data.categories.push(item["NAME_" + s.adm.substr(3,1)]);
			}
		}

		// console.log(data);
		// console.log(featureList)

		data.chart_options = {
	        chart: {
	        	type: 'column'
	            // zoomType: '',
	            // spacingLeft: 10,
	            // marginRight: 100,
	            // backgroundColor: '#ffc425'

	        },
	        title: {
	            text: 'Gap Analysis'
	        },
	        subtitle: {
	            text: subtitle
	        },
          	plotOptions: {
            	series: {
            		cursor: 'pointer',
	                point: {
	                    events: {
	                    	click: function () {
	                    		_.each( map._layers, function(lay) {
	                    			lay.fire('mouseout');
	                    		})
	   
	                    		map._layers[ featureList[data.categories[this.x]] ].fire('mouseover');
	                    	}
	                     //    mouseOver: function () {
	                     //       console.log( data.categories[this.x], featureList[data.categories[this.x]] );
	                     //       map._layers[ featureList[data.categories[this.x]] ].fire('mouseover');
	                     //    },
	                     //    mouseOut: function () {
		                    //     map._layers[ featureList[data.categories[this.x]] ].fire('mouseout');
		                    // }
	                    }
	                }
	            }
	        },
	        xAxis: {
	            categories: data.categories
	        },
	        yAxis: [{ 
	            title: {
	                text: 'Standarized Values (0-1)',
	                style: {
	                    color: Highcharts.getOptions().colors[1]
	                }
	            },
	            labels: {
	                format: '{value}',
	                style: {
	                    color: Highcharts.getOptions().colors[1]
	                }
	            },
	        }],
	        tooltip: {
	            shared: true
	        },
	        legend: {
	            layout: 'horizontal',
	            align: 'left',
	            x: -5,
	            verticalAlign: 'top',
	            y: -5,
	            floating: true,
	            backgroundColor: 'rgba(255,255,255,0)' //(Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
	        },
	        credits:{
	        	enabled:false
	        },
	        series: [{
	            name: 'Aid',
	            data: data.primary//,
	            // tooltip: {
	            //     valueSuffix: ''
	            // }

	        }, {
	            name: 'Data',
	            data: data.secondary//,
	        //     // tooltip: {
	        //     //     valueSuffix: ''
	            // }
	        }]
	    };
		$('#analysis_results').append('<div id="gapanalysis_chart"></div>');
		$('#gapanalysis_chart').highcharts(data.chart_options);
        $('html, body').animate({ scrollTop: 0 }, 0);

	}


	// --------------------------------------------------
	// report generation


    $("#report").click(function(){
        saveChart('gapanalysis_chart', 'gapanalysis_chart_name');
    });

    // save a highchart to png
    function saveChart(chart, name) {
		var svg = document.getElementById(chart).children[0].innerHTML;
        var canvas = document.getElementById('canvas');
        canvg(canvas,svg);
        var img = canvas.toDataURL("image/png"); //img is data:image/png;base64
        var img_data = {call:'saveimg', img: img, name:name};
        console.log(img_data)
        $.ajax({
          	url: "process.php",
          	data: img_data,
  	        dataType: "json",
	        type: "post",
	        async: false,
          	success: function(result){
            	console.log(result);
          	},    
	    	error: function (request, status, error) {
        		// console.log(request) 
        		// console.log(status) 
        		console.log(error);
    		}
        });
    }

    // call report building php
    function buildReport() {
    	var report_data = {};

        $.ajax({
          	url: "report.php",
          	data: report_data,
  	        dataType: "json",
	        type: "post",
	        async: false,
          	success: function(result){
            	console.log(result);
          	},    
	    	error: function (request, status, error) {
        		// console.log(request) 
        		// console.log(status) 
        		console.log(error);
    		}
        });
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
	    });
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
	    });
	}

	function readHash() {
		var h;
		h = window.location.hash.substring(1);
		if ( h == "" ) { 
			return 
		}

		process({call:"exists", name:h}, function (result) {
			if (result == true) {
				console.log(h);
				addPolyData("data/"+h+".geojson");
			} else {
				console.log("bad hash");
			}

		})

	}

	readHash();
	
})
