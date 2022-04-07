// set the port
@[system;"p 6812";{-2"Failed to set port to 6812: ",x,
  ". Please ensure no other processes are running on that port",
  " or change the port in both the publisher and subscriber scripts.";  
  exit 1}]

/ add api for listing functions
.api.getFunctions:{[]
    raze{f:$[null x;;` sv/:(`,x),/:]system"f .",string x;i:where 100h=type each v:value each f;
         flip`name`parameters!(f i;{flip`name`type!(value[x]1;`Symbol)}each v i)
        }each`,asc key[`]except`j`q`Q`h`o`u
    }

\d .math 
// sinwave
// t, scalar t represents position along a single line
// a, amplitude, the peak deviation of the function from zero.
// f, ordinary frequency, the number of oscillations (cycles) that occur each second of time.
// phase, specifies (in radians) where in its cycle the oscillation is at t = 0
pi:acos -1
sineWave:{[t;a;f;phase]
    a * sin[phase+2*pi*f*t]
 }

\d .ringBuffer 
read:{[t;i]
    $[i<=count t; i#t;i rotate t]
 }

write:{[t;r;i]
    @[t;(i mod count value t)+til 1;:;r];
 }


\d .stream

// cache some updates for the snapshot
cache:([]time:`timestamp$(); sym:`symbol$(); vol:`float$(); flow:`int$());
gen:{[n]	
	res:`time xcols update time:.z.p from ([]sym:n?100?`3; vol:n?100f; flow:n?3000i);
	oflow: (n + count cache) - 1000;
	cache:: $[0<oflow; oflow _ cache; cache],res;
	res
 }

wavesI:0-1;
waves:100000#([]time:`timestamp$(); r:`float$(); o:`float$(); y:`float$(); g:`float$(); b:`float$(); p:`float$());
wavesGen:{	
	res: enlist `time`r`o`y`g`b`p!(.z.p,{(x%6)+.math.sineWave[.z.p;1.4;1e-10f;x] - 0.4} each (0;1;2;3;4;5));
    .ringBuffer.write[`.stream.waves;res;wavesI+:1];
	res
 }

peaksI:0-1;
peaks:100000#([]time:`timestamp$(); r:`float$(); o:`float$(); y:`float$(); g:`float$(); b:`float$(); p:`float$());
peaksGen:{	
	res: enlist `time`r`o`y`g`b`p!(.z.p,{(x%8)+.math.sineWave[.z.p;1.0;5e-10f;x] + .math.sineWave[.z.p;0.05;345e-11f;x]-2} each (0;1;2;3;4;5));
    .ringBuffer.write[`.stream.peaks;res;peaksI+:1];
	res
 }

/ nyan 1000pts 100fps
rainbowI:0-1;
rainbow:100000#([]time:`timestamp$(); r:`float$(); o:`float$(); y:`float$(); g:`float$(); b:`float$(); p:`float$());
rainbowGen:{
    ts: `timestamp$(`long$.z.p - 2000000000);
	res: enlist `time`r`o`y`g`b`p!(ts,{(x%20)+.math.sineWave[.z.p;0.05;4e-10f;0]} each (5;4;3;2;1;0));
    .ringBuffer.write[`.stream.rainbow;res;rainbowI+:1];
	res
 }

cat:{[]
    s:rainbow[rainbowI mod count rainbow];
    enlist `sym`time`y!(`cat;s`time;s`g)
 }

\d .fx

