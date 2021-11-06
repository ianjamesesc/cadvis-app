var current_expense,
    projects_table,
    desc_list = [],
    months = [],
    order = [3, 'asc'],
    all_projects = null

const line = {
    datasets: [{
        label: 'My First dataset',
        fill: false,
        lineTension: 0.1,
        data: [],
    }, ],
}

var cadencevisual = {
    expenses: 0,
    revenue: 0
}

$(document).ready(function() {
    if (page == `Budget/Expenses`) {
        projects_table = $('#cv-expenses-table').dataTable({
            paging: false,
            ordering: true,
            info: true,
            bAutoWidth: false,
            lengthChange: false,
            responsive: {
                details: false
            },
            order: [
                [0, 'desc']
            ],
            columnDefs: [{
                    type: 'date-str',
                    targets: 1
                },
                {
                    targets: [2, 3, 4, 5],
                    orderable: false
                }
            ],
            fnRowCallback: function(nRow, aData, iDisplayIndex) {
                nRow.setAttribute('id', aData[0].toLowerCase())
                nRow.setAttribute('row', 'data')
            }
        })
    } else {
        projects_table = $('.datatable').dataTable({
            paging: false,
            ordering: true,
            info: true,
            bAutoWidth: false,
            lengthChange: false,
            responsive: {
                details: false
            },
            order: [
                order
            ],
            columnDefs: [{
                type: 'date-str',
                targets: 3
            }, {
                targets: [5, 8, 9, 10, 12],
                visible: false,
                searchable: true
            }],
            fnRowCallback: function(nRow, aData, iDisplayIndex) {
                nRow.setAttribute('id', aData[0].toLowerCase())
                nRow.setAttribute('row', 'data')
            }
        })
    }

    $("#modal_projbudget table").on('change', 'input', function() {
        changes()
    })

    if (page == 'Budget/Expenses') {
        getExpenses()
    } else if (page.includes('Dashboard')) {
        calculateBudgetForDashboardWidgets()
    } else if (page == "Budget/Profits") {
        getProfits()
    } else {
        socket.emit('get-project-all', '', callback => {
            var projects = JSON.parse(callback)

            for (var proj of projects) {
                alterProjectsBudgetTable(proj, true)
            }
        })
    }

    socket.on('expense-inserted', function(jsondata) {
        var expenseOBJ = JSON.parse(jsondata)
        alterExpensesTable(expenseOBJ, true)
        calculateExpenses()
    })

    socket.on('expense-updated', function(jsondata) {
        var expenseOBJ = JSON.parse(jsondata)
        alterExpensesTable(expenseOBJ, false)
        calculateExpenses()
    })

    socket.on('expense-deleted', function(jsondata) {
        var expenseOBJ = JSON.parse(jsondata)
        projects_table.fnDeleteRow(projects_table.find(`#${expenseOBJ.id.toLowerCase()}`))
        calculateExpenses()
    })



    socket.on('project-inserted', function(jsondata) {
        var proj = JSON.parse(jsondata)
        if (page == 'Budget/Current') {
            var status = proj.status.status.toLowerCase()
            if (status !== 'submitted' && status !== 'done' && status !== 'cancelled' && status !== 'tentative') {
                projects_table.fnDeleteRow(projects_table.find(`#${proj.id.toLowerCase()}`))
                alterProjectsBudgetTable(proj, true)
            }
        } else {
            alterProjectsBudgetTable(proj, true)
        }
        calculateExpenses()
        reloadModalDatalists()
        loadWidgetsData()
        countProjects()
    })

    socket.on('project-updated', function(jsondata) {
        var proj = JSON.parse(jsondata)
        var status = proj.status.status.toLowerCase()
        if (page == 'Budget/Current') {
            if (status == 'submitted' || status == 'done' || status == 'cancelled' || status == 'tentative') {
                projects_table.fnDeleteRow(projects_table.find(`#${proj.id.toLowerCase()}`))
            } else {
                if (projects_table.find(`#${proj.id.toLowerCase()}`).length > 0) {
                    alterProjectsBudgetTable(proj, false)
                } else {
                    alterProjectsBudgetTable(proj, true)
                }
            }
        } else {
            alterProjectsBudgetTable(proj, false)
        }

        calculateExpenses()

        $('#modal_projbudget').on('shown.bs.modal', function() {
            triggerProjectModal(proj)
        })
        countProjects()
    })

    socket.on('project-deleted', function(jsondata) {
        var proj = JSON.parse(jsondata)
        projects_table.fnDeleteRow(projects_table.find(`#${proj.id.toLowerCase()}`))
        calculateExpenses()
        reloadModalDatalists()
        loadWidgetsData()
        countProjects()
    })

    if (page == 'Budget/Expenses') {
        projects_table.find(`tbody`).delegate(`tr[row="data"]`, `click`, function() {
            var id = $(this).find('td').eq(0).text()
            socket.emit('get-cv-expense', id, callback => {
                var expense = JSON.parse(callback)
                current_expense = expense
                previewExpense(expense)
            })
        })
    } else {
        projects_table.find(`tbody`).delegate(`tr[row="data"]`, `click`, function() {
            var proj_id = $(this).find('td').eq(0).text()
            previewProject(proj_id)
        })
    }

    $('#modal_expense').on('hidden.bs.modal', function() {
        var modal = $(`#modal_expense`)
        modal.find('#_modal_id').val('')
    })

    modifySearchbar()

})

