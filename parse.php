<?php

// init

$hash = $_POST['hash']; 
$json = json_decode($_POST['json'], true); 

// $filetype = $_POST['filetype'];

$imgs = $_POST['imgs'];
// $sizes = $_POST['sizes'];
$count = count($imgs);

for ($i=0; $i<$count; $i++){

	$imgs[$i] = "/var/www/html/aiddata/data/images/" . $imgs[$i];
	
	$new_image = substr($imgs[$i],0,-4) . ".jpeg";
	
	$im = new Imagick(); 
	$im->readImage($imgs[$i]);
	$im->writeImage($new_image);

	$imgs[$i] = $new_image;
}

// for ($i=0; $i<$count; $i++){
// 	$imgs[$i] = str_ireplace("../data", "/var/www/html/aiddata/data", $imgs[$i]);
// 	// $new_image = substr($imgs[$i],0,-4) . "_resize.jpeg";
	
// 	$im = new Imagick(); 

// 	// $im->setOption('png:size', '768x256');
// 	// $im->setResolution(72,72); 
// 	// $im->setSize(768,256);

// 	$im->readImage($imgs[$i]);
// 	// $im->scaleImage(400,0);
// 	$im->writeImage($new_image);

// 	$imgs[$i] = $new_image;
// }

// build raw string
$raw = '';
$raw .= '<style>
			table {
				border-collapse:collapse;
				cell-spacing: 0px;
				cell-padding: 0px;
				width:100%;
				margin-bottom:50px;
			}

			td,th {
				border:solid 1px black;
				padding:5px;
			}

			h1 {
				text-align:center;
			}


			img {
				width:1000px;
				// height:266px;
			}
		</style>';

$raw .= '<h1>AidData DASH Gap Analysis Results</h1>';
$raw .= '<div id="logo"><img src="'.$imgs[0].'"/></div>';				
$raw .= '<div id="logo"><img src="'.$imgs[1].'"/></div>';				
$raw .= '<div id="logo"><img src="'.$imgs[2].'"/></div>';				
$raw .= '<div id="logo"><img src="'.$imgs[3].'"/></div>';				

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