/ fx tick schema
schema:([Date:`timestamp$()]Time:`timestamp$();Open:`float$();High:`float$();Low:`float$();Close:`float$();Volume:`long$());

/ fx csv data
syms: `id xkey ("SF"; enlist ",") 0: `:sample/data/fx/pairs.csv;
{x set `Date xkey ("PFFFFJ"; enlist ",") 0:`$":sample/data/fx/",ssr[string x;"\/";""],"20191230.csv"} each exec id from syms;

// generate inverse data for missing major pairs
majors: ("USD";"EUR";"JPY";"GBP";"AUD";"CAD";"CHF";"NZD");
{{sym:`$ x,"/",y; if[(not x like y) and 101h=type .fx[sym];invSym:`$ y,"/",x;`.fx.syms insert (sym; 0.0001);.fx[sym]: `Date xkey select Date, Open:1%Open, High:1%Low, Low:1%High, Close:1%Close, Volume from .fx[invSym]]}[;x] each majors} each majors;



\d .stocks

/ stock tick schema
schema:([Date:`timestamp$()]Time:`timestamp$();Open:`float$();High:`float$();Low:`float$();Close:`float$();Volume:`long$());

/ stock csv data
fundamentals: `sym xkey ("SSFSFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFSFSSSI"; enlist ",") 0: `:sample/data/stocks/fundamentals.csv;
syms: ("SS"; enlist ",") 0: `:sample/data/stocks/symbols.csv;
{x set reverse `Date xkey ("PFFFFJ"; enlist ",") 0: ` sv (`:sample/data/stocks; `$("" sv ((upper string x);"20180726.csv")))} each syms`id;

/ stock list
list: `Description xasc (`sym xkey { x,exec Last:first Close,Change:first Close - (last Close),ChangePerc:(first Close - (last Close))% last Close,DayLow: min Low,DayHigh: max High from .stocks[x`sym] where Date<.z.t } each select sym:id,Description:name,LastTime:.z.d+.z.t from .stocks.syms)

\d .
// all tables in the top level namespace (`.) become publish-able
grid:([]time:`timestamp$(); sym:`symbol$(); vol:`float$(); flow:`int$());
waves:([]time:`timestamp$(); r:`float$(); o:`float$(); y:`float$(); g:`float$(); b:`float$(); p:`float$());
peaks:([]time:`timestamp$(); r:`float$(); o:`float$(); y:`float$(); g:`float$(); b:`float$(); p:`float$());
rainbow:([]time:`timestamp$(); r:`float$(); o:`float$(); y:`float$(); g:`float$(); b:`float$(); p:`float$());
cat:([]sym:`symbol$();time:`timestamp$(); y:`float$());
majors: ([sym:`symbol$()]usd:`float$();eur:`float$();jpy:`float$();gbp:`float$();aud:`float$();cad:`float$();chf:`float$();nzd:`float$());
list: `sym xkey 0 sublist .stocks.list;
stream:([]sym:`$());
book:([]sym:`symbol$();MDEntrySize:`long$();MDEntryPx:`float$();MDEntryType:`byte$();FloorCode:`int$());
book1Agg:([]sym:`symbol$();MDEntrySize:`long$();MDEntryPx:`float$();MDEntryType:`byte$();FloorCode:`int$());
book2Agg:([]sym:`symbol$();MDEntrySize:`long$();MDEntryPx:`float$();MDEntryType:`byte$();FloorCode:`int$());
tradePanels:`id xkey ("SS"; enlist "\t") 0: `$":sample/data/tradePanels.csv";


// initialise kdb+tick 
// all tables in the top level namespace (`.) become publish-able
// tables that can be published can be seen in .u.w
\l sample/tick/u.q
.u.init[];

// functions to publish data
// .u.pub takes the table name and table data
// there is no checking to ensure that the table being published matches
// the table schema defined at the top level
// that is left up to the programmer!
generateOHLC:{[sym;dir]
	refs:dir sym;sym:`$"stream_",string s:sym;
	nowMin: `minute$.z.p;
	refSticks: select from refs where nowMin=`minute$Date;
	if[count refSticks;
		/ nowStick is not current
		if[$[not count nowSticks[sym]; 1b; not nowMin=`minute$nowSticks[sym]`Date];
			/ if existing publish the ref stick before moving on
			if[count nowSticks[sym]; 
				/ .u.pub[sym;select Date:.z.d+`time$Date,Time:.z.d+`time$Date,Open,High,Low,Close,Volume
				/ 	from refs where (`minute$Date)=`minute$(nowSticks[sym]`Date)]
			];
			nowSticks[sym]:`Date`Time`Open`High`Low`Close`Volume!((2#`timestamp$.z.d+`time$nowMin),(4#(first refSticks)`Open),0)
		];
	
		ref: first refSticks;
		ns: nowSticks[sym];
		/ TODO should take steps to high low instead of flitting
		ns[`Close]: first (ref`Low)+1?(ref`High)-ref`Low;
		ns[`High]: max ns[`High],ns[`Close];
		ns[`Low]: min ns[`Low],ns[`Close];
		nowSticks[sym]: ns;
		/ .u.pub[sym; `Date xkey enlist ns];
		:enlist ns,enlist[`sym]!enlist s
	];
 ()
 }

