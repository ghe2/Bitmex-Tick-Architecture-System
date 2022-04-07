ps aux | grep crypto_tick | grep -v grep | awk '{print $2}' | xargs -I {} kill -9 {}
