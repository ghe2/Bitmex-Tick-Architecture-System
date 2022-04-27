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

.bitmex.h:.ws.open["wss://ws.bitmex.com/realtime?subscribe=trade,orderBookL2";`.bitmex.upd];


