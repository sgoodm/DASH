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

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>

    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>

    <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.0/jquery-ui.min.js"></script>

    <script src='https://api.tiles.mapbox.com/mapbox.js/v2.1.2/mapbox.js'></script>

    <script src="/aiddata/libs/MarkerCluster/leaflet.markercluster-src.js"></script>

    <script src="/aiddata/libs/leaflet.spin.js"></script>

    <script src="/aiddata/libs/spin.min.js"></script>    

    <script src="/aiddata/libs/dragslider.js"></script>

    <script src="/aiddata/libs/underscoremin.js"></script>

    <script src="index.js"></script>

</head>

<body>

    <div id="map_options">

        <div id="map_options_content" style="display:none;">      
            <div id="boundary_options"> 
                <div id="country_options">
                    <select id="country" >
                        <option id="blank_country_option" value="-----">Country</option>
                        <option value="Nepal">Nepal</option>
                        <option value="Uganda">Uganda</option>
                        <option value="Malawi">Malawi</option>  
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
                <li id="method_weights"><a tabindex="0">Weights</a></li>
                <li id="method_overunder"><a tabindex="0">Overunder</a></li>
                <li id="method_points"><a tabindex="0">Point Data</a></li>
            </ul> 

            <div id="weights" class="method">
                <div id="raster_option_1">
                    <select id="ro1" class="ro" ></select>
                    <input type="number" min="1" max="10" step="1" value="1" disabled>
                </div>

                <div id="raster_option_2">
                    <select id="ro2" class="ro" ></select>
                    <input type="number" min="1" max="10" step="1" value="1" disabled>
                </div>    

                <div id="raster_option_3">
                    <select id="ro3" class="ro" ></select>
                    <input type="number" min="1" max="10" step="1" value="1" disabled>
                </div> 

                <div id="raster_option_4">
                    <select id="ro4" class="ro" ></select>
                    <input type="number" min="1" max="10" step="1" value="1" disabled>
                </div>    

                <div id="raster_option_5">
                    <select id="ro5" class="ro" ></select>
                    <input type="number" min="1" max="10" step="1" value="1" disabled>
                </div>
            </div>

            <div id="overunder"  class="method">
                <div id="overunder_option_1">
                    <select id="ou1" class="ou" ></select>
                </div>

                <div id="overunder_option_2">
                    <select id="ou2" class="ou" ></select>
                </div> 
            </div>  

            <div id="points" class="method">   

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


            <div id="map_options_submit"><button id="submit">Build</button></div>

            <div id="map_options_message"></div>

        </div>

        <div id="map_options_popover" data-collapsed="true"></div>
        <div id="map_options_toggle"><span class="ui-icon ui-icon-carat-2-n-s"></span></div>

    </div>

    <div id="map"></div> 



    <!-- <div id="navbar_spacer"></div> -->
    <?php include("/var/www/html/aiddata/home/nav.php"); ?>  

</body>

</html>