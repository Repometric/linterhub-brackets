define(function (require, exports, module) {
    "use strict";

    var AppInit = brackets.getModule("utils/AppInit"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        Menus = brackets.getModule("command/Menus"),
        Preferences = require("preferences"),
        Handlers = require("handlers"),
        EditorManager = brackets.getModule("editor/EditorManager");
    
    var preferences = new Preferences();
    var handlers = new Handlers(preferences);
    
    ExtensionUtils.loadStyleSheet(module, "style.less");

    var menu = Menus.addMenu("Linterhub", "repometric.linterhub-brackets.main-menu");
    menu.addMenuItem("linterhub-menu.analyze");
    menu.addMenuItem("linterhub-menu.manager");
    menu.addMenuDivider();
    menu.addMenuItem("linterhub-menu.version");
    
    AppInit.appReady(function () {
        handlers.initialize(preferences.get("cli_path"), preferences.get("run_mode")).then(function(){
            handlers.refresh_providers().then(function(){
                handlers.reporterHandlers.activateEditor(EditorManager.getActiveEditor()); 
            });  
        });
    });

});