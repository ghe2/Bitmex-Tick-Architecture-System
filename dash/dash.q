\l go.q_
\d .dash
snd_fnc:{[f;h;w;r;x]
 neg[h]({[f;w;r;x;u].dash.u:u;res:.[f;(w;r;x);{[w;r;e]neg[.z.w](`.dash.snd_err;w;r;e)}[w;r]];.dash.u:`;res};f;w;r;x;.dash.wu w)} 
snd_qry:snd_fnc{[o;w;r;x]neg[.z.w](`.dash.rcv_msg;w;o;r;x[0] sublist value x 1)}op?`Qry
snd_snp:snd_fnc{[o;w;r;x]neg[.z.w](`.dash.rcv_msg;w;o;r;x[0] sublist .u.snap x 1)}op?`Sub
snd_sub:snd_fnc{[w;r;x].u.sub[x 0]x 1}

/ integration callbacks
/ open:{hopen x}
/ post_save:{[id] system ""git -C data/dashboards commit -am \"",(string id)," saved by ",(string .z.u),"\""}
/ .z.ac:{$[null u:x[1]`REMOTE_USER;(0;"");(1;ssr[string u;"DOMAIN\\";""])]}
