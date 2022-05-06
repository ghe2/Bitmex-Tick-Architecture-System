.utl.require"ws-client";

TP_PORT:first "J"$getenv`TP_PORT;
h:@[hopen;(`$":localhost:",string TP_PORT;10000);0i];
pub:{$[h=0;
        neg[h](`upd   ;x;y);
        neg[h](`.u.upd;x;value flip y)
        ]};

upd:upsert;

//Initialise displaying tables
bitfinexOrder: ([]`s#time:"n"$();`g#sym:`$();side:`$();chanelID:"j"$();orderID:"j"$();price:"f"$();amount:"f"$());
bitfinexBook: ([]`s#time:"n"$();`g#sym:`$();bids:();bidsizes:();asks:();asksizes:());
bitfinex_last_book_sym:enlist[`]!enlist `bidbook`askbook!(()!();()!());
heartBeatCheck:([]`s#time:"p"$();chanelID:"j"$());

bitfinex_bookerbuilder:{[x;y]
    .debug.xy:(x;y);
    $[not y 0;x;
        //when PRICE > 0 then you have to add or update the order
        $[0<y 2;
            $[(y 1) in key x;
              [x:.[x;(y 1;0);:;y 2]; .[x;(y 1;1);:;y 3]];
              x,enlist[y 1]! enlist y 2 3
              ];
          //when PRICE = 0 then you have to delete the order
          0~y 2;
            (y 1) _ x;
            x
            ]
        ]
    };

.bitfinex.upd:{
    d:.j.k x;.debug.d:d; // 0N!d;

    //capture the subscription sym
    if[(99h~type d);
      targetKey:`event`channel`chanId`symbol`prec`freq`len`pair;
      if[targetKey~key d;
        .debug.subInfo:d;
        .bitfinex.subSym:`$d[`pair]
      ];
      :()
    ];

    //order events 
    if[(3~count d[1]) and 9h~type d[1];
      .bitfinex.newOrder: .z.n,.bitfinex.subSym,$[0<rd[3];`bid;`ask],("j"$rd[til 2]), abs 2_rd:raze d;

      //publish the orderbook
      pub[`bitfinexOrder;.bitfinex.newOrder]
      ];
      
    //Heartbeating connection check
    //Every 15 seconds, the Websocket server will send you a heartbeat message in this format.
    if[(10h~type d[1]); 
      if[d[1] like "hb";pub[`heartBeatCheck;(.z.p,"j"$d[0])]]
      ];

    //create book based on the last book state 
    //Trading: if AMOUNT > 0 then bid else ask; Funding: if AMOUNT < 0 then bid else ask;
    order: enlist(cols bitfinexOrder)!.bitfinex.newOrder; 
    books:update bidbook:bitfinex_bookerbuilder\[bitfinex_last_book_sym[first sym]`bidbook;flip(side like "bid";orderID;price;amount)],askbook:bitfinex_bookerbuilder\[bitfinex_last_book_sym[first sym]`askbook;flip(side like "ask";orderID;price;amount)] by sym from order;
    
    // store the latest book state
    .debug.books1:books;
    bitfinex_last_book_sym,:exec last bidbook,last askbook by sym from books;
    
    books:select time,sym,bids:(value each bidbook)[;;0],bidsizes:(value each bidbook)[;;1],asks:(value each askbook)[;;0],asksizes:(value each askbook)[;;1] from books;
    books:update bids:desc each distinct each bids,bidsizes:{sum each x group y}'[bidsizes;bids] @' desc each distinct each bids,asks:asc each distinct each asks,asksizes:{sum each x group y}'[asksizes;asks] @' asc each distinct each asks from books;
    .debug.books2:books;

    //publish to TP - bitfinexBook
    pub[`bitfinexBook;books]
};

//if the last hearbeat is more than 15 mins from now, reconnect
wsConnectAndCheck:{[]
    if [(0~count heartBeatCheck) or 0D00:15:00 <.z.p - exec max time from heartBeatCheck;
         0N!"Not connected!.. Reconnecting at ",string .z.z;
        .bitfinex.h:.ws.open["wss://api-pub.bitfinex.com/ws/2";`.bitfinex.upd];
        .bitfinex.h .j.j `event`channel`pair`prec!("subscribe";"book";"tBTCUSD";"R0")
  ];
}

//Establish the ws connection 
wsConnectAndCheck[];

.z.ts:{
  wsConnectAndCheck[];
}

//set the timer on for every 15 seconds
\t 15000


