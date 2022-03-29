# kdb+tick

Files previously at code.kx.com/wsvn/kx/kdb+tick


## Hot-linking

You are welcome to download and use this code according to the terms of the licence. 

Kx Systems recommends you do not link your application to this repository, 
which would expose your application to various risks:

- This is not a high-availability hosting service
- Updates to the repo may break your application 
- Code refactoring might return 404s to your application

Instead, download code and subject it to the version control and regression testing 
you use for your application.

## BitMEX websocket 
BitMEX offers a complete pub/sub API with table diffing over WebSocket. You may subscribe to real-time changes on any available table at https://www.bitmex.com/app/wsAPI#subscriptions

To subscribe to topics, send them as a comma-separated list in your connection string. For example:

wss://ws.bitmex.com/realtime?subscribe=instrument,orderBookL2_25:XBTUSD

##kdb+ and websocket 
Simple Web application which uses kdb+ to provide real-time updating of tables based on user queries. Please see examples at https://github.com/jonathonmcmurray/ws.q
