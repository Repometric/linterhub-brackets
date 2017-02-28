define(function (require, exports, module) {
    "use strict";
    
    var Reporter = require("reporter"),
        CodeInspection = brackets.getModule('language/CodeInspection'),
        DocumentManager = brackets.getModule("document/DocumentManager");
    
    var reporter = null;
    var integration = null;
    
    function ReporterHandler(integration_) {
        reporter = new Reporter();
        this.reporter = reporter;
        integration = integration_;
    }

    ReporterHandler.prototype.constructor = ReporterHandler;
    
    ReporterHandler.prototype.addGutter = function(editor) {
        var cm = editor._codeMirror;
        var gutters = cm.getOption("gutters").slice(0);
        if (gutters.indexOf("repometric-linterhub-gutter") === -1) {
            gutters.unshift("repometric-linterhub-gutter");
            cm.setOption("gutters", gutters);
        }
    }
    
    ReporterHandler.prototype.activateEditor = function(editor) {
        if(editor !== null)
            editor._codeMirror.on("gutterClick", this.gutterClick);
    }


    ReporterHandler.prototype.deactivateEditor = function(editor) {
        if(editor !== null)
            editor._codeMirror.off("gutterClick", this.gutterClick);
    }


    ReporterHandler.prototype.gutterClick = function(cm, lineIndex, gutterId) {
        if (gutterId === "repometric-linterhub-gutter") {
            reporter.toggleLineDetails(lineIndex);
            $(".repometric-linterhub-message-ignore").click(function(event) {
                var line = event.target.getAttribute("line");
                var file = event.target.getAttribute("file");
                var rule = event.target.getAttribute("rule");
                integration.exec("ignore", file, line, rule).then(function(){
                    if(DocumentManager.getCurrentDocument() !== null)
                        CodeInspection.inspectFile(DocumentManager.getCurrentDocument().file);
                });
            });
        }
    }

    ReporterHandler.prototype.handleToggleLineDetails = function() {
        this.reporter.toggleLineDetails();
    }

    module.exports = ReporterHandler;
});