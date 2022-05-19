#!/bin/bash
#echo "Starting Dashboards"
#cd $BASE_DIRECTORY
#cd dash
#q sample/demo.q -u 1 &
#q dash.q -p 10001 -u 1 &

echo "Starting Tickerplant" 
q tick.q crypto $ON_DISK_HDB -p $TP_PORT -env crypto_tick &

echo "Starting HDB"
q hdb.q $ON_DISK_HDB -p 3002 -env crypto_tick &

echo "Starting RDB"
q tick/r.q localhost:$TP_PORT localhost:3002 -p 3005 -env crypto_tick & 

echo "Starting BitMEX feedhandler"
q feedhandler_BITMEX.q -p 3008 -env crypto_tick &

echo "Starting ETH Alchemy feedhandler"
q feedhandler_ETH.q -p 3009 -env crypto_tick &

