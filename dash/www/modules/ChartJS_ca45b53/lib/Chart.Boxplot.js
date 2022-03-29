(function() {
    const ascending = function(a, b) {
        return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
    };

    const number = function(x) {
        return x === null ? NaN : +x;
    };

    const extent = function(values, valueof) {
        const n = values.length;
        let i = -1;
        let value;
        let min;
        let max;

        if (valueof == null) {
            while (++i < n) {
                // Find the first comparable value.
                if ((value = values[i]) != null && value >= value) {
                    min = max = value;
                    while (++i < n) {
                        // Compare the remaining values.
                        if ((value = values[i]) != null) {
                            if (min > value) min = value;
                            if (max < value) max = value;
                        }
                    }
                }
            }
        } else {
            while (++i < n) {
                // Find the first comparable value.
                if ((value = valueof(values[i], i, values)) != null && value >= value) {
                    min = max = value;
                    while (++i < n) {
                        // Compare the remaining values.
                        if ((value = valueof(values[i], i, values)) != null) {
                            if (min > value) min = value;
                            if (max < value) max = value;
                        }
                    }
                }
            }
        }

        return [min, max];
    };

    const identity = function(x) {
        return x;
    };

    const d3range = function(start, stop, step) {
        (start = +start),
            (stop = +stop),
            (step =
                (n = arguments.length) < 2 ? ((stop = start), (start = 0), 1) : n < 3 ? 1 : +step);

        let i = -1;
        let n = Math.max(0, Math.ceil((stop - start) / step)) | 0;
        const range = new Array(n);

        while (++i < n) {
            range[i] = start + i * step;
        }

        return range;
    };

    const quantile = function(arr, q, valueof) {
        if (_.isNil(valueof)) {
            valueof = number;
        }
        const sorted = arr.sort((a, b) => a - b);
        const pos = (sorted.length - 1) * q;
        const base = Math.floor(pos);
        const rest = pos - base;
        if (sorted[base + 1] !== undefined) {
            return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
        } else {
            return sorted[base];
        }
    };

    const d3max = function(values, valueof) {
        const n = values.length;
        let i = -1;
        let value;
        let max;

        if (valueof == null) {
            while (++i < n) {
                // Find the first comparable value.
                if ((value = values[i]) != null && value >= value) {
                    max = value;
                    while (++i < n) {
                        // Compare the remaining values.
                        if ((value = values[i]) != null && value > max) {
                            max = value;
                        }
                    }
                }
            }
        } else {
            while (++i < n) {
                // Find the first comparable value.
                if ((value = valueof(values[i], i, values)) != null && value >= value) {
                    max = value;
                    while (++i < n) {
                        // Compare the remaining values.
                        if ((value = valueof(values[i], i, values)) != null && value > max) {
                            max = value;
                        }
                    }
                }
            }
        }

        return max;
    };

    // See <http://en.wikipedia.org/wiki/Kernel_(statistics)>.

    function gaussian(u) {
        return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u);
    }

    // Welford's algorithm.
    function mean$1(x) {
        const n = x.length;
        if (n === 0) return NaN;
        let m = 0,
            i = -1;
        while (++i < n) {
            m += (x[i] - m) / (i + 1);
        }
        return m;
    }

    // Unbiased estimate of a sample's variance.
    // Also known as the sample variance, where the denominator is n - 1.
    function variance$1(x) {
        const n = x.length;
        if (n < 1) return NaN;
        if (n === 1) return 0;
        const mean = mean$1(x);
        let i = -1;
        let s = 0;
        while (++i < n) {
            const v = x[i] - mean;
            s += v * v;
        }
        return s / (n - 1);
    }

    function ascending$1(a, b) {
        return a - b;
    }

    // Uses R's quantile algorithm type=7.
    function quantiles(d, quantiles) {
        d = d.slice().sort(ascending$1);
        const n_1 = d.length - 1;
        return quantiles.map(function(q) {
            if (q === 0) return d[0];
            else if (q === 1) return d[n_1];

            const index = 1 + q * n_1,
                lo = Math.floor(index),
                h = index - lo,
                a = d[lo - 1];

            return h === 0 ? a : a + h * (d[lo] - a);
        });
    }

    function iqr(x) {
        const quartiles = quantiles(x, [0.25, 0.75]);
        return quartiles[1] - quartiles[0];
    }

    // Bandwidth selectors for Gaussian kernels.
    // Based on R's implementations in `stats.bw`.

    // Silverman, B. W. (1986) Density Estimation. London: Chapman and Hall.

    // Scott, D. W. (1992) Multivariate Density Estimation: Theory, Practice, and
    // Visualization. Wiley.
    function nrd(x) {
        const h = iqr(x) / 1.34;
        return 1.06 * Math.min(Math.sqrt(variance$1(x)), h) * Math.pow(x.length, -1 / 5);
    }

    // http://exploringdata.net/den_trac.htm
    function kde() {
        const kernel = gaussian;
        let sample = [];
        const bandwidth = nrd;

        function kde(points, i) {
            const bw = bandwidth.call(this, sample);
            return points.map(function(x) {
                let i = -1;
                let y = 0;
                const n = sample.length;
                while (++i < n) {
                    y += kernel((x - sample[i]) / bw);
                }
                return [x, y / bw / n];
            });
        }

        kde.sample = function(x) {
            if (!arguments.length) return sample;
            sample = x;
            return kde;
        };

        return kde;
    }

    function violinStats(arr) {
        // console.assert(Array.isArray(arr));
        if (arr.length === 0) {
            return {
                outliers: [],
            };
        }
        arr = arr.filter(function(v) {
            return typeof v === "number" && !isNaN(v);
        });
        arr.sort(function(a, b) {
            return a - b;
        });

        const minmax = extent(arr);
        return {
            min: minmax[0],
            max: minmax[1],
            median: quantile(arr, 0.5),
            kde: kde().sample(arr),
        };
    }

    function asBoxPlotStats(value) {
        if (!_.isNil(value.median)) {
            if (
                typeof value.median !== "undefined" &&
                typeof value.q1 !== "undefined" &&
                typeof value.q3 !== "undefined"
            ) {
                // sounds good, check for helper
                return value;
            }
            if (!Array.isArray(value)) {
                return undefined;
            }

            return value.__stats ? value.__stats : value;
        } else {
            return undefined;
        }
    }

    function asViolinStats(value) {
        if (value.__kde === undefined) {
            value.__kde = violinStats(value);
        }
        return value.__kde;
    }

    function asMinMaxStats(value) {
        if (typeof value.min === "number" && typeof value.max === "number") {
            return value;
        } else if (typeof value.min === "string") {
            return {
                median: parseFloat(value.median),
                q1: parseFloat(value.q1),
                q3: parseFloat(value.q3),
                min: parseFloat(value.min),
                max: parseFloat(value.max),
                x: value.x,
            };
        }
        if (!Array.isArray(value)) {
            return undefined;
        }
        return asBoxPlotStats(value);
    }

    function getRightValue(rawValue) {
        if (!rawValue) {
            return rawValue;
        }
        if (typeof rawValue === "number" || typeof rawValue === "string") {
            return Number(rawValue);
        }
        const b = asBoxPlotStats(rawValue);
        return b ? b.median : rawValue;
    }

    function commonDataLimits(extraCallback) {
        const _this = this;
        const skip = this.recalibrate;
        const chart = this.chart;
        const isHorizontal = this.isHorizontal();

        const matchID = function matchID(meta) {
            return isHorizontal ? meta.xAxisID === _this.id : meta.yAxisID === _this.id;
        };

        // First Calculate the range
        this.min = null;
        this.max = null;

        // Regular charts use x, y values
        // For the boxplot chart we have rawValue.min and rawValue.max for each point
        chart.data.datasets.forEach(function(d, i) {
            const meta = chart.getDatasetMeta(i);
            if (!chart.isDatasetVisible(i) || !matchID(meta)) {
                return;
            }
            d.data.forEach(function(value, j) {
                if (skip && (meta.data[j]._view.x > skip[1] || meta.data[j]._view.x < skip[0])) {
                    return;
                }
                if (!value || meta.data[j].hidden) {
                    return;
                }
                const minmax = asMinMaxStats(value);
                if (!minmax) {
                    return;
                }
                if (_this.min === null) {
                    _this.min = minmax.min;
                } else if (minmax.min < _this.min) {
                    _this.min = minmax.min;
                }

                if (_this.max === null) {
                    _this.max = minmax.max;
                } else if (minmax.max > _this.max) {
                    _this.max = minmax.max;
                }

                if (extraCallback) {
                    extraCallback(minmax);
                }
            });
        });
    }

    function rnd(seed) {
        // Adapted from http://indiegamr.com/generate-repeatable-random-numbers-in-js/
        if (seed === undefined) {
            seed = Date.now();
        }
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }

    const defaults$1 = _.extend({}, Chart.defaults.global.elements.rectangle, {
        borderWidth: 1,
        outlierRadius: 2,
        itemRadius: 2,
        itemStyle: "circle",
        itemBackgroundColor: Chart.defaults.global.elements.rectangle.backgroundColor,
        itemBorderColor: Chart.defaults.global.elements.rectangle.borderColor,
    });

    const ArrayElementBase = Chart.Element.extend({
        isVertical: function isVertical() {
            return this._view.width !== undefined;
        },
        draw: function draw() {
            // abstract
        },
        _drawItems: function _drawItems(vm, container, ctx, vert) {
            if (vm.itemRadius <= 0 || !container.items || container.items.length <= 0) {
                return;
            }
            ctx.save();
            ctx.strokeStle = vm.itemBorderColor;
            ctx.fillStyle = vm.itemBackgroundColor;
            // jitter based on random data
            // use the median to initialize the random number generator
            const random = rnd(container.median);

            const itemRadius = vm.itemRadius;
            if (vert) {
                const x = vm.x;
                const width = vm.width;

                container.items.forEach(function(v) {
                    Chart.canvasHelpers.drawPoint(
                        ctx,
                        vm.itemStyle,
                        itemRadius,
                        x - width / 2 + random() * width,
                        v,
                    );
                });
            }
            ctx.restore();
        },
        _drawOutliers: function _drawOutliers(vm, container, ctx, vert) {
            if (!container.outliers) {
                return;
            }
            const outlierRadius = vm.outlierRadius;
            ctx.beginPath();
            if (vert) {
                const x = vm.x;
                container.outliers.forEach(function(v) {
                    ctx.arc(x, v, outlierRadius, 0, Math.PI * 2);
                });
            }
            ctx.fill();
            ctx.closePath();
        },
        _getBounds: function _getBounds() {
            // abstract
            return {
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
            };
        },
        height: function height() {
            return 0; // abstract
        },
        inRange: function inRange(mouseX, mouseY) {
            if (!this._view) {
                return false;
            }
            const bounds = this._getBounds();
            return (
                mouseX >= bounds.left &&
                mouseX <= bounds.right &&
                mouseY >= bounds.top &&
                mouseY <= bounds.bottom
            );
        },
        inXRange: function inXRange(mouseX) {
            const bounds = this._getBounds();
            return mouseX >= bounds.left && mouseX <= bounds.right;
        },
        inYRange: function inYRange(mouseY) {
            const bounds = this._getBounds();
            return mouseY >= bounds.top && mouseY <= bounds.bottom;
        },
        getCenterPoint: function getCenterPoint() {
            const _view = this._view,
                x = _view.x,
                y = _view.y;

            return {
                x: x,
                y: y,
            };
        },
    });

    Chart.defaults.global.elements.boxandwhiskers = _.extend({}, defaults$1);

    const BoxAndWiskers = (Chart.elements.BoxAndWhiskers = ArrayElementBase.extend({
        transition: function transition(ease) {
            const r = Chart.Element.prototype.transition.call(this, ease);
            const model = this._model;
            const start = this._start;
            const view = this._view; // No animation -> No Transition

            if (!model || ease === 1) {
                return r;
            }

            if (start.boxplot == null) {
                return r; // model === view -> not copied
            } // create deep copy to avoid alternation

            if (model.boxplot === view.boxplot) {
                view.boxplot = Chart.helpers.clone(view.boxplot);
            }

            transitionBoxPlot(start.boxplot, view.boxplot, model.boxplot, ease);
            return r;
        },
        draw: function draw() {
            const ctx = this._chart.ctx;
            const vm = this._view;
            const boxplot = vm.boxplot;
            const vert = this.isVertical();
            ctx.save();
            ctx.fillStyle = vm.backgroundColor;
            ctx.strokeStyle = vm.borderColor;
            ctx.lineWidth = vm.borderWidth;

            this._drawBoxPlot(vm, boxplot, ctx, vert);

            this._drawOutliers(vm, boxplot, ctx, vert);

            ctx.restore();

            this._drawItems(vm, boxplot, ctx, vert);
        },
        _drawBoxPlot: function _drawBoxPlot(vm, boxplot, ctx, vert) {
            this._drawBoxPlotVert(vm, boxplot, ctx);
        },
        _drawBoxPlotVert: function _drawBoxPlotVert(vm, boxplot, ctx) {
            const x = vm.x;
            const width = vm.width;
            const x0 = x - width / 2; // Draw the q1>q3 box

            if (boxplot.q3 > boxplot.q1) {
                ctx.fillRect(x0, boxplot.q1, width, boxplot.q3 - boxplot.q1);
            } else {
                ctx.fillRect(x0, boxplot.q3, width, boxplot.q1 - boxplot.q3);
            } // Draw the median line

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x0, boxplot.median);
            ctx.lineTo(x0 + width, boxplot.median); // fill the part below the median with lowerColor

            ctx.closePath();
            ctx.stroke();
            ctx.restore(); // Draw the border around the main q1>q3 box

            if (boxplot.q3 > boxplot.q1) {
                ctx.strokeRect(x0, boxplot.q1, width, boxplot.q3 - boxplot.q1);
            } else {
                ctx.strokeRect(x0, boxplot.q3, width, boxplot.q1 - boxplot.q3);
            } // Draw the whiskers

            ctx.beginPath();
            ctx.moveTo(x0, boxplot.whiskerMin);
            ctx.lineTo(x0 + width, boxplot.whiskerMin);
            ctx.moveTo(x, boxplot.whiskerMin);
            ctx.lineTo(x, boxplot.q1);
            ctx.moveTo(x0, boxplot.whiskerMax);
            ctx.lineTo(x0 + width, boxplot.whiskerMax);
            ctx.moveTo(x, boxplot.whiskerMax);
            ctx.lineTo(x, boxplot.q3);
            ctx.closePath();
            ctx.stroke();
        },

        _getBounds: function _getBounds() {
            const vm = this._view;
            const boxplot = vm.boxplot;

            if (!boxplot) {
                return {
                    left: 0,
                    top: 0,
                    right: 0,
                    bottom: 0,
                };
            }

            const y = vm.y,
                height = vm.height;
            const y0 = y - height / 2;
            return {
                left: boxplot.whiskerMin,
                top: y0,
                right: boxplot.whiskerMax,
                bottom: y0 + height,
            };
        },
    }));

    Chart.defaults.global.elements.violin = _.extend(
        {
            points: 100,
        },
        defaults$1,
    );

    const Violin = (Chart.elements.Violin = ArrayElementBase.extend({
        draw: function draw() {
            const ctx = this._chart.ctx;
            const vm = this._view;

            const violin = vm.violin;
            const vert = this.isVertical();

            this._drawItems(vm, violin, ctx, vert);

            ctx.save();

            ctx.fillStyle = vm.backgroundColor;
            ctx.strokeStyle = vm.borderColor;
            ctx.lineWidth = vm.borderWidth;

            const coords = violin.coords;
            const med = Chart.canvasHelpers.drawPoint(ctx, "rectRot", 5, vm.x, vm.violin.median);
            ctx.stroke();

            ctx.beginPath();
            if (vert) {
                const x = vm.x,
                    width = vm.width;

                const factor = width / 2 / violin.maxEstimate;
                ctx.moveTo(x, violin.min);
                coords.forEach(function(_ref) {
                    const v = _ref.v,
                        estimate = _ref.estimate;

                    ctx.lineTo(x - estimate * factor, v);
                });
                ctx.lineTo(x, violin.max);
                ctx.moveTo(x, violin.min);
                coords.forEach(function(_ref2) {
                    const v = _ref2.v,
                        estimate = _ref2.estimate;

                    ctx.lineTo(x + estimate * factor, v);
                });
                ctx.lineTo(x, violin.max);
            }
            ctx.stroke();
            ctx.fill();
            ctx.closePath();

            this._drawOutliers(vm, violin, ctx, vert);

            ctx.restore();
        },
        _getBounds: function _getBounds() {
            const vm = this._view;

            const violin = vm.violin;
            const y = vm.y,
                height = vm.height;

            const y0 = y - height / 2;
            return {
                left: violin.min,
                top: y0,
                right: violin.max,
                bottom: y0 + height,
            };
        },
    }));

    const verticalDefaults = {
        scales: {
            yAxes: [
                {
                    type: "arrayLinear",
                },
            ],
        },
    };

    const array$1 = {
        _elementOptions: function _elementOptions() {
            return {};
        },
        updateElement: function updateElement(elem, index, reset) {
            const dataset = this.getDataset();
            const custom = elem.custom || {};
            const options = this._elementOptions();

            Chart.controllers.bar.prototype.updateElement.call(this, elem, index, reset);
            [
                "outlierRadius",
                "itemRadius",
                "itemStyle",
                "itemBackgroundColor",
                "itemBorderColor",
            ].forEach(function(item) {
                elem._model[item] =
                    custom[item] !== undefined
                        ? custom[item]
                        : Chart.helpers.valueAtIndexOrDefault(dataset[item], index, options[item]);
            });
        },
        _calculateCommonModel: function _calculateCommonModel(r, data, container, scale) {
            if (container.outliers) {
                r.outliers = container.outliers.map(function(d) {
                    return scale.getPixelForValue(Number(d));
                });
            }

            if (Array.isArray(data)) {
                r.items = data.map(function(d) {
                    return scale.getPixelForValue(Number(d));
                });
            }
        },
    };

    const defaults$2 = {
        tooltips: {
            callbacks: {
                label: function label(item) {
                    return item;
                },
            },
        },
    };

    Chart.defaults.boxplot = Chart.helpers.merge({}, [
        Chart.defaults.bar,
        verticalDefaults,
        defaults$2,
    ]);

    const boxplot = _.extend({}, array$1, {
        dataElementType: Chart.elements.BoxAndWhiskers,

        _elementOptions: function _elementOptions() {
            return this.chart.options.elements.boxandwhiskers;
        },

        /**
         * @private
         */
        _updateElementGeometry: function updateElementGeometry(elem, index, reset, options) {
            Chart.controllers.bar.prototype._updateElementGeometry.call(
                this,
                elem,
                index,
                reset,
                options,
            );
            elem._model.boxplot = this._calculateBoxPlotValuesPixels(this.index, index);
        },

        /**
         * @private
         */

        _calculateBoxPlotValuesPixels: function _calculateBoxPlotValuesPixels(datasetIndex, index) {
            const scale = this._getValueScale();
            const data = this.chart.data.datasets[datasetIndex].data[index];
            const v = asBoxPlotStats(data);

            const r = {};
            if (!v) return r;
            Object.keys(v).forEach(function(key) {
                if (key !== "outliers") {
                    r[key] = scale.getPixelForValue(Number(v[key]));
                }
            });
            this._calculateCommonModel(r, data, v, scale);
            return r;
        },
    });
    /**
     * This class is based off controller.bar.js from the upstream Chart.js library
     */
    const BoxPlot = (Chart.controllers.boxplot = Chart.controllers.bar.extend(boxplot));

    const defaults$3 = {};

    Chart.defaults.violin = Chart.helpers.merge({}, [
        Chart.defaults.bar,
        verticalDefaults,
        defaults$3,
    ]);

    const controller = _.extend({}, array$1, {
        dataElementType: Chart.elements.Violin,

        _elementOptions: function _elementOptions() {
            return this.chart.options.elements.violin;
        },

        /**
         * @private
         */
        _updateElementGeometry: function updateElementGeometry(elem, index, reset, options) {
            Chart.controllers.bar.prototype._updateElementGeometry.call(
                this,
                elem,
                index,
                reset,
                options,
            );
            const custom = elem.custom || {};
            var options = this._elementOptions();
            elem._model.violin = this._calculateViolinValuesPixels(
                this.index,
                index,
                custom.points !== undefined ? custom.points : options.points,
            );
        },

        /**
         * @private
         */

        _calculateViolinValuesPixels: function _calculateViolinValuesPixels(
            datasetIndex,
            index,
            points,
        ) {
            const scale = this._getValueScale();
            const data = this.chart.data.datasets[datasetIndex].data[index].data;
            const violin = asViolinStats(data);

            if (Array.isArray(data)) {
                violin.min = _.min(data);
                violin.q1 = quantile(data, 0.25);
                violin.median = quantile(data, 0.5);
                violin.q3 = quantile(data, 0.75);
                violin.max = _.max(data);
            }
            const range$$1 = violin.max - violin.min;
            const samples = d3range(violin.min, violin.max, range$$1 / points);
            if (samples[samples.length - 1] !== violin.max) {
                samples.push(violin.max);
            }
            const coords =
                violin.coords ||
                violin.kde(samples).map(function(v) {
                    return {
                        v: v[0],
                        estimate: v[1],
                    };
                });
            const r = {
                min: scale.getPixelForValue(violin.min),
                max: scale.getPixelForValue(violin.max),
                median: scale.getPixelForValue(violin.median),
                coords: coords.map(function(_ref) {
                    const v = _ref.v,
                        estimate = _ref.estimate;
                    return {
                        v: scale.getPixelForValue(v),
                        estimate: estimate,
                    };
                }),
                maxEstimate: d3max(coords, function(d) {
                    return d.estimate;
                }),
            };
            this._calculateCommonModel(r, data, violin, scale);
            return r;
        },
    });
    /**
     * This class is based off controller.bar.js from the upstream Chart.js library
     */
    const Violin$2 = (Chart.controllers.violin = Chart.controllers.bar.extend(controller));

    function getOrCreateStack(stacks, stacked, meta) {
        const key = [
            meta.type,
            // we have a separate stack for stack=undefined datasets when the opts.stacked is undefined
            stacked === undefined && meta.stack === undefined ? meta.index : "",
            meta.stack,
        ].join(".");

        if (stacks[key] === undefined) {
            stacks[key] = {
                pos: [],
                neg: [],
            };
        }

        return stacks[key];
    }

    function stackData(scale, stacks, meta, data) {
        const opts = scale.options;
        const stacked = opts.stacked;
        const stack = getOrCreateStack(stacks, stacked, meta);
        const pos = stack.pos;
        const neg = stack.neg;
        const ilen = data.length;
        let i, value;

        for (i = 0; i < ilen; ++i) {
            value = scale._parseValue(data[i]);
            if (isNaN(value.min) || isNaN(value.max) || meta.data[i].hidden) {
                continue;
            }

            pos[i] = pos[i] || 0;
            neg[i] = neg[i] || 0;

            if (opts.relativePoints) {
                pos[i] = 100;
            } else if (value.min < 0 || value.max < 0) {
                neg[i] += value.min;
            } else {
                pos[i] += value.max;
            }
        }
    }

    function updateMinMax(scale, meta, data) {
        const ilen = data.length;
        let i, value;

        for (i = 0; i < ilen; ++i) {
            value = scale._parseValue(data[i]);
            if (isNaN(value.min) || isNaN(value.max) || meta.data[i].hidden) {
                continue;
            }

            scale.min = _.isNil(scale.min) ? value.min : Math.min(scale.min, value.min);
            scale.max = _.isNil(scale.max) ? value.max : Math.max(scale.max, value.max);
        }
    }

    const ArrayLinearScale = Chart.scaleService.getScaleConstructor("linear").extend({
        getRightValue: function getRightValue$$1(rawValue) {
            return Chart.LinearScaleBase.prototype.getRightValue.call(
                this,
                getRightValue(rawValue),
            );
        },
        // GOK - Deviation from Original File in order to keep original linear range handling.
        determineDataLimits: function determineDataLimits() {
            // this.recalibrate is defined during zoom.
            const skip = this.recalibrate;

            // --- Box Plot Min & Max Calculations --- //
            commonDataLimits.call(this);

            if (this.min && this.max) {
                const boxPlotMax = this.max;
                const boxPlotMin = this.min;
            }

            const me = this;
            const opts = me.options;
            const chart = me.chart;
            let data = chart.data;
            const panModel = chart.config.panModel;
            let zoomObj =
                !skip &&
                panModel &&
                panModel.get("YAdjust") &&
                panModel.get("YAdjust").toLowerCase() != "none"
                    ? panModel.zoomObj
                    : undefined;

            // Dashboards Allows User to Pass Invalid Moment to Viewstate
            // This Checks to see if there is a valid moment, and removes the zoomObj in the case
            // of invalid zoomObj
            if (
                zoomObj &&
                zoomObj.min &&
                zoomObj.min.isValid &&
                zoomObj.max &&
                zoomObj.max.isValid
            ) {
                if (!zoomObj.min.isValid() || !zoomObj.max.isValid()) {
                    zoomObj = undefined;
                }
            }
            const datasets = data.datasets;
            const isHorizontal = me.isHorizontal();
            const DEFAULT_MIN = 0;
            const DEFAULT_MAX = 1;
            const helpers = Chart.helpers;

            const metasets = me._getMatchingVisibleMetas();
            const stacks = {};
            const ilen = metasets.length;
            let i, meta, values;

            function IDMatches(meta) {
                return isHorizontal ? meta.xAxisID === me.id : meta.yAxisID === me.id;
            }

            // First Calculate the range
            me.min = null;
            me.max = null;

            let hasStacks = opts.stacked;
            if (hasStacks === undefined) {
                helpers.each(datasets, function(dataset, datasetIndex) {
                    if (hasStacks) {
                        return;
                    }

                    const meta = chart.getDatasetMeta(datasetIndex);
                    if (
                        chart.isDatasetVisible(datasetIndex) &&
                        IDMatches(meta) &&
                        meta.stack !== undefined
                    ) {
                        hasStacks = true;
                    }
                });
            }

            // --- Regular X-Y Charts Min & Max Calculations --- //

            if (hasStacks === undefined) {
                for (i = 0; !hasStacks && i < ilen; ++i) {
                    meta = metasets[i];
                    hasStacks = meta.stack !== undefined;
                }
            }

            for (i = 0; i < ilen; ++i) {
                meta = metasets[i];
                //data = datasets[meta.index].data;
                data = zoomObj
                    ? datasets[meta.index].data.filter(x => {
                          return (
                              chart.scales[meta.xAxisID].min <= x.x.valueOf() &&
                              x.x.valueOf() <= chart.scales[meta.xAxisID].max
                          );
                      })
                    : datasets[meta.index].data;
                if (hasStacks) {
                    stackData(me, stacks, meta, data);
                } else {
                    updateMinMax(me, meta, data);
                }
            }

            helpers$1.each(stacks, function(stackValues) {
                values = stackValues.pos.concat(stackValues.neg);
                me.min = Math.min(me.min, helpers$1.min(values));
                me.max = Math.max(me.max, helpers$1.max(values));
            });

            me.min = helpers$1.isFinite(me.min) && !isNaN(me.min) ? me.min : DEFAULT_MIN;
            me.max = helpers$1.isFinite(me.max) && !isNaN(me.max) ? me.max : DEFAULT_MAX;

            // --- Financial Charts (i.e. Candlesticks) Min & Max Calculations --- //
            const financialCharts = ["boxplot", "candlestick", "ohlc"];
            if (meta && financialCharts.indexOf(meta.type) >= 0) {
                me.finMax = me.finMin = null;
                let low;
                let high;
                if (meta.type === "boxplot") {
                    low = _.minBy(data, "min").min;
                    high = _.maxBy(data, "max").max;
                }
                if (meta.type === "candlestick" || meta.type === "ohlc") {
                    low = _.minBy(data, "l").l;
                    high = _.maxBy(data, "h").h;
                }
                me.finMin = helpers$1.isFinite(low) && !isNaN(low) ? low : DEFAULT_MIN;
                me.finMax = helpers$1.isFinite(high) && !isNaN(high) ? high : DEFAULT_MAX;

                // --- Final Consolidatation of min & maxes --- //
                me.min = me.finMin;
                me.max = me.finMax;
                me.min = isFinite(me.min) && !isNaN(me.min) ? me.min : DEFAULT_MIN;
                me.max = isFinite(me.max) && !isNaN(me.max) ? me.max : DEFAULT_MAX;
            }

            // Common base implementation to handle ticks.min, ticks.max, ticks.beginAtZero
            me.handleTickRangeOptions();
        },
        getLabels: function getLabels() {
            const data = this.chart.data;
            return (
                this.options.labels ||
                (this.isHorizontal() ? data.xLabels : data.yLabels) ||
                data.labels
            );
        },
    });
    Chart.scaleService.registerScaleType(
        "arrayLinear",
        ArrayLinearScale,
        Chart.scaleService.getScaleDefaults("linear"),
    );

    var helpers$1 = Chart.helpers;

    const ArrayLogarithmicScale = Chart.scaleService.getScaleConstructor("logarithmic").extend({
        getRightValue: function getRightValue$$1(rawValue) {
            return Chart.LinearScaleBase.prototype.getRightValue.call(
                this,
                getRightValue(rawValue),
            );
        },
        determineDataLimits: function determineDataLimits() {
            const _this = this;

            this.minNotZero = null;
            commonDataLimits.call(this, function(boxPlot) {
                if (
                    boxPlot.min !== 0 &&
                    (_this.minNotZero === null || boxPlot.min < _this.minNotZero)
                ) {
                    _this.minNotZero = boxPlot.min;
                }
            });

            // Add whitespace around bars. Axis shouldn't go exactly from min to max
            const tickOpts = this.options.ticks;
            this.min = helpers$1.valueOrDefault(tickOpts.min, this.min - this.min * 0.05);
            this.max = helpers$1.valueOrDefault(tickOpts.max, this.max + this.max * 0.05);

            if (this.min === this.max) {
                if (this.min !== 0 && this.min !== null) {
                    this.min = Math.pow(10, Math.floor(helpers$1.log10(this.min)) - 1);
                    this.max = Math.pow(10, Math.floor(helpers$1.log10(this.max)) + 1);
                } else {
                    this.min = 1;
                    this.max = 10;
                }
            }
        },
    });
    Chart.scaleService.registerScaleType(
        "arrayLogarithmic",
        ArrayLogarithmicScale,
        Chart.scaleService.getScaleDefaults("logarithmic"),
    );

    //exports.BoxAndWhiskers = BoxAndWiskers;
    //exports.Violin = Violin;
    //exports.ArrayLinearScale = ArrayLinearScale;
    //exports.ArrayLogarithmicScale = ArrayLogarithmicScale;
    //exports.BoxPlot = BoxPlot;

    //Object.defineProperty(exports, '__esModule', { value: true });
})();
