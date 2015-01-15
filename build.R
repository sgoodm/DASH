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

geojson <- readOGR(paste("shapefiles",in_adm,"Leaflet.geojson",sep="/"), "OGRGeoJSON")

for (i in 1:in_count){
	csv <-  read.csv(paste("cache",in_files[i], sep="/"))
	weight <- in_weights[i] / sum(in_weights)
	extract <- csv[,length(csv)]
	
	max <- max(extract)
	if (max == 0){
		max <- 1
		calc <- weight
	} else {
		calc <- ( extract / max(extract) ) * weight  
	}

	if (i==1){
		result <- calc
	} else {
		result <- result + calc
	}
	geojson@data[in_rasters[i]] <- extract
	geojson@data[paste(in_rasters[i],"_weighted",sep="")] <- calc
}

geojson@data["result"] <- result

setwd("/var/www/html/aiddata/MAT/data")

toGeoJSON(data=geojson, name=in_name)
