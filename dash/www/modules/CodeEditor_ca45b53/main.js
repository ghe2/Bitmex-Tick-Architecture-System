define(["vs/editor/editor.main","polyfill","backbone","Handlebars","css!./css/app.css"],function(d,j,n,q){"use strict";var o,e=this&&this.__extends||(o=function(e,t){return(o=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)t.hasOwnProperty(n)&&(e[n]=t[n])})(e,t)},function(e,t){function n(){this.constructor=e}o(e,t),e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n)}),r=this&&this.__assign||function(){return(r=Object.assign||function(e){for(var t,n=1,o=arguments.length;n<o;n++)for(var r in t=arguments[n])Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r]);return e}).apply(this,arguments)},z="aj0|wj1",t="abs|aj|acos|all|and|any|asc|asin|asof|atan|attr|avg|avgs|bin|binr|by|ceiling|cols|cor|cos|count|cov|cross|csv|cut|delete|deltas|desc|dev|differ|distinct|div|do|dsave|each|ej|ema|enlist|eval|except|exec|exit|exp|fby|fills|first|flip|floor|fkeys|from|get|getenv|group|gtime|hclose|hcount|hdel|hopen|hsym|iasc|idesc|if|ij|in|insert|inter|inv|key|keys|last|ljf|like|lj|load|log|lower|lsq|ltime|ltrim|mavg|max|maxs|mcount|md5|mdev|med|meta|min|mins|mmax|mmin|mmu|mod|msum|neg|next|not|null|or|over|parse|peach|pj|prd|prds|prev|prior|rand|rank|ratios|raze|read0|read1|reciprocal|reval|reverse|rload|rotate|rsave|rtrim|save|scan|scov|sdev|svar|select|set|setenv|show|signum|sin|sqrt|ss|ssr|string|sublist|sum|sums|sv|system|tables|tan|til|trim|type|uj|ungroup|union|update|upper|upsert|value|var|view|views|vs|wavg|where|while|within|wj|wsum|ww|xasc|xbar|xcol|xcols|xdesc|xexp|xgroup|xkey|xlog|xprev|xrank",I="asBoolean|asByte|asChar|asDate|asDatetime|asFloat|asGUID|asInt|asList|asLong|asMinute|asMonth|asReal|asSecond|asShort|asString|asSymbol|asTime|asTimespan|asTimestamp|asType|catch|INFINITY|isAtom|isBoolean|isByte|isChar|isCompound|isDate|isDatetime|isDict|isDictionary|isEmpty|isEnum|isFloat|isFunction|isGeneral|isGUID|isInfinity|isInt|isKeyedTable|isLinked|isList|isLong|isMinute|isMonth|isNull|isNumber|isReal|isSecond|isShort|isString|isSymbol|isTable|isTime|isTimespan|isTimestamp|isType|isVector|NULL|parseBoolean|parseByte|parseChar|parseDate|parseDatetime|parseFloat|parseGUID|parseInt|parseLong|parseMinute|parseMonth|parseReal|parseSecond|parseShort|parseSymbol|parseTime|parseTimespan|parseTimestamp|parseType|typeOf|typeSymbol|until|xor",i="Mlim|Q7|access|accp|adict|arch|assign|badtail|branch|cast|char|conn|constants|domain|elim|glim|globals|length|limit|locals|loop|mismatch|mq|noamend|nosocket|noupdate|nyi|os|par|params|part|pl|pwuid|splay|srv|stack|step|stop|stype|sys|threadview|unmappable|upd|user|utf8|vd1|wha|wsfull|wsm",R=(new RegExp("^("+i+")\\b"),a.prototype.eol=function(){return this.pos>=this.string.length},a.prototype.sol=function(){return this.pos==this.lineStart},a.prototype.peek=function(){return this.string.charAt(this.pos)||void 0},a.prototype.next=function(){if(this.pos<this.string.length)return this.string.charAt(this.pos++)},a.prototype.eat=function(e){var t=this.string.charAt(this.pos),e="string"==typeof e?t==e:t&&(e.test?e.test(t):e(t));if(e)return++this.pos,t},a.prototype.eatWhile=function(e){for(var t=this.pos;this.eat(e););return this.pos>t},a.prototype.eatSpace=function(){for(var e=this.pos;/[\s\u00a0]/.test(this.string.charAt(this.pos));)++this.pos;return this.pos>e},a.prototype.skipToEnd=function(){this.pos=this.string.length},a.prototype.skipTo=function(e){e=this.string.indexOf(e,this.pos);if(-1<e)return this.pos=e,!0},a.prototype.backUp=function(e){this.pos-=e},a.prototype.column=function(){return this.lastColumnPos<this.start&&(this.lastColumnValue=s(this.string,this.start,this.tabSize,this.lastColumnPos,this.lastColumnValue),this.lastColumnPos=this.start),this.lastColumnValue-(this.lineStart?s(this.string,this.lineStart,this.tabSize):0)},a.prototype.indentation=function(){return s(this.string,null,this.tabSize)-(this.lineStart?s(this.string,this.lineStart,this.tabSize):0)},a.prototype.match=function(e,t,n){var o;if("string"!=typeof e)return(o=this.string.slice(this.pos).match(e))&&0<o.index?null:(o&&!1!==t&&(this.pos+=o[0].length),o);function r(e){return n?e.toLowerCase():e}return r(this.string.substr(this.pos,e.length))==r(e)?(!1!==t&&(this.pos+=e.length),!0):void 0},a.prototype.current=function(){return this.string.slice(this.start,this.pos)},a.prototype.hideFirstChars=function(e,t){this.lineStart+=e;try{return t()}finally{this.lineStart-=e}},a.prototype.lookAhead=function(e){var t=this.lineOracle;return t&&t.lookAhead(e)},a.prototype.baseToken=function(){var e=this.lineOracle;return e&&e.baseToken(this.pos)},a);function a(e,t,n){this.pos=this.start=0,this.string=e,this.tabSize=t||8,this.lastColumnPos=this.lastColumnValue=0,this.lineStart=0,this.lineOracle=n}function s(e,t,n,o,r){null==t&&-1==(t=e.search(/[^\s\u00a0]/))&&(t=e.length);for(var i=o||0,a=r||0;;){var s=e.indexOf("\t",i);if(s<0||t<=s)return a+(t-i);a=(a+=s-i)+(n-a%n),i=s+1}}u.prototype.clone=function(){return new u(this)},u.prototype.equals=function(e){return e===this};var U=u;function u(e){var t=e.mode,n=e.prevToken,o=e.braceDepth,r=e.qukeMixed,e=e.depth;this.mode=t,this.prevToken=n,this.braceDepth=o,this.qukeMixed=r,this.depth=e}F={},l=!!(Z={name:"q",isSpreadsheet:"false"}).isSpreadsheet,f=/^[\[({]/,c=/^[\])}]/,W=/^[a-zA-Z](\.|$|(?![a-zA-Z0-9_]))/,m=/^[~!@#$%^&*:<>,\?|+=_-]/,p=/^[012]:/,h=/^(&&|\|\||(<>|[<>]=):|[~!@#$%\^&*\-_+\\,?]=)/,Q=new RegExp("^("+i+")\\b"),G=/^(asDatetime|parseDatetime)$/,g=/^[a-zA-Z]/,K=/^[a-zA-Z0-9.]/,H=/^[a-zA-Z0-9._/:]*/,J=/^[a-zA-Z0-9._]*(:[a-zA-Z0-9._/:]*)?/,Y=/^[a-zA-Z][a-zA-Z]?[1-9][0-9]*\b/,X=/^([abBcCdefgopPsStTuvwWxz]|ts)\b/,ee=/^\/*\s*@?TODO\b/i,te=/^k\)/,ne=/^([\\\/nrt"0-7])/,b=/^\s+$/,oe=/^[a-zA-Z0-9_]*/,re=/^[a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)*\.?/,ie=new RegExp("^[a-zA-Z0-9_]+\\.("+t+"|"+I+")(\\.[a-zA-Z0-9_]+)*\\.?\\b"),ae=/^([0-9]+(f|e(-?[0-9]+e?)?)?|(f|e(-?[0-9]+e?)?))/,y=["0[nNwW][hjemdzuvtifpgn]?","[10]+b",i="0x[\\da-fA-Fa-f]*","\\d{4}\\.\\d{2}([ptnm]|\\.\\d{2}([DPtdp](\\d{2}(:\\d{2}(:\\d{2}(\\.\\d{0,9})?)?)?)[pn]?|[pnd]?))","\\d{2}:\\d{2}(:\\d{2}(\\.\\d{0,9})?)?[ptnvu]?|\\d{2}[ptnvu]","\\d{1,6}D(\\d{1,2}(:\\d{2}(:\\d{2}(\\.\\d{0,9}|\\.?)?)?)?)?[np]?","\\d{1,6}P\\d{2}:\\d{2}([np]|:\\d{2}([np]|\\.[np]|\\.\\d{0,9}[np]|\\.\\d{3,9}[np]?))","(\\d+(\\.\\d*)?|\\d*\\.\\d+)(e[+-]?\\d+)[ef]?|(\\d+\\.\\d*|\\d*\\.\\d+)[ef]?|\\d+[eihjf]?"].join("|"),k=new RegExp("^([10]+b|"+i+"|"+y+")"),se=new RegExp("^("+y+")"),ue=new RegExp("^("+t+"|"+I+(l?"":"|"+z)+")\\b");var F,Z,l,f,c,W,m,p,h,Q,G,g,K,H,J,Y,X,ee,te,ne,b,oe,re,ie,ae,y,k,se,ue,v,de={startState:function(){return new U({mode:v.SOL,prevToken:null,braceDepth:0,qukeMixed:!!Z.qukeMixed,depth:0})},indent:function(e){return F.indentUnit*e.depth},token:function(e,t){if(e.sol()&&t.mode!==v.commentTilEnd&&t.mode!==v.multilineComment&&t.mode!==v.unclosedString&&(t.mode=v.SOL,t.prevToken="SOL"),t.mode===v.unclosedString)return e.eat("\\")?P(t,"error-SOLBackslashInString"):S(e,t);if(t.mode===v.SOL){if(e.eatSpace())return t.mode=v.afterSpace,null;if(e.eat("/"))return o=t,(n=e).eol()||n.match(b)?(n.eatSpace(),o.mode=v.multilineComment,P(o,"error-multilineComment")):le(n,o);if(!t.qukeMixed&&0<t.depth&&")"!==e.peek()&&"]"!==e.peek()&&"}"!==e.peek())return e.next(),P(t,"error-unindentedToken");if(e.match(te,!1,!1))return n=t,e.skipToEnd(),P(n,"command");if(e.match(g,!1,!1))return C(e,t);if(e.eat(";"))return t.mode=v.afterPunctuation,null;if(e.eat("\\"))return fe(e,t);if(e.eat("`"))return x(e,t);if(e.eat("."))return L(e,t);if(e.eat('"'))return S(e,t);if(e.eat("'"))return M(e,t);if(e.eat("-"))return w(e,t);if(e.match(h,!0,!1))return t.mode=v.afterPunctuation,P(t,"error");if(e.eat(m))return t.mode=v.afterPunctuation,P(t,"keyword");if(e.eat(f))return D(t);if(e.eat(c))return O(t),P(t,"error-unindentedToken");if(e.match(p,!0,!1))return t.mode=v.afterPunctuation,P(t,"keyword");if(e.match(k,!0,!1))return t.mode=v.afterVarNumSym,P(t,"number")}else if(t.mode===v.afterSpace){if(e.eatSpace(),e.match(g,!1,!1))return C(e,t);if(e.eat(";"))return t.mode=v.afterPunctuation,null;if(e.eat("/"))return le(e,t);if(e.eat("`"))return x(e,t);if(e.eat("."))return L(e,t);if(e.eat('"'))return S(e,t);if("\\"===e.peek()&&"SOL"===t.prevToken)return e.next(),P(t,"error-indentedCommand");if(e.eat(/['\\]/))return M(e,t);if(e.eat("-"))return w(e,t);if(e.match(h,!0,!1))return t.mode=v.afterPunctuation,P(t,"error");if(e.eat(m))return t.mode=v.afterPunctuation,P(t,"keyword");if(e.eat(f))return D(t);if(e.eat(c))return O(t);if(e.match(p,!0,!1))return t.mode=v.afterPunctuation,P(t,"keyword");if(e.match(k,!0,!1))return t.mode=v.afterVarNumSym,P(t,"number")}else if(t.mode===v.afterVarNumSym){if(e.eatSpace())return t.mode=v.afterSpace,null;if(e.eat(";"))return t.mode=v.afterPunctuation,null;if(e.eat("`"))return x(e,t);if(e.eat('"'))return S(e,t);if(e.eat(/['/\\]/))return M(e,t);if(e.match(h,!0,!1))return t.mode=v.afterPunctuation,P(t,"error");if(e.eat(m))return t.mode=v.afterPunctuation,P(t,"keyword");if(e.eat(f))return D(t);if(e.eat(c))return O(t);if(e.match(/^[Tz]/))return t.mode=v.afterPunctuation,P(t,"error-datetime")}else if(t.mode===v.afterPunctuation||t.mode===v.afterOpenBracket||t.mode===v.afterCloseBracket){if(e.eatSpace())return t.mode=v.afterSpace,null;if(e.match(g,!1,!1))return C(e,t);if(e.eat(";"))return t.mode=v.afterPunctuation,null;if(e.eat("`"))return x(e,t);if(e.eat("."))return L(e,t);if(e.eat('"'))return S(e,t);if(e.eat(/['/\\]/))return M(e,t);if(e.eat("-"))return w(e,t);if(e.match(h,!0,!1))return t.mode=v.afterPunctuation,P(t,"error");if(e.eat(m))return t.mode=v.afterPunctuation,P(t,"keyword");if(e.eat(f))return D(t);if(e.eat(c))return O(t);if(e.match(p,!0,!1))return t.mode=v.afterPunctuation,P(t,"keyword");if(e.match(k,!0,!1))return t.mode=v.afterVarNumSym,P(t,"number")}else{if(t.mode===v.commentTilEnd)return e.skipToEnd(),P(t,"comment");if(t.mode===v.multilineComment)return o=t,(t=e).eat("\\")&&(t.eol()||t.match(b))?(t.eatSpace(),o.mode=v.SOL):t.skipToEnd(),P(o,"error-multilineComment")}var n,o;return e.next()}};function w(e,t){return t.mode!==v.afterCloseBracket&&e.match(se,!0,!1)?(t.mode=v.afterVarNumSym,P(t,"number")):(t.mode=v.afterPunctuation,P(t,"keyword"))}function T(e,t,n){return e.match(re,!0,!1),t.mode=v.afterVarNumSym,P(t,n)}function S(e,t){for(;;){if(e.eat('"'))return t.mode=v.afterPunctuation,P(t,"string");if(e.eol())return t.mode=v.unclosedString,P(t,"string");if(e.eat("\\")){if(!e.eat(ne))return e.next(),P(t,"error-invalidEscape")}else e.next()}}function x(e,t){return e.eat(K)?e.match(J,!0,!1):e.eat(":")&&e.match(H,!0,!1),t.mode=v.afterVarNumSym,P(t,"symbol")}function C(e,t){var n=e.match(oe,!0,!1);return t.mode=v.afterVarNumSym,G.test(n[0])?P(t,"error-datetime"):ue.test(n[0])?P(t,"keyword"):Q.test(n[0])?P(t,"error-illegalKeyword"):e.eat(".")?T(e,t,"variable"):l&&n[0].match(Y)?P(t,"cell"):P(t,"variable")}function le(e,t){return e.match(ee,!0)?(e.skipToEnd(),P(t,"toDo")):(e.skipToEnd(),P(t,"comment"))}function fe(e,t){return e.eol()||e.match(b)?(e.eatSpace(),t.mode=v.commentTilEnd,e.skipToEnd(),P(t,"error-multilineComment")):0<t.depth?(t.mode=v.afterPunctuation,P(t,"error-unindentedToken")):(t=t,((e=e).match(X,!0,!1)?function(e,t){return e.eat(" ")||e.eol()?P(t,"command"):ce(e,t)}:ce)(e,t))}function ce(e,t){return e.skipToEnd(),P(t,"command")}function L(e,t){return e.match(W,!1,!1)?T(e,t,"keyword"):e.match(ie,!0,!1)?P(t,"error-reservedInContext"):e.match(g,!1,!1)?T(e,t,"variable"):e.match(ae,!0,!1)?(t.mode=v.afterVarNumSym,P(t,"number")):(t.mode=v.afterPunctuation,P(t,"keyword"))}function M(e,t){return e.eatWhile(":"),t.mode=v.afterPunctuation,P(t,"keyword")}function O(e){return e.depth--,e.mode=v.afterCloseBracket,null}function D(e){return e.depth++,e.mode=v.afterOpenBracket,null}function P(e,t){return e.prevToken=t}var me=[{id:"foldAll",text:"Collapse All",action:"editor.foldAll",icon:"fa fa-minus"},{id:"foldRecursively",text:"Collapse",action:"editor.foldRecursively",icon:"fa fa-minus"},{id:"unfoldAll",text:"Expand All",action:"editor.unfoldAll",icon:"fa fa-plus"},{id:"unfoldRecursively",text:"Expand",action:"editor.unfoldRecursively",icon:"fa fa-plus"},{id:"format",text:"Format",action:"editor.action.formatDocument",icon:"fa fa-align-right"}],pe={autoIndent:!0,automaticLayout:!0,contextmenu:!0,fixedOverflowWidgets:!0,formatOnType:!0,fontSize:12,lineDecorationsWidth:0,lineNumbersMinChars:2,scrollBeyondLastLine:!(v={SOL:0,afterSpace:1,afterVarNumSym:2,afterPunctuation:3,unclosedString:4,multilineComment:5,commentTilEnd:6,afterOpenBracket:7,afterCloseBracket:8}),wordWrap:"on",dragAndDrop:!1},he=["plaintext","json","handlebars","html","java","javascript","markdown","python","r","sql","typescript","xml","q"],i=(V.getComponentDefinition=function(e){var t,n,o={id:19,componentName:"Editor",componentDescription:"Editor for HTML, Python, Q, JSON, etc.",appKey:"Editor",css:"Editor",ghostViewThumb:null,buildViewThumb:null,appArgs:{websiteUrl:e.websiteUrl,json:{version:"4.4.0S2",Basic:{Language:"json",Value:"",DebounceUpdate:200,Theme:"Dark",FormatOnChange:!0,ShowToolbar:!1},Configuration:{Minimap:!0,LineNumbers:!0,ReadOnly:!1}},schema:{type:"object",title:"Properties",properties:{Basic:{type:"object",title:"Basic",options:{collapsed:!1},propertyOrder:200,properties:{Language:{type:"string",title:"Language",default:"json",enum:he},Value:{type:"viewstate",title:"Value",default:""},DebounceUpdate:{type:"number",min:0,max:1e3,title:"Debounce Update (ms)",default:200},FormatOnChange:{type:"boolean",title:"Format On Value Change",format:"checkbox",default:!0},ShowToolbar:{type:"boolean",title:"Show Toolbar",format:"checkbox",default:!1},Theme:{type:"string",title:"Theme",options:{hidden:!0},enum:["Dark","Light"]},DashboardTheme:{options:{hidden:!0}}}},Configuration:{type:"object",title:"Editor Configuration",options:{collapsed:!1},propertyOrder:200,properties:{Minimap:{type:"boolean",title:"Show Minimap",format:"checkbox",default:!0},LineNumbers:{type:"boolean",title:"Show Line Numbers",format:"checkbox",default:!0},ReadOnly:{type:"boolean",title:"Read Only",format:"checkbox",default:!1},Theme:{type:"string",title:"Theme",options:{hidden:!0},enum:["Dark","Light"]},DashboardTheme:{options:{hidden:!0}}}}}}}};if(0<_.keys(e.settingsModel.attributes).length)for(n=V.upgrades.indexOf(_.find(V.upgrades,{version:e.settingsModel.get("version")}))+1;n<V.upgrades.length;n+=1)(t=V.upgrades[n]).fn(e.settingsModel,e),e.settingsModel.set("version",t.version);return o},V);function V(){}i.upgrades=[{version:"4.4.0S2",fn:function(e){e.set("Style",{advanced:"",cssClasses:""})}}];be.app=q.template({compiler:[8,">= 4.3.0"],main:function(e,t,n,o,r){return'<div class="editor-toolbar ui-widget-header"></div>\n<div class="editor-container"></div>'},useData:!0});var ge=be;function be(){}A=n.View,e(N,A),N.prototype.toggleToolbar=function(e){this.$el.toggle(e)};var A,B,ye=N;function N(e){var r=A.call(this,e)||this;return r.buttons={},me.forEach(function(e){var t=e.id,n=e.text,o=e.action,e=e.icon,e=$('<button id="'+t+'" class="editor-btn">\n                    <i class="'+e+'" style="opacity: .8;padding-right: 2px;"></i>\n                    <span>'+n+"</span>\n                </button>").button();r.$el.append(e),r.buttons[t]=r.$el.find("button#"+t),r.buttons[t].click(function(){r.trigger("action",o)})}),r}function E(e){var t=B.call(this,e)||this;return t.debounceUpdate=_.debounce(function(){return t.updateViewstate()},200),t.api=e.api,t.theme=e.dashboardViewModel.get("DashboardTheme"),t.$el.html(ge.app({})),t.$el.addClass("editor-app"),t.viewModel=new n.DeepModel({}),t.toolbar=new ye({el:t.$el.find(".editor-toolbar")[0]}),t.listenTo(t.toolbar,"action",function(e){t.editor&&t.editor.getAction(e).run()}),t.listenToOnce(t.viewModel,"change",function(){return t.onReady()}),t.listenTo(t.viewModel,"change:Basic.ShowToolbar",function(){return t.toolbar.toggleToolbar(t.viewModel.get("Basic.ShowToolbar"))}),t.listenTo(t.viewModel,"change:Basic.Language",function(){return t.onLanguageChange()}),t}return d.editor.defineTheme("q-dark",{base:"vs-dark",inherit:!0,rules:[{token:"default",background:"#161616",foreground:"#aaaaaa"},{token:"number",background:"#ce3595",foreground:"#ce3595"},{token:"keyword",background:"#161616",foreground:"#bd9c39"},{token:"string",background:"#161616",foreground:"#78abd2"},{token:"variable",background:"#161616",foreground:"#bdbdbd"},{token:"symbol",background:"#161616",foreground:"#8e7bbb"}],colors:{"editor.background":"#161616","editorLineNumber.foreground":"#8d8d8d"}}),d.editor.defineTheme("q-light",{base:"vs",inherit:!0,rules:[{token:"default",background:"#ffffff",foreground:"#09026f"},{token:"number",background:"#ffffff",foreground:"#0000ef"},{token:"keyword",background:"#ffffff",foreground:"#996900"},{token:"comment",background:"#ffffff",foreground:"#109900"},{token:"string",background:"#ffffff",foreground:"#006b99"},{token:"variable",background:"#ffffff",foreground:"#09026f"},{token:"symbol",background:"#ffffff",foreground:"#845df4"}],colors:{"editor.background":"#ffffff","editorLineNumber.foreground":"#09026f"}}),B=n.View,e(E,B),E.prototype.remove=function(){return this.disposable&&this.disposable.dispose(),this},E.prototype.onSettingsChange=function(e){this.viewModel.set(e)},E.prototype.setTheme=function(e){this.theme=e,this.editor&&d.editor.setTheme(this.getTheme())},E.prototype.executeAction=function(e){this.editor&&this.editor.getAction(e).run()},E.prototype.setValue=function(e){this.viewModel.set("Basic.Value",e)},E.prototype.getValue=function(){return this.editor?this.editor.getValue():""},E.prototype.getTheme=function(){return"q"!==this.viewModel.get("Basic").Language?"Light"!==this.theme?"vs-dark":"vs":"Light"!==this.theme?"q-dark":"q-light"},E.prototype.onLanguageChange=function(){var e,t=this.viewModel.get("Basic").Language;this.editor&&(d.editor.setTheme(this.getTheme()),"q"===t?this.onLanguageChangeToQ():(e=this.editor.getModel())&&(d.editor.setModelLanguage(e,t),this.formatDocument()))},E.prototype.onLanguageChangeToQ=function(){var i=this,e=(d.languages.register({id:"q"}),d.editor.defineTheme("q-theme",{base:"vs-dark",colors:{"editor.background":"#161616","editorLineNumber.foreground":"#8d8d8d"},inherit:!0,rules:[{background:"#161616",foreground:"#aaaaaa"},{token:"number",background:"#ce3595",foreground:"#ce3595"},{token:"keyword",background:"#161616",foreground:"#bd9c39"},{token:"string",background:"#161616",foreground:"#78abd2"},{token:"variable",background:"#161616",foreground:"#bdbdbd"},{token:"symbol",background:"#161616",foreground:"#8e7bbb"}]}),d.editor.defineTheme("q-theme-light",{base:"vs",colors:{"editor.background":"#ffffff","editorLineNumber.foreground":"#09026f"},inherit:!0,rules:[{background:"#ffffff",foreground:"#09026f"},{token:"number",background:"#ffffff",foreground:"#0000ef"},{token:"keyword",background:"#ffffff",foreground:"#996900"},{token:"comment",background:"#ffffff",foreground:"#109900"},{token:"string",background:"#ffffff",foreground:"#006b99"},{token:"variable",background:"#ffffff",foreground:"#09026f"},{token:"symbol",background:"#ffffff",foreground:"#845df4"}]}),d.languages.setTokensProvider("q",{getInitialState:function(){return de.startState()},tokenize:function(e,t){for(var n=new R(e),o=[];!n.eol();){var r=de.token(n,t);o.push({scopes:i.getScopeFromStyle(r),startIndex:n.start}),n.start=n.pos}return{endState:t,tokens:o}}}),d.languages.setLanguageConfiguration("q",{brackets:[["{","}"],["[","]"],["(",")"]],autoClosingPairs:[],indentationRules:{decreaseIndentPattern:void 0,increaseIndentPattern:/[{(\[]/},onEnterRules:[{action:{indentAction:3},beforeText:/^[^\[]*[})\]]/}]}),this.fetchAutoCompleteItems(),this.editor.getModel());e&&d.editor.setModelLanguage(e,"q")},E.prototype.fetchAutoCompleteItems=function(){var t=this;this.disposable||$.ajax("../modules/vendor/types/q.json").then(function(e){var u=e.autocompleteItems.map(function(e){return r(r({},e),{insertText:"."===e.label[0]?e.label.substring(1):e})});t.disposable=d.languages.registerCompletionItemProvider("q",{provideCompletionItems:function(e,t,n,o){if(t.column<=1)return{suggestions:[]};try{var r=e.getLineContent(t.lineNumber).substring(0,t.column),i=r.lastIndexOf(" "),a=r.substring(i).trim(),s=new RegExp(_.escapeRegExp(r.substring(i).trim()));return{suggestions:u.filter(function(e){return 1<t.column&&e.label.match(s)}).map(function(e){return{label:e.label,detail:e.detail,insertText:e.insertText,kind:d.languages.CompletionItemKind.Function,range:{startLineNumber:t.lineNumber,startColumn:t.column-a.length,endLineNumber:t.lineNumber,endColumn:t.column+e.insertText.length-a.length}}})}}catch(e){return{suggestions:[]}}}})})},E.prototype.getScopeFromStyle=function(e){switch(e){case null:return"default";case"error-multilineComment":return"comment.block";case"symbol":return"symbol";case"error-unindentedToken":return"invalid";default:return e}},E.prototype.viewModelToOptions=function(){var e=this.viewModel.get("Configuration"),t=e.Minimap;return{lineNumbers:e.LineNumbers?"on":"off",minimap:{enabled:t},readOnly:e.ReadOnly}},E.prototype.onReady=function(){var t=this;this.initializeMonaco(),this.listenTo(this.viewModel,"change:Basic.Value",function(){var e=t.viewModel.get("Basic").Value;t.editor.setValue(e),t.formatDocument()}),this.listenTo(this.viewModel,"change:Basic.DebounceUpdate",function(){t.debounceUpdate=_.debounce(function(){return t.updateViewstate()},t.viewModel.get("Basic.DebounceUpdate")),t.editorListener.dispose(),t.editorListener=t.editor.onDidChangeModelContent(t.debounceUpdate)}),this.listenTo(this.viewModel,"change:Configuration",function(){t.editor.updateOptions(t.viewModelToOptions())})},E.prototype.initializeMonaco=function(){var e=this.viewModel.get("Basic"),t=e.Language,e=e.Value;this.editor=d.editor.create(this.$el.find(".editor-container")[0],Object.assign(pe,{language:t,theme:this.getTheme(),value:e},this.viewModelToOptions())),this.formatDocument(),"q"===t&&this.onLanguageChangeToQ(),this.editorListener=this.editor.onDidChangeModelContent(this.debounceUpdate)},E.prototype.formatDocument=function(){var e=this;this.viewModel.get("Basic.FormatOnChange")&&setTimeout(function(){return e.editor.getAction("editor.action.formatDocument").run()},500)},E.prototype.updateViewstate=function(){var e=this.editor.getValue();e!==this.viewModel.get("Basic.Value")&&(this.viewModel.set("Basic.Value",e,{silent:!0}),this.api.setProperty("Basic.Value",e))},E.getComponentDefinition=i.getComponentDefinition,E});