// generate fx book
generateBook:{[sym]
	depth:6;
	ns:nowSticks[`$"stream_",string sym];
	pip:.fx.syms[sym]`pipsize;
	spread: {{x + (y * z)}[x;y;] (neg 1+til z),1+til z};
  	t:([]sym:(depth*2)#sym;
		MDEntrySize:1000000 * 1 + rand each (depth*2)#6;
		MDEntryPx: spread[ns`Close;pip;depth];
		MDEntryType:(depth#0x00),depth#0x01;
		MDTWAP: spread[(sum ns`Close`Open`High`Low) % 4;pip;depth];
		FloorCode:(2*depth)?(0ni;1i;2i;3i));

	update MDVWAP: {x wavg y}'[sum each MDEntrySize;MDEntryPx] from t
	}


/ gk publish grid should save last 100 pub new rows for snapshot
lastTime:.z.t;
nowSticks:()!();

// create timer function to randomly publish symbols
tickcount:0;
frameskip: 15;
.z.ts:{
	// publish up to 10 random fx syms
	fxsyms: neg[1+rand 9]?exec id from .fx.syms;

	if[0=tickcount mod frameskip; [
		now: .z.p;

		{if[count x;.u.pub[`stream] update Time:Date from x]}raze generateOHLC[;`.fx]each fxsyms;

		// publish majors
		.u.pub[`majors;`sym xkey flip (`sym,`$.fx.majors)!((enlist `$.fx.majors),{ { sym:`$x,"/",y; res: nowSticks[`$"stream_",string sym]; $[0h=type res;0nf;res`Close]  }[;x] each .fx.majors} each .fx.majors)];

		// publish up to 5 random stock syms & update stock list
		{if[count x;
			.u.pub[`stream].debug.eq:ns:update Time:Date from x;
			`.stocks.list upsert select sym,Last:Close,Change:Close-Last,ChangePerc:(Close-Last)%Last,LastTime:Time,DayLow&Low,DayHigh|High from ns lj .stocks.list;
			// publish stock list
			.u.pub[`list;.stocks.list];
			];
		}raze generateOHLC[;`.stocks]each s:neg[1+rand 4]?exec id from .stocks.syms;

		.u.pub[`grid;.stream.gen[1+rand 4]]

		lastTime::now;
	]];

	// publish book
	.u.pub[`book;raze generateBook each fxsyms];
	.u.pub[`book1Agg;raze generateBook each fxsyms];
	.u.pub[`book2Agg;raze generateBook each fxsyms];

	tickcount+:1;

	.u.pub[`grid;.stream.gen[1]];
    .u.pub[`rainbow;.stream.rainbowGen[]];
    .u.pub[`cat;.stream.cat[]];
    .u.pub[`waves;.stream.wavesGen[]];
	.u.pub[`peaks;.stream.peaksGen[]];
 }

\t 16

