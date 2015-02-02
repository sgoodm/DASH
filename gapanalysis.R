library("rgdal")
library("leafletR")

readIn <- commandArgs(trailingOnly = TRUE)

in_continent <- readIn[1]
in_country <- readIn[2]
in_adm <- readIn[3]
in_name <- readIn[4]
in_count <- as.numeric(readIn[5])

in_rasters <- array()
in_files <- array()

for (i in 1:in_count){
	in_rasters[i] <- readIn[5+2*(i-1)+1]
	in_files[i] <- readIn[5+2*(i-1)+2]
}

base <- paste("/var/www/html/aiddata/DET/resources",in_continent,in_country,sep="/")
setwd(base)

geojson <- readOGR(paste("shapefiles",in_adm,"Leaflet.geojson",sep="/"), "OGRGeoJSON")


# get primary data
primary_file <- paste("cache",in_files[1], sep="/")
primary_csv <- read.csv(primary_file)
primary_key <- tail(names(primary_csv), 1)
primary_data <- primary_csv[,primary_key]

# get secondary file

setwd("/var/www/html/aiddata/data/weights_csv")
secondary_file <- in_files[2]

secondary_csv <- read.csv(secondary_file)
secondary_key <- tail(names(secondary_csv), 1)
secondary_data <- secondary_csv[,secondary_key]


# loop to find "_weighted" in seconadry_data csv 
# log values in new geojson to build stacked bar charts
for ( j in 1:length(names(secondary_csv)) ) {
	name <- names(secondary_csv)[j]
	name_end <- substr(name,nchar(name) - nchar("_weighted") + 1 , nchar(name))
	if ( name_end == "_weighted"  ) {
		 geojson@data[name] <- secondary_csv[,name]
	}
}


# calculations
geojson@data[in_rasters[1]] <- primary_data
if ( as.numeric(min(primary_data) < 0) ) {
	primary_data <- primary_data - min(primary_data)
}
primary_data_percent <- primary_data / sum(primary_data)
primary_data_percent[is.nan(primary_data_percent)] = 0

geojson@data[paste(in_rasters[1],"percent",sep="_")] <- primary_data_percent

geojson@data[in_rasters[2]] <- secondary_data
if ( as.numeric(min(secondary_data) < 0) ) {
	secondary_data <- secondary_data - min(secondary_data)
}
# secondary data is already weighted 0-1 by weights.R
secondary_data_percent <- secondary_data #/ sum(secondary_data)
secondary_data_percent[is.nan(secondary_data_percent)] = 0

geojson@data[paste(in_rasters[2],"percent",sep="_")] <- secondary_data_percent

ratio <- primary_data_percent - secondary_data_percent
geojson@data["ratio"] <- ratio

sd <- (ratio-mean(ratio))/sd(ratio)
geojson@data["result"] <- sd


setwd("/var/www/html/aiddata/data/gapanalysis")
toGeoJSON(data=geojson, name=in_name)

setwd("/var/www/html/aiddata/data/gapanalysis_csv")
write.table(geojson@data, paste(in_name,".csv",sep=""), quote=T, row.names=F, sep=",")
