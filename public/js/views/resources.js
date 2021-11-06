var current_project,
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

var cadvis_expenses = {
    expenses: 0,
    revenue: 0,
    cv_allocation: 0
}

$(document).ready(function() {

    socket.emit('get-system-defaults', '', callback => {
        cvsystemdata = JSON.parse(callback)
    })

    socket.emit('get-resources', '', callback => {
        var resources = JSON.parse(callback)

        for (var accs of resources.accounts) {
            alterAccountsTable(accs)
        }

        for (var cats of resources.categories) {
            alterCategoriesTable(cats)
        }

        for (var drive of resources.drives) {
            alterStorageTable(drive)
        }

        for (var outp of resources.outputs) {
            alterOutputTable(outp)
        }

        for (var type of resources.types) {
            alterProjectTypesTable(type)
        }

        for (var allocation of resources.allocations) {
            alterAllocationsTable(allocation)
        }
    })

    $('#cv-accounts-table tbody').on('change', 'input, select', function() {
        saveChangesAccountsTable($(this).closest('tr'))
    })

    $('#cv-categories-table tbody').on('change', 'input', function() {
        saveChangesCategoriesTable($(this).closest('tr'))
    })

    $('#cv-storage-table tbody').on('change', 'input, select', function() {
        saveChangesStorageTable($(this).closest('tr'))
    })

    $('#cv-outputs-table tbody').on('change', 'input', function() {
        saveChangesOutputsTable($(this).closest('tr'))
    })

    $('#cv-project-types-table tbody').on('change', 'input', function() {
        saveChangesEventTypeTable($(this).closest('tr'))
    })

    $("#cv-allocations-table").find(`tbody`).delegate(`tr`, `click`, function() {
        var alloc_id = $(this).find('td').eq(0).text().trim()

        socket.emit('get-allocation', alloc_id, callback => {
            var allocation = JSON.parse(callback)
            previewAllocation(allocation)
        })
    })

    $("#modal_allocation_view .modal-body .card-body").delegate(`input[type="number"]`, `keyup`, function() {
        var perctotal = 0
        $('#modal_allocation_view .modal-body .card .card-body input.value').each(function() {
            var value = ($(this).val() == '') ? 0 : $(this).val()
            perctotal = perctotal + parseInt(value)
            $('.percentage-remaining').text(perctotal)
        })
    })

})

function saveChangesAccountsTable(tr) {
    var data = {
        id: tr.find('td').eq(0).find('input').val(),
        name: tr.find('td').eq(1).find('input').val(),
        type: tr.find('td').eq(2).find('select').val()
    }

    if (data.name != '') {
        socket.emit('resources-accounts-update', data, callback => {
            var response = JSON.parse(callback)

            if (response.success && response.action == 'inserted') {
                showToast('Success', response.message, 'success')
            }
        })
    }
}

function saveChangesCategoriesTable(tr) {
    var data = {
        id: tr.find('td').eq(0).find('input').val(),
        name: tr.find('td').eq(1).find('input').val()
    }

    if (data.name != '') {
        socket.emit('resources-categories-update', data, callback => {
            var response = JSON.parse(callback)

            if (response.success && response.action == 'inserted') {
                showToast('Success', response.message, 'success')
            }
        })
    }
}

function saveChangesStorageTable(tr) {
    var data = {
        id: tr.find('td').eq(0).find('input').val(),
        brand: tr.find('td').eq(1).find('input').val(),
        capacity: parseFloat(tr.find('td').eq(2).find('input').val()),
        type: tr.find('td').eq(3).find('select').val(),
        timestamp: $.format.date(new Date(), 'yyyy-MM-dd')
    }

    socket.emit('resources-storage-update', data, callback => {
        var response = JSON.parse(callback)

        if (response.success && response.action == 'inserted') {
            showToast('Success', response.message, 'success')
        }
    })
}

