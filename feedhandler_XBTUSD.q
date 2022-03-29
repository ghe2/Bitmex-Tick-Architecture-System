/connect to tickerplant
h:neg hopen `:localhost:5000

/conda install -c jmcmurray ws-client ws-server
.utl.require"ws-client";

/Initialise displaying tables 
orderbook:([]`s#time:"n"$();`g#sym:`$();side:`$();price:"f"$();size:"f"$();id:"f"$();action:`$());
bitmexbook:([]`s#time:"n"$();`g#sym:`$();bids:();bidsizes:();asks:();asksizes:());
bitmex_last_book:`bidbook`askbook!(()!();()!());
trade: ([]time:`s#"n"$();`g#sym:`$();side:`$();size:"f"$();price:"f"$();tickDirection:`$();trdMatchID:`$();grossValue:"f"$();homeNotional:"f"$();foreignNotional:"f"$());

bitmex_bookerbuilder:{[x;y] 
    .debug.xy:(x;y);
    $[not y 0;x;
        $[`insert=y 4;    
            x,enlist[y 1]! enlist y 2 3;
          `update=y 4;    
            $[(y 1) in x;.[x;(y 1;1);:;y 3];x];
          `delete=y 4;
            (y 1) _ x;
            x
            ]
        ]
    };


.bitmex.upd:{   
    d:.j.k x;.debug.d:d; 0N!d;
    if[d[`table] like "orderBookL2";  
        $[d[`action] like "insert";
            [`orderbook upsert new:select time:"n"$"Z"$timestamp,sym:`$symbol,`$side,price,size,id,action:`insert from d`data];   
          d[`action] like "update";            
                [.debug.u:d;`orderbook upsert new:select time:"n"$"Z"$timestamp,sym:`$symbol,`$side,price:0nf,size,id,action:`update from d`data];
          d[`action] like "delete";            
                [.debug.e:d;`orderbook upsert new:select time:"n"$"Z"$timestamp,sym:`$symbol,`$side,price:0n,size:0n,id,action:`delete from d`data];
          d[`action] like "partial";
                [.debug.p:d;`orderbook upsert new:select time:"n"$"Z"$timestamp,sym:`$symbol,`$side,price:0n,size:0n,id,action:`partial from d`data];
                .debug.a:d;
            ];
            
        //publish to TP - orderbook
        h(".u.upd";`orderbook;value flip new);

        .debug.new:new;
        // create the books based on the last book state
        books:update bidbook:bitmex_bookerbuilder\[bitmex_last_book`bidbook;flip (side like "Buy";id;price;size;action)],askbook:bitmex_bookerbuilder\[bitmex_last_book`askbook;flip (side like "Sell";id;price;size;action)] from new;
        // store the latest book state
        bitmex_last_book::exec last bidbook,last askbook from books;
        books:select time,sym,bids:(value each bidbook)[;;0],bidsizes:(value each bidbook)[;;1],asks:(value each askbook)[;;0],asksizes:(value each askbook)[;;1] from books;
        books:update bids:desc each bids,bidsizes:bidsizes @' idesc each bids,asks:asc each asks,asksizes:asksizes @' iasc each asks from books;
        `bitmexbook upsert books;
        .debug.books:books;
         
        //publish to TP - bitmexbook
        h(".u.upd";`bitmexbook;value flip books);
        ];
    
    if[d[`table] like "trade";
        $[d[`action] like "insert";
            [.debug.trade.i:d;`trade upsert newTrade:select time:"n"$"Z"$timestamp,sym:`$symbol,`$side,"f"$size,price,`$tickDirection,`$trdMatchID,"f"$grossValue,"f"$homeNotional,"f"$foreignNotional from d`data;
              .debug.newTrade:newTrade;
              h(".u.upd";`trade;value flip newTrade)
              ];
          d[`action] like "partial";
            [.debug.trade.p:d];
            .debug.trade:d;
        ];
    ];
    };


//instrument
/ table | "instrument"
/ action| "update"
/ data  | +`symbol`lastPriceProtected`timestamp!(,"LUNAUSD";,85.883;,"2022-03-18T04:49:16.684Z")

/ table | "instrument"
/ action| "update"
/ data  | +`symbol`lastPrice`lastTickDirection`timestamp`lastChangePcnt!(,"ETHUSDH22";,2802.5;,"PlusTick";,"2022-03-18T04:58:08.424Z";,0.001)

/ table | "instrument"
/ action| "update"
/ data  | +`symbol`fairPrice`fairBasis`lastPriceProtected`markPrice`openValue`timestamp`indicativeSettlePrice!(,"XBTUSDTU22";,41498.09;,873.89;,41779.5;,41498.09;,1.755369e+010;,"2022-03-18T04:58:25...

/ table | "instrument"
/ action| "update"
/ data  | +`symbol`openInterest`openValue`timestamp!(,"ETHUSD";,1033609f;,2.875531e+011;,"2022-03-18T04:58:30.000Z")

/ table | "instrument"
/ action| "update"
/ data  | +`symbol`fairPrice`fairBasis`markPrice`openValue`timestamp`fairBasisRate!(,"XBTUSDTH22";,40637.78;,8.12;,40637.78;,1.25904e+012;,"2022-03-18T04:58:55.000Z";,0.01)

//trade
/ table | "trade"
/ action| "insert"
/ data  | +`timestamp`symbol`side`size`price`tickDirection`trdMatchID`grossValue`homeNotional`foreignNotional!(("2022-03-18T05:01:50.480Z";"2022-03-18T05:01:50.480Z");("XBTUSD";"XBTUSD");("Sell";"Sel..

.bitmex.h:.ws.open["wss://ws.bitmex.com/realtime?subscribe=trade,orderBookL2";`.bitmex.upd];
/.bitmex.h:.ws.open["wss://ws.bitmex.com/realtime?subscribe=instrument";`.bitmex.upd]; 
/.bitmex.h:.ws.open["wss://ws.bitmex.com/realtime?subscribe=trade";`.bitmex.upd]; 



// defind the upd function 
/.z.ws:{value .j.k x};

/insert
/orderbook:`symbol`id`side`size`price`timestamp

/delete
/symbol`id`side`timestamp

/update
/orderbook: `symbol`id`side`size`timestamp


/trade:([]time:`timespan$();sym:`symbol$();price:`float$();size:`int$());

/orderbook:([]timestamp:"z"$();symbol:`$();side:`$();price:"f"$();size:"f"$();id:"f"$());
/orderbook:([]timestamp:"z"$();symbol:`$();side:`$();price:"f"$();size:"f"$();id:"f"$());
/book:([]timestamp:"z"$();symbol:`$();buybook:();sellbook:());
/book:(enlist ())!enlist (`float$())!();

/ .z.ws:{   
/     d:.j.k x;.debug.d:d;0N!d;
/     if[d[`table] like "orderBookL2_25";  
/         if[d[`action] like "insert";
/             .debug.i:d;
/         /`orderbook upsert select "Z"$timestamp,`$symbol,`$side,price,size,id from d`data;
/         `trade upsert select time:`timespan$"Z"$timestamp,sym:`$symbol,price,`int$size from d`data;
/            / @[`book;key obd;,;value obd:exec id!flip(size; price) by side from d`data]
/             ] ;
/         /if[d[`action] like "update";
/         /    .debug.u:d;
/         /`orderbook upsert select "Z"$timestamp,`$symbol,price:0nf,`$side,size,id from d`data;   
/         /.[`book;(key obd;raze key each value obd;0);:;value each value obd:obd:exec id!size by side from d`data]
/         /    ];
/         ];
/     };


/ /temp for testing - working fine
/ .z.ws:{
/     d:.j.k x;.debug.d:d;0N!d;
/    if[d[`action] like "insert";
/         .debug.i:d;
/         `trade upsert select time:`timespan$"Z"$timestamp,sym:`$symbol,price,`int$size from d`data];

/   };

/meta trade
/.debug.i`data
/meta .debug.i`data
/select time:`timespan$"Z"$timestamp,sym:`$symbol,price,size from .debug.i`data


// open the websocket conection
/.bitmex.h:.ws.open["wss://ws.bitmex.com/realtime?subscribe=instrument,orderBookL2_25:XBTUSD";`.z.ws];


/ //pub to tp
/ .z.ts:{
/     h(".u.upd";`orderbook;-1#orderbook);
/     h(".u.upd";`bitmexbook;-1#bitmexbook);
/     /h(".u.upd";`bitmex_last_book;bitmex_last_book);
/     h(".u.upd";`trade;-1#trade);

/   };
/ /trigger timer every 100ms
/ \t 100



//track changes
// subs table to keep track of current subscriptions
//subs:2!flip `handle`func`params`curData!"is**"$\:();

//subscribe to something
//sub:{`subs upsert(.z.w;x;enlist y)};

//publish data according to subs table
/pub:{
/    row:(0!subs)[x];
/    (neg row[`handle]) .j.j (value row[`func])[row[`params]]
/  }
// trigger refresh every 1000ms
/.z.ts:{pub each til count subs}
/\t 1000






