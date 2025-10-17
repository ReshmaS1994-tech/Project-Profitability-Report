/**
 * @NApiVersion 2.1
 */
/************************************************************************************************
 * * Custom Utility Functions **
 *
 *
 * **********************************************************************************************
 *
 * Author: Jobin and Jismi IT Services
 *
 * Date Created : 30 - October - 2024
 *
 * Created By: 
 *
 * Description : Utility functions
 *
 * REVISION HISTORY
 *
 *
 *
 *
 ***********************************************************************************************/
define(["require", "exports", "N/runtime", "N/util", "N/log"], function (require, exports, runtime, util, log) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.dateLogic = exports.formatText = exports.envMethods = exports.dataSets = exports.applyTryCatch = exports.fixFloat = exports.roundFloat = exports.assignDefaultValue = exports.checkForParameter = exports.ERROR_STACK = void 0;
    /**
     * @description Global variable for storing errors ----> for debugging purposes
     * @type {Array.<Error>}
     * @constant
     */
    const ERROR_STACK = [];
    exports.ERROR_STACK = ERROR_STACK;
    /**
     * @description NetSuite Config Details
     * @typedef NETSUITE_CONFIG
     * @type {Object}
     * @property {String} date_format - The Date Format used in NetSuite
     * @constant
     */
    const NETSUITE_CONFIG = {
        date_format: 'MM/DD/YYYY'
    };
    /**
     * @description Check whether the given parameter argument has value on it or is it empty.
     * ie, To check whether a value exists in parameter
     * @author Manu Antony Vadassery
     * @param {*} parameter parameter which contains/references some values
     * @param {*} parameterName name of the parameter, not mandatory
     * @returns {Boolean} true if there exist a value else false
     */
    const checkForParameter = (parameter, parameterName) => {
        if (parameter !== "" && parameter !== null && parameter !== undefined && parameter !== false && parameter !== "null"
            && parameter !== "undefined" && parameter !== " " && parameter !== 'false') {
            return true;
        }
        else {
            if (parameterName)
                //log.debug('Empty Value found', 'Empty Value for parameter ' + parameterName);
                return false;
        }
    };
    exports.checkForParameter = checkForParameter;
    /**
     * @description To assign a default value if the value argument is empty
     * @author Manu Antony Vadassery
     * @param {String|Number|Boolean|Object|Array|null|undefined} value
     * @param {String|Number|Boolean|Object|Array} defaultValue
     * @returns {*} either value or defaultValue
     */
    const assignDefaultValue = (value, defaultValue) => {
        if (checkForParameter(value))
            return value;
        else
            return defaultValue;
    };
    exports.assignDefaultValue = assignDefaultValue;
    /**
     * @description To round a float number
     * @author Manu Antony Vadassery
     * @param {Number|String} value
     * @param {Number|String} decimals
     * @returns {Number} Floating Point Number with the given precision
     */
    const roundFloat = (value, decimals) => {
        decimals = assignDefaultValue(decimals?.toString(), '2');
        return Number(Math.round(Number(parseFloat(value?.toString()) + 'e' + parseInt(decimals))) + 'e-' + parseInt(decimals));
    };
    exports.roundFloat = roundFloat;
    /**
     * @description To fix a float number to specified decimal parts
     * @author Manu Antony Vadassery
     * @param {Number|String} value
     * @param {Number|String} decimals
     * @returns {Number|String}
     */
    const fixFloat = (value, decimals) => {
        decimals = assignDefaultValue(decimals?.toString(), '2');
        // return roundFloat(parseFloat(value), parseInt(decimals)).toFixed(parseInt(decimals));
        return parseFloat(value).toFixed(decimals);
    };
    exports.fixFloat = fixFloat;
    /**
     * @description Common Try-Catch function, applies to Object contains methods/function
     * @author Manu Antony Vadassery
     * @param {Object.<string,Function|any>} DATA_OBJ Object contains methods/function
     * @param {String} NAME  Name of the Object
     * @returns {void}
     */
    const applyTryCatch = (DATA_OBJ, NAME) => {
        /**
         * @description  Try-Catch function
         * @author Manu Antony Vadassery
         * @param {Function} myfunction - reference to a function
         * @param {String} key - name of the function
         * @returns {Function|false}
         */
        const tryCatch = function (myfunction, key) {
            return function () {
                try {
                    return myfunction.apply(this, arguments);
                }
                catch (e) {
                    log.error("error in " + key, e);
                    ERROR_STACK.push(e);
                    return false;
                }
            };
        };
        for (let key in DATA_OBJ) {
            if (typeof DATA_OBJ[key] === "function") {
                DATA_OBJ[key] = tryCatch(DATA_OBJ[key], NAME + "." + key);
            }
        }
    };
    exports.applyTryCatch = applyTryCatch;
    /**
     * @description dataSets from Saved Search and formatting Saved Search results
     * @author Manu Antony Vadassery
     */
    const dataSets = {
        /**
         * @description Object referencing NetSuite Saved Search
         * @typedef {Object} SearchObj
         * @property {Object[]} filters - Filters Array in Search
         * @property {Object[]} columns - Columns Array in Search
         */
        /**
         * @description to format Saved Search column to key-value pair where each key represents each columns in Saved Search
         * @param {Search} savedSearchObj
         * @param {void|String} priorityKey
         * @returns {Object.<String,SearchObj.columns>}
         */
        fetchSavedSearchColumn(savedSearchObj, priorityKey) {
            let columns = savedSearchObj.columns;
            let columnsData = {}, columnName = '';
            columns.forEach((result, counter) => {
                columnName = '';
                if (result[priorityKey]) {
                    columnName += result[priorityKey];
                }
                else {
                    if (result.summary)
                        columnName += result.summary + '__';
                    if (result.formula)
                        columnName += result.formula + '__';
                    if (result.join)
                        columnName += result.join + '__';
                    columnName += result.name + '__' + counter?.toString();
                }
                columnsData[columnName] = result;
            });
            return columnsData;
        },
        /**
         * @description Representing each result in Final Saved Search Format
         * @typedef formattedEachSearchResult
         * @type {{value:any,text:any}}
         */
        /**
         * @description to fetch and format the single saved search result. ie, Search result of a single row containing both text and value for each columns
         * @param {Object[]} searchResult contains search result of a single row
         * @param {Object.<String,SearchObj.columns>} columns
         * @returns {Object.<String,formattedEachSearchResult>|{}}
         */
        formatSingleSavedSearchResult(searchResult, columns) {
            let responseObj = {};
            for (let column in columns)
                responseObj[column] = {
                    value: searchResult.getValue(columns[column]),
                    text: searchResult.getText(columns[column])
                };
            return responseObj;
        },
        /**
         * @description to iterate over and initiate format of each saved search result
         * @param {Object} param
         * @param {SearchObj} param.searchObj
         * @param {void|Object.<String,SearchObj.columns>} param.columns
         * @param {number} param.PAGE_INDEX
         * @param {number} param.PAGE_SIZE
         * @returns {[]|Object[]}
         */
        iterateSavedSearch({ searchObj, columns, PAGE_INDEX = 1, PAGE_SIZE = 1000 }) {
            if (!checkForParameter(searchObj))
                return false;
            if (!checkForParameter(columns))
                columns = dataSets.fetchSavedSearchColumn(searchObj);
            let response = [];
            let searchPageRanges;
            try {
                searchPageRanges = searchObj.runPaged({
                    pageSize: Number.isInteger(Number(PAGE_SIZE)) ? parseInt(Number(PAGE_SIZE)?.toString()) : 1000 //Default Page Size
                });
            }
            catch (err) {
                return Number.isInteger(PAGE_INDEX) ? {
                    pageInfo: {
                        pageLength: 1,
                        pageIndex: 1,
                        isLastPage: true
                    },
                    lines: []
                } : [];
            }
            if (searchPageRanges.pageRanges.length < 1)
                return Number.isInteger(PAGE_INDEX) ? {
                    pageInfo: {
                        pageLength: 1,
                        pageIndex: 1,
                        isLastPage: true
                    },
                    lines: []
                } : [];
            let pageRangeLength = searchPageRanges.pageRanges.length;
            //log.debug('pageRangeLength', pageRangeLength);
            //To make sure the pageIndex has minimum value of one and maximum value of pageRangeLength
            const pageIndexRangeRectifier = function (value, pageRange) {
                if (!Number.isInteger(Number(value)))
                    return 1;
                if ((Number(value) - 1) <= 0)
                    return 1;
                if ((Number(value) - 1) >= Number(pageRange))
                    return Number(pageRange);
                return Number(value);
            };
            if (Number.isInteger(PAGE_INDEX))
                searchPageRanges.fetch({
                    index: pageIndexRangeRectifier(PAGE_INDEX, pageRangeLength) - 1
                }).data.forEach(function (result) {
                    response.push(dataSets.formatSingleSavedSearchResult(result, columns));
                });
            else
                for (let pageIndex = 0; pageIndex < pageRangeLength; pageIndex++)
                    searchPageRanges.fetch({
                        index: pageIndex
                    }).data.forEach(function (result) {
                        response.push(dataSets.formatSingleSavedSearchResult(result, columns));
                    });
            return Number.isInteger(PAGE_INDEX) ? {
                pageInfo: {
                    pageLength: pageRangeLength,
                    pageIndex: Number(pageIndexRangeRectifier(PAGE_INDEX, pageRangeLength)),
                    isLastPage: Number(pageIndexRangeRectifier(PAGE_INDEX, pageRangeLength)) >= Number(pageRangeLength) ? true : false
                },
                lines: response
            } : response;
        }
    };
    exports.dataSets = dataSets;
    applyTryCatch(dataSets, 'JJ CM NS Utility, dataSets');
    /**
     * To encapsulate the functions related to script, environment
     * @author Manu Antony Vadassery
     */
    const envMethods = {
        /**
         * Contains the reference to runtime object after this script is initialized
         */
        currentScript: null,
        /**
         * Contains the reference to runtime user after this script is initialized
         */
        currentUser: null,
        /**
         * Script related Values
         */
        scriptObj: {
            id: null,
            deploymentId: null,
            getRemainingUsage: null,
            getParameter: null
        },
        /**
         * Script Environment related Values
         */
        envType: {
            SANDBOX: null,
            PRODUCTION: null,
            BETA: null,
            INTERNAL: null,
        },
        /**
         * User Environment related Values
         */
        userType: {
            CONTACT: null,
            DEPARTMENT: null,
            EMAIL: null,
            ID: null,
            LOCATION: null,
            NAME: null,
            ROLE: null,
            ROLE_CENTER: null,
            ROLE_ID: null,
            SUBSIDIARY: null,
        },
        /**
         * To initialize this object
         */
        init() {
            envMethods.currentScript = runtime.getCurrentScript();
            envMethods.currentUser = runtime.getCurrentUser();
            envMethods.scriptObj = {
                /**
                 * Contains the Script Id
                 */
                id: envMethods.currentScript.id,
                /**
                 * Contains the Script Deployment Id
                 */
                deploymentId: envMethods.currentScript.deploymentId,
                /**
                 * Retrieve the remaining usage of the script
                 * @returns {number}
                 */
                getRemainingUsage() {
                    return Number(envMethods.currentScript.getRemainingUsage());
                },
                /**
                 * Retrieve the value on the script parameter
                 * @param paramName
                 * @returns {boolean|*}
                 */
                getParameter(paramName) {
                    //arguments = Array.prototype.slice(Array.prototype.shift.apply(arguments));
                    if (paramName)
                        return assignDefaultValue(envMethods.currentScript.getParameter({
                            name: paramName.toString().toLowerCase().trim()
                        }), false);
                    return false;
                }
            };
            /**
             * To initialize this object
             */
            envMethods.userType = {
                CONTACT: envMethods.currentUser?.contact,
                DEPARTMENT: envMethods.currentUser?.department,
                EMAIL: envMethods.currentUser?.email,
                ID: envMethods.currentUser?.id,
                LOCATION: envMethods.currentUser?.location,
                NAME: envMethods.currentUser?.name,
                ROLE: envMethods.currentUser?.role,
                ROLE_CENTER: envMethods.currentUser?.roleCenter,
                ROLE_ID: envMethods.currentUser?.roleId,
                SUBSIDIARY: envMethods.currentUser?.subsidiary,
            };
            let myEnvType = runtime.envType;
            envMethods.envType = {
                SANDBOX: myEnvType == runtime.EnvType.SANDBOX,
                PRODUCTION: myEnvType == runtime.EnvType.PRODUCTION,
                BETA: myEnvType == runtime.EnvType.BETA,
                INTERNAL: myEnvType == runtime.EnvType.INTERNAL,
            };
            return this;
        }
    };
    exports.envMethods = envMethods;
    applyTryCatch(envMethods, 'JJ CM NS Utility, envMethods');
    /**
     * Apply Styles
     * @author Manu Antony Vadassery
     */
    const formatText = {
        allignContent(value, alignValue, noValue) {
            alignValue = assignDefaultValue(alignValue, "center");
            noValue = assignDefaultValue(noValue, "-");
            return ('<p align="' + alignValue + '">' + assignDefaultValue(value, noValue) + "</p>");
        },
        applyLink(hrefURL, text) {
            hrefURL = assignDefaultValue(hrefURL, "javascript:void(0);");
            text = assignDefaultValue(text, '- NIL -');
            return '<a href="' + hrefURL + '" target="_blank" >' + text + '</a>';
        },
        applyStyle(param) {
            let str = '<span style="';
            if (param.FONT_WEIGHT)
                str += "font-weight:" + param.FONT_WEIGHT + ";";
            if (param.FONT_COLOR)
                str += "color:" + param.FONT_COLOR + ";";
            if (param.FONT_SIZE)
                str += "font-size:" + param.FONT_SIZE + ";";
            if (param.FONT_STYLE)
                str += "font-style:" + param.FONT_STYLE + ";";
            if (param.FONT_FAMILY)
                str += "font-family:" + param.FONT_FAMILY + ";";
            str += '"> ' + param.VALUE + " </span>";
            return str;
        }
    };
    exports.formatText = formatText;
    applyTryCatch(formatText, 'JJ CM NS Utility, formatText');
    /**
     * @description Methods for different date logic
     * @author Manu Antony Vadassery
     */
    const dateLogic = {
        /**
         * @description Check whether we can generate a valid date with the given data
         * @param {*|String[]} dataArray
         * @returns {boolean}
         */
        validateGivenDate(dataArray) {
            //return !(!dateLogic.checkDateFormat(dataArray) || "Invalid Date" === new Date(Number(dataArray[0]), Number(dataArray[1]) - 1, dataArray[2]).toString());
            return dateLogic.checkDateFormat(dataArray) && "Invalid Date" !== dateLogic.generateDate(dataArray).toString();
        },
        /**
         * @typedef dateArray
         * @type {Array}
         * @property {string} 0 - YYYY, denotes Year
         * @property {string} 1 - MM, denotes Month
         * @property {string} 2 - DD, denoted Day
         * /
         /**
         * @description To check whether the given date is in format of [Number,Number,Number]. ie, [YYYY,MM,DD]
         * @param {dateArray} dataArray - format of [Number,Number,Number]. ie, [YYYY,MM,DD]
         * @returns {boolean}
         */
        checkDateFormat(dataArray) {
            //return !(!Array.isArray(dataArray) || 3 !== dataArray.length || !dataArray.reduce(function (i, j) { return Number.isInteger(Number(j)) && i }, !0));
            return Array.isArray(dataArray) && 3 === dataArray.length && dataArray.reduce(function (i, j) {
                return i && Number.isInteger(Number(j));
            }, true);
        },
        /**
         * @description To check whether the given date range is correct
         * @param {dateArray} startDate
         * @param {dateArray} endDate
         * @returns {boolean}
         */
        validateDateRange(startDate, endDate) {
            return (checkForParameter(startDate) && checkForParameter(endDate) && dateLogic.validateGivenDate(startDate) && dateLogic.validateGivenDate(endDate)) &&
                (dateLogic.generateDate(endDate).getTime() > dateLogic.generateDate(startDate).getTime()); //endDate should be greater than startDate
        },
        /**
         * check whether the given dateObj is instance of Date Object
         * @param {Date} dateObj
         * @returns {boolean}
         */
        isInstanceOfDate(dateObj) {
            //return !(!checkForParameter(dateObj) || '[object Date]' !== Object.prototype.toString.call(dateObj))
            return checkForParameter(dateObj) && '[object Date]' === Object.prototype.toString.call(dateObj);
        },
        /**
         * To generate Date Object with the given data
         * @param {[string,string,string]} dataArray
         * @returns {Date}
         */
        generateDate(dataArray) {
            if (dateLogic.checkDateFormat(dataArray))
                return new Date(Number(dataArray[0]), Math.abs(Number(dataArray[1]) - 1) % 12, Number(dataArray[2]));
            return new Date('false');
        },
        /**
         * @description To format the Date Object into the given type/format
         * @param {Date} dateObj
         * @param {String} type
         * @returns {boolean|String}
         */
        formatDate(dateObj, type) {
            if (!dateLogic.isInstanceOfDate(dateObj))
                return false;
            let dateAsKeys = dateLogic.splitDate(dateObj);
            //log.debug("dateAsKeys", dateAsKeys);
            if (dateAsKeys)
                switch (type) {
                    case 'MM/DD/YYYY':
                        ;
                    case 'M/D/YYYY':
                        return dateLogic.changeDateFormat(dateAsKeys, type, '/');
                    case 'D/M/YYYY':
                        ;
                    case 'DD/MM/YYYY':
                        return dateLogic.changeDateFormat(dateAsKeys, type, '/');
                    case 'YYYY-MM-DD':
                        return dateLogic.changeDateFormat(dateAsKeys, type, '-');
                    default:
                        return dateLogic.changeDateFormat(dateAsKeys, 'MM/DD/YYYY', '/');
                }
            ;
            return false;
        },
        /**
         * check the dateAsKeys object contain the keys and return the date in given type/format
         * @param {Object<String, Number>} dateAsKeys
         * @param {String} type
         * @param {String} delimiter
         * @returns {string|boolean}
         */
        changeDateFormat(dateAsKeys, type, delimiter) {
            if (!checkForParameter(dateAsKeys.DD) || !checkForParameter(dateAsKeys.MM) || !checkForParameter(dateAsKeys.YYYY) || !checkForParameter(type) || !checkForParameter(delimiter))
                return false;
            return type.split(delimiter).reduce(function (i, j) {
                return i.push(dateAsKeys[j]), i;
            }, []).join(delimiter);
        },
        /**
         * Take the Date Object and return it as {DD:value, MM:value, YYYY:value}
         * @param {Date} dateObj
         * @returns {boolean|{ 'DD': string, 'D': string, 'MM': string, 'M': string, 'YYYY': string }}
         */
        splitDate(dateObj) {
            if (!dateLogic.isInstanceOfDate(dateObj))
                return false;
            return {
                D: dateObj.getDate()?.toString(),
                DD: dateObj.getDate() < 10 ? ('0' + dateObj.getDate())?.toString() : dateObj.getDate()?.toString(),
                M: (dateObj.getMonth() + 1)?.toString(),
                MM: (dateObj.getMonth() + 1) < 10 ? ('0' + (dateObj.getMonth() + 1))?.toString() : (dateObj.getMonth() + 1)?.toString(),
                YYYY: dateObj.getFullYear()?.toString()
            };
        },
        /**
         * Add/Subtract days from Date Object
         * @param {Date} dateObj
         * @param {Number} counter
         * @returns {boolean|Date}
         */
        addDays(dateObj, counter = 0) {
            if (!dateLogic.isInstanceOfDate(dateObj))
                return false;
            return new Date(dateObj.setDate(dateObj.getDate() + counter));
        },
        /**
         * Take the Date Object and return it as [YYYY,MM,DD]
         * @param {Date} dateObj
         * @returns {[string, string, string]|boolean}
         */
        dateAsArray(dateObj) {
            if (!dateLogic.isInstanceOfDate(dateObj))
                return false;
            let dateAsKeys = dateLogic.splitDate(dateObj);
            if (util.isObject(dateAsKeys))
                return [dateAsKeys.YYYY, dateAsKeys.MM, dateAsKeys.DD];
        }
    };
    exports.dateLogic = dateLogic;
    applyTryCatch(dateLogic, 'JJ CM NS Utility, dateLogic');
});