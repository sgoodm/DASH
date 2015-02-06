// ++
// ++ js for DASH
// ++

$(document).ready(function () {

	// tracks cetain UI/UX states
	var page_state = 'init',
		map_state = 100,
		tutorial_state = 0,
		link_state = false,
		advanced = false;

	// load data from defaults.json, stored selected theme value
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
		init:'<p>Welcome to AidData - - DASH - -</p><p>Utilize our data on international aid along with a range of external data to create power visualizations and analyze how aid is impacting the developing world.</p><p>To start, please select the country and the administrative level you would like to explore.</p><p style="font-size:10px;">(You can change these later.)</p>',
		start:'<p>Select a predefined analysis to view or click on the advanced options icon to create a custom analysis.</p>',
		tutorial:'<p>This is DASH help window. If you are a new user we suggest following the tutorial. To start the tutorial click the "start" button below. ',
		themed:'<p>You can now view / edit the options used for this themed raster by selecting the "Build Layer" or "Select Aid Data" tabs. You can also add point data to the map using the "Add Point Data" tab.</p>',
		advanced:'<p>Advanced mode enabled.</p>',
		weights:'<p>Select rasters from the drop down menus and assign weights to create a custom layer. Weights may be assigned from -10 to 10.</p>',
		gapanalysis:'<p>Select an aid layer to run a gap analysis against the weighted layer you generated. </p>',
		pointdata:'<p>Overlay project point data on the map.</p>',
		toggle:'<p>You can toggle this tab by clicking anywhere on the tab.</p>',
		map_chart:'<p id="map_chart_message">Click a feature on the map to generate a chart with data on that area.</p>'
	};

	// data that will be saved to a json file for use in report.js
	var chart_options = {}, 
		chart_json = {};

	var hash_change = true;
	

	// init ui on load
    checkHash('init');
	$('#country').val('-----');
	$('#adm').val('-----');
	$('#adm').prop('disabled', true);
	message(m.init, "static");
	$('#tutorial').draggable();

	// --------------------------------------------------
	// build options

    // check hashtag on change and on page load
    $(window).on('hashchange', function () {
    	checkHash();
    });

	// toggle options
	$('#map_options_toggle').click(function () {

	 	$('#map_options_popover').hide();

		$('#map_options_content').slideToggle(400, function() {
			 var vis = $('#map_options_content').is(':visible');

			 if ( vis ) {
			 	$('#map_options_popover').show();
			 }
		});
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

	$("#tutorial_start button").click(function (event) {
		event.stopPropagation();

		window.location.hash = 'tutorial';

		runTutorial();
	});

	$("#tutorial_exit button").click(function (event) {
		$('#overlay').hide();
		$('#map_options_popover').show();
		tutorial_state = 0;
		if (window.location.hash == '#tutorial') {
			window.location.hash = '';

		}

	});

	$('#tutorial_button button').click(function () {
		// console.log(tutorial_state);

        $('html, body').animate({ scrollTop: 0 }, 0);


		var html = '';

		switch (tutorial_state) {
			case 1:

				// set map options
		    	$('#country').val('Nepal').change();
		    	$('#adm').val('ADM3').change();

				// update tutorial text
				html += '<p class="tutorial-header">Tutorial Step 1:</p>';

				html += '<p>After selecting the country and administrative level, we are brought to the "Select Method" tab.</p>';
				html += '<p>From here you can load a predefined analysis or create your own analysis by clicking the gear icon to go into the advanced user mode.</p>';
				html += '<p>Let\'s go into advanced mode to explore the tool step by step. Click "next" when you are ready.</p>';
				
				$('#tutorial_text').html('<div class="tutorial_text">'+html+'</div>');
				
				// update state
				tutorial_state = 2;
				
				break;

			case 2:

				$('#start_advanced').click();

				html += '<p class="tutorial-header">Tutorial Step 2:</p>';

				html += '<p>Clicking on the advanced user icon will bring you to the "Build Layer" tab where you can create a custom layer to be used in your analysis.</p>';
				html += '<p>After selecting up to 5 different layers of data you can assign weights to each of them to create a unique weighted layer that suits your needs.</p>';
				html += '<p>This water security analysis has been designed based on existing research (riverthreat.net) which determined key indicators related to water security.</p>';
				html += '<p><p>Click "next" to select the data and assign weights.</p>';

				$('#tutorial_text').html('<div class="tutorial_text">'+html+'</div>');
				
				tutorial_state = 3;
				
				break;
			
			case 3:

				$('#ro1').val('agriculture__cropland__2014').change();
				$('#ro1').next().val(10).change();
				$('#ro2').val('natural_disasters__impervious_surfaces__2014').change();
				$('#ro2').next().val(8).change();
				$('#ro3').val('agriculture__livestock_density__2014').change();
				$('#ro3').next().val(4).change();
				$('#ro4').val('natural_disasters__wetland_disconnectivity__2014').change();
				$('#ro4').next().val(2).change();
				
				html += '<p class="tutorial-header">Tutorial Step 3:</p>';

				html += '<p>We have selected 4 data layers which are indicators of water security and assigned weights indicating their influence on the index we are creating.</p>';
				// html += '<p>Weights can be assigned from -10 to 10 with negative values reducing the final index based on that layer.</p>';
				html += '<p>Click "next" to build the weights layer.</p>';

				$('#tutorial_text').html('<div class="tutorial_text">'+html+'</div>');
				
				tutorial_state = 4;
				
				break;

			case 4:

				$('#weights_submit button').click();

				html += '<p class="tutorial-header">Tutorial Step 4:</p>';

				html += '<p> The weighted layer we just created is now visible on the map.</p>';
				html += '<p>You can view the data for each feature by clicking on them to bring up a info window and chart on the left side of the map. The data from this layer can also be downloaded as a CSV by clicking on the download icon in the bottom right of the tab.</p>';
				html += '<p>Click "next" to continue.</p>';

				$('#tutorial_text').html('<div class="tutorial_text">'+html+'</div>');
				
				tutorial_state = 5;
				
				break;

			case 5:

				$('#method_gapanalysis').click();

				html += '<p class="tutorial-header">Tutorial Step 5:</p>';

				html += '<p>This is the "Select Aid Data" tab. Here you can select what type of aid you are interested in comparing with the custom layer we just created. To edit the custom layer, just click on "Edit Your Custom Layer" and it will bring you back to the "Build Layer" tab.</p>';
				html += '<p>Click "next" to continue.</p>';

				$('#tutorial_text').html('<div class="tutorial_text">'+html+'</div>');
				
				tutorial_state = 6;
				
				break;

			case 6:

				$('#ga1').val('aid__water_aid_all__2014').change();

				html += '<p class="tutorial-header">Tutorial Step 6:</p>';

				html += '<p>We have selected the aid layer containing all water related aid in Nepal over all available years.</p>';
				html += '<p>Click "next" to run the gap analysis.</p>';

				$('#tutorial_text').html('<div class="tutorial_text">'+html+'</div>');

				tutorial_state = 7;

				break;

			case 7:

				$('#gapanalysis_submit button').click();

				html += '<p class="tutorial-header">Tutorial Step 7:</p>';

				html += '<p>The gap analysis adds a number of new features to the screen; let\'s take a look at them.</p>';
				html += '<p>First, the URL has been updated so that you can share this analysis with others. Simply send them the link and DASH will automatically run the same analysis when they load the page.</p>';
				html += '<p>Click "next" to see the rest of the features.</p>';

				$('#tutorial_text').html('<div class="tutorial_text">'+html+'</div>');

				tutorial_state = 8;

				break;

			case 8:
				html += '<p class="tutorial-header">Tutorial Step 8:</p>';

				html += '<p>The "Select Aid Data" tab has had 3 buttons added to it which allow you to:</p>';
				html += '<p> <ul>';
				html += '<li>export the results to a one page document</li>';
				html += '<li>download a CSV of the data from this map layer</li>';
				html += '<li>reset all options to what was used for the current gap analysis.</li>';
				html += '</ul></p>'  
				html += '<p>You can also select the "Add Point Data" tab to overlay project data on the map.</p>';
				// html += '<p>Aid layer and layer selector</p>';
				// html += '<p>Scroll for results</p>';
				// html += '<p>map chart and info</p>';

				$('#tutorial_text').html('<div class="tutorial_text">'+html+'</div>');

				tutorial_state = 9;

				break;

			case 9:
				html += '<p class="tutorial-header">Tutorial Step 9:</p>';

				html += '<p>Information about each feature in the gap analysis layer can be viewed by clicking on any feature to produce a chart and info window on the left side of the map.</p>';

				html += '<p>Near the top left of the map you will see a layer selector which will allow you to toggle between the weight and gapanalysis layer on the map, along with an aid layer that displays the relative amount of aid in each area.</p>';

				html += '<p>By clicking on the "Results Analysis" button at the bottom of the map, or scrolling down the page, you will find charts displaying results of the gap analysis.</p>';

				$('#tutorial_text').html('<div class="tutorial_text">'+html+'</div>');

				tutorial_state = 10;

				break;

			case 10:

				html += '<p class="tutorial-header">Tutorial Step 10:</p>';
				html += '<p>You have reached the end of the tutorial!</p>';
				html += '<p>To explore our other tools and data or to learn more about AidData, please visit <a href="http://labs.aiddata.org">labs.aiddata.org</a> and <a href="http://www.aiddata.org">aiddata.org</a>.</p>';

				$('#tutorial_text').html('<div class="tutorial_text">'+html+'</div>');	

				$('#tutorial_button button').html('Exit');

				tutorial_state = 11;

				break;
			case 11:

				$('#overlay').hide();

				tutorial_state = 0;

				break;
		}
	});

	// change country
	$('#country').on('change', function () {
		page_state = 'init';

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
		page_state = 'init';

		// clean up any existing weight / gap analysis layer
		if (!map.hasLayer(countryLayer)) {
			cleanMap('all');
			addCountry();
		}

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
		// console.log(val)
		showState('#start_submit', val);
	})

	$('#start_submit button').click(function () {
		// console.log('themed default');
		// will load a pre-generated link using the same hash processing function that loads normal links created by DASH
		var item = $('#start_option').val();
		theme_state = item;
		var theme = (themes.available[p.country][p.adm][item])
		var hash = theme.link.substr(theme.link.indexOf('#')+1)
		// window.location.hash = '';
		hash_change = true;
		window.location.hash =  hash;
	});

	$('#start_advanced').click(function () {
		page_state = 'advanced';
		advanced = true;
		$('#method_weights').click();
	});

	// change methods
	$('#method li').click(function () {

		// prevent changing tabs before selecting a themed default or clicking on advanced options
		if ( page_state == 'default' && advanced == false) {
			return;
		}
		
		page_state = ( page_state == "init" ? "default" : page_state );

		$('#method li').removeClass("active");
		$(this).addClass("active");
		var method = $(this).attr("id").split("_")[1];
		p.method = method;
		$('.method').hide();
		$('#'+method).show();

		message("", "static");

		message(m[p.method], p.method);
		
		if ( p.method == 'start' ) {
			message(m.tutorial);
			$('#tutorial_start').show();
		} else {
			$('#tutorial_start').hide();
		}

		// allow initiating the start menu 
		page_state = (page_state == "default" ? "default" : p.method);

		// hide tooltip during tutorial
		if ( tutorial_state > 0 ) {
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

		var height = 200 + ( 20 * ( _.size(temp.weights) + 1 ) );
		$('#map_chart_container').css('height', height )
		var new_height = height / 2 - 4;
		// console.log(height, new_height);
		$('#map_chart_toggle span').css('top', new_height );

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

		if ( current_layer != 'gapanalysis' && current.valid.gapanalysis ) {
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

		prepGapAnalysis();
	});

	function runTutorial() {
		// init tutorial

		$('#overlay').show();
		$('#tutorial_button button').html('Next');

		$('#map_options_popover').hide();

		$('#map_options_content').slideDown(500);
	    
		var html = '';

		html += '<p class="tutorial-header">Tutorial Introduction:</p>';
		html += '<p>Welcome to the tutorial!</p>';
		html += '<p>DASH is a tool designed to utilize AidData\'s data on international aid along with a range of external data to create powerful visualizations and analyze how aid is impacting the developing world</p>';
		html += '<p>The tutorial will walk you through an example of how this tool can be used by replicating an analysis of water security in Nepal. Click "next" below to get started.</p>';
		html += '<p style="font-size:10px;text-align:center;">(This window is draggable)</p>';
	
		$('#tutorial_text').html('<div class="tutorial_text">'+html+'</div>');

		tutorial_state = 1;
	}

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
		p = p ? p : 0;

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

 		if ( option && option == "start") {
 			$('#start_message').html(html);

 		} else if ( option && option == "static") {
 			$('#map_options_message').html(html);

 		}

 		html = ( advanced ? m.advanced + html : html );
 		
 		tab = ( tab ? tab : true );

 		if ( tab ) {
 			$('#popover_text').html(html);
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


	var map, tiles, map_display, map_button, allCountryBounds, mapinfo, layersControl, map_button = {},
		// addCountry vars: countryLayer
		countryLayer, 
		// addPointData vars: markers, geojsonPoints
		markers, geojsonPoints, 
		// addPolyData vars: geojsonPolyData, geojson, info, legend, featureList, lastClicked, layer_type
		geojsonPolyData = {}, geojson = {}, info = {}, legend = {}, 
		/*featureList, lastClicked, layer_type,*/ current_layer; 

	L.mapbox.accessToken = 'pk.eyJ1Ijoic2dvb2RtIiwiYSI6InotZ3EzZFkifQ.s306QpxfiAngAwxzRi2gWg';

	map = L.mapbox.map('map', {});

	tiles = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap contributors</a>'
			}).addTo(map);

	map.setView([0,0], 3);

	map.options.maxZoom = 11;
	map.options.minZoom = 2;

	$('.leaflet-control-attribution').hide();

	$('#map_layers').on('change', 'input[name="map_layer"]:radio', function (){
		var val = $(this).val()
		// console.log(val);
		if (geojsonPolyData[val]) {
			addPolyData(val)
		}
	})

	// bounds objects
	allCountryBounds = { global:{_northEast:{lat:90, lng:180}, _southWest:{lat:-90, lng:-180}} };

	mapinfo = {};
	
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
	        var vals = _.values(temp.weights);
	        for (var i=0, ix=vals.length; i<ix; i++) {

			    html += '<tr><td>' + vals[i] + '</td><td>' + roundxy( props[vals[i]] ) + '</td><td>' + (props[vals[i]+"_weighted"] ? roundxy(props[vals[i]+"_weighted"]) : "" ) + '</td></tr>';

	        }
	        html += "</tbody></table>";

	        html += 'Result: ' + roundxy(props.result); 
		
		} else {
			html = 'Click on a feature';
		}

	    this._div.innerHTML = html;
	}

	mapinfo.gapanalysis = function(props) {
		var html =  '<h4>Gap Analysis Result</h4>';

		if (props) {
			html += '<b>' + props["NAME_"+s.adm.substr(3)] + '</b><br />'; 
	        
	        html += "<table id='map_table'><thead><tr><th>Raster</th><th>Raw</th><th>Percent</th></tr></thead><tbody>";
	        var vals = _.values(active.gapanalysis);
	        for (var i=0, ix=vals.length; i<ix; i++) {

			    html += '<tr><td>' + vals[i] + '</td><td>' + roundxy( props[vals[i]] ) + '</td><td>' + roundxy( props[vals[i]+"_percent"] )  + '</td></tr>';

	        }
	        html += "</tbody></table>";

	        html += 'Ratio: ' + roundxy(props.ratio) + '<br>';
	        html += 'Result: ' + roundxy(props.result);
		
		} else {
			html = 'Click on a feature';
		}

	    this._div.innerHTML = html;
	}

	mapinfo.aid = function(props) {

		var html =  '<h4>Aid Layer</h4>';

		if (props) {
			html += '<b>' + props["NAME_"+s.adm.substr(3)] + '</b><br />'; 
	        

	        html += 'Rank: ' + roundxy(props.rank) + '<br>';
	        html += 'Aid: ' + roundxy(props[active.gapanalysis.ga1]);
		
		} else {
			html = 'Click on a feature';
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

			if (map.hasLayer(geojson['weights'])) {
				map.removeLayer(geojson['weights']);
				info['weights'].removeFrom(map);
				legend['weights'].removeFrom(map);		
			}
			if (map.hasLayer(geojson['aid'])) {
				map.removeLayer(geojson['aid']);
				info['aid'].removeFrom(map);
				legend['aid'].removeFrom(map);		
			}
			if (map.hasLayer(geojson['gapanalysis'])) {
				map.removeLayer(geojson['gapanalysis']);
				info['gapanalysis'].removeFrom(map);
				legend['gapanalysis'].removeFrom(map);		
			}

			// lastClicked = undefined;
		}

		if (method == "chart" || method == "all") {
    	   	$('#map_chart').html(m.map_chart);
    		$('#map_chart').hide();
		}
	}

	function addCountry() {
		if (link_state == true) {
			return;
		}

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
					geojsonPolyData.weights = request;
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

	        	if ( $('#map_layer_weights').length == 0 ) {
                	$('#map_layers').append('<label class="map_layer" id="map_layer_weights"><input type=radio name="map_layer" value="weights">Weights</label>');
                }
                $('input:radio[name=map_layer]').filter('[value=weights]').prop('checked', true);

                if ( $('.map_layer').length > 1 ) {
   	       			$('#map_layers_container').show();
                }

       			if (link_state == false) {
       				console.log('adding weight layer')

   					addPolyData('weights');
       			}

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
					geojsonPolyData.aid = request;
					geojsonPolyData.gapanalysis = request;

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

	        	addPolyData('gapanalysis');

	        	$('#map_layer_containers').show();
	        	if ( $('#map_layer_aid').length == 0 ) {
                	$('#map_layers').append('<label class="map_layer" id="map_layer_aid"><input type=radio name="map_layer" value="aid">Aid</label>');
                }
                if ( $('#map_layer_gapanalysis').length == 0 ) {
                	$('#map_layers').append('<label class="map_layer" id="map_layer_gapanalysis"><input type=radio name="map_layer" value="gapanalysis">Gap Analysis</label>');
                }

                $('input:radio[name=map_layer]').filter('[value=gapanalysis]').prop('checked', true);

                if ( $('.map_layer' ).length > 1 ) {
   	       			$('#map_layers_container').show();
                }
       	       	map.spin(false);
        	    runAnalysis();	
	        }
	    });
	}

	// depends on s.method, s.adm, s.rasters, active.weights, geojsonPolyData
	function addPolyData(layer_type) {

		current_layer = layer_type;
		// featureList = {};
    	var size = 	geojsonPolyData[layer_type].features.length;
    	
	    var grades = {
	    	weights: [0.15, 0.30, 0.45, 0.60, 0.85, 1],
	    	aid: [Math.floor(size*1/5), Math.floor(size*2/5), Math.floor(size*3/5), Math.floor(size*4/5), Math.floor(size*5/5)]
	    	// gapanalysis: [-1.5, -1.0, -0.5, 0.5, 1.0, 1.5, 2]
	    };
	    var grade_names = {
	    	weights: ['Least Vulnerable','','','','','Most Vulnerable'],
	    	aid: ['Least Aid','','','','Most Aid'],
	    	gapanalysis: ['Underfunded','','','','','Overfunded']
	    };

		if (current_layer == 'gapanalysis' || current_layer == 'weights') {
			$('#map_chart_toggle').show();

		} else {
			$('#map_chart_toggle').hide();
		}

		cleanMap("poly");
   		cleanMap("chart");

   		// jenks breaks for gapanalysis
    	var gap_array_neg = [], gap_array_pos = [], jenks = { pos:[], neg:[] };
		
		console.log('preinit')
		console.log(gap_array_pos)
		console.log(gap_array_neg)
		console.log(jenks)
		console.log('postinit')

		if (current_layer == 'gapanalysis') {

			// console.log( geojsonPolyData[layer_type].features )
			for ( var i = 0, ix = size; i < ix; i++ ) {
				var val = parseFloat(geojsonPolyData[layer_type].features[i].properties.ratio)
				if ( val <= 0 ) {
					gap_array_neg.push( val );
				} else {
					gap_array_pos.push( val )
				}
			}

			// populate jenks breaks with fake values if not enough points below/above zero
			if (gap_array_neg.length < 4){
				gap_array_neg[0] =  gap_array_neg.length == 0 ? 0 : gap_array_neg[0];
				var len = gap_array_neg.length;
				for ( var i = 0, ix = 4-len; i < ix; i++ ) {

					gap_array_neg.push( gap_array_neg[ len+i ] / 2 );
				}
			}

			if (gap_array_pos.length < 4){
				gap_array_pos[0] =  gap_array_pos.length == 0 ? 0 : gap_array_pos[0];
				var len = gap_array_pos.length;
				for ( var i = 0, ix = 4-len; i < ix; i++ ) {

					gap_array_pos.unshift( gap_array_pos[0] / 2 );
				}
			}

			console.log(gap_array_pos)
			console.log(gap_array_neg)
			// console.log(jenks)

			console.log('prejenks')
			jenks.neg = ss.jenks(gap_array_neg, 3),
			jenks.pos = ss.jenks(gap_array_pos, 3)
			console.log('postjenks')
			grades.gapanalysis = [ jenks.neg[1], jenks.neg[2], jenks.neg[3], jenks.pos[1], jenks.pos[2], jenks.pos[3] ]
			console.log('postgrades')
			active.grades = grades.gapanalysis;



			console.log(grades.gapanalysis)
		}

		function getColor(d) {
			if (current_layer == 'weights') {

			    return d <= 0.15 ? '#a1d99b' :
			           d <= 0.30 ? '#e5f5e0' :
			           d <= 0.45 ? '#fff7bc' :

			           d <= 0.60 ? '#fee0d2' :
			           d <= 0.85 ? '#fc9272' :
	   		           			   '#de2d26' ; 

   		    } else if (current_layer == 'aid') {
			    return d <= Math.floor(size*1/5) ? '#de2d26' :
			           d <= Math.floor(size*2/5) ? '#fc9272' :

			           d <= Math.floor(size*3/5) ? '#fff7bc' :
	   		           d <= Math.floor(size*4/5) ? '#a1d99b' :
	   		           			  	   			   '#31a354';

   		    } else if (current_layer == 'gapanalysis') {

			    return d <= jenks.neg[1] ? '#de2d26' :
			           d <= jenks.neg[2] ? '#fc9272' :
			           d <= jenks.neg[3] ? '#fee0d2' :

			           // d <= 0.5 ? '#fff7bc' :
			           d <= jenks.pos[1] ? '#e5f5e0' :
	   		           d <= jenks.pos[2] ? '#a1d99b' :
	   		           			  		   '#31a354';

   		  //   } else if (current_layer == 'gapanalysis') {

			    // return d <= -1.5 ? '#de2d26' :
			    //        d <= -1.0 ? '#fc9272' :
			    //        d <= -0.5 ? '#fee0d2' :

			    //        d <= 0.5 ? '#fff7bc' :
			    //        d <= 1.0 ? '#e5f5e0' :
	   		 //           d <= 1.5 ? '#a1d99b' :
	   		 //           			  '#31a354';

   		  //   }

   		    }
		}

		function mouseoverFeature(e) {
		    var layer = e.target;

		    layer.setStyle({
		        weight: 4
		    });

		    if (!L.Browser.ie && !L.Browser.opera) {
		        layer.bringToFront();
		    }

   		    // info[current_layer].update(e.target.feature.properties);
		}

		function mouseoutFeature(e) {

		    var layer = e.target;

		    layer.setStyle({
		        weight: 1
		    });

		    // geojson.resetStyle(layer);
		    // info.update();
		}

		function clickFeature(e) {

			var layer = e.target;

   		    info[current_layer].update(e.target.feature.properties);

			// if (lastClicked && lastClicked == layer._leaflet_id ) {
			// 	return;
			// }
			// lastClicked = layer._leaflet_id;

			// zoom to feature
	    	// map.fitBounds(e.target.getBounds());

	    	if ( (current_layer != "gapanalysis" && current_layer != "weights") || map_state < 100) {
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

	    	var total = 'result';

	    	var weight_data = temp.weights;

	    	// aid series (only for gapanalysis)
	    	if (current_layer == "gapanalysis") {
	    		weight_data = active.weights
		    	map_chart_data.series.push({
		    		name: active.gapanalysis.ga1,
		    		data: [ roundxy(parseFloat(layer.feature.properties[active.gapanalysis.ga1+"_percent"])) ],
		    		stack: 0
		    	});
		    	total = active.gapanalysis.ga2+"_percent";
		    }

	    	// raw weighted vals
	    	for ( var i = 0, ix = _.size(weight_data); i < ix; i++ ) {
	    		var val = parseFloat( layer.feature.properties[_.values(weight_data)[i]+"_weighted"] );
	    		map_chart_data.raw.push(val);
	    	}

	    	// normalize data based on negative values
	    	map_chart_data.min = ss.min(map_chart_data.raw);
	    	map_chart_data.count = map_chart_data.raw.length;

	    	if ( map_chart_data.min < 0 ) {
		    	for ( var i = 0, ix = map_chart_data.count; i < ix; i++ ) {
		    		map_chart_data.raw[i] = map_chart_data.raw[i] + map_chart_data.min;
		    	}
		    }

		    // get percent of total for each weighted layer
	    	map_chart_data.sum = ss.sum(map_chart_data.raw);

	    	for ( var i = 0, ix = map_chart_data.count; i < ix; i++ ) {
	    		var val = roundxy( parseFloat(layer.feature.properties[total]) * map_chart_data.raw[i] / map_chart_data.sum );
	    		map_chart_data.series.push({
	    			name: _.values(weight_data)[i],
	    			data: [ val ],
	    			stack: 1
	    		});
	    	}

	    	// build chart
	    	var map_chart_options = {
		        chart: {
		        	type: 'bar',
		        	spacingTop: 17 + ( 17 * map_chart_data.count ),
		        	spacingRight: 20
		        },
		        title: {
		            text: ''
		        },
		        subtitle: {
		            text: ''
		        },
		        xAxis: {
		            categories: map_chart_data.categories,
		            title: {
		            	text: layer.feature.properties["NAME_"+s.adm.substr(3)]
		            }
		        },
		        yAxis: [{ 
		            title: {
		                text: 'Standarized Values (0-1)',

		            }
		        }],
		        tooltip: {
		        	enabled:true,
		        	useHTML:true,
		        	shared:false,
   		            hideDelay:0,
		            formatter: function () {
		            	var html = '';
		            	if ( this.y == this.point.stackTotal ) {
		            		html += '<b>' + this.point.stackTotal + '</b>';

		            	} else {
		            		html += '<b>' + roundxy(100 * this.y / this.point.stackTotal, 2) + '% of '+ this.point.stackTotal + '</b>';

		            	}
		                return html;
		            }
		        },
		        plotOptions: {
		         	bar: {
		            	stacking: 'normal'
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

		}

		function onEachFeature(feature, layer) {
		    layer.on({
		        mouseover: mouseoverFeature,
		        mouseout: mouseoutFeature,
		        click: clickFeature
		    });
		    // var poly_id = "polygon_" +  feature.properties.ID;
		    // layer._leaflet_id = poly_id;
		    // featureList[ feature.properties["NAME_"+s.adm.substr(3)] ] = poly_id; 

		}

		function style(feature) {
			var result = ( current_layer == 'aid' ? 'rank' : 
							current_layer == 'gapanalysis' ? 'ratio' : 
															'result' );
		    return {
		        fillColor: getColor( parseFloat(feature.properties[result]) ),
		        weight: 1,
		        opacity: 1,
		        color: 'black',
		        fillOpacity: 0.75
		    };
		}

		geojson[current_layer] = L.geoJson(geojsonPolyData[current_layer], {
		    style: style,
		    onEachFeature: onEachFeature
		});

		map.addLayer(geojson[current_layer], true);

		map.fitBounds( geojson[current_layer].getBounds() );

		info[current_layer] = L.control({
			position:'bottomleft'
		});

		info[current_layer].onAdd = function (map) {
		    this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
		    this.update();
		    return this._div;
		};

		// method that we will use to update the control based on feature properties passed
		info[current_layer].update = mapinfo[current_layer];

		info[current_layer].addTo(map);

		// manage legend
		legend[current_layer] = L.control({position: 'bottomright'});

		legend[current_layer].onAdd = function (map) {

		    var div = L.DomUtil.create('div', 'info legend');

		    div.innerHTML += '<div id="legend_title">' + current_layer + '</div>';

		    // loop through grades and generate a label with a colored square for each interval
			for (var i = 0, ix=grades[current_layer].length; i < ix; i++) {
		        div.innerHTML += '<i style="background:' + getColor(grades[current_layer][i]) + '"></i> ';
		       
		        // if ( current_layer == "gapanalysis" && !grades[current_layer][i+1] ) {
		        // 	div.innerHTML += grades[current_layer][i-1]  + '+<br>';
		        // } else {
		        // 	div.innerHTML += "<= " + grades[current_layer][i]  + '<br>';
		        // }
	        	div.innerHTML += grade_names[current_layer][i]  + '<br>';
		      
		    }

		    return div;
		};

		legend[current_layer].addTo(map);

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

	// depends on s.adm, s.rasters and active.weights
	function runAnalysis() {
		$('#analysis').show();
		$('#analysis_tab').show();
		$('#gapanalysis_buttons').show();

		var analysis_data = {
			raw: geojsonPolyData.gapanalysis.features,
			keys: _.keys(geojsonPolyData.gapanalysis.features),
			props: {},
			featureCount: _.size(geojsonPolyData.gapanalysis.features),
			weightCount: _.size(active.weights),
			results: {},
			// primary: [],
			// secondary: [],
			categories: [],
			series: [],
			temp: [],
			subtitle: ''
		};

		var funding = {
			projects: {
				underfunded:0,
				average:0,
				overfunded:0
			},
			aid: {
				underfunded:0,
				average:0,
				overfunded:0				
			}

		};

		var ratio = {
			raw: [],
			// rank: [],
			// aid: {},
			// name: {},
			series: []
		};

		analysis_data.subtitle = ( analysis_data.featureCount > 10 ? 'Top 5 Underfunded / Top 5 Overfunded' : '');

		for ( var i = 0, ix = analysis_data.featureCount; i < ix; i++ ) {
			analysis_data.props[i] = analysis_data.raw[analysis_data.keys[i]].properties;
			analysis_data.results[i] = parseFloat(analysis_data.props[i].result);
			
			if ( analysis_data.results[i] <= -0.5 ) {
				funding.projects.underfunded++;
				funding.aid.underfunded += roundxy(parseFloat(analysis_data.props[i][s.rasters[0]]), 0);
			} else if ( analysis_data.results[i] <= 0.5 ) {
				funding.projects.average++;
				funding.aid.average += roundxy(parseFloat(analysis_data.props[i][s.rasters[0]]), 0);
			} else {
				funding.projects.overfunded++;
				funding.aid.overfunded += roundxy(parseFloat(analysis_data.props[i][s.rasters[0]]), 0);
			}

			ratio.raw.push( [ 
				roundxy(parseFloat(analysis_data.props[i]['custom_weighted_layer']), 3), 
				parseFloat(analysis_data.props[i]['rank']), 
				roundxy(parseFloat(analysis_data.props[i][s.rasters[0]]), 0),
				analysis_data.props[i]['NAME_' + s.adm.substr(3,1)]
			] );

		}

		funding.aid.underfunded = ( funding.aid.underfunded < 0 ? 0 : funding.aid.underfunded );
		funding.aid.average = ( funding.aid.average < 0 ? 0 : funding.aid.average );
		funding.aid.overfunded = ( funding.aid.overfunded < 0 ? 0 : funding.aid.overfunded );

		ratio.raw.sort(function(a, b) {return a[0] - b[0]})
		
		analysis_data.bot5 = _.values(analysis_data.results).sort( function(a, b) { return a-b } )[4];
		analysis_data.top5 = _.values(analysis_data.results).sort( function(a, b) { return b-a } )[4];

		// init aid item of series
		analysis_data.series.push({
			name: s.rasters[0],
			data: [],
			stack: 0
		});

		// init data items of series
		for ( var j = 0, jx = analysis_data.weightCount; j < jx; j++ ) {
			analysis_data.series.push ({
				name: _.values(active.weights)[j],
				data: [],
				stack: 1
			});
		}

		// build subdata
		for ( var i = 0, ix = analysis_data.featureCount; i < ix; i++ ) {

			var item = analysis_data.props[analysis_data.keys[i]]; 

			if ( analysis_data.featureCount <= 10 ) {
				analysis_data.categories.push(item["NAME_" + s.adm.substr(3,1)]);

				// analysis_data.primary.push( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );
				analysis_data.series[0].data.push( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );

				// data.secondary.push( roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
				// normalize data per feature
				analysis_data.temp = [];
				for ( var j = 0, jx = analysis_data.weightCount; j < jx; j++ ) {
					analysis_data.temp.push(  roundxy( parseFloat(item[_.values(active.weights)[j]+"_weighted"]) ) );
				}
				analysis_data.temp = normalize(analysis_data.temp,  roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
				for ( var j = 0, jx = analysis_data.weightCount; j < jx; j++ ) {
					analysis_data.series[j+1].data.push( analysis_data.temp[j] );
				}


			} else {

				if ( parseFloat(item.result) <= analysis_data.bot5 ) {
					analysis_data.categories.unshift(item["NAME_" + s.adm.substr(3,1)]);

					// analysis_data.primary.unshift( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );
					analysis_data.series[0].data.unshift( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );

					// analysis_data.secondary.unshift( roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
					// normalize data per feature
					analysis_data.temp = [];
					for ( var j = 0, jx = analysis_data.weightCount; j < jx; j++ ) {
						analysis_data.temp.push(  roundxy( parseFloat(item[_.values(active.weights)[j]+"_weighted"]) ) );
					}
					analysis_data.temp = normalize(analysis_data.temp,  roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
					for ( var j = 0, jx = analysis_data.weightCount; j < jx; j++ ) {
						analysis_data.series[j+1].data.unshift( analysis_data.temp[j] );
					}
				}

				if ( parseFloat(item.result) >= analysis_data.top5 ) {
					analysis_data.categories.push(item["NAME_" + s.adm.substr(3,1)]);

					// analysis_data.primary.push( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );
					analysis_data.series[0].data.push( roundxy( parseFloat(item[s.rasters[0]+'_percent']) ) );

					// analysis_data.secondary.push( roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
					// normalize data per feature
					analysis_data.temp = [];
					for ( var j = 0, jx = analysis_data.weightCount; j < jx; j++ ) {
						analysis_data.temp.push(  roundxy( parseFloat(item[_.values(active.weights)[j]+"_weighted"]) ) );
					}
					analysis_data.temp = normalize(analysis_data.temp,  roundxy( parseFloat(item[s.rasters[1]+'_percent']) ) );
					for ( var j = 0, jx = analysis_data.weightCount; j < jx; j++ ) {
						analysis_data.series[j+1].data.push( analysis_data.temp[j] );
					}
				}

			}

			// manage ratio data
			// ratio.rank.push( [ ratio.raw[i][0], ratio.raw[i][1] ] );
			// if ( ratio.aid[ratio.raw[i][0]] ) {
			// 	ratio.aid[ratio.raw[i][0]] = String(ratio.aid[ratio.raw[i][0]]) +', '+ String(ratio.raw[i][2]);
			// 	ratio.name[ratio.raw[i][0]] = String(ratio.name[ratio.raw[i][0]]) +', '+ String(ratio.raw[i][3]);
			// } else {
			// 	ratio.aid[ratio.raw[i][0]] = String(ratio.raw[i][2]);
			// 	ratio.name[ratio.raw[i][0]] = String(ratio.raw[i][3]);
			// }

			ratio.series.push( {
				x: ratio.raw[i][0],
				y: ratio.raw[i][1],
				aid: ratio.raw[i][2],
				adm: ratio.raw[i][3] 
			} );

		}

		// console.log(analysis_data);

		chart_options.extremes = {
	        chart: {
	        	type: 'column',
	        	spacingBottom: 75
	        },
          	plotOptions: {
            	series: {
	            	stacking: 'normal',
            		cursor: 'pointer',
	                point: {
	                    events: {
	                    	click: function (e) {

	                    		// not working

	                    		// _.each( map._layers, function(lay) {
	                    		// 	lay.fire('mouseout');
	                    		// })
	   
	                    		// map._layers[ featureList[analysis_data.categories[this.x]] ].fire('mouseover');

	                    	}
	                    }
	                }
	            }
	        },
		    title: {
	            text: 'Gap Analysis'
	        },
	        subtitle: {
	            text: analysis_data.subtitle
	        },
	        xAxis: {
	            categories: analysis_data.categories
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
	            shared: true,
	            hideDelay:0
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
	        series: analysis_data.series
	    };

		chart_options.funding = {
	        chart: {
	        	type: 'column'
	        },
	        title: {
	            text: 'Funding'
	        },
	        xAxis: {
	            categories: _.keys(funding.projects)
	        },
	        yAxis: [{ 
	            title: {
	                text: 'ADM Count',
	                style: {
	                    color: Highcharts.getOptions().colors[0]
	                }
	            },
	            labels: {
	                format: '{value}',
	                style: {
	                    color: Highcharts.getOptions().colors[0]
	                }
	            },
	        }, { 
	            title: {
	                text: 'Aid Total',
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
	            opposite: true
	        }],
	        tooltip: {
	            shared: true,
	            hideDelay:0
	        },
	        legend: {
	        	enabled:true    
	        },
	        credits:{
	        	enabled:false
	        },
	        series: [{
	            name: 'ADM Count',
	            data: _.values(funding.projects)
	        },
	        {
	            name: 'Aid Total',
	            yAxis: 1,
	            data: _.values(funding.aid)
	        }]
	    };

		chart_options.ratio = {
			chart: {
				type: 'scatter'
			},
	        title: {
	            text: 'Ratio of Aid Rank to Weighted Index'
	        },
	        xAxis: {
	            title: {
	            	text: 'Relative Vulnerability (0 = least vulnerable)'	            
	        	}
	        },
	        yAxis: [{ 
	            title:  {
	            	text: 'ADM Rank ( rank 1 = least aid )'
            	},
            	min:0	            
	        }],
            plotOptions: {
	            scatter: {
	                marker: {
	                    radius: 5,
	                    states: {
	                        hover: {
	                            enabled: true,
	                            lineColor: 'rgb(100,100,100)'
	                        }
	                    }
	                },
	                states: {
	                    hover: {
	                        marker: {
	                            enabled: false
	                        }
	                    }
	                },
                    tooltip: {
                        headerFormat: '',
                        pointFormat: '<b> {point.adm} </b> <br> Rank: {point.y} <br> Aid: {point.aid} <br> Weighted Index: {point.x} <br>',
                        hideDelay:0
                    },
	            }
	        },
	        legend: {
	        	enabled:false    
	        },
	        credits:{
	        	enabled:false
	        },
	        series: [{
	        	name: s.adm,
	            data: ratio.series,

	        }]
	    };

	    // console.log(ratio)

	    for (var i = 0, ix = _.keys(chart_options).length; i < ix; i++) {
		    var key, html;

		    key = _.keys(chart_options)[i];

		    html = '<div id="analysis_chart_'+key+'" class="analysis_chart"></div>';
			$('#analysis_results').append(html);
			chart_json[key] = JSON.parse(JSON.stringify(chart_options[key]));
			$('#analysis_chart_'+key).highcharts( chart_options[key] );
		}

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
    	var keys;

    	// save all analysis section content
    	keys = _.keys(chart_json);


		chart_json.meta = {
			country: s.country,
			adm: s.adm,
			gapanalysis: active.gapanalysis.ga1,
			weights: active.weights,
			weight_vals: active.weight_vals,
			grades: active.grades
		};

    	process({call: 'write', hash: active.files.gapanalysis, json: JSON.stringify(chart_json)}, function (result) {
    		console.log('chart options json write:' + result);
    	})
 
       	window.open('report.php#'+active.files.gapanalysis);
    });


	// --------------------------------------------------
	// general functions


	function showState(el, newState) {
		if (newState == true) {
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


	function buildHash() {
		// console.log('buildHash');

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

		hash_change = false;
        window.location.hash = url_new.query();
	}

  	function readHash () {
  		link_state = true;
  		advanced = true;
  		$('#map_layers').empty();
  		$('#map_layers_container').hide();
  		$('#map_options_popover').hide();
  		$('#map_options_content').hide();

	    var url = document.URL.replace("#", "?"),
	        url_query = URI(url).query(true);

		// console.log('readHash');
		// console.log(url_query);

	    if ( url_query.country && $('#country option[value="' + url_query.country + '"]').length) {
	    	$('#country').val(url_query.country).change();
	    } 

	    if ( url_query.adm && $('#adm option[value="' + url_query.adm + '"]').length) {
	    	$('#adm').val(url_query.adm).change();
	    } 

	    if ( theme_state ) {
	    	$('#start_option').val(url_query.theme).change();
	    }

	    if ( url_query.weights && url_query.active_weights ) {
	    	
	    	if ( !_.isArray(url_query.weights) ) {
	    		url_query.weights = [url_query.weights];
	    	}
	  
	    	for ( var i = 0, ix = url_query.weights.length; i < ix; i++ ) {
	    		var weight_parts = url_query.weights[i].split('--');
	    		$('#'+weight_parts[0]).val(weight_parts[1]).change();
	    		$('#'+weight_parts[0]).next().val(weight_parts[2]).change();
	    	}

	    }

		if ( url_query.gapanalysis && url_query.active_gapanalysis ) {
    		$('#ga1').val(url_query.gapanalysis).change();   
	    }

	    validateOptions();

	    if (current.valid.weights ) {

		    $('#method_weights').click();
		    $('#weights_submit').click();

		    $('#method_gapanalysis').click();
		    $('#gapanalysis_submit').click();
		}

		$('#map_options_content').slideDown(500, function () {
			$('#map_options_popover').show();
		});
		link_state = false;

  	};

  	// check hashtag (called on page load or on hashtag change)
  	function checkHash(type) {
  		// console.log('checkHash: '+ window.location.hash);

	    if (window.location.hash == '#tutorial') {
	    	runTutorial();

	    // check for hash_change variable to avoid reloads when hash change was generated by buildHash
	    } else if (window.location.hash !== '' && hash_change == true) {

	    	// handle issue when using back/forward buttons from tutorial
			$('#overlay').hide();
			tutorial_state = 0;

      		setTimeout(readHash, 200);

    	} else if (window.location.hash == '' && type == 'init') {
    		$('#map_options_content').slideDown(500, function () {
    			$('#map_options_popover').show();
    		});

    	}
   		hash_change = true;
  	};


})
