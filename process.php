<?php

switch ($_POST['call']) {

	// check if a file exists
	case 'exists':
		$name = $_POST['name'];
		if ( file_exists("/var/www/html/aiddata/".$name) ) {
			echo "true";
		} else {
			echo "false";
		}
		break;

	// returns directory contents
	case 'scan':
		$path = $_POST['path'];
		$dir = "/var/www/html/aiddata/DET/resources" . $path;
		$rscan = scandir($dir);
		$scan = array_diff($rscan, array('.', '..'));
		$out = json_encode($scan);
		echo $out;
		break;

	// create / get point geojson from csv data (ogr2ogr call)
	case 'pointdata':
		$country = $_POST["country"];
		$type = $_POST["pointType"];
		$min = $_POST["start_year"];
		$max = $_POST["end_year"];

		$dest =  "/var/www/html/aiddata/home/data/point/".$country."_".$type."_".$min."_".$max.".geojson";
		if (!file_exists($dest)){

			$source = '/var/www/html/aiddata/home/data/source/'.$country.'.vrt';

			if ($country == "Uganda"){
				if ($type == "Health"){
					$search = "ad_sector_name LIKE '%HEALTH%' OR ad_sector_name LIKE '%WATER%'";
				} else {
					$search = "ad_sector_name LIKE '%".strtoupper($type)."%'";
				}
			} else {
				if ($type == "Health"){
					$search = "ad_sector_name LIKE '%Health%' OR ad_sector_name LIKE '%Water Supply and Sanitation%'";
				} else {
					$search = "ad_sector_name LIKE '%".$type."%'";
				}
			}

			if ($country != "Malawi"){
				$search .= " AND (d_".$min." != '0'";
				for ($i=$min+1;$i<=$max;$i++) {
					$search .= " OR d_".$i." != '0'";
				}
				$search .= ")";
			}

			$string = 'ogr2ogr -f GeoJSON -sql "SELECT * FROM '.$country.' WHERE '.$search.'" '.$dest.' '.$source;

			exec($string);

			$results = file_get_contents($dest);
			echo $results;

		} else {
			$results = file_get_contents($dest);
			echo $results;
		}
		break;

	// send variables to weights.R to create geojson
	case 'weights':
		$continent = $_POST["continent"];
		$country = $_POST["country"];
		$adm = $_POST["adm"];
		$rasters = $_POST["rasters"];
		$weights = $_POST["weights"]; 
		$files = $_POST["files"];
		$count = count($rasters);

		// generate unique name
		$raw = $country ."_". $adm; 
		for ($i=0; $i<$count; $i++){
			$raw .= "_" . $rasters[$i] ."_". $weights[$i];
		}
		$name = $country ."_". $adm ."_". md5($raw);

		// build variable string for Rscript
		$vars = strtolower($continent) ." ". strtolower($country) ." ". $adm ." ". $name ." ". $count;

		for ($i=0; $i<$count; $i++){
			$vars .= " " . $rasters[$i] ." ". $weights[$i] ." ". $files[$i];
		}

		if ( !file_exists("/var/www/html/aiddata/data/weights/".$name.".geojson") ){
			exec("/usr/bin/Rscript /var/www/html/aiddata/DASH/weights.R $vars"); 
		}	
		echo $name;
		
		break;

	// send variables to gapanalysis.R to create geojson
	case 'gapanalysis':
		$continent = $_POST["continent"];
		$country = $_POST["country"];
		$adm = $_POST["adm"];
		$rasters = $_POST["rasters"];
		$files = $_POST["files"];
		$count = count($rasters);

		// generate unique name
		$raw = $country ."_". $adm; 
		$raw .= "_" . $rasters[0];
		$raw .= "_" . $files[1];
		
		$name = $country ."_". $adm ."_". md5($raw);

		// build variable string for Rscript
		$vars = strtolower($continent) ." ". strtolower($country) ." ". $adm ." ". $name ." ". $count;

		for ($i=0; $i<$count; $i++){
			$vars .= " " . $rasters[$i] ." ". $files[$i];
		}

		if ( !file_exists("/var/www/html/aiddata/data/gapanalysis/".$name.".geojson") ){
			exec("/usr/bin/Rscript /var/www/html/aiddata/DASH/gapanalysis.R $vars"); 
		}
		echo $name;
		break;

	// save a highcharts chart as image
	case 'saveimg':
		$base = '/var/www/html/aiddata/data/images/gapanalysis/' . $_POST['hash'] . '/';
		$name = $_POST['name'] .'.png';

		$filename = $base . $name ;

		// if ( file_exists($filename) ) {
		// 	$out = 'image exists';//$name;
		// 	echo json_encode($out);
		// 	break;
		// }

		$img = $_POST['img'];
		$img = str_replace('data:image/png;base64,', '', $img);
		$img = str_replace(' ', '+', $img);
		$data = base64_decode($img);

		$success = file_put_contents($filename, $data);			
		$out = $success ? $name : 'Unable to save the file.';

		echo json_encode($out);
		break;

	// save a leaflet map as image
	case 'savemap':

		$base = '/var/www/html/aiddata/data/images/map/';
		$file = $base . uniqid() . '.png';

		$img = $_POST['img'];
		$img = str_replace('data:image/png;base64,', '', $img);
		$img = str_replace(' ', '+', $img);
		$data = base64_decode($img);

		$success = file_put_contents($file, $data);
		$out = $success ? $file : 'Unable to save the file.';

		echo json_encode($out);
		break;

	// write json to file
	case 'write':
		$hash = $_POST['hash'];
		$json = json_encode(json_decode($_POST['json']), JSON_PRETTY_PRINT);

		$base = '/var/www/html/aiddata/data/images/gapanalysis/' . $hash;
		$filename = $base .  '/chart_options.json';

		
		// if ( file_exists($filename) ) {
		// 	$out = 'write DASH json: exists';
		// 	echo $out;
		// 	break;
		// }

		if (!file_exists($base) && !is_dir($base)) {
			$old_mask = umask(0);
			mkdir($base, 0775, true);
		}

		file_put_contents($filename, $json);

		$out = 'write DASH json: done';
	
		echo $out;

		break;

}

?>