function saveChangesEventTypeTable(tr) {
    var data = {
        id: tr.find('td').eq(0).find('input').val(),
        type: tr.find('td').eq(1).find('input').val(),
    }

    socket.emit('resources-event-type-update', data, callback => {
        var response = JSON.parse(callback)

        if (response.success && response.action == 'inserted') {
            showToast('Success', response.message, 'success')
        }
    })
}

function saveChangesOutputsTable(tr) {
    var table = $('#cv-outputs-table')
    var duplicate = false
    var index = 0

    var data = {
        id: tr.find('td').eq(0).find('input').val(),
        code: tr.find('td').eq(1).find('input').val().toUpperCase(),
        description: tr.find('td').eq(2).find('input').val(),
        timestamp: $.format.date(new Date(), 'yyyy-MM-dd')
    }


    table.find('tbody tr').each(function() {
        if (index < table.find('tbody tr').length - 2) {
            var code = $(this).find('td').eq(1).find('input').val().toUpperCase()
            if (code == data.code) {
                duplicate = true
                return false
            }
        }
        index++
    })

    if (duplicate) {
        showToast('Error', `Code cannot be duplicated`, 'error')
    } else {
        socket.emit('resources-outputs-update', data, callback => {
            var response = JSON.parse(callback)
            if (response.success && response.action == 'inserted') {
                showToast('Success', response.message, 'success')
            }
        })
    }


}

function alterAccountsTable(data) {
    if (data.type == 'cr') {
        data.type = 'credit'
    } else if (data.type == 'dr') {
        data.type = 'debit'
    }

    var row = `
        <tr>
        <td align="center" class="px-0 py-2 pb-1">
            <input type="text" class="form-control-sm form-control-transparent" placeholder="System Generated No." value="${data.id}" readonly>
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm" type="text" list="descriptions" style="text-align: left!important;" placeholder="Enter Account Name" value="${data.name}">
        </td>
        <td class="p-2 pb-1">
            <div class="form-group mb-0">
                <select class="custom-select form-control form-control-sm form-control-transparent w-100" style="width: 100%!important;">
                    <option value="dr" ${(data.type == "debit") ? 'selected': ''}>Debit</option>
                    <option value="cr" ${(data.type == "credit") ? 'selected': ''}>Credit</option>
                </select>
            </div>
        </td>
        <td class="p-0" width="44px">
            <button class="btn btn-lg btn-danger no-b-radius p-2 h-100" onclick="removeRow(this)" style="width: 44px"><svg class="c-icon">
                <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg>
            </button>
        </td>
        </tr>
        `

    $('#cv-accounts-table tbody').append(row)
}

function alterCategoriesTable(data) {
    var row = `
        <tr>
        <td align="center" class="px-0 py-2 pb-1">
            <input type="text" class="form-control-sm form-control-transparent" placeholder="System Generated No." value="${data.id}" readonly>
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm" type="text" list="descriptions" style="text-align: left!important;" placeholder="Enter Category Name" value="${data.name}">
        </td>
        <td class="p-0" width="44px">
            <button class="btn btn-lg btn-danger no-b-radius p-2 h-100" onclick="removeRow(this)" style="width: 44px"><svg class="c-icon">
                <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg>
            </button>
        </td>
        </tr>
        `

    $('#cv-categories-table tbody').append(row)
}

function alterProjectTypesTable(data) {
    var row = `
        <tr>
        <td align="center" class="px-0 py-2 pb-1">
            <input type="text" class="form-control-sm form-control-transparent" placeholder="System Generated No." value="${data.id}" readonly>
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm" type="text" list="descriptions" style="text-align: left!important;" placeholder="Enter Name" value="${data.type}">
        </td>
        <td class="p-0" width="44px">
            <button class="btn btn-lg btn-danger no-b-radius p-2 h-100" onclick="removeRow(this)" style="width: 44px"><svg class="c-icon">
                <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg>
            </button>
        </td>
        </tr>
        `

    $('#cv-project-types-table tbody').append(row)
}

