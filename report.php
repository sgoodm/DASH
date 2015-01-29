<!DOCTYPE html>
<html>

<head>
    <meta charset="UTF-8">
    <title>AidData - - DASH - - Report</title> 

    <link href="http://netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css" rel="stylesheet">

    <link href='http://fonts.googleapis.com/css?family=Open+Sans' rel='stylesheet' type='text/css'>
    <link href='http://fonts.googleapis.com/css?family=Abel' rel='stylesheet' type='text/css'>

    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap.min.css" />
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/css/bootstrap-theme.min.css" />

    <link rel='stylesheet' href='https://api.tiles.mapbox.com/mapbox.js/v2.1.2/mapbox.css' />
    <link rel="stylesheet" href="//code.jquery.com/ui/1.11.1/themes/smoothness/jquery-ui.css" />


    <link rel="stylesheet" href="report.css?<?php echo filectime('report.css') ?>" />    
</head>

<body>

    <div id="options">
        <div id="message">Generating export options and content...</div>
        <div class="export"><a href='#' class="btn" id="export_pdf"><span>Export to PDF</span></a></div>
        <div class="export"><a href='#' class="btn" id="export_docx"><span>Export to DOCX</span></a></div>
    </div>

    <div style="padding:50px;margin-top:50px;z-index:-1">
        <div id="grid" style="width:1300px;padding:50px 0;border: 1px solid black;">
            <!-- <div class="grid_container"></div>  -->
        </div>       
    </div>


    <canvas id="canvas" style="display:none;"></canvas> 


    <script>
        L_PREFER_CANVAS = true;
    </script>

    <script src="//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.2.0/js/bootstrap.min.js"></script>
    <script src="//ajax.googleapis.com/ajax/libs/jqueryui/1.11.0/jquery-ui.min.js"></script>

    <script src='https://api.tiles.mapbox.com/mapbox.js/v2.1.2/mapbox.js'></script>


    <script type="text/javascript" src="http://canvg.googlecode.com/svn/trunk/rgbcolor.js"></script>
    <script type="text/javascript" src="http://canvg.googlecode.com/svn/trunk/StackBlur.js"></script>
    <script type="text/javascript" src="http://canvg.googlecode.com/svn/trunk/canvg.js"></script>

    <script src="/aiddata/libs/canvas/html2canvas.min.js"></script>
    <script src="/aiddata/libs/canvas/jquery.plugin.html2canvas.js"></script>
    
    <script src="/aiddata/libs/underscoremin.js"></script>

    <script src="report.js"></script>

</body>

</html>
