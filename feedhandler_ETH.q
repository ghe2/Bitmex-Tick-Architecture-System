.utl.require"ws-client";
/\l ws-client_0.2.2.q;
\l .env.q;

.debug.subs:(`$())!();
alchemy_sub:`jsonrpc`id`method!("2.0";2f;"eth_subscribe");
eth_txns:([]time:"p"$();hostName:`$();result:());

eth_txns_flat:();
.alchemy.upd:{show .debug.x:d:.j.k x;
    .debug.subs[`$d[`params;`subscription]]:enlist d[`params;`result];
    `eth_txns upsert (.z.p;.z.h;d[`params;`result]);
    eth_txns_flat::eth_txns_flat uj enlist((`time`hostName!(.z.p;.z.h)),d[`params;`result]);
    };

.alchemy.h:.ws.open[getenv `WEBSOCKET_KEY;`.alchemy.upd];
alchemy_newFullPendingTransactions:.j.j @[alchemy_sub;`params;:;enlist "alchemy_newFullPendingTransactions"]
alchemy_filteredNewFullPendingTransactions:.j.j @[alchemy_sub;`params;:;("alchemy_filteredNewFullPendingTransactions";enlist[`address]!enlist "0x6B3595068778DD592e39A122f4f5a5cF09C90fE2")]
newPendingTransactions:.j.j @[alchemy_sub;`params;:;enlist "newPendingTransactions"]

.alchemy.h alchemy_newFullPendingTransactions;