// snap function handlers
.stream.snap:`stream`majors`list`grid`rainbow`cat`waves`peaks`book`book1Agg`book2Agg!(
	{
		raze {
		t:$[101h<>type `.fx[x];`.fx[x];`.stocks[x]]; 
		0!update sym:x, Time:Date from -500 sublist `Date xasc (reverse update Date:.z.d-1+`time$Date from select from t where lastTime<.z.d+`time$Date),update Date:.z.d+`time$Date from select from t where lastTime>=.z.d+`time$Date
		} each $[(`~x) or 11h=type x;x;enlist x]
	};
	{ flip (`sym,`$.fx.majors)!((enlist `$.fx.majors),{ { sym:`$"stream_",x,"/",y; res: nowSticks[sym]`Close; $[0ne=res;0nf;res]  }[;x] each .fx.majors} each .fx.majors) };
	{ .stocks.list };
	{ .stream.cache };
	{ .ringBuffer.read[.stream.rainbow;.stream.rainbowI]};
	{ .stream.cat[] };
	{ .ringBuffer.read[.stream.waves;.stream.wavesI] };
	{ .ringBuffer.read[.stream.peaks;.stream.peaksI] };
	{raze generateBook each $[-11h=type x;exec id from .fx.syms;x]};
	{raze generateBook each $[-11h=type x;exec id from .fx.syms;x]};
	{raze generateBook each $[-11h=type x;exec id from .fx.syms;x]}
 );

// add .u.snap to support snapshots
.u.snap:{[x]
	.stream.snap[x 0]x 1
 }


/ load datafilter analytics
\l sample/dfilt.q_
\l sample/querybuilder.q

/ generate trade data
getQuote:{[s;t]
    refDate: 2019.12.30;
    {(x`Low) + rand (x`High)-x`Low} .fx[s][refDate+`minute$t]
  }

{[]
	n:300000;
  	brokers: `BrokersLtd`IOPWinds`BankOnline`FXHF`TradeFX`DealBrokers`BankOfIT;
	mkt:(`$("AUD/USD";"EUR/USD";"GBP/USD";"NZD/USD";"USD/CAD";"USD/CHF";"USD/JPY"))!8 39 15 6 7 7 18;	/ market share
	`fxrack set ([]minute:(00:00+.z.d)+0D00:01*til 1440);
	`dfxTrade set {x[`price]: getQuote[x`sym;x`time]; x} each update size:1000*1|abs sums count[i]?1 -1 by sym from([]time:asc(00:00+.z.d)+(n?1D)|n?1D;sym:`g#n?where mkt;src:n?where brokers!value mkt);
	`dfxQuote set select time,sym,src,bidSize:500000*2+n?5,bid:price,ask:price+?[sym like"*JPY";0.001;0.00001]*1+n?10,askSize:500000*2+n?5 from dfxTrade;
 }[];

/ load csv data
fxHistoric: ("FFFFFFTS"; enlist ",") 0: `$":sample/data/fx.csv";
fxLive: ("ISSFFFSS"; enlist ",") 0: `$":sample/data/fxLive.csv";
FXTradeData: ("SISSSFFFFFFFFDVDVFFFJFDFFFFFSS"; enlist ",") 0: `$":sample/data/FXTradeData.csv";
ppr: ("ISSDSSSFSSSSDSSFFSSSSISFS"; enlist ",") 0: `$":sample/data/ppr-lite.csv";
Rundata: ("PFFFFFFFFFFF" ; enlist ",") 0: `$":sample/data/geo.csv";
SeattleTemps: ("SF" ; enlist ",") 0: `$":sample/data/seattle-temps.csv";
SharePrice: ("ZFFFFFS"; enlist ",") 0: `$":sample/data/SharePrices.csv";
SPX: ("DFFFFJF"; enlist ",") 0: `$":sample/data/SPX_65yrdata.csv";
StateData: ("DSIFFFF"; enlist ",") 0: `$":sample/data/USStateHealth.csv";
WindVectors: ("FFIIF" ; enlist ",") 0: `$":sample/data/windvectors.csv";

/ https://datahub.io/core/s-and-p-500-companies-financials - PDDL public domain
fundamentals:("SSSFFFFFFFFFFFFFFFFS"; enlist ",") 0: `$":sample/data/constituents-financials_csv.csv";
screenerFilters: `id xkey ("SS"; enlist "\t") 0: `$":sample/data/ScreenerFilters.csv";

/ sensors data
Plantstatus:("STFFFFFFFFFFFFFFF"; enlist ",") 0: `$":sample/data/PlantOverview.csv";
PlantCIPDetails:("FFSSSSSSSSSISSS"; enlist ",") 0: `$":sample/data/plantCIPDetails.csv";
CIPSHistData:("ISSSSSSSSS"; enlist ",") 0: `$":sample/data/CIPHistData.csv";
sensorstime:("DFFFFS"; enlist ",") 0: `$":sample/data/sensorstimeseries.csv";
Sensorlist:("SFFFIFFFFFFFFFFSS"; enlist ",") 0: `$":sample/data/sensorspie.csv";
sensorsdailyalert:("DFFFFFFFFS"; enlist ",") 0: `$":sample/data/sensorsdailyalert.csv";
CIPInfoData:("IFFFFFFFFFFFFFFFFFFFSS"; enlist ",") 0: `$":sample/data/CIPInfoData.csv";

avgRentalPrices: ("SSSFFJ"; enlist ",")  0: `$":sample/data/rentalPricesIE.csv";
propertyPrices: ("SSFJS"; enlist ",")  0: `$":sample/data/propertyPricesIE.csv";
qryBuilderQueries: `id xkey ("SS"; enlist "\t") 0: `$":sample/data/qryBuilderQueries.csv";

/ load json data
Cars: .j.k read1`$":sample/data/cars.json";
Flare: .j.k read1`$":sample/data/flare.json";
Jobs: .j.k read1`$":sample/data/jobs.json";

/ type tests
intValues:(0Ni;-0Wi;-0Wi+1;0i;0Wi-1;0Wi);
longValues:(0N;-0W;-0W+1;0j;0W-1;0W);
typeTable: flip `id`value`boolean`guid`byte`short`int`long`real`float`char`symbol`timestamp`month`date`datetime`timespan`minute`second`time!((1, 2, 3, 4, 5, 6);(`$"null";`$"-infinite";`$"min";`$"mid";`$"max";`$"infinite"); `boolean$(0b;0b;0b;1b;1b;1b); `guid$(0Ng;0Ng;0Ng;"G"$"88888888-8888-8888-8888-888888888888";"G"$"ffffffff-ffff-ffff-ffff-ffffffffffff";"G"$"ffffffff-ffff-ffff-ffff-ffffffffffff"); `byte$(0N;0x00;0x01;0x88;0xEF;0xFF); `short$(0Nh;-0Wh;-0Wh+1;0h;0Wh-1;0Wh); `int$intValues; `long$longValues; `real$(0n -0w 1.17549435e-38 0 3.402823e+38 0w); `float$(0n -0w 2.2250738585072014e-308 0 1.7976931348623158e+308 0w); `char$(" ";"a";"a";"b";"z";"z"); ``sym`sym`sym`sym`sym; `timestamp$(0N;-0W;1709.01.01D00:00:00;0j;2290.12.31D23:59:59.999999999;0W); `month$(0Ni;-0Wi;-0Wi+1;0i;0Wi-1;0Wi); `date$(0N -0w -693960 0 2921939 0w); `datetime$(0N -0w -693959 0 2921939 0w); `timespan$longValues; `minute$intValues; `second$intValues; `time$intValues);

/ covid-19: https://github.com/datasets/covid-19
CovidOpenData: ("DSSFFIII" ; enlist ",") 0: `$":sample/data/covid-19/data/time-series-19-covid-combined.csv";
CovidOpenData:`Date xasc `Date`Country_Region`Province_State`Lat`Long`Confirmed`Recovered`Deaths xcol CovidOpenData;
CovidOpenData: update ConfirmedDelta:deltas Confirmed, DeathsDelta:deltas Deaths,RecoveredDelta:deltas Recovered by Country_Region,Province_State from CovidOpenData;


/ load sample partitioned table
\l sample/hdb/date

/ sample demo functions
.api.getFXData:{[sym]
    .fx[sym]
 };

.api.transformFunction:{[res;s]
    select from (res 0) where side=s
 };
 
.api.mortgageRepaymentCalc:{[res;years]
    months : years * 12;
   // rate: (interestRate % 100);
    update Monthly_repayment : ceiling((Price * 1.06) % months) from res(0)
  
 };

.api.rentVmortgageCompare:{[res]
   select from res(0)
 };
