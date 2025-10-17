/**
* @NApiVersion 2.1
* @NScriptType Suitelet
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
 * Description: This custom Suitelet module is designed to provide a comprehensive view of project profitability by aggregating 
 * financial data from multiple transaction types—Invoices, Vendor Bills, Expense Reports, and Journal Entries—using a single, 
 * optimized saved search. The backend logic efficiently categorizes transactions based on income and expense account types,
 * enabling accurate calculation of Total Revenue and Cost of Goods Sold (COGS) for each project.
 *
 * REVISION HISTORY
 *
 * @version 1.0 SPETIN-501: 07-October-2025 : Initial build by JJ0402.
 ******************************************************************************************************************/
define(['N/ui/serverWidget', '../Models/jj_cm_savedsearches.js'],
    function (serverWidget, cm_model) {
        const onRequest = (context) => {
            let request = context.request;
            let subsidiaryId = request.parameters.sub || '';
            let projectId = request.parameters.proj || '';
            let pageIndexStr = request.parameters.pageIndex || '0';
            let pageIndex = parseInt(pageIndexStr) || 0;
            let form = serverWidget.createForm({ title: 'Project Profitability Report' });
            form.clientScriptModulePath = '../Services/jj_cs_project_profitability_report.js';
            let subsidiaryField = form.addField({
                id: 'custpage_jj_subsidiary_field',
                type: serverWidget.FieldType.SELECT,
                label: 'Subsidiary'
            });
            subsidiaryField.updateBreakType({
                breakType: serverWidget.FieldBreakType.STARTROW
            });
            let roleBasedSubsidiary = cm_model.getSubsidiaryOptionsForUser();
            subsidiaryField.addSelectOption({ value: '', text: '' });
            roleBasedSubsidiary.forEach(opt => {
                subsidiaryField.addSelectOption({
                    value: opt.id,
                    text: opt.name,
                    isSelected: (opt.id === subsidiaryId)
                });
            });
            if (subsidiaryId) subsidiaryField.defaultValue = subsidiaryId;

            let projectField = form.addField({
                id: 'custpage_jj_project',
                type: serverWidget.FieldType.SELECT,
                label: 'Project',
                source: 'job'
            });
            projectField.updateBreakType({
                breakType: serverWidget.FieldBreakType.STARTROW
            });
            if (projectId) projectField.defaultValue = projectId;
            let allResults = cm_model.runPagedTransactionSearch(subsidiaryId, projectId);
            let pageSize = 10;
            let pageCount = Math.ceil(allResults.length / pageSize);
            let startIndex = pageIndex * pageSize;
            let endIndex = startIndex + pageSize;
            let pagedResults = allResults.slice(startIndex, endIndex);
            let subtab = form.addSubtab({
                id: 'custpage_subtab',
                label: 'Project Profitability',
            })

            const spacerField = form.addField({
                id: 'custpage_spacer',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' '
            });
            let selectPageField = form.addField({
                id: 'custpage_page_select',
                type: serverWidget.FieldType.SELECT,
                label: 'Select Page',
                container: 'custpage_subtab'
            });
            selectPageField.updateDisplaySize({
                width: 60,
                height: 50
            });

            for (let i = 0; i < pageCount; i++) {
                selectPageField.addSelectOption({
                    value: i.toString(),
                    text: (i + 1).toString(),
                    isSelected: (i === pageIndex)
                });
            }
            if (pageIndexStr)
                selectPageField.defaultValue = pageIndexStr;
            let subList = form.addSublist({
                id: 'custpage_jj_report',
                type: serverWidget.SublistType.LIST,
                label: 'Project Profitability',
                tab: 'custpage_subtab'
            });
            subList.addField({
                id: 'custpage_jj_project',
                type: serverWidget.FieldType.TEXT,
                label: 'Project'
            });
            subList.addField({
                id: 'custpage_jj_client',
                type: serverWidget.FieldType.TEXT,
                label: 'Client'
            });
            subList.addField({
                id: 'custpage_jj_currency',
                type: serverWidget.FieldType.TEXT,
                label: 'Project Currency'
            });
            subList.addField({
                id: 'custpage_jj_amountinusd',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Amount in usd'
            });
            subList.addField({
                id: 'custpage_jj_revenue',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Revenue'
            });
            subList.addField({
                id: 'custpage_jj_basecurrencyrevenue',
                type: serverWidget.FieldType.CURRENCY,
                label: 'base currency Revenue'
            });
            subList.addField({
                id: 'custpage_jj_cogs',
                type: serverWidget.FieldType.CURRENCY,
                label: 'COGS'
            });
            subList.addField({
                id: 'custpage_jj_basecurrencycogs',
                type: serverWidget.FieldType.CURRENCY,
                label: 'base currency COGS'
            });
            subList.addField({
                id: 'custpage_jj_grossprofit',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Gross Profit'
            });
            subList.addField({
                id: 'custpage_jj_basecurrencygrossprofit',
                type: serverWidget.FieldType.CURRENCY,
                label: 'base currency Gross Profit'
            });
            subList.addField({
                id: 'custpage_jj_grossmargin',
                type: serverWidget.FieldType.PERCENT,
                label: 'Gross Margin(%)'
            });
            pagedResults.forEach((data, line) => {
                let grossProfit = data.revenue - data.cogs;
                let grossMargin = (data.revenue !== 0) ? (grossProfit / data.revenue) * 100 : 0;
                subList.setSublistValue({
                    id: 'custpage_jj_project',
                    line,
                    value: data.project || ' '
                });
                subList.setSublistValue({
                    id: 'custpage_jj_client',
                    line,
                    value: data.client || ' '
                });
                subList.setSublistValue({
                    id: 'custpage_jj_currency',
                    line,
                    value: data.projectCurrency || '',
                });
                subList.setSublistValue({
                    id: 'custpage_jj_amountinusd',
                    line,
                    value: data.amountUSD || 0,
                });
                subList.setSublistValue({
                    id: 'custpage_jj_revenue',
                    line,
                    value: data.revenue || 0,
                });
                subList.setSublistValue({
                    id: 'custpage_jj_basecurrencyrevenue',
                    line,
                    value: data.bCRevenue || 0,
                });

                subList.setSublistValue({
                    id: 'custpage_jj_cogs',
                    line,
                    value: data.cogs
                });
                subList.setSublistValue({
                    id: 'custpage_jj_basecurrencycogs',
                    line,
                    value: data.bCCogs
                });
                subList.setSublistValue({
                    id: 'custpage_jj_grossprofit',
                    line,
                    value: grossProfit
                });
                subList.setSublistValue({
                    id: 'custpage_jj_basecurrencygrossprofit',
                    line,
                    value: data.bCGP
                });
                subList.setSublistValue({
                    id: 'custpage_jj_grossmargin',
                    line,
                    value: grossMargin.toFixed(2)
                });
            });

            context.response.writePage(form);
        };
        return { onRequest };
    });
