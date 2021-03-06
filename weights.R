library("rgdal")
library("leafletR")

readIn <- commandArgs(trailingOnly = TRUE)

in_continent <- readIn[1]
in_country <- readIn[2]
in_adm <- readIn[3]
in_name <- readIn[4]
in_count <- as.numeric(readIn[5])

in_rasters <- array()
in_weights <- array()
in_files <- array()

for (i in 1:in_count){
	in_rasters[i] <- readIn[5+3*(i-1)+1]
	in_weights[i] <- as.numeric(readIn[5+3*(i-1)+2])
	in_files[i] <- readIn[5+3*(i-1)+3]
}

base <- paste("/var/www/html/aiddata/DET/resources",in_continent,in_country,sep="/")
setwd(base)
write(paste(base,"shapefiles",in_adm,"Leaflet.geojson",sep="/"),"/var/www/html/aiddata/t1.txt")

geojson <- readOGR(paste("shapefiles",in_adm,"Leaflet.geojson",sep="/"), "OGRGeoJSON", disambiguate=TRUE)
write("5","/var/www/html/aiddata/t1.txt")
for (i in 1:in_count){
	csv <-  read.csv(paste("cache",in_files[i], sep="/"))

	# check whether layer was given a negative weight by user
	n <- 1
	if (in_weights[i] < 0) {
		n <- -1
	}

	# determine weights multiplier 
	weight <- abs(in_weights[i]) / sum(abs(in_weights))

	# extract layer data 
	extract <- csv[,length(csv)]
	
	max <- max(extract)

	# if (max == 0){
	# 	max <- 1
	# 	calc <- weight
	# } else {
	# 	calc <- ( extract / max(extract) ) * weight  
	# }

	# prevent div by zero error for all zero layer 
	if (max == 0){
		max <- 1
	}

	# use raw data if layer is already weighted
	# if ( max(extract) <= 1 & min(extract) >= 0 ) {
	# 	max <- 1
	# }


	calc <- ( extract / max ) * weight  
	

	if (i == 1){
		result <- calc * n
	} else {
		result <- result + calc * n
	}

	geojson@data[in_rasters[i]] <- extract
	geojson@data[paste(in_rasters[i],"_weighted",sep="")] <- calc * n
}

geojson@data["result"] <- result

setwd("/var/www/html/aiddata/data/weights")
toGeoJSON(data=geojson, name=in_name)

setwd("/var/www/html/aiddata/data/weights_csv")
write.table(geojson@data, paste(in_name,".csv",sep=""), quote=T, row.names=F, sep=",")
