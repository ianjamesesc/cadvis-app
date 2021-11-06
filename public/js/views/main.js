const socket = io(),
    bullet = '▪ ',
    filmmaker_name_container = '<div id="$badge_id" class="filmmaker shooters container d-inline px-1 text-white" style="postion: inherit; width: auto;"><span class="badge bg-primary py-1 px-3 mx-1 mb-2 name-value" style="position: relative;"><h6 class="m-0">$value</h6></span><button class="btn btn-sm bg-danger text-white text-center" style="position: absolute; margin-left: -15px; margin-top: -4px; width: 15px; height: 15px; border-radius: 50%; cursor: pointer; padding: 0;" onclick="removeName(this)"><p style="position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%)">&minus;</p></button></div>'

var cvsystemdata = null,
    suppliers = [],
    name_list = '',
    job_list = '',
    current_project = null,
    tasklist_table = null,
    paystat = {
        pending: `<span class="text-warning font-weight-bold">PENDING</span>`,
        paid: `<span class="text-success font-weight-bold">FULLY PAID</span>`,
        cancelled: `<span class="text-danger font-weight-bold">CANCELLED</span>`
    }

var params = new URLSearchParams(window.location.search)

var day_in_milliseconds = 86400000 //1 day in milliseconds

$('#_modal_page_loading').modal('show')

socket.on('connect', () => {
    $('#_modal_err_conn .modal-title').text("Connection Restored")
    $('#_modal_err_conn .modal-body').text("Successfully reconnected to server.")
    $('#_modal_err_conn .spinner-border').addClass('d-none')
    setTimeout(function() {
        $('#_modal_err_conn').modal('hide')
        loadCVSystemData()
    }, 1000)

    if (page !== 'Login') {
        if (sessioned_user.dark_theme) {
            $('body').addClass('c-dark-theme')
            $('.c-header #navbar-brand-logo').attr(`src`, `logo/cdncvsl-500-white.png`)
        } else {
            $('body').removeClass('c-dark-theme')
            $('.c-header #navbar-brand-logo').attr(`src`, `logo/cdncvsl-500-dark.png`)
        }
    }
})

socket.on('disconnect', () => {
    $(`#modal_projview`).modal('hide')
    $('#_modal_err_conn .modal-title').text("Connection Error")
    $('#_modal_err_conn .modal-body').text("You have been disconnected from the server. Trying to reconnect.")
    $('#_modal_err_conn .spinner-border').removeClass('d-none')
    $('#_modal_err_conn').modal('show')
})


socket.on('project-inserted', function(jsondata) {
    if (page.includes('Dashboard')) {
        reloadTasklist()
        calculateBudgetForDashboardWidgets()

        if ($(`#modal_projview`).hasClass('show') && $(`#modal_projview .modal-title`).text().includes(proj.id)) {
            previewProject(proj.id)
        }
    }
})

socket.on('project-updated', function(jsondata) {
    var proj = JSON.parse(jsondata)

    if (page.includes('Dashboard')) {
        reloadTasklist()
        calculateBudgetForDashboardWidgets()

        if ($(`#modal_projview`).hasClass('show') && $(`#modal_projview .modal-title`).text().includes(proj.id)) {
            previewProject(proj.id)
        }
    }


})

socket.on('project-deleted', function(jsondata) {
    if (page.includes('Dashboard')) {
        reloadTasklist()
        calculateBudgetForDashboardWidgets()

        if ($(`#modal_projview`).hasClass('show') && $(`#modal_projview .modal-title`).text().includes(proj.id)) {
            $(`#modal_projview`).modal('hide')
        }
    }
})

