(function () {
    "use strict";
    
    var path = require('path');
    var linterhub = require('linterhub-ide');
    var ide = require('./ide.brackets');
    
    let _domainManager = null;
    let integrationLogic = null;
    let api = null;
    function callback_log(string, type)
    {
        _domainManager.emitEvent("linterhub", "log", [string, type]);
    } 
    
    function callback_status(string, active)
    {
        _domainManager.emitEvent("linterhub", "status", [string, active]);
    }
    
    function callback_save_settings(name, value)
    {
        _domainManager.emitEvent("linterhub", "settings", [name, value]);
    }
    
    function init_handler(project_path, cli_path, run_mode, callback) {
        let settings = {
            linterhub: {
                enable: true,
                mode: run_mode,
                cliPath: cli_path,
                cliRoot: path.resolve(__dirname + "/../"),
                run: [
                    linterhub.Run.none,
                    linterhub.Run.force
                ]
            }
        }

        let version = "0.3.4";
        integrationLogic = new ide.IntegrationLogic(project_path, version, callback_log, callback_status, callback_save_settings);
        api = new linterhub.Integration(integrationLogic, settings);
        api.version().then(function(data){
            callback(null, data); 
        });
    }
    
    function version_handler(callback) {
        api.version().then(function(data){
            callback(null, data); 
        });
    }
    
    function analyze_handler(file_path, callback) {
        api.analyzeFile(file_path, linterhub.Run.force).then(function(data){
            callback(null, data); 
        });
    }
    
    function activate_handler(linter, active, callback) {
        if(active == "true"){
            console.log("deactivate");
            api.deactivate(linter).then(function(data){
                callback(null, data); 
            });
        }
        else{
            console.log("activate");
            api.activate(linter).then(function(data){
                callback(null, data); 
            });
        }
    }
    
    function catalog_handler(callback) {
        api.catalog().then(function(data){
            callback(null, data);
        });
    }

    function init(domainManager) {
        if (!domainManager.hasDomain("linterhub")) {
            domainManager.registerDomain("linterhub", {major: 0, minor: 1});
        }

        domainManager.registerCommand(
            "linterhub",
            "initialize",
            init_handler,
            true,
            "Create new instance of Integration class",
            [{name: "project",
                type: "string",
                description: "Path to project"},
            {name: "cli_path",
                type: "string",
                description: "Path to cli"},
            {name: "run_mode",
                type: "number",
                description: "How to run cli (see LinterhubMode)"}],
            [{
                name: "result",
                type: "string",
                description: "String contains linterhub and cli versions"
            }]
        );
        
        domainManager.registerCommand(
            "linterhub",
            "analyzeFile",
            analyze_handler,
            true,
            "Analyze file",
            [{name: "path",
                type: "string",
                description: "Path to file"}],
            [{
                name: "result",
                type: "object",
                description: "The result of the execution"
            }]
        );
        
        domainManager.registerCommand(
            "linterhub",
            "activate",
            activate_handler,
            true,
            "Activate linter",
            [{name: "linter",
                type: "string",
                description: "Linter name"}],
            [{
                name: "active",
                type: "boolean",
                description: "This linter is active or not"
            }]
        );
        
        domainManager.registerCommand(
            "linterhub",
            "catalog",
            catalog_handler,
            true,
            "Get linters catalog",
            [],
            [{
                name: "result",
                type: "object",
                description: "Returns list of linters"
            }]
        );
        
        domainManager.registerCommand(
            "linterhub",
            "version",
            version_handler,
            true,
            "Get versions of all components",
            [],
            [{
                name: "result",
                type: "string",
                description: "String contains linterhub and cli versions"
            }]
        );

        domainManager.registerEvent(
            "linterhub",
            "log",
            [{
                name: "message",
                type: "string",
                description: "String to log"
            },
            {
                name: "type",
                type: "string",
                description: "Type of message"
            }]
        );
        
        domainManager.registerEvent(
            "linterhub",
            "status",
            [{
                name: "message",
                type: "string",
                description: "Status string"
            },
            {
                name: "active",
                type: "boolean",
                description: "Progress status"
            }]
        );
        
        domainManager.registerEvent(
            "linterhub",
            "settings",
            [{
                name: "name",
                type: "string",
                description: "Name of value"
            },
            {
                name: "value",
                type: "object",
                description: "Value to save"
            }]
        );
        
        _domainManager = domainManager;
    }

    exports.init = init;
}());