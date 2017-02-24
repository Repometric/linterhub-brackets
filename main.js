define(function (require, exports, module) {
    "use strict";

    var AppInit = brackets.getModule("utils/AppInit");
    var ExtensionUtils = brackets.getModule("utils/ExtensionUtils");
    var CommandManager = brackets.getModule("command/CommandManager");
    var Menus          = brackets.getModule("command/Menus");
    var CodeInspection  = brackets.getModule('language/CodeInspection');
    var LanguageManager = brackets.getModule('language/LanguageManager');
    var ProjectManager  = brackets.getModule('project/ProjectManager');
    var ExtensionUtils  = brackets.getModule('utils/ExtensionUtils');
    var FileUtils       = brackets.getModule('file/FileUtils');
    var NodeDomain      = brackets.getModule('utils/NodeDomain');
    var StatusBar       = brackets.getModule("widgets/StatusBar");
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager");
    var ProblemWidget = require("ProblemWidget");
    var EditorManager = brackets.getModule("editor/EditorManager");
    
    var $foo = $("<div class='linterhub-statusbar'>Linterhub: Unable</div>");
    StatusBar.addIndicator("repometric.linterhub-brackets.status", $foo, true, "");
    
    var catalog = null; // TODO: parse languages of active linters and register providers
    var integration = new NodeDomain("linterhub", ExtensionUtils.getModulePath(module, "node/domain"));
    var prefs = PreferencesManager.getExtensionPrefs("repometric.linterhub-brackets");
    
    prefs.definePreference("cli_path", "string", null);
    prefs.definePreference("run_mode", "number", null);
    
    function log_handler(domain, message, type)
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
    
    function status_handler(domain, message, active)
    {
        if(active) StatusBar.showBusyIndicator();
        else StatusBar.hideBusyIndicator();
        $(".linterhub-statusbar").text("Linterhub: " + message);
    }
    
    function version_handler() {
        integration.exec("version").then(function (result){
            window.alert(result);
        });
    }
    
    function settings_handler(domain, name, value)
    {
        console.log(name + ": " + value)
        prefs.set(name, value);
    }

    function analyzeFile(text, filePath)
    {
        var deferred = new $.Deferred();
        integration.exec("analyzeFile", filePath)
            .then(function (result) {
                return deferred.resolve(result);
            }, function (err) {
                deferred.reject(err);
            });
        return deferred.promise();
    }
    
    function getCatalog()
    {
        integration.exec("catalog").then(function(data){
            catalog = data;
            return data;
        })
    }

    CommandManager.register("Linterhub Version", "linterhub-menu.version", version_handler);

    var menu = Menus.addMenu("Linterhub", "repometric.linterhub-brackets.main-menu")
    menu.addMenuItem("linterhub-menu.version");
    
    integration.on("log", log_handler);
    integration.on("status", status_handler);
    integration.on("settings", settings_handler);
    
    AppInit.appReady(function () {
        integration.exec("initialize", ProjectManager.getProjectRoot().fullPath, prefs.get("cli_path"), prefs.get("run_mode")).then(function(){
            CodeInspection.register("javascript", {
                name: "Linterhub",
                scanFileAsync: analyzeFile
            });
            getCatalog();
        });
    });

});