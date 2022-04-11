/connect to tickerplant, if it doesn't exist just publish data locally for insertion
TP_PORT:first "J"$getenv`TP_PORT;
h:@[hopen;(`$":localhost:",string TP_PORT;10000);0i];
pub:{$[h=0;
        neg[h](`upd   ;x;y);
        neg[h](`.u.upd;x;value flip y)
        ]};

upd:upsert;

/\l ws-client_0.2.2.q
/conda install -c jmcmurray ws-client ws-server
.utl.require"ws-client";

/Initialise displaying tables
orderbook:([]`s#time:"p"$();`g#sym:`$();side:`$();price:"f"$();size:"f"$();id:"f"$();action:`$());
bitmexbook:([]`s#time:"p"$();`g#sym:`$();bids:();bidsizes:();asks:();asksizes:());
bitmex_last_book:`bidbook`askbook!(()!();()!());
bitmex_last_book_sym:enlist[`]!enlist `bidbook`askbook!(()!();()!());
trade: ([]time:`s#"p"$();`g#sym:`$();side:`$();size:"f"$();price:"f"$();tickDirection:`$();trdMatchID:`$();grossValue:"f"$();homeNotional:"f"$();foreignNotional:"f"$());

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

vwap_depth:{$[any z<=s:sums x;(deltas z & s) wavg y;0nf]};
.bitmex.upd:{
    d:.j.k x;.debug.d:d; // 0N!d;
    if[d[`table] like "orderBookL2";
        $[d[`action] like "insert";
            [.debug.i:d;new:select time:"p"$"Z"$timestamp,sym:`$symbol,`$side,price,size,id,action:`insert from d`data];
          d[`action] like "update";
            [.debug.u:d;new:select time:"p"$"Z"$timestamp,sym:`$symbol,`$side,price:0nf,size,id,action:`update from d`data];
          d[`action] like "delete";
            [.debug.e:d;new:select time:"p"$"Z"$timestamp,sym:`$symbol,`$side,price:0n,size:0n,id,action:`delete from d`data];
          d[`action] like "partial";
            [.debug.p:d;new:select time:"p"$"Z"$timestamp,sym:`$symbol,`$side,price:0n,size:0n,id,action:`partial from d`data];
                .debug.a:d;
            ];
        // debug variable to see new records
        .debug.new:new;
        //publish to TP - orderbook
        pub[`orderbook;new];

        // create the books based on the last book state
        /books:update bidbook:bitmex_bookerbuilder\[bitmex_last_book`bidbook;flip (side like "Buy";id;price;size;action)],askbook:bitmex_bookerbuilder\[bitmex_last_book`askbook;flip (side like "Sell";id;price;size;action)] from new;
        books:update bidbook:bitmex_bookerbuilder\[bitmex_last_book_sym[first sym]`bidbook;flip (side like "Buy";id;price;size;action)],askbook:bitmex_bookerbuilder\[bitmex_last_book_sym[first sym]`askbook;flip (side like "Sell";id;price;size;action)] by sym from new;
        // store the latest book state
        .debug.books1:books;
        bitmex_last_book_sym,:exec last bidbook,last askbook by sym from books;
        /bitmex_last_book::exec last bidbook,last askbook from books;
        books:select time,sym,bids:(value each bidbook)[;;0],bidsizes:(value each bidbook)[;;1],asks:(value each askbook)[;;0],asksizes:(value each askbook)[;;1] from books;
        books:update bids:desc each bids,bidsizes:bidsizes @' idesc each bids,asks:asc each asks,asksizes:asksizes @' iasc each asks from books;
        .debug.books2:books;
        //publish to TP - bitmexbook
        pub[`bitmexbook;books];
        ];

    if[d[`table] like "trade";
        $[d[`action] like "insert";
            [.debug.trade.i:d;newTrade:select time:"p"$"Z"$timestamp,sym:`$symbol,`$side,"f"$size,price,`$tickDirection,`$trdMatchID,"f"$grossValue,"f"$homeNotional,"f"$foreignNotional from d`data;
              .debug.newTrade:newTrade;
              pub[`trade;newTrade]
              ];
          d[`action] like "partial";
            .debug.trade.p:d;
            .debug.trade.a:d;
        ];
    ];
    };

.bitmex.h:.ws.open["wss://ws.bitmex.com/realtime?subscribe=trade,orderBookL2";`.bitmex.upd];
/.bitmex.h:.ws.open["wss://ws.bitmex.com/realtime?subscribe=trade,orderBookL2:XBTUSD";`.bitmex.upd];
