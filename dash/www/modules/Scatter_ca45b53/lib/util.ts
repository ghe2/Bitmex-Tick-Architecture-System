/// <reference types="lodash" />
/// <reference types="jquery" />
/// <reference path="chartjs-color.d.ts" />

// === Object.assign polyfill for IE11 == //
if (typeof Object.assign != 'function') {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
      value: function assign(target: any, varArgs: any) { // .length of function is 2
        'use strict';
        if (target == null) { // TypeError if undefined or null
          throw new TypeError('Cannot convert undefined or null to object');
        }
  
        var to = Object(target);
  
        for (var index = 1; index < arguments.length; index++) {
          var nextSource = arguments[index];
  
          if (nextSource != null) { // Skip over if undefined or null
            for (var nextKey in nextSource) {
              // Avoid bugs when hasOwnProperty is shadowed
              if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                to[nextKey] = nextSource[nextKey];
              }
            }
          }
        }
        return to;
      },
      writable: true,
      configurable: true
    });
  }

interface VSValueReplacer { (path: string, key:string, value: any, api: any): any }
interface VSModelReplacer { (path: string, key:string, value: any, api: any): any/*ViewState*/ }

interface TypedCallback<T> { (...args:any[]): T }
interface DynamicSchema<T> { [index: string]: T }

interface BaseCache { model: Chart }
interface LoadCache extends BaseCache { load:string[], defaults: any[] }
interface SaveCache extends BaseCache { store:string[] }
type CacheOptions = LoadCache | SaveCache;

class Util {
    // Map returns formatted strings acceptable by Echarts based on kdbType
    public static TEMPORALFORMATMAP: {[index:string]:string} = {
        12: "YYYY-MM-DD HH:mm:ss.SSSSSSSSS",
        13: "YYYY-MM",
        14: "YYYY-MM-DD",
        15: "YYYY-MM-DD HH:mm:ss.SSS",
        16: "YYYY-MM-DD HH:mm:ss.SSSSSSSSS",
        17: "YYYY-MM-DD HH:mm",
        18: "YYYY-MM-DD HH:mm:ss",
        19: "YYYY-MM-DD HH:mm:ss.SSS",
    };

    public static hash = (id: string): string => {
        let string = Date.now().valueOf() + id.toString();

       if (Array.prototype.reduce){
           return string.split("").reduce(function(a,b){a=((a<<5)-a)+b.charCodeAt(0);return a&a},0) + "";              
       } 
       var hash = 0;
       if (string.length === 0) return hash + "";
       for (var i = 0; i < string.length; i++) {
           var character  = string.charCodeAt(i);
           hash  = ((hash<<5)-hash)+character;
           hash = hash & hash; // Convert to 32bit integer
       }
       return hash + "";
    }
    //Set api property without causing dirty flag to appear or 
    public static setApiProperty(path: string, property: any, appView: any, notSilent?: boolean) {
        if(notSilent) {
            appView.api.setProperty(path, property);
        } else {
            appView.api.setProperty(path, property, {silent: true});
            appView.onSettingsChange({[path]: property});
        }
    }

