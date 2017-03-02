define(function (require, exports, module) {
    "use strict";
    
    var StatusBar = brackets.getModule("widgets/StatusBar");

    function Status() {
        var $foo = $("<div class='linterhub-statusbar'>Linterhub: Unable</div>");
        StatusBar.addIndicator("repometric.linterhub-brackets.status", $foo, true, "");
    }

    Status.prototype.constructor = Status;

    Status.prototype.handler = function(domain, message, active)
    {
        if(active) StatusBar.showBusyIndicator();
        else StatusBar.hideBusyIndicator();
        $(".linterhub-statusbar").text("Linterhub: " + message);
    };

    module.exports = Status;
});