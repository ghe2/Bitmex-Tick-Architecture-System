#!/bin/bash

echo "Starting Kx Dashboards as $USER"

export PATH=$PATH:$HOME/bin:~/q/l64
export QHOME=~/q

# set up the log name
LOG=/opt/dash/logs/dash

# move into dash directory so dash.q can load other files
cd /opt/dash

# start dashboards as server
q dash.q -u 1 -p 10001 > $LOG.log 2> $LOG.err < /dev/null &

# save pid of process to file for systemd to monitor
echo $! > /opt/dash/logs/dash.pid