    /**
     * Function used by tooltip and legends, allos to create svg based on custom 
     * styles options, for html5 legend (TODO) and tooltip.   
     * @param {object} chartStyles - styles for svg generator
     * @param {number} fontsize - custom font size
     */
    public static renderSVGIcon (chartStyles: any, fontsize?: number) {
        // Get point related styles from chartModel settings
        let rgb: any = Util.hex2RGB(chartStyles.plotColor);
            
        let fs = fontsize ? fontsize+"px" : "12px", //Tooltipt font size
            svg: string = '<svg height="'+fs+'" width="'+fs+'" viewbox="0 0 15 15" style="margin-right:5px">',
            color =  rgb ? "rgba("+rgb[0]+","+rgb[1]+","+rgb[2]+",0.8)" 
                : "rgba(79,106,166, 0.8)", //fillcolor
            stroke = color, // stroke color
            opacity = "80", // can get from canvas background opacity property
            strokeWidth = 1, // can get from styles
            shape = chartStyles.legendIconCustom || "none"; // get shape from props
        
        switch(shape) {
            case "circle":
                svg = svg + '<circle cx="7.5" cy="7.5" r="5" stroke="' + stroke + '" stroke-width="' + Math.min(1,strokeWidth) + '" fill="' + color + '" />';
                break;
            case "diamond":
                svg = svg + '<path fill="' + color + '" stroke="' + stroke + '" stroke-width="' + Math.min(1,strokeWidth) + '"  stroke-linecap="butt" stroke-linejoin="miter" opacity="'+opacity+'" d="M 0 7.5 L 7 3.5 L 14 7.5 L 7 11.5 Z" ></path>'
                break;
            case "rect":
            case "rectangle":
                svg = svg + '<rect style="fill:' + color + ';stroke:' + stroke + ';stroke-width:' + Math.min(1,strokeWidth) + ';stroke-linecap:butt stroke-linejoin:miter;opacity:'+opacity+'" x="0" y="3.5"  width="14" height="7.5" />'
                break;
            case "square":
                svg = svg + '<rect style="fill:' + color + ';stroke:' + stroke + ';stroke-width:' + Math.min(1,strokeWidth) + ';stroke-linecap:butt stroke-linejoin:miter;opacity:'+opacity+'" x="3.5" y="3.5"  width="7.5" height="7.5" />'
                break;
            case "roundRect":
                svg = svg + '<rect style="fill:' + color + ';stroke:' + stroke + ';stroke-width:' + Math.min(1,strokeWidth) + ';stroke-linecap:butt stroke-linejoin:miter;opacity:'+opacity+'" x="0" y="3.5" rx="2" ry="2" width="14" height="7.5" >'
                break;
            case "triangle":
                svg = svg + '<path fill="' + color + '" stroke="' + stroke + '" stroke-width="' + Math.min(1,strokeWidth) + '"  stroke-linecap="butt" stroke-linejoin="miter" opacity="'+opacity+'" d="M 0 13 L 6 2 L 13 13 L 0 13 Z" ></path>'
                break;
            // (TODO) Icon does not fit properly
            // case "arrow":
            //     svg = svg + '<path fill="' + color + '" stroke="' + stroke + '" stroke-width="' + Math.min(1,strokeWidth) + '"  stroke-linecap="butt" stroke-linejoin="miter" opacity="'+opacity+'" d="M 0 12.3 L 7 3 L 14 12.3 L 7 10 Z" ></path>'
            //     break;
            case "none":
                // no svg
                break;
            default: // use custom shape
                if(shape.indexOf("path://") === 0) {
                    shape = shape.replace("path://", '<path d="') + '"></path>';
                    //remove viewbox restrictions
                    svg = svg.replace('viewbox="0 0 15 15"', "");
                } 
                svg = svg + shape;
        }
        // do not add svg if nothig is defined
        if(shape === "none") {
            svg = "";
        } else {
            svg = svg + '</svg>';
        }
        return svg;
    }
    
    public static compareKDBTimes(a: any, b: any) {
        return a.i > b.i ?
            1 : a.i < b.i ?
                -1 : a.n > b.n ?
                    1 : a.n < b.n ? -1 : 0;
    }

    public static convertPropertyIfMoment(value: any) {
        var kdbLikeObj = Tools.convertISODatetimeToKDBLikeObject(value);
        return Tools.isKDBTemporal(kdbLikeObj) ? Tools.convertKDBTemporalToMoment(kdbLikeObj) : kdbLikeObj;
    }
    
    /**
     * Function calcualtes min max from array of dataset
     * TODO check hwo min max suppose to work with different data types
     * @return {array} minMaxArr - array of two values where [minVal, maxVal] maps to axis *
     *  range property
     */
    public static calculateDataMinMax(dataArr: Array<number|string>): ArrMinMax{
        // Null values moved to the front of the array
        let sortedArr: Array<any> = Util.sortArrayAcs(dataArr);

        // Remove any last null
        while(sortedArr.slice(-1)[0] === null) {
            sortedArr.pop();
        }
        // Only allow min max to be number
        return [
            !_.isNaN(Number(sortedArr[0])) ? sortedArr[0] : null,
            !_.isNaN(Number(sortedArr.slice(-1)[0])) ? sortedArr.slice(-1)[0] : null
            ];
    }

