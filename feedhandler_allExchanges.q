.utl.require"ws-client";

TP_PORT:first "J"$getenv`TP_PORT;
h:@[hopen;(`$":localhost:",string TP_PORT;10000);0i];
pub:{$[h=0;
        neg[h](`upd   ;x;y);
        neg[h](`.u.upd;x;value flip y)
        ]};

upd:upsert;

//initialise displaying tables
order: ([]`s#time:"p"$();`g#sym:`$();orderID:();side:`$();price:"f"$();size:"f"$();action:`$();orderType:`$();exchange:`$());
book: ([]`s#time:"p"$();`g#sym:`$();bids:();bidsizes:();asks:();asksizes:());
lastBookBySym:enlist[`]!enlist `bidbook`askbook!(()!();()!());
trade: ([]`s#time:"p"$();`g#sym:`$();orderID:();price:"f"$();tradeID:();side:`$();size:"f"$();exchange:`$());
connChkTbl:([]exchange:`$();`s#time:"p"$();feed:`$();rowCount:"j"$());

BuySellDict:("Buy";"Sell")!(`bid;`ask);
sideDict:0 1 2f!`unknown`bid`ask;
actionDict:0 1 2 3 4f!`unknown`skip`insert`remove`update;
orderTypeDict:0 1 2f!`unknown`limitOrder`marketOrder;
gdaExchgTopic:([]
    topic:(`bitfinex;`bybit;`coinbase;`ftx;`huobi;`kraken;`dydx);
    symbol:`BTCUSD`BTCUSD`BTCUSD`BTCUSD`BTCUSD`BTCUSD`BTCUSD);

//create the ws subscription table
hostsToConnect:([]hostQuery:();request:();exchange:`$();feed:`$();callbackFunc:());
//add all exchanges from gda
`hostsToConnect upsert {("ws://194.233.73.248:30205/";`op`exchange`feed!("subscribe";x;"normalised");x;`order;`.gdaNormalised.updExchg)}each exec topic from gdaExchgTopic;
`hostsToConnect upsert {("ws://194.233.73.248:30205/";`op`exchange`feed!("subscribe";x;"trades");x;`trade;`.gdaTrades.updExchg)}each exec topic from gdaExchgTopic;
//add BitMEX websocket 
`hostsToConnect upsert("wss://ws.bitmex.com/realtime";`op`args!("subscribe";"orderBookL2_25");`bitmex;`order;`.bitmex.upd);
`hostsToConnect upsert("wss://ws.bitmex.com/realtime";`op`args!("subscribe";"trade");`bitmex;`trade;`.bitmex.upd);
//add BITFINEX websocket
`hostsToConnect upsert("wss://api-pub.bitfinex.com/ws/2";`event`channel`pair`prec!("subscribe";"book";"tETHUSD";"R0");`bitfinex;`order;`.bitfinex.order.upd);
`hostsToConnect upsert("wss://api-pub.bitfinex.com/ws/2";`event`channel`pair`prec!("subscribe";"trades";"tETHUSD";"R0");`bitfinex;`trade;`.bitfinex.trade.upd);
//add record ID
hostsToConnect: update ws:1+til count i from hostsToConnect;
hostsToConnect:update callbackFunc:{` sv x} each `$string(callbackFunc,'ws) from hostsToConnect where callbackFunc like "*gda*";

bookbuilder:{[x;y]
    .debug.xy:(x;y);
    $[not y 0;x;
        $[
            `insert=y 4;
                x,enlist[y 1]! enlist y 2 3;
            `update=y 4;
                $[any (y 1) in key x;
                    [
                        //update size
                        a:.[x;(y 1;1);:;y 3];
                        //update price if the price col is not null
                        $[0n<>y 2;.[a;(y 1;0);:;y 2];a]
                    ];
                    x,enlist[y 1]! enlist y 2 3
                ];  
            `remove=y 4;
                $[any (y 1) in key x;
                    enlist[y 1] _ x;
                    x];
            x
        ]
    ]
    };

generateOrderbook:{[newOrder]
    .debug.newOrder:newOrder;

    //create the books based on the last book state
    books:update bidbook:bookbuilder\[lastBookBySym[first sym]`bidbook;flip (side like "bid";orderID;price;size;action)],askbook:bookbuilder\[lastBookBySym[first sym]`askbook;flip (side like "ask";orderID;price;size;action)] by sym from newOrder;

    //store the latest book state
    .debug.books1:books;
    lastBookBySym,:exec last bidbook,last askbook by sym from books;

    //generate the orderbook 
    books:select time,sym,bids:(value each bidbook)[;;0],bidsizes:(value each bidbook)[;;1],asks:(value each askbook)[;;0],asksizes:(value each askbook)[;;1] from books;
    books:update bids:desc each distinct each bids,bidsizes:{sum each x group y}'[bidsizes;bids] @' desc each distinct each bids,asks:asc each distinct each asks,asksizes:{sum each x group y}'[asksizes;asks] @' asc each distinct each asks from books

    };

//GDA orderbooks callback function 
.gdaNormalised.upd:{[incoming;exchange]
    d:.j.k incoming;.debug.gda.d:d; //0N!d;
    .debug.ordExchange:exchange;
    
    //capture the subscription sym
    if[`event`topic~key d;
        .debug.sub:d;
        .gdaNormalised.exchange: `$first "-" vs d[`topic];
        .gdaNormalised.subSym:first exec symbol from gdaExchgTopic where topic=.gdaNormalised.exchange;
        :()
    ];

    colVal: value d;
    newOrder:();

    //set the receive timestamp as the time if the event timestamp is empty
    timeCol: $[-1f~colVal[8];colVal[10];colVal[8]];

    //check the orderID data type, convert it to string if it's an int orderID
    orderIdCol:$[10h<>type colVal[2];string "j"$colVal[2];colVal[2]];
    
    if[10h~type d[`event_timestamp];
        /coinbase
        newOrder:((.z.d+"N"$(last "T" vs timeCol)[til 15]);.gdaNormalised.subSym;orderIdCol;sideDict colVal[4];colVal[5];colVal[6];actionDict colVal[7];orderTypeDict colVal[11];exchange)
    ];

    if[-9h~type d[`event_timestamp];   
        /bitfinex,bybit,ftx,huobi,kraken
        /convert currentTimeMillis to timestamp
        f:{`datetime$(x%(prd 24 60 60 1000j))-(0-1970.01.01)};
        newOrder:($[.z.p<t:("p"$f timeCol);.z.p;t];.gdaNormalised.subSym;orderIdCol;sideDict colVal[4];colVal[5];colVal[6];actionDict colVal[7];orderTypeDict colVal[11];exchange)
    ];

    //publish the order table
    pub[`order;newOrder];

    neworderTbl: enlist(cols order)!newOrder;
    .debug.gda.order:neworderTbl;
    
    //generate orderbook based on the order transactions
    books:generateOrderbook[neworderTbl];
    .debug.gda.books2:books;

    //publish to TP - Book
    pub[`book;books];
    };

//GDA trades callback function 
.gdaTrades.upd:{[incoming;exchange]
    d:.j.k incoming;.debug.gda.dt:d; //0N!d;
    .debug.trdExchange:exchange;

    //capture the subscription sym
    if[`event`topic~key d;
        .debug.subt:d;
        .gdaTrades.exchange: `$first "-" vs d[`topic];
        .gdaTrades.subSym:first exec symbol from gdaExchgTopic where topic=.gdaTrades.exchange;
        :()
    ];

    colVal: value d;
    newTrade:();

    if[10h~type d[`timestamp];
        /coinbase
        newTrade: ((.z.d+"N"$(last "T" vs colVal[3])[til 15]);.gdaTrades.subSym;($[10h<>type colVal[0];string "j"$colVal[0];colVal[0]]);colVal[1];($[10h<>type colVal[2];string "j"$colVal[2];colVal[2]]);sideDict colVal[4];colVal[5];exchange)
    ];
 
    if[-9h~type d[`timestamp];   
        /bitfinex,bybit,ftx,huobi,kraken,dydx
        //convert currentTimeMillis to timestamp
        f:{`datetime$(x%(prd 24 60 60 1000j))-(0-1970.01.01)};
        newTrade: ($[(t<.z.p-1D) or .z.p<t:"p"$f colVal[3];.z.p;t];.gdaTrades.subSym;($[10h<>type colVal[0];string "j"$colVal[0];colVal[0]]);colVal[1];($[10h<>type colVal[2];string "j"$colVal[2];colVal[2]]);sideDict colVal[4];colVal[5];exchange)
    ];

    .debug.gda.trade:newTrade;

    //publish the trades table
    pub[`trade;newTrade];
    };

//bitmex trades and orders callback function 
.bitmex.upd:{
    d:.j.k x;.debug.bitmex.d:d; //0N!d;
    if[`table`action`data ~ key d;
      if[d[`table] like "orderBookL2*";
          $[d[`action] like "insert";
              [.debug.bitmex.i:d;new:select time:"p"$"Z"$timestamp,sym:`$symbol,orderID:string "j"$id,side:BuySellDict[side],price,size,action:`insert,orderType:`unknown,exchange:`bitmex from d`data];
            d[`action] like "update";
              [.debug.bitmex.u:d;new:select time:"p"$"Z"$timestamp,sym:`$symbol,orderID:string "j"$id,side:BuySellDict[side],price:0nf,size,action:`update,orderType:`unknown,exchange:`bitmex from d`data];
            d[`action] like "delete";
              [.debug.bitmex.e:d;new:select time:"p"$"Z"$timestamp,sym:`$symbol,orderID:string "j"$id,side:BuySellDict[side],price:0n,size:0n,action:`remove,orderType:`unknown,exchange:`bitmex from d`data];
            d[`action] like "partial";
              [.debug.bitmex.p:d;new:select time:"p"$"Z"$timestamp,sym:`$symbol,orderID:string "j"$id,side:BuySellDict[side],price:0n,size:0n,action:`partial,orderType:`unknown,exchange:`bitmex from d`data];
                  .debug.bitmex.a:d;
              ];

          //debug variable to see new records
          .debug.bitmex.new:new;
          
          //publish to TP - order table
          pub[`order;new];
         
          //generate orderbook based on the order transactions
          books:generateOrderbook[new];
          .debug.bitmex.books2:books;

          //publish to TP - book table
          pub[`book;books];
          ];

      if[d[`table] like "trade";
          $[d[`action] like "insert";
              [.debug.bitmex.trade.i:d;
                newTrade:select time:"p"$"Z"$timestamp,sym:`$symbol,orderID:" ",price,tradeID:trdMatchID,side:BuySellDict[side],"f"$size,exchange:`bitmex from d`data;
                .debug.bitmex.newTrade:newTrade;
                pub[`trade;newTrade]
                ];
            d[`action] like "partial";
              .debug.bitmex.trade.p:d;
              .debug.bitmex.trade.a:d;
          ];
      ]
    ];
  };

//Bitfinex order books callback function 
.bitfinex.order.upd:{
    d:.j.k x;.debug.bitfinex.d:d; //0N!d;

    //capture the subscription sym
    if[(99h~type d);
        targetKey:`event`channel`chanId`symbol`prec`freq`len`pair;
        if[targetKey~key d;
            .debug.bitfinex.ordSubInfo:d;
            .bitfinex.ordSubSym:`$d[`pair]
        ];
        :()
    ];

    //order events 
    if[(3~count d[1]) and 2~count d;
        .debug.bitfinex.order:d;

        //if AMOUNT > 0 then bid else ask; Funding: if AMOUNT < 0 then bid else ask
        //when PRICE > 0 then you have to add or update the order
        //when PRICE = 0 then you have to delete the order
        rd:raze d;
        newOrder:(.z.p;.bitfinex.ordSubSym;(string "j"$rd[1]);$[0<rd[3];`bid;`ask];abs "f"$rd[2];abs "f"$rd[3];$[0<rd[2];`update;`remove];`unknown;`bitfinex);

        //publish to TP - order table
        pub[`order;newOrder];

         //create book based on the last book state 
        neworderTbl: enlist(cols order)!newOrder; 
    
        //generate orderbook based on the order transactions
        books:generateOrderbook[neworderTbl];
        .debug.bitfinex.books2:books;

        //publish to TP - book table
        pub[`book;books]
    ];
      
    };

//Bitfinex trades callback function 
.bitfinex.trade.upd:{
    d:.j.k x;.debug.bitfinex.dt:d; //0N!d;

    //capture the subscription sym
    if[(99h~type d);
        targetKey:`event`channel`chanId`symbol`pair;
        if[targetKey~key d;
            .debug.bitfinex.trdSubInfo:d;
            .bitfinex.trdSubSym:`$d[`pair]
        ];
        :()
    ];

    //trade transactions
    if[(4~count d[2]) and 3~count d;
        .debug.bitfinex.trade:d;
        newTrade:(.z.p;.bitfinex.trdSubSym;" ";"f"$d[2][3];string "j"$d[2][0];$[0<d[2][2];`bid;`ask]; abs "f"$d[2][2];`bitfinex);

        //publish to TP - trade table
        pub[`trade;newTrade]
    ];
    };

//establish the ws connection
establishWS:{
    .debug.x:x;
    hostQuery:x[`hostQuery];
    request:x[`request];
    callbackFunc:x[`callbackFunc];

    //pass the exchange value to the gda upd func
    if[request[`feed] like "normalised";
        callbackFunc set .gdaNormalised.upd[;request[`exchange]]
    ];

    if[request[`feed] like "trades";
        callbackFunc set .gdaTrades.upd[;request[`exchange]]
    ];

    currentExchange:$[`op`exchange`feed~key request;string request[`exchange];string (` vs callbackFunc)[1]];
    currentFeed:$[`op`exchange`feed~key request;request[`feed];$["" like request[`channel];request[`args];request[`channel]]];

    //connect to the websocket
    0N!"Connecting the ",currentExchange," ",currentFeed," websocket at ",string .z.z;
    handle: `$".ws.h",string x[`ws];
    handle set .ws.open[hostQuery;callbackFunc];

    //send request to the websocket
    if[0<count request; (get handle) .j.j request];
    0N!currentExchange," ",currentFeed," websocket is connected at ",string .z.z;
    };

//open the websocket and check the connection status 
connectionCheck:{[]
    0N!"Checking the websocket connection status"; 
    upsert[`connChkTbl;(0!select time:.z.p,feed:`order,rowCount:count i by exchange from order)];
    upsert[`connChkTbl;(0!select time:.z.p,feed:`trade,rowCount:count i by exchange from trade)];

    //check the gdaOrder and gdaTrades tables count by 10 mins time bucket 
    temp:select secondLastCount:{x[-2+count x]}rowCount,lastCount:last rowCount by timeBucket:10 xbar time.minute,feed,exchange from connChkTbl;
    recordchk:update diff:lastCount-secondLastCount from select last secondLastCount, last lastCount by feed,exchange from temp;
    reconnectList:select from recordchk where diff = 0;

    if[0<count reconnectList;
        feedList: exec feed from reconnectList;
        exchangeList: exec exchange from reconnectList;
        hostToReconnect:select from hostsToConnect where feed in feedList,exchange in exchangeList;
        {0N!x[0]," ",x[1]," WS Not connected!.. Reconnecting at ",string .z.z}each string (exec exchange from hostToReconnect),'(exec feed from hostToReconnect);
        establishWS each hostToReconnect
            
    ];
    
    if[0~count reconnectList;
        0N!"Websocket connections are all secure"
    ];
    };

//connect to the websockets
establishWS each hostsToConnect;
 
//connection check every 10 min
.z.ts:{connectionCheck[]};
\t 600000
