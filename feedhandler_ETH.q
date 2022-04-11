/.utl.require"ws-client";
\l ws-client_0.2.2.q

TP_PORT:first "J"$getenv`TP_PORT
h:@[hopen;(`$":localhost:",string TP_PORT;10000);0i]

pub:{$[h=0;
        neg[h](`upd   ;x;y);
        neg[h](`.u.upd;x;y)
        ]};

upd:upsert;
string_to_byte:{"X"$2 cut 2_x};

.debug.subs:(`$())!();

alchemy_sub:`jsonrpc`id`method!("2.0";2f;"eth_subscribe");
eth_txns_pending:([]time:"p"$();sym:`$();blockHash:();blockNumber:();chainId:();condition:();creates:();from_address:();to_address:();gas:();gasPrice:();hash:();input:();nonce:();publicKey:();r:();raw:();s:();standardV:();transactionIndex:();type_txn:();v:();val:();accessList:();maxFeePerGas:();maxPriorityFeePerGas:());
col_mapping:`from`to`type`value!`from_address`to_address`type_txn`val;
defaults:`time`sym`blockHash`blockNumber`chainId`condition`creates`from_address`to_address`gas`gasPrice`hash`input`nonce`publicKey`r`raw`s`standardV`transactionIndex`type_txn`v`val`accessList`maxFeePerGas`maxPriorityFeePerGas!(0np;`;"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"";"");

.alchemy.upd:{d:.j.k .debug.x:ssr[x;"null";"\"\""];
    // capture the debug variables for all incoming subscriptions
    .debug.subs[`$d[`params;`subscription]]:enlist d[`params;`result];
    // collect the values, append defaults for missing values
    txn_dictionary:defaults,(`time`sym!(.z.p;.z.h)),d[`params;`result];
    // map some column names
    txn_dictionary:key[col_mapping] _ @[txn_dictionary;value col_mapping;:;txn_dictionary key col_mapping];
    // convert to byte lists
    //txn_dictionary:@[txn_dictionary;key[txn_dictionary] except `time`sym;string_to_byte];
    // publish data as lists
    pub[`eth_txns_pending;] .debug.pub:txn_dictionary cols eth_txns_pending;

    };

.alchemy.h:.ws.open[getenv `WEBSOCKET_KEY;`.alchemy.upd];
alchemy_newFullPendingTransactions:.j.j @[alchemy_sub;`params;:;enlist "alchemy_newFullPendingTransactions"];
//alchemy_filteredNewFullPendingTransactions:.j.j @[alchemy_sub;`params;:;("alchemy_filteredNewFullPendingTransactions";enlist[`address]!enlist "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2")]
//newPendingTransactions:.j.j @[alchemy_sub;`params;:;enlist "newPendingTransactions"]

.alchemy.h alchemy_newFullPendingTransactions;