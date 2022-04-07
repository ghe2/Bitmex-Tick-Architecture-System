/// <reference types="lodash" />
/// <reference types="jquery" />
/// <reference path="chartjs-color.d.ts" />

interface Fragment {
    index?: number;
    tail?: string | null;
    head?: string | null;
    value;
}

// replace viewStates with the replaceFn
interface UtilMap {
    (v, k: string | number);
}
interface UtilMapper {
    (c, fn: UtilMap);
}

// === Object.assign polyfill for IE11 == //
if (typeof Object.assign !== "function") {
    // Must be writable: true, enumerable: false, configurable: true
    Object.defineProperty(Object, "assign", {
        value: function assign(target) {
            // .length of function is 2
            "use strict";
            if (target === null) {
                // TypeError if undefined or null
                throw new TypeError("Cannot convert undefined or null to object");
            }

            const to = Object(target);
            // eslint-disable-next-line
            _.each(arguments, nextSource => {
                if (nextSource !== null) {
                    // Skip over if undefined or null
                    for (const nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            });

            return to;
        },
        writable: true,
        configurable: true,
    });
}

interface VSValueReplacer {
    (path: string, key: string, value, api);
}
interface VSModelReplacer {
    (path: string, key: string, value, api /*ViewState*/);
}

interface TypedCallback<T> {
    (...args): T;
}
interface DynamicSchema<T> {
    [index: string]: T;
}

interface BaseCache {
    model: Axis;
}
interface LoadCache extends BaseCache {
    load: string[];
    defaults;
}
interface SaveCache extends BaseCache {
    store: string[];
}
type CacheOptions = LoadCache | SaveCache;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Util {
    public static cache(model, modelPath: string, options: CacheOptions, api): void {
        if (_.isArray((options as LoadCache).load)) {
            const cachedAttributes = (options as LoadCache).load.reduce(
                (a, b: string, i: number): {} => {
                    if (!model.cache) {
                        return a;
                    }
                    let cached = model.cache[b];

                    if (cached && cached.get("_viewType")) {
                        const viewState = cached;
                        cached = cached.get("value");
                        const splitKey: string[] = (modelPath + b).split(".");
                        const tailKey: string | undefined = splitKey.pop();
                        const headKey: string = splitKey.join(".");
                        const wrapper = {}; // can't set(a.b, model) or stackoverflow, have to set(a, {b: model}) instead RF
                        if (tailKey) {
                            wrapper[tailKey] = viewState;
                            api.setProperty(headKey, wrapper, { bypass: true });
                        }
                    }
                    a[b] =
                        cached ||
                        ((options as LoadCache).defaults && (options as LoadCache).defaults[i]);
                    // delete model.cache[b]; // remove retrieved items from cache?  RF
                    return a;
                },
                {},
            );
            model.set(cachedAttributes);
        }

        if (_.isArray((options as SaveCache)["store"])) {
            const attributesToCache = (options as SaveCache).store.reduce((a, b: string) => {
                const path: string[] = (modelPath + b).split(".");
                const key: string | undefined = path.pop();
                if (key) {
                    a[b] = api.getProperty(path.join("."))[key];
                }
                return a;
            }, {});
            _.extend(model.cache, attributesToCache);
            const attributesToUnset = (options as SaveCache).store.reduce(function(a, b: string) {
                a[b] = undefined;
                return a;
            }, {});
            model.set(attributesToUnset /*, {unset: true}*/);
        }
    }

    public static compareKDBTimes(a, b): 1 | 0 | -1 {
        return a.i > b.i ? 1 : a.i < b.i ? -1 : a.n > b.n ? 1 : a.n < b.n ? -1 : 0;
    }

    public static convertPropertyIfMoment(value): moment.Moment | moment.Duration {
        const kdbLikeObj = Tools.convertISODatetimeToKDBLikeObject(value);
        return Tools.isKDBTemporal(kdbLikeObj)
            ? Tools.convertKDBTemporalToMoment(kdbLikeObj)
            : kdbLikeObj;
    }

    public static expandNestedViewStates(settings, api): {} {
        const NESTED_KEY_REGEX = /([a-zA-Z]+)\.[0-9]+\./;
        const keys: string[] = Object.keys(settings);
        let rootKeys: string[] = [];
        const allViewStates: boolean = _.every(keys, () => {
            const meta = api.getPropertyMeta(keys[0]);
            return meta && meta.type === "viewstate";
        });

        if (allViewStates) {
            rootKeys = _.uniq(
                _.filter(
                    _.map(keys, k => {
                        const nestedArrayRe = NESTED_KEY_REGEX.exec(k);
                        return nestedArrayRe ? nestedArrayRe[1] : null;
                    }) as string[],
                ),
            );
        }

        if (rootKeys.length) {
            const expandedSettings = {};
            _.each(rootKeys, k => (expandedSettings[k] = api.getProperty(k)));
            return expandedSettings;
        }

        return settings;
    }

    public static focus2Array(value): Array<Array<string>> {
        const result: Array<Array<string>> = [];
        const multiRx = /^\[([^\]]*)]$/;
        const focusValidRx = /^(?:"[^"\\]*(?:\\[\S\s][^"\\]*)*")(?:,"[^"\\]*(?:\\[\S\s][^"\\]*)*")*/;
        const focusValueRx = /"([^"]*)"/g;
        const focus = value.toString ? value.toString() : "";

        // if multiple paths
        const rxResult = multiRx.exec(focus);
        if (rxResult !== null) {
            if (focusValidRx.test(rxResult[1])) {
                let valueResult;
                while ((valueResult = focusValueRx.exec(rxResult[1])) !== null) {
                    //let msg = 'Found ' + valueResult[1] + '. ';
                    //msg += 'Next match starts at ' + focusValueRx.lastIndex;
                    //console.log(msg);
                    result.push(
                        _.map(valueResult[1].split(","), (key: string) =>
                            key.replace(/&#44;/g, ","),
                        ),
                    );
                }
            }
        } else {
            result.push(focus.split(","));
        }

        return _.filter(result, function(f) {
            return ("" + f).length > 0;
        });
    }

    /**
     * @function RGB2hex
     * @param {string} hex - Hexadecimal Color
     * @returns {number[]} RGB Array
     * Converts hex value to RGB Array
     */
    public static hex2RGB(hex: string): number[] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) {
            return [255, 255, 255];
        }
        return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
    }

    /**
     * @function RGB2hex
     * @param {number[]} rgb - RGB Value Array
     * @returns {string} Hexadecimal Color
     * Converts array of RGB values to hex value
     */
    public static RGB2hex(rgb: number[]): string {
        return "#" + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
    }

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
    public static interpolateColor(
        palette: { type: string }[],
        low: number,
        high: number,
        x: number,
    ): string {
        const tick = (high - low) / (palette.length - 1);
        let loc = this.clamp((x - low) / tick, 0, palette.length - 1);
        loc = _.isNaN(loc) ? 0 : loc;
        const locolorHex = palette[Math.floor(loc)].type;
        const hicolorHex = palette[Math.ceil(loc)].type;
        const locolorRGB = this.hex2RGB(locolorHex);
        const hicolorRGB = this.hex2RGB(hicolorHex);
        const factor = loc - Math.floor(loc);
        const result = locolorRGB.slice();
        for (let i = 0; i < 3; i++) {
            result[i] = Math.round(result[i] + factor * (hicolorRGB[i] - locolorRGB[i]));
        }
        return this.RGB2hex(result);
    }

    public static getConditionResult(a, b, operator: string): boolean {
        const FilterComparer = {
            //both arguments are in lowercase
            isMatch: function(complexfilter: string, valInCell: string): boolean {
                let tokens;
                let i;
                let isOrCondition = false;

                //split by spaces & "and" operator
                //  test:    "first second  third and four  and  five fernanda".split(/ +and +| +/)
                tokens = complexfilter.split(/ +and +| +/);
                //tokens can contain now:   or ,  *,  -   (and was eliminated)

                //if "or" operator is present, all conditions are considered "or"
                //TODO specify operator priority, add brackets
                if (_.includes(tokens, "or")) {
                    tokens = _.without(tokens, "or");
                    isOrCondition = true;
                }

                for (i = 0; i < tokens.length; i++) {
                    //don't wrap in * if * is already present
                    if (tokens[i].indexOf("-") !== 0 && tokens[i].indexOf("*") < 0) {
                        tokens[i] = "*" + tokens[i] + "*";
                    }
                }

                return _[isOrCondition ? "some" : "every"](tokens, function(t) {
                    return FilterComparer.isSimpleMatch(t, valInCell);
                });
            },

            isSimpleMatch: (simplefilter: string, valInCell: string): boolean => {
                let isNegation = false;

                if (simplefilter.indexOf("-") === 0) {
                    simplefilter = simplefilter.replace("-", "");
                    isNegation = true;
                }
                //test:     (new RegExp("^.*456.*$")).test("456")
                //TODO cache compiled regexes
                const isMatch = new RegExp("^" + simplefilter.replace(/\*/g, ".*") + "$").test(
                    valInCell,
                );

                return isNegation ? !isMatch : isMatch;
            },
        };
        let toReturn = false,
            x = isNaN(parseFloat(a)) || _.isObject(a) ? ("" + a).toLowerCase() : parseFloat(a),
            y = isNaN(parseFloat(b)) || _.isObject(b) ? ("" + b).toLowerCase() : parseFloat(b);

        const dateTimeClass = ["1212", "1213", "1214", "1215"];
        const durationClass = ["1216", "1217", "1218", "1219"];
        if (a && a.class && dateTimeClass.indexOf(a.class) >= 0) {
            x = Tools.convertKDBTemporalToMoment(a).unix();
            if (operator === "in") {
                const timeList: number[] = [];
                _.each(b.toString().split(","), function(t) {
                    timeList.push(Tools.convertDateStringValueToMoment(t).unix());
                    y = timeList.toString();
                });
            } else {
                y = Tools.convertDateStringValueToMoment(b).unix();
            }
        } else if (a && a.class && durationClass.indexOf(a.class) >= 0) {
            x = Tools.convertKDBTemporalToMoment(a).valueOfNano();
            if (operator === "in") {
                const timeList: number[] = [];
                _.each(b.toString().split(","), function(t) {
                    timeList.push(Tools.convertDateStringValueToMoment(t).valueOfNano());
                    y = timeList.toString();
                });
            } else {
                y = Tools.convertDateStringValueToMoment(b).valueOfNano();
            }
        }

        switch (operator) {
            case "contains":
                toReturn = x.toString().indexOf(y.toString()) >= 0;
                break;

            case "starts with":
                toReturn = x.toString().indexOf(y.toString()) === 0;
                break;

            case "ends with":
                toReturn =
                    x
                        .toString()
                        .indexOf(y.toString(), x.toString().length - y.toString().length) !== -1;
                break;

            case "==":
                toReturn = x === y;
                break;

            case "<":
                toReturn = x < y;
                break;

            case ">":
                toReturn = x > y;
                break;

            case "<=":
                toReturn = x <= y;
                break;

            case ">=":
                toReturn = x >= y;
                break;

            case "!=":
                toReturn = x !== y;
                break;
            case "in":
                toReturn =
                    y
                        .toString()
                        .split(",")
                        .indexOf(x.toString()) >= 0;
                break;
            case "search":
                toReturn = FilterComparer.isMatch(y as string, x as string);
                break;

            case "regexp":
                const re = new RegExp(b.toString());
                toReturn = re.test(a ? a.toString() : "");
                break;

            default:
                break;
        }

        return toReturn;
    }

    public static isDuration(val): boolean {
        return (
            _.get(val, "_kdbType") && ["1216", "1217", "1218", "1219"].indexOf(val._kdbType) >= 0
        );
    }

    public static getFormatter(
        format: string,
        precision: number,
        hideTrailingZeroes: boolean,
        formatter: string,
    ): (value) => string | number | undefined {
        if (
            format === "Number" ||
            format === "Formatted Number" ||
            format === "Smart Number" ||
            format === "Datetime" ||
            //these are gone
            format === "Currency" ||
            format === "SmartCurrency"
        ) {
            return (value): string | number | undefined => {
                //use precision
                let toReturn = value;

                // If we're formatted as a number, but input is string (in the case of long)
                // attempt to convert to number
                if (format === "Smart Number" || format === "Formatted Number") {
                    if (!_.isNumber(value)) {
                        value = _.isNumber(parseFloat(value)) ? parseFloat(value) : value;
                    }
                }

                if (value === null || value === undefined) {
                    return "";
                } else if (format === "Smart Number") {
                    //use commas, precision
                    toReturn = _.isNumber(value)
                        ? Tools.smartFormatNumber(value, precision)
                        : _.escape(value);
                } else if (format === "Datetime") {
                    let datetime = value;
                    if (moment.isMoment(value) || moment.isDuration(value)) {
                        return (value = Util.isDuration(value)
                            ? Tools.convertValueToMoment(value.valueOf()).format(formatter)
                            : value.format(formatter));
                    }

                    if (Tools.isKDBTemporal(value)) {
                        return Tools.convertKDBTemporalToMoment(value).format(formatter);
                    }

                    if (typeof value === "number") {
                        datetime = new Date(value);
                    }

                    return (toReturn = Tools.convertDateStringValueToMoment(
                        datetime.toString(),
                    ).format(formatter));
                } else if (format === "Formatted Number" && value.toFixed) {
                    //use commas, precision

                    toReturn = _.isNaN(value) ? "" : Tools.formatNumber(value, precision);
                } else if (value.toFixed) {
                    //Number
                    toReturn = value.toFixed(precision);
                } else {
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
        } else if (format === "Boolean") {
            return (value): string | number | undefined => {
                return _.escape(value);
            };
        } else {
            return (value): string | number | undefined => {
                const isMoment = moment.isMoment(value) || moment.isDuration(value);
                const fmtParam = format === "General" ? undefined : formatter;
                return isMoment ? value.format(fmtParam, undefined) : _.escape(value);
            };
        }
    }

    public static pump(object): T {
        // unflatten
        if (object === null || object === undefined) {
            return object;
        }

        if (!_.isObject(object)) {
            return object; // primitive type
        }

        const _proto = Object.getPrototypeOf(object);
        if (_.isObject(object) && _proto !== Object.prototype && _proto !== Array.prototype) {
            // we might be dealing with complex objects, i.e datasources, viewstates etc...
            return object;
        }

        if (_proto === Array.prototype && _.isArray(object)) {
            return object.map(Util.pump);
        }

        const flatArrayRe = /^(\d+)((?:\.\w+)+)$/;

        const isFlatArray: boolean = Object.keys(object).every((key: string): boolean => {
            return flatArrayRe.test(key);
        });

        if (isFlatArray) {
            return Object.keys(object)
                .map(
                    (key: string): Fragment => {
                        const re: RegExpExecArray | null = flatArrayRe.exec(key);
                        if (_.isNil(re)) {
                            return {
                                index: 0,
                                tail: undefined,
                                value: undefined,
                            };
                        }
                        return {
                            index: Number(re[1]),
                            tail: re[2].substring(1),
                            value: object[key],
                        };
                    },
                )
                .reduce((a: T, b: Fragment): T => {
                    const value = {};
                    const idx = b.index === undefined ? 0 : b.index;
                    value[idx] = {};
                    value[idx][b.tail] = b.value;
                    return $.extend(true, a, Util.pump(value));
                }, []);
        }

        const flatObjectRe: { greedy: RegExp; nonGreedy: RegExp } = {
            greedy: /^(\w+)((?:\.\w+)*)$/,
            nonGreedy: /^(\w+)((?:\.\w+)+)$/,
        };

        const isFlatObject: boolean = Object.keys(object).some((key: string): boolean => {
            return flatObjectRe.nonGreedy.test(key);
        });

        if (isFlatObject) {
            return Object.keys(object)
                .map(
                    (key: string): Fragment => {
                        const re: RegExpExecArray | null = flatObjectRe.greedy.exec(key);
                        return {
                            head: _.isNil(re) ? null : re[1],
                            tail: _.isNil(re) || re[2] === "" ? null : re[2].substring(1),
                            value: object[key],
                        };
                    },
                )
                .reduce(function(a, b: Fragment): T {
                    const value = {};
                    const isDeep = b.tail !== null;
                    const head = _.isNil(b.head) ? 0 : b.head;
                    const tail = _.isNil(b.tail) ? 0 : b.tail;
                    if (isDeep) {
                        value[head] = {};
                        value[head][tail] = b.value;
                    } else {
                        value[head] = b.value;
                    }
                    return $.extend(true, a, Util.pump(value));
                }, {});
        }

        // we're dealing with normal (unflattened) object
        return _.mapValues(object, Util.pump);
    }

    public static replaceViewStatesWithValue(key: string, value, api): {} {
        // replace viewStates models by their values
        const replaceFn: VSValueReplacer = (path: string, key: string, value, meta) => {
            if (meta.value !== value) {
                console.warn("viewModel value has changed");
            }
            return meta.value;
        };
        return Util.replaceViewStates(key, value, replaceFn, api);
    }

    public static replaceViewStatesWithModel(key: string, value, api): {} {
        // replace viewStates values by their models
        const replaceFn: VSModelReplacer = (path: string, key: string, value): {} => {
            if (value instanceof Backbone.Model && value.get("_viewType")) return value;
            const model = api.getProperty(path)[key];
            if (model.get("value") !== value) {
                model.set("value", value);
            }
            return model;
        };
        return Util.replaceViewStates(key, value, replaceFn, api);
    }

    public static alpha(color: string, opacity: number): string {
        const rgb = this.hex2RGB(color);
        return rgb
            ? `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${opacity / 100})`
            : new Color(color).alpha(opacity / 100.0).rgbaString();
    }

    public static colorFactory(
        prefix: string,
        color = "#0061FF",
        opacity = 80,
    ): DynamicSchema<PrimitiveProperty> {
        const colorSetting = {};
        colorSetting[prefix + "Color"] = {
            title:
                prefix
                    .replace("Point", "")
                    .replace("Hover", "Hover ")
                    .replace("Border", "Border ")
                    .replace("Background", "Background ") + "Color",
            type: "gradient",
            default: color,
            options: {
                gradient: false,
            },
        };
        colorSetting[prefix + "Opacity"] = {
            title:
                prefix
                    .replace("Point", "")
                    .replace("Hover", "Hover ")
                    .replace("Border", "Border ")
                    .replace("Background", "Background ") + "Opacity",
            default: opacity,
            minimum: 0,
            maximum: 100,
            type: "number",
            step: 1,
            format: "range",
        };
        return colorSetting as DynamicSchema<PrimitiveProperty>;
    }

    public static backgroundFactory(prefix: string): DynamicSchema<PrimitiveProperty> {
        return Util.colorFactory(prefix + "Background");
    }

    public static borderFactory(prefix: string): DynamicSchema<PrimitiveProperty> {
        const borderSettings = {};
        borderSettings[prefix + "BorderWidth"] = {
            title: prefix.replace("Point", "").replace("Hover", "Hover ") + " Border Width",
            type: "number",
            format: "range",
            default: 2.01,
            minimum: 0.01, // 0.01 because 0 defaults to 3 ><
            maximum: 10.01,
        };
        return $.extend(true, {}, Util.colorFactory(prefix + "Border"), borderSettings);
    }

    public static radiusFactory(prefix: string): DynamicSchema<NumberProperty> {
        const radiusSettings = {};
        radiusSettings[prefix + "Radius"] = {
            title:
                prefix
                    .replace("Point", "")
                    .replace("Hover", "Hover ")
                    .replace("Hit", "Hit ") + "Radius",
            type: "number",
            format: "range",
            default: 0,
            minimum: 0,
            maximum: 10,
        };
        return radiusSettings as DynamicSchema<NumberProperty>;
    }

    public static typeFactory(type: string): DynamicSchema<StringProperty> {
        return {
            _Type: {
                type: "string",
                default: type,
                options: {
                    hidden: true,
                },
            },
        };
    }

    private static replaceViewStates(
        key: string,
        value,
        replaceFn: VSValueReplacer | VSModelReplacer,
        api,
    ): {} {
        let _map: UtilMap;
        let _mapper: UtilMapper;

        function substitue(v, k: string | number, rootKey: string): {} {
            rootKey = rootKey ? rootKey + "." : "";
            k = k + "";
            const meta = api.getPropertyMeta(rootKey + k);
            // eslint-disable-next-line
			var hasData = v && v.has && v.has("_dataSource") && v.has("_dataType");
            const arrayObjWithoutData = (_.isArray(v) || _.isObject(v)) && !hasData;

            if (meta && meta.type === "data") {
                return v;
            } else if (meta && meta.type === "viewstate") {
                const splitKey = (rootKey + k).split(".");
                const key = splitKey.pop();
                const path = splitKey.join(".");
                return replaceFn(path, key === undefined ? "" : key, v, meta);
            } else if (arrayObjWithoutData) {
                // Note: gk
                // value v needs to checked that it is not a DocumentDataModel
                // otherwise the substitute will attempt to pointlessly recurse
                // through the internal datasturcture of this model resulting in stack size exceeded

                rootKey = rootKey + k;
                _map = (v, k): {} => substitue(v, k, rootKey);
                // eslint-disable-next-line @typescript-eslint/unbound-method
                _mapper = _.isArray(v) ? _.map : _.mapValues;
                return _mapper(v, _map);
            } else {
                return v;
            }
        }

        _map = (v, k): {} => substitue(v, k, key || "");
        // eslint-disable-next-line @typescript-eslint/unbound-method
        _mapper = _.isArray(value) ? _.map : _.mapValues;
        return _mapper(value, _map);
    }
}
