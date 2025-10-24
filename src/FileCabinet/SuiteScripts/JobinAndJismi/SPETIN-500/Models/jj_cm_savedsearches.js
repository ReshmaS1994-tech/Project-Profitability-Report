/**
 * @NApiVersion 2.1
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
 * Description: This custom module is designed to deliver a consolidated view of project-level financial performance by 
 * leveraging a single, optimized saved search. It systematically pulls and aggregates transaction data from multiple sources,
 * including Invoices, Vendor Bills, Expense Reports, and Journal Entries.The module intelligently classifies transactions 
 * based on account types—specifically distinguishing between income and expense accounts
 *
 * REVISION HISTORY
 *
 * @version 1.0 SPETIN-501: 07-October-2025 : Initial build by JJ0402.
 ******************************************************************************************************************/
define(['N/search', 'N/runtime'], 
    function (search, runtime) {
    const PAGE_SIZE = 10;
    /**
     * Retrieves and aggregates transaction data for project profitability analysis
     * using a paged saved search. Filters transactions by type, account category,
     * and other criteria, then calculates revenue and COGS per project.
     *
     * @param {number|string} subsidiaryId - Optional internal ID of the subsidiary to filter results.
     * @param {number|string} projectId - Optional internal ID of the project to filter results.
     * @returns {Object[]} Array of aggregated project data objects containing:
     *                     - project {string}
     *                     - client {string}
     *                     - revenue {number}
     *                     - cogs {number}
     */
    function runPagedTransactionSearch(subsidiaryId, projectId) {
        try{
        var filters = [
            ["type", "anyof", "Journal", "CustInvc", "VendBill", "ExpRept"],
            "AND",
            ["custbody_jj_project", "noneof", "@NONE@"],
            "AND",
            [
                ["mainline", "is", "F"],
                "OR",
                [
                    ["type", "anyof", "Journal"],
                    "AND",
                    ["mainline", "is", "T"]
                ]
            ],          
            "AND",
            ["posting", "is", "T"],
            "AND",
            ["account.type", "anyof", "COGS", "Income", "Expense", "OthIncome", "OthExpense"],
            "AND",
            ["taxline", "is", "F"],
            "AND",
            ["shipping", "is", "F"]
        ];
        if (subsidiaryId) {
            filters.push("AND", ["subsidiary", "is", subsidiaryId]);
        }
        if (projectId) {
            filters.push("AND", ["custbody_jj_project", "anyof", projectId]);
        }
        var columns = [
            search.createColumn({
                name: "custbody_jj_project",
                summary: "GROUP",
                label: "Project"
            }),
            search.createColumn({
                name: "customer",
                join: "CUSTBODY_JJ_PROJECT",
                summary: "GROUP",
                label: "Client"
            }),
            search.createColumn({
                name: "currency",
                join: "CUSTBODY_JJ_PROJECT",
                summary: "GROUP",
                label: "Currency"
            }),
            search.createColumn({
                name: "custcol_jj_amount_in_usd",
                summary: "SUM",
                label: "Amount in USD"
            }),
            search.createColumn({
                name: "amount",
                summary: "SUM",
                label: "Amount"
            }),
            search.createColumn({
                name: "type",
                join: "account",
                summary: "GROUP",
                label: "Account Type"
            }),
            search.createColumn({
                name: "transactionname",
                summary: "GROUP",
                label: "Transaction Name"
            }),
           search.createColumn({
                name: "custcol_jj_bc_revenue",
                summary: "SUM",
                label: "Base Currency Revenue"
            }),
            search.createColumn({
                name: "custcol_jj_bc_cogs",
                summary: "SUM",
                label: "Base Currency COGS"
            }),
            search.createColumn({
                name: "custcol_jj_bc_gross_pay",
                summary: "SUM",
                label: "Base Currency Gross Pay"
            }),
           
        ];
        var transactionSearch = search.create({
            type: search.Type.TRANSACTION,
            settings: [{ "name": "consolidationtype", "value": "NONE" }],
            filters: filters,
            columns: columns
        });
        let allResults = [];
        let pagedData = transactionSearch.runPaged({ pageSize: PAGE_SIZE });
        pagedData.pageRanges.forEach(function (pageRange) {
            let page = pagedData.fetch({ index: pageRange.index });
            allResults = allResults.concat(page.data);            
        });
        log.debug('All Result:', allResults);
        let projectData = {};
        allResults.forEach(function (result) {
            let projectName = result.getText({
                name: "custbody_jj_project",
                summary: "GROUP",
                label: "Project"
            }) || '';
            let client = result.getText({
                name: "customer",
                join: "CUSTBODY_JJ_PROJECT",
                summary: "GROUP"
            }) || '';
            let projectCurrency = result.getText({
                name: "currency",
                join: "CUSTBODY_JJ_PROJECT",
                summary: "GROUP"
            }) || '';
            let amount = parseFloat(result.getValue({
                name: "amount",
                summary: "SUM"
            })) || 0;
             let amountInUsd = parseFloat(result.getValue({
                name: 'custcol_jj_amount_in_usd',
                summary: "SUM"
            })) || 0;

            let accountType = result.getValue({
                name: "type",
                join: "account",
                summary: "GROUP"
            }) || '';
          
            let  baseCurrencyRevenue= parseFloat(result.getValue({
                name: "custcol_jj_bc_revenue",
                summary: "SUM"
            })) || 0;
             let  baseCurrencyCogs= parseFloat(result.getValue({
                 name: "custcol_jj_bc_cogs",
                summary: "SUM"     
            })) || 0;
             let  baseCurrencyGP= parseFloat(result.getValue({
                 name: "custcol_jj_bc_gross_pay",
                summary: "SUM",
            })) || 0;
            let projectKey = projectName + '-' + client;

            if (!projectData[projectKey]) {
                projectData[projectKey] = {
                    project: projectName,
                    client: client,
                    amount: amount,
                    projectCurrency: projectCurrency,
                    // baseCurrencyRevenue: baseCurrencyRevenue,
                    revenue: 0,
                    cogs: 0,
                    amountUSD:0,
                    bCRevenue:0,
                    bCCogs:0,
                    bCGP:0
                }
            }
            if (['Income', 'OthIncome', 'OthCurrAsset'].includes(accountType)) {
                projectData[projectKey].revenue += amount;
            } else if (['OthExpense', 'Expense', 'COGS'].includes(accountType)) {
                projectData[projectKey].cogs += amount;
            }
            projectData[projectKey].amountUSD += amountInUsd;
            projectData[projectKey].bCRevenue += baseCurrencyRevenue;
            projectData[projectKey].bCCogs += baseCurrencyCogs;
            projectData[projectKey].bCGP += baseCurrencyGP;
        });
        return Object.values(projectData);
    } catch (e) {
      log.error("error@runPagedTransactionSearch", e);
    }
    }
    /**
     * Searches for all projects (jobs) associated with a given subsidiary.
     *
     * @param {string|number} subsidiaryId The internal ID of the subsidiary to search for. This parameter is required.
     * @returns {Array} An array of objects, where each object represents a project and contains its internal ID and entity ID. Returns an empty array if no subsidiaryId is provided or no projects are found.
     */
    function projectSearch(subsidiaryId)
    {
         let projArray = [];
             if (subsidiaryId) {  
                var projectSearch = search.create({
                    type: 'job',
                    filters: [
                        ['subsidiary', 'anyof', subsidiaryId]
                    ],
                    columns: ['internalid', 'entityid']
                });
              projectSearch.run().each(function(result) {
                   projArray.push({internalid:result.getValue('internalid'),entityid:result.getValue('entityid')})
                    return true;
                });
                return projArray;
            }
    }

    /** Utility: get subsidiaries for current user */
    function getSubsidiaryOptionsForUser() {
        try{
        let currentRole = runtime.getCurrentUser().role;
        if (currentRole == '3') {
            let opts = [];
            let subSearch = search.create({
                type: 'subsidiary',
                filters: [['isinactive', 'is', 'F']],
                columns: ['namenohierarchy']
            });
            subSearch.run().each(res => {
                opts.push({ id: res.id, name: res.getValue('namenohierarchy') });
                return true;
            });
            return opts;
        }
        let subsidiaryMap = {};
        let roleSearch = search.create({
            type: "role",
            filters: [["internalid", "anyof", currentRole]],
            columns: [
                search.createColumn({ name: "subsidiaryoption" }),
                search.createColumn({ name: "subsidiary", join: "user" }),
                search.createColumn({ name: "subsidiaries" })
            ]
        });
        roleSearch.run().each(function (result) {
            let option = result.getValue({ name: "subsidiaryoption" });
            if (option === "OWN") {
                let subId = result.getValue({ name: "subsidiary", join: "user" });
                let subName = result.getText({ name: "subsidiary", join: "user" });
                if (subId) subsidiaryMap[subId] = subName;
            } else {
                let subIds = (result.getValue({ name: "subsidiaries" }) || "").split(",");
                let subNames = (result.getText({ name: "subsidiaries" }) || "").split(",");
                subIds.forEach((id, idx) => {
                    let trimmedId = id.trim();
                    let trimmedName = (subNames[idx] || "").trim();
                    if (trimmedId) subsidiaryMap[trimmedId] = trimmedName || `Subsidiary ${trimmedId}`;
                });
            }
            return true;
        });

        return Object.keys(subsidiaryMap).map(id => ({ id, name: subsidiaryMap[id] }));
    }
    catch(e)
    {
       log.error("error@getSubsidiaryOptionsForUser",e);
    }
    }
    return {
        runPagedTransactionSearch: runPagedTransactionSearch,
        getSubsidiaryOptionsForUser: getSubsidiaryOptionsForUser,
        projectSearch:projectSearch
    };
});