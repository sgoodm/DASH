// ++
// ++ js for DASH report
// ++

$(document).ready(function () {
	
	var hash = '',
		files = {
			map: 'data/gapanalysis/PLACEHOLDER.geojson',
			chart_options: {
				extremes: 'data/images/gapanalysis/PLACEHOLDER/analysis_chart_extremes.png',
				funding: 'data/images/gapanalysis/PLACEHOLDER/analysis_chart_funding.png',
				ratio: 'data/images/gapanalysis/PLACEHOLDER/analysis_chart_ratio.png'
			}
			// chart_options: {
			// 	extremes: 'data/images/gapanalysis/PLACEHOLDER/analysis_chart_extremes.png',
			// 	funding: 'data/images/gapanalysis/PLACEHOLDER/analysis_chart_funding.png',
			// 	ratio: 'data/images/gapanalysis/PLACEHOLDER/analysis_chart_ratio.png'
			// }
		};

	var tile_load = false, 
		tile_timeout = 0,
		tile_timelimit = 5000;

	var json;



    // check hashtag on change and on page load
    $(window).on('hashchange', function () {
    	checkHash();
    });

    checkHash();

  	// check hashtag (called on page load or on hashtag change)
  	function checkHash() {

	    hash = window.location.hash.substr(1);  
	    console.log(hash);
	    if (hash !== '' && hash !== '#' ) {
	    	var valid = validateHash();
	    	// validate hash
	    	if ( valid ) {
	    		console.log('valid hash');
	    		$('#message').html('Generating export options and content...');
		    	// generate page
	      		setTimeout(readHash, 200);

	    	} else {
	    		console.log('not a valid hash');
	    		$('#message').html('Not a valid link.');
	    		return;
	    	}

    	} else {
    		$('#message').html('Not a valid link.');
    	}
  	};
	

	function validateHash() {
		console.log('validateHash');

		var keys = _.keys(files.chart_options),
			// values = _.values(files.chart_options),
			state = false,
			error;

		readJSON('../data/images/gapanalysis/'+hash+'/chart_options.json', function (request, status, e) {
			json = request;
			error = e;
		})

		if (error) {
			// state = false
			return false;
		}

		// check if geojson exists
		files.map = files.map.replace('PLACEHOLDER', hash);

		process({call: 'exists', name: files.map}, function (result) {
			state = result;
		})

		if (state == false) {
			return false;
		}

		// check if chart images exist
		for ( var i = 0, ix = keys.length; i < ix; i++ ) {

			// files.chart_options[keys[i]] = values[i].replace('PLACEHOLDER', hash);

			// process({call: 'exists', name: files.chart_options[keys[i]]}, function (result) {
			// 	state = result;
			// })

			// if (state == false) {
			// 	return false;
			// }

			if (!json[keys[i]]) {
				return false;
			}



		}
		return true;

	};

	function readHash() {
		console.log('readHash');

		$('#grid').empty();

		// init grid
		var keys = _.keys(files.chart_options),
			values = _.values(files.chart_options),
			html = '', meta_html = '', info_html = '';

		// add title
		$('#grid_container').prepend('<div class="grid_title">AidData DASH Gap Analysis Results</div>');

		// add div for map
		html += '<div class="grid_container"><div id="map" class="grid_content" data-source="map"></div><div id="meta"></div></div>'

		// add divs for chart images
		for ( var i = 0, ix = values.length; i < ix; i++ ) {
			console.log(keys[i])
			if ( keys[i] == 'funding' ) {
				html += '<div class="grid_container"><div id="info"></div><div id="analysis_chart_'+keys[i]+'" class="grid_content medium-chart" data-source="gapanalysis/'+hash+'/analysis_chart_'+keys[i]+'.png"></div></div>';

			} else {
				html += '<div class="grid_container"><div id="analysis_chart_'+keys[i]+'" class="grid_content large-chart" data-source="gapanalysis/'+hash+'/analysis_chart_'+keys[i]+'.png"></div></div>';
			}
		}

		$('#grid').html(html);	
		// $("#grid").sortable();


		// add map
		buildMap();

		// add charts
		for ( var i = 0, ix = values.length; i < ix; i++ ) {
			var key = keys[i];
			console.log(key);
			// addImage('#analysis_chart'+keys[i], values[i]);
			$('#analysis_chart_'+key).highcharts(json[key]);

		}

		// add meta
		meta_html += '<table>'
		meta_html += '<thead><tr><th colspan=2>Meta Info</th></tr></thead><tbody>';
		meta_html += '<tr><td>Country</td><td class="tright">'+json.meta.country+'</td></tr>';
		meta_html += '<tr><td>ADM</td><td class="tright">'+json.meta.adm+'</td></tr>';
		meta_html += '<tr><td>Aid Layer</td><td class="tright">'+json.meta.gapanalysis+'</td></tr>';
		meta_html += '<tr><td colspan=2 style="text-align:center;">Weighted Layers</td></tr>';

		for (var i=0, ix=_.size(json.meta.weights); i<ix; i++) {
			var key, w_name, w_val;
			key = _.keys(json.meta.weights)[i];
			w_name = json.meta.weights[key];
			w_val = json.meta.weight_vals[key];
			meta_html += '<tr><td colspan=2>'+w_name+' ('+w_val+')</td></tr>';
		}

		meta_html += '</tbody></table';

		$('#meta').html(meta_html);
		
		// add info
		info_html += '';
		$('#info').html(info_html);
		
		// save map to image
		saveMap();

	};

	function buildMap() {
		console.log('buildMap');

		var map, tiles, geojsonPolyData, error, grades, geojson, legend;
		
		map = L.map('map', {
			zoomControl: false
		});

		tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
					attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap contributors</a>'
				}).addTo(map);

		tiles.on("load",function() { 
			console.log("all visible tiles have been loaded")
			tile_load = true; 
		});

		map.setView([0,0], 3);

		map.scrollWheelZoom.disable();
		map.dragging.disable();
		map.doubleClickZoom.disable();

		readJSON('../'+files.map, function (request, status, e) {
			geojsonPolyData = request;
			error = e;
		});

		if (error) {
			console.log(error);
			return 1;
		}

	    grades = [-1.5, -1.0, -0.5, 0.5, 1.0, 1.5, 2];

		function getColor(d) {

		    return d <= -1.5 ? '#de2d26' :
		           d <= -1.0 ? '#fc9272' :
		           d <= -0.5 ? '#fee0d2' :

		           d <= 0.5 ? '#fff7bc' :
		           d <= 1.0 ? '#e5f5e0' :
   		           d <= 1.5 ? '#a1d99b' :
   		           			  '#31a354';
		};

		function style(feature) {
		    return {
		        fillColor: getColor(feature.properties.result),
		        weight: 1,
		        opacity: 1,
		        color: 'black',
		        fillOpacity: 0.75
		    };
		};

		geojson = L.geoJson(geojsonPolyData, {
		    style: style
		});

		map.addLayer(geojson, true);

		map.fitBounds( geojson.getBounds() );

		// manage legend
		legend = L.control({position: 'bottomright'});

		legend.onAdd = function (map) {

		    var div = L.DomUtil.create('div', 'info legend');
		    div.innerHTML += '<div id="legend_title">Gap Analysis</div>'
		    // loop through grades and generate a label with a colored square for each interval
			for (var i = 0, ix=grades.length; i < ix; i++) {
		        div.innerHTML += '<i style="background:' + getColor(grades[i]) + '"></i> ';
		       
		        if ( !grades[i+1] ) {
		        	div.innerHTML += grades[i-1]  + '+<br>';
		        } else {
		        	div.innerHTML += "<= " + grades[i]  + '<br>';
		        }
		    }

		    return div;
		};

		legend.addTo(map);

	};

	function saveMap() {
		console.log('saveMap')
		if (tile_load || tile_timeout > tile_timelimit){
			setTimeout(function() {
				console.log('generating map image')
				$('#map').html2canvas({
					flashcanvas: "/aiddata/libs/canvas/flashcanvas.min.js",
					proxy: 'proxy.php',
					logging: false,
					profile: false,
					useCORS: true		      		
				});
				tile_timeout = 0;
				checkMapImage();
			}, 1000);

		} else {

			setTimeout(function() {
				// create map image
				tile_timeout += 1000
				saveMap();
			}, 1000);

		}


	}

	function checkMapImage(){
		console.log('checkMapImage', map_image_filename)

		if (map_image_filename) {
			map_image_filename = map_image_filename.substr(0,map_image_filename.length-1)
			$('#map').attr('class','grid_content');
			addImage('#map', 'data/images/map/'+map_image_filename )
			buildReport();
		} else {
			setTimeout(function() {
				checkMapImage();
			}, 1000)
		}
	
	}

	function addImage(el, file){
		console.log('addImage');
		console.log(file)
		var html = '<img src="../'+file+'">';
		$(el).html(html);
	};

	function buildReport() {

		// prep for building selected document type
		// ~ may not be needed ~

		// load export options
		$('#message').html('Create your own report view then select an export option.');
		$('#buttons').show();


	};

	$('.export').click(function () {
		var id, filetype, keys, imgs;

		$('#message').html('Building report download...');


		id = $(this).find('a').attr('id');
		filetype = id.substr(id.indexOf('_') + 1);
		imgs = [];
		sizes = [];

		keys = _.keys(files.chart_options);
		for (var i=0, ix=keys.length; i<ix; i++) {
        	saveChart('analysis_chart_'+keys[i], 'analysis_chart_' + keys[i]);
    		// imgs.push(keys[i]);
    		// sizes.push(files.chart_options[keys[i]]);
    	}

		$('.grid_content').each(function () {
			var source = $(this).data('source');
			source = ( source == "map" ? 'map/'+map_image_filename : source );
			imgs.push(source);
			// sizes.push(files.chart_options[keys[i]]);

		})

		// $('img').each(function () {
		// 	imgs.push($(this).attr('src'));
		// })

		console.log(imgs)

		parseReport({hash: hash, meta: JSON.stringify(json.meta), filetype:filetype, imgs: imgs}, function (result) {

			console.log(result);

			// set export option  hrefs
			$('#message').html('<a href="'+result+'" class="btn" ><span>Download</span></a>');
		})
	})

	// --------------------------------------------------
	// general functions

    // save a highchart to png
    function saveChart(chart, name) {
		var svg = document.getElementById(chart).children[0].innerHTML;
        var canvas = document.getElementById('canvas');
        canvg(canvas,svg);
        var img = canvas.toDataURL("image/png"); //img is data:image/png;base64
        var img_data = {call:'saveimg', img: img, hash:hash, name:name};
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


	function parseReport(data, callback) {
		$.ajax ({
	        url: "parse.php",
	        data: data,
	        dataType: "json",
	        type: "post",
	        async: true,
	        success: function (result) {
			    callback(result);
			}
	    });
	};

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
	};

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
	};

});

var map_image_filename;

function manipulateCanvasFunction(savedMap) {
    dataURL = savedMap.toDataURL("image/png");
    dataURL = dataURL.replace(/^data:image\/(png|jpeg);base64,/, "");
    $.post("process.php", { call: 'savemap', img: dataURL }, function(data) {
    	map_image_filename = data.substr(data.indexOf('map') + 5, data.indexOf('png') + 2);

        console.log('Image Saved to : ' + data, map_image_filename);
    });

}


