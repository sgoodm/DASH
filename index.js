// ++
// ++ js for DASH
// ++

$(document).ready(function () {

	// tracks cetain UI/UX states
	var state = 'init';
	var map_state = 100;

	// load data from defaults.json, stored selected theme
	var themes, theme_state;

	// pending and submission data objects (used to generate data for server requests)
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
		files:[]//,
		// name:'',
		// hash:''
	};

	// stores info on options loaded in ui (raster file paths, selected options for weights and gapanalysis, valid selections, file names of current weight/gapanalysis layers)
	// current is updated when any option changes
	// temp is updated when a gapanalysis option changes (aid layer change or when a new weight layer is generated)
	// active is only updated once options are used to run a gapanalysis
	var active, temp, current = {
		rasters: {},
		weights: {},
		weight_vals: {},
		gapanalysis: {},
		valid: {
			weights:false,
			gapanalysis:false
		},
		files: {
			weights:'',
			gapanalysis:''		
		},
		layer: ''
	};


	// dynamic point info data
	var d = {
		type:"",
		start_year:2005,
		end_year:2010
	};

	// select element class names for each method
	var selectors = {
		weights:'ro',
		gapanalysis:'ga'
	};

	// continent lookup list
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
		toggle:'<p>You can toggle this tab by clicking anywhere on the tab.</p>',
		map_chart:'<p id="map_chart_message">Click a feature on the map to generate a chart with data on that area.</p>'
	};

	// init ui on load
	$('#country').val('-----');
	$('#adm').val('-----');
	$('#adm').prop('disabled', true);
	message(m.init, "static");
	// $('#map_options_content').slideDown(500);


	// --------------------------------------------------
	// build options


	// toggle options
	$('#map_options_toggle').click(function () {
		$('#map_options_content').slideToggle();
	});
	$('#map_chart_toggle').click(function () {
		$('#map_chart').animate({width:'toggle'});
	});

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
	});

	// change country
	$('#country').on('change', function () {
		state = 'init';

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

	});

	// change adm
	$('#adm').on('change', function () {
		state = 'init';

		// clean up any existing weight / gap analysis layer
		cleanMap('all');
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

	});

	$('#start_option').on('change', function () {
		var val = ( $(this).val() != '-----' );
		console.log(val)
		showState('#start_submit', val);

	})

	$('#start_submit button').click(function () {
		console.log('themed default');
		// will load a pre-generated link using the same hash processing function that loads normal links created by DASH
		var item = $('#start_option').val();
		theme_state = item;
		var theme = (themes.available[p.country][p.adm][item])
		var hash = theme.link.substr(theme.link.indexOf('#')+1)
		window.location.hash = '';
		window.location.hash =  hash;
	});

	$('#start_advanced').click(function () {
		state = 'advanced';
		message(m[state]+m.weights)
		$('#method_weights').click();
	});

	// change methods
	$('#method li').click(function () {

		// prevent changing tabs before selecting a themed default or clicking on advanced options
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

		// allow initiating the start menu 
		state = (state == "default" ? "default" : p.method);

		// hide tooltip for start menu
		if ( p.method == "start" ) {
			$('#map_options_popover').animate({
		      left: 0
		    });
		} else {
			$('#map_options_popover').animate({
		      left: -225
		    });
		}

		// run validation check any time tab changes
		validateOptions();

	});

	// selectors for weights method
	$('.ro').on('change', function () {
		var item = ( $(this).val() == "-----" ? "" : $(this).val() );
		var id = $(this).attr('id');

		// disable weights number input if nothing is selected
		if ( item == "" ) {
			$(this).next().prop('disabled', true);
			item = "";		
		} else {
			$(this).next().prop('disabled', false);	
		}

		// update current data
		if ( item == "" ) {
			delete current.weights[id];
			delete current.weight_vals[id];

		} else {
			current.weights[id] = item;
			current.weight_vals[id] = $(this).next().val();

		}

		validateOptions();

		// disable select options if they are already selected somewhere else 
		$('.ro').each(function () {
			var sub_item = $(this).val();
			var sub_id = $(this).attr('id');

			$(this).find('option').each(function () {
				$(this).prop("disabled",false);	
				if ( current.weights[sub_id] != $(this).val() && _.values(current.weights).indexOf( $(this).val() ) > -1 ) {
					$(this).prop("disabled",true);
				}
			})

		})

	});

	$('.wo').on('keyup change', function () {
		// check if weight value is valid
		validateOptions();

		if (current.valid.weights) {
			var id = $(this).prev().attr('id');
			current.weight_vals[id] = $(this).val();

		}
	});

	$('#weights_submit').click(function () {

		validateOptions();

		if ( current.valid.weights == false ) {
			console.log("invalid options selected");
			return;
		}

		cleanOptions(2);
		cleanMap("chart");

		// compile option data for submission
		$('.ro').each(function () {
			var option = $(this).val();
			if ( option != "-----") {
				p.rasters.push(option);
				p.files_obj[option] = current.rasters[option];
				var weight = $(this).next().val();
				p.weights_obj[option] = weight;
			}
		})

		// sort rasters list to preserve naming system
		// prevents identical calls creating different files due to naming system
		p.rasters.sort();
				
		// generate unique id and build arrays with option data
		// p.name = p.country +"_"+ p.adm;
		for (var i=0, ix=p.rasters.length; i<ix; i++) {
			p.files[i] = p.files_obj[p.rasters[i]];
			p.weights[i] = p.weights_obj[p.rasters[i]];
			// p.name += "_" + p.rasters[i] +"_"+ p.weights[i];
		}

		// copy pending data object to submission data object
		s = (JSON.parse(JSON.stringify(p)));

		$('#map_chart_toggle').hide();
		prepWeights();
	});

	// selectors for gapanalysis method
	$('.ga').on('change', function () {
		var item = ( $(this).val() == "-----" ? "" : $(this).val() );
		var id = $(this).attr('id');

		// update directly to temp data ( and current)
		if ( item == "" ) {
			delete current.gapanalysis[id];
			delete temp.gapanalysis[id];
		} else {
			current.gapanalysis[id] = item;
			temp.gapanalysis[id] = item;

		}

		validateOptions();
	});

	$('#gapanalysis_option_2 a').click( function () {
		$('#method_weights').click();
	});

	$('#gapanalysis_reset').click(function () {
		console.log(active);
		console.log(s);
		$('.ro').each(function () {
			var id = $(this).attr('id');
			if ( active.weights[id] ) {
				$(this).val(active.weights[id]);
				$(this).next().val(active.weight_vals[id]);
			} else {
				$(this).val('-----');
			}
			$(this).change();

		})
		$('#ga1').val(active.gapanalysis.ga1)
		$('#ga1').change();
		validateOptions();

		if ( current.layer != 'gapanalysis' && current.valid.gapanalysis ) {
			$('#gapanalysis_submit').click();
		}
	});

	$('#gapanalysis_submit').click(function () {

		validateOptions();

		if ( current.valid.gapanalysis == false ) {
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

		// generate unique id and build array with option data
		// p.name = p.country +"_"+ p.adm;
		for (var i=0, ix=p.rasters.length; i<ix; i++) {
			p.files[i] = p.files_obj[p.rasters[i]];
		// 	p.name += "_" + p.rasters[i];
		}

		// copy pending data object to submission data object
		s = (JSON.parse(JSON.stringify(p)));

		$('#analysis_results').empty()

		var height = 200 + ( 20 * ( _.size(temp.weights) + 1 ) );
		$('#map_chart_container').css('height', height )
		var new_height = height / 2 - 4;
		// console.log(height, new_height);
		$('#map_chart_toggle span').css('top', new_height );

		$('#map_chart_toggle').show();

		prepGapAnalysis();
	});

	function buildRasterList() {
		if (p.continent != "" && p.country != "" && p.adm != "") {

			cleanInterface();

			// clean all objects
			cleanOptions(1);

			// build themed default options
			var error;
			readJSON('defaults.json', function (request, status, e) {
				themes = request;
				error = e;
			})

			if (error) {
				console.log(error);
				return 1;
			} else {
				// console.log(themes)
				var html = '';

				if (themes.available[p.country] && _.keys(themes.available[p.country][p.adm]).length > 0) {
					
					var list = themes.available[p.country][p.adm];
					var keys = _.keys(list);
					
					html += '<option value="-----">Select an Option</option>';

					for ( var i = 0, ix = keys.length; i < ix; i++ ) {
						var key = keys[i];
						html += '<option value="'+key+'">'+key+'</option>'
					}

				} else {
					html += '<option value="-----">No Options Available</option>';

				}
				$('#start_option').html(html);

			}


			// build weights and gapanalysis options
			process({ call: "scan", path: "/"+p.continent.toLowerCase().toLowerCase()+"/"+p.country.toLowerCase()+"/cache" }, function (options) {
					var op_count = 0;
				    for (var op in options) {
				    	if (options[op].indexOf(p.adm) != -1 || options[op].indexOf(p.adm_alt) != -1){
				    			var option = filterOptionName(options[op], "__", 4, 4);
				    			current.rasters[option] = options[op];
				    			addOptionToGroup(option);
				    			op_count ++;
				    	}
				    }
				    if (op_count == 0) {
   						$('.method_select').each(function () {
   							$(this).prepend('<option class="no-data">No Data Available</option>');
   							$(this).prop('disabled', true);
   						});

				    } else {
   						$('.method_select').each(function () {
   							$(this).prepend('<option selected value="-----">-----</option>');
							if ( $(this).hasClass('ro') ) {
								$(this).next().prop('disabled', true);		
				    		}
				    		$(this).prop('disabled', false);
				    	});
				    }
		    });
		}
	}

	// add raster of format 'type__sub__year' to lists of available rasters
	// raster file location stored in current.rasters object
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
	        });

		});
	}

	// option = string, m = search char, n = nth occurence, p = offset from end of string
	function filterOptionName(option, m, n, p) {
		if (!p){
			p = 0;
		}
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
			// p.name = '';
			// p.hash = '';

			s = (JSON.parse(JSON.stringify(p)));
		}

		if ( c == 1 || c == 3 ){
			current = {
				rasters: {},
				weights: {},
				weight_vals: {},
				gapanalysis: {},
				valid: {
					weights:false,
					gapanalysis:false
				},
				files: {
					weights:"",
					gapanalysis:""		
				}
			};
			temp = (JSON.parse(JSON.stringify(current)));
			active = (JSON.parse(JSON.stringify(temp)));
 		}
 	}

 	function cleanInterface() {
		
		$('#start_option').empty();

		// go to start menu
		$('#method_start').click();

		// clear all selectors used by a method
		$('.method_select').each(function () {
			$(this).empty();
		})

		// hide all submit buttons
		$('.map_options_valid').hide();

		$('#gapanalysis_option_2 a').html('Build a Custom Layer');

    	$('#weights_csv a').attr('href', "#");
    	$('#gapanalysis_csv').attr('href', '#');
    	// $('#report').attr('href', '#');

    	cleanMap('chart');
    	$('#map_chart_toggle').hide();

 	}

 	function validateOptions() {

		current.valid.weights = ( _.size(current.weights) > 0 );

		$('.wo').each(function () {
			var val = parseInt( $(this).val() );
			if ( val < -10 || val > 10 || isNaN(val) ) {
				current.valid.weights = false;
			}
		})

		showState('#weights_submit', current.valid.weights);

		current.valid.gapanalysis = ( _.size(current.gapanalysis) == 2 );

		showState('#gapanalysis_submit', current.valid.gapanalysis);

		// if ( $('#'+p.method+'_submit').length && current.valid[p.method] == true ) {
		// 	$('#'+p.method+'_submit').show();
		// } else {
		// 	$('#'+p.method+'_submit').hide();
		// }

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
    var onPoint = false;
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
	});

	// point type selection
	$("#data_type ul li").on("click", function () {
		if (p.country == ""){ 
			return; 
		}

		onPoint = true;
		d.type = $(this).attr("id");
		addPointData();
	
	});

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
	var map, tiles, map_display, map_button, allCountryBounds, mapinfo;
	
	L.mapbox.accessToken = 'pk.eyJ1Ijoic2dvb2RtIiwiYSI6InotZ3EzZFkifQ.s306QpxfiAngAwxzRi2gWg';

	map = L.mapbox.map('map', {});

	tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap contributors</a>'
			}).addTo(map);

	map.setView([0,0], 3);

	map.options.maxZoom = 11;
	map.options.minZoom = 2;

 //    map_display = {
 //    		map_button:true,
 //    		map_options: '',
 //    		map_chart_container: '',
 //    		analysis_tab: ''
 //    	}
    	
	// map_button = L.easyButton('fa-exchange', 
 //  		function (){
 //  			for ( var i=1, ix=_.keys(map_display).length; i<ix; i++) {
 //  				var key = _.keys(map_display)[i]; 
 //  				console.log(key)
 //  				if ( map_display.map_button == true ) {
 //  					if ( $('#'+key).length > 0 ) {
	//   					map_display[key] = 'on';
	//   					showState('#'+key,false)
	//   				} else {
	//   					map_display[key] = 'off'
	//   				}
  					
 //  				} else {
 //  					if ( map_display[key] == 'on' ) {
 //  						showState('#'+key,true)
 //  					}
 //  				}
 //  			}
  			
 //        	map_display.map_button = !map_display.map_button;
 //      	},
 //      	'Toggle map UI display',
 //      	map
 //    )

	// bounds objects
	allCountryBounds = { global:{_northEast:{lat:90, lng:180}, _southWest:{lat:-90, lng:-180}} };

	mapinfo = {};

	// addCountry vars: countryLayer
	// addPointData vars: markers, geojsonPoints
	// addPolyData vars: geojsonPolyData, geojson, info, legend, featureList
	var countryLayer, markers, geojsonPoints, geojsonPolyData, geojson, info, legend, featureList, lastClicked; 

	
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
		var undefined;

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

			lastClicked = undefined;
		}

		if (method == "chart" || method == "all") {
    	   	$('#map_chart').html(m.map_chart);
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
				        });
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
		console.log(s)
		map.spin(true)
		$.ajax ({
	        url: "process.php",
	        data: {call: "weights", continent: s.continent, country: s.country, adm: s.adm, /*name: s.name,*/ rasters: s.rasters, weights: s.weights, files: s.files},
	        dataType: "text",
	        type: "post",
	        async: false,
	        success: function (result) {
	        	var file = "../data/weights/" + result + ".geojson";
				var error
				readJSON(file, function (request, status, e) {
					geojsonPolyData = request;
					error = e;
				})

				if (error) {
					console.log(error);
					return 1;
				}

	        	// s.hash = result;
	        	current.layer = 'weights';
	        	current.rasters["custom_weighted_layer"] = result + ".csv";
	        	current.gapanalysis.ga2 = "custom_weighted_layer";
	        	current.files.weights = result;

				// load current data into temp
				temp = (JSON.parse(JSON.stringify(current)));

	        	$('#weights_csv a').attr('href', "../data/weights_csv/" + result + ".csv")
       			$('#weights_csv').show();

       			$('#gapanalysis_option_2 a').html('Edit Your Custom Layer');

	        	addPolyData();
       	       	map.spin(false);
	        }
	    });
	}

	// ajax to run Rscript which builds gapanalysis geojson
	function prepGapAnalysis() {
		map.spin(true)
		$.ajax ({
	        url: "process.php",
	        data: {call: "gapanalysis", continent: s.continent, country: s.country, adm: s.adm, /*name: s.name,*/ rasters: s.rasters, files: s.files},
	        dataType: "text",
	        type: "post",
	        async: false,
	        success: function (result) {
	        	var file = "../data/gapanalysis/" + result + ".geojson";

    			var error
				readJSON(file, function (request, status, e) {
					geojsonPolyData = request;
					error = e;
				})

				if (error) {
					console.log(error);
					return 1;
				}

	        	current.layer = 'gapanalysis';
	        	current.files.gapanalysis = result;
	        	temp.files.gapanalysis = result;

				// update list of options used to generate current gap analysis
				active = (JSON.parse(JSON.stringify(temp)));

	        	$('#gapanalysis_csv').attr('href', "../data/gapanalysis_csv/" + result + ".csv");
       			$('#gapanalysis_csv').show();

	        	// generate link
	        	buildHash();

	        	addPolyData();
       	       	map.spin(false);
        	    runAnalysis();	

	        }
	    });
	}

	// depends on s.method, s.adm, s.rasters, active.weights, geojsonPolyData
	function addPolyData() {

		featureList = {};

		cleanMap("poly");
   		cleanMap("chart");

		// console.log(current);
		// console.log(s);
		// console.log(geojsonPolyData);

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
		        weight: 4
		    });

		    if (!L.Browser.ie && !L.Browser.opera) {
		        layer.bringToFront();
		    }

   		    info.update(e.target.feature.properties);

		}

		function mouseoutFeature(e) {

		    var layer = e.target;

		    layer.setStyle({
		        weight: 1
		    });

		    if (!L.Browser.ie && !L.Browser.opera) {
		        layer.bringToFront();
		    }

   		    info.update(e.target.feature.properties);

		    // geojson.resetStyle(layer);
		    // info.update();
		}

		function clickFeature(e) {

			var layer = e.target;

			if (lastClicked && lastClicked == layer._leaflet_id ) {
				return;
			}

			lastClicked = layer._leaflet_id;


			// zoom to feature
	    	// map.fitBounds(e.target.getBounds());

	    	if (s.method == "weights" || map_state < 100) {
	    		// add message
	    		return;
	    	}

	    	$('#map_chart').show();
	    	var map_chart_data = {
	    		raw: [],
	    		sum: 0,
	    		min: 0,
	    		categories:[ '', '' ],
	    		series:[]
	    	};

	    	// aid series
	    	map_chart_data.series.push({
	    		name: s.rasters[0],
	    		data: [ roundxy(parseFloat(layer.feature.properties[s.rasters[0]+"_percent"])) ],
	    		stack: 0
	    	});

	    	for ( var i = 0, ix = _.size(active.weights); i < ix; i++ ) {
	    		var val = parseFloat( layer.feature.properties[_.values(active.weights)[i]+"_weighted"] );
	    		// console.log(val, isNaN(val))
	    		map_chart_data.raw.push(val);
	    	}

	    	map_chart_data.min = ss.min(map_chart_data.raw);
	    	map_chart_data.count = map_chart_data.raw.length;

	    	if ( map_chart_data.min < 0 ) {
		    	for ( var i = 0, ix = map_chart_data.count; i < ix; i++ ) {
		    		map_chart_data.raw[i] = map_chart_data.raw[i] + map_chart_data.min;
		    	}
		    }

	    	map_chart_data.sum = ss.sum(map_chart_data.raw);

	    	for ( var i = 0, ix = map_chart_data.count; i < ix; i++ ) {
	    		var val = roundxy( parseFloat(layer.feature.properties[s.rasters[1]+"_percent"]) * map_chart_data.raw[i] / map_chart_data.sum );
	    		map_chart_data.series.push({
	    			name: _.values(active.weights)[i],
	    			data: [ val ],
	    			stack: 1
	    		});
	    	}

	    	// console.log(map_chart_data);
			// console.log(e)
	    	// console.log(s)
	    	// console.log(active)

	    	var map_chart_options = {
		        chart: {
		        	type: 'bar',
		        	spacingTop: 17 + ( 17 * map_chart_data.count ),
		        	spacingRight: 20
		        },
		        title: {
		            text: '' //layer.feature.properties["NAME_"+s.adm.substr(3)]
		        },
		        subtitle: {
		            text: ''
		        },
		        xAxis: {
		            categories: map_chart_data.categories,
		            title: {
		            	text: layer.feature.properties["NAME_"+s.adm.substr(3)]
		            }//,
		            // labels: {
		                // rotation: -90//,
		                // style: {
		                //     fontSize: '13px',
		                //     fontFamily: 'Verdana, sans-serif'
		                // }
		            // }
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
		        // tooltip: {
		        // 	enabled:false,
		        // 	useHTML:true,
		        // 	shared:true,
		        //     formatter: function () {
		        //         var s = '<div id="map_chart_tooltip">';
		        //         s += '<b>' + this.x + '</b>';
		        //         s += '<ul>';
		        //         $.each(this.points, function () {
		        //             s += '<br/><li style="color:'+ this.series.color +'"><span style="color:black">' + this.series.name + ': ' + this.y + '</span></li>';
		        //         });
		        //         s += '</ul>'
		        //         s += '</div>'

		        //         return s;
		        //     },
		        // 	positioner: function () {
		        //         return { x: 0, y: 0 };
		        //     },
		        //     shadow: false,
		        //     borderWidth: 0,
		        //     backgroundColor: 'rgba(0,0,0,0)',
		        //     hideDelay:0
		        // },
		        tooltip: {
		        	enabled:true,
		        	useHTML:true,
		        	shared:false,
		            formatter: function () {
		            	var html = '<b>' + this.y + '</b>';
		                return html;
		            },
		        	// positioner: function () {
		         //        return { x: 0, y: 0 };
		         //    },
		            // shadow: false,
		            // borderWidth: 0,
		            // backgroundColor: 'rgba(0,0,0,0)',
		            hideDelay:0
		        },
		         plotOptions: {
		         	bar: {
		            	stacking: 'normal'//,
		                // dataLabels: {
		                //     enabled: true,
		                //     align:'right',
		                //     color:'white'
		                // }
		            }
		        },
		        legend: {
		        	// enabled:false,
		            layout: 'vertical',
		            align: 'left',
		            x: 0,
		            verticalAlign: 'top',
		            y: -17 - ( 17 * map_chart_data.count ),
		            floating: true,
		            backgroundColor: 'rgba(255,255,255,0)'
		        },
		        credits:{
		        	enabled:false
		        },
		        series: map_chart_data.series
	    	 };

	    	$('#map_chart').highcharts(map_chart_options);
	    	// console.log(map_chart_options);

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
		});

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

		    div.innerHTML += '<div id="legend_title">' + s.method + '</div>';

		    // loop through grades and generate a label with a colored square for each interval
			for (var i = 0, ix=grades[s.method].length; i < ix; i++) {
		        div.innerHTML += '<i style="background:' + getColor(grades[s.method][i]) + '"></i> ';
		       
		        if ( s.method == "gapanalysis" && !grades[s.method][i+1] ) {
		        	div.innerHTML += grades[s.method][i-1]  + '+<br>';
		        } else {
		        	div.innerHTML += "<= " + grades[s.method][i]  + '<br>';
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
		// 	if ( $('#analysis_chart').length) {
		// 		$('#analysis_chart').redraw();
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

	$('#map_size_toggle').click(function () {
		if ( $('#map').data('collapsed') == false ) {
			mapSize(50, 'map');
			$('#map').data('collapsed', true);

		} else {
			mapSize(100, 'map');
			$('#map').data('collapsed', false);

		}
	});

	function mapSize(percent, div) {

	    // var pan = map.getCenter();
	    // var bounds = map.getBounds();
	    map_state = percent;

	    if ( map_state < 100 ) {
	    	$('#map_options').hide();
	    	$('#map_chart_container').hide();
	    } else {
	    	$('#map_options').show();
	    	$('#map_chart_container').show();
	    }

		$('#map_container').animate({
	      	height: percent+'%'
	    }, function () {
		    map.invalidateSize();
			map.fitBounds( allCountryBounds[p.country] );
	      	// map.panTo(pan, {animate:true, duration:1.0});
	      	// map.fitBounds(bounds);

		    $('html, body').animate({
		        scrollTop: $("#"+div).offset().top
		    }, 500);
		    $( window ).scroll();
	    });
	}


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

	// depends on s.adm, s.rasters and active.weights
	function runAnalysis() {
		$('#analysis').show();
		$('#analysis_tab').show();
		$('#gapanalysis_buttons').show();
		// console.log(geojsonPolyData);

		var data = {
			raw: geojsonPolyData.features,
			keys: _.keys(geojsonPolyData.features),
			props: {},
			featureCount: _.size(geojsonPolyData.features),
			weightCount: _.size(active.weights),
			results: {},
			// primary: [],
			// secondary: [],
			categories: [],
			series: [],
			temp: []
		};

		var subtitle = ( data.featureCount > 10 ? 'Top 5 Underfunded / Top 5 Overfunded' : '');

		for ( var i = 0, ix = data.featureCount; i < ix; i++ ) {
			data.props[i] = data.raw[data.keys[i]].properties;
			data.results[i] = parseFloat(data.props[i].result);
		}

		data.bot5 = _.values(data.results).sort( function(a, b) { return a-b } )[4];
		data.top5 = _.values(data.results).sort( function(a, b) { return b-a } )[4];

		// init aid item of series
		data.series.push({
			name: s.rasters[0],
			data: [],
			stack: 0
		});

		// init data items of series
		for ( var j = 0, jx = data.weightCount; j < jx; j++ ) {
			data.series.push ({
				name: _.values(active.weights)[j],
				data: [],
				stack: 1
			});
		}

		// build subdata
		for ( var i = 0, ix = data.featureCount; i < ix; i++ ) {

			var item = data.props[data.keys[i]]; 

			if ( data.featureCount <= 10 ) {
				data.categories.push(item["NAME_" + s.adm.substr(3,1)]);

				// data.primary.push( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );
				data.series[0].data.push( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );

				// data.secondary.push( roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
				// normalize data per feature
				data.temp = [];
				for ( var j = 0, jx = data.weightCount; j < jx; j++ ) {
					data.temp.push(  roundxy( parseFloat(item[_.values(active.weights)[j]+"_weighted"]) ) );
				}
				data.temp = normalize(data.temp,  roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
				for ( var j = 0, jx = data.weightCount; j < jx; j++ ) {
					data.series[j+1].data.push( data.temp[j] );
				}


			} else {

				if ( parseFloat(item.result) <= data.bot5 ) {
					data.categories.unshift(item["NAME_" + s.adm.substr(3,1)]);

					// data.primary.unshift( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );
					data.series[0].data.unshift( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );

					// data.secondary.unshift( roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
					// normalize data per feature
					data.temp = [];
					for ( var j = 0, jx = data.weightCount; j < jx; j++ ) {
						data.temp.push(  roundxy( parseFloat(item[_.values(active.weights)[j]+"_weighted"]) ) );
					}
					data.temp = normalize(data.temp,  roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
					for ( var j = 0, jx = data.weightCount; j < jx; j++ ) {
						data.series[j+1].data.unshift( data.temp[j] );
					}
				}

				if ( parseFloat(item.result) >= data.top5 ) {
					data.categories.push(item["NAME_" + s.adm.substr(3,1)]);

					// data.primary.push( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );
					data.series[0].data.push( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );

					// data.secondary.push( roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
					// normalize data per feature
					data.temp = [];
					for ( var j = 0, jx = data.weightCount; j < jx; j++ ) {
						data.temp.push(  roundxy( parseFloat(item[_.values(active.weights)[j]+"_weighted"]) ) );
					}
					data.temp = normalize(data.temp,  roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
					for ( var j = 0, jx = data.weightCount; j < jx; j++ ) {
						data.series[j+1].data.push( data.temp[j] );
					}
				}

			}

		}

		console.log(data);

		data.chart_options = {
	        chart: {
	        	type: 'column',
	        	spacingBottom: 75
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
	         	// column: {
	          //   	stacking: 'normal'
           //  	},
            	series: {
	            	stacking: 'normal',
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
	            // align: 'left',
	            x: -5,
	            // verticalAlign: 'top',
	            y: 60,
	            floating: true,
	            backgroundColor: 'rgba(255,255,255,0)' //(Highcharts.theme && Highcharts.theme.legendBackgroundColor) || '#FFFFFF'
	        },
	        credits:{
	        	enabled:false
	        },
	        series: data.series//[{
	        //     name: 'Aid',
	        //     data: data.primary//,
	        //     // tooltip: {
	        //     //     valueSuffix: ''
	        //     // }

	        // }, {
	        //     name: 'Data',
	        //     data: data.secondary//,
	        // //     // tooltip: {
	        // //     //     valueSuffix: ''
	        //     // }
	        // }]
	    };

		$('#analysis_results').append('<div id="analysis_chart"></div>');
		$('#analysis_chart').highcharts(data.chart_options);
        $('html, body').animate({ scrollTop: 0 }, 0);

	}

	// normalize array of data as percentage of value
	function normalize(ndata, nval) {

		var count = ndata.length;
		var min = ss.min(ndata);

    	if ( min < 0 ) {
	    	for ( var j = 0, jx = count; j < jx; j++ ) {
	    		ndata[j] = ndata[j] + min;
	    	}
	    }

    	var sum = ss.sum(ndata);

    	for ( var j = 0, jx = count; j < jx; j++ ) {
    		var val = roundxy( parseFloat( nval * ndata[j] / sum ) );
			ndata[j] = val;
    	}

		return ndata;
    	
    }


	// --------------------------------------------------
	// report generation


    $("#report").click(function(){

  //   	$('#map_container').hide();
  //   	$('#map_size').hide();
  //   	// $('#analysis_title').hide();
  //   	$('#navbar').hide();
  //   	$('#analysis_map').show();

		// var file = "../data/gapanalysis/" + active.files.gapanalysis + ".geojson";

		// var analysis_map = L.map('analysis_map', {});

		// var analysis_tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
		// 			attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap contributors</a>'
		// 		}).addTo(analysis_map);

		// map.setView([0,0], 3);

		// var analysisPolyData;
		// var error
		// readJSON(file, function (request, status, e) {
		// 	analysisPolyData = request;
		// 	error = e;
		// })

		// if (error) {
		// 	console.log(error);
		// 	return 1;
		// }

	 //    var grades = {
	 //    	gapanalysis: [-1.5, -1.0, -0.5, 0.5, 1.0, 1.5, 2]
	 //    };

		// function getColor(d) {

		//     return d <= -1.5 ? '#de2d26' :
		//            d <= -1.0 ? '#fc9272' :
		//            d <= -0.5 ? '#fee0d2' :

		//            d <= 0.5 ? '#fff7bc' :
		//            d <= 1.0 ? '#e5f5e0' :
  //  		           d <= 1.5 ? '#a1d99b' :
  //  		           			  '#31a354';
   		    
		// }

		// function style(feature) {
		//     return {
		//         fillColor: getColor(feature.properties.result),
		//         weight: 1,
		//         opacity: 1,
		//         color: 'black',
		//         fillOpacity: 0.75
		//     };
		// }



		// var analysis_geojson = L.geoJson(analysisPolyData, {
		//     style: style
		// });

		// analysis_map.addLayer(analysis_geojson, true);

		// analysis_map.fitBounds( analysis_geojson.getBounds() );


		// // manage legend
		// var analysis_legend = L.control({position: 'bottomright'});

		// analysis_legend.onAdd = function (map) {

		//     var div = L.DomUtil.create('div', 'info legend');

		//     // loop through grades and generate a label with a colored square for each interval
		// 	for (var i = 0, ix=grades[s.method].length; i < ix; i++) {
		//         div.innerHTML += '<i style="background:' + getColor(grades[s.method][i]) + '"></i> ';
		       
		//         if ( s.method == "gapanalysis" && !grades[s.method][i+1] ) {
		//         	div.innerHTML += grades[s.method][i-1]  + '+<br>';
		//         } else {
		//         	div.innerHTML += "<= " + grades[s.method][i]  + '<br>';
		//         }
		//     }

		//     return div;
		// };

		// analysis_legend.addTo(analysis_map);



        saveChart('analysis_chart', active.files.gapanalysis + '_analysis_chart');
        // saveChart('analysis_map', 'analysis_map_name');

		// setTimeout(function() {

			// html2canvas($('#map'),{
   //              onrendered: function (canvas) {                     
   //                          var imgString = canvas.toDataURL("image/png");
   //                          window.open(imgString);   
   //              }               
   //          });
		// 	$('#analysis_map').html2canvas({
		// 		flashcanvas: "/aiddata/libs/canvas/flashcanvas.min.js",
		// 		proxy: 'proxy.php',
		// 		logging: false,
		// 		profile: false,
		// 		useCORS: true,
	 //            allowTaint: true
		// 	});
		// },1000)

       	window.open('report.php#'+active.files.gapanalysis);


		// $.ajax({
  //         	url: "report.php",
  //         	data: {filename: active.files.gapanalysis},
  // 	        dataType: "json",
	 //        type: "post",
	 //        async: true,
  //         	success: function(result){
  //           	console.log(result);
  //         	},    
	 //    	error: function (request, status, error) {
  //       		// console.log(request) 
  //       		// console.log(status) 
  //       		console.log(error);
  //   		}
  //       });

    });

    // save a highchart to png
    function saveChart(chart, name) {
		var svg = document.getElementById(chart).children[0].innerHTML;
        var canvas = document.getElementById('canvas');
        canvg(canvas,svg);
        var img = canvas.toDataURL("image/png"); //img is data:image/png;base64
        var img_data = {call:'saveimg', img: img, name:name};
        console.log(img_data);
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

	function showState(el, state) {
		if (state == true) {
			$(el).show();
		} else {
			$(el).hide();
		}
	}

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


	// --------------------------------------------------
	// link functions


	var hash_change = 1;

	function buildHash() {
		console.log('buildHash');

		hash_change = 0;

		var link_weight = [];

		$('.ro').each(function () {
			var id = $(this).attr('id');
			if (active.weights[id]) {
				var weight_item = id + '--' + active.weights[id] + '--' + active.weight_vals[id];
				link_weight.push(weight_item);
			}
		});

		// build hash data object
        var url_search = {
                            country: s.country,
                            adm: s.adm,
                            weights: link_weight, 
                            gapanalysis: active.gapanalysis.ga1,
                            active_gapanalysis: active.files.gapanalysis,
                            active_weights: active.files.weights,
                          };
        if ( theme_state != '-----' && theme_state != undefined ) {
        	url_search.theme = theme_state;
        }
        var url_new = URI(document.URL).addSearch(url_search);

        window.location.hash = url_new.query();
      
	}

  	function readHash () {
  		$('#map_options_content').hide();
	    var url = document.URL.replace("#", "?"),
	        url_query = URI(url).query(true);

		console.log('readHash');
		console.log(url_query);

	    if ( url_query.country && $('#country option[value="' + url_query.country + '"]').length) {
	    	$('#country').val(url_query.country);
	    	$('#country').change();
	    } 

	    if ( url_query.adm && $('#adm option[value="' + url_query.adm + '"]').length) {
	    	$('#adm').val(url_query.adm);
	    	$('#adm').change();
	    } 

	    if ( theme_state ) {
	    	$('#start_option').val(url_query.theme);
	    	$('#start_option').change();
	    }

	    if ( url_query.weights && url_query.active_weights ) {
	    	
	    	if ( !_.isArray(url_query.weights) ) {
	    		url_query.weights = [url_query.weights];
	    	}
	  
	    	for ( var i = 0, ix = url_query.weights.length; i < ix; i++ ) {
	    		var weight_parts = url_query.weights[i].split('--');
	    		$('#'+weight_parts[0]).val(weight_parts[1]);
	    		$('#'+weight_parts[0]).change();
	    		$('#'+weight_parts[0]).next().val(weight_parts[2]);
	    		$('#'+weight_parts[0]).next().change();
	    	}


	    }

		if ( url_query.gapanalysis && url_query.active_gapanalysis ) {
    		$('#ga1').val(url_query.gapanalysis);
    		$('#ga1').change();   
	    }

	    state = 'link';

	    validateOptions();

	    $('#method_weights').click();
	    $('#weights_submit').click();

	    $('#method_gapanalysis').click();
	    $('#gapanalysis_submit').click();
  		$('#map_options_toggle').click();

  	};

  	// check hashtag (called on page load or on hashtag change)
  	function checkHash(type) {
	    // check for hash_change variable to avoid reloads when hash change was generate by page
	    if (window.location.hash !== '' && hash_change == 1) {
      		setTimeout(readHash, 200);
    	} else if (window.location.hash == '' && type == 'init') {
    		$('#map_options_content').slideDown(500);

    	}
   		hash_change = 1;
  	};
	
    // check hashtag on change and on page load
    $(window).on('hashchange', function () {
    	checkHash();
    });
    checkHash('init');

})

// function manipulateCanvasFunction(savedMap) {
//     dataURL = savedMap.toDataURL("image/png");
//     dataURL = dataURL.replace(/^data:image\/(png|jpg);base64,/, "");
//     $.post("process.php", { call: 'savemap', img: dataURL }, function(data) {
//         console.log('Image Saved to : ' + data);
//     });

// }


