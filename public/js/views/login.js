$(document).ready(function() {
    setTimeout(function() {
        document.body.classList.remove('c-no-layout-transition')
    }, 2000)

    $(document).on('click', '#btn_login', function() {
        var logindata = {
            username: $('#text-username').val(),
            password: $('#text-password').val()
        }

        socket.emit('auth-login', logindata, callback => {
            var result = JSON.parse(callback)

            if (result) {
                $('#form-login').submit()
            } else {
                showToast('Error', 'Username and password do not match.', 'error')
            }
        })
    })
})

if (params.get('d') == 1) {
    $('.c-app').addClass('c-dark-theme')
    $('#login-brand').attr('src', "logo/cv-logo-white.png")
} else {
    $('#login-brand').attr('src', "logo/cv-logo-dark.png")
    $('.c-app').removeClass('c-dark-theme')
}