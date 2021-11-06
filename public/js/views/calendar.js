$(document).ready(function() {
    reloadEvents()

    $(document).keyup(function(event) {
        var key = event.which || event.keyCode;
        //alert(key)
        if (!$(`#modal_projview`).hasClass('show') && !$(`#_modal_add_personal_schedule`).hasClass('show')) {
            if (key == 37) {
                $(`.fc-prev-button`).click()
                recountEvents()
            } else if (key == 39) {
                $(`.fc-next-button`).click()
                recountEvents()
            }
        }

    })

    $('.fc-button').on('click', function() {
        recountEvents()
    })

    $(`#select_supplier_name`).on('change', function() {
        reloadEvents()
        $(this).blur()
    })

    $(`#select_supplier_type`).on('change', function() {
        reloadSupplierInputs()
        $(this).blur()
    })
})



socket.on('project-inserted', function(jsondata) {
    reloadEvents()
})

socket.on('project-updated', function(jsondata) {
    reloadEvents()
})

socket.on('project-deleted', function(jsondata) {
    reloadEvents()
})

socket.on('user-schedule-inserted', function(data) {
    reloadEvents()
    recountEvents()
})
socket.on('user-schedule-updated', function(data) {
    reloadEvents()
    recountEvents()
})
socket.on('user-schedule-deleted', function(data) {
    reloadEvents()
    recountEvents()
})