function alterAllocationsTable(data) {
    var allocations = []
    var names = []

    for (var alloc of data.allocation) {
        names.push(`<b>${alloc.user.name.first.split(' ')[0]}</b>`)
        allocations.push(`<b>${alloc.value}</b>%`)
    }

    var row = `
        <tr style="cursor: pointer;">
        <td align="center" class="px-0 py-2 pb-1">
            ${data.id}
        </td>
        <td class="p-2 pb-1 text-center">
            ${names.join(' / ')}
        </td>
        <td class="p-2 pb-1 text-center">
            ${allocations.join('&nbsp;&nbsp;/&nbsp;&nbsp;')}
        </td>
        <td class="p-2 pb-1 text-center">
            ${$.format.date(data.timestamp, 'dd MMM yy')}
        </td>
        </tr>
        `

    $('#cv-allocations-table tbody').append(row)
}

function alterStorageTable(data) {
    var row = `
        <tr>
        <td class="px-0 py-2 pb-1">
            <input type="text" class="form-control-sm form-control-transparent text-center" placeholder="System Generated No." value="${data.id}" readonly>
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm text-left" type="text" placeholder="Enter Brand Name" value="${data.brand}">
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm text-center" type="number" placeholder="Enter Capacity" value="${data.capacity}">
        </td>
        <td class="px-0 py-2 pb-1">
            <div class="form-group mb-0">
                <select class="custom-select form-control form-control-sm form-control-transparent w-100 text-center">
                    <option value="Regular" ${(data.type == "Regular") ? 'selected': ''}>Regular</option>
                    <option value="Mobile" ${(data.type == "Mobile") ? 'selected': ''}>Mobile</option>
                    <option value="External" ${(data.type == "External") ? 'selected': ''}>External</option>
                    <option value="Hub" ${(data.type == "Hub") ? 'selected': ''}>Hub</option>
                </select>
            </div>
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm" style="text-align: center!important;" value="${$.format.date(new Date(data.timestamp), 'dd MMM yy')}" readonly>
        </td>
        <td class="p-0" width="44px">
            <button class="btn btn-lg btn-danger no-b-radius p-2 h-100" onclick="removeRow(this)" style="width: 44px"><svg class="c-icon">
                <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg>
            </button>
        </td>
        </tr>
        `

    $('#cv-storage-table tbody').append(row)
}

function alterOutputTable(data) {
    var row = `
        <tr>
        <td class="p-2 pb-1">
            <input type="text" class="form-control-sm form-control-transparent text-center" placeholder="System Generated No." value="${data.id}" readonly>
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm text-left text-uppercase" type="text" maxlength="3" placeholder="Enter Code" value="${data.code}">
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm text-left" type="text" placeholder="Enter Description" value="${data.description}">
        </td>
        <td class="p-0" width="44px">
            <button class="btn btn-lg btn-danger no-b-radius p-2 h-100" onclick="removeRow(this)" style="width: 44px"><svg class="c-icon">
                <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg>
            </button>
        </td>
        </tr>
        `

    $('#cv-outputs-table tbody').append(row)
}

function deleteAccount(tr) {
    var data = {
        id: tr.find('td').eq(0).find('input').val(),
        name: tr.find('td').eq(1).find('input').val(),
        type: tr.find('td').eq(2).find('select').val()
    }

    socket.emit('delete-expense-account', data, callback => {
        var response = JSON.parse(callback)
        if (response.success) {
            showToast('Success', response.message, 'success')
        }
    })
}

function deleteStorage(tr) {
    var data = {
        id: tr.find('td').eq(0).find('input').val(),
        name: tr.find('td').eq(1).find('input').val(),
        type: tr.find('td').eq(3).find('select').val()
    }

    socket.emit('delete-storage-drive', data, callback => {
        var response = JSON.parse(callback)
        if (response.success) {
            showToast('Success', response.message, 'success')
        }
    })
}