    /**
     * Byy default points are displayed on the edges of the the grid to add offset and 
     *  position them  off the edge min/max value has to be adjusted by addind 
     * subtracting arbitrary values propartianal to order of the magnitude of difference 
     * between min and max value. For example if difference is < 100 addin subtracting 1 
     * is enough to push datapints off the edge but this number is insufficient for 1000 
     * since difference is too small and padding is not going to be noticed 
     */
    public static calculateMinMaxOffset(minMax: ArrMinMax) {
        // calculate both negative and positive differences
        let difference: number = Math.abs(Number(minMax[1]) - Number(minMax[0])),
            offsetValue: number = 0;

        let diffArr: string[] = String(difference).split(".");
        let diffLength = diffArr[0].length - 2;

        //check if there are decimal numbers
        if(diffArr.length > 1 && diffArr[0] === "0") {
            //convert to deciaml number
            let decimal: number =  Number("0."+diffArr[1]);
            // get magnitude of decimal number + 1 to get exact offset for the most significant decimal
            let magnitude = -Math.floor( Math.log(decimal) / Math.log(10) + 1) + 1;
            // calculate most significant decimal number
            offsetValue = 1 / Math.pow(10, magnitude);
        } else {    
            //not significant offset required for numbers > 1000
            offsetValue = Math.pow(10, diffLength);
        }
        return offsetValue;
    }

    public static expandNestedViewStates(settings: any, api: any/*ComponentAPI*/): any {
        const NESTED_KEY_REGEX = /([a-zA-Z]+)\.[0-9]+\./
        var keys: string[] = Object.keys(settings);
        var rootKeys: string[] = [];
        var allViewStates: boolean = _.every(keys, k => {
            var meta: any = api.getPropertyMeta(keys[0]);
            return meta && meta.type == 'viewstate';
        });

        if (allViewStates) {
            rootKeys = _.uniq(_.filter(_.map(keys, k => {
                const nestedArrayRe =  NESTED_KEY_REGEX.exec(k);
                return nestedArrayRe ? nestedArrayRe[1] : null;
            }) as string[]));
        }

        if (rootKeys.length) {
            var expandedSettings: any = {};
            _.each(rootKeys, k => expandedSettings[k!] = api.getProperty(k));
            return expandedSettings;
        }

        return settings;
    }

    public static focus2Array(value: any): Array<Array<string>> {
        var result: Array<Array<string>> = [],
            focus: string,
            multiRx = /^\[([^\]]*)]$/,
            focusValidRx = /^(?:"[^"\\]*(?:\\[\S\s][^"\\]*)*")(?:,"[^"\\]*(?:\\[\S\s][^"\\]*)*")*/,
            focusValueRx = /"([^"]*)"/g;

        focus = value.toString ? value.toString() : "";