function initSupplierTitle() {
    $('#title-supplier-name').text($(`#select_supplier_name #opt-${$(`#select_supplier_name`).val()}`)[0].innerText)
}

function systemReload() {
    socket.emit('get-system-defaults', '', callback => {
        cvsystemdata = JSON.parse(callback)

        var job_categories = []
        var fields = []
        $(`#select_supplier_type option`).remove()

        for (var job of cvsystemdata.datalists.suppliers.jobs) {
            job = (job.toLowerCase().includes('photog')) ? `Photographer` : (job.toLowerCase().includes('coord')) ? `Coordinator` : ``
            field = (job.toLowerCase().includes('photog')) ? `Photography` : (job.toLowerCase().includes('coord')) ? `Coordination` : ``
            if (!job_categories.includes(job)) {
                job_categories.push(job)
                fields.push(field)
            }
        }

        job_categories.sort()
        if (job_categories.length > 0) {
            $('.supplier-input').find('input, select').removeAttr('disabled')
            $('.supplier-input').find('a').removeClass('disabled')

            for (var job in job_categories) {
                var j = job_categories[job]
                var f = fields[job]
                $(`#select_supplier_type`).append(`<option value="${j}">${f}</option>`)
            }
        } else {
            $('.supplier-input').find('input, select').attr('disabled', true)
            $('.supplier-input').find('a').addClass('disabled')
        }

        reloadSupplierInputs()
    })
}

function projQuickPreview(id) {
    var modal = $('#_modal_proj_quickview')
    var mbody = modal.find('.modal-body')

    socket.emit('get-project', id, callback => {
                var proj = JSON.parse(callback)
                var inclusions = ''
                var coordinator = null
                var dp = {
                    amount: 0
                }

                var received = 0
                var rembal = {
                    amount: 0
                }

                var suppliers = ''

                for (var i of proj.inclusions) {
                    i.description = i.description.replace('Event', proj.type.type)
                    i.code = i.code.replace('E', proj.type.type.split('')[0])
                    if (!i.description.toLowerCase().includes('aerial') && !i.description.toLowerCase().includes('drone'))
                        inclusions += `<b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;${i.description}</b><br />`
                }

                for (var s of proj.suppliers) {
                    if (s.job.toLowerCase().includes('coord')) {
                        coordinator = s
                    }
                    suppliers += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${s.job}&nbsp;:&nbsp;<b>${s.name}</b><br />`
                }

                for (var b of proj.budget) {
                    if (b.type == 'debit' && b.description.toLowerCase().includes('down pay')) {
                        dp = b
                    }
                    if (b.type == 'debit') {
                        received += b.amount
                    }
                    if (b.type == 'debit' && b.description.toLowerCase().includes('remaining')) {
                        rembal = b
                    }
                }

                modal.find('.modal-title').html((proj.title == null) ? (proj.direct) ? 'Untitled Project' : (coordinator == null) ? 'Untitled Project' : `[ ${coordinator.name} ]` : proj.title)
                modal.find('.modal-title').append(` <b>(${proj.type.type})</b>`)
                modal.find('.modal-header #project-date-created').text($.format.date(new Date(proj.date_created), 'dd MMM yyyy hh:mm a'))
                mbody.html(`
<div>
<div class="row">
    <div class="col-12 col-md-6">Date of Event : <b>${(proj.event_date !== null) ? $.format.date(proj.event_date, 'dd MMM yyyy') : '---'}</b></div>
    <div class="col-12 col-md-6">Location : <b>${proj.location}</b></div>
</div>
<div class="row">
    <div class="col-12 col-md-6">Pre-${proj.type.type} Session Date : <b>${$.format.date(proj.pre_event_dates.start, 'dd MMM yyyy')}</b></div>
    <div class="col-12 col-md-6">Package : <b>₱ ${currencyFormat(proj.package)}</b></div>
</div>
<div class="row">
    <div class="col-12 col-md-6">Remaining Balance : <b>₱ ${currencyFormat((received >= proj.package) ? 0: proj.package - received)}</b>&nbsp;
    <small>(${(rembal.description !== undefined) ? `Paid on <b>${$.format.date(new Date(rembal.date), 'dd MMM yyyy')}</b>`:`Unpaid`})</small></div>
    <div class="col-12 col-md-6">Down Payment : <b>₱ ${currencyFormat(dp.amount)}</b>&nbsp;
    <small>(${(dp.description !== undefined) ? `Paid on <b>${$.format.date(new Date(dp.date), 'dd MMM yyyy')}</b>`:`Unpaid`})</small></div>
</div>
<div class="row">
    <div class="col-12 col-md-6 pt-3">Availed Inclusions :<br />${inclusions}</div>
    <div class="col-12 col-md-6 pt-3">Partner Suppliers :<br />
    ${suppliers}</div>                
</div>
</div>        
`)

modal.find('.modal-dialog').removeClass('modal-sm modal-lg')
modal.find('.modal-dialog').addClass('modal-lg')
modal.modal('show')
})

}

function projQuickPreviewLite(id) {
    var modal = $('#_modal_proj_quickview')
    var mbody = modal.find('.modal-body')

    socket.emit('get-project', id, callback => {
                var proj = JSON.parse(callback)
                var inclusions = ''
                var coordinator = null
                var dp = {
                    amount: 0
                }

                var received = 0
                var rembal = {
                    amount: 0
                }

                var suppliers = ''

                for (var i of proj.inclusions) {
                    i.description = i.description.replace('Event', proj.type.type)
                    i.code = i.code.replace('E', proj.type.type.split('')[0])
                    if (!i.description.toLowerCase().includes('aerial') && !i.description.toLowerCase().includes('drone'))
                        inclusions += `<b>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;${i.description}</b><br />`
                }

                for (var s of proj.suppliers) {
                    if (s.job.toLowerCase().includes('coord')) {
                        coordinator = s
                    }
                    suppliers += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${s.job}&nbsp;:&nbsp;<b>${s.name}</b><br />`
                }

                for (var b of proj.budget) {
                    if (b.type == 'debit' && b.description.toLowerCase().includes('down pay')) {
                        dp = b
                    }
                    if (b.type == 'debit') {
                        received += b.amount
                    }
                    if (b.type == 'debit' && b.description.toLowerCase().includes('remaining')) {
                        rembal = b
                    }
                }

                modal.find('.modal-title').html((proj.title == null) ? (proj.direct) ? 'Untitled Project' : (coordinator == null) ? 'Untitled Project' : `[ ${coordinator.name} ]` : proj.title)
                modal.find('.modal-title').append(` <b>(${proj.type.type})</b>`)
                mbody.html(`
<div>
<div class="row">
    <div class="col-12">Date of Event : <b>${(proj.event_date !== null) ? $.format.date(proj.event_date, 'dd MMM yyyy') : '---'}</b></div>
</div>
<div class="row">
    <div class="col-12">Location : <b>${proj.location}</b></div>
</div>
<div class="row">
    <div class="col-12">Pre-${proj.type.type} Session Date : <b>${(proj.pre_event_dates.workcation) ? `${$.format.date(proj.pre_event_dates.start, 'd')}-${$.format.date(proj.pre_event_dates.end, 'd MMM yyyy')}`: $.format.date(proj.pre_event_dates.start, 'dd MMM yyyy')}</b></div>
</div>
<div class="row">
    <div class="col-12 pt-3">Partner Suppliers :<br />
    ${suppliers}</div>                
</div>
</div>        
`)

modal.find('.modal-dialog').removeClass('modal-sm modal-lg')
modal.find('.modal-dialog').addClass('modal-md')
modal.modal('show')
})

}

function reloadSupplierInputs() {
    var el_select_job = $(`#select_supplier_type`)
    var el_select_name = $(`#select_supplier_name`)

    var suppliers = []
    el_select_name.find(`option`).remove()

    for (var supplier of cvsystemdata.datalists.suppliers.obj) {
        if (supplier.job.toLowerCase().includes(el_select_job.val().toLowerCase())) {
            suppliers.push([supplier.name, supplier.id])
        }
    }

    suppliers.sort()
    for (var s of suppliers) {
        el_select_name.append(`<option id="opt-${s[1]}" value="${s[1]}">${s[0]}</option>`)
    }

    reloadEvents()
}

function addPersonalSchedule() {
    var modal = $('#_modal_add_personal_schedule')
    modal.find('.modal-title').text(`Add Personal Schedule`)

    modal.find('#type').val('')
    modal.find('#title').val('')
    modal.find('#type').val('errand')
    modal.find('#recur').val('once')
    modal.find('#date_start').val('')
    modal.find('#date_end').val('')
    modal.find('#description').val('')

    modal.find('.modal-footer .btn-primary').text('Save')
    modal.find('.modal-footer .btn-primary').attr(`onclick`, `createPersonalSchedule()`)
    modal.find('.modal-footer .btn-danger').addClass('d-none')

    modal.modal('show')
}

function createPersonalSchedule() {
    var modal = $('#_modal_add_personal_schedule')

    var data = {
        user: sessioned_user.id,
        type: modal.find('#type').val(),
        title: (modal.find('#title').val() == '') ? null : modal.find('#title').val().replace('.', ''),
        frequency: modal.find('#recur').val(),
        start: (modal.find('#date_start').val() == '') ? null : new Date(modal.find('#date_start').val()).getTime(),
        end: (modal.find('#date_end').val() == '') ? null : new Date(modal.find('#date_end').val()).getTime(),
        description: modal.find('#description').val(),
    }

    if (modal.find('#title').val() !== '') {
        socket.emit('create-personal-schedule', data, callback => {
            var response = JSON.parse(callback)

            if (response.inserted > 0 && response.errors == 0) {
                showToast('Success', 'Personal schedule added successfully.', 'success')
            } else if (response.errors > 0) {
                showToast('Error', 'Something went wrong.', 'error')
            }

            $('#_modal_add_personal_schedule').modal('hide')
        })
    } else {
        showToast('Error', `Please provide title for the ${modal.find('#type').val()}.`, 'error')
    }


}

function updatePersonalSchedule() {
    var modal = $('#_modal_add_personal_schedule')
    var data = {
        id: modal.find('.modal-id').text(),
        type: modal.find('#type').val(),
        title: (modal.find('#title').val() == '') ? null : modal.find('#title').val().replace('.', ''),
        frequency: modal.find('#recur').val(),
        start: (modal.find('#date_start').val() == '') ? null : new Date(modal.find('#date_start').val()).getTime(),
        end: (modal.find('#date_end').val() == '') ? null : new Date(modal.find('#date_end').val()).getTime(),
        description: modal.find('#description').val(),
    }

    if (modal.find('#title').val() !== '') {
        socket.emit('update-personal-schedule', data, callback => {
            var response = JSON.parse(callback)

            if (data.type == 'event') {
                if (response.replaced > 0 && response.errors == 0) {
                    showToast('Success', 'Special event updated successfully.', 'success')
                } else if (response.errors > 0) {
                    showToast('Error', 'Something went wrong.', 'error')
                }
            } else {
                if (response.replaced > 0) {
                    showToast('Success', 'Schedule of personal errand updated successfully.', 'success')
                } else if (response.errors > 0) {
                    showToast('Error', 'Something went wrong.', 'error')
                }
            }


            $('#_modal_add_personal_schedule').modal('hide')
        })
    } else {
        showToast('Error', `Please provide title for the ${modal.find('#type').val()}.`, 'error')
    }

}

function getPersonalSchedule(id) {
    var modal = $('#_modal_add_personal_schedule')
    socket.emit('get-personal-schedule', id, callback => {
        var schedule = JSON.parse(callback)
        modal.find('.modal-id').text(schedule.id)

        if (schedule.type == 'errand') {
            modal.find('.modal-title').text(`${schedule.user.name.first.split(' ')[0]}'s Personal Errand`)
        } else {
            modal.find('.modal-title').text(`Special Event`)
        }

        modal.find('#title').val(schedule.title)
        modal.find('#recur').val(schedule.frequency)
        modal.find('#date_start').val((schedule.start == null) ? '' : $.format.date(new Date(schedule.start), 'yyyy-MM-dd'))
        modal.find('#date_end').val((schedule.end == null) ? '' : $.format.date(new Date(schedule.end), 'yyyy-MM-dd'))
        modal.find('#description').val(schedule.description)
        modal.find('#type').val(schedule.type)

        modal.find('.modal-footer .btn-danger').removeClass('d-none')
        modal.find('.modal-footer .btn-danger').attr('onclick', `confirmDeletePeronslScheduleAction('${schedule.id}')`)

        modal.find('.modal-footer .btn-primary').attr(`onclick`, `updatePersonalSchedule()`)
        modal.find('.modal-footer .btn-primary').text('Update')

        modal.modal('show')
    })
}

function deletePersonalSchedule(id) {
    socket.emit('delete-personal-schedule', id, callback => {
        var response = JSON.parse(callback)

        if (response.deleted > 0) {
            showToast('Success', 'Successfully removed.', 'success')
        } else if (response.errors > 0) {
            showToast('Error', 'Something went wrong.', 'error')
        }
    })
}

function confirmDeletePeronslScheduleAction(id) {
    var confirmModal = $('#modal_confirm')

    $('#_modal_add_personal_schedule').modal('hide')
    confirmModal.modal('show')

    socket.emit('get-personal-schedule', id, callback => {
        var objdata = JSON.parse(callback)
        var msg = `Are you sure you want to delete ${objdata.title}? This cannot be undone.`

        confirmModal.find('.modal-title').text("Confirm")
        confirmModal.find('.modal-body').html(msg)

        confirmModal.find('.yes-btn').attr("onclick", `deletePersonalSchedule("${objdata.id}")`)
        confirmModal.find('.yes-btn').attr("data-dismiss", "modal")

        confirmModal.find('.no-btn').attr('onclick', `$('#modal_confirm').modal('hide'); $('#_modal_add_personal_schedule').modal('show')`)
    })


}

function contextMenuActionAddProject(dateStr, coordinator) {
    $('#_modal_calendar_action').modal('hide')
    if (coordinator) {
        toggleProjectModal(0)
        $(`#modal_projview #_modal_proj_pre_event_date_start`).attr(`max`, dateStr)
        $(`#modal_projview #_modal_proj_event_date`).val(dateStr)
        $(`#modal_projview #_modal_proj_suppliers tbody tr:first-child td`).eq(0).find(`input`).val($(`#select_supplier_type`).val())
        $(`#modal_projview #_modal_proj_suppliers tbody tr:first-child td`).eq(1).find(`input`).val($(`#select_supplier_name #opt-${$(`#select_supplier_name`).val()}`)[0].innerText)
        addNewSupplier()
    } else {
        toggleProjectModal(0)
        $('#modal_projview #_modal_proj_pre_event_date_start').attr('max', dateStr)
        $('#modal_projview #_modal_proj_event_date').val(dateStr)
    }

}

function contextMenuPeronslScheduleAction(date) {
    $('#_modal_calendar_action').modal('hide')
    addPersonalSchedule()
    $('#_modal_add_personal_schedule #date_start').val(date)
}