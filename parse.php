<?php

// init

$hash = $_POST['hash']; 
$meta = json_decode($_POST['meta'], true); 

// $filetype = $_POST['filetype'];

$imgs = $_POST['imgs'];
// $sizes = $_POST['sizes'];
$count = count($imgs);

$main_text = '<p id="main_text">Using the '.$meta["gapanalysis"].' aid layer for the '.$meta["adm"].' level of '.$meta["country"].' and the weighted layer which you created, a gap analysis was run to determine areas where projects were being relatively over or underfunded. Areas identified as underfunded are representative of low levels of aid given a high need or high potential for impact (as determined by the weighted layer). The plot below shows standardized values of aid and your weighted layer for the 5 most underfunded and 5 most overfunded areas. The weighted layer is broken down by each raw data layer used to produce the final weight.</p>';
$funding_text = '<p id="funding_text">Breaking down all areas of '.$meta["country"].' at the '.$meta["adm"].' level based on the level of funding they received illustrates the disparity between underfunded and overfunded areas as well as the severity of over and underfunding in the country. </p>';
$generic_text = '<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque posuere eu nunc non malesuada. Curabitur vel lobortis dui. Nullam eleifend ac metus nec dignissim. Integer pellentesque augue eget diam volutpat, vel rhoncus mi finibus. Nullam efficitur eleifend sollicitudin. Nulla tincidunt vestibulum quam, eu ultricies neque suscipit eu. Maecenas congue odio malesuada sapien placerat cursus. </p>';
$end_text = '<p id="end_text">To explore more data, learn more about AidData or contact us visit aiddata.org and labs.aiddata.org</p>';

// build raw string
$raw = '';
$raw .= '<style>
			#header {
				margin-bottom:20px;
			}
            #logo {
				position: fixed;
				top:0;
				left:0;
	            width:100px;
	            float:left;
	        }

	        .grid_title {
	        	float:left;
	            height:50px;
	            width:100%;
	            position:relative;
	            right:100px;
	            text-align:center;
	            font-family: DejaVuSans;
	            font-size:30px;
	        }

            #map {
                display:inline-block;
                width:66%;
                float:left;
                margin-bottom:10px;
            }
            #meta {
                display: inline-block;
                width:33%;
                // height:200px;
                float: left;
                font-family: DejaVuSans;
            }
            .large-chart {
                 width:50%;
            }
            .medium-chart {
                display: inline-block;
                width:66%;
                float: left;
            }
            #info {
                display: inline-block;
                width:33%;               
                float: left;
            }
            #funding {
	            margin-bottom:10px;
	        }

            table {
                border-collapse:collapse;
                cell-spacing: 0px;
                cell-padding: 0px;
                width:100%;
                font-family: DejaVuSans;
            }
            th {
                text-align: center;
            }
            td,th {
                padding:7.5px;
            }
            .tright {
                text-align: right;
            }

            #main_text {
            	text-align:left;
                font-family: DejaVuSans;
            	font-size: 10px;
        	}

        	#funding_text {
        		text-align:left;
                font-family: DejaVuSans;
            	font-size: 10px;
        	}

        	#end_text {
        		text-align:center;
                font-family: DejaVuSans;
            	font-size: 10px;        	
            }

		</style>';



$raw .= '<div id="grid">';
$raw .= '<div id="header">';
$raw .= '<img id="logo" src="/var/www/html/aiddata/imgs/Logo_notag_large.jpg">';
$raw .= '<div class="grid_title">DASH Gap Analysis Results</div>';
$raw .= '</div>';

// for ($i=0; $i<$count; $i++){


// 	// process actual image
// 	$img = "/var/www/html/aiddata/data/images/" . $imgs[$i];
	
// 	$new_image = substr($img,0,-4) . ".jpeg";
	
// 	$im = new Imagick(); 
// 	$im->readImage($img);
// 	$im->writeImage($new_image);

// 	$img = $new_image;

