var order = [4, 'desc']

if (page == 'Projects/All') {
    order = [0, 'desc']
} else if (page == 'Projects/Current') {
    order = [4, 'asc']
}
var groupColumn = 4

var projects_table = null

if (page == `Projects/Monthly`) {
    projects_table = $('#projects_table_monthly').dataTable({
                paging: false,
                ordering: true,
                info: true,
                searching: false,
                bAutoWidth: false,
                lengthChange: false,
                responsive: {
                    details: false
                },
                columnDefs: [{
                    type: 'date-str',
                    targets: 4
                }, {
                    targets: [2, 7, 9, 10, 11, 12, 13, 14],
                    visible: false,
                    searchable: true
                }, {
                    orderable: false,
                    targets: [0, 1, 2, 3, 5, 6, 7, 8, 9, 10]
                }],
                order: [
                    order
                ],
                fnRowCallback: function(nRow, aData, iDisplayIndex) {
                    nRow.setAttribute('id', aData[0].toLowerCase())
                    nRow.setAttribute('row', 'data')
                },
                drawCallback: function(settings) {
                        var api = this.api();
                        var rows = api.rows({
                            page: 'current'
                        }).nodes();
                        var last = null;

                        var row_count = 1
                        var current_group = -1
                        api.column(groupColumn, {
                                page: 'current'
                            }).data().each(function(group, i) {
                                    var new_last = (last !== null) ? `${last.split(' ')[0]} ${last.split(' ')[2]}` : null
                                    var new_group = (group !== '---') ? `${group.split(' ')[0]} ${group.split(' ')[2]}` : group
                                    if (new_last !== new_group) {
                                        row_count = 1
                                        $(rows).eq(i).before(
                                                `<tr class="group row-disabled bg-secondary"><td colspan="${$('#projects_table_monthly thead th').length}" class="text-uppercase text-center"><h5 class="m-2 my-3"><span style="letter-spacing: 5px;">${(new_group !== '---') ? `${$.format.date(new Date(new_group), 'MMMM yyyy')}`: `Unspecified`}</span> (<span class="row-count"></span>)</h5></td></tr>`
                    )
                    last = group
                    current_group++
                } else {
                    row_count++
                }
                $('#projects_table_monthly tbody tr.group').eq(current_group).find(`.row-count`).text(row_count)
            })
        }
    })
} else if (page == `Projects/Yearly`) {
    projects_table = $('#projects_table_yearly').dataTable({
                paging: false,
                ordering: true,
                info: true,
                searching: false,
                lengthChange: false,
                bAutoWidth: false,
                responsive: {
                    details: false
                },
                columnDefs: [{
                    type: 'date-str',
                    targets: 4
                }, {
                    targets: [2, 7, 9, 10, 11, 12, 13, 14],
                    visible: false,
                    searchable: true
                }, {
                    orderable: false,
                    targets: [0, 1, 2, 3, 5, 6, 7, 8, 9, 10]
                }],
                order: [
                    order
                ],
                fnRowCallback: function(nRow, aData, iDisplayIndex) {
                    nRow.setAttribute('id', aData[0].toLowerCase())
                    nRow.setAttribute('row', 'data')
                },
                drawCallback: function(settings) {
                        var api = this.api();
                        var rows = api.rows({
                            page: 'current'
                        }).nodes();
                        var last = null;

                        var row_count = 1
                        var current_group = -1
                        api.column(groupColumn, {
                                page: 'current'
                            }).data().each(function(group, i) {
                                    var new_last = (last !== null) ? `${last.split(' ')[2]}` : null
                                    var new_group = (group !== '---') ? `${group.split(' ')[2]}` : group
                                    if (new_last !== new_group) {
                                        row_count = 1
                                        $(rows).eq(i).before(
                                                `<tr class="group row-disabled bg-secondary"><td colspan="${$('#projects_table_yearly thead th').length}" class="text-uppercase text-center"><h5 class="m-2 my-3"><span style="letter-spacing: 5px;">${(new_group !== '---') ? `${$.format.date(new Date(new_group), 'yyyy')}`: `Unspecified`}</span> (<span class="row-count"></span>)</h5></td></tr>`
                    );
                    last = group
                    current_group++
                } else {
                    row_count++
                }
                $('#projects_table_yearly tbody tr.group').eq(current_group).find(`.row-count`).text(row_count)
            });
        }
    })
} else {
    projects_table = $('#projects_table')
        .dataTable({
            paging: false,
            ordering: true,
            info: true,
            lengthChange: false,
            bAutoWidth: false,
            responsive: {
                details: false
            },
            columnDefs: [{
                type: 'date-str',
                targets: 4
            }, {
                targets: [2, 7, 9, 10, 11, 12, 13, 14],
                visible: false,
                searchable: true
            }, {
                orderable: false,
                targets: [3, 6, 8]
            }],
            order: [
                order
            ],
            fnRowCallback: function(nRow, aData, iDisplayIndex) {
                nRow.setAttribute('id', aData[0].toLowerCase())
                nRow.setAttribute('row', 'data')
            }
        })
}




