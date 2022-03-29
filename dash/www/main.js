/*global require */
var PATHS = {
    default: {
        components: 'json!../components.json',
        config: 'json!../config.json',
        baseUrl: '../modules',
    },
    finsembleLite: {
        components: 'json!../../components.json',
        config: 'json!../../config.json',
        baseUrl: '../../modules',
    }
};

if ("ontouchstart" in window || (window.DocumentTouch && document instanceof DocumentTouch)) {
    document.documentElement.className += " " + "touch";
} else {
    document.documentElement.className += " " + "no-touch";
}

// Define dummy parameters (in case none are set)
define('parameters', {});

// Load config file and apply settings
require(['parameters'], function (parameters) {
    var quickview = (parameters['quickview'] || parameters['printMode']),
        paths = parameters.paths || (parameters.isFinsembleLiteAuth ? PATHS.finsembleLite : PATHS.default);

    // Quickview uses baseUrl one level up
    require.config({
        baseUrl: (quickview) ? './modules' : paths.baseUrl
    });

    // Load global config and apply to our own config
    require([paths.config], function (globalConfig) {
        var config = {};

        config['apps'] = globalConfig['dashboards']['apps'];
        config['connection'] = globalConfig['dashboards']['connection'];
        config['parameters'] = parameters;
        config['quickbase'] = globalConfig['dashboards']['quickbase'];

        // Set initial require config
        require.config(globalConfig['require']);

        getComponents(config);
    }, function () {
        console.error("Load Error: no config file found");
    });
});

function getComponents(config) {
    var paths = config.parameters.isFinsembleLiteAuth ? PATHS.finsembleLite : PATHS.default;

    // Get the list of apps from components.json and their versions from version.json
    require([paths.components], function (components) {
        require(['json!version.json'], function (versions) {
            // Load with components and version info
            loadApps({
                components: components,
                config: config,
                versions: versions
            });
        }, function () {
            // Error loading versions  - load with component info only
            console.warn("Loading: no version file found");
            loadApps({
                components: components,
                config: config
            });
        });
    }, function () {
        // Error loading components - load with base apps only
        console.warn("Loading: no components file found");
        loadApps({
            config: config
        });
    });
};

function loadApps(options) {
    var apps,
        components,
        config,
        paths = {},
        packages = [],
        quickview,
        versions;

    // Get options/defaults
    components = options.components || [];
    config = options.config || {};
    versions = options.versions || {};
    quickbase = config.quickbase || {};

    quickview = (config['parameters']['quickview'] || config['parameters']['printMode']);

    // Overwrite default connection with passed parameters
    config['appConfig'] = config['connection'];
    for (var attribute in config['parameters']) {
        if (config['parameters'][attribute] !== 'null') {
            config['appConfig'][attribute] = config['parameters'][attribute];
        }
    }
    
    // Get keys for components and baseApps
    apps = components.map(function (component) {
        return component['appKey'];
    });
    apps = apps.concat(config['apps']['base']);

    // Include any other apps listed in versions.json
    apps = apps.concat(Object.keys(versions).filter(function (appKey) {
        return apps.indexOf(appKey) === -1;
    }));

    // Create packages
    apps.forEach(function (app) {
        packages.push({
            name: app,
            location: (versions[app] || app)
        });
    });

    // Set packages config for files in QuickBase
    for (var name in quickbase) {
        if (!quickbase.hasOwnProperty(name)) continue;

        packages.push({
            name: name,
            location: (versions['QuickBase'] || 'QuickBase'),
            main: quickbase[name]
        });
    }

    paths['Hammer'] = (versions['AdvancedCharts'] || 'AdvancedCharts') + '/hammer3';

    // Add packages and paths to require config
    // Reset urlArgs (used to avoid caching main/component/version files)
    require.config({
        packages: packages,
        paths: paths,
        urlArgs: null
    });

    // Load main app
    require([
            quickview ? config['apps']['view'] : config['apps']['edit'],
            'client',
            'kdb',
            'jquery',
            'underscore',
            'backbone',
            'select2',
            'css!kx-darkroom',
            'css!kx-light'
    ], function (mainApp, win, kdb) {
        var loadFn,
            options;

        // Attach globals
        window.kdb = kdb;
        window.win = win;

        options = config['appConfig'];
        options['el'] = $('#appdiv');
        options['components'] = components;
        options['versions'] = versions;

        loadFn = function () {
            // Initialize app with mainApp config
            var app = new mainApp(options);
        };

        if(config['appConfig']['Theme']) {
            require(['css!../theme/' + config['appConfig']['Theme'] + '/style.css'], function () {
                loadFn();
            });
        } else {
            loadFn();
        }
    },
    function (e) {
        debugger;
    });

    // Load css in parallel
    require([
        'css!css/font-awesome-4.7.0/css/font-awesome.min.css',
        'css!css/material-icons/css/material-icons.min.css',
        'css!css/jquery-ui-fa.css']);
}
