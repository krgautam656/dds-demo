(function ($) {
    'use strict';
    $(function () {
        var bar1 = new ldBar(".roomTemp1", {
            "stroke": '#52b5f1',
            "stroke-width": 10,
            "preset": "circle",
            "value": 0
        });

        var bar2 = new ldBar(".roomTemp2", {
            "stroke": '#00e396',
            "stroke-width": 10,
            "preset": "circle",
            "value": 0
        });

        var bar3 = new ldBar(".roomTemp3", {
            "stroke": '#feb019',
            "stroke-width": 10,
            "preset": "circle",
            "value": 0
        });

        var lastDate = 0
        var data = []
        var data1 = []
        var data2 = []
        var TICKINTERVAL = 300000
        let XAXISRANGE = 2700000
        var options = {
            series: [{
                name: 'System Temperature',
                data: data.slice()
            }, {
                name: 'Room Temperature',
                data: data1.slice()
            }, {
                name: 'Exhaust Temperature',
                data: data2.slice()
            }],
            chart: {
                id: 'realtime',
                height: 350,
                type: 'area',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 999
                    }
                },
                toolbar: {
                    show: false
                },
                zoom: {
                    enabled: false
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                curve: 'smooth'
            },
            title: {
                text: 'Processes',
                align: 'left',
                style: {
                    fontSize: '12px'
                }
            },
            markers: {
                size: 0
            },
            xaxis: {
                type: 'datetime',
                range: XAXISRANGE,
                title: {
                    text: 'Time (Second)',
                },
                labels: {
                    format: 'mm:ss',
                    datetimeUTC: false,
                },
                tickAmount: 10,
            },
            yaxis: {
                max: 30,
                title: {
                    text: 'Temperature (C)',
                },
                tickAmount: 6
            },
            legend: {
                show: true,
                floating: true,
                horizontalAlign: 'left',
                onItemClick: {
                    toggleDataSeries: false
                },
                position: 'top',
                offsetY: -28,
                offsetX: 60
            },
            tooltip: {
                x: {
                    format: 'mm:ss'
                }
            },
        };

        var chart = new ApexCharts(document.querySelector("#linechart"), options);
        chart.render();

        window.setInterval(function () {
            getNewSeries(lastDate, {
                min: 0,
                max: 30
            })

            chart.updateSeries([{
                data: data
            }, {
                data: data1
            }, {
                data: data2
            }])
        }, 1000)

        window.currTemp1 = 10
        window.currTemp2 = 10
        window.currTemp3 = 10
        var dataCount = 0
        var totalTemp1 = 0
        var totalTemp2 = 0
        var totalTemp3 = 0

        function getNewSeries(baseval, yrange) {
            dataCount++;
            var newDate = baseval + TICKINTERVAL;
            lastDate = newDate

            for (var i = 0; i < data.length - 10; i++) {
                if (typeof data[i] != "undefined") {
                    data[i].x = newDate - XAXISRANGE - TICKINTERVAL
                    data[i].y = 0
                }
                if (typeof data1[i] != "undefined") {
                    data1[i].x = newDate - XAXISRANGE - TICKINTERVAL
                    data1[i].y = 0
                }
                if (typeof data2[i] != "undefined") {
                    data2[i].x = newDate - XAXISRANGE - TICKINTERVAL
                    data2[i].y = 0
                }
            }
            loadSensorRecord()

            data.push({
                x: newDate,
                y: currTemp1
            })
            showAlert('system', currTemp1);

            data1.push({
                x: newDate,
                y: currTemp2
            })
            showAlert('room', currTemp2);

            data2.push({
                x: newDate,
                y: currTemp3
            })
            showAlert('exhaust', currTemp3)
        }

        function loadSensorRecord() {
            $.getJSON("/getSystemTempDetails", function (response) {
                if (typeof response.temperature != "undefined") {
                    currTemp1 = parseInt(response.temperature);
                    totalTemp1 += currTemp1
                }
            });

            $.getJSON("/getRoomTempDetails", function (response) {
                if (typeof response.temperature != "undefined") {
                    currTemp2 = parseInt(response.temperature);
                    totalTemp2 += currTemp2
                }
            });

            $.getJSON("/getExhaustTempDetails", function (response) {
                if (typeof response.temperature != "undefined") {
                    currTemp3 = parseInt(response.temperature);
                    totalTemp3 += currTemp3
                }
            });
        }

        function showAlert(name, value) {
            if (value == 30) {
                sendNotification(name);
                $('.alert-danger').remove();
                var htmlAlert = '<div class="alert alert-danger"><p class="text-center">The temperature in the ' + name + ' reaches its highest point. </p></div > ';
                $(".alert-message").prepend(htmlAlert);
                $(".alert-message .alert").first().hide().fadeIn(200).delay(1000).fadeOut(1000, function () { $(this).remove(); });
            }
        }

        function sendNotification(name) {
            $.getJSON('/sendNotification',
                {
                    name: name,
                });
        }

        window.setInterval(function () {
            var totalTemp = 300;
            if (dataCount == 10) {
                bar1.set(
                    0,
                    true
                );
                bar1.set(
                    (totalTemp1 / totalTemp) * 100,
                    true
                );
                bar2.set(
                    0,
                    true
                );
                bar2.set(
                    (totalTemp2 / totalTemp) * 100,
                    true
                );
                bar3.set(
                    0,
                    true
                );
                bar3.set(
                    (totalTemp3 / totalTemp) * 100,
                    true
                );
                dataCount = 0
                totalTemp1 = 0
                totalTemp2 = 0
                totalTemp3 = 0
            }
        }, 1000)

    });
})(jQuery);