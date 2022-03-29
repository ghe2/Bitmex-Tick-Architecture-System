/ quote:([]time:`timespan$();sym:`symbol$();bid:`float$();ask:`float$();
/   bsize:`int$();asize:`int$())
/ trade:([]time:`timespan$();sym:`symbol$();price:`float$();size:`int$());



/ orderbook:([]timestamp:"z"$();symbol:`$();side:`$();price:"f"$();size:"f"$();id:"f"$();action:`$());
/ bitmexbook:([]timestamp:"z"$();symbol:`$();bids:();bidsizes:();asks:();asksizes:());
/ /bitmex_last_book:`bidbook`askbook!(()!();()!());
/ trade: ([]timestamp:"z"$();symbol:`$();side:`$();size:"f"$();price:"f"$();tickDirection:`$();trdMatchID:`$();grossValue:"f"$();homeNotional:"f"$();foreignNotional:"f"$());


orderbook:([]`s#time:"n"$();`g#sym:`$();side:`$();price:"f"$();size:"f"$();id:"f"$();action:`$());
bitmexbook:([]`s#time:"n"$();`g#sym:`$();bids:();bidsizes:();asks:();asksizes:());
/:`bidbook`askbook!(()!();()!());
trade: ([]`s#time:"n"$();`g#sym:`$();side:`$();size:"f"$();price:"f"$();tickDirection:`$();trdMatchID:`$();grossValue:"f"$();homeNotional:"f"$();foreignNotional:"f"$());