        // if multiple paths
        var rxResult = multiRx.exec(focus);
        if (rxResult != null) {

            if (focusValidRx.test(rxResult[1])) {
                var valueResult;
                while ((valueResult = focusValueRx.exec(rxResult[1])) !== null) {
                    //var msg = 'Found ' + valueResult[1] + '. ';
                    //msg += 'Next match starts at ' + focusValueRx.lastIndex;
                    //console.log(msg);
                    result.push(_.map(valueResult[1].split(","), (key: string) => key.replace(/&#44;/g, ",")));
                }
            }
        } else {
            result.push(focus.split(","));
        }

        return _.filter(result, function (f) { return ("" + f).length > 0; });
    }
    
    /**
     * @function RGB2hex
     * @param {string} hex - Hexadecimal Color
     * @returns {number[]} RGB Array
     * Converts hex value to RGB Array
     */
    public static hex2RGB(hex: string): number[] | null {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return null;
        return [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ];
    }

    /**
     * @function RGB2hex
     * @param {number[]} rgb - RGB Value Array
     * @returns {string} Hexadecimal Color
     * Converts array of RGB values to hex value
     */
    public static RGB2hex(rgb: number[]): string {
        return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
    };
    
    /**
     * @function clamp
     * Clamps value between min and max 
     */
    public static clamp(value: number, min: number, max: number): number {
        return value > max ? max : value < min ? min : value;
    }

    /**
     * @function interpolateColor
     * Interpolates between multiple 
     * equal spaced colors in a palette to
     * return a color.
     */
    public static interpolateColor(palette: {type: string}[], low: number, high: number, x: number): string {
        let tick = (high - low)/(palette.length - 1);
        let loc = this.clamp((x-low)/tick, 0, palette.length - 1);
        let locolorHex = palette[Math.floor(loc)].type;
        let hicolorHex = palette[Math.ceil(loc)].type;
        let locolorRGB = this.hex2RGB(locolorHex)!;
        let hicolorRGB = this.hex2RGB(hicolorHex)!;
        let factor = loc - Math.floor(loc);
        let result = locolorRGB.slice();
        for (var i=0;i<3;i++) {
            result[i] = Math.round(result[i] + factor*(hicolorRGB[i]-locolorRGB[i]));
        }
        return this.RGB2hex(result);
    }
    // Pick regex columns form datasource
    public static getColumnKeysFromAxisString(axisStr: string, dataSource: DataSource): Array<string> {
        let rgxString = axisStr.indexOf('/') == 0 ? axisStr.substring(1) : "^" + axisStr.replace(/\*/g, '(.*)') + "$";
        try {
            let regExp = new RegExp(rgxString);
            return dataSource.getColumnNames().filter(col => col.match(regExp));
        } catch (e) {
            console.warn("Invalid regular expression: "+rgxString+" : Nothing to repeat");
            return [];
        }
    }

    public static getFormatter(
        format: string,
        precision: number,
        hideTrailingZeroes: boolean,
        formatter: string
    ) : any {
        if (format === "Number" ||
            format === "Formatted Number" ||
            format === "Smart Number" ||
            format === "Datetime" ||

            //these are gone
            format === "Currency" ||
            format === "SmartCurrency") {

            return (value: any) => {
                //use precision
                var toReturn = value;

                // If we're formatted as a number, but input is string (in the case of long)
                // attempt to convert to number
                if (format === "Smart Number" || format === "Formatted Number") {
                    if (!_.isNumber(value)) {
                        value = _.isNumber(parseFloat(value)) ? parseFloat(value) : value;
                    }
                }

                if (value == null || value == undefined) {
                    return "";
                } else if (format === "Smart Number") {
                    //use commas, precision
                    toReturn = _.isNumber(value) ?
                        Tools.smartFormatNumber(value, precision) : _.escape(value);

                } else if (format === "Datetime") {
                    var datetime = value;
                    if (moment.isMoment(value) || moment.isDuration(value)) {
                        return (value as any).format(formatter);
                    }

                    if (Tools.isKDBTemporal(value)) {
                        return Tools.convertKDBTemporalToMoment(value).format(formatter);
                    }

                    if (typeof (value) === "number") {
                        datetime = new Date(value);
                    }

                    return toReturn = Tools.convertDateStringValueToMoment(datetime.toString()).format(formatter);
                }else if (format === "Formatted Number" && value.toFixed) {
                    //use commas, precision
                    toReturn = Tools.formatNumber(value, precision);
                } else if (value.toFixed) {
                    //Number
                    toReturn = value.toFixed(precision);
                } 
                else {
                    toReturn = _.escape(toReturn);
                }

                //remove trailing zeroes
                if (hideTrailingZeroes && toReturn.toString().indexOf(".") >= 0) {
                    while (toReturn[toReturn.length - 1] === "0") {
                        toReturn = toReturn.slice(0, -1);
                    }

                    //after removing zeroes remove decimal separator if it's the last character
                    if (toReturn[toReturn.length - 1] === ".") {
                        toReturn = toReturn.slice(0, -1);
                    }
                }
                

                return toReturn;
            };

        }
        else if (format === "General") {
            return (value: any) => {
                return (moment.isMoment(value) || moment.isDuration(value)) ?
                    (value as any).format() : _.escape(value);
            }
        } else if(format === "Boolean") {
            return (value: any) => _.escape(value);
        }
       
    }
    /** Converts  moment in to EChart compantible string
    * Echarts does not display invalid YYYY-MM-DD values such as 0000-00-00 that is 
    *  produced when moment formats value without thouse set.
    * Add fix number of years,month,days to resolve this. In case of duration conversion 
    *  if time overflow occurs eg. 25:00:00.000 is converted to 1day plus 01:00:00.000 
    *  so this results in 0000-00-01 01:00:00.000 adding year,month,day creates valid date.
    * NOTE! Timestamp and Datetime does not require this since it has year,month,day
    */
    public static convertTempralToEchart(value: number, kdbType: number): any {
        let format:string = Util.TEMPORALFORMATMAP[kdbType],
            m = Tools.convertKDBTemporalToMoment({
                i: value, n: 0, class: "12"+kdbType
            }),
            toReturn: any = value;
        
        // Date is timestamp
        // and month is converted in chart.ts > getDataAccessor()
        if( kdbType === 14 ||  kdbType === 13) {// return date timestamp unchanged 
            return value;
        }

        // time stamp and day time already have y,m,d set
        if(kdbType !== 12 && kdbType !== 15) {
            m.add(1970,"y").add(1,"M").add(1,"d");
        }
        

        toReturn = m.format(format);
        
        return new Date(toReturn).valueOf();
    }
    /**
     *  Round decimal number to non zero most significant digit
     * @param num - number to round
     */
    private static decimalRoundToFirstDigit (num: string| number) {
        let returnVal: number = Number(num),
            digitArr = String(num).split(".");

        if(digitArr.length > 1) {
            let decimal: number =  Number("0."+digitArr[1]);
            let magnitude = -Math.floor( Math.log(decimal) / Math.log(10) + 1) + 1;

            returnVal = Number(parseFloat(String(num)).toFixed(magnitude));
        }

        return returnVal;
    }
    
    /**
    * Shared helper function for tooltips used to filter our repeated data indexes
    * when used with 
    */
    public static filterTooltipArraySeries(series: any) {
            let returnAray: any[] = [],
                seriesTracker: any = {};
            
            _.each(series, (sr: any) => {
                //add seriesId key in not already pressen or assign empty array
                seriesTracker[sr.seriesId as string] = seriesTracker[sr.seriesId] || [];
                // Data entry does not exist with duplicate dataIndex
                if(seriesTracker[sr.seriesId].indexOf(sr.dataIndex) === -1) {
                    seriesTracker[sr.seriesId].push(sr.dataIndex);
                    returnAray.push(sr);
                }
            });
    
            return returnAray;
        }
    /**
     * Calculate start and end coordinates of linear regression line from set of x, y 
     * 	and calculated AXIS min max depening on user settings use dataSetRange, 
     * userDefined or Echart calculation based on dataRange but rounde to nearest greater, 
     * lower integer 
     */
    public static getLinearRegresionLineCoords(x: Array<any>, y: Array<any>, axisMinMax: any): any {
        let lr = Util.linearRegression(x,y),
            // Can be object with min/max or array [min,max]
            minX: number = (axisMinMax.XAxis.min !== undefined
                ? axisMinMax.XAxis.min : axisMinMax.XAxis[0]),
            maxX: number = (axisMinMax.XAxis.max !== undefined
                ? axisMinMax.XAxis.max : axisMinMax.XAxis[1]),
            minY: number = (axisMinMax.YAxis.min !== undefined
                ? axisMinMax.YAxis.min : axisMinMax.YAxis[0]),
            maxY: number = (axisMinMax.YAxis.max !== undefined 
                ? axisMinMax.YAxis.max : axisMinMax.YAxis[1]),
            slopeIsZero = (lr.slope === 0);
        // Calc meanLine starting point [x, y] using  min/max of xAxis  with formula
        // y = slope * x - intercept
        let minXStart: Array<number> = [minX, ((lr.slope * minX) + lr.intercept)],
        // Calc meanLne end potin [x, y]
            minXEnd: Array<number> = [maxX, ((lr.slope * maxX) + lr.intercept)];
        let formula = ""
        try {
            //Currently calculate based on x min/max
            formula = Util.linearRegressionFormulaStr(minX, maxX, lr.slope, lr.intercept, false);
        } catch(e) {
            QuickBase.Log.Warn(
                "Scatter: can not generate formula, check axis data type matching data ", x, y
                );
        }
           
        let returnSet = {startXY: minXStart, endXY: minXEnd, formula: formula};

        // x = (y-intercept) / slope

        if(!slopeIsZero) {
            let minYStart: Array<number> = [(minY - lr.intercept)/lr.slope,	minY], 
                minYEnd: Array<number> = [(maxY - lr.intercept)/lr.slope, maxY];

            try {
                //Currently calculate based on x min/max
                returnSet.formula = 
                    Util.linearRegressionFormulaStr(minY, maxY, lr.slope, lr.intercept, true);
            } catch(e) {
                QuickBase.Log.Warn(
                    "Scatter: can not generate formula, check axis data type matching data ", x, y
                    );
            }
            //Use xAxis min max by default
            // If meanLine start y coord coordinate overflows expected calculated y-axis min 
            if(minXStart[1] < minY || minXStart[1] > maxY) {
                returnSet.startXY = minYStart;
            }
            // If end y coord overflows expected calculated y-axis min 
            if( minXEnd[1] > maxY) {
                returnSet.endXY = minYEnd;
            }

        } else { console.log("! Median Line slope is 0, reverting back to x min/max"); }

        // console.log("minMaxData: ", axisMinMax);
        // console.log("meanLine result: ", returnSet);
        return returnSet;
    }
    // Check if number is decimal
    public static isDecimal(num: number | string): boolean {    
        return String(num).indexOf(".") !== -1;
    }
    /**
     * Function calculates linear regression for numeric values of x, y axis
     */
    public static linearRegression (x: Array<any>, y: Array<any>): any{
        var lr: {[index:string]:any} = {},
            n = y.length,
            sumX = 0,
            sumY = 0,
            sumXY = 0,
            sumXX = 0,
            sumYY = 0;

        for (var i = 0; i < y.length; i++) {
            sumX += x[i];
            sumY += y[i];
            sumXY += (x[i] * y[i]);
            sumXX += (x[i] * x[i]);// x^2
            sumYY += (y[i] * y[i]);// y^2
        }

        lr['slope'] = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX); // b | m
        lr['intercept'] = (sumY - lr.slope * sumX) / n; // a | b
        lr['r2'] = Math.pow((n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY)), 2);

        return lr;
    }

