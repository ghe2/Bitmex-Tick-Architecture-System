/.utl.require"ws-client";
\l ws-client_0.2.2.q
/\l .env.q
TP_PORT:first "J"$getenv`TP_PORT
h:@[hopen;(`$":localhost:",string TP_PORT;10000);0i]
pub:{$[h=0;
        neg[h](`upd   ;x;y);
        neg[h](`.u.upd;x;value flip y)
        ]}
upd:upsert

.debug.subs:(`$())!();

alchemy_sub:`jsonrpc`id`method!("2.0";2f;"eth_subscribe");
eth_txns_pending:([]time:"p"$();sym:`$();blockHash:();blockNumber:();chainId:();condition:();creates:();from_address:();to_address:();gas:();gasPrice:();hash:();input:();nonce:();publicKey:();r:();raw:();s:();standardV:();transactionIndex:();type_txn:();v:();val:();accessList:();maxFeePerGas:();maxPriorityFeePerGas:());
col_mapping:`from`to`type`value!`from_address`to_address`type_txn`val;

.alchemy.upd:{d:.j.k .debug.x:ssr[x;"null";"\"\""];
    .debug.subs[`$d[`params;`subscription]]:enlist d[`params;`result];
    data:(0#eth_txns_pending) uj {xcol[((c!c),col_mapping) c:cols x;x]} enlist((`time`sym!(.z.p;.z.h)), d[`params;`result]);
    null_cols:exec c from meta[data] where t=" ";
    data:![data;();0b;null_cols!count[null_cols]#enlist ((#;(count;`i);(enlist;"")))];
    pub[`eth_txns_pending;] data;
    };

.alchemy.h:.ws.open[getenv `WEBSOCKET_KEY;`.alchemy.upd];
alchemy_newFullPendingTransactions:.j.j @[alchemy_sub;`params;:;enlist "alchemy_newFullPendingTransactions"]
/alchemy_filteredNewFullPendingTransactions:.j.j @[alchemy_sub;`params;:;("alchemy_filteredNewFullPendingTransactions";enlist[`address]!enlist "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2")]
/newPendingTransactions:.j.j @[alchemy_sub;`params;:;enlist "newPendingTransactions"]

.alchemy.h alchemy_newFullPendingTransactions;

