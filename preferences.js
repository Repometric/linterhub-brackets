define(function (require, exports, module) {
    "use strict";

    var PreferencesManager = brackets.getModule("preferences/PreferencesManager");

    function Preferences() {
        this.prefs = PreferencesManager.getExtensionPrefs("repometric.linterhub-brackets");
        this.prefs.definePreference("cli_path", "string", null);
        this.prefs.definePreference("run_mode", "number", null);
    }

    Preferences.prototype.constructor = Preferences;

    Preferences.prototype.set = function(name, value) {
        this.prefs.set(name, value);
    };
    
    Preferences.prototype.get = function(name) {
        return this.prefs.get(name);
    };

    module.exports = Preferences;
});