// 	// manage image and related content layout
// 	if ( strpos($img, 'map') != false ) {
// 		$raw .= '<div class="grid_container">';
// 		$raw .= '<div id="map"><img src="'.$img.'"/></div>';
// 		$raw .= '<div id="meta">';
// 		$raw .= '<table>';
// 		$raw .= '<thead><tr><th colspan=2>Meta Info</th></tr></thead><tbody>';
// 		$raw .= '<tr><td>Country</td><td class="tright">'.$meta["country"].'</td></tr>';
// 		$raw .= '<tr><td>ADM</td><td class="tright">'.$meta["adm"].'</td></tr>';
// 		$raw .= '<tr><td>Aid Layer</td><td class="tright">'.$meta["gapanalysis"].'</td></tr>';
// 		$raw .= '<tr><td colspan=2 style="text-align:center;">Weighted Layers</td></tr>';
// 		foreach ($meta["weights"] as $key => $value) {
// 			$val = $meta["weight_vals"][$key];
// 			$raw .= '<tr><td colspan=2>'.$value.' ('.$val.')</td></tr>';
// 		}
// 		$raw .= '</tbody></table>';
// 		$raw .= '</div>';
// 		$raw .= '</div>';				

// 	} elseif ( strpos($img, 'funding') != false ) {
// 		$raw .= '<div class="grid_container"><div id="info"></div><div class="medium-chart"><img src="'.$img.'"/></div></div>';				

// 	} else {
// 		$raw .= '<div class="grid_container"><div><img src="'.$img.'"/></div></div>';				
// 	}
// }

for ($i=0; $i<$count; $i++){

	// process actual image
	$imgs[$i] = "/var/www/html/aiddata/data/images/" . $imgs[$i];
	
	$new_image = substr($imgs[$i],0,-4) . ".jpeg";
	
	$im = new Imagick(); 
	$im->readImage($imgs[$i]);
	$im->writeImage($new_image);

	$imgs[$i] = $new_image;
}

// map and meta
$raw .= '<div class="grid_container">';

$raw .= '<div id="map"><img src="'.$imgs[0].'"/></div>';

$raw .= '<div id="meta">';
$raw .= '<table>';
$raw .= '<thead><tr><th colspan=2>Meta Info</th></tr></thead><tbody>';
$raw .= '<tr><td>Country</td><td class="tright">'.$meta["country"].'</td></tr>';
$raw .= '<tr><td>ADM</td><td class="tright">'.$meta["adm"].'</td></tr>';
$raw .= '<tr><td>Aid Layer</td><td class="tright">'.$meta["gapanalysis"].'</td></tr>';
$raw .= '<tr><td colspan=2 style="text-align:center;">Weighted Layers</td></tr>';
foreach ($meta["weights"] as $key => $value) {
	$val = $meta["weight_vals"][$key];
	$raw .= '<tr><td colspan=2>'.$value.' ('.$val.')</td></tr>';
}
$raw .= '</tbody></table>';
$raw .= '</div>';

$raw .= '</div>';				

// wide text
$raw .= '<div>'.$main_text.'</div>';

// extremes chart
$raw .= '<div class="grid_container"><div id="extremes"><img src="'.$imgs[1].'"/></div></div>';				

// funding chart and small text
$raw .= '<div class="grid_container">';
$raw .= '<div id="info">'.$funding_text.'</div>';
$raw .= '<div id="funding" class="medium-chart"><img src="'.$imgs[2].'"/></div>';
$raw .= '</div>';				

// ratio chart
$raw .= '<div class="grid_container"><div id="ratio"><img src="'.$imgs[3].'"/></div></div>';				

// end text
$raw .= '<div>'.$end_text.'</div>';

$raw .= '</div>';
		

// convert markdownextra to html
require_once '/var/www/html/aiddata/libs/Michelf/MarkdownExtra.inc.php';
use \Michelf\MarkdownExtra;
$parser = new MarkdownExtra();
$html = $parser->transform($raw);
file_put_contents("/var/www/html/aiddata/data/documentation.html", $html);

// convert html to pdf
include '/var/www/html/aiddata/libs/mpdf/mpdf.php';
$mpdf = new mPDF();
$mpdf->WriteHTML($html);
$mpdf->Output("/var/www/html/aiddata/data/documentation.pdf", "F");

$out = '../data/documentation.pdf';

echo json_encode($out);

?>