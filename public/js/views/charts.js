var main_canv = document.getElementById('cv-main-chart').getContext('2d')
var avpackage_canv = document.getElementById('cv-average-package-chart').getContext('2d')
var cvexp_canv = document.getElementById('cv-expenses-chart').getContext('2d')
var cvbookingstally_canv = document.getElementById('cv-bookings-tally-chart').getContext('2d')
var personalprofit_canv = document.getElementById('personal-profit-chart').getContext('2d')
var coord_canv = document.getElementById('coordinators-tally-chart').getContext('2d')
var proj_heads_canv = document.getElementById('project-heads-tally-chart').getContext('2d')
var loc_canv = document.getElementById('event-locations-chart').getContext('2d')

var monthNames = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12
}

var chartconfig = {
    borderWidth: 2,
    color: {
        revenue: {
            background: 'rgb(54, 137, 244, 0.2)',
            border: 'rgb(54, 137, 244, 1)'
        },
        expense: {
            background: 'rgb(237, 62, 42, 0.2)',
            border: 'rgb(237, 62, 42, 1)'
        },
        default: {
            background: 'rgb(103, 102, 214, 0.2)',
            border: 'rgb(103, 102, 214, 1)'
        },
        gray: {
            background: 'rgb(170, 170, 170, 0.2)',
            border: 'rgb(170, 170, 170, 1)'
        }
    }
}

var main_chart, average_package_chart, cv_expenses_chart, personalprofit_chart, coord_tally_chart

$(document).ready(function() {
    main_chart = new Chart(main_canv, chartConfig('main'))
    average_package_chart = new Chart(avpackage_canv, chartConfig('average'))
    cv_expenses_chart = new Chart(cvexp_canv, chartConfig('expenses'))
    cv_bookings_tally = new Chart(cvbookingstally_canv, chartConfig('bookings-tally'))
    personalprofit_chart = new Chart(personalprofit_canv, chartConfig('personal-profit'))
    coord_tally_chart = new Chart(coord_canv, chartConfig('coordinators-tally'))
    proj_heads_tally_chart = new Chart(proj_heads_canv, chartConfig('proj-heads-tally'))
    locations_chart = new Chart(loc_canv, chartConfig('coordinators-tally'))
})

socket.on('connect', () => {
    updateMainChart()
    updateExpenseChart()
    updateBookingsChart()
    updateAveragePackageChart()
    updatePersonalProfitChart()
})

socket.on('project-inserted', function(jsondata) {
    updateMainChart()
    updateBookingsChart()
    updateAveragePackageChart()
    updatePersonalProfitChart()
})

socket.on('project-updated', function(jsondata) {
    updateMainChart()
    updateBookingsChart()
    updateAveragePackageChart()
    updatePersonalProfitChart()
})

socket.on('project-deleted', function(jsondata) {
    updateMainChart()
    updateBookingsChart()
    updateAveragePackageChart()
    updatePersonalProfitChart()
})


socket.on('expense-inserted', function(jsondata) {
    updateExpenseChart()
})

socket.on('expense-updated', function(jsondata) {
    updateExpenseChart()
})

socket.on('expense-deleted', function(jsondata) {
    updateExpenseChart()
})


$('.cv-main-chart-option').on('change', function() {
    updateMainChart()
})