function deleteCategory(tr) {
    var data = {
        id: tr.find('td').eq(0).find('input').val(),
        name: tr.find('td').eq(1).find('input').val(),
        type: tr.find('td').eq(2).find('select').val()
    }

    socket.emit('delete-expense-category', data, callback => {
        var response = JSON.parse(callback)
        if (response.success) {
            showToast('Success', response.message, 'success')
        }
    })
}

function deleteOutput(tr) {
    var data = {
        id: tr.find('td').eq(0).find('input').val(),
        code: tr.find('td').eq(1).find('input').val().toUpperCase(),
        description: tr.find('td').eq(2).find('input').val()
    }

    socket.emit('delete-cv-output', data, callback => {
        var response = JSON.parse(callback)
        if (response.success) {
            showToast('Success', response.message, 'success')
        }
    })
}

function deleteEventType(tr) {
    var data = {
        id: tr.find('td').eq(0).find('input').val(),
        type: tr.find('td').eq(1).find('input').val()
    }

    socket.emit('delete-cv-event-type', data, callback => {
        var response = JSON.parse(callback)
        if (response.success) {
            showToast('Success', response.message, 'success')
        }
    })
}


function removeRow(element) {
    if ($(element).closest('.table').attr('id').toLowerCase() == 'cv-accounts-table') {
        deleteAccount($(element).closest('tr'))
    } else if ($(element).closest('.table').attr('id').toLowerCase() == 'cv-categories-table') {
        deleteCategory($(element).closest('tr'))
    } else if ($(element).closest('.table').attr('id').toLowerCase() == 'cv-storage-table') {
        deleteStorage($(element).closest('tr'))
    } else if ($(element).closest('.table').attr('id').toLowerCase() == 'cv-outputs-table') {
        deleteOutput($(element).closest('tr'))
    } else if ($(element).closest('.table').attr('id').toLowerCase() == 'cv-project-types-table') {
        deleteEventType($(element).closest('tr'))
    }

    $(element).closest('tr').remove()
}

function addResourcesStorageRow(element) {
    var card = $(element).closest('.card')
    var default_id

    if (card.find('table tbody tr td').eq(0).length > 0) {
        default_id = card.find('table tbody tr').eq(card.find('table tbody tr').length - 1).find('td input').val()
    } else {
        default_id = `CVDRV0000`
    }


    var row = `
        <tr>
        <td align="center" class="px-0 py-2 pb-1">
            <input type="text" class="form-control-sm form-control-transparent text-center" placeholder="System Generated No." value="${incrementStringID(default_id, 5, 4)}" readonly>
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm text-left" type="text" placeholder="Enter Brand Name">
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm text-center" type="number" placeholder="Enter Capacity" value="1000">
        </td>
        <td class="px-0 py-2 pb-1">
            <div class="form-group mb-0">
                <select class="custom-select form-control form-control-sm form-control-transparent w-100 text-center">
                    <option value="Regular">Regular</option>
                    <option value="Mobile">Mobile</option>
                    <option value="External">External</option>
                    <option value="Hub">Hub</option>
                </select>
            </div>
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm text-center" value="${$.format.date(new Date(), 'dd MMM yy')}" readonly>
        </td>
        <td class="p-0" width="44px">
            <button class="btn btn-lg btn-danger no-b-radius p-2 h-100" onclick="removeRow(this)" style="width: 44px"><svg class="c-icon">
                <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg>
            </button>
        </td>
        </tr>
        `

    card.find('table tbody').append(row)
}

