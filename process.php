<?php

switch ($_POST['type']) {

	case 'exists':
		$name = $_POST['name'];
		if ( file_exists("/var/www/html/aiddata/MAT/data/".$name.".geojson") ) {
			echo "true";
		} else {
			echo "false";
		}
		break;

	//returns directory contents
	case 'scan':
		$path = $_POST['path'];
		$dir = "/var/www/html/aiddata/DET/resources" . $path;
		$rscan = scandir($dir);
		$scan = array_diff($rscan, array('.', '..'));
		$out = json_encode($scan);
		echo $out;
		break;

	// create / get point geojson from csv data (ogr2ogr call)
	case 'addPointData':
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

	// send variables to Rscript to create geojson with weighted data
	case 'buildPolyData':

		$continent = $_POST["continent"];
		$country = $_POST["country"];
		$adm = $_POST["adm"];
		// $name = $country ."_". $adm ."_". md5($_POST["name"]);
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

		if ( file_exists("/var/www/html/aiddata/MAT/data/".$name.".geojson") ){
			echo $name;

		} else {
			exec("/usr/bin/Rscript /var/www/html/aiddata/MAT/build.R $vars"); 
			echo $name;
		}
		break;
}

?>
