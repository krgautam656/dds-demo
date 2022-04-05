(function($) {
    'use strict';
    $(function() {
        var bar1 = new ldBar(".roomTemp1", {
            "stroke": '#52b5f1',
            "stroke-width": 10,
            "preset": "circle",
            "value": 65
        });

        var bar2 = new ldBar(".roomTemp2", {
            "stroke": '#00e396',
            "stroke-width": 10,
            "preset": "circle",
            "value": 65
        });

        var bar3 = new ldBar(".roomTemp3", {
            "stroke": '#feb019',
            "stroke-width": 10,
            "preset": "circle",
            "value": 65
        });

        window.setInterval(function() {
            bar1.set(
                Math.floor(Math.random() * (100 - 1 + 1) + 1),
                true
            );
            bar2.set(
                Math.floor(Math.random() * (100 - 1 + 1) + 1),
                true
            );
            bar3.set(
                Math.floor(Math.random() * (100 - 1 + 1) + 1),
                true
            );
        }, 1000)

        var lastDate = 0
        var data = []
        var data1 = []
        var data2 = []
        var TICKINTERVAL = 86400000
        let XAXISRANGE = 777600000
        var options = {
            series: [{
                name: 'Room Temp. 1',
                data: data.slice()
            }, {
                name: 'Room Temp. 2',
                data: data1.slice()
            }, {
                name: 'Room Temp. 3',
                data: data2.slice()
            }],
            chart: {
                id: 'realtime',
                height: 350,
                type: 'line',
                animations: {
                    enabled: true,
                    easing: 'linear',
                    dynamicAnimation: {
                        speed: 1000
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
                    text: 'Date',
                }
            },
            yaxis: {
                max: 100,
                title: {
                    text: 'Temperature (C)',
                }
            },
            legend: {
                show: true,
                floating: true,
                horizontalAlign: 'left',
                onItemClick: {
                    toggleDataSeries: true
                },
                position: 'top',
                offsetY: -28,
                offsetX: 60
            },
        };

        var chart = new ApexCharts(document.querySelector("#linechart"), options);
        chart.render();

        window.setInterval(function() {
            getNewSeries(lastDate, {
                min: 10,
                max: 100
            })

            chart.updateSeries([{
                data: data
            }, {
                data: data1
            }, {
                data: data2
            }])
        }, 1000)

        function getNewSeries(baseval, yrange) {
            var newDate = baseval + TICKINTERVAL;
            lastDate = newDate

            for (var i = 0; i < data.length - 10; i++) {
                data[i].x = newDate - XAXISRANGE - TICKINTERVAL
                data[i].y = 0

                data1[i].x = newDate - XAXISRANGE - TICKINTERVAL - 400000
                data1[i].y = 0

                data2[i].x = newDate - XAXISRANGE - TICKINTERVAL + 400000
                data2[i].y = 0
            }

            data.push({
                x: newDate,
                y: Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min
            })



            data1.push({
                x: newDate,
                y: Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min
            })
            data2.push({
                x: newDate,
                y: Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min
            })
        }

    });
})(jQuery);