/*
█░░ █▀▀█ █▀▀█ █▀▀▄
█░░ █░░█ █▄▄█ █░░█
▀▀▀ ▀▀▀▀ ▀░░▀ ▀▀▀░
*/


$(document).ready(function() {
    projects_table.attr('style', 'border-collapse: collapse !important')
    modifySearchbar()
    getProjects()


    /*
    █▀▀ ▀█░█▀ █▀▀ █▀▀▄ ▀▀█▀▀ █▀▀
    █▀▀ ░█▄█░ █▀▀ █░░█ ░░█░░ ▀▀█
    ▀▀▀ ░░▀░░ ▀▀▀ ▀░░▀ ░░▀░░ ▀▀▀
    */

    projects_table.find(`tbody`).delegate(`tr[row="data"]`, `click`, function() {
        var proj_id = $(this).find('td').eq(0).text()
        previewProject(proj_id)
    })

    $('#modal_projview').on('hidden.bs.modal', function() {
        projectModalReset($('#modal_projview'))
    })

    $('#projects_table_filter, .projects-table input').on('keyup blur clear', 'input', function() {
        loadWidgetsData()
    })
})





/*
█▀▀ █▀▀█ █▀▀ █░█ █▀▀ ▀▀█▀▀ █▀▀
▀▀█ █░░█ █░░ █▀▄ █▀▀ ░░█░░ ▀▀█
▀▀▀ ▀▀▀▀ ▀▀▀ ▀░▀ ▀▀▀ ░░▀░░ ▀▀▀
*/

socket.on('project-inserted', function(jsondata) {
    var proj = JSON.parse(jsondata)
    if (page == 'Projects/Current') {
        var status = proj.status.status.toLowerCase()
        if (status !== 'submitted' && status !== 'done' && status !== 'cancelled') {
            alterProjectsTable(proj, true)
        }
    } else {
        alterProjectsTable(proj, true)
    }

    countProjects()
    reloadModalDatalists()
    loadWidgetsData()
})

socket.on('project-updated', function(jsondata) {
    var proj = JSON.parse(jsondata)
    var status = proj.status.status.toLowerCase()
    if (page == 'Projects/Current') {
        if (status == 'submitted' || status == 'done' || status == 'cancelled') {
            projects_table.fnDeleteRow(projects_table.find(`#${proj.id.toLowerCase()}`))

            if ($(`#modal_projview`).hasClass('show') && $(`#modal_projview .modal-title`).text().includes(proj.id)) {
                $(`#modal_projview`).modal('hide')
            }
        } else {
            if (projects_table.find(`#${proj.id.toLowerCase()}`).length > 0) {
                alterProjectsTable(proj, false)
            } else {
                alterProjectsTable(proj, true)
            }
        }
    } else {
        alterProjectsTable(proj, false)
    }

    if ($(`#modal_projview`).hasClass('show') && $(`#modal_projview .modal-title`).text().includes(proj.id)) {
        previewProject(proj.id)
    }

    reloadModalDatalists()
    loadWidgetsData()
    countProjects()
})

socket.on('project-deleted', function(jsondata) {
    var proj = JSON.parse(jsondata)
    projects_table.fnDeleteRow(projects_table.find(`#${proj.id.toLowerCase()}`))

    if ($(`#modal_projview`).hasClass('show') && $(`#modal_projview .modal-title`).text().includes(proj.id)) {
        $(`#modal_projview`).modal('hide')
    }

    reloadModalDatalists()
    loadWidgetsData()
    countProjects()
})

