
\p 5011
\c 2000 2000

/ optionally use local chrome install
/ `PDF_CHROME_PATH setenv "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"

/ https://github.com/jonathonmcmurray/reQ/blob/master/req/url.q
urldec:{[x]
  :(!/)"S=&"0:.h.uh ssr[x;"+";" "];
  }

.z.ph:{
    hash: last "%23" vs x 0;
    params: (!/) flip {a:"=" vs x;(`$a 0; .h.uh a 1)} each "&" vs last "?" vs (neg 3+count hash) _ x 0;
    opts: urldec params`url;
    theme: $[count opts`theme; opts`theme; "kx-light"];
    tmp: (string first 1?0Ng),".pdf";
    system 0N!"node index.js \"http://localhost:10001/",params[`url],"#",.h.uh[hash],"\" ",tmp," ",theme;
    f:"c"$@[read1;`$":",tmp;""];
    $[count f;"HTTP/1.x 200 OK\r\nContent-Length:",(string count f),"\r\nContent-Type:application/pdf\r\nContent-Disposition: attachment;filename=",(params`filename),0N!".pdf\r\n\r\n",raze f; .h.hn["404";`txt]"pdf error"]
  }