function updateAveragePackageChart() {
    socket.emit('get-project-all', null, callback => {
        var projects = JSON.parse(callback)
        var current_year = $.format.date(new Date(), 'yyyy')
        var dataset = []
        var months = []

        var proj_heads = []
        var proj_heads_data = []

        for (var proj of projects) {
            if (proj.event_date == null && proj.inclusions.length == 1 && proj.inclusions[0].id == 'CVO002') {
                proj.event_date = proj.pre_event_dates.start
            }

            if ($.format.date(new Date(proj.event_date), 'yyyy') == current_year) {
                var current_month_index = 0

                if (!months.includes($.format.date(new Date(proj.event_date), 'MMM'))) {
                    months.push($.format.date(new Date(proj.event_date), 'MMM'))
                    dataset.push(
                        [
                            $.format.date(new Date(proj.event_date), 'MMM'),
                            {
                                count: 0,
                                total: 0
                            }
                        ]
                    )
                    current_month_index = dataset.length - 1
                } else {
                    for (var i in dataset) {
                        if (dataset[i][0] == $.format.date(new Date(proj.event_date), 'MMM')) {
                            current_month_index = i
                            break
                        }
                    }
                }

                dataset[current_month_index][1].count += 1
                dataset[current_month_index][1].total += proj.package

                var phi = 0
                if (proj.lead == null) {
                    if (!proj_heads.includes('Unmanaged')) {
                        proj_heads.push('Unmanaged')
                        proj_heads_data.push({
                            label: 'Unmanaged',
                            data: 1
                        })
                        phi = proj_heads.length - 1
                    } else {
                        for (var ph in proj_heads) {
                            if (proj_heads[ph] == 'Unmanaged') {
                                phi = ph
                                break
                            }
                        }
                        proj_heads_data[phi].data++
                    }
                } else {
                    if (!proj_heads.includes(proj.lead.id)) {
                        proj_heads.push(proj.lead.id)
                        proj_heads_data.push({
                            label: proj.lead.name.first,
                            data: 1
                        })
                        phi = proj_heads.length - 1
                    } else {
                        for (var ph in proj_heads) {
                            if (proj_heads[ph] == proj.lead.id) {
                                phi = ph
                                break
                            }
                        }
                        proj_heads_data[phi].data++
                    }

                }

            }
        }

        proj_heads_tally_chart.data.labels = []
        proj_heads_tally_chart.data.datasets[0].data = []
        for (var phd of proj_heads_data) {
            proj_heads_tally_chart.data.labels.push(phd.label)
            proj_heads_tally_chart.data.datasets[0].data.push(phd.data)
        }

        proj_heads_tally_chart.update()

        dataset.sort(function(a, b) {
            return monthNames[a[0]] - monthNames[b[0]]
        })

        var labels = []
        var data = []

        for (var d of dataset) {
            labels.push(d[0])
            data.push(Math.round((d[1].total / d[1].count)/1000)*1000)
        }

        average_package_chart.data.datasets[0].data = data
        average_package_chart.data.labels = labels
        average_package_chart.update()
    })
}

function updateExpenseChart() {
    socket.emit('get-cv-expenses', null, callback => {
        var expenses = JSON.parse(callback)
        socket.emit('get-resources', null, cb => {
            var resources = JSON.parse(cb)

            var categories = []
            var data = []
            var total_expenses = 0

            for (var exp of expenses) {
                var current_index = 0
                for (var acc of resources.accounts) {
                    if (acc.id == exp.account) {
                        exp.account = acc
                    }
                }

                for (var cat of resources.categories) {
                    if (cat.id == exp.category) {
                        exp.category = cat
                    }
                }

                if (!categories.includes(exp.category.name)) {
                    categories.push(exp.category.name)
                    data.push(exp.amount)
                    current_index = categories.length - 1
                } else {
                    for (var i in categories) {
                        if (categories[i] == exp.category.name) {
                            current_index = i
                        }
                    }

                    data[current_index] += exp.amount
                }
                total_expenses += exp.amount
            }

            cv_expenses_chart.data.datasets[0].data = data
            cv_expenses_chart.data.labels = categories

            var bgcolors = []
            var bdcolors = []
            for (var i in cv_expenses_chart.data.datasets[0].data) {
                var color = randomRGB()
                bgcolors.push(`rgb(${color}, 0.2)`)
                bdcolors.push(`rgb(${color}, 1.0)`)
            }
            cv_expenses_chart.data.datasets[0].backgroundColor = bgcolors
            cv_expenses_chart.data.datasets[0].borderColor = bdcolors
            cv_expenses_chart.update()

            $('.cv_expenses_total').text(`₱ ${currencyFormat(total_expenses)}`)
        })


    })
}