    public static pump(object: any): any { // unflatten
        if (object == null || object == undefined) {
            return;
        }

        if (!_.isObject(object)) {
            return object; // primitive type
        }

        var _proto: any = Object.getPrototypeOf(object);
        if (_.isObject(object) && _proto !== Object.prototype && _proto !== Array.prototype) {
            // we might be dealing with complex objects, i.e datasources, viewstates etc...
            return object;
        }

        if (_proto === Array.prototype) {
            return object.map(Util.pump);
        }

        var flatArrayRe: RegExp = /^(\d+)((?:\.\w+)+)$/;

        var isFlatArray: boolean = Object.keys(object).every((key: string): boolean => {
            return flatArrayRe.test(key);
        });

        if (isFlatArray) {
            interface fragment {index:number, tail:string, value:any}
            return Object.keys(object).map((key: string): fragment => {
                const re: RegExpExecArray = flatArrayRe.exec(key)!;
                return {
                    index: Number(re[1]),
                    tail: re[2].substring(1),
                    value: object[key]
                };
            }).reduce((a: any[], b: fragment): any[] => {
                var value: any = {};
                value[b.index] = {};
                value[b.index][b.tail] = b.value;
                return $.extend(true, a, Util.pump(value));
            }, []);
        }

        var flatObjectRe: {greedy: RegExp, nonGreedy: RegExp} = {
            greedy: /^(\w+)((?:\.\w+)*)$/,
            nonGreedy: /^(\w+)((?:\.\w+)+)$/
        };

        var isFlatObject: boolean = Object.keys(object).some((key: string): boolean => {
            return flatObjectRe.nonGreedy.test(key);
        });

        if (isFlatObject) {
            interface fragment {head:string, tail:string | null, value:any}
            return Object.keys(object).map((key: string): fragment => {
                var re: RegExpExecArray = flatObjectRe.greedy.exec(key)!;
                return {
                    head: re[1],
                    tail: (re[2] !== '') ? re[2].substring(1) : null,
                    value: object[key]
                };
            }).reduce(function (a: any, b: fragment): any {
                var value: any = {},
                    isDeep = b.tail !== null;
                if (isDeep) {
                    value[b.head] = {};
                    value[b.head][b.tail!] = b.value;
                } else {
                    value[b.head] = b.value;
                }
                return $.extend(true, a, Util.pump(value));
            }, {});
        }

        // we're dealing with normal (unflattened) object
        return _.mapValues(object, Util.pump);
    }

