/ define stream schema
waves:([]time:`timestamp$(); r:`float$(); o:`float$(); y:`float$(); g:`float$(); b:`float$(); p:`float$());

/ load and initialize kdb+tick 
/ all tables in the top level namespace (`.) become publish-able
\l tick/u.q
.u.init[];

/ sinwave
/ t, scalar t represents position along a single line
/ a, amplitude, the peak deviation of the function from zero
/ f, ordinary frequency, the number of oscillations (cycles) that occur each second of time
/ phase, specifies (in radians) where in its cycle the oscillation is at t = 0
.math.pi:acos -1;
.math.sineWave:{[t;a;f;phase] a * sin[phase+2*.math.pi*f*t] }

/ publish stream updates
.z.ts:{ .u.pub[`waves;enlist `time`r`o`y`g`b`p!(.z.p,{.math.sineWave[.z.p;1.4;1e-10f;x]-0.4+x%6} each til 6)] }
.u.snap:{waves} // reqd. by dashboards

\t 16



// ring buffer write in a loop
.ringBuffer.read:{[t;i] $[i<=count t; i#t;i rotate t] }
.ringBuffer.write:{[t;r;i] @[t;(i mod count value t)+til 1;:;r];}

// cache updates for the snapshot
.stream.i:0-1;
.stream.waves:10000#waves;

// generate and save new record to buffer
.stream.wavesGen:{	
    res: enlist `time`r`o`y`g`b`p!(.z.p,{(x%6)+.math.sineWave[.z.p;1.4;1e-10f;x] - 0.4} each til 6);
    .ringBuffer.write[`.stream.waves;res;.stream.i+:1];
    res
 }

/ generate & publish waves
.z.ts:{ .u.pub[`waves;.stream.wavesGen[]] }

// implement snapshot function
.u.snap:{[t] .ringBuffer.read[.stream.waves;.stream.i] }
