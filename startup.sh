#!/bin/bash
export BASE_DIRECTORY="/mnt/c/Users/ghe/Downloads/Tickerplant/"
export ON_DISK_HDB="/mnt/c/Users/ghe/Downloads/Tickerplant/OnDiskDB/"
export TICK_DIRECTORY="/mnt/c/Users/ghe/Downloads/Tickerplant/tick/"

echo "Starting Dashboards"
cd $BASE_DIRECTORY
cd dash
q sample/demo.q -u 1 &
q dash.q -p 10001 -u 1 &

echo "Starting Tickerplant" 
cd $BASE_DIRECTORY
q tick.q sym . -p 5000  >> tickerplantLog.txt &

echo "Starting HDB"
q hdb.q $ON_DISK_HDB -p 5002  >> hdbLog.txt &

echo "Starting RDB"
#cd $TICK_DIRECTORY
q tick/r.q localhost:5000 localhost:5002 -p 5005 >> rdbLog.txt & \
#q tick/r.q 2>&1 >> rdb.txt &

cd $BASE_DIRECTORY
q feedhandler_allLevels.q -p 5008 