function getProfits() {
    var start = $("#date-range .start").val()
    var end = $("#date-range .end").val()
    var today = new Date()
    var current_year = today.getFullYear()

    if (start == '' || end == '') {
        socket.emit('get-project-all-this-year', '', callback => {
            var projects = JSON.parse(callback)

            var data = []

            for (var proj of projects) {
                var evdate = new Date(proj.event_date)

                var user_allocation = {
                    user: null,
                    value: 0
                }


                for (var a of proj.allocation.allocation) {
                    if (a.user == sessioned_user.id) {
                        user_allocation = a
                        break
                    }
                }

                var coordinator = null

                for (var s of proj.suppliers) {
                    if (s.job.toUpperCase().includes('COORD')) {
                        coordinator = s
                        break
                    }
                }

                if (!proj.direct && proj.title == null) {
                    proj.title = `<span class="font-italic font-weight-bold text-muted">[ ${coordinator.name.split(" ")[0].toUpperCase()} ${coordinator.name.split(" ")[1].toUpperCase()} ]</span>`
                }

                if (proj.type.type.toLowerCase() == 'debut') {
                    proj.title = `${proj.title.split(' ')[0]} XVIII`
                }

                var identifier = `${$.format.date(evdate, 'MMM').toUpperCase()}${$.format.date(evdate, 'yy')}`

                var proj_rev = 0,
                    proj_exp = 0,
                    received = 0,
                    profit = 0

                if (data[identifier] == undefined) {
                    data[identifier] = {
                        packages: 0,
                        profit: 0,
                        revenue: 0,
                        expenses: 0,
                        received: 0,
                        title: $.format.date(evdate, 'MMMM yyyy').toUpperCase()
                    }
                }

                for (var budg of proj.budget) {
                    if (budg.type == 'cr') {
                        proj_exp += budg.amount
                    } else if (budg.type == 'dr') {
                        received += budg.amount
                    }
                }

                proj_rev = proj.package - proj_exp
                profit = (proj_rev * (user_allocation.value / 100))

                data[identifier].packages += proj.package
                data[identifier].expenses += proj_exp
                data[identifier].revenue += proj_rev
                data[identifier].received += received
                if (received >= proj.package) {
                    data[identifier].profit += profit
                }

                if ($(`#profit-cards-container .card-${identifier}`).length == 0) {
                    $(`#profit-cards-container`).append(`<div class="col-md-4 col-sm-12 card-${identifier} pb-4"><div class="card h-100">
                        <div class="card-header text-center card-title font-weight-bold"><h4>${$.format.date(evdate, 'MMMM yyyy').toUpperCase()}</h4></div>
                        <div class="card-body">
                            <table class="table table-sm table-bordered table-striped">
                                <thead>
                                <tr class="table-header-color">
                                        <th class="text-center py-2">Project Title</th>
                                        <th class="text-center py-2" style="width: 130px;">Package</th>
                                        <th class="text-center py-2" style="width: 130px;">Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr id="${proj.id.toLowerCase()}" onclick="previewProject('${proj.id}')">
                                        <td>${proj.title}</td>
                                        <td class="text-right"><span class="float-left ml-1">₱</span>${currencyFormat(proj.package)}</td>
                                        <td class="text-right"><span class="float-left ml-1">₱</span>${currencyFormat((received >= proj.package) ? profit: 0)}</td>
                                    </tr>
                                </tbody>
                                <tfoot>
                                    <tr class="table-header-color">
                                        <td class="font-weight-bold text-center">T O T A L</td>
                                        <td class="package text-right"></td>
                                        <td class="profit text-right"></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                    </div>`)

                    console.log(`${proj.title} ==> ${profit}`)

                    $(`#profit-cards-container .card-${identifier} table tfoot td.package`).html(`<span class="float-left ml-1">₱</span>${currencyFormat(data[identifier].packages)}`)
                    $(`#profit-cards-container .card-${identifier} table tfoot td.profit`).html(`<span class="float-left ml-1">₱</span>${currencyFormat(data[identifier].profit)}`)
                } else {
                    $(`#profit-cards-container .card-${identifier} table tbody`).append(`<tr id="${proj.id.toLowerCase()}" onclick="previewProject('${proj.id}')">
                        <td>${proj.title}</td>
                        <td class="text-right"><span class="float-left ml-1">₱</span>${currencyFormat(proj.package)}</td>
                        <td class="text-right"><span class="float-left ml-1">₱</span>${currencyFormat((received >= proj.package) ? profit: 0)}</td>
                        </tr>`)

                    $(`#profit-cards-container .card-${identifier} table tfoot td.package`).html(`<span class="float-left ml-1">₱</span>${currencyFormat(data[identifier].packages)}`)
                    $(`#profit-cards-container .card-${identifier} table tfoot td.profit`).html(`<span class="float-left ml-1">₱</span>${currencyFormat(data[identifier].profit)}`)
                }

            }
        })
    } else {

    }
}

