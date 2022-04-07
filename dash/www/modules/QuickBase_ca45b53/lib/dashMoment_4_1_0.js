define(['./../vendor/moment-timezone-with-data-2012-2022-0.5.14.min', './../vendor/moment-duration-format-1.3.0.min'], function (moment) {
    var padLeft = function (string, length, padChar) {
        var str = String(string);
        if (!str) {
            return '';
        }

        if (!padChar) {
            padChar = '0';
        }

        if (str.length > length) {
            return str;
        }

        return (Array(length + 1).join(padChar) + str).slice(length * -1);
    };

    moment.duration.fn.kdbType = moment.prototype.kdbType = function (type) {
        if (!_.isUndefined(type) && !_.isNull(type)) {
            this._kdbType = type;
        } else {
            return this._kdbType || null;
        }
    };

    moment.duration.fn.nanosecond = moment.prototype.nanosecond =
    moment.duration.fn.nanoseconds = moment.prototype.nanoseconds = function (value) {
        if (!_.isUndefined(value) && !_.isNull(value)) {
            this._n = value;
        } else {
            return this._n || 0;
        }
    };

    moment.duration.fn.formatNano = moment.prototype.formatNano = function (format, options) {
        var nanoFormat = '',
            paddedNanos,
            suffix = '',
            trimmedFormat,
            value;
        
        if (!format) format = 'YYYY-MM-DDTHH:mm:ss.SSSSSSSSS';

        if (format.slice(-1) === 'Z') {
            suffix = 'Z';
            if (format.slice(-10) === 'SSSSSSSSSZ') {
                nanoFormat = 'SSSSSSSSS';
                trimmedFormat = format.slice(0, -11);
            } else if (format.slice(-7) === 'SSSSSSZ') {
                nanoFormat = 'SSSSSS';
                trimmedFormat = format.slice(0, -8);
            } else if (format.slice(-4) === 'SSSZ') {
                nanoFormat = 'SSS';
                trimmedFormat = format.slice(0, -5);
            }
        } else {
            if (format.slice(-9) === 'SSSSSSSSS') {
                nanoFormat = 'SSSSSSSSS';
                trimmedFormat = format.slice(0, -10);
            } else if (format.slice(-6) === 'SSSSSS') {
                nanoFormat = 'SSSSSS';
                trimmedFormat = format.slice(0, -7);
            } else if (format.slice(-3) === 'SSS') {
                nanoFormat = 'SSS';
                trimmedFormat = format.slice(0, -4);
            }
        }
        if (nanoFormat && (this.nanoseconds() || (options && options.trimNano === false))) {
            // KXAX-22633 format for HH:mm equal to 00:00
            value =
              this._kdbType && this._kdbType === "1216"
                ? this.format("HH:mm:ss", { trim: false })
                : this.format(trimmedFormat, options);
            paddedNanos = padLeft(Math.abs((this.milliseconds() * 1000000) + this.nanoseconds()), 9);
            value += ("." + paddedNanos.substring(0, nanoFormat.length));
            value += suffix || ''; // add Z
        } else {
            value = this.format(format, options);
        }
        return value;
    };

    moment.prototype.format = _.wrap(moment.prototype.format, function(fn, inputString) {
        var decPlaces = inputString ? inputString.match(/S/g) : undefined;
        var formatted = inputString ? fn.apply(this, [inputString]) : formatted = fn.apply(this);

        if (decPlaces && decPlaces.length > 3) {
            var decimals = formatted.substr(formatted.lastIndexOf(".") + 1);
            var ms = this.millisecond().toString();
            var ns = this.nanosecond().toString();
            var padding = (_.padStart(ms, 3, "0") + _.padStart(ns, 6, "0"));
            var decimalLength = decPlaces.length;
            var nanos = padding.substring(0, decimalLength);
            formatted = formatted.replace(decimals, nanos);
        }
        return formatted;
    });

    moment.prototype.toDashString = function () {
        var value;

        switch (this.kdbType()) {
            case '1212': // kdb.JTimeStamp YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ
                value = this.toISOString(); // YYYY-MM-DDTHH:mm:ss.SSSZ
                value = value.substr(0, 23) + padLeft(this.nanoseconds(), 6) + 'Z';
                break;
            case '1213': // kdb.JMonth YYYY-MM
                value = this.format('YYYY-MM');
                break;
            case '1214': // kdb.JDate YYYY-MM-DD
                value = this.format('YYYY-MM-DD');
                break;
            default:
                value = this.toISOString(); // YYYY-MM-DDTHH:mm:ss.SSSZ
                break;
        }

        return value;
    };

    moment.duration.fn.toDashString = function () {
        var value = '1970-01-01T' + this.format('HH:mm:ss.SSS', { trim: false }) + 'Z';

        switch (this.kdbType()) {
            case '1216': // kdb.JTimeSpan YYYY-MM-DDTHH:mm:ss.SSSSSSSSSZ
                value = value.substr(0, 23) + padLeft(this.nanoseconds(), 6) + 'Z';
                break;
        }

        return value;
    };

    moment.duration.fn.toKdbObject = moment.prototype.toKdbObject = function () {
        var kdbObject,
            type = this.kdbType() || '1212'; // default to timestamp

        kdbObject = {
            class: type
        };

        switch (type) {
        case '1212': // kdb.JTimeStamp
            // n is milliseconds + nanoseconds
            kdbObject.i = this.valueOf();
            kdbObject.n = (this.milliseconds() * 1000000) + this.nanoseconds();
            break;
        case '1213': // kdb.JMonth
            // i is the number of months since 2000-01
            kdbObject.i = Math.round(this.diff(moment([2000]), 'months', true));
            break;
        case '1214': // kdb.JDate
        case '1215': // kdb.JDateTime
            kdbObject.i = this.valueOf();
            break;
        case '1216': // kdb.JTimeSpan
            // i is in nanoseconds
            kdbObject.i = this.valueOfNano();
            break;
        case '1217': // kdb.JMinute
            // i is in minutes
            kdbObject.i = this.asMinutes();
            break;
        case '1218': // kdb.JSecond
            // i is in seconds
            kdbObject.i = this.asSeconds();
            break;
        case '1219': // kdb.JTime
            // i is in milliseconds
            kdbObject.i = this.valueOf();
            break;
        }

        kdbObject.toString = _.bind(function () {
            return this.toDashString();
        }, this);

        return kdbObject;
    };

    moment.prototype.toISOStringNano = function() {
        var value = this.toISOString();
        if (value) {
            return value.substr(0, 23) + padLeft(this.nanoseconds(), 6) + 'Z';
        }
        return value;
    };

    moment.duration.fn.toISOStringNano = function() {
        var value = '1970-01-01T' + this.format('HH:mm:ss.SSS', { trim: false }) + 'Z';

        return value.substr(0, 23) + padLeft(this.nanoseconds(), 6) + 'Z';
    };

    moment.duration.fn.valueOfNano = moment.prototype.valueOfNano = function () {
        var value = this.valueOf() * 1000000;

        if (_.isNumber(this._n)) {
            value += this.nanoseconds();
        }

        return value;
    };

    return moment;
});