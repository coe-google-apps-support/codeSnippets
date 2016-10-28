/**
 *  GAS stash
 *
 * Assists with handling/preventing "max runtime exceeded" errors during Google Apps Script execution.
 * Meant to be a module for easy addition to any project.
 */



/**
 * FUNCTIONS
 * ---------------------------------------------------------------------------*/


/**
 * Stopwatch function
 * Based on https://gist.github.com/erickoledadevrel/91d3795949e158ab9830
 *
 * @param  {Date}    start      - Timestamp of program start
 * @param  {Number}  maxRuntime - Maximum desired runtime in minutes
 * @return {Boolean}              Whether runtime has exceeded maxRunTime minutes
 */
function runtimeExceeded(start, maxRuntime) {
    var now = new Date();
    return (now.getTime() - start.getTime() > maxRuntime * 60 * 1000);
}



/**
 * Stores all provided variables as UserProperties in the script
 *
 * @param {Object} variables - a key:value store of all the variables to be stashed
 */
function stash(variables) {
    var userProps = PropertiesService.getUserProperties();
    var key, value;

    for (key in variables) {
        value = variables[key];
        Logger.log("Setting " + key + " to " + value);
        userProps.setProperty(key, value);
    }
}



/**
 * Pops keys and values from UserProperties into an object
 *
 * @param  {Object} keys - an object with variable names and stringified values
 * @return {Object}      - completed key:value store for keys that were provided
 */
function pop(keys) {
    var userProps = PropertiesService.getUserProperties();
    var key, value;
    var returnObj = {};

    for (key in keys) {
        try {
            value = userProps.getProperty(key);
            Logger.log("Setting " + key + " to " + value);
            returnObj[key] = value;

        } catch (e) {
            Logger.log(e.message);
            Logger.log(e.lineNumber);
        }
    }
    Logger.log("Restored " + returnObj)
    return returnObj;
}



/**
 * Creates triggers to run the script again later
 * 
 * @param {string} funcToResume - The name of the function to resume, taking no parameters
 * @param {Number} delay        - The length of time in minutes to wait before resuming
 */
function resumeExecutionLater(funcToResume, delay) {
    clearTriggers();
    try {
        // create a new trigger after <delay> minutes
        ScriptApp.newTrigger(funcToResume)
            .timeBased()
            .after(delay * 1000 * 60)
            .create();

        // add a backup trigger to try again after 2*<delay> minutes
        ScriptApp.newTrigger(funcToResume)
            .timeBased()
            .after(delay * 2 * 1000 * 60)
            .create();

        // add a redundant trigger to try again after 4*<delay> minutes
        ScriptApp.newTrigger(funcToResume)
            .timeBased()
            .after(delay * 4 * 60 * 1000 * 60)
            .create();

    } catch (e) {
        Logger.log(e.message);
        Logger.log(e.lineNumber);
    }
}



/**
 * Deletes all triggers
 */
function clearTriggers() {
    // Deletes all project triggers in the current project.
    var pTriggers = ScriptApp.getProjectTriggers();

    for (var i in pTriggers) {
        ScriptApp.deleteTrigger(pTriggers[i]);
    }

    // Deletes all user triggers in current project
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var uTriggers = ScriptApp.getUserTriggers(ss);

    for (var i in uTriggers) {
        ScriptApp.deleteTrigger(uTriggers[i]);
    }

}



/**
 * Deletes all user properties
 */
function clearProperties() {
    PropertiesService.getUserProperties().deleteAllProperties();
}