function getExpenses() {
    socket.emit('get-project-all', '', callback => {
        var cv = {
            expenses: 0,
            revenue: 0
        }

        expenseModalInit()
        all_projects = JSON.parse(callback)

        for (var proj of all_projects) {
            console.log(proj)
            var cadvis = {}

            for (var a of proj.allocation.allocation) {
                if (a.user == "CVUSR000") {
                    cadvis = a
                    break
                } else {
                    cadvis = {
                        type: 'precent',
                        user: null,
                        value: 0
                    }
                }
            }

            var package = proj.package

            var expenses = 0
            var revenue = 0

            for (var exp of proj.budget) {
                if (exp.type == `cr`) {
                    expenses += exp.amount
                }
            }

            revenue = (package - expenses)
            if ($.format.date(new Date(), 'yyyy-MM-dd') >= $.format.date(new Date(proj.event_date), 'yyyy-MM-dd') && proj.budget.length > 0) {
                cv.revenue += (revenue * (cadvis.value / 100))
            }
        }

        $(`.cv-widget-revenue .amount`).text(currencyFormat(cv.revenue))

        socket.emit('get-cv-expenses', '', callback => {
            var expenses = JSON.parse(callback)

            for (var exp of expenses) {
                cv.expenses += exp.amount
                alterExpensesTable(exp, true)
            }
            $(`.cv-widget-expenses .amount`).text(currencyFormat(cv.expenses))
            $(`.cv-widget-remaining .amount`).text(currencyFormat(cv.revenue - cv.expenses))
        })
    })
}

