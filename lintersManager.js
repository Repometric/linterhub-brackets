define(function (require, exports, module) {
    "use strict";
    
    var CommandManager = brackets.getModule("command/CommandManager"),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        Mustache = brackets.getModule("thirdparty/mustache/mustache"),
        managerTemplate = require("text!templates/managerPanel.html");
    
    function LintersManager(data, integration)
    {
        if(data !== null)
        {
            var $html = Mustache.render(managerTemplate, { linters: data });
            var dialog = Dialogs.showModalDialog("repometric-linterhub-manager no-padding", "Linters Manager", $html);
            $(".repometric-linterhub-manager-button").click(function(event) {
                var linter =  event.target.getAttribute("linter");
                var active = event.target.getAttribute("active");
                integration.exec("activate", linter, active).then(function(data){
                    CommandManager.execute("linterhub.refresh_providers");
                    var $elem = $(".repometric-linterhub-manager-button[linter='" + linter +"']");
                    $elem.attr("active", active == "true" ? "false" : "true");
                    $elem.text(active == "true" ? "Disabled" : "Active");
                    if(active == "true")
                        $elem.removeClass("primary");
                    else
                        $elem.addClass("primary");
                });
            });
        } 
    }
    LintersManager.prototype.constructor = LintersManager;

    module.exports = LintersManager;
});