/ START copied from u.q
\d .u
init:{w::t!(count t::tables`.)#()}
del:{w[x]_:w[x;;0]?y};.z.pc:{del[;x]each t};
sel:{$[`~y;x;select from x where sym in y]}
pub:{[t;x]{[t;x;w]if[count x:sel[x]w 1;(neg first w)(`upd;t;x)]}[t;x]each w t}
add:{$[(count w x)>i:w[x;;0]?.z.w;.[`.u.w;(x;i;1);union;y];w[x],:enlist(.z.w;y)];(x;$[99=type v:value x;sel[v]y;@[0#v;`sym;`g#]])}
sub:{if[x~`;:sub[;y]each t];if[not x in t;'x];del[x].z.w;add[x;y]}
end:{(neg union/[w[;;0]])@\:(`.u.end;x)}
/ END copied from u.q

\d .

.queryBuilder.getFunctions:{
	select name,parameters:{flip `name`type!(x 1;`Symbol)}each parameters from 
	({`name`parameters!(x;(value (value (".api.",(string x)))))  } each key .api) where not null name
 };

// duplicate .api.getFunctions definition from demo.q
.api.getFunctions:{[]
    raze{f:$[null x;;` sv/:(`,x),/:]system"f .",string x;i:where 100h=type each v:value each f;
         flip`name`parameters!(f i;{flip`name`type!(value[x]1;`Symbol)}each v i)
        }each`,asc key[`]except`j`q`Q`h`o`u
    }
 
.queryBuilder.getTablePreview:{[datasource]
	ds:-9!"X"$2 cut datasource;
	select [100] from ds
 };

.queryBuilder.getTables:{[]
	tableList: raze (raze k!{@[{ {".",(string y),".",string x}[;x] each tables[`$".",string x] };x;{`}]} each k: key `; string tables `.);
	tableList: tableList where not tableList~\:`;
	([] name: tableList; 
		partition: {$[.Q.qp value x; (first cols value x);0N]} each `$tableList; 
		partitionValues: {$[.Q.qp value x; (.Q.PV);0N]} each `$tableList;
		streaming: {$[(11h=type .u[`t]) and (x in .u[`t]);1b;0b]} each `$tableList
	)
 };

//using decoded x here
.queryBuilder.format:{ r:.dfilt.i.sort x; $[()~last r;-1_ r;r]};

.queryBuilder.formatAndBuildWCl:{[filt]
	if[not count filt;
	  :()
	];
	filt:.queryBuilder.format filt;  // Convert IPC byte string to q

	if[()~filt;
	  :()
	];  // Set to empty

	wCl:.dfilt.i.buildWCl[filt];  // Build where clause
	wCl:$[(&) ~ first[wCl];  // If the top level operator is and (&) we can remove the operator since and is implicit for separate statements in a where clause 
	  1_wCl;
	  enlist wCl
	];

	:wCl
 };

.queryBuilder.join:{[x;y]
	d: x`data;
	jt: d`fn;
	l: $[d`swap; d`right; d`left];
	r: $[d`swap; d`left; d`right];
	dl: $[d`swap; y 1; y 0];
	dr: $[d`swap; y 0; y 1];
	kFn: { $[0=count x; y; x xkey y]};
	/ join to actually support a list of results
	$[jt=`lj; [
			/ Left: left table with any matching keys from the right
			lj[kFn[l;dl];kFn[r;dr]]
		];
		jt=`ij; [
			/ Inner: each row in the left table that matches a row in the right
			ij[kFn[l;dl];kFn[r;dr]]
		];
		jt=`uj; [
			/ Union: Matching records from right table will update left table . 
			/   Unmatched records from both tables are inserted into result     
			 uj[kFn[l;dl];kFn[r;dr]] 
		];
		jt=`aj; [
			/ Asof : "Result is  a table with records from the left-join of the tables. 
			/  In the join, the last value (most recent time) is taken. For each record
			/  in the left table, the result has one record with the items in the left 
			/  table, and if there are matching records in the right table, the items of
			/  the last (in row order) matching record are appended to those of the left 
			/ table; otherwise the remaining columns are null   
			aj[l;kFn[l;dl];kFn[r;dr]]
		];
			jt=`upsert; [
			/ Union: Matching records from right table will update left table . 
			/   Unmatched records from both tables are inserted into result     
			 (kFn[l;dl]) upsert (kFn[r;dr]) 
		];
		jt=`pj; [
			/ A variation on left join. For each matching row, values from the second table
			/ are added to the first table, instead of replacing values from the first table.
			pj[kFn[l;dl];kFn[r;dr]]
		];
		'"Unknown join type"
	]
 };

.queryBuilder.groupOps:`avg`cor`count`cov`dev`first`last`max`med`min`prd`scov`sdev`sum`svar`var`wavg`wsum;

.queryBuilder.processNode:{[i; graph]
	err: "nd",(string i),": ";
	node: .[{(x`nodes) y};(graph;i);{'x,"invald graph or node key - ",y}[err;]];
	t: @[{x`type};node;{'x,"invalid node type - ",y}[err;]];
	if[null t; 'err,"invalid node type"];
	edgeCount: .[{count (x`edges)[y]}; (graph; i);{'x,"invalid edge count - ",y}[err;]];

	/ going to just combine dependencies but 
	res: $[0=edgeCount; enlist 0N;
		{ .queryBuilder.processNode[x; y] }[;graph] each (graph`edges)[i]
	];

	.[{
		$[x=`stream; [
				$[(type y`data) in (98h;99h);y`data;.u.snap[y`data]]
			];
			x=`data; [
				d:y`data;
				$[10=type d; get d;?[d`table; enlist(d`operator; d`type; d`values);0b;()]]
			];
			x=`filter; [
				fDef:y`data;
				distnct:$[0<count fDef`distinct;1b=fDef`distinct;0b];
				?[first z;.queryBuilder.formatAndBuildWCl[fDef`where];distnct;fDef`select]
			];
			x=`groupBy; [
				gDef: y`data;
				gBy: {$[-11h=type x;x;(xbar;"J"$string x`num;$[null x`cast;x`col;($;enlist x`cast;x`col)])]} each gDef`groupBy;
				agg: { $[(x[0]) in y; (value string x[0]),(1_x);'"Unknown agg fn"] }[;.queryBuilder.groupOps] each gDef`agg;
				?[first z; (); gBy; agg]
			];
			x=`join; [
				.queryBuilder.join[y;z]
			];
			x=`function; [
				fnDef: y`data;
				$[not 2=count fnDef; first z; z~enlist 0N;(.api[fnDef 0])[(fnDef 1)];(.api[fnDef 0])[z;(fnDef 1)]]
			];
			x=`update; [
				/ todo this should provide where
				wcl:  .queryBuilder.formatAndBuildWCl[(y`data)`filter];
				up: (y`data)`update;
				tbl: {$[count key [y] inter keys x; 0!x; x]}[first z;up]; /unkey table if updating keyed cols
				![tbl;wcl;0b;{$[10=type x;(#;(#:;`i);enlist enlist x);x]} each up]
			];
			first z
		]
	};(t;node;res);{'x,"invald ",(string y)," node - ",z}[err;t;]]
 };

.queryBuilder.chkType:{$[(t:type x)=0;all .z.s each x;t=98;.z.s flip x;t=99;all .z.s(key x;value x);t=102;x in (and;or;=;in;within);abs[t]<20]};
.queryBuilder.processGraph:{[nid;graph]
	g: -9!"X"$2 cut graph;
	if[not .queryBuilder.chkType[g]; '"invalid query"];
	.queryBuilder.processNode[$[null nid;`result ;nid];g]
 };

.debug.graph:0;
.queryBuilder.processGraph2:{[graph]
	g: -9!"X"$2 cut graph;
	.debug.graph::g;
	if[not .queryBuilder.chkType[g]; '"invalid query"];
	.queryBuilder.processNode[first key g`nodes;g]
 };

/ STREAMING
/ /////////////////////////////////////////////////////////
.qb.tsq:(1#`)!enlist(0#`)!()
.qb.qts:(1#`)!enlist(0#`)!()

.qb.link:{[s;q]
    {.qb.tsq::.[.qb.tsq;(x;y);union;enlist z] }[s 0;;q] each s 1;
    .qb.qts::.[.qb.qts;(q;s 0);union;s 1];
 }

.qb.unlink:{[q]
    .qb.tsq::{except[;y]each x}[;q] each .qb.tsq;
    / if[not count .qb.tsq .(s 0;s 1);.qb.tsq::@[.qb.tsq;k;_;s 1]]
	.qb.qts: .qb.qts _ q;
 }

.queryBuilder.getStreamNodes:{[graphSym]
	nodes: (-9!"X"$2 cut string graphSym)`nodes;
	?[value nodes; enlist (=;`type;enlist `stream);0b;()]`data
 }

.queryBuilder.sub: .u.sub;
.u.sub:{[t;s]
  $[t like "01000000*"; [
    / simplified .u.sub without root table, add qb t to .u.t
    .u.del[t].z.w;
    $[(count .u.w t)>i:.u.w[t;;0]?.z.w;.[`.u.w;(t;i;1);union;`];.u.w[t],:enlist(.z.w;`)];
    .u.t::.u.t union t;
    / link child streams from qb sym to qb sym
    .qb.link[;t] each .queryBuilder.getStreamNodes t;
  ]; .queryBuilder.sub[t;s]];
 }

.queryBuilder.del: .u.del;
.u.del:{
	.queryBuilder.del[x;y];
	/ clean query x from .u.w,.u.t, etc
	if[(x like "01000000*") and 0=count .u.w x; 
		.u.t::.u.t except x;
		.u.w:: x _ .u.w;  
		.qb.unlink[x]];
 }

.queryBuilder.pub: .u.pub;
.u.pub:{[t;x]
	.queryBuilder.pub[t;x];
	/ for each listener subscribed to stream table t
	{[q;t;x]
		/ get interesting syms
		syms: .qb.qts[q;t];

		/ get relevant data
		u: $[all `=syms;x;?[x;enlist (in;`sym;enlist syms);0b;()]];

		if[0<count u; [
			/ recompose graph with inline stream data
			g: (-9!"X"$2 cut string q);
			nodes: g`nodes;
			wh: ((=;`type;enlist `stream);(~;`data;(enlist;enlist $[1<count syms;(t;syms);t,syms])));
			g[`nodes]:(key nodes)! ![value nodes;wh;0b;(enlist `data)!(enlist enlist enlist u)];
			/ publish data and key with q
			.queryBuilder.pub[q;.queryBuilder.processNode[first key nodes;g]];
		]];
	}[;t;x] each distinct raze value .qb.tsq[t];
 }

// is identity function if .u.snap is undefined
.queryBuilder.snap: $[`snap in key .u;.u.snap;{x}];
.u.snap:{[x]
	$[(x 0) like "01000000*";.queryBuilder.processGraph2[string x 0];.queryBuilder.snap[x]]
 }