function loadWidgetsData() {
    var table = $(`table`)
    var rows = table.find("tbody tr[row=\"data\"]")
    var projects = {
        total: 0,
        submitted: 0,
        cancelled: 0,
        postponed: 0,
        pending: 0,
        active: 0,
        upcoming: 0,
        done: 0,
        tentative: 0,
        ready: 0,
        all: 0
    }
    rows.each(function() {
        var cell = $(this).find('td').eq(4).find('h5 span.badge').text().trim().toLowerCase()
        if (cell !== 'tentative') {
            projects.total++
        }
        if (cell === 'submitted' || cell === 'done') {
            projects.submitted++
        }
        if (cell === 'cancelled') {
            projects.cancelled++
        }
        if (cell === 'postponed') {
            projects.postponed++
        }
        if (cell === 'ready') {
            projects.ready++
        }
        if (cell === 'pending') {
            projects.pending++
        }
        if (cell === 'active') {
            projects.active++
        }
        if (cell === 'confirmed') {
            projects.upcoming++
        }

        projects.all++
    })

    $('#projs-widget-total > div > h3').text(projects.total)
    $('#projs-widget-pending > div > h3').text(projects.pending)
    $('#projs-widget-cancelled > div > h3').text(projects.cancelled)
    $('#projs-widget-submitted > div > h3').text(projects.submitted)
    $('#projs-widget-active > div > h3').text(projects.active)
    $('#projs-widget-upcoming > div > h3').text(projects.upcoming)
    $('#projs-widget-ready > div > h3').text(projects.ready)
    $('#projs-widget-tentative > div > h3').text(projects.postponed)
    $('#projs-total').text(projects.all)
}




/*
█▀▀█ █▀▀ ▀▀█▀▀ █▀▀█ ░▀░ █▀▀ ▀█░█▀ █▀▀
█▄▄▀ █▀▀ ░░█░░ █▄▄▀ ▀█▀ █▀▀ ░█▄█░ █▀▀
▀░▀▀ ▀▀▀ ░░▀░░ ▀░▀▀ ▀▀▀ ▀▀▀ ░░▀░░ ▀▀▀
*/


