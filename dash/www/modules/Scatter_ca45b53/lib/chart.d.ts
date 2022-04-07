//TODO dataum can also be string
type EchartDatum = number | string;
type Datum = EchartDatum
interface AxisFromatters {
    Chart1: AxisFormatterOptions,
    Chart2: AxisFormatterOptions,
    Chart3: AxisFormatterOptions,
    Chart4: AxisFormatterOptions
}
interface AxisFormatterOptions {
    XAxis: Util.getFormatter | any,
    YAxis: Util.getFormatter | any
}
interface ChartData {
    Chart1: ChartDataOptions,
    Chart2: ChartDataOptions,
    Chart3: ChartDataOptions,
    Chart4: ChartDataOptions
};
interface ChartDataOptions {
    key: ChartKeys,
    name: string,
    data: ChartDataArr,
    rawData: ChartRawDataArr, 
    gridIx: number,
    dataTypes: ObjectAny,
    dataMinMax: {
        XAxis: Array<number>,
        YAxis: Array<number>
    },// check how string/date min max stored
    markLine: {
        startXY: Array<number>,
        endXY: Array<number>,
        formula: string
    },
    dataComplete: boolean,
    dataColsSet: boolean,
    hidden: boolean,
    id: GridIds
}

interface ObjectAny {[index: string]: any}
interface ChartAxis {
    Chart1: ChartAxisOptions,
    Chart2: ChartAxisOptions,
    Chart3: ChartAxisOptions,
    Chart4: ChartAxisOptions
};
// Not to be confused with settingsModel axis which are XAxis and YAxis
interface ChartAxisOptions {
    XAxis: {
        axisModel: Axis | null,
        options: {[index: string]: any | {}},
        scales: {min?: number | null, max?: number | null},
        data: Array<any> | null,
        labelSize?: number
    }, 
    YAxis: {
        axisModel: Axis | null, 
        options: {[index: string]: any | {}},
        scales: {min?: number | null, max?: number | null},
        data: Array<any> | null,
        labelSize?: number
    }
}
interface ChartDataTimeArr {
    [index: number]: Array<number> | [],
    length: number
};

interface ChartDataArr {
    [index: number]: Array<Datum> | [],
    length: number
};
interface ChartRawDataArr {
    [index: number]: Array<any> | [],
    length: number
};
interface MinMaxAxisOptions {
    XAxis: MinMaxOptions | {},
    YAxis: MinMaxOptions | {}
};
interface MinMaxOptions {
    min?: number,
    max?: number
};

interface PlotStylesOptions {
    color?: {
        colorStops: Array<any>
    }
};
interface LegendIconOptions {
    iconPath: string, 
    iconColor: string,
    fontColor: string,
    fontSize: string
}

interface ReverseAxisKeys {
    XAxis: "YAxis", 
    YAxis: "XAxis"
};
interface ArrMinMax {
    [index:number]: [number|null,number|null]
}

type PositionLegend = "top" | "bottom" | "left" | "right";
type ChartKeys = "Chart1" | "Chart2" | "Chart3" | "Chart4";
type AxisKeys = "XAxis" | "YAxis";
type AxisKeysData = "XAxisData" | "YAxisData";
type AxesKeys = "XAxes" | "YAxes";
type GridIds = "gr1" | "gr2" | "gr3" | "gr4";
type posAxesKeys = "_PossibleXAxes" | "_PossibleYAxes";