    /** Helper function to generate formula used for mark line calculation */
    public static linearRegressionFormulaStr(min: number, max: number, slope: number, 
        intercept: number, solvingForY: boolean): string {
        
        let pMin: number | string = 
                (Util.isDecimal(min) ? Util.decimalRoundToFirstDigit(min) : min),
            pMax: number | string = 
                (Util.isDecimal(max) ?  Util.decimalRoundToFirstDigit(max): max),
            pSlope: number | string = 
                (Util.isDecimal(slope) ?  Util.decimalRoundToFirstDigit(slope): slope),
            pIntr: number | string = 
                (Util.isDecimal(intercept) ?  Util.decimalRoundToFirstDigit(intercept) : intercept);

        let formula: string = 
            "[x = " + pMin +", y = ((" + pSlope +" * "+pMin+")" + " + (" + pIntr+")]\n"+
            "[x = " + pMax +", y = ((" + pSlope +" * "+pMax+")" + " + (" + pIntr+")]";
        
        if(solvingForY) {
            formula = 
                "[x = (" + pMin + " - (" + pIntr + ")) / " + pSlope + ", y = "+ pMin +"]\n"+
                "[x = (" + pMax + " - (" + pIntr + ")) / " + pSlope + ", y = " + pMax + "]";
        }

        return formula;
    }

