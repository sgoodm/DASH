// ++
// ++ js for DASH report
// ++

$(document).ready(function () {
	
	var hash = '',
		files = {
			map: 'data/gapanalysis/PLACEHOLDER.geojson',
			analysis_chart: 'data/images/gapanalysis/PLACEHOLDER_analysis_chart.png'
		};

	var tile_load = false;

	$('.export').hide();

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
		    	// generate page
	      		setTimeout(readHash, 200);

	    	} else {
	    		console.log('not a valid hash');
	    		return;
	    	}

    	} 
  	};
	

	function validateHash() {
		console.log('validateHash');

		var keys = _.keys(files),
			values = _.values(files);
		
		for ( var i = 0, ix = values.length; i < ix; i++ ) {

			var state = false;

			files[keys[i]] = values[i].replace('PLACEHOLDER', hash);

			process({call: 'exists', name: files[keys[i]]}, function (result) {
				state = result;
			})

			if (state == false) {
				return false;
			}

		}
		return true;

	};

	function readHash() {
		console.log('readHash');

		$('#grid').empty();

		// init grid
		var keys = _.keys(files),
			values = _.values(files),
			html = '';

		$('#grid_container').prepend('<div class="grid_title">AidData DASH Gap Analysis Results</div>');

		for ( var i = 0, ix = values.length; i < ix; i++ ) {
			console.log(keys[i])
			html += '<div class="grid_container"><div id="'+keys[i]+'"></div></div>';
		}

		$('#grid').html(html);	
		$("#grid").sortable();


		// add map
		buildMap();

		// add analysis chart
		addImage('#analysis_chart', files.analysis_chart);

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

	function addImage(el, file){
		console.log('addImage');
		console.log(file)
		var html = '<img src="../'+file+'" width="1200" height="400">';
		$(el).html(html);
	};

	function saveMap() {
		console.log('saveMap')
		if (tile_load){
			setTimeout(function() {
				console.log('generating map image')
				$('#map').html2canvas({
					flashcanvas: "/aiddata/libs/canvas/flashcanvas.min.js",
					proxy: 'proxy.php',
					logging: false,
					profile: false,
					useCORS: true		      		
				});

				checkMapImage();
			}, 1000);

		} else {

			setTimeout(function() {
				// create map image
				saveMap();
			}, 2000);

		}


	}

	function checkMapImage(){
		console.log('checkMapImage', map_image_filename)

		if (map_image_filename) {
			map_image_filename = map_image_filename.substr(0,map_image_filename.length-1)
			$('#map').attr('class','');
			addImage('#map', 'data/images/map/'+map_image_filename )
			buildReport();
		} else {
			setTimeout(function() {
				checkMapImage();
			}, 2000)
		}
	
	}

	function buildReport() {

		// build documents
		// var pdf_file, docx_file, html;

		// html = $('#grid').html();

		// console.log(html);

		// load export options
		$('#message').html('Create your own report view then select an export option.');
		$('.export').show();


	};

	$('.export').click(function () {
		var id, filetype, imgs;

		$('#message').html('Building report download...');


		id = $(this).find('a').attr('id');
		filetype = id.substr(id.indexOf('_') + 1);

		imgs = [];

		$('img').each(function () {
			imgs.push($(this).attr('src'));
		})

		console.log(imgs)


		parseReport({filetype:filetype, imgs: imgs}, function (result) {

			console.log(result);

			// set export option  hrefs
			$('#message').html('<a href="'+result+'" class="btn" ><span>Download</span></a>');
		})
	})

	// --------------------------------------------------
	// general functions

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


