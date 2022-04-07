// {{#ico icon="fa-explanation" color="red"}}
Handlebars.registerHelper("ico", function(options) {
    return new Handlebars.SafeString(
        '<i class="fa ' + options.hash.icon + '" style="color:' + options.hash.color + ';"></i>',
    );
});

// {{#groupByLayer }}  {{/groupBylayer}}
Handlebars.registerHelper("groupByLayer", function(options) {
    const newArray = [];
    const layers = _.groupBy(this.points, x => x.layerName);
    const legends = _.groupBy(this.legendItems, x => x.text);
    _.forEach(layers, function(layerPoints, layerName) {
        const layerData = layerPoints.map(function(x) {
            const legend = legends[x.layerName];
            const legendShape =
                legend && legend[0] && legend[0].pointStyle ? legend[0].pointStyle : "circle";
            return {
                borderColor: x.colors.borderColor,
                cols: x.cols,
                color: x.colors.backgroundColor,
                data: x.layerData,
                dataFormatted: x.layerDataFormatted,
                isLayerEnabled: x.isLayerEnabled,
                shape: legendShape,
            };
        });
        newArray.push({
            colors: layerPoints[0].colors,
            isLayerEnabled: layerPoints[0].isLayerEnabled,
            layerCount: _.sumBy(layerData, d => {
                if (_.isNil(d.data) || d.data === "") {
                    return 0;
                } else {
                    return 1;
                }
            }),
            layerUniqData: _.uniq(
                _.compact(
                    _.map(layerData, d => {
                        return d.data;
                    }),
                ),
            ).join(),
            layerName: layerName,
            layerPoints: layerData,
            svg: layerPoints[0].svg,
        });
    });
    return new Handlebars.SafeString(options.fn({ layers: newArray }));
});
Handlebars.registerHelper("groupByLayerX", function(col, options) {
    const groupedNewArray = [];
    const colGroups = _.uniq(
        _.flatMap(this.points, function(p) {
            return p.cols[col].toString();
        }),
    );

    const layers = _.groupBy(this.points, x => x.layerName);
    const legends = _.groupBy(this.legendItems, x => x.text);

    _.forEach(colGroups, function(cols) {
        const newArray = [];

        _.forEach(layers, function(layerPoints, layerName) {
            const filteredLayer = _.filter(layerPoints, function(l) {
                return l.cols[col].toString() === cols.toString();
            });
            const layerData = filteredLayer.map(function(x) {
                const legend = legends[x.layerName];
                const legendShape =
                    legend && legend[0] && legend[0].pointStyle ? legend[0].pointStyle : "circle";
                return {
                    data: x.layerData,
                    dataFormatted: x.layerDataFormatted,
                    cols: x.cols,
                    color: x.colors.backgroundColor,
                    borderColor: x.colors.borderColor,
                    shape: legendShape,
                };
            });

            newArray.push({
                colors: layerPoints[0].colors,
                grouping: cols,
                layerName: layerName,
                layerPoints: layerData,
                legends: legends,
                isLayerEnabled: layerPoints[0].isLayerEnabled,
            });
        });
        groupedNewArray.push({
            grouping: cols,
            data: newArray,
        });
    });
    return new Handlebars.SafeString(options.fn({ layers: groupedNewArray }));
});

// {{#filterLayers names=["layerName1","layerName2" }}  {{/filterLayers}}
Handlebars.registerHelper("filterLayers", function(options) {
    const layers = options.hash.names.split(",");
    const newArray = _.filter(this.points, x => _.includes(layers, x.layerName));
    return new Handlebars.SafeString(options.fn({ points: newArray }));
});