function previewExpense(data) {
    //If data is an object
    var modal = $(`#modal_expense`)
    modal.find('.modal-title').text(`Expense No. ${data.id}`)
    modal.find('#_modal_id').val(data.id)
    modal.find('#_modal_date').val(data.date)

    modal.find('#_modal_notes').val(data.notes)
    modal.find('#_modal_amount').val(currencyFormat(data.amount))
    modal.find(`.proj_delete_btn`).removeClass('hidden')

    modal.find('#_modal_account').val(data.account)
    modal.find('#_modal_category').val(data.category)

    modal.modal(`show`)
}

function expenseModalInit() {
    socket.emit('get-resources', '', callback => {
        var expensemodal = $('#modal_expense')
        var resources = JSON.parse(callback)
        for (var acc of resources.accounts) {
            expensemodal.find('#_modal_account').append(`<option value="${acc.id}">${acc.name}</option>`)
        }

        for (var cat of resources.categories) {
            expensemodal.find('#_modal_category').append(`<option value="${cat.id}">${cat.name}</option>`)
        }
    })
}

function alterExpensesTable(data, bool) {
    socket.emit('get-resources', '', callback => {
        var resources = JSON.parse(callback)

        for (var expa of resources.accounts) {
            if (data.account == expa.id) {
                data.account = expa.name
                break
            }
        }

        for (var expc of resources.categories) {
            if (data.category == expc.id) {
                data.category = expc.name
                break
            }
        }

        var arraydata = [
            data.id,
            (data.date == '' || data.date == null) ? '---' : $.format.date(new Date(data.date), 'MMM dd, yyyy'),
            data.account,
            data.category,
            data.notes,
            `<span class="float-left ml-1">₱</span>&nbsp;&nbsp; ${currencyFormat(data.amount)}`,
        ]

        //bool = true for create; false for update
        if (bool) {
            projects_table.fnAddData(arraydata)
        } else {
            projects_table.fnUpdate(arraydata, projects_table.find(`tbody #${data.id.toLowerCase()}`))
        }
    })
}

function modifySearchbar() {
    var search_input = $('.dataTables_filter').find('input')
    var search_label = $('.dataTables_filter').find('label')
    search_input.attr('placeholder', 'Search Everything')
    search_input.addClass('mb-3')
    $('.dataTables_filter').append(search_input)
    search_label.remove()
}

function modalReset() {
    $('#modal_projbudget .table tbody tr').remove()
    $('#modal_projbudget .card-user').remove()
}

function createNewExpense() {
    var modal = $('#modal_expense')
    var expense_id

    if ($('#modal_expense #_modal_id').val() != '') {
        expense_id = $('#modal_expense #_modal_id').val()
    } else if ($('#cv-expenses-table tbody tr[row="data"]').length > 0) {
        expense_id = incrementStringID($('#cv-expenses-table tbody tr[row="data"]').eq(0).find('td').eq(0).text(), 5, 4)
    } else {
        expense_id = incrementStringID(`CVEXP0000`, 5, 4)
    }

    var expenseOBJ = {
        id: expense_id,
        date: (modal.find('#_modal_date').val() == '') ? null : modal.find('#_modal_date').val(),
        account: modal.find('#_modal_account').val(),
        category: modal.find('#_modal_category').val(),
        notes: modal.find('#_modal_notes').val(),
        amount: removeCurrencyFormat(modal.find('#_modal_amount').val())
    }


    socket.emit('create-cv-expense', expenseOBJ, callback => {
        var response = JSON.parse(callback)
        if (response.success && response.action == 'inserted') {
            showToast('Success', response.message, 'success')
            modal.modal('hide')
        } else if (response.success && response.action == 'updated') {
            showToast('Success', response.message, 'success')
            modal.modal('hide')
        }
    })


}

function deleteExpense() {
    var modal = $('#modal_expense')
    var id = modal.find('#_modal_id').val()

    if (id !== '') {
        socket.emit('delete-cv-expense', id, callback => {
            var response = JSON.parse(callback)
            if (response.success) {
                showToast('Success', response.message, 'success')
                modal.modal('hide')

            }
        })
    }
}