    private static replaceViewStates(key: string, value: any, replaceFn: VSValueReplacer|VSModelReplacer, api: any): any { // replace viewStates with the replaceFn
        interface _Map { (v:any,k:string|number):any }
        interface _Mapper { (c:Object|Array<any>, fn:_Map):any }

        let _map: _Map = (v,k)=>substitue(v,k,key||'');
        let _mapper: _Mapper = (_.isArray(value)) ? _.map : _.mapValues;
        return _mapper(value, _map);

        function substitue(v:any, k:string|number, rootKey:string): any {
            rootKey = ((rootKey)?rootKey+'.':''); k = k + '';
            var meta = api.getPropertyMeta(rootKey+k);

            if (meta && meta.type === 'data') {
                return v;
            } else if (meta && meta.type === 'viewstate') {
                let splitKey = (rootKey+k).split('.'), key = splitKey.pop()!, path = splitKey.join('.');
                return replaceFn(path, key, v, meta);
            } else if ((_.isArray(v) || _.isObject(v)) &&
                !(v.has && v.has("_dataSource") && v.has("_dataType"))) {

                // Note: gk
                // value v needs to checked that it is not a DocumentDataModel
                // otherwise the substitute will attempt to pointlessly recurse 
                // through the internal datasturcture of this model resulting in stack size exceeded

                rootKey = rootKey+k;
                _map = (v,k)=>substitue(v,k,rootKey);
                _mapper = (_.isArray(v)) ? _.map : _.mapValues;
                return _mapper(v, _map);
            } else {
                return v;
            }
        }
    }