function addResourcesCategoryRow(element) {
    var card = $(element).closest('.card')
    var default_id

    if (card.find('table tbody tr td').eq(0).length > 0) {
        default_id = card.find('table tbody tr').eq(card.find('table tbody tr').length - 1).find('td input').val()
    } else {
        default_id = `CVCAT0000`
    }


    var row = `
        <tr>
        <td align="center" class="px-0 py-2 pb-1">
            <input type="text" class="form-control-sm form-control-transparent" placeholder="System Generated No." value="${incrementStringID(default_id, 5, 4)}" readonly>
        </td>
        <td class="p-2 pb-1" texteditable="true">
            <input class="form-control-transparent form-control-sm" type="text" style="text-align: left!important;" placeholder="Enter Category Name">
        </td>
        <td class="p-0" width="44px">
            <button class="btn btn-lg btn-danger no-b-radius p-2 h-100" onclick="removeRow(this)" style="width: 44px"><svg class="c-icon">
                <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg>
            </button>
        </td>
        </tr>
        `

    card.find('table tbody').append(row)
}

function addResourcesProjectTypesRow(element) {
    var card = $(element).closest('.card')
    var default_id

    if (card.find('table tbody tr td').eq(0).length > 0) {
        default_id = card.find('table tbody tr').eq(card.find('table tbody tr').length - 1).find('td input').val()
    } else {
        default_id = `CVE00`
    }


    var row = `
        <tr>
            <td align="center" class="px-0 py-2 pb-1">
                <input type="text" class="form-control-sm form-control-transparent" placeholder="System Generated No." value="${incrementStringID(default_id, 3, 2)}" readonly>
            </td>
            <td class="p-2 pb-1">
                <input class="form-control-transparent form-control-sm" type="text" list="descriptions" style="text-align: left!important;" placeholder="Enter Event Type">
            </td>
            <td class="p-0" width="44px">
                <button class="btn btn-lg btn-danger no-b-radius p-2 h-100" onclick="removeRow(this)" style="width: 44px"><svg class="c-icon">
                    <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg>
                </button>
            </td>
        </tr>
        `

    card.find('table tbody').append(row)
}


function addResourcesAccountRow(element) {
    var card = $(element).closest('.card')
    var default_id

    if (card.find('table tbody tr td').eq(0).length > 0) {
        default_id = card.find('table tbody tr').eq(card.find('table tbody tr').length - 1).find('td input').val()
    } else {
        default_id = `CVACC0000`
    }


    var row = `
        <tr>
        <td align="center" class="px-0 py-2 pb-1">
            <input type="text" class="form-control-sm form-control-transparent" placeholder="System Generated No." value="${incrementStringID(default_id, 5, 4)}" readonly>
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm" type="text" style="text-align: left!important;" placeholder="Enter Account Name">
        </td>
        <td class="p-2 pb-1">
            <div class="form-group mb-0">
                <select class="custom-select form-control form-control-sm form-control-transparent w-100" style="width: 100%!important;">
                    <option value="dr">Debit</option>
                    <option value="cr">Credit</option>
                </select>
            </div>
        </td>
        <td class="p-0" width="44px">
            <button class="btn btn-lg btn-danger no-b-radius p-2 h-100" onclick="removeRow(this)" style="width: 44px"><svg class="c-icon">
                <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg>
            </button>
        </td>
        </tr>
        `

    card.find('table tbody').append(row)
}

function addResourcesOutputRow(element) {
    var card = $(element).closest('.card')
    var default_id

    if (card.find('table tbody tr td').eq(0).length > 0) {
        default_id = card.find('table tbody tr').eq(card.find('table tbody tr').length - 1).find('td').eq(0).find('input').val()
    } else {
        default_id = `CVO000`
    }


    var row = `
        <tr>
        <td class="p-2 pb-1">
            <input type="text" class="form-control-sm form-control-transparent text-center" placeholder="System Generated No." value="${incrementStringID(default_id, 3, 3)}" readonly>
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm text-left text-uppercase" type="text" maxlength="3" placeholder="Enter Code">
        </td>
        <td class="p-2 pb-1">
            <input class="form-control-transparent form-control-sm text-left" type="text" placeholder="Enter Description">
        </td>
        <td class="p-0" width="44px">
            <button class="btn btn-lg btn-danger no-b-radius p-2 h-100" onclick="removeRow(this)" style="width: 44px"><svg class="c-icon">
                <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg>
            </button>
        </td>
        </tr>
        `

    card.find('table tbody').append(row)
}