function calculateExpenses() {
    socket.emit('get-project-all', '', callback => {
        var cv = {
            expenses: 0,
            revenue: 0
        }

        all_projects = JSON.parse(callback)

        for (var proj of all_projects) {
            console.log(proj)
            var cadvis = {}

            for (var a of proj.allocation.allocation) {
                if (a.user == "CVUSR000") {
                    cadvis = a
                    break
                } else {
                    cadvis = {
                        type: 'precent',
                        user: null,
                        value: 0
                    }
                }
            }

            var package = proj.package

            var expenses = 0
            var revenue = 0

            for (var exp of proj.budget) {
                if (exp.type == `cr`) {
                    expenses += exp.amount
                }
            }

            revenue = (package - expenses)
            if ($.format.date(new Date(), 'yyyy-MM-dd') >= $.format.date(new Date(proj.event_date), 'yyyy-MM-dd') && proj.budget.length > 0) {
                cv.revenue += (revenue * (cadvis.value / 100))
            }
        }

        $(`.cv-widget-revenue .amount`).text(currencyFormat(cv.revenue))

        socket.emit('get-cv-expenses', '', callback => {
            var expenses = JSON.parse(callback)

            for (var exp of expenses) {
                cv.expenses += exp.amount
            }
            $(`.cv-widget-expenses .amount`).text(currencyFormat(cv.expenses))
            $(`.cv-widget-remaining .amount`).text(currencyFormat(cv.revenue - cv.expenses))
        })
    })
}

function expenseModalReset() {
    var modal = $('#modal_expense')

    //Textbox
    modal.find('#_modal_id').val('')
    modal.find('#_modal_date').val('')
    modal.find('#_modal_notes').val('')
    modal.find('#_modal_amount').val('0.00')

    modal.find('select option').eq(0).attr('selected', true)

    //Dropdowns
    modal.find('#_modal_account option').eq(0).attr('selected', true)
    modal.find('#_modal_category option').eq(0).attr('selected', true)
}

function calculateBudgetForDashboardWidgets() {
    socket.emit('get-project-all', '', callback => {
        var all_projects = JSON.parse(callback),
            current_year = $.format.date(new Date(), 'yyyy')

        cadencevisual = {
            expenses: 0,
            revenue: 0
        }

        var expenses = 0,
            revenue = 0,
            packages = 0,
            projects_this_year = 0

            $('.budget-widget-expenses .amount').text(currencyFormat(0))
            $('.budget-widget-revenue .amount').text(currencyFormat(0))

        for (var proj of all_projects) {
            var allocation = proj.allocation.allocation,
                proj_expense = 0,
                proj_profit = 0,
                received = 0

            if (proj.status.id !== 2) {

                if (proj.event_date == null && proj.inclusions.length == 1 && proj.inclusions[0].id == 'CVO002') {
                    proj.event_date = proj.pre_event_dates.start
                }

                for (var a of allocation) {
                    allocation = {
                        user: null,
                        value: 0
                    }
                    if (a.user === 'CVUSR000') {
                        allocation = a
                        break
                    }
                }

                for (var budg of proj.budget) {
                    if (budg.type == `cr`) {
                        proj_expense += budg.amount
                    } else if (budg.type == `dr`) {
                        received += budg.amount
                    }
                }

                if (new Date(proj.event_date) <= new Date() && proj.budget.length > 0) {
                    proj_profit += (proj.package - proj_expense)
                    cadencevisual.revenue += (proj_profit * (allocation.value / 100))
                }

                if ($.format.date(new Date(proj.event_date), 'yyyy') == current_year) {
                    if (received >= proj.package && new Date(proj.event_date) <= new Date()) {
                        revenue += proj_profit
                        expenses += proj_expense
                    }

                    projects_this_year++
                    packages += proj.package
                }
            }

            //$('.budget-widget-total .amount').text(currencyFormat(parseFloat(removeCurrencyFormat($('.budget-widget-total .amount').text())) + proj.package))
            $('.budget-widget-expenses .amount').text(currencyFormat(parseFloat(removeCurrencyFormat($('.budget-widget-expenses .amount').text())) + proj_expense))
            $('.budget-widget-revenue .amount').text(currencyFormat(parseFloat(removeCurrencyFormat($('.budget-widget-revenue .amount').text())) + proj_profit))

        }

        $(`.average-package .amount`).text(currencyFormat((packages > 0) ? Math.round((packages / projects_this_year)/1000)*1000 : 0))

        /*
        $(`.budget-widget-revenue .amount`).text(currencyFormat(revenue))
        $(`.budget-widget-expenses .amount`).text(currencyFormat(expenses))
        */



        socket.emit('get-cv-expenses', '', callback => {
            var expenses = JSON.parse(callback)

            for (var exp of expenses) {
                cadencevisual.expenses += exp.amount
            }
            $(`.cv-widget-expenses .amount`).text(currencyFormat(cadencevisual.expenses))
            $(`.cv-widget-remaining .amount`).text(currencyFormat(cadencevisual.revenue - cadencevisual.expenses))
        })
    })
}