function alterProjectsTable(data, bool) {
    var pre_event_dates
    if (!data.pre_event_dates.workcation) {
        pre_event_dates = (data.pre_event_dates.start !== null) ? $.format.date(new Date(data.pre_event_dates.start), 'MMM dd, yyyy') : '---'
    } else {
        if ($.format.date(new Date(data.pre_event_dates.start), 'MMM') == $.format.date(new Date(data.pre_event_dates.end), 'MMM')) {
            pre_event_dates = `${$.format.date(new Date(data.pre_event_dates.start), 'MMM d')}-${$.format.date(new Date(data.pre_event_dates.end), 'd, yyyy')}`
        } else {
            pre_event_dates = `${$.format.date(new Date(data.pre_event_dates.start), 'MMM d')}-${$.format.date(new Date(data.pre_event_dates.end), 'MMM d, yyyy')}`
        }

    }

    var inclusions = []
    for (var inc of data.inclusions) {
        var desc = inc.description.toLowerCase()
        if (!desc.includes('aerial') && !desc.includes('drone')) {
            if (data.type.type == 'Wedding') {
                if (desc.includes('pre') || desc.includes('full')) {
                    inc.code = inc.code.replace('E', 'W')
                } else if (inc.code == 'EVF') {
                    inc.code = inc.code.replace('EV', 'WD')
                }
            } else if (data.type.type == 'Debut') {
                if (inc.code == 'PEF' || inc.code == 'FED') {
                    inc.code = inc.code.replace('E', 'D')
                } else if (inc.code == 'EVF') {
                    inc.code = inc.code.replace('EV', 'DB')
                }
            }

            if (inc.done) {
                inc.code = `<b>${inc.code}</b>`
            } else {
                inc.code = `<b class="text-danger">${inc.code}</b>`
            }
            inclusions.push(inc.code)
        }

    }

    var manpower = []
    for (var man of data.manpower) {
        manpower.push(`f/${man.name}`)
    }

    var suppliers = []
    var coordinator = null
    for (var supp of data.suppliers) {
        if (supp.job.toUpperCase().includes('PHOTOG')) {
            suppliers.push(`p/${supp.name}`)
        } else if (supp.job.toUpperCase().includes('COORD')) {
            suppliers.push(`c/${supp.name}`)
            if(!data.direct){
                coordinator = supp
            }
        }
    }

    var evdate = data.event_date

    if (evdate == null && inclusions.length === 1 && (inclusions[0].includes('PWF') || inclusions[0].includes('PEF') || inclusions[0].includes('PDF'))) {
        evdate = $.format.date(new Date(data.pre_event_dates.start), 'MMM dd, yyyy')
    } else {
        evdate = (data.event_date !== null) ? $.format.date(new Date(data.event_date), 'MMM dd, yyyy') : '---'
    }

    inclusions = (inclusions.length > 0) ? inclusions.join('<b> / </b>') : '---'

    if (data.title == null) {
        if (!data.direct) {
            data.title = '<p class="m-0 text-center">---</p>'
            for (var s of data.suppliers) {
                if (s.job.toUpperCase().includes('COORD')) {
                    data.title = `<span class="font-italic font-weight-bold text-muted">[ ${s.name.split(' ')[0].toUpperCase()} ${s.name.split(' ')[1].toUpperCase()} ]</span>`
                    break
                }
            }
        } else {
            data.title = `<span class="text-muted">[ CV Direct Project ]</span>`
        }
    } else {
        if (data.type.type.toLowerCase() == 'debut') {
            data.title = `${data.title.split(' ')[0]} XVIII`
        }
    }

    var paid = `unpaid`
    var proj_rev = 0
    for(var b of data.budget){
        if(b.type == 'dr'){
            proj_rev += b.amount
        }
    }

    if(proj_rev >= data.package){
        paid = `paid`
    }

    if (data.direct) {
        data.title = `${data.title}&nbsp;&nbsp;<svg class="c-icon d-inline my-2" style="width: 12px; height: 12px;"><use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-check-circle"></use></svg>`
    }
    var statusbadge = `<h5 class="mt-1 mb-2"><span class="badge bg-${data.status.color} status" style="min-width: 80px;">${data.status.status}</span></h5>`

    var arraydata = [
        data.id,
        data.title,
        data.type.type,
        pre_event_dates,
        evdate,
        statusbadge,
        inclusions,
        (data.drive == null) ? '---' : data.drive,
        `<span class="float-left ml-1">₱</span>&nbsp;&nbsp; ${currencyFormat(data.package)}`,
        (data.lead == null) ? 'Unmanaged' : `${data.lead.name.first} ${data.lead.name.last}`,
        manpower.join(' / '),
        suppliers.join(' / '),
        (data.direct) ? 'direct' : (coordinator !== null) ? 'indirect': 'uncoordinated',
        (data.location == null) ? 'No Location' : data.location,
        `${data.notes} / ${paid} / ${$.format.date(new Date(data.event_date), 'MMMM')}`
    ]

    //bool = true for create; false for update
    if (bool) {
        projects_table.fnAddData(arraydata)
    } else {
        projects_table.fnUpdate(arraydata, projects_table.find(`tbody tr#${ data.id.toLowerCase() }`))
    }

    loadWidgetsData()
}

function getProjects() {
    if (page == 'Projects/All' || page == 'Projects/Monthly' || page == 'Projects/Yearly') {
        socket.emit('get-project-all', '', callback => {
            var projects = JSON.parse(callback)

            if (page == `Projects/All`) {
                for (var proj of projects) {
                    alterProjectsTable(proj, true)
                }
            } else if (page == `Projects/Monthly` || page == `Projects/Yearly`) {
                for (var proj of projects) {
                    if (proj.status.status.toLowerCase() !== `cancelled`) {
                        alterProjectsTable(proj, true)
                    }
                }
            }
        })
    } else {
        socket.emit('get-project-current', '', callback => {
            var projects = JSON.parse(callback)

            for (var proj of projects) {
                alterProjectsTable(proj, true)
            }
        })
    }
}





/*
█▀▀ █░░█ █▀▀▄ █▀▀ ▀▀█▀▀ ░▀░ █▀▀█ █▀▀▄ █▀▀
█▀▀ █░░█ █░░█ █░░ ░░█░░ ▀█▀ █░░█ █░░█ ▀▀█
▀░░ ░▀▀▀ ▀░░▀ ▀▀▀ ░░▀░░ ▀▀▀ ▀▀▀▀ ▀░░▀ ▀▀▀
*/

function changeSelectValue(el) {
    var e = $(el)
    var selected = e.find('option').attr('selected')
    e.closest('div').find('input').val(selected)
}

function modifySearchbar() {
    var search_input = $('.dataTables_filter').find('input')
    var search_label = $('.dataTables_filter').find('label')
    search_input.attr('placeholder', 'Search Everything')
    search_input.addClass('mb-3')
    $('.dataTables_filter').append(search_input)
    search_label.remove()
}