function updateBookingsChart() {
    socket.emit('get-project-all', null, callback => {
                var projects = JSON.parse(callback)
                var current_year = $.format.date(new Date(), 'yyyy')
                var dataset = []
                var months = []
                var booked = 0
                var packages = 0

                cv_bookings_tally.data.datasets[0].data[0] = 0
                cv_bookings_tally.data.datasets[0].data[1] = 0
                cv_bookings_tally.data.datasets[0].data[2] = 0

                var event_types = {}
                var event_locations = {}

                for (var proj of projects) {
                    if (proj.event_date == null && proj.inclusions.length == 1 && proj.inclusions[0].id == 'CVO002') {
                        proj.event_date = proj.pre_event_dates.start
                    }

                    if ($.format.date(new Date(proj.event_date), 'yyyy') == current_year) {
                        if (proj.direct) {
                            cv_bookings_tally.data.datasets[0].data[0] += 1
                        } else {
                            var is_coor_null = true

                            for (var s of proj.suppliers) {
                                if (s.job.toLowerCase().includes('coord')) {
                                    is_coor_null = false
                                    break
                                }
                            }

                            if (!is_coor_null) {
                                cv_bookings_tally.data.datasets[0].data[1] += 1
                            } else {
                                cv_bookings_tally.data.datasets[0].data[2] += 1
                            }
                        }
                        booked++
                        packages += proj.package

                        if (event_types[proj.type.type.toLowerCase()] === undefined) {
                            event_types[proj.type.type.toLowerCase()] = 1
                        } else {
                            event_types[proj.type.type.toLowerCase()]++
                        }

                        var loc = (proj.location !== null) ? proj.location.split(" ").join("_") : `Unspecified`
                        if (event_locations[loc] === undefined) {
                            event_locations[loc] = 1
                        } else {
                            event_locations[loc]++
                        }
                    }
                }

                event_locations = Object.keys(event_locations).sort().reduce(
                    (obj, key) => {
                        obj[key] = event_locations[key]
                        return obj
                    }, {}
                )

                locations_chart.data.datasets[0].data = []
                locations_chart.data.labels = []
                for (var l in event_locations) {
                    locations_chart.data.datasets[0].data.push(event_locations[l])
                    locations_chart.data.labels.push(l.split("_").join(" "))
                }
                locations_chart.update()

                var ev = []
                for (var i in event_types) {
                    ev.push(`${(event_types[i] < 10) ? `0${event_types[i]}`: event_types[i]}${i.toLocaleUpperCase().charAt(0)}`)
        }

        $(`.total-number-of-projects`).text(ev.join(' / '))
        $('.cv_packages_total').text(`₱ ${currencyFormat(packages)}`)
        cv_bookings_tally.update()
        $('.booking_tally_total').text((booked > 1) ? `${booked} Booked Projects` : `${booked} Booked Project`)
    })
}

function updateMainChart() {
    socket.emit('get-cv-rev-exp', $('.cv-main-chart-option:checked').attr('data'), callback => {
        var response = JSON.parse(callback)

        var revenues = []
        var expenses = []
        var labels = []

        var total_profit = 0
        var total_expense = 0
        var qty = 0

        for (var data of response.datasets) {
            labels.push(data[0])
            revenues.push(data[1].revenue)
            expenses.push(data[1].expenses)

            total_profit += data[1].revenue
            total_expense += data[1].expenses
            qty++
        }

        if ($('.cv-main-chart-option:checked').attr('data') == 'month') {
            $('.cv-main-chart-title').text(`Revenue & Expenses (${$.format.date(new Date(), 'yyyy')})`)
        } else {
            if (labels.length > 1) {
                $('.cv-main-chart-title').text(`Revenue & Expenses (${labels[0]}-${labels[labels.length-1]})`)
                $('.cv_average_revenue_time').text(`(${labels[0]}-${labels[labels.length-1]})`)
                $('.cv_average_expense_time').text(`(${labels[0]}-${labels[labels.length-1]})`)
            } else {
                $('.cv-main-chart-title').text(`Revenue & Expenses (${labels[0]})`)
            }
        }

        if (labels.length > 0) {
            $('.cv_average_revenue').text(currencyFormat(Math.round(total_profit / qty)))
            $('.cv_average_expense').text(currencyFormat(Math.round(total_expense / qty)))
        } else {
            $('.cv_average_revenue').text(currencyFormat(0))
            $('.cv_average_expense').text(currencyFormat(0))
        }


        main_chart.data.labels = labels
        main_chart.data.datasets[0].data = revenues
        main_chart.data.datasets[1].data = expenses
        main_chart.update()
    })

    socket.emit('get-cv-rev-exp', 'year', callback => {
        var response = JSON.parse(callback)

        var revenues = []
        var expenses = []
        var labels = []
        var count = 0

        for (var data of response.datasets) {
            labels.push(data[0])
            revenues.push(data[1].revenue)
            expenses.push(data[1].expenses)
            count += data[1].count
        }

        if (count > 0) {
            if (labels.length == 1) {
                $('.total-number-of-projects-from-years-title span').text(` ${labels[0]} Only`)
            } else {
                $('.total-number-of-projects-from-years-title span').text(` ${labels[0]}-${labels[labels.length-1]}`)
            }
            $('.total-number-of-projects-from-years .number').text((count > 1) ? `${count} Projects` : `${count} Project`)
        } else {
            $('.total-number-of-projects-from-years-title span').text(` Unknown`)
            $('.total-number-of-projects-from-years .number').text(``)
        }


    })
}