var monthly_projects = {}

function alterProjectsBudgetTable(data, bool) {
    var statusbadge = `<h5 class="m-0 p-0"><span class="badge bg-${data.status.color} status" style="min-width: 80px;">${data.status.status}</span></h5>`
    if (data.title == null) {
        if (!data.direct) {
            data.title = '<p class="m-0 text-center">---</p>'
            for (var s of data.suppliers) {
                if (s.job.toUpperCase().includes('COORD')) {
                    var coord = `${s.name.split(' ')[0]} ${s.name.split(' ')[1]}`
                    data.title = `<p class="m-0" style="opacity: 0.4">[ ${coord} ]</p>`
                    break
                }
            }
        } else {
            data.title = `<span class="text-muted">[ CV ${data.status.status} Project ]</span>`
        }
    } else {
        if (data.type.type.toLowerCase() == 'debut') {
            data.title = `${data.title.split(' ')[0]} XVIII`
        }
    }

    var is_proj_done = isProjectDone(data)
    var expenses = 0
    for (var budget of data.budget) {
        if (budget.type == 'cr') {
            expenses += budget.amount
        }

        if (!desc_list.includes(budget.description) && budget.description !== '') {
            desc_list.push(budget.description)
        }
    }

    var manpower = []
    for (var man of data.manpower) {
        manpower.push(man.name)
    }

    var suppliers = []
    for (var supp of data.suppliers) {
        manpower.push(supp.name)
    }

    var eventdate, evmonth
    if (data.inclusions.length == 1 && data.inclusions[0].code == 'PEF' || data.inclusions.length == 2 && data.inclusions[0].code == 'STD') {
        eventdate = $.format.date(new Date(data.pre_event_dates.start), 'MMM dd, yyyy')
        evmonth = $.format.date(new Date(data.pre_event_dates.start), 'MMMM')
    } else {
        eventdate = (data.event_date == null) ? `---` : $.format.date(new Date(data.event_date), 'MMM dd, yyyy')
        evmonth = (data.event_date == null) ? `---` : $.format.date(new Date(data.event_date), 'MMMM')
    }

    if (data.direct) {
        data.title = `${data.title}&nbsp;&nbsp;<svg class="c-icon d-inline text-bold mb-1" style="width: 11px; height: 11px;"><use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-check-circle"></use></svg>`
    }

    var cadvis = {
        user: null,
        value: 0
    }

    var user_alloc = {
        user: null,
        value: 0
    }

    for (var a of data.allocation.allocation) {
        if (a.user === 'CVUSR000') {
            cadvis = a
        } else if (a.user === sessioned_user.id) {
            user_alloc = a
        }
    }


    var proj_exp = 0
    var received = 0
    for (var b of data.budget) {
        if (b.type === 'cr') {
            proj_exp += b.amount
        } else if (b.type === 'dr') {
            received += b.amount
        }
    }

    if (monthly_projects[`${$.format.date(new Date(data.event_date), 'MMMyy').toUpperCase()}`] == undefined) {
        monthly_projects[`${$.format.date(new Date(data.event_date), 'MMMyy').toUpperCase()}`] = {
            received: 0,
            expenses: 0,
            revenue: 0,
            count: 0,
            done: 0
        }
    } else {
        monthly_projects[`${$.format.date(new Date(data.event_date), 'MMMyy').toUpperCase()}`].received += received
        monthly_projects[`${$.format.date(new Date(data.event_date), 'MMMyy').toUpperCase()}`].expenses += proj_exp
        monthly_projects[`${$.format.date(new Date(data.event_date), 'MMMyy').toUpperCase()}`].revenue += (data.package - proj_exp)
        monthly_projects[`${$.format.date(new Date(data.event_date), 'MMMyy').toUpperCase()}`].count += 1

        if (received >= data.package) {
            monthly_projects[`${$.format.date(new Date(data.event_date), 'MMMyy').toUpperCase()}`].done += 1
        }
    }

    if (data.status.status.toLowerCase() !== 'cancelled') {
        if (received >= data.package) {
            data.title = `<div class="bg-success float-left my-2 mr-2" id="paid-marker"></div> ${data.title}`
        } else {
            data.title = `<div class="bg-warning float-left my-2 mr-2" id="paid-marker"></div> ${data.title}`
        }
    } else {
        data.title = `<div class="bg-danger float-left my-2 mr-2" id="paid-marker"></div> ${data.title}`
    }

    var proj_rev = (data.package - proj_exp)
    var user_profit = (proj_rev * (user_alloc.value / 100))

    if (is_proj_done == true || data.status.status.toLowerCase() == 'postponed') {
        user_profit = 0
    }


    var rev = 0

    if (data.status.status.toLowerCase() !== 'postponed') {
        if (is_proj_done == true) {
            rev = proj_rev
        }
    }

    $('.budget-widget-total .amount').text(currencyFormat(parseFloat(removeCurrencyFormat($('.budget-widget-total .amount').text())) + data.package))
    $('.budget-widget-expenses .amount').text(currencyFormat(parseFloat(removeCurrencyFormat($('.budget-widget-expenses .amount').text())) + proj_exp))
    $('.budget-widget-revenue .amount').text(currencyFormat(parseFloat(removeCurrencyFormat($('.budget-widget-revenue .amount').text())) + rev))

    var forecasted_profit = ((data.package - (monthly_projects[`${$.format.date(new Date(data.event_date), 'MMMyy').toUpperCase()}`].expenses / monthly_projects[`${$.format.date(new Date(data.event_date), 'MMMyy').toUpperCase()}`].done)) * (user_alloc.value / 100))

    var arraydata = [
            data.id,
            data.title,
            statusbadge,
            eventdate,
            `<span class="float-left ml-1">₱</span>&nbsp;&nbsp; ${currencyFormat(data.package)}`,
            `<span class="float-left ml-1">₱</span>&nbsp;&nbsp; ${currencyFormat(data.initial)}`,
            `<span class="text-danger"><span class="float-left ml-1">₱</span>&nbsp;&nbsp; ${currencyFormat(proj_exp)}</span>`,
            `<span class="text-success"><span class="float-left ml-1">₱</span>&nbsp;&nbsp; ${currencyFormat(rev)}</span>`,
            (data.lead !== null) ? `${data.lead.name.last}, ${data.lead.name.first}` : `---`,
            manpower.join(' / '),
            suppliers.join(' / '),
            `${(user_profit > 0) ? `<span class="text-success"><span class="float-left ml-1">₱</span>&nbsp;&nbsp; ${currencyFormat(user_profit)}</span>`: `<span class="float-left ml-1">₱</span>&nbsp;&nbsp; ${currencyFormat(forecasted_profit)}`}`,
            `${evmonth}`
    ]

    //bool = true for create; false for update
    if (bool) {
        projects_table.fnAddData(arraydata)
    } else {
        projects_table.fnUpdate(arraydata, projects_table.find(`tbody #${data.id.toLowerCase()}`))
    }
}