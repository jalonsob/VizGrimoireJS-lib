/*
 * Copyright (C) 2012-2015 Bitergia
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307, USA.
 *
 * This file is a part of the VizGrimoireJS package
 *
 * Authors:
 *   Alvaro del Castillo San Felix <acs@bitergia.com>
 *   Luis Cañas-Díaz <lcanas@bitergia.com>
 */

String.prototype.supplant = function(o) {
  return this.replace(/{([^{}]*)}/g,function(a, b) {
    var r = o[b];
    return typeof r === 'string' || typeof r === 'number' ? r : a;
  });
};

// PeopleTable
var Table = {};

(function() {

    Table.displayTopTable = displayTopTable;
    Table.simpleTable = displaySimpleTable;
    Table.gerritTable = displayGerritTable;
    Table.meetupGroupsTable = displayMeetupGroupsTable;

    /*
    * Display a raw bootstrap table with headers and rows
    * @param {object()} div - html object where table will be appended
    * @param {object()} data - Contains array of columns
    */
    function displaySimpleTable(div, data, headers, cols){
        var tables,
            aux_html,
            random_id;

        random_id = "myTable" + Math.floor((Math.random() * 9999) + 1);

        tables= '<table id="' + random_id +'" class="table table-striped tablesorter">';

        aux_html = composeSimpleHeaders(headers);
        aux_html += '<tbody>';
        var first_col = handleWeirdJSON(data, cols);
        aux_html += composeSimpleRows(first_col, cols, data);
        aux_html += '</tbody>';

        tables += aux_html;
        tables += '</table>';

        tables += '<script>$(document).ready(function(){'+
                '$("#' + random_id + '").tablesorter();}'+
                '); </script>';
        //return tables;
        $("#"+div.id).append(tables);
    }

    /*
    * This snippet was added to fix an error in the JSON
    */
    function handleWeirdJSON(data, cols){
        var first_col,
            aux_col;
        if ( typeof(data[cols[0]]) !== 'object'){
            aux_col = [];
            aux_col[0] = data[cols[0]];
            first_col = aux_col;
        }else{
            first_col = data[cols[0]];
        }
        return first_col;
    }

    function composeSimpleRows(first_col, cols, data){
        var aux_html = '';
        $.each(first_col, function(id, value){
            aux_html += '<tr>';
            var cont = id + 1;
            aux_html += '<td>' + cont + '</td>';
            $.each(cols, function(subid, name){
                if (typeof(data[name]) !== 'object'){
                    /*
                    * FIXME: this hack is to survive a malformed JSON
                    */
                    aux_html += '<td>'+data[name]+'</td>';
                }else{
                    aux_html += '<td>'+data[name][id]+'</td>';
                }
            });
            aux_html += '</tr>';
        });
        return aux_html;
    }

    /*
    * Display a raw bootstrap table with headers and rows
    * @param {object()} div - html object where table will be appended
    * @param {object()} data - Contains array of columns
    */
    function displayGerritTable(div, data, headers, cols){
        var tables,
            aux_html,
            random_id,
            gerrit_site = Report.getGerritSite();


        random_id = "myTable" + Math.floor((Math.random() * 9999) + 1);

        tables= '<table id="' + random_id +'" class="table table-striped tablesorter">';

        aux_html = composeSimpleHeaders(headers);
        aux_html += '<tbody>';
        var first_col = handleWeirdJSON(data, cols);
        //aux_html += composeSimpleRows(first_col, aux_html, cols, data);
        $.each(first_col, function(id, value){
            aux_html += '<tr>';
            var cont = id + 1,
                get_var;
            aux_html += '<td>' + cont + '</td>';
            $.each(cols, function(subid, name){
                if (typeof(data[name]) !== 'object'){
                    /*
                    * FIXME: this hack is to survive a malformed JSON
                    */
                    if (name === "gerrit_issue_id"){
                        get_var = gerrit_site + '/r/#/c/' + data[name];
                        aux_html += '<td><a href="' + get_var + '">' + data[name] + '</a></td>';
                    }
                    else if (name === "project_name"){
                        get_var = data[name].replace(/\//g,'_');
                        aux_html += '<td><a href="repository.html?repository='+ get_var +
                        '&ds=scr">'+data[name]+'</a></td>';
                    }
                    else{
                        aux_html += '<td>'+data[name]+'</td>';
                    }
                }else{
                    if (name === "gerrit_issue_id"){
                        get_var = gerrit_site + '/r/#/c/' + data[name][id];
                        aux_html += '<td><a href="' + get_var + '">'+data[name][id]+'</a></td>';
                    }
                    else if (name === "project_name") {
                        get_var = data[name][id].replace(/\//g,'_');
                        aux_html += '<td><a href="repository.html?repository='+ get_var +
                        '&ds=scr">'+data[name][id]+'</a></td>';
                    }
                    else {
                        aux_html += '<td>'+data[name][id]+'</td>';
                    }
                }
            });
            aux_html += '</tr>';
        });
        aux_html += '</tbody>';

        tables += aux_html;
        tables += '</table>';

        tables += '<script>$(document).ready(function(){'+
                '$("#' + random_id + '").tablesorter();}'+
                '); </script>';
        //return tables;
        $("#"+div.id).append(tables);
    }

    /*
    * Display a bootstrap table with headers and rows + a ratio for Meetup
    * @param {object()} div - html object where table will be appended
    * @param {object()} data - Contains array of columns
    * @param {string[]]} headers - Array of strings
    * @param {string[]} cols - Array of strings to be read from data
    * @param {string[]} ratio - Optional array of strings to calculate a ratio from data
    * @param {string[]} ratio - Optional string with header of table for ratio
    */

    function displayMeetupGroupsTable(div, data, headers, cols, ratio, ratio_header){
        var ratio_array = [],
            denominator,
            numerator,
            aux_ratio;
        if (ratio !== undefined){
            /* if ratio exist it should be a 2 item lenght array*/
            numerator = ratio[0];
            denominator = ratio[1];

            $.each(data.name, function(id, value){
                aux_ratio = data[numerator][id]/data[denominator][id];
                aux_ratio = Math.round(aux_ratio * 10) / 10;
                ratio_array.push(aux_ratio);
            });
            data.ratio = ratio_array;
            if (ratio_header !== undefined){
                headers.push(ratio_header);
            }else{
                headers.push("Ratio");
            }
            cols.push("ratio");
        }
        displaySimpleTable(div, data, headers, cols);
    }

    function composeSimpleHeaders(headers){
        var aux_html;
        aux_html = '<thead><th>#</th>';
        $.each(headers, function(id,value){
            aux_html += '<th>' + value + '</th>';
        });
        aux_html += '</thead>';
        return aux_html;
    }


    /*
    * Displays table based on data and opts
    * @param {object()} div - html object where table will be appended
    * @param {object()} data - Contains all the top metrics
    * @param {object()} opts - options needed by the table
    */
    function displayTopTable(div, data, opts){
        // div, data, metric, class_name, links_enabled, limit, period, ds_name
        var first = true,
            gen_tabs = true,
            tabs = '',
            tables = '',
            periods;
        if (opts.period !== 'all'){
             gen_tabs = false;
             periods = [opts.period];
             tables += getHTMLTitleFromPeriod(opts.period);
        }else{
            //FIXME gen_tabs should be checked before this point
            tabs += composeTopTabs(data, opts.metric, opts.class_name);
            periods = getSortedPeriods(); //FIXME we should get this data from JSON
        }

        periods = getSortedPeriods(); //FIXME we should get this data from JSON
        if (opts.height !== undefined){
            tables += '<div class="tab-content" style="height: ' + opts.height +'px !important;overflow-y: scroll;overflow-x: hidden;">';
        }else{
            tables += '<div class="tab-content">';
        }

        var var_names = getTopVarsFromMetric(opts.metric, opts.ds_name);
        for (var k=0; k< periods.length; k++){
            html = "";
            var key = opts.metric + '.' + periods[k];
            if (periods[k] !== opts.period && opts.period !== 'all') {continue;}
            if (data[key]){
                var data_period = periods[k];
                if (data_period === ""){
                    data_period = "all";
                }
                if (first === true){
                    html = " active in";
                    first = false;
                }
                var data_period_nows = data_period.replace(/\ /g, '');
                tables += '<div class="tab-pane fade'+ html  +'" id="' + opts.class_name + opts.metric + data_period_nows + '">';
                tables += '<table class="table table-striped">';

                opts.action = opts.desc_metrics[opts.ds_name + "_" + opts.metric].action;
                opts.unit = opts.desc_metrics[opts.ds_name + "_" + opts.metric].column;
                unit = opts.desc_metrics[opts.ds_name + "_" + opts.metric].action;
                title = opts.desc_metrics[opts.ds_name + "_" + opts.metric].name;

                if (opts.metric === "threads" && opts.ds_name === "mls"){
                    tables += '<thead><th>#</th>';
                    tables += '<th> Subject </th>';
                    tables += '<th> Creator </th>';
                    tables += '<th> Messages </th>';
                    tables += '</thead><tbody>';
                    tables += composeTopRowsThreads(data[key], opts.limit, opts.links_enabled);
                    tables += '</tbody>';
                }else if(opts.ds_name === "downloads"){
                    tables += composeTopRowsDownloads(opts, data[key]);
                }else if ( opts.ds_name === "eventizer" && opts.metric === "rsvps"){
                    tables += '<thead><th>#</th><th>' +title.capitalize()+'&nbsp;by number of meetings</th>';
                    tables += '<th> Meetings </th>';
                    tables += '</thead><tbody>';
                    tables += composeTopRowsMeetup(data[key], opts.limit, opts.links_enabled);
                    tables += '</tbody>';
                }else if( opts.ds_name === "eventizer" && opts.metric === "events"){
                    tables += '<thead><th>#</th><th>' +title.capitalize()+'&nbsp;by number of RSVPs</th>';
                    tables += '<th> RSVPs </th>';
                    tables += '<th> Date </th>';
                    tables += '</thead><tbody>';
                    tables += composeTopRowsMeetup2(data[key], opts.limit, opts.links_enabled);
                    tables += '</tbody>';
                }else{
                    tables += '<thead><th>#</th><th>' +title.capitalize()+'</th>';
                    if (unit !== undefined) tables += '<th>'+unit.capitalize()+'</th>';
                    if (data[key].organization !== undefined) {
                        tables += '<th>Organization</th>';
                    }
                    tables += '</thead><tbody>';
                    tables += composeTopRowsPeople(data[key], opts.limit, opts.links_enabled, var_names);
                    tables += '</tbody>';
                }

                tables += "</table>";
                tables += "</div>";
            }
        }

        tables += '</div>';
        $("#"+div.id).append(tabs + tables);

        if (gen_tabs === true){
            script = "<script>$('#myTab a').click(function (e) {e.preventDefault();$(this).tab('show');});</script>";
            $("#"+div.id).append(script);
        }

     }

     function composeTopRowsPeople(people_data, limit, people_links, var_names){
         var rows_html = "";
         if (people_data[var_names.id] === undefined) {
             return rows_html;
         }
         for (var j = 0; j < people_data[var_names.id].length; j++) {
             if (limit && limit <= j) break;
             var metric_value = people_data[var_names.action][j];
             rows_html += "<tr><td>" + (j+1) + "</td>";
             rows_html += "<td>";
             if (people_links){
                 rows_html += '<a href="people.html?id=' +people_data[var_names.id][j];
                 //we spread the GET variables if any
                 get_params = Utils.paramsInURL();
                 if (get_params.length > 0) rows_html += '&' + get_params;
                 rows_html += '">';
                 rows_html += DataProcess.hideEmail(people_data[var_names.name][j]) +"</a>";
             }else{
                 rows_html += DataProcess.hideEmail(people_data[var_names.name][j]);
             }
             rows_html += "</td>";
             //rows_html += "<td>"+ metric_value + '</td></tr>';
             rows_html += "<td>"+ metric_value + '</td>';
             if (people_data.organization !== undefined) {
                org = people_data.organization[j];
                if (org === null) {
                    org = "-";
                }
                rows_html += "<td>"+ org + "</td>";
             }
             rows_html += '</tr>';
         }
         return(rows_html);
     }

     function composeTopRowsThreads(threads_data, limit, threads_links){
         var rows_html = "";
         for (var i = 0; i < threads_data.subject.length; i++) {
             if (limit && limit <= i) break;
             rows_html += "<tr><td>" + (i+1) + "</td>";
             //rows_html += "<td>";
             if (threads_links === true){
                 var url = "http://www.google.com/search?output=search&q=X&btnI=1";
                 if (Report.getThreadsSite() !== undefined){
                     url = "http://www.google.com/search?output=search&q=X%20site%3AY&btnI=1";
                     url = url.replace(/Y/g, Report.getThreadsSite());
                 }else if(threads_data.hasOwnProperty('url') && threads_data.url[i].length > 0){
                     url = "http://www.google.com/search?output=search&q=X%20site%3AY&btnI=1";
                     url = url.replace(/Y/g, threads_data.url[i]);
                 }
                 url = url.replace(/X/g, threads_data.subject[i]);
                 rows_html += "<td>";
                 rows_html += '<a target="_blank" href="'+url+ '">';
                 rows_html += threads_data.subject[i] + "</a>";
                 rows_html += "&nbsp;<i class=\"fa fa-external-link\"></i></td>";
             }else{
                 rows_html += "<td>" + threads_data.subject[i] + "</td>";
             }
             rows_html += "<td>" + threads_data.initiator_name[i] + "</td>";
             rows_html += "<td>" + threads_data.length[i] + "</td>";
             rows_html += "</tr>";
         }
         return(rows_html);
     }

     function composeTopRowsDownloads(opts, data){
         //(opts.metric === "packages" || opts.metric === "ips" )){
         var tables = '',
            headers = [];
         if (opts.metric === "packages"){
             headers = ['Packages Downloaded','Downloads'];
            tables += composeTopRows2Cols(data, opts, headers);
        }else if(opts.metric === "ips"){
            headers = ['IP Addresses','Downloads'];
            tables += composeTopRows2Cols(data, opts, headers);
            //tables += composeTopRowsIPs(data, opts.limit);
        }else if(opts.metric === "pages"){
            headers = ['Page name','Visits'];
            tables += composeTopRows2Cols(data, opts, headers);
            //tables += composeTopRowsPages(data, opts.limit);
        }else if(opts.metric === "countries"){
            headers = ['Country','Visits'];
            tables += composeTopRows2Cols(data, opts, headers);
            //tables += composeTopRowsCountries(data, opts.limit);
        }
        return tables;
     }

     function composeTopRows2Cols(data, opts, headers){
         var rows_html = "";
         rows_html = '<thead><tr><th>#</th>';
         rows_html += '<th>&nbsp;' + headers[0] + '&nbsp;</th>';
         rows_html += '<th>&nbsp;' + headers[1] + '&nbsp;</th>';
         rows_html += '</tr></thead><tbody>';
         for (var i = 0; i < data[opts.unit].length; i++) {
             if (opts.limit && opts.limit <= i) break;
             rows_html += '<tr><td class="col-md-1">' + (i+1) + '</td>';
             //rows_html += "<td>";
             rows_html += '<td class="col-md-8">' + data[opts.unit][i] + '</td>';
             rows_html += '<td class="col-md-3">' + data[opts.action][i] + '</td>';
             rows_html += "</tr>";
         }
         return(rows_html);
     }

     function composeTopRowsMeetup(data, limit, people_links){
         var rows_html = "";
         for (var i = 0; i < data.name.length; i++) {
             if (limit && limit !==0 && limit <= i) break;
             rows_html += "<tr><td>" + (i+1) + "</td>";
             //rows_html += "<td>";
             rows_html += "<td>" + data.name[i] + "</td>";
             rows_html += "<td>" + data.events[i] + "</td>";
             rows_html += "</tr>";
         }
         return(rows_html);
     }

     function composeTopRowsMeetup2(data, limit, people_links){
         var rows_html = "";
         data = fixArrayStringError(data);
         for (var i = 0; i < data.name.length; i++) {
             if (limit && limit !==0 && limit <= i) break;
             rows_html += "<tr><td>" + (i+1) + "</td>";
             //rows_html += "<td>";
             rows_html += '<td><a href="' + data.url[i] + '">' + data.name[i] + '&nbsp;<i class="fa fa-external-link"></i></a></td>';
             rows_html += "<td>" + data.rsvps[i] + "</td>";
             rows_html += "<td>" + data.time[i] + "</td>";
             rows_html += "</tr>";
         }
         return(rows_html);
     }

     /*
     * Forces the object myobj to contain arrays
     */
     function fixArrayStringError(myobj){
         var keys = Object.keys(myobj),
            myarray = [];
         if (typeof(myobj[keys[0]]) !== "object"){
             console.log("Incorrect data. Expected an array and found an string, trying to convert ..");
             $.each(keys, function(id, value){
                 myarray = [];
                 myarray.push(myobj[value]);
                 myobj[value] = myarray;
             });
         }
         return myobj;
     }

    function getSortedPeriods(){
        return ['last month','last year',''];
    }

    function getTitleFromPeriod(period){
        if (period === "last month"){
            return "Last 30 days";
        }
        else if (period === "last year"){
            return "Last 365 days";
        }
        else{
            return "Complete history";
        }
    }

    function getHTMLTitleFromPeriod(period){
        return '<div class="toptable-title">' + getTitleFromPeriod(period) +
        '</div>';
    }

    function composeTopTabs(data, metric, class_name){
        var first = true,
            tabs_html = '<ul id="myTab" class="nav nav-tabs">',
            periods = getSortedPeriods(); //FIXME we should get this data from JSON

        $.each(periods, function(id, p){
            //check data exists
            aux_obj = {'html': ''};
            if (p === ""){
                p = 'all';
                aux_obj.pretty_period = "Complete history";
            }else if(p === "last month"){
                aux_obj.pretty_period = "Last 30 days";
            }else if (p === "last year"){
                aux_obj.pretty_period = "Last 365 days";
            }
            aux_obj.myhref = class_name + metric + p.replace(/\ /g, '');

            if (first === true){
                aux_obj.html = ' class="active"';
                first = false;
            }

            var aux_html = '<li{html}><a href="#{myhref}" data-toogle="tab">{pretty_period}</a></li>';
            tabs_html += aux_html.supplant(aux_obj);
        });

        tabs_html += '</ul>';
        return(tabs_html);
    }

     function getTopVarsFromMetric(metric, ds_name){
         //maps the JSON vars with the metric name
         //FIXME this function should be private
         var var_names = {};
         var_names.id = "id";
         if (metric === "senders" && (ds_name === "mls" || ds_name === "irc")){
             var_names.name = "senders";
             var_names.action = "sent";
         }
         if (metric === "authors" && ds_name === "scm"){
             var_names.name = "authors";
             var_names.action = "commits";
         }
         if (ds_name === "its"){
             if (metric === "closers"){
                 var_names.name = "closers";
                 var_names.action = "closed";
             }else if(metric === "resolvers"){
                 var_names.name = "resolvers";
                 var_names.action = "resolved";
             }
         }
         if (metric === "closers" && ds_name === "its_1"){
             var_names.name = "closers";
             var_names.action = "closed";
         }
         if (ds_name === "scr"){
             if (metric === "mergers"){
                 var_names.name = "mergers";
                 var_names.action = "merged";
             }
             if (metric === "openers"){
                 var_names.name = "openers";
                 var_names.action = "opened";
             }
             if (metric === "submitters"){
                 var_names.name = "openers";
                 var_names.action = "opened";
             }
             if (metric === "reviewers"){
                 var_names.name = "reviewers";
                 var_names.action = "reviews";
             }
             if (metric === "participants"){
                 var_names.name = "identifier";
                 var_names.action = "events";
             }
             if (metric === "active_core_reviewers"){
                 var_names.name = "identifier";
                 var_names.action = "reviews";
             }
         }
         if (ds_name === "downloads"){
             if (metric === "ips"){
                 var_names.name = "ips";
                 var_names.action = "downloads";
             }
             if (metric === "packages"){
                 var_names.name = "packages";
                 var_names.action = "downloads";
             }
             if (metric === "pages"){
                 var_names.name = "page";
                 var_names.action = "visits";
             }
         }
         if (ds_name === "mediawiki"){
             if (metric === "authors"){
                 var_names.name = "authors";
                 var_names.action = "reviews";
             }
         }
         if (ds_name === "qaforums"){
             if (metric === "senders" || metric === "asenders" || metric === "qsenders"){
                 // the same as in mls and irc
                 var_names.name = "senders";
                 var_names.action = "sent";
            }else if (metric === "participants"){
                var_names.name = "name";
                var_names.action = "messages_sent";
            }
         }
         if (ds_name === "releases"){
             if (metric === "authors"){
                 var_names.name = "username";
                 var_names.action = "releases";
             }
         }
         if (ds_name === "eventizer"){
             if (metric === "cities"){
                 var_names.name = "city";
                 var_names.action = "events";
             }else if (metric === "events"){
                 var_names.name = "name";
                 var_names.action = "rsvps";
             }else if (metric === "repos"){
                 var_names.name = "name";
                 var_names.action = "rsvps";
             }
             else if (metric === "rsvps"){
                 var_names.name = "name";
                 var_names.action = "events";
             }
         }

         return var_names;
     }
})();
