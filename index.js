// ++
// ++ js for DASH
// ++

$(document).ready(function () {

	//submission data and pending data objects
	var s, p = {
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

	// file paths for rasters available for selected country / adm
	var options_log = {};
	// stores currently selected rasters for each select
	var raster_list = {};

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
		overunder:"",
		points:"<p>Overlay project point data on the map.</p>",
		toggle:"<p>You can toggle this tab by clicking anywhere on the tab.</p>"
	}


	// --------------------------------------------------
	// build options


	$('#country').val('-----')
	$('#adm').val('-----')
	$('#adm').prop('disabled', true);
	message(m.init, "static");
	$('#map_options_content').slideDown(500);

	$('#map_options_toggle').click(function(){
		$('#map_options_content').slideToggle();
	})

	$('#map_options_popover').click(function(){
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

		// create list of rasters available for the selected country / adm
		buildRasterList()

	})

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

		// create list of rasters available for the selected country / adm
		buildRasterList()
	})

	$('#method li').click(function(){
		$('#method li').removeClass("active");
		$(this).addClass("active");
		var method = $(this).attr("id").split("_")[1];
		$('.method').hide();
		$('#'+method).show();
		$('#map_options_submit').show();
		message("", "static");
		message(m[method]+m.toggle);
		if ( $('#map_options_popover').data('collapsed') == true ) {
			$('#map_options_popover').click();
		}
	})

	$('.ro').on('change', function () {
		console.log(raster_list)
		var item = $(this).val()
		var id = $(this).attr('id');
		if ( item == "-----"  ) {
			$(this).next().prop('disabled', true);
			raster_list[id] = "";		
		} else {
			$(this).next().prop('disabled', false);	
			raster_list[id] = item;
		}

		$('.ro').each(function(){
			var sub_item = $(this).val();
			var sub_id = $(this).attr('id');

			$(this).find('option').each(function(){
				console.log($(this).val(), sub_id, raster_list[sub_id])
				$(this).prop("disabled",false);	
				if ( raster_list[sub_id] != $(this).val() && _.values(raster_list).indexOf( $(this).val() ) > -1 ) {
					console.log("in")
					$(this).prop("disabled",true);
				}
			})

		})

	})


	$('#submit').click(function () {

		p.rasters = []
		p.weights = []
		p.files = []
		p.weights_obj = {}
		p.files_obj = {}

		// get raster name for each weight item and update weight object
		$('.ro').each(function () {
			var option = $(this).val()
			if ( option != "-----") {

				p.rasters.push(option)
				var weight = $(this).next().val()
				p.weights_obj[option] = weight
				p.files_obj[option] = options_log[option]
			}
		})

		if ( p.rasters.length == 0 ) {
			console.log("weights: no data selected")
			return;
		}

		// sort rasters list to preserve naming system
		// prevents identical calls creating different files due to naming system
		p.rasters.sort()

		// generate unique id
		p.id = p.country +"_"+ p.adm
		for (var i=0, ix=p.rasters.length; i<ix; i++) {
			p.weights[i] = p.weights_obj[p.rasters[i]]
			p.files[i] = p.files_obj[p.rasters[i]]
			p.id += "_" + p.rasters[i] +"_"+ p.weights[i]
		}

		// copy pending data object to submission data object
		s = p
		console.log(s)
		// build weighted geojson
		prepExtract()

	})


	function buildRasterList() {
		if (p.continent != "" && p.country != "" && p.adm != "") {

			// init
			$('.ro').each(function(){
				$(this).empty()
			})
			p.rasters = []
			p.weights = []
			p.files = []
			p.weight_obj = {}
			p.files_obj={}
			options_log = {}

			// build
			process({ type: "scan", path: "/"+p.continent.toLowerCase().toLowerCase()+"/"+p.country.toLowerCase()+"/cache" }, function (options) {
					var op_count = 0;
				    for (var op in options) {
				    	if (options[op].indexOf(p.adm) != -1 || options[op].indexOf(p.adm_alt) != -1){
				    			var option = filterOptionName(options[op], "__", 4, 4);
				    			options_log[option] = options[op];
				    			addOptionToGroup(option);
				    			op_count ++;
				    	}
				    }
				    if (op_count == 0) {
   						$('.ro').each(function(){
   							$(this).prepend('<option class="no-data">No Data Available</option>');
   							$(this).prop('disabled', true);
   						})

				    } else {
   						$('.ro').each(function(){
   							$(this).prepend('<option selected value="-----">-----</option>');
							$(this).next().prop('disabled', true);		
				    		$(this).prop('disabled', false);
				    	})
				    }
		    })
		}
	}

	// add raster of format 'type__sub__year' to lists of available rasters
	// raster file location stored in options_log object
	function addOptionToGroup(option) {
    	var type = option.substr(0,option.indexOf("__"))

    	if ( !$(".optgroup_"+type).length ) {
    		$(".ro").each(function(){
    			$(this).append('<optgroup class="optgroup_'+type+'" label="'+type+'"></optgroup>')
    		})
    	}
	        
        $(".optgroup_"+type).each(function(){
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

 	function message(html, option) {
 		if ( option && option == "static") {
 			$('#map_options_message').html(html);
 		}
 		$('#map_options_popover').html(html);
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

	$('#clear_points button').click(function(){
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
	// addGeoExtract vars: geojson, info, legend
	var countryLayer, markers, geojsonPoints, geojson, info, legend 

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
	        data: {type: "addPointData", country:p.country, pointType: d.type, start_year:d.start_year, end_year:d.end_year},
	        dataType: "json",
	        type: "post",
	        async: false,
	        success: function (geojsonContents) {
				
				geojsonPoints = geojsonContents

				markers = new L.MarkerClusterGroup({
					disableClusteringAtZoom: 12
				});

				var geojsonLayer = L.geoJson(geojsonContents, {
					onEachFeature: function (feature, layer) {
						var a = feature.properties

						var popup = ""
						popup += "<b>Location Info</b>" 
						popup += "<br>Geoname: " + a.geoname
						popup += "<br>ADM1: " + a.ADM1_NAME
						if (a.ADM2_NAME) { popup += "<br>ADM2: " + a.ADM2_NAME }
						if (a.ADM3_NAME) { popup += "<br>ADM3: " + a.ADM3_NAME }

						popup += "<br><br><b>Project Info</b>"
						popup += "<br>Date of Agreement: " + a.date_of_agreement
						popup += "<br>Donors: " + a.donor
						popup += "<br>Project Sites: " + a.count

						popup += "<br>Years: "
						var c = 0
						for (var y = d.start_year; y<=d.end_year; y++) {
							if ( parseFloat(a["d_"+y]) > 0 ) {
								if (c>0) { popup += ", "}
								popup += y
								c++							
							}
						}
						popup += "<br>USD: "
						c = 0
						for (var y = d.start_year; y<=d.end_year; y++) {
							if ( parseInt(a["d_"+y]) > 0 ) {
								if (c>0) { popup += ", "}
								popup += ( parseInt(a["d_"+y]) ).toLocaleString()
								c++							
							}
						}

						layer.bindPopup(popup);
					},
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

	function prepExtract() {
		map.spin(true)
		$.ajax ({
	        url: "process.php",
	        data: {type: "buildPolyData", continent: s.continent, country: s.country, adm: s.adm, name:s.id, rasters: s.rasters, weights: s.weights, files: s.files},
	        dataType: "text",
	        type: "post",
	        async: false,
	        success: function (result) {
	        	addGeoExtract("../MAT/data/"+result+".geojson")
       	       	map.spin(false)
	        }
	    })
	}


	function addGeoExtract(file) {

		cleanMap("poly")

		// var geojsonFeature = readJSON(file)
		
		var geojsonFeature, error
		readJSON(file, function (request, status, e) {
			geojsonFeature = request
			error = e
		})

		if (error) {
			console.log(error)
			return 1
		}

		function getColor(d) {
		    return d <= 0.15 ? '#de2d26' :
		           d <= 0.30 ? '#fc9272' :
		           d <= 0.45 ? '#fee0d2' :

		           d <= 0.60 ? '#fff7bc' :
		           d <= 0.85 ? '#e5f5e0' :
   		           			   '#a1d99b' ; 
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
		info.update = function (props) {
			var html =  '<h4>Weight Result</h4>'

			if (props) {
				html += '<b>' + props["NAME_"+s.adm.substr(3)] + '</b><br />' 
		        
		        html += "<table id='map_table'><thead><tr><th>Raster</th><th>Raw</th><th>Weighted</th></tr></thead><tbody>"
		        for (var i=0, ix=s.rasters.length; i<ix; i++) {


    			    html += '<tr><td>' + s.rasters[i] + '</td><td>' + roundx( props[s.rasters[i]] ) + '</td><td>' + (props[s.rasters[i]+"_weighted"] ? roundx(props[s.rasters[i]+"_weighted"]) : "" ) + '</td></tr>'

		        }
		        html += "</tbody></table>"

		        html += 'Result: ' + roundx(props.result) 
			
			} else {
				html = 'Hover over an area'
			}

		    this._div.innerHTML = html
		        
		};

		info.addTo(map);

		function roundx(x) {
			return Math.floor(x*1000)/(1000)
		}

		// manage legend
		legend = L.control({position: 'bottomright'});

		legend.onAdd = function (map) {

		    var div = L.DomUtil.create('div', 'info legend'),

		        grades = [0.15, 0.30, 0.45, 0.60, 0.85, 1], // ### HERE ###
		        labels = [];

		    // loop through our density intervals and generate a label with a colored square for each interval
		    for (var i = 0, ix = grades.length; i < ix; i++) {
		        div.innerHTML += '<i style="background:' + getColor(grades[i]) + '"></i> ';

		        div.innerHTML += "<= " + grades[i]  + '<br>';
		        
		    }
		    return div;
		};

		legend.addTo(map);

	}

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


	// --------------------------------------------------
	// general functions


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

		process({type:"exists", name:h}, function(result){
			if (result == true) {
				console.log(h);
				$('#build_toggle').slideDown()
				$("#build_toggle").click();
				addGeoExtract("data/"+h+".geojson");
			} else {
				console.log("bad hash");
			}

		})

	};

	readHash();
	
})
