/// <reference types="lodash" />
/// <reference types="jquery" />

interface VSValueReplacer {
    (path: string, key: string, value, api);
}
interface VSModelReplacer {
    (path: string, key: string, value, api);
}
interface TypedCallback<T> {
    (...args: []);
}

class Util {
    public static expandNestedViewStates(settings, api: QuickBase.ComponentApi) {
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

    public static replaceViewStatesWithValue(key: string, value, api: QuickBase.ComponentApi) {
        const replaceFn: VSValueReplacer = (path: string, key: string, value, meta) => {
            return meta.value;
        };
        return Util.replaceViewStates(key, value, replaceFn, api);
    }

    public static replaceViewStatesWithModel(key: string, value, api: QuickBase.ComponentApi) {
        const replaceFn: VSModelReplacer = (path: string, key: string, value, meta) => {
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
    public static pump(object) {
        // unflatten
        if (object === null || object === undefined) {
            return;
        }

        if (!_.isObject(object)) {
            return object; // primitive type
        }

        const _proto = Object.getPrototypeOf(object);
        if (_.isObject(object) && _proto !== Object.prototype && _proto !== Array.prototype) {
            // we might be dealing with complex objects, i.e datasources, viewstates etc...
            return object;
        }

        if (_proto === Array.prototype) {
            return object.map(Util.pump);
        }

        const flatArrayRe = /^(\d+)((?:\.\w+)+)$/;

        const isFlatArray: boolean = Object.keys(object).every((key: string): boolean => {
            return flatArrayRe.test(key);
        });

        if (isFlatArray) {
            return Object.keys(object)
                .map((key: string) => {
                    const re: RegExpExecArray | null = flatArrayRe.exec(key);
                    if (_.isNil(re)) {
                        return {
                            index: 0,
                            tail: "",
                            value: 0,
                        };
                    } else {
                        return {
                            index: Number(re[1]),
                            tail: re[2].substring(1),
                            value: object[key],
                        };
                    }
                })
                .reduce((a, b) => {
                    const value = {};
                    value[b.index] = {};
                    value[b.index][b.tail] = b.value;
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
                .map((key: string) => {
                    const re: RegExpExecArray | null = flatObjectRe.greedy.exec(key);
                    if (_.isNil(re)) {
                        return {
                            head: 0,
                            tail: null,
                            value: 0,
                        };
                    } else {
                        return {
                            head: re[1],
                            tail: re[2] !== "" ? re[2].substring(1) : null,
                            value: object[key],
                        };
                    }
                })
                .reduce((a, b) => {
                    const value = {};
                    const isDeep = b.tail !== null;
                    if (isDeep) {
                        value[b.head] = {};
                        value[b.head][b.tail] = b.value;
                    } else {
                        value[b.head] = b.value;
                    }
                    return $.extend(true, a, Util.pump(value));
                }, {});
        }
        // we're dealing with normal (unflattened) object
        return _.mapValues(object, Util.pump);
    }

    private static replaceViewStates(key: string, value: any, replaceFn, api: any): any {
        // replace viewStates with the replaceFn
        // eslint-disable-next-line @typescript-eslint/class-name-casing
        interface _Map {
            (v: any, k: string | number): any;
        }
        // eslint-disable-next-line @typescript-eslint/class-name-casing
        interface _Mapper {
            (c: Record<string, any> | Array<any>, fn: _Map): any;
        }

        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        let _map: _Map = (v, k) => substitue(v, k, key || "");
        // eslint-disable-next-line @typescript-eslint/unbound-method
        let _mapper: _Mapper = _.isArray(value) ? _.map : _.mapValues;
        return _mapper(value, _map);

        function substitue(v, k: string | number, rootKey: string): any {
            rootKey = rootKey ? rootKey + "." : "";
            k = k + "";
            const meta = api.getPropertyMeta(rootKey + k);

            if (meta && meta.type === "data") {
                return v;
            } else if (meta && meta.type === "viewstate") {
                const splitKey = (rootKey + k).split("."),
                    key = splitKey.pop(),
                    path = splitKey.join(".");
                return replaceFn(path, key, v, meta);
            } else if (
                (_.isArray(v) || _.isObject(v)) &&
                !(v.has && v.has("_dataSource") && v.has("_dataType"))
            ) {
                // Note: gk
                // value v needs to checked that it is not a DocumentDataModel
                // otherwise the substitute will attempt to pointlessly recurse
                // through the internal datasturcture of this model resulting in stack size exceeded

                rootKey = rootKey + k;
                _map = (v, k): string | number => substitue(v, k, rootKey);
                // eslint-disable-next-line @typescript-eslint/unbound-method
                _mapper = _.isArray(v) ? _.map : _.mapValues;
                return _mapper(v, _map);
            } else {
                return v;
            }
        }
    }
}
