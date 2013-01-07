/* 
 * Copyright (C) 2012 Bitergia
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
 */

var Viz = {};

(function() {

    var gridster_debug = false;
    var bitergiaColor = "#ffa500";

    Viz.displayTop = displayTop;
    Viz.displayBasicHTML = displayBasicHTML;
    Viz.displayBasicMetricHTML = displayBasicMetricHTML;
    Viz.displayBasicLinesFile = displayBasicLinesFile;
    Viz.displayBasicLines = displayBasicLines;
    Viz.displayBubbles = displayBubbles;
    Viz.displayDemographics = displayDemographics;
    Viz.displayEvoSummary = displayEvoSummary;
    Viz.displayRadarActivity = displayRadarActivity;
    Viz.displayRadarCommunity = displayRadarCommunity;
    Viz.displayTreeMap = displayTreeMap;
    Viz.drawMetric = drawMetric;
    Viz.getEnvisionDefaultsGraph = getEnvisionDefaultsGraph;
    Viz.getEnvisionOptions = getEnvisionOptions;
    Viz.checkBasicConfig = checkBasicConfig;
    Viz.mergeConfig = mergeConfig;
    Viz.displayGridMetric = displayGridMetric;
    Viz.displayGridMetricSelector = displayGridMetricSelector;
    Viz.displayGridMetricAll = displayGridMetricAll;
    // Working fixing gridster issue: redmine issue 991
    Viz.gridster_debug = gridster_debug;

    function mergeConfig(config1, config2) {
        var new_config = {};
        $.each(config1, function(entry, value) {
            new_config[entry] = value;
        });
        $.each(config2, function(entry, value) {
            new_config[entry] = value;
        });
        return new_config;
    }

    function findMetricDoer(history, metric) {
        for ( var field in history) {
            if (field != metric)
                return field;
        }
    }

    function hideEmail(email) {
        var clean = email;
        if (email.indexOf("@") > -1) {
            clean = email.split('@')[0];
        }
        return clean;
    }

    function drawMetric(metric_id, divid) {
        var config_metric = {};
        config_metric.show_desc = false;
        config_metric.show_title = false;
        config_metric.show_labels = true;

        $.each(Report.getDataSources(), function(index, DS) {
            var list_metrics = DS.getMetrics();
            $.each(list_metrics, function(metric, value) {
                if (value.column === metric_id) {
                    DS.displayBasicMetricHTML(value.column, divid,
                            config_metric);
                    return;
                }
            });
        });
    }

    function displayTopMetric(div_id, metric, metric_period, history, graph) {
        var top_metric_id = metric.column;
        var metric_id = metric.action;
        var doer = findMetricDoer(history, metric_id);
        var div_graph = '';
        var new_div = '';
        new_div += "<div class='info-pill'>";
        new_div += "<h1>Top " + top_metric_id + " " + metric_period + " </h1>";
        if (graph) {
            div_graph = "top-" + graph + "-" + metric_id + "-" + metric_period;
            new_div += "<div id='" + div_graph
                    + "' class='graph' style='float:right'></div>";
        }
        new_div += "<table><tbody>";
        // new_div += "<tr><th>"+doer+"</th><th>"+metric_id+"</th></tr>";
        new_div += "<tr><th></th><th>" + metric_id + "</th></tr>";
        if (history[metric_id] === undefined) return;
        for ( var i = 0; i < history[metric_id].length; i++) {
            var metric_value = history[metric_id][i];
            var doer_value = history[doer][i];
            new_div += "<tr><td>" + hideEmail(doer_value) + "</td><td>"
                    + metric_value + "</td></tr>";
        }
        new_div += "</tbody></table>";
        new_div += "</div>";

        var div = $("#" + div_id);
        div.append(new_div);
        if (graph)
            displayBasicChart(div_graph, history[doer], history[metric_id],
                    graph);
    }

    function displayBasicLinesFile(div_id, json_file, column, labels, title) {
        $.getJSON(json_file, null, function(history) {
            displayBasicLines(div_id, history, column, labels, title);
        });
    }

    // TODO: Mix with displayBasicChart
    function displayBasicLines(div_id, history, column, labels, title) {
        var line_data = [];
        container = document.getElementById(div_id);

        // if ($('#'+div_id).is (':visible')) return;

        for ( var i = 0; i < history[column].length; i++) {
            line_data[i] = [ i, parseInt(history[column][i], 10) ];
        }

        var config = {
            title : title,
            xaxis : {
                minorTickFreq : 4,
                tickFormatter : function(x) {
                    if (history.date) {
                        x = history.date[parseInt(x, 10)];
                    }
                    return x;
                }
            },
            yaxis : {
                minorTickFreq : 1000,
                tickFormatter : function(y) {
                    return parseInt(y, 10) + "";
                }
            },

            grid : {
                show : false
            },
            mouse : {
                track : true,
                trackY : false,
                trackFormatter : function(o) {
                    return history.date[parseInt(o.x, 10)] + ": "
                            + parseInt(o.y, 10);
                }
            }
        };

        if (!labels || labels === 0) {
            config.xaxis.showLabels = false;
            config.yaxis.showLabels = false;
        }
        graph = Flotr.draw(container, [ line_data ], config);
    }

    function displayBasicChart(divid, labels, data, graph, rotate, fixColor) {

        var horizontal = false;
        if (rotate)
            horizontal = true;

        var container = document.getElementById(divid);
        var chart_data = [], i;

        if (!horizontal) {
            for (i = 0; i < labels.length; i++) {
                chart_data.push({
                    data : [ [ i, data[i] ] ],
                    label : hideEmail(labels[i])
                });
            }
        } else {
            for (i = 0; i < labels.length; i++) {
                chart_data.push({
                    data : [ [ data[i], i ] ],
                    label : hideEmail(labels[i])
                });
            }
        }

        var config = {
            grid : {
                verticalLines : false,
                horizontalLines : false,
                outlineWidth : 0
            },
            xaxis : {
                showLabels : false,
                min : 0
                
            },
            yaxis : {
                showLabels : false,
                min : 0
            },
            mouse : {
                track : true,
                trackFormatter : function(o) {
                    var i = 'x';
                    if (horizontal)
                        i = 'y';
                    return hideEmail(labels[parseInt(o[i], 10)]) + ": "
                            + data[parseInt(o[i], 10)];
                }
            },
            legend : {
                show : false,
                position : 'se',
                backgroundColor : '#D2E8FF'
            // container: container_legend
            }
        };

        if (graph === "bars") {
            config.bars = {
                show : true, 
                horizontal : horizontal
            };
            if (fixColor) {
                config.bars.color = fixColor;
                config.bars.fillColor = fixColor;
            }
            
            // TODO: Color management should be defined
            var defaults_colors = [ '#ffa500', '#ffff00', '#00ff00', '#4DA74D',
                                    '#9440ED' ];
            config.colors = defaults_colors,
            config.grid.horizontalLines = true;
            config.yaxis = {
                showLabels : true, min:0
            };
            config.xaxis = {
                    showLabels : true, min:0
            };
        }
        if (graph === "pie")
            config.pie = {
                show : true
            };

        graph = Flotr.draw(container, chart_data, config);
    }

    function getDSMetric(metric_id) {
        var ds = null;
        $.each(Report.getDataSources(), function(index, DS) {
            $.each(DS.getMetrics(), function(i, metric) {
                if (i === metric_id)
                    ds = DS;
            });
        });
        return ds;
    }

    // The two metrics should be from the same data source
    function displayBubbles(divid, metric1, metric2) {

        var container = document.getElementById(divid);

        var DS = getDSMetric(metric1);
        var DS1 = getDSMetric(metric2);

        var bdata = [];

        if (DS != DS1) {
            alert("Metrics for bubbles have different data sources");
            return;
        }

        var data = DS.getData();

        for ( var i = 0; i < data.id.length; i++) {
            bdata.push([ data.id[i], data[metric1][i], data[metric2][i] ]);
        }

        var config = {
            bubbles : {
                show : true,
                baseRadius : 5
            },
            mouse : {
                track : true,
                trackFormatter : function(o) {
                    var value = data.date[o.index] + ": ";
                    value += data[metric1][o.index] + " " + metric1 + ",";
                    value += data[metric2][o.index] + " " + metric2 + ",";
                    return value;
                }
            },
            xaxis : {
                tickFormatter : function(o) {
                    return data.date[parseInt(o, 10) - data.id[0]];
                }
            }
        };

        if (DS.getName() === "its")
            $.extend(config.bubbles, {
                baseRadius : 2
            });

        Flotr.draw(container, [ bdata ], config);
    }

    function displayDemographics(divid, ds, file) {
        if (!file) {
            var data = ds.getDemographicsData();
            displayDemographicsChart(divid, ds, data);
        } else {
            $.when($.getJSON(file)).done(function(history) {
                displayDemographicsChart(divid, ds, history);
            }).fail(function() {
                alert("Can't load JSON file: " + file);
            });
        }
    }

    function displayDemographicsChart(divid, ds, data) {
        if (!data) return; 

        var quarter = 365 / 4;
        // var data = ds.getDemographicsData();
        var quarter_data = [];
        var labels = [], i;

        for (i = 0; i < data.persons.age.length; i++) {
            var age = data.persons.age[i];
            var index = parseInt(age / quarter, 10);
            if (!quarter_data[index])
                quarter_data[index] = 0;
            quarter_data[index] += 1;
        }

        for (i = 0; i < quarter_data.length; i++) {
            labels[i] = "Q" + parseInt(i, 10);
        }

        if (data)
            displayBasicChart(divid, labels, quarter_data, "bars", true, bitergiaColor);
    }

    function displayRadarChart(div_id, ticks, data) {
        var container = document.getElementById(div_id);
        var max = $("#" + div_id).data('max');

        graph = Flotr.draw(container, data, {
            radar : {
                show : true
            },
            mouse : {
                track : true
            },
            grid : {
                circular : true,
                minorHorizontalLines : true
            },
            yaxis : {
                min : 0,
                max : max,
                minorTickFreq : 1
            },
            xaxis : {
                ticks : ticks
            }
        });
    }

    function displayRadar(div_id, metrics) {
        var data = [], ticks = [];

        for ( var i = 0; i < metrics.length; i++) {
            var DS = Report.getMetricDS(metrics[i]);
            data.push([ i, parseInt(DS.getGlobalData()[metrics[i]], 10) ]);
            ticks.push([ i, DS.getMetrics()[metrics[i]].name ]);
        }

        var s1 = {
            label : Report.getProjectData().project_name,
            data : data
        };

        displayRadarChart(div_id, ticks, [ s1 ]);
    }

    function displayRadarCommunity(div_id) {
        var metrics = [ 'committers', 'authors', 'openers', 'closers',
                'changers', 'senders' ];
        displayRadar(div_id, metrics);
    }

    function displayRadarActivity(div_id) {
        var metrics = [ 'commits', 'files', 'opened', 'closed', 'changed',
                'sent' ];
        displayRadar(div_id, metrics);
    }
    
    function displayTimeToFix(div_id, json_file, column, labels, title) {
        $.getJSON(json_file, function(history) {            
            Viz.displayBasicLines(div_id, history, column, labels, title);
        });
    }

    // Each metric can have several top: metric.period
    // For example: "committers.all":{"commits":[5310, ...],"name":["Brion
    // Vibber",..]}
    function displayTop(div, top_file, basic_metrics, all, graph) {
        if (all === undefined)
            all = true;
        $.getJSON(top_file, function(history) {
            $.each(history, function(key, value) {
                // ex: commits.all
                var data = key.split(".");
                var top_metric = data[0];
                var top_period = data[1];
                for ( var id in basic_metrics) {
                    var metric = basic_metrics[id];
                    if (metric.column == top_metric) {
                        displayTopMetric(div, metric, top_period, history[key],
                                graph);
                        if (!all) return false;
                        break;
                    }
                }
            });
        });
    }
    
    // D3
    function displayTreeMap(divid, data_file) {
        $.getJSON(data_file, function(root) {
            var color = d3.scale.category20c();

            var div = d3.select("#"+divid);

            var width = $("#treemap").width(), 
                height = $("#treemap").height();

            var treemap = d3.layout.treemap()
                .size([ width, height ])
                .sticky(true)
                .value(function(d) {return d.size;}
            );

            var position = function() {
                this.style("left", function(d) {
                    return d.x + "px";
                }).style("top", function(d) {
                    return d.y + "px";
                }).style("width", function(d) {
                    return Math.max(0, d.dx - 1) + "px";
                }).style("height", function(d) {
                    return Math.max(0, d.dy - 1) + "px";
                });
            };

            var node = div.datum(root).selectAll(".node")
                    .data(treemap.nodes)
                .enter().append("div")
                    .attr("class", "treemap-node")
                    .call(position)
                    .style("background", function(d) {
                        return d.children ? color(d.name) : null;})
                    .text(function(d) {
                        return d.children ? null : d.name;
                    });

            d3.selectAll("input").on("change", function change() {
                var value = this.value === "count" 
                    ? function() {return 1;}
                    : function(d) {return d.size;};

                node
                        .data(treemap.value(value).nodes)
                    .transition()
                        .duration(1500)
                        .call(position);
           });
        });
    }

    function getDefaultsMarkers(option, markers, dates) {
        var mark = "";
        if (!markers || markers.length === 0) return mark;
        for ( var i = 0; i < markers.date.length; i++) {
            if (markers.date[i] == dates[option.index]) {
                mark = markers.marks[i];
            }
        }
        return mark;
    }

    function getEnvisionDefaultsGraph(name, gconfig) {
        var graph = {
            name : name,
            config : {
                colors : gconfig.colors,
                grid: {verticalLines:false, horizontalLines:false},
                mouse : {
                    track : true,
                    trackY : false,
                    position : 'ne'
                },
                yaxis : {
                    autoscale : true
                },
                legend : {
                    backgroundColor : '#FFFFFF', // A light blue background
                    // color
                    backgroundOpacity : 0
                }
            }
        };

        if (gconfig.gtype === "whiskers")
            graph.config.whiskers = {
                show : true,
                lineWidth : 2
            };
        else
            graph.config['lite-lines'] = {
                lineWidth : 1,
                show : true,
                fill : true,
                fillOpacity : 0.5
            };

        if (gconfig.y_labels)
            graph.config.yaxis = {
                showLabels : true
            };

        if (gconfig.show_markers)
            graph.config.markers = {
                show : true,
                position : 'ct',
                labelFormatter : function(o) {
                    return getDefaultsMarkers(o, gconfig.markers, gconfig.dates);
                }
            };
        return graph;
    }

    function getEnvisionOptions(div_id, history, basic_metrics, main_metric,
            hide) {

        var firstMonth = history.id[0], dates = history.date, container = document
                .getElementById(div_id), options;
        var markers = Report.getMarkers();

        options = {
            container : container,
            xTickFormatter : function(index) {
                var label = dates[index - firstMonth];
                if (label === "0")
                    label = "";
                return label;
            },
            yTickFormatter : function(n) {
                return n + '';
            },
            // Initial selection
            selection : {
                data : {
                    x : {
                        min : history.id[0],
                        max : history.id[history.id.length - 1]
                    }
                }
            }
        };

        options.data = {
            summary : [ history.id, history[main_metric] ],
            markers : markers,
            dates : dates,
            envision_hide : hide,
            main_metric : main_metric
        };

        for ( var id in basic_metrics) {
            options.data[id] = [ history.id, history[id] ];
        }

        options.trackFormatter = function(o) {
            var data = o.series.data, index = data[o.index][0] - firstMonth, value;

            value = dates[index] + ":<br>";

            var i = 0;
            for ( var id in basic_metrics) {
                value += options.data[id][1][index] + " " + id + ", ";
                if (++i % 3 === 0)
                    value += "<br>";
            }

            return value;
        };

        return options;
    }

    function checkBasicConfig(config) {
        if (config === undefined)
            config = {};
        if (config.show_desc === undefined)
            config.show_desc = true;
        if (config.show_title === undefined)
            config.show_title = true;
        if (config.show_labels === undefined)
            config.show_labels = true;
        return config;
    }

    function displayBasicHTML(data, div_target, title, basic_metrics, hide,
            config) {
        config = checkBasicConfig(config);
        var new_div = '<div class="info-pill">';
        new_div += '<h1>' + title + '</h1></div>';
        $("#" + div_target).append(new_div);
        for ( var id in basic_metrics) {
            var metric = basic_metrics[id];
            if ($.inArray(metric.column, Report.getConfig()[hide]) > -1)
                continue;
            displayBasicMetricHTML(metric, data, div_target, config);
        }
    }

    function displayBasicMetricHTML(metric, data, div_target, config) {
        config = checkBasicConfig(config);
        var title = metric.name;
        if (!config.show_title)
            title = '';

        var new_div = '<div class="info-pill">';
        $("#" + div_target).append(new_div);
        new_div = '<div id="flotr2_' + metric.column
                + '" class="info-pill m0-box-div">';
        new_div += '<h1>' + metric.name + '</h1>';
        new_div += '<div style="height:100px" id="' + metric.divid + '"></div>';
        if (config.show_desc === true)
            new_div += '<p>' + metric.desc + '</p>';
        new_div += '</div>';
        $("#" + div_target).append(new_div);
        if (config.realtime)
            displayBasicLinesFile(metric.divid, config.json_ds, metric.column,
                    config.show_labels, title);
        else
            displayBasicLines(metric.divid, data, metric.column,
                    config.show_labels, title);
    }

    function displayGridMetric(metric_id, config) {
        var gridster = Report.getGridster();
        var metric = Report.getAllMetrics()[metric_id];
        var size_x = 1, size_y = 1, col = 2, row = 1;
        var silent = true;

        if (config) {
            size_x = config.size_x, size_y = config.size_y, col = config.col,
                    row = config.row;
        }

        var divid = metric.divid + "_grid";
        if ($("#" + metric_id + "_check").is(':checked')) {
            if ($("#" + divid).length === 0) {
                gridster.add_widget("<div id='" + divid + "'></div>", size_x,
                        size_y, col, row);
                // gridster.add_widget( "<div id='"+divid+"'></div>", size_x,
                // size_y);
                drawMetric(metric_id, divid);
            }
        } else {
            if ($("#" + divid).length > 0) {
                if (Viz.gridster_debug)
                    silent = false;
                gridster.remove_widget($("#" + divid), silent);
            }
        }
    }

    function displayGridMetricAll(state) {
        var columns = 3;
        var form = document.getElementById('form_metric_selector');
        var config = {
            size_x : 1,
            size_y : 1,
            col : 2,
            row : 0
        };
        for ( var i = 0; i < form.elements.length; i++) {
            if (form.elements[i].type == "checkbox") {
                form.elements[i].checked = state;
                if (i % columns === 0) {
                    config.row++;
                    config.col = 2;
                }
                displayGridMetric(form.elements[i].value, config);
                config.col++;
            }
        }
    }

    function displayGridMetricDefault() {
    }

    function displayGridMetricSelector(div_id) {
        var metrics = Report.getAllMetrics();
        // var metrics = MLS.getMetrics();
        var html = "Metrics Selector:";
        html += "<form id='form_metric_selector'>";

        $.each(metrics, function(metric_id, value) {
            html += '<input type=checkbox name="check_list" value="'
                    + metric_id + '" ';
            html += 'onClick="';
            html += 'Viz.displayGridMetric(\'' + metric_id + '\');';
            html += '" ';
            html += 'id="' + metric_id + '_check" ';
            // if ($.inArray(l, user_lists)>-1) html += 'checked ';
            html += '>';
            html += metric_id;
            html += '<br>';
        });
        html += '<input type=button value="All" ';
        html += 'onClick="Viz.displayGridMetricAll(' + true + ')">';
        html += '<input type=button value="None" ';
        html += 'onClick="Viz.displayGridMetricAll(' + false + ')">';
        // html += '<input type=button value="Default" ';
        // html += 'onClick="Viz.displayGridMetricDefault()">';
        html += "</form>";
        $("#" + div_id).html(html);
    }

    function fillHistory(hist_complete_id, hist_partial) {

        // [ids, values]
        var new_history = [ [], [] ];
        for ( var i = 0; i < hist_complete_id.length; i++) {
            pos = hist_partial[0].indexOf(hist_complete_id[i]);
            new_history[0][i] = hist_complete_id[i];
            if (pos != -1) {
                new_history[1][i] = hist_partial[1][pos];
            } else {
                new_history[1][i] = 0;
            }
        }
        return new_history;
    }

    function displayEvoSummary(div_id) {

        var container = document.getElementById(div_id);
        var full_history_id = [], dates = [];
        var data_sources = Report.getDataSources();

        $.each(data_sources, function(i, DS) {
            if (DS.getData().id &&
                    DS.getData().id.length > full_history_id.length) {
                full_history_id = DS.getData().id;
                dates = DS.getData().date;                
            }
        });


        markers = Report.getMarkers();

        var options, firstMonth = full_history_id[0];

        options = {
            container : container,
            xTickFormatter : function(index) {
                var label = dates[index - firstMonth];
                if (label === "0")
                    label = "";
                return label;
            },
            yTickFormatter : function(n) {
                return n + '';
            },
            // Initial selection
            selection : {
                data : {
                    x : {
                        min : full_history_id[0],
                        max : full_history_id[full_history_id.length - 1]
                    }
                }
            }
        };

        var main_metric = "", main_matric_data = [];
        $.each(data_sources, function(i, DS) {
            main_metric = DS.getMainMetric();
            main_matric_data = DS.getData()[main_metric];
        });

        var hide = Report.getConfig().summary_hide;
        options.data = {
            summary : [ full_history_id, main_matric_data ],
            markers : markers,
            dates : dates,
            envision_hide : hide,
            main_metric : main_metric
        };

        var all_metrics = {};
        $.each(data_sources, function(i, DS) {
            if (DS.getData()) {
                all_metrics = $.extend(all_metrics, DS.getMetrics());
            }
        });

        $.each(data_sources, function(i, DS) {
            var ds_data = DS.getData();
            for (var id in all_metrics) {
                if (ds_data && ds_data[id]) {
                    options.data[id] = fillHistory(full_history_id, [ ds_data.id,
                            ds_data[id] ]);
                }
            }
        });

        options.trackFormatter = function(o) {
            var data = o.series.data, index = data[o.index][0] - firstMonth, value;

            value = dates[index] + ":<br>";

            var i = 0;
            for ( var id in all_metrics) {
                value += options.data[id][1][index] + " " + id + ", ";
                if (++i % 3 === 0)
                    value += "<br>";
            }

            return value;
        };

        // Create the TimeSeries
        var vis = new envision.templates.Envision_Report(options, Report
                .getDataSources());
    }

})();