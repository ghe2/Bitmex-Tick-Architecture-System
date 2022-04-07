# Kx Dashboards	

Kx Dashboards offers an easy-to-use, yet powerful drag-and-drop interface to allow creators to build dashboards without the need for programming experience.

## Getting Started

These instructions will get Kx Dashboards running on your local machine.

### Prerequisites

1. Install kdb: https://code.kx.com/q/learn/install/
2. Define q as a command: https://code.kx.com/q/learn/install/#step-5-edit-your-profile

### Installing & Running

1. Extract Dashboards zip file..
2. Run Dashboards gateway and sample data process:

a. On Windows click `dash.bat` to run, or
b. On Mac/Linux open the Terminal:
```
q sample/demo.q -u 1 &
q dash.q -p 10001 -u 1
```

3. Open http://localhost:10001

### Reference Commands

## Server Start
q sample/demo.q -u 1 > demo.log 2> demo.err < /dev/null &
echo $! > demo_pid.txt
q dash.q -u 1 -p 10001 > dash.log 2> dash.err < /dev/null &
echo $! > dash_pid.txt

## Server stop
kill -9 `cat demo_pid.txt`
rm demo_pid.txt
kill -9 `cat dash_pid.txt`
rm dash_pid.txt
