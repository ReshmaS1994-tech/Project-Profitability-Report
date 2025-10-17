/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
/********************************************************************************************************************
 *
 * Speridian Technologies-IN-NS
 *
 * SPETIN-501:Backend Data Sync and Search Integration for Project Profitability Report
 *
 ********************************************************************************************************************
 *
 * Author: Jobin & Jismi
 *
 * Date Created: 07-October-2025
 *
 * COPYRIGHT © 2025 Jobin & Jismi. All rights reserved.
 * This script is a proprietary product of Jobin & Jismi and is protected by copyright law and international treaties.
 * Unauthorized reproduction or distribution of this script, or any portion of it, may result in severe civil and criminal 
 * penalties,
 * and will be prosecuted to the maximum extent possible under the law.
 *
 * Description: This client script handles user interactions by detecting changes in filters and page navigation. When a filter
 * is updated, it refreshes the data to reflect the new criteria. It also manages pagination, updating the view when users
 * click "Next" or "Previous," ensuring a smooth and responsive experience.
 *
 * REVISION HISTORY
 *
 * @version 1.0 SPETIN-501: 07-October-2025 : Initial build by JJ0402.
 ******************************************************************************************************************/
define(['N/record', 'N/url', 'N/runtime','N/currentRecord'],
    /**
     * @param{record} record
     * @param{url} url
     */
    function (record, url,currentRecord) {
        'use strict';
        /**
        * Function to be executed after page is initialized.
        *
        * @param {Object} scriptContext
        * @param {Record} scriptContext.currentRecord - Current form record
        * @param {string} scriptContext.mode - The mode in which the record is being accessed (create, copy, or edit)
        *
        * @since 2015.2
        */
        function pageInit(scriptContext) {
            window.onbeforeunload = null;
        }
        /**
         * Function to be executed when field is changed.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.currentRecord - Current form record
         * @param {string} scriptContext.sublistId - Sublist name
         * @param {string} scriptContext.fieldId - Field name
         * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
         * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
         *
         * @since 2015.2
         */
        function fieldChanged(scriptContext) {
            let fieldId = scriptContext.fieldId;
            let curRecord = scriptContext.currentRecord;
            let pageIndex = curRecord.getValue('custpage_page_select');
            let sub = curRecord.getValue('custpage_jj_subsidiary_field') || '';
            let proj = curRecord.getValue('custpage_jj_project') || '';
            if (fieldId === 'custpage_jj_subsidiary_field' || fieldId === 'custpage_jj_project') {
                pageIndex = 0;
            }
            if (fieldId === 'custpage_jj_subsidiary_field' || fieldId === 'custpage_jj_project' || fieldId === 'custpage_page_select') {
                console.log("fieldchanged triggered");
                document.location = url.resolveScript({
                    deploymentId: 'customdeploy_jj_sl_project_prof_report',
                    scriptId: 'customscript_jj_project_pof_report',
                    params: {
                        'sub': sub,
                        'proj': proj,
                        'pageIndex': pageIndex
                    },
                })
            }
        }
       
            return {
                pageInit: pageInit,
                fieldChanged: fieldChanged
              
            };

    });