function clearAllocationModal() {
    $('#modal_allocation_view .modal-body #created').val('')
    $('#modal_allocation_view .modal-body #visibility').val('')
    $('#modal_allocation_view .modal-body .card .card-body .form-row').remove()
}

function appendAllocationModalRow(objdata) {
    var options = ''
    $('#modal_allocation_view .percentage-remaining').text(parseInt($('#modal_allocation_view .percentage-remaining').text()) - objdata.value)

    for (var user of cvsystemdata.users) {
        options += `<option value="${user.id}" ${(user.id == objdata.user) ? 'selected': ''}>${user.name.first}</option>`
    }

    var row = `
    <div class="form-row">
        <div class="form-group col-8">
            <div class="controls">
                <div class="input-prepend input-group">
                    <div class="input-group-prepend"><span class="input-group-text"><svg class="c-icon">
                    <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-user"></use>
                  </svg></span></div>
                    <select class="custom-select form-control user">
                        ${options}
                    </select>
                </div>
            </div>
        </div>
        
        <div class="form-group col-3">
            <div class="controls">
                <div class="input-group">
                <input type="number" class="form-control value" size="16" placeholder="Value" value="${objdata.value}" min="0" max="100">
                    <div class="input-group-append"><span class="input-group-text">%</span></div>
                </div>
            </div>
        </div>

        <div class="form-group col-1">
            <button class="btn btn-danger w-100" onclick="$(this).closest('.form-row').remove()">
                <svg class="c-icon">
                    <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use>
                </svg>
            </button>
        </div>
    </div>
    `
    $('#modal_allocation_view .modal-body .card .card-body').append(row)
}

function addAllocationModalRow() {
    var options = ''

    for (var user of cvsystemdata.users) {
        options += `<option value="${user.id}">${user.name.first}</option>`
    }

    var row = `
    <div class="form-row">
        <div class="form-group col-8">
            <div class="controls">
                <div class="input-prepend input-group">
                    <div class="input-group-prepend"><span class="input-group-text"><svg class="c-icon">
                    <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-user"></use>
                  </svg></span></div>
                    <select class="custom-select form-control user">
                        ${options}
                    </select>
                </div>
            </div>
        </div>
        
        <div class="form-group col-3">
            <div class="controls">
                <div class="input-group">
                <input type="number" class="form-control value" size="16" placeholder="Value" min="0" max="100">
                    <div class="input-group-append"><span class="input-group-text">%</span></div>
                </div>
            </div>
        </div>

        <div class="form-group col-1">
            <button class="btn btn-danger w-100" onclick="$(this).closest('.form-row').remove()">
                <svg class="c-icon">
                    <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use>
                </svg>
            </button>
        </div>
    </div>
    `
    $('#modal_allocation_view .modal-body .card .card-body').append(row)
}

function addNewAllocation() {
    clearAllocationModal()
    addAllocationModalRow()
    $('#modal_allocation_view .modal-title').text(`Add New Allocation`)
    $('#modal_allocation_view .percentage-remaining').text(0)
    $('#modal_allocation_view .modal-body #created').val($.format.date(new Date(), 'yyyy-MM-dd'))
    $('#modal_allocation_view').modal('show')
}

function previewAllocation(allocation) {
    clearAllocationModal()
    $('#modal_allocation_view .modal-title').text(`Allocation No. ${allocation.id}`)
    $('#modal_allocation_view .modal-body #created').val($.format.date(new Date(allocation.timestamp), 'yyyy-MM-dd'))
    $('#modal_allocation_view .modal-body #visibility').val((allocation.visible) ? 't' : 'f')

    var perctotal = 0
    for (var ua of allocation.allocation) {
        appendAllocationModalRow(ua)
        perctotal += ua.value
    }
    $('#modal_allocation_view .percentage-remaining').text(perctotal)
    $('#modal_allocation_view').modal('show')
}