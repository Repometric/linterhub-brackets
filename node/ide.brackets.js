(function () {
    "use strict";
    var path = require('path');

    class Logger
    {
        constructor(callback)
        {
            this.callback = callback;
            this.prefix = "Linterhub: ";
        }
        info(string)
        {
            this.callback(this.prefix + string, "info");
        }
        error(string)
        {
            this.callback(this.prefix + string, "error");
        }
        warn(string)
        {
            this.callback(this.prefix + string, "warn");
        }
    }

    class StatusLogger
    {
        constructor(callback)
        {
            this.callback = callback;
        }
        
        update(params, progress, text)
        {
            if(typeof progress !== "undefined")
                this.callback(text, Boolean(progress));
            else
                this.callback(text, true);
        }
    }

    class IntegrationLogic
    {
        constructor(project, version, callback_log, callback_status, callback_save_settings) {
            this.save_settings = callback_save_settings;
            this.project = project;
            this.linterhub_version = version;
            this.logger = new Logger(callback_log);
            this.status = new StatusLogger(callback_status);
            this.status.update(null, false, "Active")
        }

        saveConfig(settings)
        {
            this.save_settings('run_mode', settings.linterhub.mode);
            this.save_settings('cli_path', settings.linterhub.cliPath);
        }

        normalizePath(_path)
        {
            return path.relative(this.project, _path);
        }
        
        sendDiagnostics(data, doc = null) {
            let json = JSON.parse(data);
            var result = {errors: []};
            for (let index = 0; index < json.length; index++) {
                var linterResult = json[index];
                linterResult.Model.Files.forEach((file) => {
                    file.Errors.forEach((error) => {
                        result.errors.push(this.convertError(error, linterResult.Name, file.Path));
                    });
                });
            }
            return result;
        }

        convertError(message, linter, file) {
            var TYPES = [
                "problem_type_error",
                "problem_type_warning",
                "problem_type_meta",
                "problem_type_meta"
            ];
            let row = message.Row || { Start: message.Line, End: message.Line };
            let column = message.Column || { Start: message.Character, End: message.Character };
            return {
                pos: {
                    line: row.Start - 1,
                    ch: column.Start
                },
                endPos: {
                    line: row.End - 1,
                    ch: 1000 // TODO for jshint
                },
                message: linter + ": " + message.Message,
                type: TYPES[message.Severity],
                rule: message.Rule.Name
            };
        }
    }
    exports.IntegrationLogic = IntegrationLogic;
}());