function updatePersonalProfitChart() {
    socket.emit('get-project-all-this-year', null, callback => {
                var projects = JSON.parse(callback)
                var months = []
                var dataset = []
                var cv_dataset = []
                var personal_dataset = []
                var total = 0

                var coord_dataset = []
                var coordinators_list = []

                var all_proj_expenses = 0
                var projs_with_expenses = 0

                var current_index = 0


                for (var proj of projects) {
                    var expense_added = false
                    if(proj.budget.length > 0){
                        for (var b of proj.budget) {
                            if (b.type === 'cr') {
                                all_proj_expenses += b.amount

                                if(!expense_added){
                                    expense_added = true
                                    projs_with_expenses += 1
                                }
                            }
                        }
                    }
                }

                var average_expense = Math.round(all_proj_expenses / projs_with_expenses)


                for (var proj of projects) {
                    
                    if (proj.event_date == null) {
                        
                        if (proj.inclusions.length == 1 && proj.inclusions[0].id == 'CVO002') {
                            proj.event_date = proj.pre_event_dates.start
                        }else if(proj.inclusions.length == 2 && proj.inclusions[0].id == 'CVO001' && proj.inclusions[1].id == 'CVO002') {
                            proj.event_date = proj.pre_event_dates.start
                        } else if(proj.status.status.toLowerCase() == 'postponed') {
                            proj.event_date = new Date().getTime()
                        }
                    }

                    var month = $.format.date(new Date(proj.event_date), 'MMM')
                    if (!months.includes(month)) {
                        months.push(month)
                        dataset.push([month, 0, 0, 0])
                        cv_dataset.push([month, 0, 0, 0])
                        current_index = months.length - 1
                    } else {
                        for (var m in months) {
                            if (months[m] === $.format.date(new Date(proj.event_date), 'MMM')) {
                                current_index = m
                                break
                            }
                        }
                    }

                    var allocation = { user: null, value: 0 }
                    var cv_allocation = { user: null, value: 0 }
                    for (var a of proj.allocation.allocation) {
                        if (a.user === sessioned_user.id) {
                            allocation = a
                        }
                        if(a.user === "CVUSR000"){
                            cv_allocation = a
                        }
                    }

                    var revenue = 0,
                        expenses = 0,
                        received = 0


                    for (var b of proj.budget) {
                        if (b.type === 'cr') {
                            expenses += b.amount
                        }else if(b.type == 'dr'){
                            received += b.amount
                        }
                    }

                    revenue = proj.package - expenses
                    all_proj_expenses += expenses

                    var profit = (revenue * (allocation.value / 100))
                    if($.format.date(new Date(proj.event_date), 'yyyy-MM-dd') <= $.format.date(new Date(), 'yyyy-MM-dd')){
                        dataset[current_index][1] += profit
                        cv_dataset[current_index][1] += (revenue * cv_allocation.value / 100)

                        if(received >= proj.package){
                            dataset[current_index][3] += profit
                            cv_dataset[current_index][3] += (revenue * cv_allocation.value / 100)
                        }
                    }else{
                        dataset[current_index][1] += ((proj.package - average_expense) * (allocation.value / 100))
                        cv_dataset[current_index][1] += ((proj.package - average_expense) * (cv_allocation.value / 100))
                    }

                    dataset[current_index][2] += 1
                    total += profit
                    cv_dataset[current_index][2] += 1


                    // Coordinator's Tally Code
                    if (!proj.direct) {
                        for (var s of proj.suppliers) {
                            if (s.job.toLowerCase().includes('coord')) {
                                if (!coordinators_list.includes(s.name)) {
                                    coordinators_list.push(s.name)
                                    coord_dataset.push([1, s.name])
                                } else {
                                    for (var c in coord_dataset) {
                                        if (coord_dataset[c][1] == s.name) {
                                            coord_dataset[c][0] += 1
                                        }
                                    }
                                }
                                break
                            }
                        }
                    }
                }

                coord_dataset.sort(function(a, b) {
                    return b[0] - a[0]
                })

                dataset.sort(function(a, b) {
                    return monthNames[a[0]] - monthNames[b[0]]
                })

                cv_dataset.sort(function(a, b) {
                    return monthNames[a[0]] - monthNames[b[0]]
                })

                var labels = []
                var data = []

                $('#monthly-profit-figures tbody tr').remove()
                for (var d of dataset) {
                    labels.push(d[0])
                    
                    if($.format.date(new Date(`${d[0]} 1, ${new Date().getFullYear()}`), 'MMMM') == $.format.date(new Date(), 'MMMM')){
                        data.push(d[3])
                    }else{
                        data.push(d[1])
                    }

                    if($.format.date(new Date(`${d[0]} 1, ${new Date().getFullYear()}`), 'yyyy-MM') >= $.format.date(new Date(), 'yyyy-MM')){
                        d[1] = `${currencyFormat(d[3])} / ${Math.round(d[1] / 1000)}K`
                    }else{
                        d[1] = currencyFormat(d[1])
                    }

                    $('#monthly-profit-figures tbody').append(`
                    <tr class="${($.format.date(new Date(`${d[0]} 1`), 'MMM') === $.format.date(new Date(), 'MMM')) ? `bg-gradient-primary`: ($.format.date(new Date(`${d[0]} 1, ${new Date().getFullYear()}`), 'yyyy-MM-dd') > $.format.date(new Date(), 'yyyy-MM-dd')) ? `bg-gradient-info`:``}">
                        <td class="text-center">${d[2]}</td>
                        <td class="text-center">${$.format.date(new Date(`${d[0]} 1`), 'MMMM')}</td>
                        <td class="text-right"><span class="float-left ml-1">₱</span>${d[1]}</td>
                    </tr>
                    `)
                }

                var cv_profit_total = 0
                $('#cv-monthly-profit-figures tbody tr').remove()
                for (var d of cv_dataset) {
                    $('#cv-monthly-profit-figures tbody').append(`
                    <tr class="${($.format.date(new Date(`${d[0]} 1`), 'MMM') === $.format.date(new Date(), 'MMM')) ? `bg-gradient-primary`: ($.format.date(new Date(`${d[0]} 1, ${new Date().getFullYear()}`), 'yyyy-MM-dd') > $.format.date(new Date(), 'yyyy-MM-dd')) ? `bg-gradient-info`:``}">
                        <td class="text-center">${d[2]}</td>
                        <td class="text-center">${$.format.date(new Date(`${d[0]} 1`), 'MMMM')}</td>
                        <td class="text-right"><span class="float-left ml-1">₱</span>${currencyFormat(d[1])}</td>
                    </tr>
                    `)

                    cv_profit_total += d[1]
                }

        personalprofit_chart.data.datasets[0].data = data
        personalprofit_chart.data.labels = labels
        personalprofit_chart.update()

        var clabels = []
        var cdata = []
        var cbg = []
        var cbd = []

        for (var c of coord_dataset) {
            clabels.push(c[1])
            cdata.push(c[0])
        }

        coord_tally_chart.data.datasets[0].data = cdata
        coord_tally_chart.data.labels = clabels
        coord_tally_chart.update()

        $('.top_1_coordinator').text(clabels[0])
        $('.personal_profit_total').text(currencyFormat(total))
        $('.cv_profit_total').text(currencyFormat(cv_profit_total))
        $('.personal_profit_average').text(currencyFormat(total / projects.length))
        $('.personal_profit_average_monthly').text(currencyFormat(total / labels.length))

    })
}

