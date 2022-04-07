/*global _,$,console,Backbone */

define(function () {
    var Log = {
        Level: {
            Info: 'INFO',
            Warn: 'WARN',
            Error: 'ERROR',
            Fatal: 'FATAL',
            Critical: 'CRITICAL',
            Off: 'OFF',
            Handled: 'HANDLED',
            Debug: 'DEBUG'
        },
        options: {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        },

        Debug: function (message, argument) {
            var date = new Date(),
                format = date.toLocaleTimeString("en-us", this.options);
            if (argument) {
                console.debug(this.Level.Debug, ':', format, ':', message, ':', argument);
            } else {
                console.debug(this.Level.Debug, ':', format, ':', message);
            }
        },
        Handled: function (message, argument) {
            var date = new Date(),
                format = date.toLocaleTimeString("en-us", this.options);
            if (argument) {
                console.error(this.Level.Handled, ':', format, ':', message, ':', argument);
            } else {
                console.error(this.Level.Handled, ':', format, ':', message);
            }
        },

        Error: function (message, argument) {
            var date = new Date(),
                format = date.toLocaleTimeString("en-us", this.options);
            if (argument) {
                console.error(this.Level.Error, ':', format, ':', message, ':', argument);
            } else {
                console.error(this.Level.Error, ':', format, ':', message);
            }
        },
        Info: function (message, argument) {
            var date = new Date(),
                format = date.toLocaleTimeString("en-us", this.options);
            if (argument) {
                console.info(this.Level.Info, ':', format, ':', message, ':', argument);
            } else {
                console.info(this.Level.Info, ':', format, ':', message);
            }
        },
        Log: function (message, argument) {
            var date = new Date(),
                format = date.toLocaleTimeString("en-us", this.options);
            if (argument) {
                console.log(this.Level.Info, ':', format, ':', message, ':', argument);
            } else {
                console.log(this.Level.Info, ':', format, ':', message);
            }
        },
        Warn: function (message, argument) {
            var date = new Date(),
                format = date.toLocaleTimeString("en-us", this.options);
            if (argument) {
                console.warn(this.Level.Warn, ':', format, ':', message, ':', argument);
            } else {
                console.warn(this.Level.Warn, ':', format, ':', message);
            }
        }

    };
    return Log;
});
