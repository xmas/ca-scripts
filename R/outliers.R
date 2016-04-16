#!/usr/bin/env Rscript

args = commandArgs(trailingOnly=TRUE)

if (length(args)==0) {
  stop("At least one argument must be supplied (input file).n", call.=FALSE)
} else if (length(args)==1) {
  # default output file
  args[2] = "out.txt"
}

library("tsoutliers")

data <- read.csv(args[1], header=FALSE, sep=",")
tsv <- data$V1

l <- length(tsv)
ts1 <- ts(tsv, start=c(2015, 1), c(2015, l), frequency=12)


png("ts.png", width = 800, height = 1100)
plot(ts1)
dev.off()

writeRes <- function(res1, name) {

	write.csv(res1$outliers, paste(name, "ol.csv", sep=""), na="")

	png(paste(name, "tso.png", sep=""), width = 800, height = 1100)
	plot(res1)
	dev.off()

}


res1 <- tso(ts1, types = c("AO"),maxit.iloop=10)
writeRes(res1, "AO")

res1 <- tso(ts1, types = c("IO"),maxit.iloop=10)
writeRes(res1, "IO")

res1 <- tso(ts1, types = c("LS"),maxit.iloop=10)
writeRes(res1, "LS")

res1 <- tso(ts1, types = c("TC"),maxit.iloop=10)
writeRes(res1, "TC")

res1 <- tso(ts1, types = c("SLS"),maxit.iloop=10)
writeRes(res1, "SLS")

res1 <- tso(ts1, types = c("AO","LS","TC"),maxit.iloop=10)
writeRes(res1, "AO-LS-TC")
