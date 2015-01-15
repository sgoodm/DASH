<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>AidData - - DASH - -</title> 

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
        
        <div id="boundary_options"> 
            <div id="country_options">
                <span> Select a Country: </span>
                <select id="country" >
                    <option id="blank_country_option" value="-----">Country</option>
                    <option value="Nepal">Nepal</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Malawi">Malawi</option>  
                </select>
            </div>       

            <div id="adm_options">
                <span> Select an ADM: </span>
                <select id="adm" >
                    <option id="blank_adm_option" value="-----">ADM</option>
                    <option value="ADM1">ADM1</option>
                    <option value="ADM2">ADM2</option>
                    <option value="ADM3">ADM3</option>

                </select>
            </div>     
        </div>

    </div>

    <div id="map"></div> 

    <div id="build_toggle">Build Options</div>

    <div id="build_options">


        <div id="raster_options">
            <div id="raster_available">
                <div>Available Rasters</div>
                <select id="raster_available_list" size="10" multiple>

                </select>
            </div>
            <div id="raster_buttons">
                <button id="raster_add"> >> </button>
                <button id="raster_remove"> << </button>
            </div>
            <div id="raster_selected">
                <div>Selected Rasters</div>
                <div id="raster_selected_list">
                    <table>
                        <tbody>
                            
                        </tbody>
                    </table>
                </div>
            </div>
        </div>  
        <div id="build">
            <button id="submit">Build</button>
        </div>
    </div>

    <div id="data_options">   
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


    <div id="navbar_spacer"></div>
    <?php include("/var/www/html/aiddata/home/nav.php"); ?>  

</body>

</html>