function chartConfig(opt) {
    var config = null
    if (opt == 'main') {
        config = {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Revenue',
                        data: [],
                        backgroundColor: chartconfig.color.revenue.background,
                        borderColor: chartconfig.color.revenue.border,
                        borderWidth: chartconfig.borderWidth
                    }, {
                        label: 'Expenses',
                        data: [],
                        backgroundColor: chartconfig.color.expense.background,
                        borderColor: chartconfig.color.expense.border,
                        borderWidth: chartconfig.borderWidth
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            title: {
                                padding: 10
                            },
                            labels: {
                                padding: 10
                            }
                        },
                        labels: {
                            render: 'value',
                            fontSize: 0.1
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true
                        },
                        yAxes: [{
                            beginAtZero: true,
                            ticks: {
                                callback: function(label, index, labels) {
                                    return `₱ ${((label / 1000) >= 1000) ? `${label / 1000000}M`: `${label / 1000}K`}`
                                },
                                beginAtZero: true
                            }
                        }]
                    },
                    tooltips: {
                        callbacks: {
                            label: function(tooltipItem, data) {
                                    var label = data.datasets[tooltipItem.datasetIndex].label
                                    var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]

                                    var averagepackage
                                    if (label.toLowerCase() == 'revenue') {
                                        averagepackage = removeCurrencyFormat($('.cv_average_revenue').text())
                                    } else {
                                        averagepackage = removeCurrencyFormat($('.cv_average_expense').text())
                                    }

                                    var percentage = Math.round(((value - averagepackage) / value) * 100)
                                    return `₱ ${currencyFormat(value)} (${(percentage > 0) ? `+${percentage}%` : `${percentage}%`})`
                        },
                        title: function(tooltipItem, data) {
                            return $.format.date(new Date(`${data.labels[tooltipItem[0].index]} 1`), 'MMMM')
                        },
                        labelColor: function(tooltipItem, chart) {
                            var color = chart.legend.legendItems[tooltipItem.datasetIndex].strokeStyle
                            return {
                                borderColor: color,
                                backgroundColor: color
                            }
                        }
                    }
                }
            }
        }
    } else if (opt == 'average') {
        config = {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Average Package per Month',
                        data: [],
                        backgroundColor: chartconfig.color.gray.background,
                        borderColor: chartconfig.color.gray.border,
                        borderWidth: chartconfig.borderWidth
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [{
                            ticks: {
                                callback: function(label, index, labels) {
                                    return `₱ ${label / 1000}K`
                                },
                                beginAtZero: true,
                                stepSize: 10000
                            }
                        }]
                    },
                    tooltips: {
                        callbacks: {
                            label: function(tooltipItem, data) {
                                    var label = data.datasets[tooltipItem.datasetIndex].label
                                    var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]

                                    var averagepackage = removeCurrencyFormat($('.average-package .amount').text())
                                    var percentage = Math.round(((value - averagepackage) / value) * 100)
                                    return `₱ ${currencyFormat(value)} (${(percentage > 0) ? `+${percentage}%` : `${percentage}%`})`
                        },
                        labelColor: function(tooltipItem, chart) {
                            var color = chart.legend.legendItems[tooltipItem.datasetIndex].strokeStyle
                            return {
                                borderColor: color,
                                backgroundColor: color
                            }
                        }
                    }
                },
                plugins: {
                    labels: {
                      render: 'value',
                      fontSize: 0.1
                    }
                }
            }
        }
    } else if (opt == 'expenses') {
        config = {
            type: 'doughnut',
            data: {
                labels: ['555', '111', '222'],
                datasets: [{
                    label: "Expense",
                    data: [],
                    borderWidth: chartconfig.borderWidth
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var label = data.datasets[tooltipItem.datasetIndex].label
                            var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]
                            var total = 0
                            for (var d of data.datasets[tooltipItem.datasetIndex].data) {
                                total += d
                            }
                            var percentage = (value / total) * 100
                            return `₱ ${currencyFormat(value)} (${Math.round(percentage)}%)`
                        },
                        title: function(tooltipItem, data) {
                            return data.labels[tooltipItem[0].index]
                        }
                    }
                },
                plugins: {
                    labels: {
                      render: 'value',
                      fontSize: 0.1
                    }
                }
            }
        }
    } else if (opt == 'bookings-tally') {
        config = {
            type: 'bar',
            data: {
                labels: ['Booked Directly', 'via Coordinator', 'Unspecified'],
                datasets: [{
                    data: [0, 0, 0],
                    backgroundColor: [
                        chartconfig.color.revenue.background,
                        chartconfig.color.default.background,
                        chartconfig.color.gray.background
                    ],
                    borderColor: [
                        chartconfig.color.revenue.border,
                        chartconfig.color.default.border,
                        chartconfig.color.gray.border
                    ],
                    borderWidth: chartconfig.borderWidth
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            beginAtZero: true
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var label = data.datasets[tooltipItem.datasetIndex].label
                            var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]
                            var total = 0
                            for (var d of data.datasets[tooltipItem.datasetIndex].data) {
                                total += d
                            }
                            var percentage = (value / total) * 100
                            return `${value} ${(value > 1) ? 'Projects': 'Project'} (${Math.round(percentage)}%)`
                        },
                        title: function(tooltipItem, data) {
                            return data.labels[tooltipItem[0].index]
                        }
                    }
                },
                plugins: {
                    labels: {
                      render: 'value',
                      fontSize: 0.1
                    }
                }
            }
        }
    }else if(opt == 'personal-profit'){
        config = {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: chartconfig.color.gray.background,
                    borderColor: chartconfig.color.gray.border,
                    borderWidth: chartconfig.borderWidth
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            callback: function(label, index, labels) {
                                return `₱ ${label / 1000}K`
                            },
                            beginAtZero: true,
                            stepSize: 25000
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]

                            var avprofit = removeCurrencyFormat($('.personal_profit_average_monthly').text())
                            var percentage = Math.round(((value - avprofit) / value) * 100)
                            return `₱ ${currencyFormat(value)} (${(percentage > 0) ? `+${percentage}%` : `${percentage}%`})`
                        },
                        title: function(tooltipItem, data) {
                            return $.format.date(new Date(`${data.labels[tooltipItem[0].index]} 1`), 'MMMM')
                        }
                    }
                },
                plugins: {
                    labels: {
                      render: 'value',
                      fontSize: 0.01
                    }
                }
            }
        }
    }else if(opt == 'coordinators-tally'){
        config = {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: chartconfig.color.gray.background,
                    borderColor: chartconfig.color.gray.border,
                    borderWidth: chartconfig.borderWidth
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                scales: {
                    yAxes: [{
                        ticks: {
                            callback: function(label, index, labels) {
                                return label
                            },
                            beginAtZero: true,
                            stepSize: 10
                        }
                    }]
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]
                            return (value > 1) ? `${value} Projects`: `${value} Project`
                        }
                    }
                },
                plugins: {
                    labels: {
                      render: 'value',
                      fontSize: 0.1
                    }
                }
            }
        }
    }else if(opt == 'proj-heads-tally'){
        config = {
            type: 'doughnut',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: chartconfig.color.gray.background,
                    borderColor: chartconfig.color.gray.border,
                    borderWidth: chartconfig.borderWidth
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                tooltips: {
                    callbacks: {
                        label: function(tooltipItem, data) {
                            var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]
                            return (value > 1) ? `${value} Projects`: `${value} Project`
                        },
                        title: function(tooltipItem, data) {
                            return data.labels[tooltipItem[0].index]
                        }
                    }
                },
                plugins: {
                    labels: [
                        {
                          render: 'label',
                          position: 'outside',
                          arc: true,
                          fontSize: 14
                        },
                        {
                          render: 'value',
                          fontSize: 18
                        }
                      ]
                }
            }
        }
    }

    return config
}

function randomRGB() {
    var color = [
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256)
    ]
    return color.join(', ')
}