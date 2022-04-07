/// <reference types="lodash" />
/// <reference types="jquery" />

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

interface VSValueReplacer {
    (path: string, key: string, value, api);
}
interface VSModelReplacer {
    (path: string, key: string, value, api);
}
interface TypedCallback<T> {
    (...args: []);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
class Util {
    public static compareKDBTimes(a, b): number {
        return a.i > b.i ? 1 : a.i < b.i ? -1 : a.n > b.n ? 1 : a.n < b.n ? -1 : 0;
    }

    public static expandNestedViewStates(settings, api: QuickBase.ComponentApi): {} {
        let isViewState = false;
        const keys: string[] = Object.keys(settings);
        if (keys.length === 1) {
            const meta = api.getPropertyMeta(keys[0]);
            isViewState = meta && meta.type === "viewstate";
        }
        if (isViewState) {
            const nestedArrayRe: RegExpExecArray | null = /^((?:\w+\.)*)(\d+)/.exec(keys[0]);
            if (nestedArrayRe) {
                const rootKey: string = nestedArrayRe[1].slice(0, -1);
                const expandedArray = api.getProperty(rootKey);
                const expandedSettings = {};
                expandedSettings[rootKey] = expandedArray;
                return expandedSettings;
            }
        }
        return settings;
    }

    public static focus2Array(value): string[][] {
        const result: string[][] = [];
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
        return _.filter(result, f => ("" + f).length > 0);
    }

    public static getConditionResult(a, b, operator, inverse: boolean): boolean {
        const FilterComparer = {
            // both arguments are in lowercase
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
        let toReturn = false;
        const x = isNaN(parseFloat(a)) ? ("" + a).toLowerCase() : parseFloat(a);
        const y = isNaN(parseFloat(b)) ? ("" + b).toLowerCase() : parseFloat(b);

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

            case "search":
                toReturn = FilterComparer.isMatch(y as string, x as string);
                break;

            case "regexp":
                const re = new RegExp(b.toString());
                toReturn = re.test(a.toString());
                break;

            default:
                break;
        }
        if (inverse) {
            toReturn = !toReturn;
        }

        return toReturn;
    }

    public static getHexSaturation(hex: string, saturation: number): string {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) {
            return "#ffffff";
        }
        let r = result[1] ? parseInt(result[1], 16) : 0;
        let g = result[2] ? parseInt(result[2], 16) : 0;
        let b = result[3] ? parseInt(result[3], 16) : 0;

        // RBG TO HSV
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h;
        let s;
        const v = max;

        const d = max - min;
        s = max === 0 ? 0 : d / max;

        if (max === min) {
            h = 0;
        } else {
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        s = 0.2 + saturation * 0.8;
        // HSV TO RGB

        const i = Math.floor(h * 6);
        const f = h * 6 - i;
        const p = v * (1 - s);
        const q = v * (1 - f * s);
        const t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                (r = v), (g = t), (b = p);
                break;
            case 1:
                (r = q), (g = v), (b = p);
                break;
            case 2:
                (r = p), (g = v), (b = t);
                break;
            case 3:
                (r = p), (g = q), (b = v);
                break;
            case 4:
                (r = t), (g = p), (b = v);
                break;
            case 5:
                (r = v), (g = p), (b = q);
                break;
        }
        r = parseInt(r.toString(), 10);
        g = parseInt(g.toString(), 10);
        b = parseInt(b.toString(), 10);

        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }

    public static getSaturatedArray(hex: string): string[] {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) {
            return ["#ffffff"];
        }
        const r = result[1] ? parseInt(result[1], 16) : 0;
        const g = result[2] ? parseInt(result[2], 16) : 0;
        const b = result[3] ? parseInt(result[3], 16) : 0;

        // RBG TO HSV
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h;
        let s;
        const v = max;

        const d = max - min;
        s = max === 0 ? 0 : d / max;

        if (max === min) {
            h = 0; // achromatic
        } else {
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }

            h /= 6;
        }

        const HexArray: string[] = [];
        _.each([0.2, 0.28, 0.36, 0.44, 0.52, 0.6, 0.68, 0.76, 0.84, 0.92, 0.1], d => {
            s = d;
            // HSV TO RGB
            let r;
            let g;
            let b;
            const i = Math.floor(h * 6);
            const f = h * 6 - i;
            const p = v * (1 - s);
            const q = v * (1 - f * s);
            const t = v * (1 - (1 - f) * s);

            switch (i % 6) {
                case 0:
                    (r = v), (g = t), (b = p);
                    break;
                case 1:
                    (r = q), (g = v), (b = p);
                    break;
                case 2:
                    (r = p), (g = v), (b = t);
                    break;
                case 3:
                    (r = p), (g = q), (b = v);
                    break;
                case 4:
                    (r = t), (g = p), (b = v);
                    break;
                case 5:
                    (r = v), (g = p), (b = q);
                    break;
            }
            r = parseInt(r, 10);
            g = parseInt(g, 10);
            b = parseInt(b, 10);

            HexArray.push(
                "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b),
            );
        });
        return HexArray;
    }

    public static componentToHex(c): string {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
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
                        ? QuickBase.Tools.smartFormatNumber(value, precision)
                        : _.escape(value);
                } else if (format === "Datetime") {
                    let datetime = value;
                    if (moment.isMoment(value) || moment.isDuration(value)) {
                        return (value = Util.isDuration(value)
                            ? QuickBase.Tools.convertValueToMoment(value.valueOf()).format(
                                  formatter,
                              )
                            : value.format(formatter));
                    }

                    if (QuickBase.Tools.isKDBTemporal(value)) {
                        return QuickBase.Tools.convertKDBTemporalToMoment(value).format(formatter);
                    }

                    if (typeof value === "number") {
                        datetime = new Date(value);
                    }

                    return (toReturn = QuickBase.Tools.convertDateStringValueToMoment(
                        datetime.toString(),
                    ).format(formatter));
                } else if (format === "Formatted Number" && value.toFixed) {
                    //use commas, precision

                    toReturn = _.isNaN(value) ? "" : QuickBase.Tools.formatNumber(value, precision);
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
                return moment.isMoment(value) || moment.isDuration(value)
                    ? value.format(format, undefined)
                    : _.escape(value);
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

    public static replaceViewStatesWithValue(key: string, value, api: QuickBase.ComponentApi): {} {
        const replaceFn: VSValueReplacer = (path: string, key: string, value, meta) => {
            return meta.value;
        };
        return Util.replaceViewStates(key, value, replaceFn, api);
    }

    public static replaceViewStatesWithModel(key: string, value, api: QuickBase.ComponentApi): {} {
        const replaceFn: VSModelReplacer = (path: string, key: string, value) => {
            if (value instanceof Backbone.Model && value.get("_viewType")) {
                return value;
            }
            const model = api.getProperty(path)[key];
            if (_.isUndefined(value)) {
                return undefined; // unset viewModel
            } else if (model.get("value") !== value) {
                model.set("value", value);
            }
            return model;
        };
        return Util.replaceViewStates(key, value, replaceFn, api);
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