    public static replaceViewStatesWithValue(key: string, value: any, api: any): any { // replace viewStates models by their values
        let replaceFn: VSValueReplacer = (path: string, key: string, value: any, meta: any): any => {
            if (meta.value !== value) {
                console.warn('viewModel value has changed');
            }
            return meta.value;
        };
        return Util.replaceViewStates(key, value, replaceFn, api);
    }

    public static replaceViewStatesWithModel(key:string, value: any, api: any): any/*ViewState*/ { // replace viewStates values by their models
        let replaceFn: VSModelReplacer = (path: string, key: string, value: any, meta: any): any/*ViewState*/ => {
            if ((value instanceof Backbone.Model) && value.get('_viewType')) return value;
            var model = api.getProperty(path)[key];
            if (_.isUndefined(value)) {
                return undefined; // unset viewModel
            } else if (model.get('value') !== value) {
                console.warn('viewModel value has changed');
                model.set('value', value);
            }
            return model;
        }
        return Util.replaceViewStates(key, value, replaceFn, api);
    }

    public static alpha(color: string, opacity: number): string {
        let rgb = this.hex2RGB(color);
        return rgb ? `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity/100})` :
        new Color(color).alpha(opacity / 100.0).rgbaString();
    }

    public static colorFactory(prefix: string, color = "#4f6aa6", opacity = 80): DynamicSchema<PrimitiveProperty> {
        var colorSetting: any = {}
        colorSetting[prefix + "Color"] = {
            "title": prefix.replace("Point", "").replace("Hover", "Hover ").replace("Border", "Border ").replace("Background", "Background ") + "Color",
            "type": "gradient",
            "default": color,
            "options": {
                "gradient": false
            }
        };
        colorSetting[prefix + "Opacity"] = {
            "title": prefix.replace("Point", "").replace("Hover", "Hover ").replace("Border","Border ").replace("Background","Background ") + "Opacity",
            "default": opacity,
            "minimum": 0,
            "maximum": 100,
            "type": "number",
            "step": 1,
            "format": "range"
        }
        return colorSetting as DynamicSchema<PrimitiveProperty>;
    }

    public static backgroundFactory(prefix: string): DynamicSchema<PrimitiveProperty> {
        return Util.colorFactory(prefix + 'Background');
    }

    public static borderFactory(prefix: string): DynamicSchema<PrimitiveProperty> {
        var borderSettings: any = {};
        borderSettings[prefix + "BorderWidth"] = {
            "title": prefix.replace("Point", "").replace("Hover", "Hover ") + " Border Width",
            "type": "number",
            "format": "range",
            "default": 2.01,
            "minimum": 0.01, // 0.01 because 0 defaults to 3 ><
            "maximum": 10.01
        };
        return ($.extend(true, {},
            Util.colorFactory(prefix + 'Border'),
            borderSettings
        )) as DynamicSchema<PrimitiveProperty>;
    }

    public static radiusFactory(prefix: string): DynamicSchema<NumberProperty> {
        var radiusSettings: any = {};
        radiusSettings[prefix + 'Radius'] = {
            "title": prefix.replace("Point", "").replace("Hover", "Hover ").replace("Hit","Hit ") + "Radius",
            "type": "number",
            "format": "range",
            "default": 0,
            "minimum": 0,
            "maximum": 10
        };
        return radiusSettings as DynamicSchema<NumberProperty>;
    }
    public static sortArrayAcs (dataArr: Array<any>) {
         return _.clone(dataArr).sort((a: any, b: any): any => {
            // Prevent error being thrown
            let isNull = Number(a === null) - Number(b === null);
            return isNull || +(a>b)||-(a<b)
        });
    }
    public static typeFactory(type: string): DynamicSchema<StringProperty> {
        return {
            "_Type": {
                "type": "string",
                "default": type,
                "options": {
                    "hidden": true
                }
            }
        };
    }    
}
