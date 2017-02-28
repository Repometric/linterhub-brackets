define(function (require, exports, module) {
    "use strict";

    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        CommandManager = brackets.getModule("command/CommandManager"),
        CodeInspection = brackets.getModule('language/CodeInspection'),
        ProjectManager = brackets.getModule('project/ProjectManager'),
        NodeDomain = brackets.getModule('utils/NodeDomain'),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        Status = require("status"),
        LintersManager = require("lintersManager"),
        ReporterHandlers = require("reporterHandlers"),
        EditorManager = brackets.getModule("editor/EditorManager");
    
    var status = null;
    var preferences = null;
    var integration = null;
    var reporterHandlers = null;
    
    function Handlers(prefs) {
        status = new Status();
        preferences = prefs;
        integration = new NodeDomain("linterhub", ExtensionUtils.getModulePath(module, "node/domain"));
        reporterHandlers = new ReporterHandlers(integration);
        this.reporterHandlers = reporterHandlers;
        CommandManager.register("Linterhub Version", "linterhub-menu.version", this.showVersion);
        CommandManager.register("Analyze file", "linterhub-menu.analyze", this.analyze);
        CommandManager.register("Refresh providers", "linterhub-menu.refresh_providers", this.refresh_providers);
        CommandManager.register("Open Linters Manager", "linterhub-menu.manager", this.showManager);
        integration.on("log", this.log);
        integration.on("status", status.handler);
        integration.on("settings", this.settings);
    }

    Handlers.prototype.constructor = Handlers;
    
    Handlers.prototype.refresh_providers = function()
    {
        status.handler(null, "Refreshing providers..", true);
        var self = this;
        return this.getCatalog().then(function(catalog){
            for (var i = 0, len = catalog.length; i < len; i++) {
                if(catalog[i].active)
                {
                    var language = catalog[i].languages;
                    var lang_h = language.charAt(0).toUpperCase() + language.slice(1);
                    var provider_id = "Linterhub " + lang_h;
                    if($.inArray(provider_id, CodeInspection.getProviderIDsForLanguage(language)) == -1)
                    {
                        CodeInspection.register(language, {
                            name: provider_id,
                            scanFileAsync: self.analyzeFile
                        });
                    }
                }
            }
            status.handler(null, "Active", false);
        })
    }
    
    Handlers.prototype.showManager = function()
    {
        return integration.exec("catalog").then(function(data){
           return new LintersManager(data, integration);
        });
    }
    
    Handlers.prototype.settings = function(domain, name, value)
    {
        preferences.set(name, value);
    }
    
    Handlers.prototype.log = function(domain, message, type)
    {
        switch(type)
        {
            case "info":
                console.info(message);
                break;
            case "error":
                console.error(message);
                break;
            case "warn":
                console.warn(message);
                break;
        }
    }
    
    Handlers.prototype.analyzeFile = function(text, filePath)
    {
        function convert_type(type)
        {
            switch(type)
            {
                case "problem_type_error": return "error";
                case "problem_type_warning": return "warning";
                case "problem_type_meta": return "info";
            }
        }
        var deferred = new $.Deferred();
        integration.exec("analyzeFile", filePath)
            .then(function (result) {
                var activeEditor = EditorManager.getActiveEditor();
                var cm = activeEditor._codeMirror;
                var messages = [];
                result.errors.forEach(function(x){
                    messages.push({
                        "id": x.rule,
                        "code": x.rule,
                        "type": convert_type(x.type),
                        "message": x.message,
                        "token": {
                            "start": x.pos,
                            "end": x.endPos
                        },
                        "pos": {
                            "line": x.pos.line + 1,
                            "ch": x.pos.ch + 1
                        },
                        "file": filePath
                    });
                });
                reporterHandlers.reporter.report(cm, messages);
                reporterHandlers.reporter.toggleLineDetails();
                reporterHandlers.deactivateEditor(EditorManager.getActiveEditor());
                reporterHandlers.activateEditor(EditorManager.getActiveEditor());
                reporterHandlers.addGutter(EditorManager.getActiveEditor());
                return deferred.resolve(result);
            }, function (err) {
                deferred.reject(err);
            });
        return deferred.promise();
    }
    
    Handlers.prototype.showVersion = function(){
        integration.exec("version").then(function (result){
            Dialogs.showModalDialog("repometric-linterhub-version", "Linterhub Version", result);
        });
    }
    
    Handlers.prototype.analyze = function()
    {
        if(DocumentManager.getCurrentDocument() !== null)
            CodeInspection.inspectFile(DocumentManager.getCurrentDocument().file);
    }
    
    Handlers.prototype.getCatalog = function()
    {
        return integration.exec("catalog").then(function(data){
            return data;
        });
    }
    
    Handlers.prototype.initialize = function(cli_path, run_mode){
        return integration.exec("initialize", ProjectManager.getProjectRoot().fullPath, cli_path, run_mode);
    }
    
    module.exports = Handlers;

});