$(document).ready(function() {
            tasklist_table = $('#tasklist').dataTable({
                info: false,
                searching: false,
                lengthChange: false,
                scrollY: '325px',
                scrollCollapse: true,
                paging: false,
                ordering: false,
                columnDefs: [{
                    targets: 1,
                    render: function(data, type, row) {
                        return (data.length > 12) ? `${data.substr(0, 12).trim()}…` : data
                    }
                }, ],
                fnRowCallback: function(nRow, aData, iDisplayIndex) {
                    nRow.setAttribute('class', `${aData[0].toLowerCase()}${aData[2].toLowerCase()}`)
                    nRow.setAttribute('row', 'data')
                }
            })

            loadCVSystemData()
            countProjects()
            reloadTasklist()

            setTimeout(function() {
                document.body.classList.remove('c-no-layout-transition')
            }, 2000);

            $('#_modal_err_conn').click(function() {
                $(this).modal({
                    backdrop: 'static',
                    keyboard: false
                });
            })

            $('#_modal_page_loading').modal('show')
            $('#_modal_page_loading').click(function() {
                $(this).modal({
                    backdrop: 'static',
                    keyboard: false
                });
            })

            $('#_modal_err_conn').find('div, h5').css('transition', '1s ease')

            $('.toast').toast({
                delay: 1500,
                animation: true,
                dismiss: true
            })

            var payment_cb = new ClipboardJS('#details-payment-copy-btn')
            var full_cb = new ClipboardJS('#details-full-copy-btn')
            var basic_cb = new ClipboardJS('#details-basic-copy-btn')

            payment_cb.on('success', function(e) {
                showToast('Project Action', 'Payment details copied successfully to clipboard.', 'info')
                e.clearSelection()
            })

            full_cb.on('success', function(e) {
                showToast('Project Action', 'Details copied successfully to clipboard.', 'info')
                e.clearSelection()
            })

            basic_cb.on('success', function(e) {
                showToast('Project Action', 'Details copied successfully to clipboard.', 'info')
                e.clearSelection()
            })

            $('.toast').on('hidden.coreui.toast', function() {
                $('.toast').css('z-index', -1)
            })

            $('.toast').on('shown.coreui.toast', function() {
                $('.toast').css('z-index', 99999)
            })

            $('textarea').on('keyup', function() {
                $(this).val($(this).val().replace('*', bullet))
            })

            $("#modal_projview").on('keyup change', 'input, select, textarea', function() {
                projectModalChanges()
            })

            $("#modal_projview").on('click', '.row button', function() {
                projectModalChanges()
            })

            $("#modal_projview").on('hide.bs.modal', function() {
                current_project = null
            })

            $("#tasklist").find(`tbody`).delegate(`tr`, `click`, function() {
                var proj_id = $(this).find('td').eq(0).text()
                socket.emit('get-project', proj_id, callback => {
                    var project = JSON.parse(callback)
                    current_project = project
                    previewProject(project.id)
                    $("#modal_projview .proj_delete_btn").attr('row-id', project.id)
                })
            })

            $(document).keyup(function(event) {
                var key = event.which || event.keyCode;
                //alert(key)
                if ($(`#modal_projview`).hasClass('show')) {
                    if (key == 27) {
                        $(`#modal_projview`).modal('hide')
                    }
                }
        
            })

            $('#modal_projview .progress_outputs').on('change', 'input', function() {
                        var label = $(this).closest('.form-check').find('label').text().toLowerCase()
                        var this_element = $(this)
                        var count = $('#modal_projview .progress_outputs .form-check').length
                        var checked = $('#modal_projview .progress_outputs .form-check :checked').length

                        var event_date = new Date(current_project.event_date).getTime()
                        var now = new Date().getTime()

                        for (var stat of cvsystemdata.status_list) {
                            if ($('#modal_projview #_modal_proj_status').hasClass(`border-${stat.color}`)) {
                                $('#modal_projview #_modal_proj_status').removeClass(`border-${stat.color}`)
                            }
                        }

                        if (count == checked) {
                            var has_docu = false
                            $('#modal_projview .progress_outputs .form-check').each(function(){
                                if($(this).hasClass('._chkCVO003')){
                                    has_docu = true
                                }
                            })

                            if(has_docu){
                                $('#modal_projview #_modal_proj_status').val(8)
                                $('#modal_projview #_modal_proj_status').addClass(`border-${$(`#modal_projview #_modal_proj_status #stat-${8}`).attr('color')}`)
                            }else{
                                $('#modal_projview #_modal_proj_status').val(6)
                                $('#modal_projview #_modal_proj_status').addClass(`border-${$(`#modal_projview #_modal_proj_status #stat-${6}`).attr('color')}`)
                            }

                            
        } else if (checked == 0 && now < event_date) {
            $('#modal_projview #_modal_proj_status').val(7)
            $('#modal_projview #_modal_proj_status').addClass(`border-${$(`#modal_projview #_modal_proj_status #stat-${7}`).attr('color')}`)
        } else if (checked == 0 && now > event_date) {
            $('#modal_projview #_modal_proj_status').val(3)
            $('#modal_projview #_modal_proj_status').addClass(`border-${$(`#modal_projview #_modal_proj_status #stat-${3}`).attr('color')}`)
        } else if (label.includes('-day') && this_element.prop('checked')) {
            $('#modal_projview #_modal_proj_status').val(3)
            $('#modal_projview #_modal_proj_status').addClass(`border-${$(`#modal_projview #_modal_proj_status #stat-${3}`).attr('color')}`)
        } else if (label.includes('save') || label.includes('pre-') || label.includes('-day') && !this_element.prop('checked')) {
            $('#modal_projview #_modal_proj_status').val(7)
            $('#modal_projview #_modal_proj_status').addClass(`border-${$(`#modal_projview #_modal_proj_status #stat-${7}`).attr('color')}`)
        } else if (label.includes('full') && !this_element.prop('checked')) {
            $('#modal_projview #_modal_proj_status').val(3)
            $('#modal_projview #_modal_proj_status').addClass(`border-${$(`#modal_projview #_modal_proj_status #stat-${3}`).attr('color')}`)
        }
    })

    systemTime()
})

socket.on('dark-theme-toggled', function(response) {
    response = JSON.parse(response)

    if (sessioned_user.id === response.user) {
        if (response.boolean) {
            $('body').addClass('c-dark-theme')
            $('.c-header #navbar-brand-logo').attr(`src`, `logo/cdncvsl-500-white.png`)
        } else {
            $('body').removeClass('c-dark-theme')
            $('.c-header #navbar-brand-logo').attr(`src`, `logo/cdncvsl-500-dark.png`)
        }
    }
})

socket.on('shoot-today', function(callback) {
    $(".project_today").remove()
    var data = JSON.parse(callback)

    if (data.length > 0) {
        var i = 0
        for (var d of data) {
            var proj = d.project
            var title = ''
            var widget = `<div class="$col col-sm-12 fadeIn project_today"><div class="card overflow-hidden" onclick="previewProject('${proj.id}')"><div class="card-body p-0 d-flex align-items-center"><div class="bg-gradient-success text-white py-4 px-4 mfe-3"><svg class="c-icon d-inline text-bold text-white" style="width: 22px; height: 22px;"><use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-video"></use></svg></div><div><div class="text-value"><h5 class="mb-0 project-title">%title%</h5></div><div class="text-muted text-uppercase font-weight-bold small">%descday% %type% %date%</div></div></div></div></div>`

            if (proj.title == null) {
                title = proj.id

                for (var supplier of proj.suppliers) {
                    if (supplier.job.toUpperCase().includes('COORD') && !d.direct) {
                        title = `${proj.id} / [ ${supplier.name} ]`
                        break
                    }
                }
            } else {

                if (proj.type.type.toLowerCase() == 'debut') {
                    title = `${proj.title.split(' ')[0]} XVIII`
                } else {
                    title = proj.title
                }
            }

            if (proj.direct) {
                title = `${title}&nbsp;<svg class="c-icon d-inline text-bold mb-1" style="width: 15px; height: 15px;"><use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-check-circle"></use></svg>`
            }

            widget = widget.replace('%title%', title)
            widget = widget.replace('%descday%', d.description)
            widget = (d.type.toLowerCase() == 'corporate') ? widget.replace('%type%', `${d.type} Shoot`) : (d.type.toLowerCase().includes('pre-')) ? widget.replace('%type%', `${d.type} Shoot`) : widget.replace('%type%', `${d.type}`)

            if (d.description.toLowerCase() == `tomorrow's`) {
                widget = widget.replace('bg-gradient-success', 'bg-gradient-warning')
                widget = widget.replace('%date%', '')
            } else if (d.description.toLowerCase() == 'upcoming') {
                widget = widget.replace('bg-gradient-success', `bg-${proj.status.color}`)
                widget = widget.replace('%date%', `<span class="text-info">[ ${d.date} ]</span>`)
            } else {
                widget = widget.replace('%date%', '')
            }

            widget = widget.replace('text-white', 'text-dark')

            if (data.length == 2) {
                widget = widget.replace('$col', 'col-lg-6 col-md-6')
            } else if (data.length == 3) {
                widget = widget.replace('$col', 'col-lg-4 col-md-4')
            } else if (data.length == 4) {
                widget = widget.replace('$col', 'col-lg-3 col-md-6')
            } else if (data.length == 5) {
                if (i < 3) {
                    widget = widget.replace('$col', 'col-lg-4 col-md-6')
                } else {
                    widget = widget.replace('$col', 'col-lg-6 col-md-4')
                }
                i++
            } else if (data.length == 6) {
                widget = widget.replace('$col', 'col-lg-4 col-md-6')
            } else if (data.length > 6) {
                widget = widget.replace('$col', 'col-lg-4 col-md-6')
            }

            $('.shoot-today-row').append(widget)
        }
    }
})

function toggleDarkTheme(id) {
    socket.emit('toggle-dark-theme', id, callback => {
        var response = JSON.parse(callback)
        if (response) {
            $('body').addClass('c-dark-theme')
            $('.c-header #navbar-brand-logo').attr(`src`, `logo/cdncvsl-500-white.png`)
        } else {
            $('body').removeClass('c-dark-theme')
            $('.c-header #navbar-brand-logo').attr(`src`, `logo/cdncvsl-500-dark.png`)
        }
    })
}

function getFromArrayObj(key, array) {
    var newarray = []
    for (var i = 0; i < array.length; i++) {
        if (array[i].status.id === key) {
            newarray.push(array[i])
        }
    }
    return newarray
}

function arrayUniqe(value, index, self) {
    return self.indexOf(value) === index;
}

function showToast(title, message, type) {
    var icon_success = "vendors/@coreui/icons/svg/free.svg#cil-check-alt"
    var icon_error = "vendors/@coreui/icons/svg/free.svg#cil-ban"
    var icon_info = "vendors/@coreui/icons/svg/free.svg#cil-bell"

    $('.toast, .toast-header').removeClass('bg-success bg-danger bg-info')

    if (type == 'success') {
        $('.toast').addClass('bg-success')
        $('.toast-header').addClass('bg-success')
        $('.toast .toast-icon use').attr('xlink:href', icon_success)
    } else if (type == 'error') {
        $('.toast').addClass('bg-danger')
        $('.toast-header').addClass('bg-danger')
        $('.toast .toast-icon use').attr('xlink:href', icon_error)
    } else {
        $('.toast').addClass('bg-info')
        $('.toast-header').addClass('bg-info')
        $('.toast .toast-icon use').attr('xlink:href', icon_info)
    }

    $('.toast .toast-title').text(title)
    $('.toast .toast-message').html(message)
    $('.toast').toast('show')
}

function dropdownClick(el) {
    var e = $(el)
    var input = e.closest('.dropdown').find('input')
    var button = e.closest('.dropdown').find('button')

    var selectedText = e.text()

    button.text(selectedText)
    input.val(selectedText)
}

function currencyFormat(num) {
    return num.toFixed(2).replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}

function removeCurrencyFormat(num) {
    var val = "" + num.split(',').join('')
    if (parseFloat(val) == 0) {
        val = "" + num.split(',').join('').split('.')[0]
    }
    val = parseFloat(val)
    return val
}

function toggleCurrencyFormat(element, boolean) {
    var value = $(element).val()
    value = (value == '') ? 0 : value
    if (boolean) {
        if (parseFloat(value) <= 0) {
            value = '0.00'
        } else {
            if (value.includes('+')) {
                var sum = 0
                for (var val of value.split('+')) {
                    sum += parseFloat(val.trim())
                }
                value = currencyFormat(sum)
            } else {
                value = currencyFormat(parseFloat(value))
            }
        }
        $(element).val(value)
    } else {
        $(element).val(removeCurrencyFormat(value))
    }
}

function buildFormData(formData, data, parentKey) {
    if (data && typeof data === 'object' && !(data instanceof Date) && !(data instanceof File)) {
        Object.keys(data).forEach(key => {
            buildFormData(formData, data[key], parentKey ? `${parentKey}[${key}]` : key);
        });
    } else {
        const value = data == null ? '' : data;

        formData.append(parentKey, value);
    }
}

function jsonToFormData(data) {
    const formData = new FormData();
    buildFormData(formData, data);
    return formData;
}

function dateFormatDisplay(date) {
    var result
    if (date == null) {
        result = {
            format: "---",
            date: false
        }
    } else {
        var newdate = date.split('-')
        var month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        var year = newdate[0]
        var day = newdate[2]
        var month = month_names[newdate[1] - 1]

        var output = `${month} ${day}, ${year}`

        result = {
            format: output,
            date: date
        }
    }
    return result
}

function systemTime() {
    var time_cont = $('#system-time .time')
    var date_cont = $('#system-time .date')
    var datetime = new Date()

    date_cont.html($.format.date(datetime, 'MMM d, yyyy').toUpperCase())
    time_cont.find('.hh').text($.format.date(datetime, 'h'))
    time_cont.find('.mm').text($.format.date(datetime, 'mm'))
    time_cont.find('.aa').text($.format.date(datetime, 'a'))

    setInterval(function() {
        datetime = new Date()
        date_cont.html($.format.date(datetime, 'MMM d, yyyy').toUpperCase())
        time_cont.find('.hh').text($.format.date(datetime, 'h'))
        time_cont.find('.mm').text($.format.date(datetime, 'mm'))
        time_cont.find('.aa').text($.format.date(datetime, 'a'))
    }, 1100)

    setInterval(function() {
        $('#system-time .time .time-separator').toggleClass('system-time-ticker')
    }, 550)
}

function reformatCalendarDateTitle() {
    var container = $('h2.fc-toolbar-title')
    container.find('span').remove()
    var title = (container.find('span').length > 0) ? container.find('span').eq(0).text().split(' ') : container.text().split(' ')
    var yyyy = title[1]
    var mmmm = title[0]
    var mmm = mmmm.substring(0, 3)

    var html = `<span class="d-none d-md-inline">${mmmm} ${yyyy}</span><span class="d-md-none d-sm-inline">${mmm} ${yyyy}</span>`
    container.html(html)
}

function incrementStringID(givenStringID, charlength, numlength) {
    var prefix = givenStringID.substr(0, charlength)
    var increasedNum = Number(givenStringID.replace(prefix, '')) + 1;
    var incrementedID = givenStringID.substr(0, charlength);
    for (var i = 0; i < numlength - increasedNum.toString().length; i++) {
        incrementedID = incrementedID + '0';
    }
    incrementedID = incrementedID + increasedNum.toString();
    return incrementedID
}

jQuery.extend(jQuery.fn.dataTableExt.oSort, {
    "date-str-pre": function(s) {
        var months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

        if (s !== "---") {
            var dateComponents = s.split(" ")
            dateComponents[1] = dateComponents[1].replace(",", "")
            dateComponents[2] = jQuery.trim(dateComponents[2])

            var year = dateComponents[2]
            var day = dateComponents[1]
            var month = 0
            for (var i = 0; i < months.length; i++) {
                if (months[i].toLowerCase() == dateComponents[0].toLowerCase().substring(0, 3)) {
                    month = i
                    break
                }
            }

            return new Date(year, month, day)
        }
    },

    "date-str-asc": function(a, b) {
        return ((a < b) ? -1 : ((a > b) ? 1 : 0))
    },

    "date-str-desc": function(a, b) {
        return ((a < b) ? 1 : ((a > b) ? -1 : 0))
    }
})

function previewProject(project_id) {
    socket.emit('get-project', project_id, callback => {
                var modal = $('#modal_projview')
                var project = JSON.parse(callback)
                toggleProjectModal(project.id)
                var title = project.title
                current_project = project                

                modal.find('#project-date-created').html(`
                <span class="d-none d-md-inline d-sm-none">${$.format.date(new Date(project.date_created), 'dd MMM yyyy hh:mm a')}</span>
                <span class="d-md-none d-sm-inline">${$.format.date(new Date(project.date_created), 'dd MMM yyyy')}</span>
                `)
                
                modal.find(".proj_delete_btn").attr('row-id', project.id)
                
                modal.find('#_modal_proj_name').val(title)

                modal.find('#_modal_proj_allocation').val(project.allocation.id)

                loadEventTypeTitles(project.type.type.replace('Corporate', 'Event'))
                modal.find('#_modal_proj_type').val(project.type.id)

                modal.find('#_modal_proj_location').val(project.location)

                modal.find('#_modal_proj_pre_event_date_start').val((project.pre_event_dates.start !== null) ? $.format.date(new Date(project.pre_event_dates.start), 'yyyy-MM-dd') : '')
                if (project.pre_event_dates.workcation) {
                    modal.find('#_modal_proj_pre_event_date_end').val($.format.date(new Date(project.pre_event_dates.end), 'yyyy-MM-dd'))

                }

                if(project.event_date !== null){
                    modal.find('#_modal_proj_pre_event_date_start').attr('max', $.format.date(new Date(project.event_date), 'yyyy-MM-dd'))
                    modal.find('#_modal_proj_pre_event_date_end').attr('max', $.format.date(new Date(project.event_date), 'yyyy-MM-dd'))
                    modal.find('#_modal_proj_event_date').val($.format.date(new Date(project.event_date), 'yyyy-MM-dd'))
                }
                
                modal.find('#proj-view-title .title').text('Project ')
                modal.find('#proj-view-title .project_id').text(project.id)

                modal.find('#_modal_proj_notes').val(project.notes.replace('*', bullet))

                for( var s of cvsystemdata.status_list){
                    if(modal.find('#_modal_proj_status').hasClass(`border-${s.color}`)){
                        modal.find('#_modal_proj_status').removeClass(`border-${s.color}`)
                    }
                }
                
                modal.find('#_modal_proj_status').val(project.status.id)
                modal.find('#_modal_proj_status').addClass(`border-${project.status.color}`)

                modal.find('#_modal_proj_initial').val(currencyFormat(project.initial))
                modal.find('#_modal_proj_package').val(currencyFormat(project.package))

                modal.find('#_modal_proj_head').val((project.lead == null) ? 'N/A' : project.lead.id)

                var drive = (project.drive == null) ? 'N/A' : project.drive
                modal.find('#_modal_proj_drive_location').val(drive)

                for (var i = 0; i < project.manpower.length; i++) {
                    var link = `<a target="_blank" href="/partner/filmmaker/${project.manpower[i].id}" class="text-white outline-none">${project.manpower[i].name}</a>`
                    modal.find('#_modal_proj_filmmakers').append(filmmaker_name_container.replace('$value', link))
                }

                modal.find('.modal-footer .proj_delete_btn').attr('onclick', 'confirmAction("Are you sure you want to delete Project *? This action cannot be undone. Do this at your own risk.")')
                modal.find('#_modal_proj_direct_booking').prop('checked', project.direct)

                if (project.sub_events.length > 0) {
                    modal.find('.additional-event-dates table tr').remove()
                    for (var ev of project.sub_events) {
                        addSubEvent(ev.description, ev.date)
                    }
                }

                modal.find('#_modal_proj_suppliers tbody tr').remove()
                if (project.suppliers.length > 0) {
                    for (var supplier of project.suppliers) {
                        if (project.title == null && supplier.job.includes('Coor') && !project.direct) {
                            title = `[ ${supplier.name} ]`
                            modal.find('#_modal_proj_name').attr("placeholder", title)
                        }

                        if (project.type.type == 'Wedding') {
                            supplier.job = supplier.job.replace('Event', 'Wedding')
                            supplier.job = supplier.job.replace('Debut', 'Wedding')
                        } else if (project.type.type == 'Debut') {
                            supplier.job = supplier.job.replace('Event', 'Debut')
                            supplier.job = supplier.job.replace('Wedding', 'Debut')
                        } else {
                            supplier.job = supplier.job.replace('Debut', 'Event')
                            supplier.job = supplier.job.replace('Wedding', 'Event')
                        }

                        appendSupplier(supplier.job, supplier.name, supplier.id)

                    }
                }


                if (project.pre_event_dates.workcation) {
                    toggleDynamicPreEventMultiDay(false)
                } else {
                    toggleDynamicPreEventMultiDay(true)
                }

                if (project.inclusions.length > 1) {
                    modal.find('.progress_outputs').closest('.card').find('.card-header b').text('Outputs Progress')
                } else {
                    modal.find('.progress_outputs').closest('.card').find('.card-header b').text('Output Progress')
                }

                modal.find('.inclusions .checkbox').prop('checked', false)
                modal.find('.progress_outputs .checkbox').remove()
                for (var inc of project.inclusions) {
                    var desc = inc.description.toLowerCase()
                    $('._chk' + inc.id).prop('checked', true)

                    if (!desc.includes('aerial') && !desc.includes('drone')) {
                        var fcheck = $('._chk' + inc.id).closest('.form-check').clone()
                        var progress = (inc.done === undefined) ? false : inc.done

                        modal.find('.progress_outputs').append(fcheck)
                        modal.find('.progress_outputs ._chk' + inc.id).removeAttr('onchange')
                        modal.find('.progress_outputs ._chk' + inc.id).removeClass('_modal_proj_inclusions')
                        modal.find('.progress_outputs ._chk' + inc.id).closest('.form-check').addClass('d-block')
                        modal.find('.progress_outputs ._chk' + inc.id).closest('.form-check').removeClass('d-sm-inline-block')
                        modal.find('.progress_outputs ._chk' + inc.id).prop('checked', progress)
                    }

                }

                var expenses = 0
                var debit_amount = 0

                modal.find('.card-credit table tbody tr').remove()
                modal.find('.card-debit table tbody tr').remove()
                for (var budget of project.budget) {
                    if (budget.type == 'cr') {
                        expenses += budget.amount
                    } else {
                        debit_amount += budget.amount
                    }
                    alterBudgetRows(budget.type, budget.date, budget.description, budget.amount)
                }

                var revenue = project.package - expenses

                if (project.status.status.toLowerCase() == 'cancelled') {
                    expenses = 0
                    revenue = 0
                }

                var remaining_balance = project.package - debit_amount

                if (remaining_balance <= 0) {
                    modal.find(`#card-group-remaining-balance`).closest('.card').remove()
                    modal.find(`#card-group-payment-status`).html(paystat.paid)
                } else {
                    modal.find(`#card-group-payment-status`).html(paystat.pending)
                    if (modal.find(`#card-group-remaining-balance`).length == 0) {
                        modal.find(`#card-group-total-received`).closest('.card-group').append(`<div class="card bg-transparent">
            <div class="card-body">
                <div class="text-value-lg" id="card-group-remaining-balance">₱ <span class="amount">0</span></div><small class="text-muted text-uppercase font-weight-bold">Remaining Balance</small>
            </div>
        </div>`)
                    }
                }

                modal.find(`#card-group-expenses .amount`).text(`${currencyFormat(expenses)}`)
                modal.find(`#card-group-revenue .amount`).text(`${currencyFormat(revenue)}`)

                modal.find(`#card-group-package-amount .amount`).text(`${currencyFormat(project.package)}`)
                modal.find(`#card-group-total-received .amount`).text(`${currencyFormat(debit_amount)}`)
                modal.find(`#card-group-remaining-balance .amount`).text(`${currencyFormat(remaining_balance)}`)

                for (var alloc of project.allocation.allocation) {
                    var amount = revenue * (alloc.value / 100)
                    modal.find(`#card-${alloc.user} .amount`).text(currencyFormat(amount))

                    var user
                    for (var u of cvsystemdata.users) {
                        if (u.id === alloc.user) {
                            user = u
                            break
                        }
                    }

                    if (project.status.status.toLowerCase() == 'cancelled') {
                        amount = 0
                        modal.find(`#card-group-payment-status`).html(paystat.cancelled)
                        modal.find(`#card-group-expenses .amount`).text(`${currencyFormat(0)}`)
                        modal.find(`#card-group-revenue .amount`).text(`${currencyFormat(0)}`)
                        modal.find(`#card-group-package-amount .amount`).text(`${currencyFormat(project.package)}`)
                        modal.find(`#card-group-total-received .amount`).text(`${currencyFormat(0)}`)
                        modal.find(`#card-group-remaining-balance .amount`).text(`${currencyFormat(0)}`)
                    }

                    $(`#modal_projview #card_group`).append(
                        `<div class="card card-user bg-transparent" id="card-${alloc.user}">
                                                    <div class="card-body">
                                                        <div class="text-value-lg">₱ <span class="amount">${currencyFormat(amount)}</span></div><small class="text-muted text-uppercase font-weight-bold">${user.name.first} (${alloc.value} %)</small><div class="progress progress-xs mt-3 mb-0">
                                    <div class="progress-bar bg-gradient-info" role="progressbar" style="width: 100%" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                                    </div>
                                                </div>`)
                    countProgressOutputs()
                }

                if (modal.find('.card-debit table tbody tr').length <= 0) {
                    modal.find('.card-debit .budget-add-btn').click()
                }
                if (modal.find('.card-credit table tbody tr').length <= 0) {
                    modal.find('.card-credit .budget-add-btn').click()
                }

                var downpay = null
                var rembal = null
                var received = 0
                var fullpay = null
                for (var budg of project.budget) {
                    if (budg.description.toLowerCase().includes('initial') || budg.description.toLowerCase().includes('down') && budg.type.toLowerCase() == 'dr') {
                        downpay = budg
                    }
                    if (budg.description.toLowerCase() == 'remaining balance' && budg.type.toLowerCase() == 'dr') {
                        rembal = budg
                    }
                    if (budg.description.toLowerCase() == 'full payment' && budg.type.toLowerCase() == 'dr') {
                        fullpay = budg
                    }
                    if (budg.type.toLowerCase() == 'dr') {
                        received += budg.amount
                    }
                }

                if (received >= project.package) {
                    rembal = {
                        amount: 0,
                        date: null,
                        description: ``
                    }
                }

                var availed_inclusions = `Availed Inclusions: \n`
                var aerial_inclusions = ``
                if (project.inclusions.length > 0) {
                    for (var i = 0; i < project.inclusions.length; i++) {
                        var inc = project.inclusions[i]
                        if (inc.code == 'PEF' || inc.code == 'FED' || inc.code == 'EVF' || inc.description.toLowerCase().includes('aerial')) {
                            if (project.type.type.toLowerCase() == 'wedding') {
                                inc.description = inc.description.replace('Event', 'Wedding')
                            } else if (project.type.type.toLowerCase() == 'debut') {
                                inc.description = inc.description.replace('Event', 'Debut')
                            }
                        }

                        if (!inc.description.toLowerCase().includes('aerial')) {
                            availed_inclusions += `     - ${inc.description.toUpperCase()}\n`
                        }else{
                            aerial_inclusions += `     - ${inc.description.toUpperCase()}\n`
                        }
                    }
                } else {
                    availed_inclusions = null
                }

                var booked_filmmakers = null
                if(project.manpower.length > 0){
                    booked_filmmakers = `Booked Filmmakers: \n`
                    for(var f of project.manpower){
                        booked_filmmakers += `     - ${f.name}\n`
                    }
                }
                

                var co_suppliers = {
                    coordinator: null,
                    photographers: []
                }

                var partner_suppliers = `Partner Suppliers:\n`
                if (project.suppliers.length > 0) {
                    for (var supplier of project.suppliers) {
                        if (supplier.job.toLowerCase().includes('coord')) {
                            supplier.name = `${supplier.name}${(!project.direct) ? ` (✔)`: ''}`
                            co_suppliers.coordinator = supplier                            
                        }
                        if (supplier.job.toLowerCase().includes('photog')) {
                            co_suppliers.photographers.push(supplier)
                        }

                        if (project.type.type == 'Wedding') {
                            supplier.job = supplier.job.replace('Event', 'Wedding')
                            supplier.job = supplier.job.replace('Debut', 'Wedding')
                        } else if (project.type.type == 'Debut') {
                            supplier.job = supplier.job.replace('Event', 'Debut')
                            supplier.job = supplier.job.replace('Wedding', 'Debut')
                        } else {
                            supplier.job = supplier.job.replace('Debut', 'Event')
                            supplier.job = supplier.job.replace('Wedding', 'Event')
                        }

                        partner_suppliers += `      ${supplier.job}: ${supplier.name.toUpperCase()}\n`
                    }
                } else {
                    co_suppliers = null
                    partner_suppliers = null
                }

                var pre_evdate = null, p = project.pre_event_dates

                if(p.start !== null){
                    if(p.workcation){               
                        if($.format.date(new Date(p.start), 'yyyy') == $.format.date(new Date(p.end), 'yyyy')
                        && $.format.date(new Date(p.start), 'MMM') == $.format.date(new Date(p.end), 'MMM')){
                            pre_evdate = `${$.format.date(new Date(p.start), 'd')}-${$.format.date(new Date(p.end), 'd MMM yyyy')}`
                        }else if ($.format.date(new Date(p.start), 'yyyy') == $.format.date(new Date(p.end), 'yyyy')
                        && $.format.date(new Date(p.start), 'MMM') != $.format.date(new Date(p.end), 'MMM')){
                            pre_evdate = `${$.format.date(new Date(p.start), 'd MMM')}-${$.format.date(new Date(p.end), 'd MMM yyyy')}`
                        }else{
                            pre_evdate = `${$.format.date(new Date(p.start), 'd MMM yyyy')}-${$.format.date(new Date(p.end), 'd MMM yyyy')}`
                        }
                        pre_evdate = pre_evdate.toUpperCase()
                    }else{
                        pre_evdate = $.format.date(new Date(p.start), 'dd MMM yyyy').toUpperCase()
                    }
                }else{
                    pre_evdate = `N/A`
                }

                var payment_details = `Project Title: ${title}${(project.direct) ? ' (✔)':' '}(${project.type.type})
Date Booked: ${$.format.date(new Date(project.date_created), 'dd MMM yyyy h:mm a').toUpperCase()}
${project.type.type} Event Date: ${$.format.date(new Date(project.event_date), 'dd MMM yyyy').toUpperCase()}

Package Amount: ₱ ${currencyFormat(project.package)} ${(received >= project.package) ? `(Paid)`: ``}
Down Payment: ₱ ${currencyFormat(project.initial)} ${(downpay !== null) ? (downpay.date == null) ? `` : `(Paid on ${$.format.date(new Date(downpay.date), 'dd MMM yyyy').toUpperCase()})` : '(Unpaid)'}
Remaining Balance: ₱ ${currencyFormat(remaining_balance)} ${(rembal !== null) ? (rembal.date == null) ? `` : `(Paid on ${$.format.date(new Date(rembal.date), 'dd MMM yyyy').toUpperCase()})` : (project.status.status.toLowerCase() == 'cancelled') ? `Void`:`(To be paid on the day of the event)`}
Received Total: ₱ ${currencyFormat(received)}`

                var basic_details = `Project Title: ${title}${(project.direct) ? ' (✔) ':' '}(${project.type.type})
Date Booked: ${$.format.date(new Date(project.date_created), 'dd MMM yyyy h:mm a').toUpperCase()}
${project.type.type} Event Date: ${$.format.date(new Date(project.event_date), 'dd MMM yyyy').toUpperCase()}
Pre-${project.type.type} Shoot Date${(p.workcation) ? `s`: ``}: ${pre_evdate}
${(availed_inclusions !== null) ? `\n${availed_inclusions}`: ''}
${(partner_suppliers !== null) ? `${partner_suppliers}`: ''}
Package Amount: ₱ ${currencyFormat(project.package)} ${(received >= project.package) ? `(Paid)`: ``}
Down Payment: ₱ ${currencyFormat(project.initial)} ${(downpay !== null) ? (downpay.date == null) ? `` : `(Paid on ${$.format.date(new Date(downpay.date), 'dd MMM yyyy').toUpperCase()})` : '(Unpaid)'}
Remaining Balance: ₱ ${currencyFormat(remaining_balance)} ${(rembal !== null) ? (rembal.date == null) ? `` : `(Paid on ${$.format.date(new Date(rembal.date), 'dd MMM yyyy').toUpperCase()})` : (project.status.status.toLowerCase() == 'cancelled') ? `Void`:`(To be paid on the day of the event)`}
Received Total: ₱ ${currencyFormat(received)}`

                var full_details = `Project ID: ${project.id}
Title: ${title}${(project.direct) ? ' (✔) ':' '}(${project.type.type}) 
Status: ${project.status.status}
Location: ${project.location}

Date Booked: ${$.format.date(new Date(project.date_created), 'dd MMM yyyy h:mm a').toUpperCase()}
${project.type.type} Event Date: ${$.format.date(new Date(project.event_date), 'dd MMM yyyy').toUpperCase()}
Pre-${project.type.type} Shoot Date${(p.workcation) ? `s`: ``}: ${pre_evdate}

Drive Location: ${(project.drive == null) ? `N/A`: project.drive}
Project Head: ${(project.lead == null) ? `N/A`: `${project.lead.name.first} ${project.lead.name.last}`}
${(availed_inclusions !== null) ? `\n${availed_inclusions}`: ''}${(availed_inclusions !== null) ? `${aerial_inclusions}`: ''}
${(partner_suppliers !== null) ? `${partner_suppliers}`: ''}
${(booked_filmmakers !== null) ? `${booked_filmmakers}`: ''}
Package Amount: ₱ ${currencyFormat(project.package)}${(received >= project.package) ? ` (Paid)`: ``}
Down Payment: ₱ ${currencyFormat(project.initial)}${(downpay !== null) ? (downpay.date == null) ? `` : ` (Paid on ${$.format.date(new Date(downpay.date), 'dd MMM yyyy').toUpperCase()})` : ' (Unpaid)'}
Remaining Balance: ₱ ${currencyFormat(remaining_balance)}${(rembal !== null) ? (rembal.date == null) ? `` : ` (Paid on ${$.format.date(new Date(rembal.date), 'dd MMM yyyy').toUpperCase()})` : (project.status.status.toLowerCase() == 'cancelled') ? ` (Void)`:` (To be paid on the day of the event)`}
Received Total: ₱ ${currencyFormat(received)}`
    
                $('#project-payment-details').val(payment_details)
                $('#project-full-details').val(full_details)
                $('#project-basic-details').val(basic_details)
    })
}

function loadEventTypeTitles(val) {
    $('#modal_projview .modal-body ._proj_event_type').text(val)
}


function addProgressOutput(e) {
    var fcheck = $(e).closest('.form-check').clone()
    var checked = $(e).prop('checked')
    var label = $(e).closest('.form-check').find('label').text().toLowerCase()
    if (checked) {
        if (!label.includes('aerial') && !label.includes('drone')) {
            $('#modal_projview .progress_outputs').append(fcheck)
            $('#modal_projview .progress_outputs ._chk' + $(e).attr('data-id')).removeAttr('onchange')
            $('#modal_projview .progress_outputs ._chk' + $(e).attr('data-id')).removeClass('_modal_proj_inclusions')
            $('#modal_projview .progress_outputs ._chk' + $(e).attr('data-id')).prop('checked', false)
            $('#modal_projview .progress_outputs ._chk' + $(e).attr('data-id')).closest('.form-check').addClass('d-block')
            $('#modal_projview .progress_outputs ._chk' + $(e).attr('data-id')).closest('.form-check').removeClass('d-sm-inline-block')
        }
    } else {
        $('#modal_projview .progress_outputs ._chk' + $(e).attr('data-id')).closest('.form-check').remove()
    }

    if ($('#modal_projview .progress_outputs .form-check').length > 1) {
        $('#modal_projview .progress_outputs').closest('.card').find('.card-header b').text('Outputs Progress')
    } else {
        $('#modal_projview .progress_outputs').closest('.card').find('.card-header b').text('Output Progress')
    }

    countProgressOutputs()
}

function countProgressOutputs() {
    var count = $('#modal_projview .progress_outputs .form-check').length

    if (count > 0) {
        $('#modal_projview .inclusions .modal-header .btn').removeClass('d-none')
        $('#modal_projview .row-inclusions').eq(0).removeClass('col-12')
        $('#modal_projview .row-inclusions').eq(1).removeClass('d-none')
        $('#modal_projview .row-inclusions').eq(0).addClass('col-md-8')
        $('#modal_projview .row-inclusions').eq(1).addClass('col-md-4')
    } else {
        $('#modal_projview .inclusions .modal-header .btn').addClass('d-none')
        $('#modal_projview .row-inclusions').eq(0).removeClass('col-md-8')
        $('#modal_projview .row-inclusions').eq(1).removeClass('col-md-4')
        $('#modal_projview .row-inclusions').eq(0).addClass('col-12')
        $('#modal_projview .row-inclusions').eq(1).addClass('d-none')
    }
}

function clearSelection(e) {
    var elements = $(e).closest('.modal-content').find('.modal-body .form-check input')
    elements.prop('checked', false)

    elements.each(function() {
        addProgressOutput($(this))
    })
}

function togglePreEventMultiDay() {
    $('.pre_event_days').eq(0).toggleClass('col-md-3')
    $('.pre_event_days').eq(0).toggleClass('col-md-6')
    $('.pre_event_days').eq(1).toggleClass('d-none')

    if ($('.proj_multiday').val() == 0) {
        $('.proj_multiday').val(1)
    } else {
        $('.proj_multiday').val(0)
    }
}

function toggleDynamicPreEventMultiDay(opt) {
    if (opt) {
        $('.pre_event_days').eq(0).removeClass('col-md-3')
        $('.pre_event_days').eq(0).addClass('col-md-6')
        $('.pre_event_days').eq(1).addClass('d-none')
        $('.proj_multiday').prop('checked', false)
        $('.proj_multiday').val(0)
    } else {
        $('.pre_event_days').eq(0).addClass('col-md-3')
        $('.pre_event_days').eq(0).removeClass('col-md-6')
        $('.pre_event_days').eq(1).removeClass('d-none')
        $('.proj_multiday').prop('checked', true)
        $('.proj_multiday').val(1)
    }
}

function addNewSupplier() {
    var row = '<tr><td class="p-0"><input class="form-control-transparent" onchange="changesSuppliers(this)" placeholder="Type of supplier" list="datalist_jobs">' + job_list + '</td><td class="p-0" colspan="2"><input class="form-control-transparent" placeholder="Name of supplier" list="datalist_supplier">' + name_list + '</td><td class="p-0" width="32px"><button class="btn btn-sm btn-danger no-b-radius" onclick="removeRow(this)"><svg class="c-icon"><use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg></button></td></tr>'
    $('#_modal_proj_suppliers tbody').append(row)
}

function appendSupplier(type, name, key) {
    var row = `<tr><td class="p-0"><input class="form-control-transparent" onchange="changesSuppliers(this)" placeholder="Type of supplier" value="${type}" list="datalist_jobs">${job_list}</td><td class="p-0"><input class="form-control-transparent" placeholder="Name of supplier" value="${name}" list="datalist_supplier">${name_list}</td><td class="p-0" width="32px"><a href="/partner/supplier/${key}" target="_blank" class="btn btn-sm btn-info no-b-radius"><svg class="c-icon"><use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-calendar"></use></svg></a></td><td class="p-0" width="32px"><button class="btn btn-sm btn-danger no-b-radius" onclick="removeRow(this)"><svg class="c-icon"><use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg></button></td></tr>`
    $('#_modal_proj_suppliers tbody').append(row)
}

function setMinimumDate(el) {
    var val
    if (typeof el === 'object' && el !== null) {
        val = $(el).val()
    } else {
        val = el
    }

    $('#modal_projview #_modal_proj_pre_event_date_end').attr('min', val)
    $('#modal_projview #_modal_proj_event_date').attr('min', val)
}

function removeName(e) {
    var container = $(e).closest('.container')
    var name_container = container.closest('#_modal_proj_filmmakers')
    var name = container.find('h6').text()
    container.remove()
    $('#modal_projview #filmmakers').append(`<option id="filmmaker_${hex_md5(name)}" value="${name}"></option>`)
    projectModalChanges()
}

function addShooter(element) {
    var row = $(element).closest('tr')
    var input = $(element)
    var container = row.closest('.modal-body').find('#_modal_proj_filmmakers')

    var name = input.val()

    var shooters = []
    if (name.trim() !== '') {
        if (name.includes('/')) {
            var names = name.split('/')
            for (var n of names) {
                n = n.trim()                
                if (n !== "") {
                    if(n.split(" ").length > 1){
                        var two_named = ''
                        for (var ns of n.split(" ")) {
                            ns = ns.trim().toLowerCase()
                            ns = ns.charAt(0).toUpperCase() + ns.slice(1)
                            two_named += ns + " "
                        }
                        n = two_named.trim()
                    }else{
                        n = n.toLowerCase()
                        n = n.charAt(0).toUpperCase() + n.slice(1)
                    }
                    
                }
                var link = `<a target="_blank" href="/partner/filmmaker/${hex_md5(n)}" class="text-white outline-none">${n}</a>`
                container.append(filmmaker_name_container.replace('$value', link).replace('$badge_id', `badge_${hex_md5(name)}`))
                $(`#modal_projview #filmmaker_${hex_md5(n)}`).remove()     
            }
        } else {
            var two_named = ''
            for (var ns of name.split(" ")) {
                ns = ns.trim().toLowerCase()
                ns = ns.charAt(0).toUpperCase() + ns.slice(1)
                two_named += ns + " "
            }
            name = two_named.trim()
            var link = `<a target="_blank" href="/partner/filmmaker/${hex_md5(name)}" class="text-white outline-none">${name}</a>`
            container.append(filmmaker_name_container.replace('$value', link).replace('$badge_id', `badge_${hex_md5(name)}`))
            $(`#modal_projview #filmmaker_${hex_md5(name)}`).remove()
        }
    }
    input.val('')
}

function toggleProjectModal(id) {
    var modal = $('#modal_projview')
    projectModalReset()
    if (id == 0) {
        modal.find('.modal-header .view-only').addClass('d-none')
        modal.find('#proj-view-title .title').text('Add New Project')
        modal.find('#proj-view-title .project_id').text('')
        modal.find('.modal-body form').attr('action', 'project/insert')

        modal.find('.modal-footer .proj_submit_btn').text('Create')
        modal.find('.modal-footer .proj_submit_btn').attr('onclick', 'createNewProject()')
        modal.find('.modal-footer .proj_cancel_btn').text('Cancel')

        modal.find('.proj_delete_btn').addClass('d-none')
        modal.find('.proj_reset_btn').removeClass('d-none')
        modal.find('.modal-footer .proj_submit_btn').removeAttr('disabled')
        modal.find('.actions-section').addClass('d-none')
        countProgressOutputs()

        setTimeout(function(){
            modal.find('#_modal_proj_name').focus()
        }, 500)
    } else {
        modal.find('.modal-header .view-only').removeClass('d-none')
        modal.find('.modal-footer .proj_submit_btn').text('Save Changes')
        modal.find('.modal-footer .proj_submit_btn').attr('onclick', 'updateProject("' + id + '")')
        modal.find('.modal-footer .proj_cancel_btn').text('Close')
        modal.find('.proj_delete_btn').removeClass('d-none')
        modal.find('.proj_reset_btn').addClass('d-none')
        modal.find('.actions-section').removeClass('d-none')
        modal.find('.modal-footer .proj_submit_btn').attr('disabled', true)
    }
    toggleDynamicPreEventMultiDay(true)
    modal.modal('show')
}

function projectModalReset() {
    var modal = $('#modal_projview')
    var systemdata = this.cvsystemdata
    var defaults = {
        allocation: systemdata.allocations[0],
        type: systemdata.project_types[0],
        status: systemdata.status_list,
    }
    
    modal.find('.modal-body .name-container .filmmaker').remove()
    modal.find('input[type="text"], input[type="date"], textarea').val('')
    modal.find('input[type="date"]').removeAttr('min')
    modal.find('input[type="date"]').removeAttr('max')

    modal.find('#_modal_proj_allocation').val(defaults.allocation.id)

    for( var s of defaults.status){
        if(modal.find('#_modal_proj_status').hasClass(`border-${s.color}`)){
            modal.find('#_modal_proj_status').removeClass(`border-${s.color}`)
        }
    }

    modal.find('#_modal_proj_status').val(defaults.status[0].id)
    modal.find('#_modal_proj_status').addClass(`border-${defaults.status[0].color}`)

    modal.find('._modal_proj_amounts').val('0.00')
    modal.find('.modal-body #_modal_proj_name').removeAttr("placeholder")
    modal.find('.form-check-input').prop('checked', false)

    modal.find('#_modal_proj_type').val(defaults.type.id)
    loadEventTypeTitles(defaults.type.type)

    modal.find('#_modal_proj_pre_event_date_end').removeAttr('min')
    modal.find('#_modal_proj_event_date').removeAttr('min')
    modal.find('.progress_outputs .form-check').remove()
    modal.find('.progress_outputs').closest('.card').find('.card-header b').text('Output Progress')
    modal.find('.card-user').remove()

    modal.find('#_modal_proj_suppliers tbody tr, #tbl_sub_events tr, .card-credit table tbody tr, .card-debit table tbody tr').remove()

    modal.find('.card-debit .budget-add-btn').click()
    modal.find('.card-credit .budget-add-btn').click()

    modal.find('#_modal_proj_head').val('N/A')

    modal.find(`#card-group-payment-status`).html(paystat.pending)
    modal.find(`#card-group-expenses .amount`).text(`${currencyFormat(0)}`)
    modal.find(`#card-group-revenue .amount`).text(`${currencyFormat(0)}`)
    modal.find(`#card-group-package-amount .amount`).text(`${currencyFormat(0)}`)
    modal.find(`#card-group-total-received .amount`).text(`${currencyFormat(0)}`)
    modal.find(`#card-group-remaining-balance .amount`).text(`${currencyFormat(0)}`)
    modal.find(`#card-group-remaining-balance`).closest('.card').remove()

    addNewSupplier()
    addSubEvent()

    return true
}

function changeStatusBorderColor(el){
    for( var stat of cvsystemdata.status_list){
        if($(el).hasClass(`border-${stat.color}`)){
            $(el).removeClass(`border-${stat.color}`)
        }
    }
    $(el).addClass(`border-${$(el).eq(0).find(`#stat-${$(el).val()}`).attr('color')}`)
}

function loadCVSystemData() {
    socket.emit('get-system-defaults', '', callback => {
        cvsystemdata = JSON.parse(callback)

        $('#modal_projview').find('datalist option, select option').remove()

        //Project Types
        for (var type of cvsystemdata.project_types) {
            $('#modal_projview').find('select.proj_type').append(`<option value="${type.id}">${type.type}</option>`)
        }

        //Status Lists
        for (var status of cvsystemdata.status_list) {
            $('#modal_projview').find('select.proj_status').append(`<option id="stat-${status.id}" value="${status.id}" color="${status.color}">${status.status}</option>`)
        }

        //Status Lists
        for (var alloc of cvsystemdata.allocations) {
            var values = []

            for (var a of alloc.allocation) {
                for (var user of cvsystemdata.users) {
                    if (user.id == a.user) {
                        a.user = user
                        values.push(`${a.user.name.first.split(' ')[0]} (${a.value}%)`)
                        break
                    }
                }
            }
            if (alloc.visible) {
                $('#modal_projview').find('select.proj_allocation').append(`<option value="${alloc.id}">${values.join("&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;")}</option>`)
            }
        }

        //Storage Drives
        $('#modal_projview').find('select.proj_drive_location').append("<option value=\"N/A\" selected>N/A</option>")
        for (var drive of cvsystemdata.storage_drives) {
            $('#modal_projview').find('select.proj_drive_location').append(`<option value="${drive.id}">${drive.id} / ${drive.type}</option>`)
        }

        //Project Head
        $('#modal_projview').find('select.proj_head').append("<option value=\"N/A\" selected>N/A</option>")
        for (var user of cvsystemdata.users) {
            if (user.id !== 'CVUSR000') {
                $('#modal_projview').find('select.proj_head').append(`<option value="${user.id}">${user.name.first} ${user.name.last}</option>`)
            }
        }

        $('#modal_projview .inclusions .form-check').remove()
        for (var output of cvsystemdata.inclusions) {
            var checkbox = `<div class="form-check d-sm-inline-block ml-3 mb-2"><input class="form-check-input checkbox _modal_proj_inclusions _chk${output.id}" data-id="${output.id}" onchange="addProgressOutput(this)" type="checkbox" value="${output.id}" name="proj_inclusions"><label class="form-check-label">${output.description}</label></div>`
            checkbox = checkbox.replace('Event', '<span class="_proj_event_type"></span>')
            checkbox = checkbox.replace('Wedding', '<span class="_proj_event_type"></span>')
            $('#modal_projview').find('.inclusions .card-body').append(checkbox)
        }

        name_list = "<datalist id=\"datalist_supplier\">"
        for (var supplier of cvsystemdata.datalists.suppliers.names) {
            name_list += `<option value="${supplier}"></option>`
        }
        name_list += "</datalist>"

        job_list = "<datalist id=\"datalist_jobs\">"
        for (var job of cvsystemdata.datalists.suppliers.jobs) {
            job_list += `<option value="${job}"></option>`
        }
        job_list += "</datalist>"

        for (var location of cvsystemdata.datalists.locations) {
            $('#modal_projview #locations').append(`<option value="${location}"></option>`)
        }

        for (var manpower of cvsystemdata.datalists.filmmakers) {
            $('#modal_projview #filmmakers').append(`<option id="filmmaker_${hex_md5(manpower.id)}" value="${manpower.name}"></option>`)
        }

        for (var budgdr of cvsystemdata.datalists.budget.debit) {
            $('#modal_projview #budget-debit-descriptions').append(`<option value="${budgdr}"></option>`)
        }

        for (var budgcr of cvsystemdata.datalists.budget.credit) {
            $('#modal_projview #budget-credit-descriptions').append(`<option value="${budgcr}"></option>`)
        }

        for (var se of cvsystemdata.datalists.sub_events) {
            $('#modal_projview #sub_event_list').append(`<option value="${se}"></option>`)
        }


        loadEventTypeTitles(cvsystemdata.project_types[0].type)

        setTimeout(function(){
            $('#_modal_page_loading').modal('hide')
        }, 1500)
    })
}

function convertModalValuesToOBJ() {
    var modal = $("#modal_projview"),
        array_suppliers = [],
        array_manpower = [],
        array_inclusions = [],
        proj_suppliers = [],
        proj_filmmakers = []

    //Grab Filmmakers
    modal.find('.filmmaker > .name-value').each(function() {
        if ($(this).text().trim() !== "") {
            var name = $(this).text()

            proj_filmmakers.push({
                id: hex_md5(name),
                name: name,
                dark_theme: false
            })

            array_manpower.push(hex_md5(name))
        }
    })

    //Grab Supplier Partners
    modal.find('#_modal_proj_suppliers tbody tr').each(function() {
        var cell = $(this).find('td input')

        if (cell.eq(0).val() !== '' && cell.eq(1).val() !== '') {
            proj_suppliers.push({
                job: cell.eq(0).val(),
                name: cell.eq(1).val(),
                id: hex_md5(cell.eq(1).val()),
                dark_theme: false
            })

            array_suppliers.push(hex_md5(cell.eq(1).val()))
        }
    })

    //Grab Selected Inclusions
    modal.find('.inclusions ._modal_proj_inclusions').each(function() {
        var inclusion = $(this)
        if (inclusion.prop('checked')) {            
            array_inclusions.push({
                id: inclusion.attr('data-id'),
                done : $(`.progress_outputs ._chk${inclusion.attr('data-id')}`).prop('checked')
            })
        }
    })

    var budget = []
    var budget_id = `BUDG-00`
    modal.find('.card-debit table tbody tr').each(function() {
        var amount = removeCurrencyFormat($(this).find('td').eq(2).find('input').val())
        var desc = $(this).find('td').eq(1).find('input').val()
        if (desc !== '') {
            budget_id = incrementStringID(budget_id, 5, 2)
            budget.push({
                id: budget_id,
                date: new Date(`${$(this).find('td').eq(0).find('input').val()} ${$(this).find('td').eq(0).find('input').attr('time')}`).getTime(),
                description: desc,
                amount: amount,
                type: 'dr'
            })
        }
    })

    modal.find('.card-credit table tbody tr').each(function() {
        var amount = removeCurrencyFormat($(this).find('td').eq(2).find('input').val())
        var desc = $(this).find('td').eq(1).find('input').val()
        if (desc !== '') {
            budget_id = incrementStringID(budget_id, 5, 2)
            budget.push({
                id: budget_id,
                date: new Date(`${$(this).find('td').eq(0).find('input').val()} ${$(this).find('td').eq(0).find('input').attr('time')}`).getTime(),
                description: desc,
                amount: amount,
                type: 'cr'
            })
        }
    })

    var sub_events = []
    var sub_event_id = `SUB-EV-00`
    modal.find('.additional-event-dates table tr').each(function() {
        var row = $(this)

        sub_event_id = incrementStringID(sub_event_id, 7, 2)

        var description = row.find('td').eq(0).find('input').val()
        var date = new Date(row.find('td').eq(1).find('input').val()).getTime()

        if(description !== '' && date !== null){
            sub_events.push(
                {
                    id: sub_event_id,
                    description: description,
                    date: date
                }
            )
        }
        
    })

    var createdObj = {
        type: modal.find("#_modal_proj_type").val(),
        allocation: modal.find('#_modal_proj_allocation').val(),
        notes: modal.find('#_modal_proj_notes').val(),
        direct: modal.find("#_modal_proj_direct_booking").prop("checked"),
        drive: (modal.find("#_modal_proj_drive_location").val() == 'N/A') ? null : modal.find("#_modal_proj_drive_location").val(),
        event_date: (modal.find("#_modal_proj_event_date").val() == '') ? null : new Date(modal.find("#_modal_proj_event_date").val()).getTime(),
        lead: (modal.find("#_modal_proj_head").val() == 'N/A') ? null : modal.find("#_modal_proj_head").val(),
        location: (modal.find("#_modal_proj_location").val() == '') ? null : modal.find("#_modal_proj_location").val(),
        title: (modal.find("#_modal_proj_name").val() == '') ? null : modal.find("#_modal_proj_name").val(),
        pre_event_dates: {
            workcation: modal.find("#_modal_proj_multiday").prop("checked"),
            end: (modal.find("#_modal_proj_pre_event_date_end").val() == '') ? null : new Date(modal.find("#_modal_proj_pre_event_date_end").val()).getTime(),
            start: (modal.find("#_modal_proj_pre_event_date_start").val() == '') ? null : new Date(modal.find("#_modal_proj_pre_event_date_start").val()).getTime()
        },
        sub_events: sub_events,
        status: parseInt(modal.find("#_modal_proj_status").val()),
        inclusions: array_inclusions,
        initial: (modal.find("#_modal_proj_initial").val() == '') ? 0 : removeCurrencyFormat(modal.find("#_modal_proj_initial").val()),
        package: (modal.find("#_modal_proj_package").val() == '') ? 0 : removeCurrencyFormat(modal.find("#_modal_proj_package").val()),
        suppliers: array_suppliers,
        budget: budget,
        manpower: array_manpower
    }

    return [createdObj, proj_suppliers, proj_filmmakers]
}

function projectModalChanges() {
    $('#modal_projview .modal-footer .proj_submit_btn').removeAttr('disabled')
}

function toggleDirectBooking(el) {
    var e = $(el)
    if (e.prop('checked')) {
        e.prop('checked', true)
        e.val(true)
    } else {
        e.prop('checked', false)
        e.val(false)
    }
}

function removeRow(e) {
    $(e).closest('tr').remove()
    projectModalChanges()
}

function changeEventType(element) {
    var e = $(element)

    var selectedText
    for (var type of cvsystemdata.project_types) {
        if (e.val() == type.id) {
            selectedText = type.type
        }
    }
    selectedText = (selectedText == 'Corporate') ? 'Event' : selectedText
    e.closest('.modal-body').find('._proj_event_type').text(selectedText)
}

function changesSuppliers(e) {
    var element = $(e)
    var job = element.val().toUpperCase()
    if (job.includes('COOR')) {
        $("#modal_projview #_modal_proj_suppliers #datalist_supplier option").remove()
        var name_options = ""
        for (var name of cvsystemdata.datalists.suppliers.coordinators) {
            name_options += "<option value=\"" + name + "\"></option>"
        }
        $("#modal_projview #_modal_proj_suppliers #datalist_supplier").append(name_options)
    }
    if (job.includes('PHOTO')) {
        $("#modal_projview #_modal_proj_suppliers #datalist_supplier option").remove()
        var name_options = ""
        for (var name of cvsystemdata.datalists.suppliers.photographers) {
            name_options += "<option value=\"" + name + "\"></option>"
        }
        $("#modal_projview #_modal_proj_suppliers #datalist_supplier").append(name_options)
    }
}


function alterBudgetRows(type, date, description, amount) {
    var is_dp = (description.toLowerCase().includes('initial') || description.toLowerCase().includes('down')) ? true : false;

    if(type == 'dr'){
        type = 'debit'
    }else if(type == 'cr'){
        type = 'credit'
    }

    var row = `
        <tr>
        <td class="pb-0">
            <input class="form-control-transparent" type="date" time="${$.format.date(new Date(date), 'HH:mm:ss')}" style="text-align: center!important;" value="${$.format.date(new Date(date), 'yyyy-MM-dd')}" placeholder="Enter Date">
        </td>
        <td class="pb-0">
            <input class="form-control-transparent" type="text" style="text-align: left!important;" list="${(type.toLowerCase() == 'debit') ? 'budget-debit-descriptions': 'budget-credit-descriptions'}" placeholder="Enter Description" value="${description}" ${is_dp ? `readonly`: ``}>
        </td>
        <td class="pb-0">
            <span style="position: absolute">₱</span><input class="form-control-transparent" list="desc_list" type="text" ${is_dp ? `readonly`: `onclick="this.select()" onblur="toggleCurrencyFormat(this, true)" onfocus="toggleCurrencyFormat(this, false)"`} style="text-align: right!important;" value="${currencyFormat(amount)}" placeholder="Enter amount">
        </td>
        <td class="p-0" style="width: 30px!important;">
            <button class="btn btn-sm btn-danger no-b-radius w-100 h-100" onclick="removeRow(this)">
                <svg class="c-icon">
                    <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use>
                </svg>
            </button>
        </td>  
        </tr>
        `

    $(`#modal_projview .card-${type} table tbody`).append(row)
}

function addBudgetRow(element, type) {
    var card = $(element).closest('.card')
    var row = `
        <tr>
            <td class="pb-0">
                <input class="form-control-transparent m-0" type="date" list="descriptions" style="text-align: center!important;" time="${$.format.date(new Date(), 'HH:mm:ss')}" value="${$.format.date(new Date(), 'yyyy-MM-dd')}" placeholder="Enter Date">
            </td>
            <td class="pb-0">
                <input class="form-control-transparent" type="text" style="text-align: left!important;" list="${(card.hasClass('card-debit')) ? 'budget-debit-descriptions': 'budget-credit-descriptions'}" placeholder="Enter Description">
            </td>
            <td class="pb-0">
                <span style="position: absolute">₱</span><input class="form-control-transparent" autocomplete="off" type="text" style="text-align: right!important;" value="0.00" placeholder="Enter amount" onclick="this.select()" onblur="toggleCurrencyFormat(this, true)" onfocus="toggleCurrencyFormat(this, false)">
            </td>
            <td class="p-0" style="width: 30px!important;">
                <button class="btn btn-sm btn-danger no-b-radius w-100 h-100" onclick="removeRow(this)">
                    <svg class="c-icon">
                        <use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use>
                    </svg>
                </button>
            </td>
        </tr>
        `
    card.find('table tbody').append(row)
    projectModalChanges()
}

function reloadModalDatalists() {
    socket.emit('get-system-defaults', '', callback => {
        cvsystemdata = JSON.parse(callback)

        $('#modal_projview').find('#list_jobs option, #list_suppliers option, #filmmakers option, #locations option').remove()

        name_list = "<datalist id=\"datalist_supplier\">"
        for (var supplier of cvsystemdata.datalists.suppliers.names) {
            name_list += `<option value="${supplier}"></option>`
        }
        name_list += "</datalist>"

        job_list = "<datalist id=\"datalist_jobs\">"
        for (var job of cvsystemdata.datalists.suppliers.jobs) {
            job_list += `<option value="${job}"></option>`
        }
        job_list += "</datalist>"

        for (var location of cvsystemdata.datalists.locations) {
            $('#modal_projview #locations').append(`<option value="${location}"></option>`)
        }

        for (var manpower of cvsystemdata.datalists.filmmakers) {
            $('#modal_projview #filmmakers').append(`<option id="filmmaker_${hex_md5(manpower.id)}" value="${manpower.name}"></option>`)
        }
    })
}

function createNewProject() {
    var projdata = convertModalValuesToOBJ()[0]
    if(projdata.event_date !== null || projdata.pre_event_dates.start !== null){
        socket.emit('create-project', JSON.stringify(convertModalValuesToOBJ()), callback => {
            var data = JSON.parse(callback)
            if (data !== null) {
                if (data.title !== null) {
                    showToast('Success', 'Project <b>' + data.id + ' / ' + data.title + '</b> has been added successfully.', 'success')
                } else {
                    showToast('Success', 'Project <b>' + data.id + '</b> has been added successfully.', 'success')
                }
                $("#modal_projview").modal('hide')
            }
        })
    }else{
        showToast('Error', `Please provide date for the event.`, 'error')
        $("#modal_projview #_modal_proj_event_date").trigger('focus')
    }
    

}

function updateProject(id) {
    var projdata = convertModalValuesToOBJ()[0]
    if(projdata.event_date !== null || projdata.pre_event_dates.start !== null){
        socket.emit('update-project', [id, JSON.stringify(convertModalValuesToOBJ())], callback => {
            var data = JSON.parse(callback)
            if (data !== null) {
                if (data.title !== null) {
                    showToast('Success', 'Project <b>' + data.id + ' / ' + data.title + '</b> has been updated.', 'success')
                } else {
                    showToast('Success', 'Project <b>' + data.id + '</b> has been updated.', 'success')
                }
                previewProject(data.id)
            }
        })
    }else{
        showToast('Error', `Please provide date for the event.`, 'error')
        $("#modal_projview #_modal_proj_event_date").trigger('focus')
    }
}


function confirmAction(msg) {
    var obj = current_project
    var confirmModal = $('#modal_confirm')

    $('#modal_projview').modal('hide')
    confirmModal.modal('show')

    if (obj.title !== null) {
        msg = msg.replace('*', "<b>" + obj.id + " / " + obj.title + "</b>")
    } else {
        msg = msg.replace('*', "<b>" + obj.id + "</b>")
    }

    msg = msg.replace('?', "?&nbsp;")

    confirmModal.find('.modal-title').text("Confirm")
    confirmModal.find('.modal-body').html(msg)

    confirmModal.find('.yes-btn').attr("onclick", "deleteProject()")
    confirmModal.find('.yes-btn').attr("data-dismiss", "modal")
}

function deleteProject() {
    var data = current_project
    socket.emit('delete-project', data.id, callback => {
        var response = JSON.parse(callback)
        if (response !== null) {
            if (data.title == null) {
                showToast('Success', 'Project <b>' + data.id + '</b> has been deleted successfully.', 'success')
            } else {
                showToast('Success', 'Project <b>' + data.id + ' / ' + data.title + '</b> has been deleted successfully.', 'success')
            }
            loadWidgetsData()
        } else {
            showToast('Error', 'Something went wrong.', 'error')
        }
    })
}

function countProjects() {
    socket.emit('get-project-all', '', callback => {
        var projects = JSON.parse(callback)
        if (projects.length > 0) {
            $('.c-sidebar .c-sidebar-nav-dropdown-items .sidebar-projects-hideable').css(`display`, `block`)
        } else {
            $('.c-sidebar .c-sidebar-nav-dropdown-items .sidebar-projects-hideable').css(`display`, `none`)
            
            if(page == 'Projects/Yearly' || page == 'Projects/Monthly' || page == 'Projects/Current'){
                location.replace('/projects/all')
            }else if(page == 'Budget/Current' || page == 'Budget/All'){
                location.replace('/budget/expenses')
            }
        }
    })
}

function reloadTasklist(){
    socket.emit('get-user-projects', sessioned_user.id, callback => {
        var projects = JSON.parse(callback)

        tasklist_table.fnClearTable()

        var priority = {
            STD: 1,
            PEF: 2,
            SDE: 3,
            FED: 4,
        }

        var deadlines = {
            STD: 3,
            PEF: 2,
            SDE: 5,
            FED: 90,
        }

        var tasks = []

        if(projects.length > 0){
            var included = 0
            for (var project of projects) {

                for(var i of project.inclusions){
                    deadlines.PEF = 2
                    if(i.id === 'CVO001'){
                        deadlines.PEF = 1
                        break
                    }
                }

                if(project.inclusions.length > 0){
                    var status = project.status.status.toLowerCase()
                    if(status == 'confirmed' || status == 'pending' || status == 'active' || status == 'current'){
                        included++

                        if(project.inclusions.length == 1 && project.inclusions[0].code == 'PEF'){
                            project.event_date = project.pre_event_dates.start
                        }

                        if (project.title !== null && project.type.type.toLowerCase() == 'debut') {
                            project.title = `${project.title.split(' ')[0]} XVIII`
                        } else {
                            project.title = project.title
                        }

                        if(project.title == null && !project.direct){
                            for(var supp of project.suppliers){
                                if(supp.job.toLowerCase().includes('coord')){
                                    project.title = `[ ${supp.name} ]`
                                    break
                                }
                            }
                        }else if(project.title == null && project.direct){
                            project.title = `[ CV ${project.status.status} Event ]`
                        }

                        var proj_inclusions = []
                        for(var inc of project.inclusions){
                            var deadline = 0
                            proj_inclusions.push(inc.code)
                            
                            if(inc.code == 'STD'){
                                deadline = Math.round(((project.event_date - (day_in_milliseconds * deadlines.STD)) - new Date().getTime()) / day_in_milliseconds)
                            }else if(inc.code == 'PEF'){
                                deadline = Math.round(((project.event_date - (day_in_milliseconds * deadlines.PEF)) - new Date().getTime()) / day_in_milliseconds)
                            }else if(inc.code == 'SDE'){
                                deadline = Math.round(((project.event_date + (day_in_milliseconds * deadlines.SDE)) - new Date().getTime()) / day_in_milliseconds)
                            }else if(inc.code == 'FED'){
                                if(new Date().getTime() > project.event_date){
                                    deadline = Math.round(((project.event_date + (day_in_milliseconds * deadlines.FED)) - new Date().getTime()) / day_in_milliseconds)
                                }
                            }
                            
                            if(inc.code != 'SDE' && !inc.done && !inc.code.includes('DR')){
                                if($.format.date(new Date(), 'yyyy-MM-dd') > $.format.date(new Date(project.event_date), 'yyyy-MM-dd') && inc.code == 'FED'){
                                    tasks.push([
                                        inc.code,
                                        deadline,
                                        project.id,
                                        project.title,
                                        project.event_date,
                                        false,
                                        project.type.type
                                    ])
                                }else if(inc.code == 'PEF' && Math.round(Math.abs(new Date(project.event_date) - new Date()) / day_in_milliseconds) <= 14){
                                    tasks.push([
                                        inc.code,
                                        deadline,
                                        project.id,
                                        project.title,
                                        project.event_date,
                                        false,
                                        project.type.type
                                    ])                                    
                                }else if(inc.code == 'STD' && Math.round(Math.abs(new Date(project.event_date) - new Date()) / day_in_milliseconds) <= 14){
                                    tasks.push([
                                        inc.code,
                                        deadline,
                                        project.id,
                                        project.title,
                                        project.event_date,
                                        false,
                                        project.type.type
                                    ])                                    
                                }
                            }else if (inc.code == 'SDE' && !inc.done && $.format.date(new Date(), 'yyyy-MM-dd') > $.format.date(new Date(project.event_date), 'yyyy-MM-dd')){
                                tasks.push([
                                    inc.code,
                                    deadline,
                                    project.id,
                                    project.title,
                                    project.event_date,
                                    false,
                                    project.type.type
                                ])
                            }
                            
                        }
                    }                    
                }
            }
            tasks.sort(function(a, b) {
                return a[4] - b[4]
            })
            
            tasks.sort(function(a, b) {
                return a[1] - b[1]
            })

            tasks.sort(function(a, b) {
                return priority[a[0]] - priority[b[0]]
            })
            
            if(included > 0){
                $(`#dashboard-tasklist`).removeClass('d-none')
                $(`#dashboard-tasklist`).addClass('col-md-12 col-lg-4 pb-4')
                $(`#dashboard-main-progress`).addClass('col-sm-12 col-lg-8')
            }else{
                $(`#dashboard-tasklist`).addClass('d-none')
                $(`#dashboard-tasklist`).removeClass('col-md-12 col-lg-4 pb-4')
                $(`#dashboard-main-progress`).removeClass('col-sm-12 col-lg-8')
            }
            
            for(var task of tasks){
                if(task[1] == 1){
                    task[1] = `Tomorrow`
                }else if(task[1] > 31){
                    var months = Math.round(task[1] / 31)
                    task[1] = (months > 1) ? `${months} Months & ${task[1] % 31} Days`:`${months} Month & ${task[1] % 31} Day`
                }else if (task[1] <= 31){
                    if(task[1] == 0){
                        task[1] = `Today`
                    }else if(task[1] < 0){
                        var days = Math.round(task[1] * (-1))

                        if(days <= 31){
                            if(days > 7){
                                var weeks = Math.round(days / 7)
                                if(weeks > 1){
                                    task[1] = `<span class="text-danger font-weight-bold">OD</span> (${weeks} Weeks)`
                                }else{
                                    task[1] = `<span class="text-danger font-weight-bold">OD</span> (${weeks} Week)`
                                }
                            }else{
                                if(days > 1){
                                    task[1] = `<span class="text-danger font-weight-bold">OD</span> (${days} Days)`
                                }else{
                                    task[1] = `<span class="text-danger font-weight-bold">OD</span> (${days} Day)`
                                }
                            }
                        }else{
                            var months = Math.round(task[1] * (-1) / 31)
                            if(months > 1){
                                task[1] = `<span class="text-danger font-weight-bold">OD</span> (${months} Months)`
                            }else{
                                task[1] = `<span class="text-danger font-weight-bold">OD</span> (${months} Month)`
                            }
                        }
                        
                        
                    }else if(task[1] >= 7){
                        if(Math.round(task[1] / 7) == 1){
                            task[1] = '1 Week'
                        }else if(Math.round(task[1] / 7) > 1){
                            task[1] = `${Math.round(task[1] / 7)} Weeks & ${(Math.round(task[1] % 7) > 1) ? `${Math.round(task[1] % 7)} Days`:`${Math.round(task[1] % 7)} Day`}`
                        }else{
                            task[1] = `${Math.round(task[1] / 7)} Week & ${(Math.round(task[1] % 7) > 1) ? `${Math.round(task[1] % 7)} Days`:`${Math.round(task[1] % 7)} Day`}`
                        }
                    }else if(task[1] < 7){
                        task[1] = (task[1] > 1) ? `${task[1]} Days`: `${task[1]} Day`
                    }
                }

                if(task[0] === 'PEF' || task[0] === 'FED' || task[0] === 'EVF'){
                    if(task[6] === 'Wedding'){
                        if(task[0] === 'EVF'){
                            task[0] = task[0].replace('EV', 'WD')
                        }else{
                            task[0] = task[0].replace('E', 'W')                                        
                        }                  
                    }else if(task[6] === 'Debut'){
                        if(task[0] === 'EVF'){
                            task[0] = task[0].replace('EV', 'DB')
                        }else{
                            task[0] = task[0].replace('E', 'D')
                        }
                    }                                
                }

                var arraydata = [
                    task[2],
                    task[3],
                    `<b>${task[0]}</b>`,
                    task[1]
                ]

                tasklist_table.fnAddData(arraydata)
            }
        }else{
            $(`#dashboard-tasklist`).addClass('d-none')
            $(`#dashboard-tasklist`).removeClass('col-md-12 col-lg-4 pb-4')
            $(`#dashboard-main-progress`).removeClass('col-sm-12 col-lg-8')
        }
    })
}

function addSubEvent(description, date){

    date = (date === undefined) ? '': $.format.date(new Date(date), 'yyyy-MM-dd')
    description = (description === undefined) ? '': description

    var row = `
    <tr>
        <td class="col-8 py-1 px-1">
            <input class="form-control" type="text" list="sub_event_list" value="${description}" placeholder="Enter Short Description">
        </td>
        <td class="col-4 py-1 px-1">
            <input class="form-control" type="date" value="${date}">
        </td>
        <td class="py-1 px-1">
            <button class="btn btn-danger btn-sm" onclick="removeRow(this)"><svg class="c-icon"><use xlink:href="vendors/@coreui/icons/svg/free.svg#cil-x"></use></svg></button>
        </td>
    </tr>
    `

    $('.additional-event-dates table').append(row)
}

function isProjectDone(proj){
    var rec = 0,
    exp = 0,
    today = new Date(),
    event = new Date(proj.event_date),
    packge = proj.package,
    result = null

    for (var budg of proj.budget){
        var t = budg.type
        if(t == 'cr'){
            exp += budg.amount
        }else if(t == 'dr'){
            rec += budg.amount
        }
    }

    if(today > event && rec >= packge){
        result = true
    }else{
        result = false
    }

    return result
}