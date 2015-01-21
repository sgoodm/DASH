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
secondary_file <- paste("cache",in_files[2], sep="/")
secondary_csv <- read.csv(secondary_file)
secondary_key <- tail(names(secondary_csv), 1)
secondary_data <- secondary_csv[,secondary_key]

# calculations
geojson@data[in_rasters[1]] <- primary_data
primary_data_percent <- primary_data / sum(primary_data)
geojson@data[paste(in_rasters[1],"percent",sep="_")] <- primary_data_percent

geojson@data[in_rasters[2]] <- secondary_data
secondary_data_percent <- secondary_data / sum(secondary_data)
geojson@data[paste(in_rasters[2],"percent",sep="_")] <- secondary_data_percent

ratio <- primary_data_percent - secondary_data_percent
geojson@data["ratio"] <- ratio

sd <- (ratio-mean(ratio))/sd(ratio)
geojson@data["result"] <- sd


setwd("/var/www/html/aiddata/data/gapanalysis")

toGeoJSON(data=geojson, name=in_name)

