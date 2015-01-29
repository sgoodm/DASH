<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>AidData - - DASH - -</title> 

    <link href="http://netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css" rel="stylesheet">

    <link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'>
    <link href='http://fonts.googleapis.com/css?family=Abel' rel='stylesheet' type='text/css'>

    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css" />
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap-theme.min.css" />

    <link rel='stylesheet' href='https://api.tiles.mapbox.com/mapbox.js/v2.1.2/mapbox.css' />
    <link rel="stylesheet" href="//code.jquery.com/ui/1.11.1/themes/smoothness/jquery-ui.css" />
    <link rel="stylesheet" href="/aiddata/libs/MarkerCluster/MarkerCluster.css" />
    <link rel="stylesheet" href="/aiddata/libs/MarkerCluster/MarkerCluster.Default.css" />

    <link rel="stylesheet" href="index.css?<?php echo filectime('index.css') ?>" />    
</head>

<body>

    <div id="map_container">
        <div id="map_options">

            <div id="map_options_content" style="display:none;">      
                <div id="boundary_options"> 
                    <div id="country_options">
                        <select id="country" >
                            <option id="blank_country_option" value="-----">Country</option>
                            <option value="Nepal">Nepal</option>
                            <!-- <option value="Uganda">Uganda</option> -->
                            <!-- <option value="Malawi">Malawi</option>   -->
                        </select>
                    </div>       

                    <div id="adm_options">
                        <select id="adm" disabled>
                            <option id="blank_adm_option" value="-----">Level</option>
                            <option value="ADM1">ADM1</option>
                            <option value="ADM2">ADM2</option>
                            <option value="ADM3">ADM3</option>
                        </select>
                    </div>   

                </div>

                <div class="divider"></div>

                <ul id="method" class="nav nav-tabs nav-justified">
                    <li id="method_start"><a tabindex="0">Select Method</a></li>
                    <li id="method_weights"><a tabindex="0">Build Layer</a></li>
                    <li id="method_gapanalysis"><a tabindex="0">Select Aid Data</a></li>
                    <li id="method_pointdata"><a tabindex="0"> Add Point Data</a></li>
                </ul> 

                <div id="start" class="method">
                    <div id="start_message"></div>
                    
                    <select id="start_option"></select>

                    <div id="start_submit"><button>Go</button></div>


                    <div id="start_advanced">
                        <a tabindex="0" class="btn"><span class="glyphicon glyphicon-cog"></span></a>
                    </div> 

                </div>

                <div id="weights" class="method">
                    <div id="raster_option_1">
                        <select id="ro1" class="ro method_select" ></select>
                        <input class="wo" type="number" min="-10" max="10" step="1" value="1" disabled>
                    </div>

                    <div id="raster_option_2">
                        <select id="ro2" class="ro method_select" ></select>
                        <input class="wo" type="number" min="-10" max="10" step="1" value="1" disabled>
                    </div>    

                    <div id="raster_option_3">
                        <select id="ro3" class="ro method_select" ></select>
                        <input class="wo" type="number" min="-10" max="10" step="1" value="1" disabled>
                    </div> 

                    <div id="raster_option_4">
                        <select id="ro4" class="ro method_select" ></select>
                        <input class="wo" type="number" min="-10" max="10" step="1" value="1" disabled>
                    </div>    

                    <div id="raster_option_5">
                        <select id="ro5" class="ro method_select" ></select>
                        <input class="wo" type="number" min="-10" max="10" step="1" value="1" disabled>
                    </div>

                    <div id="weights_submit" class="map_options_valid"><button>Build</button></div>
                    
                    <div id="weights_csv" class="map_options_valid">
                        <a href='#' class="btn"><span class="glyphicon glyphicon-save"></span></a>
                    </div> 

                </div>

                <div id="gapanalysis"  class="method">
                    <div id="gapanalysis_option_1">
                        <span>Aid Layer:</span>
                        <select id="ga1" class="ga method_select" ></select>
                    </div>
                    <div id="gapanalysis_option_2">
                        <span>Data Layer: <a>Build a Custom Layer</a></span>
                        
                    </div>
                    <div id="gapanalysis_buttons" class="map_options_valid"> 
                        <a tabindex="0" class="btn" id="report"><span>Export</br>Results</span></a>
                        <a href='#' class="btn" id="gapanalysis_csv"><span>Download</br>CSV</span></a>
                        <a tabindex="0" class="btn" id="gapanalysis_reset"><span>Reload</br>Last</span></a>
                    </div>
                    <div id="gapanalysis_submit" class="map_options_valid"><button>Run Gap Analysis</button></div>

                </div>  

                <div id="pointdata" class="method">   

                    <div id="clear_points"><button>Clear</button></div>

                    <div id="data_type">
                        <ul>
                            <li id="Agriculture" class="menu_item">Agriculture</li><!--
                         --><li id="Health" class="menu_item">Health</li><!--
                         --><li id="Education" class="menu_item">Education</li><!--
                         --><li id="Industry" class="menu_item">Industry</li>      
                        </ul>
                    </div>

                    <div id="slider_container">
                        <div id="slider_top" class="slider_sub">
                            <div id="slider"></div>
                        </div> 
                        <div id="slider_bot" class="slider_sub">  
                            <span id="slider_min"></span>
                            <span id="slider_value"></span>
                            <span id="slider_max"></span>
                        </div>
                    </div>

                </div>

                <div id="map_options_message"></div>


            </div>

            <div id="map_options_popover" data-collapsed="true"></div>
            <div id="map_options_toggle"><span class="ui-icon ui-icon-carat-2-n-s"></span></div>

        </div>

        <div id="map" data-collapsed="false" ></div> 
        <div id="map_chart_container">
            <div id="map_chart"></div>  
            <div id="map_chart_toggle"><span class="ui-icon ui-icon-carat-2-e-w"></span></div>
        </div>
        <div id="analysis_tab"><div>Results Analysis</div></div> 
    </div>

    <div id="analysis">
        <div id="analysis_title"><div>Results Analysis</div></div>

        <div id="map_size">
            <a tabindex="0" id="map_size_toggle" class="btn" title="Toggle map size"><span class="glyphicon glyphicon-sort"></span></a>
        </div>         
        
        <!-- <div id="analysis_map"></div> -->
        <div id="analysis_results"></div>
    </div> 

    <canvas id="canvas" style="display:none;"></canvas> 


    <!-- <div id="navbar_spacer"></div> -->
    <?php include("/var/www/html/aiddata/home/nav.php"); ?>  

    <!-- <script src="http://d3js.org/d3.v3.min.js"></script> -->

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>
    <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.0/jquery-ui.min.js"></script>
    <script src='https://api.tiles.mapbox.com/mapbox.js/v2.1.2/mapbox.js'></script>
    <script src="http://code.highcharts.com/highcharts.js"></script>
    <script src="http://code.highcharts.com/modules/exporting.js"></script>

    <script type="text/javascript" src="http://canvg.googlecode.com/svn/trunk/rgbcolor.js"></script>
    <script type="text/javascript" src="http://canvg.googlecode.com/svn/trunk/StackBlur.js"></script>
    <script type="text/javascript" src="http://canvg.googlecode.com/svn/trunk/canvg.js"></script>

    <script src="/aiddata/libs/MarkerCluster/leaflet.markercluster-src.js"></script>
    <script src="/aiddata/libs/dragslider.js"></script>
    <script src="/aiddata/libs/leaflet.spin.js"></script>
    <script src="/aiddata/libs/spin.min.js"></script>    
    <script src="/aiddata/libs/underscoremin.js"></script>
    <script src="/aiddata/libs/simple_statistics.js"></script>
    <script src="/aiddata/libs/URI.js"></script>
    <script src="/aiddata/libs/leaflet.easy-button.js"></script>

    <script src="/aiddata/libs/canvas/html2canvas.min.js"></script>
    <script src="/aiddata/libs/canvas/jquery.plugin.html2canvas.js"></script>
    

    <script src="index.js"></script>

</body>

</html>
