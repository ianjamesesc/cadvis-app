//Imports
const express = require('express')
const app = express()

var http = require("http").createServer(app);
var io = require("socket.io")(http);

const bodyParser = require('body-parser')
require('dotenv').config()
var cookieParser = require('cookie-parser')
const session = require('express-session')
const redis = require('redis')
const redisStore = require('connect-redis')(session)
const client = redis.createClient()
const fs = require('fs')
const path = require('path')
const multer = require('multer')

const crypto = require('crypto-js')

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },

    // By default, multer removes file extensions so let's add them back
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

var dateFormat = require("dateformat")

const r = require('rethinkdbdash')({
    host: process.env.DBHOST,
    port: process.env.DBPORT,
    user: process.env.DBUSER,
    password: process.env.DBPASS
})

//Set Views
app.set('views', './views')
app.set('view engine', 'ejs')

const unique = (value, index, self) => {
    return self.indexOf(value) === index
}

const urlencodedParser = bodyParser.urlencoded({ extended: false })
const database = process.env.DBNAME


app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'))
app.use('/css', express.static(__dirname + '/public/css'))
app.use('/js', express.static(__dirname + '/public/js'))
app.use('/images', express.static(__dirname + '/public/assets/images'))
app.use('/logo', express.static(__dirname + '/public/assets/logos'))
app.use('/vendors', express.static(__dirname + '/public/vendors'))
app.use('/layouts', express.static(__dirname + '/views/layouts'))
app.use('/modals', express.static(__dirname + '/views/modals'))
app.use('/resources', express.static(__dirname + '/views/resources'))
app.use('/modules', express.static(__dirname + '/node_modules'))

app.use('/*/css', express.static(__dirname + '/public/css'))
app.use('/*/js', express.static(__dirname + '/public/js'))
app.use('/*/images', express.static(__dirname + '/public/assets/images'))
app.use('/*/logo', express.static(__dirname + '/public/assets/logos'))
app.use('/*/vendors', express.static(__dirname + '/public/vendors'))
app.use('/*/layouts', express.static(__dirname + '/views/layouts'))
app.use('/*/modals', express.static(__dirname + '/views/modals'))
app.use('/*/resources', express.static(__dirname + '/views/resources'))
app.use('/*/modules', express.static(__dirname + '/node_modules'))


http.listen(process.env.PORT, () => {
    console.log("This server is listening on port " + process.env.PORT + '.');
})




/*
█▀▀ █▀▀█ █▀▀ █░█ █▀▀ ▀▀█▀▀ █▀▀
▀▀█ █░░█ █░░ █▀▄ █▀▀ ░░█░░ ▀▀█
▀▀▀ ▀▀▀▀ ▀▀▀ ▀░▀ ▀▀▀ ░░▀░░ ▀▀▀
*/

r.db(database).table('cv_projects').changes().run()
    .then(function(cursor) {
        cursor.each(function(err, row) {
            if (err) {
                throw err;
            } else {
                //Project Inserted
                if (row.new_val !== null && row.old_val === null) {
                    var proj = row.new_val
                    r.db(database).table('cv_percentage_allocation').get(proj.allocation).run()
                        .then(function(allocation) {

                            r.db(database).table('cv_projects_status_list').get(proj.status).run()
                                .then(function(status) {

                                    r.db(database).table('cv_project_types').get(proj.type).run()
                                        .then(function(type) {

                                            r.db(database).table('cv_users').without('password').run()
                                                .then(function(users) {

                                                    r.db(database).table('cv_outputs').run()
                                                        .then(function(outputs) {

                                                            r.db(database).table('cv_partner_suppliers').run()
                                                                .then(function(suppliers) {

                                                                    r.db(database).table('cv_filmmakers').run()
                                                                        .then(function(filmmakers) {

                                                                            for (var s in proj.suppliers) {
                                                                                for (var su of suppliers) {
                                                                                    if (proj.suppliers[s] == su.id) {
                                                                                        proj.suppliers[s] = su
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var f in proj.manpower) {
                                                                                for (var fi of filmmakers) {
                                                                                    if (proj.manpower[f] == fi.id) {
                                                                                        proj.manpower[f] = fi
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var i in proj.inclusions) {
                                                                                for (var o of outputs) {
                                                                                    if (proj.inclusions[i].id == o.id) {
                                                                                        proj.inclusions[i].code = o.code
                                                                                        proj.inclusions[i].description = o.description
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var u of users) {
                                                                                if (proj.lead == u.id) {
                                                                                    proj.lead = u
                                                                                }
                                                                            }

                                                                            proj.type = type
                                                                            proj.status = status
                                                                            proj.allocation = allocation

                                                                            io.emit('project-inserted', JSON.stringify(proj))

                                                                        })
                                                                })
                                                        })

                                                })
                                        })
                                })
                        })

                }
                //Project Updated
                else if (row.new_val !== null && row.old_val !== null) {
                    var proj = row.new_val
                    r.db(database).table('cv_percentage_allocation').get(proj.allocation).run()
                        .then(function(allocation) {

                            r.db(database).table('cv_projects_status_list').get(proj.status).run()
                                .then(function(status) {

                                    r.db(database).table('cv_project_types').get(proj.type).run()
                                        .then(function(type) {

                                            r.db(database).table('cv_users').without('password').run()
                                                .then(function(users) {

                                                    r.db(database).table('cv_outputs').run()
                                                        .then(function(outputs) {

                                                            r.db(database).table('cv_partner_suppliers').run()
                                                                .then(function(suppliers) {

                                                                    r.db(database).table('cv_filmmakers').run()
                                                                        .then(function(filmmakers) {

                                                                            for (var s in proj.suppliers) {
                                                                                for (var su of suppliers) {
                                                                                    if (proj.suppliers[s] == su.id) {
                                                                                        proj.suppliers[s] = su
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var f in proj.manpower) {
                                                                                for (var fi of filmmakers) {
                                                                                    if (proj.manpower[f] == fi.id) {
                                                                                        proj.manpower[f] = fi
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var i in proj.inclusions) {
                                                                                for (var o of outputs) {
                                                                                    if (proj.inclusions[i].id == o.id) {
                                                                                        proj.inclusions[i].code = o.code
                                                                                        proj.inclusions[i].description = o.description
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var u of users) {
                                                                                if (proj.lead == u.id) {
                                                                                    proj.lead = u
                                                                                }
                                                                            }

                                                                            proj.type = type
                                                                            proj.status = status
                                                                            proj.allocation = allocation

                                                                            io.emit('project-updated', JSON.stringify(proj))

                                                                        })
                                                                })
                                                        })

                                                })
                                        })
                                })
                        })
                }
                //Project Deleted
                else if (row.new_val === null && row.old_val !== null) {
                    io.emit('project-deleted', JSON.stringify(row.old_val))
                }
                checkTodayShoot()
            }
        });
    })

r.db(database).table('cv_expenses').changes().run()
    .then(function(cursor) {
        cursor.each(function(err, row) {
            if (err) {
                throw err;
            } else {
                //Expense Inserted
                if (row.new_val !== null && row.old_val === null) {
                    io.emit('expense-inserted', JSON.stringify(row.new_val))
                }
                //Expense Updated
                else if (row.new_val !== null && row.old_val !== null) {
                    io.emit('expense-updated', JSON.stringify(row.new_val))
                }
                //Expense Deleted
                else if (row.new_val === null && row.old_val !== null) {
                    io.emit('expense-deleted', JSON.stringify(row.old_val))
                }
                checkTodayShoot()
            }
        });
    })

r.db(database).table('cv_user_schedule').changes().run()
    .then(function(cursor) {
        cursor.each(function(err, row) {
            if (err) {
                throw err;
            } else {
                //Expense Inserted
                if (row.new_val !== null && row.old_val === null) {
                    io.emit('user-schedule-inserted', JSON.stringify(row.new_val))
                }
                //Expense Updated
                else if (row.new_val !== null && row.old_val !== null) {
                    io.emit('user-schedule-updated', JSON.stringify(row.new_val))
                }
                //Expense Deleted
                else if (row.new_val === null && row.old_val !== null) {
                    io.emit('user-schedule-deleted', JSON.stringify(row.old_val))
                }
                checkTodayShoot()
            }
        });
    })


var todays_date = new Date(dateFormat(new Date(), 'yyyy-mmm-dd')).getTime()
setInterval(function() {
    var now = new Date(dateFormat(new Date(), 'yyyy-mmm-dd')).getTime()
    if (todays_date !== now) {
        checkTodayShoot()
        todays_date = new Date(dateFormat(new Date(), 'yyyy-mmm-dd')).getTime()
    }
}, 60000)

io.sockets.on('connection', (socket, callback) => {

    checkTodayShoot()

    socket.on('auth-login', (logindata, callback) => {
        r.db(database).table('cv_users').filter(
            r.row('username').eq(logindata.username).or(
                r.row('email').eq(logindata.username).or(
                    r.row('mobile').eq(logindata.username).or(
                        r.row('facebook').eq(logindata.username)
                    )
                )
            ).and(
                r.row('password').eq(sha256(logindata.password))
            ).and(
                r.row('login').eq(true)
            )
        ).limit(1).run().then(function(data) {
            if (data.length > 0) {
                callback(JSON.stringify(true))
            } else {
                callback(JSON.stringify(false))
            }
        })
    })

    socket.on('create-project', (data, callback) => {
        data = JSON.parse(data)
        var postdata = data[0]
        var suppliers = data[1]
        var filmmakers = data[2]


        r.db(database).table('cv_projects').orderBy(r.desc('id')).pluck('id').limit(1).run()
            .then(function(result) {

                var last_id = (result.length > 0) ? result[0].id : ''

                if (last_id.substring(3, 5) !== dateFormat(new Date(), 'yy')) {
                    result = ''
                }

                if (result == '') {
                    postdata.id = incrementStringID(`CVP${dateFormat(new Date(), 'yy')}000`, 3, 5)
                } else {
                    postdata.id = incrementStringID(last_id, 3, 5)
                }

                postdata.date_created = new Date().getTime()

                var budget_id = `BUDG-00`
                if (postdata.initial > 0) {
                    if (postdata.budget.length > 0) {
                        budget_id = incrementStringID(postdata.budget[postdata.budget.length - 1].id, 5, 2)
                    } else {
                        budget_id = incrementStringID(budget_id, 5, 2)
                    }
                    postdata.budget.push({
                        id: budget_id,
                        date: new Date().getTime(),
                        description: 'Down Payment',
                        amount: postdata.initial,
                        type: 'debit'
                    })
                }

                r.db(database).table('cv_filmmakers').insert(filmmakers).run()
                    .then(function(fl) {})
                    .catch((err) => {})

                r.db(database).table('cv_partner_suppliers').insert(suppliers).run()
                    .then(function(sp) {})
                    .catch((err) => {})

                //Insert Final Object to Database
                r.db(database).table('cv_projects').insert(postdata).run()
                    .then(function(pr) {
                        callback(JSON.stringify(postdata))
                    })
            })
    })

    socket.on('update-project', ([id, data], callback) => {
        data = JSON.parse(data)
        var postdata = data[0]
        var suppliers = data[1]
        var filmmakers = data[2]
        postdata.id = id

        r.db(database).table('cv_projects').get(id).run()
            .then(function(proj_to_be_updated) {

                var has_initial_payment = {}

                for (var budg of postdata.budget) {
                    if (budg.type == 'debit' && budg.description.toLowerCase().includes('initial') || budg.description.toLowerCase().includes('down pay')) {
                        has_initial_payment = budg
                        break
                    }
                }

                if (proj_to_be_updated.initial == 0 && postdata.initial > 0) {
                    postdata.budget.push({
                        type: 'debit',
                        date: new Date().getTime(),
                        description: 'Down Payment',
                        amount: postdata.initial
                    })
                } else if (proj_to_be_updated.initial == 0 && has_initial_payment.amount > 0) {
                    postdata.initial = has_initial_payment.amount
                }

                r.db(database).table('cv_filmmakers').insert(filmmakers).run()
                    .then(function(fl) {})
                    .catch((err) => {})


                r.db(database).table('cv_partner_suppliers').insert(suppliers).run()
                    .then(function(sp) {})
                    .catch((err) => {})


                //Insert Final Object to Database
                r.db(database).table('cv_projects').get(id).update(postdata).run()
                    .then(function(generated) {


                        callback(JSON.stringify(postdata))
                    })
            })
    })

    socket.on('delete-project', (id, callback) => {
        //Delete Object from Database
        r.db(database).table('cv_projects').get(id).delete().run()
            .then(function(deleted) {
                callback(JSON.stringify(deleted))
            }).catch((err) => {
                callback(null)
            })
    })

    socket.on('update-project-budget', (obj, callback) => {
        //Delete Object from Database
        r.db(database).table('cv_projects').get(obj.id).run()
            .then(function(project) {

                r.db(database).table('cv_projects').get(obj.id).update({ budget: obj.budget }).run()
                    .then(function(updated) {
                        callback(JSON.stringify({
                            status: 200,
                            project: project,
                        }))
                    })
            }).catch((err) => {
                callback(null)
            })
    })


    socket.on('get-project-all', (value, callback) => {
        r.db(database).table('cv_projects').orderBy(r.desc('id')).run()
            .then(function(cv_projects) {

                r.db(database).table('cv_percentage_allocation').run()
                    .then(function(allocation) {

                        r.db(database).table('cv_projects_status_list').run()
                            .then(function(status) {

                                r.db(database).table('cv_project_types').run()
                                    .then(function(types) {

                                        r.db(database).table('cv_users').without('password').run()
                                            .then(function(users) {

                                                r.db(database).table('cv_outputs').run()
                                                    .then(function(outputs) {

                                                        r.db(database).table('cv_partner_suppliers').run()
                                                            .then(function(suppliers) {

                                                                r.db(database).table('cv_filmmakers').run()
                                                                    .then(function(filmmakers) {

                                                                        for (var proj of cv_projects) {
                                                                            for (var a of allocation) {
                                                                                if (a.id === proj.allocation) {
                                                                                    proj.allocation = a
                                                                                    break
                                                                                }
                                                                            }

                                                                            for (var user of users) {
                                                                                if (proj.lead === user.id) {
                                                                                    proj.lead = user
                                                                                    break
                                                                                }
                                                                            }

                                                                            for (var s in proj.suppliers) {
                                                                                for (var su of suppliers) {
                                                                                    if (proj.suppliers[s] === su.id) {
                                                                                        proj.suppliers[s] = su
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var f in proj.manpower) {
                                                                                for (var fi of filmmakers) {
                                                                                    if (proj.manpower[f] === fi.id) {
                                                                                        proj.manpower[f] = fi
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var i in proj.inclusions) {
                                                                                for (var o of outputs) {
                                                                                    if (proj.inclusions[i].id === o.id) {
                                                                                        proj.inclusions[i].code = o.code
                                                                                        proj.inclusions[i].description = o.description
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var t of types) {
                                                                                if (proj.type === t.id) {
                                                                                    proj.type = t
                                                                                    break
                                                                                }
                                                                            }

                                                                            for (var stat of status) {
                                                                                if (proj.status === stat.id) {
                                                                                    proj.status = stat
                                                                                    break
                                                                                }
                                                                            }
                                                                        }

                                                                        callback(JSON.stringify(cv_projects))

                                                                    })
                                                            })
                                                    })

                                            })
                                    })
                            })
                    })
            })
    })

    socket.on('get-project-all-this-year', (value, callback) => {
        r.db(database).table('cv_projects').filter(function(proj) {
                return r.or(proj('event_date').eq(null), r.and(proj('event_date').div(1000).ge(
                    r.time(r.now().year(), 1, 1, 'Z').toEpochTime()
                ), proj('event_date').div(1000).le(
                    r.time(r.now().year(), 12, 31, 'Z').toEpochTime()
                )))
            }).orderBy('event_date').run()
            .then(function(cv_projects) {

                r.db(database).table('cv_percentage_allocation').run()
                    .then(function(allocation) {

                        r.db(database).table('cv_projects_status_list').run()
                            .then(function(status) {

                                r.db(database).table('cv_project_types').run()
                                    .then(function(types) {

                                        r.db(database).table('cv_users').without('password').run()
                                            .then(function(users) {

                                                r.db(database).table('cv_outputs').run()
                                                    .then(function(outputs) {

                                                        r.db(database).table('cv_partner_suppliers').run()
                                                            .then(function(suppliers) {

                                                                r.db(database).table('cv_filmmakers').run()
                                                                    .then(function(filmmakers) {

                                                                        for (var proj of cv_projects) {

                                                                            if (proj.event_date == null && proj.inclusions.length <= 2) {
                                                                                proj.event_date = proj.pre_event_dates.start
                                                                            }

                                                                            for (var a of allocation) {
                                                                                if (a.id == proj.allocation) {
                                                                                    proj.allocation = a
                                                                                    break
                                                                                }
                                                                            }

                                                                            for (var user of users) {
                                                                                if (proj.lead == user.id) {
                                                                                    proj.lead = user
                                                                                    break
                                                                                }
                                                                            }

                                                                            for (var s in proj.suppliers) {
                                                                                for (var su of suppliers) {
                                                                                    if (proj.suppliers[s] == su.id) {
                                                                                        proj.suppliers[s] = su
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var f in proj.manpower) {
                                                                                for (var fi of filmmakers) {
                                                                                    if (proj.manpower[f] == fi.id) {
                                                                                        proj.manpower[f] = fi
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var i in proj.inclusions) {
                                                                                for (var o of outputs) {
                                                                                    if (proj.inclusions[i].id == o.id) {
                                                                                        proj.inclusions[i].code = o.code
                                                                                        proj.inclusions[i].description = o.description
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var t of types) {
                                                                                if (proj.type == t.id) {
                                                                                    proj.type = t
                                                                                    break
                                                                                }
                                                                            }

                                                                            for (var stat of status) {
                                                                                if (proj.status == stat.id) {
                                                                                    proj.status = stat
                                                                                    break
                                                                                }
                                                                            }
                                                                        }

                                                                        callback(JSON.stringify(cv_projects))

                                                                    })
                                                            })
                                                    })

                                            })
                                    })
                            })
                    })
            })
    })

    socket.on('get-project-current', (value, callback) => {
        r.db(database).table('cv_projects').filter(function(project) {
                return project('status').ne(9)
                    .and(project('status').ne(2))
                    .and(project('status').ne(5))
            }).run()
            .then(function(cv_projects) {

                r.db(database).table('cv_percentage_allocation').run()
                    .then(function(allocation) {

                        r.db(database).table('cv_projects_status_list').run()
                            .then(function(status) {

                                r.db(database).table('cv_project_types').run()
                                    .then(function(types) {

                                        r.db(database).table('cv_users').without('password').run()
                                            .then(function(users) {

                                                r.db(database).table('cv_outputs').run()
                                                    .then(function(outputs) {

                                                        r.db(database).table('cv_partner_suppliers').run()
                                                            .then(function(suppliers) {

                                                                r.db(database).table('cv_filmmakers').run()
                                                                    .then(function(filmmakers) {

                                                                        for (var proj of cv_projects) {
                                                                            for (var a of allocation) {
                                                                                if (a.id === proj.allocation) {
                                                                                    proj.allocation = a
                                                                                    break
                                                                                }
                                                                            }

                                                                            for (var user of users) {
                                                                                if (proj.lead === user.id) {
                                                                                    proj.lead = user
                                                                                    break
                                                                                }
                                                                            }

                                                                            for (var s in proj.suppliers) {
                                                                                for (var su of suppliers) {
                                                                                    if (proj.suppliers[s] === su.id) {
                                                                                        proj.suppliers[s] = su
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var f in proj.manpower) {
                                                                                for (var fi of filmmakers) {
                                                                                    if (proj.manpower[f] === fi.id) {
                                                                                        proj.manpower[f] = fi
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var i in proj.inclusions) {
                                                                                for (var o of outputs) {
                                                                                    if (proj.inclusions[i].id == o.id) {
                                                                                        proj.inclusions[i].code = o.code
                                                                                        proj.inclusions[i].description = o.description
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var t of types) {
                                                                                if (proj.type === t.id) {
                                                                                    proj.type = t
                                                                                    break
                                                                                }
                                                                            }

                                                                            for (var stat of status) {
                                                                                if (proj.status === stat.id) {
                                                                                    proj.status = stat
                                                                                    break
                                                                                }
                                                                            }
                                                                        }

                                                                        callback(JSON.stringify(cv_projects))

                                                                    })
                                                            })
                                                    })

                                            })
                                    })
                            })
                    })
            })
    })

    socket.on('get-project', (id, callback) => {
        r.db(database).table('cv_projects').get(id).run()
            .then(function(proj) {

                r.db(database).table('cv_percentage_allocation').get(proj.allocation).run()
                    .then(function(allocation) {

                        r.db(database).table('cv_projects_status_list').get(proj.status).run()
                            .then(function(status) {

                                r.db(database).table('cv_project_types').get(proj.type).run()
                                    .then(function(type) {

                                        r.db(database).table('cv_users').without('password').run()
                                            .then(function(user) {

                                                r.db(database).table('cv_outputs').run()
                                                    .then(function(outputs) {

                                                        r.db(database).table('cv_partner_suppliers').run()
                                                            .then(function(suppliers) {

                                                                r.db(database).table('cv_filmmakers').run()
                                                                    .then(function(filmmakers) {

                                                                        for (var s in proj.suppliers) {
                                                                            for (var su of suppliers) {
                                                                                if (proj.suppliers[s] == su.id) {
                                                                                    proj.suppliers[s] = su
                                                                                    break
                                                                                }
                                                                            }
                                                                        }

                                                                        for (var f in proj.manpower) {
                                                                            for (var fi of filmmakers) {
                                                                                if (proj.manpower[f] == fi.id) {
                                                                                    proj.manpower[f] = fi
                                                                                    break
                                                                                }
                                                                            }
                                                                        }

                                                                        for (var i in proj.inclusions) {
                                                                            for (var o of outputs) {
                                                                                if (proj.inclusions[i].id == o.id) {
                                                                                    proj.inclusions[i].code = o.code
                                                                                    proj.inclusions[i].description = o.description
                                                                                    break
                                                                                }
                                                                            }
                                                                        }

                                                                        for (var u of user) {
                                                                            if (proj.lead === u.id) {
                                                                                proj.lead = u
                                                                                break
                                                                            }
                                                                        }

                                                                        proj.type = type
                                                                        proj.status = status
                                                                        proj.allocation = allocation

                                                                        callback(JSON.stringify(proj))

                                                                    })
                                                            })
                                                    })

                                            })
                                    })
                            })
                    })
            })
    })

    socket.on('get-cv-expenses', (nulldata, callback) => {
        r.db(database).table('cv_expenses').run()
            .then(function(expenses) {
                callback(JSON.stringify(expenses))
            })
    })

    socket.on('get-cv-expense', (id, callback) => {
        r.db(database).table('cv_expenses').get(id).run()
            .then(function(expense) {
                callback(JSON.stringify(expense))
            })
    })

    socket.on('get-storage-drives', (nulldata, callback) => {
        r.db(database).table('cv_storage_drives').orderBy(r.desc('date_added')).run()
            .then(function(drives) {
                callback(JSON.stringify(drives))
            })
    })

    socket.on('get-cv-user', (id, callback) => {
        r.db(database).table('cv_users').get(id).run()
            .then(function(user) {
                callback(JSON.stringify(user))
            })
    })

    socket.on('toggle-dark-theme', (id, callback) => {
        r.db(database).table('cv_users').get(id).run()
            .then(function(user) {
                if (!user.dark_theme) {
                    r.db(database).table('cv_users').get(user.id).update({ dark_theme: true }).run()
                        .then(function(up) {
                            io.emit('dark-theme-toggled', JSON.stringify({ boolean: true, user: user.id }))
                            callback(JSON.stringify(true))
                        })
                } else {
                    r.db(database).table('cv_users').get(user.id).update({ dark_theme: false }).run()
                        .then(function(up) {
                            io.emit('dark-theme-toggled', JSON.stringify({ boolean: false, user: user.id }))
                            callback(JSON.stringify(false))
                        })
                }
            })
    })

    socket.on('toggle-supplier-dark-theme', (id, callback) => {
        r.db(database).table('cv_partner_suppliers').get(id).run()
            .then(function(supplier) {
                if (!supplier.dark_theme) {
                    r.db(database).table('cv_partner_suppliers').get(supplier.id).update({ dark_theme: true }).run()
                        .then(function(up) {
                            io.emit('dark-theme-toggled', JSON.stringify({ boolean: true, user: supplier.id }))
                            callback(JSON.stringify(true))
                        })
                } else {
                    r.db(database).table('cv_partner_suppliers').get(supplier.id).update({ dark_theme: false }).run()
                        .then(function(up) {
                            io.emit('dark-theme-toggled', JSON.stringify({ boolean: false, user: supplier.id }))
                            callback(JSON.stringify(false))
                        })
                }
            })
    })

    socket.on('toggle-filmmaker-dark-theme', (id, callback) => {
        r.db(database).table('cv_filmmakers').get(id).run()
            .then(function(supplier) {
                if (!supplier.dark_theme) {
                    r.db(database).table('cv_filmmakers').get(supplier.id).update({ dark_theme: true }).run()
                        .then(function(up) {
                            io.emit('dark-theme-toggled', JSON.stringify({ boolean: true, user: supplier.id }))
                            callback(JSON.stringify(true))
                        })
                } else {
                    r.db(database).table('cv_filmmakers').get(supplier.id).update({ dark_theme: false }).run()
                        .then(function(up) {
                            io.emit('dark-theme-toggled', JSON.stringify({ boolean: false, user: supplier.id }))
                            callback(JSON.stringify(false))
                        })
                }
            })
    })

    socket.on('resources-outputs-update', (data, callback) => {
        r.db(database).table('cv_outputs').insert(data).run()
            .then(function(result) {
                if (result.inserted > 0) {
                    callback(JSON.stringify({
                        result: 200,
                        success: true,
                        message: `<b>${data.code}</b> has been added successfully.`,
                        action: 'inserted'
                    }))
                } else if (result.errors > 0 && result.first_error.toLowerCase().includes('duplicate primary key')) {
                    r.db(database).table('cv_outputs').get(data.id).update({
                            code: data.code,
                            description: data.description,
                            timestamp: data.timestamp
                        }).run()
                        .then(function(update) {
                            if (update.replaced > 0) {
                                callback(JSON.stringify({
                                    result: 200,
                                    success: true,
                                    message: `<b>${data.code}</b> has been updated.`,
                                    action: 'updated'
                                }))
                            }
                        })
                }
            })
    })

    socket.on('resources-event-type-update', (data, callback) => {
        r.db(database).table('cv_project_types').insert(data).run()
            .then(function(result) {
                if (result.inserted > 0) {
                    callback(JSON.stringify({
                        result: 200,
                        success: true,
                        message: `<b>${data.type}</b> has been added successfully.`,
                        action: 'inserted'
                    }))
                } else if (result.errors > 0 && result.first_error.toLowerCase().includes('duplicate primary key')) {
                    r.db(database).table('cv_project_types').get(data.id).update({
                            type: data.type
                        }).run()
                        .then(function(update) {
                            if (update.replaced > 0) {
                                callback(JSON.stringify({
                                    result: 200,
                                    success: true,
                                    message: `<b>${data.type}</b> has been updated.`,
                                    action: 'updated'
                                }))
                            }
                        })
                }
            })
    })

    socket.on('resources-storage-update', (data, callback) => {
        r.db(database).table('cv_storage_drives').insert(data).run()
            .then(function(result) {
                if (result.inserted > 0) {
                    callback(JSON.stringify({
                        result: 200,
                        success: true,
                        message: `<b>${data.id}</b> has been added successfully.`,
                        action: 'inserted'
                    }))
                } else if (result.errors > 0 && result.first_error.toLowerCase().includes('duplicate primary key')) {
                    var drive_id = data.id
                    delete(data.id)
                    r.db(database).table('cv_storage_drives').get(drive_id).update(data).run()
                        .then(function(update) {
                            if (update.replaced > 0) {
                                callback(JSON.stringify({
                                    result: 200,
                                    success: true,
                                    message: `<b>${drive_id}</b> has been updated.`,
                                    action: 'updated'
                                }))
                            }
                        })
                }
            })
    })

    socket.on('resources-accounts-update', (data, callback) => {
        r.db(database).table('cv_expense_accounts').insert(data).run()
            .then(function(result) {
                if (result.inserted > 0) {
                    callback(JSON.stringify({
                        result: 200,
                        success: true,
                        message: `<b>${data.id} / ${data.name}</b> has been added successfully.`,
                        action: 'inserted'
                    }))
                } else if (result.errors > 0 && result.first_error.toLowerCase().includes('duplicate primary key')) {
                    r.db(database).table('cv_expense_accounts').get(data.id).update({ name: data.name, type: data.type }).run()
                        .then(function(update) {
                            if (update.replaced > 0) {
                                callback(JSON.stringify({
                                    result: 200,
                                    success: true,
                                    message: `<b>${data.id} / ${data.name}</b> has been updated.`,
                                    action: 'updated'
                                }))
                            }
                        })
                }
            })
    })

    socket.on('resources-categories-update', (data, callback) => {
        r.db(database).table('cv_expense_categories').insert(data).run()
            .then(function(result) {
                if (result.inserted > 0) {
                    callback(JSON.stringify({
                        result: 200,
                        success: true,
                        message: `<b>${data.id} / ${data.name}</b> has been added successfully.`,
                        action: 'inserted'
                    }))
                } else if (result.errors > 0 && result.first_error.toLowerCase().includes('duplicate primary key')) {
                    r.db(database).table('cv_expense_categories').get(data.id).update({ name: data.name }).run()
                        .then(function(update) {
                            if (update.replaced > 0) {
                                callback(JSON.stringify({
                                    result: 200,
                                    success: true,
                                    message: `<b>${data.id} / ${data.name}</b> has been updated.`,
                                    action: 'updated'
                                }))
                            }

                        })
                }
            })
    })

    socket.on('create-cv-expense', (data, callback) => {
        r.db(database).table('cv_expenses').insert(data).run()
            .then(function(result) {
                if (result.inserted > 0) {
                    callback(JSON.stringify({
                        result: 200,
                        success: true,
                        message: `Expense added.`,
                        action: 'inserted'
                    }))
                } else if (result.errors > 0 && result.first_error.toLowerCase().includes('duplicate primary key')) {
                    r.db(database).table('cv_expenses').get(data.id).update({
                            account: data.account,
                            category: data.category,
                            date: data.date,
                            notes: data.notes,
                            amount: data.amount
                        }).run()
                        .then(function(update) {
                            if (update.replaced > 0) {
                                callback(JSON.stringify({
                                    result: 200,
                                    success: true,
                                    message: `<b>${data.id}</b> has been updated.`,
                                    action: 'updated'
                                }))
                            }

                        })
                }
            })
    })

    socket.on('get-user-projects', (id, callback) => {
        r.db(database).table('cv_projects').filter({ lead: id }).run()
            .then(function(cv_projects) {

                r.db(database).table('cv_percentage_allocation').run()
                    .then(function(allocation) {

                        r.db(database).table('cv_projects_status_list').run()
                            .then(function(status) {

                                r.db(database).table('cv_project_types').run()
                                    .then(function(types) {

                                        r.db(database).table('cv_users').without('password').run()
                                            .then(function(users) {

                                                r.db(database).table('cv_outputs').run()
                                                    .then(function(outputs) {

                                                        r.db(database).table('cv_partner_suppliers').run()
                                                            .then(function(suppliers) {

                                                                r.db(database).table('cv_filmmakers').run()
                                                                    .then(function(filmmakers) {

                                                                        for (var proj of cv_projects) {
                                                                            for (var a of allocation) {
                                                                                if (a.id === proj.allocation) {
                                                                                    proj.allocation = a
                                                                                    break
                                                                                }
                                                                            }

                                                                            for (var user of users) {
                                                                                if (proj.lead === user.id) {
                                                                                    proj.lead = user
                                                                                    break
                                                                                }
                                                                            }

                                                                            for (var s in proj.suppliers) {
                                                                                for (var su of suppliers) {
                                                                                    if (proj.suppliers[s] === su.id) {
                                                                                        proj.suppliers[s] = su
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var f in proj.manpower) {
                                                                                for (var fi of filmmakers) {
                                                                                    if (proj.manpower[f] === fi.id) {
                                                                                        proj.manpower[f] = fi
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var i in proj.inclusions) {
                                                                                for (var o of outputs) {
                                                                                    if (proj.inclusions[i].id == o.id) {
                                                                                        proj.inclusions[i].code = o.code
                                                                                        proj.inclusions[i].description = o.description
                                                                                        break
                                                                                    }
                                                                                }
                                                                            }

                                                                            for (var t of types) {
                                                                                if (proj.type === t.id) {
                                                                                    proj.type = t
                                                                                    break
                                                                                }
                                                                            }

                                                                            for (var stat of status) {
                                                                                if (proj.status === stat.id) {
                                                                                    proj.status = stat
                                                                                    break
                                                                                }
                                                                            }

                                                                        }

                                                                        callback(JSON.stringify(cv_projects))

                                                                    })
                                                            })
                                                    })

                                            })
                                    })
                            })
                    })
            })
    })

    socket.on('delete-cv-expense', (id, callback) => {
        r.db(database).table('cv_expenses').get(id).delete().run()
            .then(function(result) {
                if (result.deleted > 0) {
                    callback(JSON.stringify({
                        result: 200,
                        success: true,
                        message: `<b>${id}</b> has been deleted.`,
                        action: 'deleted'
                    }))
                }
            })
    })

    socket.on('delete-cv-event-type', (prtype, callback) => {
        r.db(database).table('cv_project_types').get(prtype.id).delete().run()
            .then(function(result) {
                if (result.deleted > 0) {
                    callback(JSON.stringify({
                        result: 200,
                        success: true,
                        message: `Project type <b>${prtype.type}</b> has been deleted.`,
                        action: 'deleted'
                    }))
                }
            })
    })

    socket.on('delete-cv-output', (data, callback) => {
        r.db(database).table('cv_outputs').get(data.id).delete().run()
            .then(function(result) {
                if (result.deleted > 0) {
                    data.description = (data.description == '') ? data.code : data.description
                    callback(JSON.stringify({
                        result: 200,
                        success: true,
                        message: `<b>${data.description}</b> has been deleted.`,
                        action: 'deleted'
                    }))
                }
            })
    })

    socket.on('delete-expense-account', (data, callback) => {
        r.db(database).table('cv_expense_accounts').get(data.id).delete().run()
            .then(function(response) {
                if (response.deleted > 0) {
                    callback(JSON.stringify({
                        result: 200,
                        success: true,
                        message: `<b>${data.id} / ${data.name}</b> has been removed successfully.`,
                        action: 'deleted'
                    }))
                }
            })
    })

    socket.on('delete-expense-category', (data, callback) => {
        r.db(database).table('cv_expense_categories').get(data.id).delete().run()
            .then(function(response) {
                if (response.deleted > 0) {
                    callback(JSON.stringify({
                        result: 200,
                        success: true,
                        message: `<b>${data.id} / ${data.name}</b> has been removed successfully.`,
                        action: 'deleted'
                    }))
                }
            })
    })

    socket.on('delete-storage-drive', (data, callback) => {
        var drive_data = data
        r.db(database).table('cv_storage_drives').get(data.id).delete().run()
            .then(function(response) {
                if (response.deleted > 0) {
                    callback(JSON.stringify({
                        result: 200,
                        success: true,
                        message: `<b>${drive_data.id} / ${drive_data.type}</b> has been removed successfully.`,
                        action: 'deleted'
                    }))
                }
            })
    })

    socket.on('get-cv-rev-exp', (option, callback) => {
        if (option == 'year') {
            r.db(database).table('cv_projects').orderBy('event_date').run()
                .then(function(projects) {
                    var dataset = []
                    var years = []

                    for (var proj of projects) {
                        if (proj.event_date == null) {
                            if (proj.inclusions.length == 1 && proj.inclusions[0].id == 'CVO002') {
                                proj.event_date = proj.pre_event_dates.start

                            } else {
                                proj.event_date = new Date().getTime()
                            }
                        }

                        var evdate = new Date(proj.event_date)

                        if (!years.includes(dateFormat(evdate, 'yyyy'))) {
                            years.push(dateFormat(evdate, 'yyyy'))
                            dataset.push([
                                dateFormat(evdate, 'yyyy'),
                                {
                                    revenue: 0,
                                    expenses: 0,
                                    count: 0
                                }
                            ])
                        }

                        for (var data of dataset) {
                            if (parseInt(data[0]) == parseInt(dateFormat(evdate, 'yyyy'))) {
                                var proj_expenses = 0
                                var proj_revenue = 0
                                for (var exp of proj.budget) {
                                    if (exp.type == 'cr') {
                                        proj_expenses += exp.amount
                                    }
                                }
                                proj_revenue = (proj.package - proj_expenses)
                                data[1].revenue += proj_revenue
                                data[1].expenses += proj_expenses
                                data[1].count += 1
                                break
                            }
                        }
                    }

                    dataset.sort()

                    callback(JSON.stringify({
                        datasets: dataset
                    }))
                })
        } else {
            r.db(database).table('cv_projects').filter(function(proj) {
                    return r.and(
                        proj('event_date').div(1000).le(
                            r.time(r.now().year(), 12, 31, 'Z').toEpochTime()
                        ),
                        proj('event_date').div(1000).ge(
                            r.time(r.now().year(), 1, 1, 'Z').toEpochTime()
                        )
                    )
                }).run()
                .then(function(projects) {
                    var dataset = []
                    var revenue = 0
                    var expenses = 0
                    var months = []

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

                    for (var proj of projects) {
                        if (proj.inclusions.length == 1 && proj.inclusions[0].id == 'CVO002') {
                            if (proj.event_date == null) {
                                proj.event_date = proj.pre_event_dates.start
                            }
                        }

                        var current_month_index = 0
                        var evdate = new Date(proj.event_date)

                        if (!months.includes(dateFormat(evdate, 'mmm'))) {
                            months.push(dateFormat(evdate, 'mmm'))
                            dataset.push([
                                dateFormat(evdate, 'mmm'),
                                {
                                    revenue: 0,
                                    expenses: 0
                                }
                            ])
                            revenue = 0
                            expenses = 0
                            current_month_index = months.length - 1
                        } else {
                            for (var i = 0; i < months.length; i++) {
                                if (dateFormat(evdate, 'mmm') == months[i]) {
                                    current_month_index = i
                                    break
                                }
                            }
                        }

                        for (var data of dataset) {
                            if (data[0] === dateFormat(evdate, 'mmm')) {
                                var proj_expenses = 0
                                var proj_revenue = 0
                                for (var budg of proj.budget) {
                                    if (budg.type == 'cr') {
                                        proj_expenses += budg.amount
                                    }
                                }
                                proj_revenue = (proj.package - proj_expenses)
                                data[1].revenue += proj_revenue
                                data[1].expenses += proj_expenses
                                break
                            }
                        }
                    }
                    dataset.sort(function(a, b) {
                        return monthNames[a[0]] - monthNames[b[0]]
                    })

                    callback(JSON.stringify({
                        datasets: dataset
                    }))
                })
        }



    })

    socket.on('get-allocation', (alloc_id, callback) => {
        r.db(database).table('cv_percentage_allocation').get(alloc_id).run()
            .then(function(alloc) {
                callback(JSON.stringify(alloc))
            })
    })

    socket.on('get-resources', (data, callback) => {
        r.db(database).table('cv_outputs').orderBy('id').run()
            .then(function(outputs) {
                r.db(database).table('cv_users').orderBy('id').run()
                    .then(function(users) {
                        r.db(database).table('cv_expense_accounts').orderBy('id').run()
                            .then(function(accounts) {
                                r.db(database).table('cv_percentage_allocation').orderBy(r.desc('id')).run()
                                    .then(function(allocations) {

                                        for (var user of users) {
                                            for (var alloc of allocations) {
                                                for (var a of alloc.allocation) {
                                                    if (a.user == user.id) {
                                                        a.user = user
                                                        break
                                                    }
                                                }
                                            }
                                        }

                                        r.db(database).table('cv_expense_categories').orderBy('id').run()
                                            .then(function(categories) {
                                                r.db(database).table('cv_project_types').orderBy('id').run()
                                                    .then(function(types) {
                                                        r.db(database).table('cv_storage_drives').orderBy('id').run()
                                                            .then(function(drives) {
                                                                callback(JSON.stringify({
                                                                    accounts: accounts,
                                                                    categories: categories,
                                                                    drives: drives,
                                                                    outputs: outputs,
                                                                    types: types,
                                                                    allocations: allocations
                                                                }))
                                                            })
                                                    })
                                            })
                                    })
                            })
                    })
            })
    })

    socket.on('get-all-events', (value, callback) => {
        r.db(database).table('cv_projects').run()
            .then(function(projects) {

                r.db(database).table('cv_projects_status_list').run()
                    .then(function(statuses) {

                        r.db(database).table('cv_project_types').run()
                            .then(function(types) {

                                r.db(database).table('cv_users').run()
                                    .then(function(users) {

                                        r.db(database).table('cv_partner_suppliers').run()
                                            .then(function(suppliers) {

                                                r.db(database).table('cv_user_schedule').run()
                                                    .then(function(schedules) {

                                                        var events = []
                                                        var milliseconds_day = 86400000 //24 Hrs in milliseconds

                                                        for (var proj of projects) {

                                                            for (var s of statuses) {
                                                                if (proj.status === s.id) {
                                                                    proj.status = s
                                                                    break
                                                                }
                                                            }

                                                            for (var ps in proj.suppliers) {
                                                                for (var s of suppliers) {
                                                                    if (proj.suppliers[ps] === s.id) {
                                                                        proj.suppliers[ps] = s
                                                                        break
                                                                    }
                                                                }
                                                            }

                                                            for (var t of types) {
                                                                if (proj.type === t.id) {
                                                                    proj.type = t
                                                                    break
                                                                }
                                                            }


                                                            var stat = proj.status.status.toUpperCase()

                                                            var event_date = (proj.event_date !== null) ? new Date(dateFormat(proj.event_date, "yyyy-mm-dd hh:mm:ss")) : null
                                                            var pre_event_start = (proj.pre_event_dates.start !== null) ? new Date(dateFormat(proj.pre_event_dates.start, "yyyy-mm-dd hh:mm:ss")) : null
                                                            var pre_event_end = (proj.pre_event_dates.end !== null) ? new Date(proj.pre_event_dates.end) : null

                                                            if (proj.title == null) {
                                                                for (var supp of proj.suppliers) {
                                                                    if (supp.job.toUpperCase().includes('COORD') && !proj.direct) {
                                                                        proj.title = `[ ${supp.name} ]`
                                                                        break
                                                                    } else {
                                                                        proj.title = `[ CV ${proj.status.status} Project ]`
                                                                    }
                                                                }
                                                            } else {
                                                                if (proj.type.type.toLowerCase() == `debut`) {
                                                                    proj.title = `${proj.title.split(' ')[0]} XVIII`
                                                                }
                                                            }

                                                            var eventobj = {
                                                                id: proj.id,
                                                                title: proj.title,
                                                                start: event_date,
                                                                allDay: true,
                                                                backgroundColor: calendarEventColorStatus(proj.status.status),
                                                                borderColor: calendarEventColorStatus(proj.status.status),
                                                                status: proj.status.status.toLowerCase(),
                                                                type: proj.type.type.toLowerCase(),
                                                                class: "event"
                                                            }

                                                            var title = (proj.inclusions.length == 1 && proj.inclusions[0].id == 'CVO002' || proj.inclusions.length == 2 && proj.inclusions[0].id == 'CVO001') ? proj.title + ' (' + proj.location + ' Pre-' + proj.type.type + ')' : proj.title + ' [ ' + dateFormat(proj.event_date, "mmm dd") + ' ] '
                                                            var preeventobj = {
                                                                id: proj.id,
                                                                title: title,
                                                                allDay: true,
                                                                backgroundColor: calendarPreEventColorStatus(proj.status.status),
                                                                borderColor: calendarPreEventColorStatus(proj.status.status),
                                                                status: proj.status.status.toLowerCase(),
                                                                type: proj.type.type.toLowerCase(),
                                                                class: "pre-event"
                                                            }

                                                            if (proj.pre_event_dates.workcation) {
                                                                preeventobj.end = new Date(pre_event_end.getTime() + milliseconds_day) //Add 1 day for fullCalendar.io
                                                            }

                                                            if (pre_event_start !== null) {
                                                                preeventobj.start = pre_event_start
                                                                if (pre_event_start !== event_date) {
                                                                    events.push(preeventobj)
                                                                }
                                                            }

                                                            for (var subevent of proj.sub_events) {
                                                                var sdesc = subevent.description.toLowerCase()
                                                                if (sdesc.includes('pre-')) {
                                                                    events.push({
                                                                        id: proj.id,
                                                                        title: title,
                                                                        start: new Date(dateFormat(subevent.date, "yyyy-mm-dd hh:mm:ss")),
                                                                        allDay: true,
                                                                        backgroundColor: calendarPreEventColorStatus(proj.status.status),
                                                                        borderColor: calendarPreEventColorStatus(proj.status.status),
                                                                        status: proj.status.status.toLowerCase(),
                                                                        type: proj.type.type.toLowerCase(),
                                                                        class: "pre-event",
                                                                        groupID: 01
                                                                    })
                                                                } else {
                                                                    events.push({
                                                                        id: proj.id,
                                                                        title: `${proj.title} (${subevent.description})`,
                                                                        start: new Date(dateFormat(subevent.date, "yyyy-mm-dd hh:mm:ss")),
                                                                        allDay: true,
                                                                        backgroundColor: calendarEventColorStatus(proj.status.status),
                                                                        borderColor: calendarEventColorStatus(proj.status.status),
                                                                        status: proj.status.status.toLowerCase(),
                                                                        type: proj.type.type.toLowerCase(),
                                                                        class: "event",
                                                                        groupID: 01
                                                                    })
                                                                }

                                                            }

                                                            events.push(eventobj)

                                                        }

                                                        for (var s of schedules) {
                                                            for (var u of users) {
                                                                if (s.user === u.id) {
                                                                    s.user = u
                                                                    break
                                                                }
                                                            }

                                                            if (s.type == 'errand') {
                                                                events.push({
                                                                    id: s.id,
                                                                    title: (s.title == null) ? `[ ${s.user.name.first.split(' ')[0].toUpperCase()} ]` : `[ ${s.user.name.first.split(' ')[0].toUpperCase()} ] ${s.title}`,
                                                                    start: new Date(dateFormat(s.start, "yyyy-mm-dd hh:mm:ss")),
                                                                    end: (s.end !== null) ? new Date(dateFormat(s.end + milliseconds_day, "yyyy-mm-dd")) : null,
                                                                    allDay: true,
                                                                    backgroundColor: `#e97a70`,
                                                                    borderColor: `#e97a70`,
                                                                    class: "personal",
                                                                    status: '',
                                                                    type: s.type,
                                                                    frequency: s.repeat
                                                                })
                                                            } else {
                                                                events.push({
                                                                    id: s.id,
                                                                    title: s.title,
                                                                    start: new Date(dateFormat(s.start, "yyyy-mm-dd hh:mm:ss")),
                                                                    end: (s.end !== null) ? new Date(dateFormat(s.end + milliseconds_day, "yyyy-mm-dd")) : null,
                                                                    allDay: true,
                                                                    backgroundColor: `#3a55b5`,
                                                                    borderColor: `#3a55b5`,
                                                                    class: "personal",
                                                                    status: '',
                                                                    type: s.type,
                                                                    frequency: s.repeat
                                                                })
                                                            }


                                                        }

                                                        events.sort()
                                                        callback(JSON.stringify({ events: events }))
                                                    })
                                            })
                                    })
                            })
                    })
            })
    })

    socket.on('get-supplier-events', (key, callback) => {
        r.db(database).table('cv_projects').filter(
                r.row('suppliers').contains(key)
            ).run()
            .then(function(projects) {

                r.db(database).table('cv_projects_status_list').run()
                    .then(function(statuses) {

                        r.db(database).table('cv_project_types').run()
                            .then(function(types) {

                                r.db(database).table('cv_users').run()
                                    .then(function(users) {

                                        r.db(database).table('cv_user_schedule').run()
                                            .then(function(schedules) {

                                                r.db(database).table('cv_partner_suppliers').run()
                                                    .then(function(suppliers) {
                                                        var events = []
                                                        var milliseconds_day = 86400000 //24 Hrs in milliseconds

                                                        for (var proj of projects) {

                                                            for (var s of statuses) {
                                                                if (proj.status === s.id) {
                                                                    proj.status = s
                                                                    break
                                                                }
                                                            }

                                                            for (var ps in proj.suppliers) {
                                                                for (var s of suppliers) {
                                                                    if (proj.suppliers[ps] === s.id) {
                                                                        proj.suppliers[ps] = s
                                                                        break
                                                                    }
                                                                }
                                                            }

                                                            for (var t of types) {
                                                                if (proj.type === t.id) {
                                                                    proj.type = t
                                                                    break
                                                                }
                                                            }

                                                            var stat = proj.status.status.toLowerCase()

                                                            var event_date = (proj.event_date !== null) ? new Date(dateFormat(proj.event_date, "yyyy-mm-dd hh:mm:ss")) : null
                                                            var pre_event_start = (proj.pre_event_dates.start !== null) ? new Date(dateFormat(proj.pre_event_dates.start, "yyyy-mm-dd hh:mm:ss")) : null
                                                            var pre_event_end = (proj.pre_event_dates.end !== null) ? new Date(proj.pre_event_dates.end) : null

                                                            if (proj.title == null) {
                                                                for (var supp of proj.suppliers) {
                                                                    if (supp.job.toUpperCase().includes('COORD') && !proj.direct) {
                                                                        proj.title = `[ ${supp.name} ]`
                                                                        break
                                                                    } else {
                                                                        proj.title = `[ CV ${proj.status.status} Project ]`
                                                                    }
                                                                }
                                                            } else {
                                                                if (proj.type.type.toLowerCase() == `debut`) {
                                                                    proj.title = `${proj.title.split(' ')[0]} XVIII`
                                                                }
                                                            }

                                                            var eventobj = {
                                                                id: proj.id,
                                                                title: proj.title,
                                                                start: event_date,
                                                                allDay: true,
                                                                backgroundColor: calendarEventColorStatus(proj.status.status),
                                                                borderColor: calendarEventColorStatus(proj.status.status),
                                                                status: proj.status.status.toLowerCase(),
                                                                type: proj.type.type.toLowerCase(),
                                                                class: `event`
                                                            }

                                                            var title = (proj.inclusions.length == 1 && proj.inclusions[0].id == 'CVO002') ? `( ${proj.location} Pre-${proj.type.type} )` : `${proj.title} [ ${dateFormat(proj.event_date, "mmm dd")} ]`
                                                            var preeventobj = {
                                                                id: proj.id,
                                                                title: title,
                                                                allDay: true,
                                                                backgroundColor: calendarPreEventColorStatus(proj.status.status),
                                                                borderColor: calendarPreEventColorStatus(proj.status.status),
                                                                status: proj.status.status.toLowerCase(),
                                                                type: proj.type.type.toLowerCase(),
                                                                class: "pre-event"
                                                            }

                                                            if (proj.pre_event_dates.workcation) {
                                                                preeventobj.end = new Date(pre_event_end.getTime() + milliseconds_day) //Add 1 day for fullCalendar.io
                                                            }

                                                            if (pre_event_start !== null) {
                                                                preeventobj.start = pre_event_start
                                                                if (pre_event_start !== event_date) {
                                                                    events.push(preeventobj)
                                                                }
                                                            }

                                                            for (var subevent of proj.sub_events) {
                                                                events.push({
                                                                    id: proj.id,
                                                                    title: title,
                                                                    start: new Date(dateFormat(subevent.date, "yyyy-mm-dd hh:mm:ss")),
                                                                    allDay: true,
                                                                    backgroundColor: calendarPreEventColorStatus(proj.status.status),
                                                                    borderColor: calendarPreEventColorStatus(proj.status.status),
                                                                    status: proj.status.status.toLowerCase(),
                                                                    type: proj.type.type.toLowerCase(),
                                                                    class: "pre-event"
                                                                })
                                                            }
                                                            events.push(eventobj)
                                                        }

                                                        for (var s of schedules) {
                                                            for (var u of users) {
                                                                if (s.user === u.id) {
                                                                    s.user = u
                                                                    break
                                                                }
                                                            }

                                                            if (s.type == 'errand') {
                                                                events.push({
                                                                    id: s.id,
                                                                    title: (s.title == null) ? `[ ${s.user.name.first.split(' ')[0].toUpperCase()} ]` : `[ ${s.user.name.first.split(' ')[0].toUpperCase()} ] ${s.title}`,
                                                                    start: new Date(dateFormat(s.start, "yyyy-mm-dd hh:mm:ss")),
                                                                    end: (s.end !== null) ? new Date(dateFormat(s.end + milliseconds_day, "yyyy-mm-dd")) : null,
                                                                    allDay: true,
                                                                    backgroundColor: `#e97a70`,
                                                                    borderColor: `#e97a70`,
                                                                    class: "personal",
                                                                    status: '',
                                                                    type: s.type,
                                                                    frequency: s.repeat
                                                                })
                                                            } else {
                                                                events.push({
                                                                    id: s.id,
                                                                    title: s.title,
                                                                    start: new Date(dateFormat(s.start, "yyyy-mm-dd hh:mm:ss")),
                                                                    end: (s.end !== null) ? new Date(dateFormat(s.end + milliseconds_day, "yyyy-mm-dd")) : null,
                                                                    allDay: true,
                                                                    backgroundColor: `#3a55b5`,
                                                                    borderColor: `#3a55b5`,
                                                                    class: "personal",
                                                                    status: '',
                                                                    type: s.type,
                                                                    frequency: s.repeat
                                                                })
                                                            }
                                                        }

                                                        events.sort()
                                                        callback(JSON.stringify({ events: events }))
                                                    })
                                            })
                                    })
                            })
                    })
            })
    })



    socket.on('get-supplier-events-public', (key, callback) => {
        r.db(database).table('cv_projects').filter(
                r.row('suppliers').contains(key)
            ).run()
            .then(function(projects) {

                r.db(database).table('cv_projects_status_list').run()
                    .then(function(statuses) {

                        r.db(database).table('cv_project_types').run()
                            .then(function(types) {

                                r.db(database).table('cv_partner_suppliers').run()
                                    .then(function(suppliers) {
                                        var events = []
                                        var milliseconds_day = 86400000 //24 Hrs in milliseconds

                                        for (var proj of projects) {

                                            for (var s of statuses) {
                                                if (proj.status === s.id) {
                                                    proj.status = s
                                                    break
                                                }
                                            }

                                            for (var ps in proj.suppliers) {
                                                for (var s of suppliers) {
                                                    if (proj.suppliers[ps] === s.id) {
                                                        proj.suppliers[ps] = s
                                                        break
                                                    }
                                                }
                                            }

                                            for (var t of types) {
                                                if (proj.type === t.id) {
                                                    proj.type = t
                                                    break
                                                }
                                            }

                                            var stat = proj.status.status.toLowerCase()

                                            var event_date = (proj.event_date !== null) ? new Date(dateFormat(proj.event_date, "yyyy-mm-dd hh:mm:ss")) : null
                                            var pre_event_start = (proj.pre_event_dates.start !== null) ? new Date(dateFormat(proj.pre_event_dates.start, "yyyy-mm-dd hh:mm:ss")) : null
                                            var pre_event_end = (proj.pre_event_dates.end !== null) ? new Date(proj.pre_event_dates.end) : null

                                            if (proj.title == null) {
                                                for (var supp of proj.suppliers) {
                                                    if (supp.job.toUpperCase().includes('COORD') && !proj.direct) {
                                                        proj.title = `[ ${supp.name} ]`
                                                        break
                                                    } else {
                                                        proj.title = `[ CV ${proj.status.status} Project ]`
                                                    }
                                                }
                                            } else {
                                                if (proj.type.type.toLowerCase() == `debut`) {
                                                    proj.title = `${proj.title.split(' ')[0]} XVIII`
                                                }
                                            }

                                            var eventobj = {
                                                id: proj.id,
                                                title: proj.title,
                                                start: event_date,
                                                allDay: true,
                                                backgroundColor: calendarEventColorStatus(proj.status.status),
                                                borderColor: calendarEventColorStatus(proj.status.status),
                                                status: proj.status.status.toLowerCase(),
                                                type: proj.type.type.toLowerCase(),
                                                class: `event`
                                            }

                                            var title = (proj.inclusions.length == 1 && proj.inclusions[0].id == 'CVO002') ? `( ${proj.location} Pre-${proj.type.type} )` : `${proj.title} [ ${dateFormat(proj.event_date, "mmm dd")} ]`
                                            var preeventobj = {
                                                id: proj.id,
                                                title: title,
                                                allDay: true,
                                                backgroundColor: calendarPreEventColorStatus(proj.status.status),
                                                borderColor: calendarPreEventColorStatus(proj.status.status),
                                                status: proj.status.status.toLowerCase(),
                                                type: proj.type.type.toLowerCase(),
                                                class: "pre-event"
                                            }

                                            if (proj.pre_event_dates.workcation) {
                                                preeventobj.end = new Date(pre_event_end.getTime() + milliseconds_day) //Add 1 day for fullCalendar.io
                                            }

                                            if (pre_event_start !== null) {
                                                preeventobj.start = pre_event_start
                                                if (pre_event_start !== event_date) {
                                                    events.push(preeventobj)
                                                }
                                            }

                                            for (var subevent of proj.sub_events) {
                                                events.push({
                                                    id: proj.id,
                                                    title: title,
                                                    start: new Date(dateFormat(subevent.date, "yyyy-mm-dd hh:mm:ss")),
                                                    allDay: true,
                                                    backgroundColor: calendarPreEventColorStatus(proj.status.status),
                                                    borderColor: calendarPreEventColorStatus(proj.status.status),
                                                    status: proj.status.status.toLowerCase(),
                                                    type: proj.type.type.toLowerCase(),
                                                    class: "pre-event"
                                                })
                                            }
                                            events.push(eventobj)
                                        }

                                        events.sort()
                                        callback(JSON.stringify({ events: events }))
                                    })
                            })
                    })
            })
    })



    socket.on(`get-filmmaker-events`, (id, callback) => {
        r.db(database).table(`cv_projects`)
            .filter(
                r.row('manpower').contains(id)
            ).run()
            .then(function(projects) {

                r.db(database).table('cv_projects_status_list').run()
                    .then(function(statuses) {

                        r.db(database).table('cv_project_types').run()
                            .then(function(types) {

                                r.db(database).table('cv_partner_suppliers').run()
                                    .then(function(suppliers) {

                                        r.db(database).table(`cv_filmmakers`).get(id).run()
                                            .then(function(filmmaker) {

                                                var events = []
                                                var milliseconds_day = 86400000 //24 Hrs in milliseconds

                                                for (var proj of projects) {

                                                    for (var s of statuses) {
                                                        if (proj.status === s.id) {
                                                            proj.status = s
                                                            break
                                                        }
                                                    }

                                                    for (var ps in proj.suppliers) {
                                                        for (var s of suppliers) {
                                                            if (proj.suppliers[ps] === s.id) {
                                                                proj.suppliers[ps] = s
                                                                break
                                                            }
                                                        }
                                                    }

                                                    for (var t of types) {
                                                        if (proj.type === t.id) {
                                                            proj.type = t
                                                            break
                                                        }
                                                    }

                                                    var event_date = (proj.event_date !== null) ? new Date(dateFormat(proj.event_date, "yyyy-mm-dd hh:mm:ss")) : null
                                                    var pre_event_start = (proj.pre_event_dates.start !== null) ? new Date(dateFormat(proj.pre_event_dates.start, "yyyy-mm-dd hh:mm:ss")) : null
                                                    var pre_event_end = (proj.pre_event_dates.end !== null) ? new Date(proj.pre_event_dates.end) : null

                                                    if (proj.title == null) {
                                                        for (var supp of proj.suppliers) {
                                                            if (supp.job.toUpperCase().includes('COORD') && !proj.direct) {
                                                                proj.title = `[ ${supp.name} ]`
                                                                break
                                                            } else {
                                                                proj.title = `[ CV ${proj.status.status} Project ]`
                                                            }
                                                        }
                                                    } else {
                                                        if (proj.type.type.toLowerCase() == `debut`) {
                                                            proj.title = `${proj.title.split(' ')[0]} XVIII`
                                                        }
                                                    }

                                                    var eventobj = {
                                                        id: proj.id,
                                                        title: proj.title,
                                                        start: event_date,
                                                        allDay: true,
                                                        backgroundColor: calendarEventColorStatus(proj.status.status),
                                                        borderColor: calendarEventColorStatus(proj.status.status),
                                                        status: proj.status.status.toLowerCase(),
                                                        type: proj.type.type.toLowerCase(),
                                                        class: `event`
                                                    }

                                                    var title = (proj.inclusions.length == 1 && proj.inclusions[0].id == 'CVO002') ? `( ${proj.location} Pre-${proj.type.type} )` : `${proj.title} [ ${dateFormat(proj.event_date, "mmm dd")} ]`
                                                    var preeventobj = {
                                                        id: proj.id,
                                                        title: title,
                                                        allDay: true,
                                                        backgroundColor: calendarPreEventColorStatus(proj.status.status),
                                                        borderColor: calendarPreEventColorStatus(proj.status.status),
                                                        status: proj.status.status.toLowerCase(),
                                                        type: proj.type.type.toLowerCase(),
                                                        class: "pre-event"
                                                    }

                                                    if (proj.pre_event_dates.workcation) {
                                                        preeventobj.end = new Date(pre_event_end.getTime() + milliseconds_day) //Add 1 day for fullCalendar.io
                                                    }

                                                    if (pre_event_start !== null) {
                                                        preeventobj.start = pre_event_start
                                                        if (pre_event_start < event_date) {
                                                            for (var budg of proj.budget) {
                                                                var desc = budg.description.toUpperCase()
                                                                if (desc.includes('PRENUP') ||
                                                                    desc.includes('PWF') ||
                                                                    desc.includes('P-W') ||
                                                                    desc.includes('PRE-WEDDING') ||
                                                                    desc.includes('PRE-DEBUT') ||
                                                                    desc.includes('PDF') ||
                                                                    desc.includes('PREDEBUT') ||
                                                                    desc.includes('PREWEDDING') ||
                                                                    desc.includes('P-D')) {

                                                                    if (desc.includes(filmmaker.name.toUpperCase()) && desc.includes('SHOOTER') || desc.includes('AERIAL')) {
                                                                        events.push(preeventobj)
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }

                                                    for (var subevent of proj.sub_events) {
                                                        var is_in_prenup = false
                                                        for (var budg of proj.budget) {
                                                            var desc = budg.description.toUpperCase()
                                                            if (desc.includes('PRENUP') ||
                                                                desc.includes('PWF') ||
                                                                desc.includes('P-W') ||
                                                                desc.includes('PRE-WEDDING') ||
                                                                desc.includes('PRE-DEBUT') ||
                                                                desc.includes('PDF') ||
                                                                desc.includes('PREDEBUT') ||
                                                                desc.includes('PREWEDDING') ||
                                                                desc.includes('P-D')) {

                                                                if (desc.includes(filmmaker.name.toUpperCase()) && desc.includes('SHOOTER') || desc.includes('AERIAL')) {
                                                                    events.push({
                                                                        id: proj.id,
                                                                        title: title,
                                                                        start: new Date(dateFormat(subevent.date, "yyyy-mm-dd hh:mm:ss")),
                                                                        allDay: true,
                                                                        backgroundColor: calendarPreEventColorStatus(proj.status.status),
                                                                        borderColor: calendarPreEventColorStatus(proj.status.status),
                                                                        status: proj.status.status.toLowerCase(),
                                                                        type: proj.type.type.toLowerCase(),
                                                                        class: "pre-event"
                                                                    })
                                                                }
                                                            }
                                                        }

                                                    }
                                                    events.push(eventobj)
                                                }

                                                events.sort()
                                                callback(JSON.stringify({ events: events }))
                                            })
                                    })
                            })
                    })

            }).catch(err => {
                console.log(err)
            })
    })


    socket.on('get-system-defaults', (value, callback) => {
        r.db(database).table('cv_outputs').orderBy('id').run()
            .then(function(cv_outputs) {

                //Get Project Status Metadata
                r.db(database).table('cv_projects_status_list').orderBy('id').run()
                    .then(function(cv_projects_status_list) {

                        //Get Allocations
                        r.db(database).table('cv_percentage_allocation').orderBy(r.desc('id')).run()
                            .then(function(cv_percentage_allocation) {

                                //Get Storage Drives
                                r.db(database).table('cv_storage_drives').orderBy('id').run()
                                    .then(function(cv_storage_drives) {

                                        //Get Project Type Metadata
                                        r.db(database).table('cv_project_types').orderBy('id').run()
                                            .then(function(cv_project_types) {

                                                //Get Accounts Resources
                                                r.db(database).table('cv_expense_accounts').orderBy('id').run()
                                                    .then(function(cv_expense_accounts) {

                                                        //Get Accounts Resources
                                                        r.db(database).table('cv_expense_categories').orderBy('id').run()
                                                            .then(function(cv_expense_categories) {

                                                                //Get Admin Users
                                                                r.db(database).table('cv_users').orderBy('id').without('password').run()
                                                                    .then(function(cv_users) {

                                                                        //Get Filmmakers
                                                                        r.db(database).table('cv_filmmakers').run()
                                                                            .then(function(cv_filmmakers) {

                                                                                //Get Filmmakers
                                                                                r.db(database).table('cv_partner_suppliers').run()
                                                                                    .then(function(cv_suppliers) {

                                                                                        //Get Project
                                                                                        r.db(database).table('cv_projects').run()
                                                                                            .then(function(cv_projects) {

                                                                                                var names = [],
                                                                                                    jobs = [],
                                                                                                    locations = [],
                                                                                                    filmmakers = [],
                                                                                                    coordinators = [],
                                                                                                    photographers = [],
                                                                                                    common_debit_budget = [],
                                                                                                    common_credit_budget = [],
                                                                                                    subevents = []


                                                                                                for (var s of cv_suppliers) {
                                                                                                    if (!names.includes(s.name)) {
                                                                                                        names.push(s.name)
                                                                                                    }

                                                                                                    if (!jobs.includes(s.job)) {
                                                                                                        jobs.push(s.job)
                                                                                                    }

                                                                                                    if (s.job.toLowerCase().includes('coord') && !coordinators.includes(s.name)) {
                                                                                                        coordinators.push(s.name)
                                                                                                    }

                                                                                                    if (s.job.toLowerCase().includes('photog') && !photographers.includes(s.name)) {
                                                                                                        photographers.push(s.name)
                                                                                                    }
                                                                                                }

                                                                                                for (var project of cv_projects) {
                                                                                                    if (!locations.includes(project.location) && project.location !== null) {
                                                                                                        locations.push(project.location)
                                                                                                    }

                                                                                                    for (var budget of project.budget) {
                                                                                                        if (budget.type == 'dr') {
                                                                                                            if (!common_debit_budget.includes(titleCase(budget.description))) {
                                                                                                                common_debit_budget.push(titleCase(budget.description))
                                                                                                            }
                                                                                                        }
                                                                                                        if (budget.type == 'cr') {
                                                                                                            if (!common_credit_budget.includes(titleCase(budget.description))) {
                                                                                                                common_credit_budget.push(titleCase(budget.description))
                                                                                                            }
                                                                                                        }
                                                                                                    }

                                                                                                    for (var adates of project.sub_events) {
                                                                                                        if (!subevents.includes(adates.description)) {
                                                                                                            subevents.push(adates.description)
                                                                                                        }
                                                                                                    }
                                                                                                }

                                                                                                for (var filmmaker of cv_filmmakers) {
                                                                                                    if (!filmmakers.includes(filmmaker.name) && filmmaker.name !== '') {
                                                                                                        filmmakers.push(filmmaker.name)
                                                                                                    }
                                                                                                }

                                                                                                names.sort()
                                                                                                jobs.sort()
                                                                                                locations.sort()
                                                                                                filmmakers.sort()
                                                                                                coordinators.sort()
                                                                                                photographers.sort()
                                                                                                common_debit_budget.sort()
                                                                                                common_credit_budget.sort()

                                                                                                //Send Back Data
                                                                                                var systemOBJ = {
                                                                                                    users: cv_users,
                                                                                                    inclusions: cv_outputs,
                                                                                                    status_list: cv_projects_status_list,
                                                                                                    storage_drives: cv_storage_drives,
                                                                                                    project_types: cv_project_types,
                                                                                                    allocations: cv_percentage_allocation,
                                                                                                    datalists: {
                                                                                                        suppliers: {
                                                                                                            obj: cv_suppliers,
                                                                                                            names: names,
                                                                                                            jobs: jobs,
                                                                                                            coordinators: coordinators,
                                                                                                            photographers: photographers
                                                                                                        },
                                                                                                        locations: locations,
                                                                                                        filmmakers: cv_filmmakers,
                                                                                                        budget: {
                                                                                                            debit: common_debit_budget,
                                                                                                            credit: common_credit_budget
                                                                                                        },
                                                                                                        sub_events: subevents
                                                                                                    },
                                                                                                    expense: {
                                                                                                        accounts: cv_expense_accounts,
                                                                                                        categories: cv_expense_categories
                                                                                                    }
                                                                                                }

                                                                                                callback(JSON.stringify(systemOBJ))
                                                                                            })
                                                                                    })
                                                                            })
                                                                    })
                                                            })
                                                    })
                                            })
                                    })
                            })
                    })
            })
    })


    socket.on('create-personal-schedule', (data, callback) => {
        r.db(database).table('cv_user_schedule').orderBy(r.desc('id')).limit(1).run()
            .then(function(sched) {

                if (sched.length > 0) {
                    data.id = incrementStringID(sched[0].id, 10, 5)
                } else {
                    data.id = incrementStringID(`CVUSRSCHED00000`, 10, 5)
                }

                r.db(database).table(`cv_user_schedule`).insert(data).run()
                    .then(function(res) {
                        callback(JSON.stringify(res))
                    })
            })

    })

    socket.on('get-personal-schedule', (id, callback) => {
        r.db(database).table('cv_user_schedule').get(id).run()
            .then(function(sched) {

                r.db(database).table('cv_users').get(sched.user).run()
                    .then(function(user) {
                        sched.user = user
                        callback(JSON.stringify(sched))
                    })
            })
    })

    socket.on('update-personal-schedule', (data, callback) => {
        var sched_id = data.id
        delete(data.id)

        r.db(database).table('cv_user_schedule').get(sched_id).update(data).run()
            .then(function(res) {
                callback(JSON.stringify(res))
            })
    })

    socket.on('delete-personal-schedule', (id, callback) => {
        r.db(database).table('cv_user_schedule').get(id).delete().run()
            .then(function(res) {
                callback(JSON.stringify(res))
            })
    })
})






/*
█▀▀ █▀▀ █▀▀ █▀▀ ░▀░ █▀▀█ █▀▀▄
▀▀█ █▀▀ ▀▀█ ▀▀█ ▀█▀ █░░█ █░░█
▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀ ▀▀▀▀ ▀░░▀
*/

app.use(cookieParser())
app.set('trust proxy', 1) // trust first proxy
app.use(session({
    secret: 'secret',
    saveUninitialized: false,
    resave: true,
    store: new redisStore({ host: process.env.REDIS_SERVER, port: process.env.REDIS_PORT, client: client, ttl: 260 }),
}))




/*
█▀▀█ █▀▀█ █░░█ ▀▀█▀▀ █▀▀ █▀▀
█▄▄▀ █░░█ █░░█ ░░█░░ █▀▀ ▀▀█
▀░▀▀ ▀▀▀▀ ░▀▀▀ ░░▀░░ ▀▀▀ ▀▀▀
*/



// Routes - Login
app.get('/', (req, res) => {
    if (req.session.userID) {
        res.redirect('dashboard')
    } else {
        res.render('login', { error: false, page: 'Login', user: { dark_theme: req.session.dark_theme } })
    }
})

// Routes - Dashboard
app.get('/dashboard', (req, res) => {
    if (req.session.userID) {
        r.db(database).table('cv_users').get(req.session.userID).without('password').run()
            .then(function(userdata) {
                req.session.dark_theme = userdata.dark_theme
                userdata.avatar = avatarCheck(userdata.id)
                res.render('dashboard', { user: userdata, page: 'Dashboard' })
            })
    } else {
        res.redirect('/')
    }
})

// Routes - Budget
app.get('/budget/profit', (req, res) => {
    if (req.session.userID) {
        r.db(database).table('cv_users').get(req.session.userID).without('password').run()
            .then(function(userdata) {
                req.session.dark_theme = userdata.dark_theme
                userdata.avatar = avatarCheck(userdata.id)
                res.render('budget_profit', { user: userdata, page: 'Budget/Profits' })
            })
    } else {
        res.redirect('/')
    }
})

app.get('/budget/expenses', (req, res) => {
    if (req.session.userID) {
        r.db(database).table('cv_users').get(req.session.userID).without('password').run()
            .then(function(userdata) {
                req.session.dark_theme = userdata.dark_theme
                userdata.avatar = avatarCheck(userdata.id)
                res.render('budget_cv', { user: userdata, page: 'Budget/Expenses' })
            })
    } else {
        res.redirect('/')
    }
})

app.get('/budget/all', (req, res) => {
    if (req.session.userID) {
        r.db(database).table('cv_users').get(req.session.userID).without('password').run()
            .then(function(userdata) {
                req.session.dark_theme = userdata.dark_theme
                userdata.avatar = avatarCheck(userdata.id)
                res.render('budget_all', { user: userdata, page: 'Budget/All' })
            })
    } else {
        res.redirect('/')
    }
})

// Routes - Projects
app.get('/projects', (req, res) => {
    if (req.session.userID) {
        r.db(database).table('cv_users').get(req.session.userID).without('password').run()
            .then(function(userdata) {
                req.session.dark_theme = userdata.dark_theme
                userdata.avatar = avatarCheck(userdata.id)
                res.render('projects', { user: userdata, page: 'Projects/Current' })
            })
    } else {
        res.redirect('/')
    }
})

app.get('/projects/all', (req, res) => {
    if (req.session.userID) {
        r.db(database).table('cv_users').get(req.session.userID).without('password').run()
            .then(function(userdata) {
                req.session.dark_theme = userdata.dark_theme
                userdata.avatar = avatarCheck(userdata.id)
                res.render('projects_all', { user: userdata, page: 'Projects/All' })
            })
    } else {
        res.redirect('/')
    }
})

app.get('/projects/monthly', (req, res) => {
    if (req.session.userID) {
        r.db(database).table('cv_users').get(req.session.userID).without('password').run()
            .then(function(userdata) {
                req.session.dark_theme = userdata.dark_theme
                userdata.avatar = avatarCheck(userdata.id)
                res.render('projects_monthly', { user: userdata, page: 'Projects/Monthly' })
            })
    } else {
        res.redirect('/')
    }
})

app.get('/projects/yearly', (req, res) => {
    if (req.session.userID) {
        r.db(database).table('cv_users').get(req.session.userID).without('password').run()
            .then(function(userdata) {
                req.session.dark_theme = userdata.dark_theme
                userdata.avatar = avatarCheck(userdata.id)
                res.render('projects_yearly', { user: userdata, page: 'Projects/Yearly' })
            })
    } else {
        res.redirect('/')
    }
})

// Routes - Calendar
app.get('/calendar', (req, res) => {
    if (req.session.userID) {
        r.db(database).table('cv_users').get(req.session.userID).without('password').run()
            .then(function(userdata) {
                req.session.dark_theme = userdata.dark_theme
                userdata.avatar = avatarCheck(userdata.id)
                res.render('calendar', { user: userdata, page: 'Calendar' })
            })
    } else {
        res.redirect('/')
    }
})

// Routes - Calendar with Suppliers
app.get('/calendar/suppliers', (req, res) => {
    if (req.session.userID) {
        r.db(database).table('cv_users').get(req.session.userID).without('password').run()
            .then(function(userdata) {
                req.session.dark_theme = userdata.dark_theme
                userdata.avatar = avatarCheck(userdata.id)
                res.render('calendar_suppliers', { user: userdata, page: 'Calendar/Suppliers' })
            })
    } else {
        res.redirect('/')
    }
})

// Public Routes - Supplier Calendar
app.get('/partner/supplier/:id', (req, res) => {
    var id = req.params.id

    r.db(database).table('cv_partner_suppliers').get(id).run()
        .then(function(supplier) {

            if (supplier.job.toLowerCase().includes('coord')) {
                supplier.job = 'Coordination'
            } else if (supplier.job.toLowerCase().includes('photog')) {
                supplier.job = 'Photography'
            } else if (supplier.job.toLowerCase().includes('videog')) {
                supplier.job = 'Videography'
            }

            res.render('supplier', { user: supplier, page: `Supplier/${supplier.job}/${supplier.name}` })
        })
})

// Public Routes - Filmmaker Calendar
app.get('/partner/filmmaker/:key', (req, res) => {
    var key = req.params.key

    r.db(database).table('cv_filmmakers').get(key).run()
        .then(function(filmmaker) {
            res.render('filmmaker', { user: filmmaker, page: `Cadence Visual/Filmmaker/${filmmaker.name}` })
        }).catch(err => {
            res.status(404).render('error404');
        })
})

// Routes - Resources
app.get('/resources', (req, res) => {
    if (req.session.userID) {
        r.db(database).table('cv_users').get(req.session.userID).without('password').run()
            .then(function(userdata) {
                req.session.dark_theme = userdata.dark_theme
                userdata.avatar = avatarCheck(userdata.id)
                res.render('resources', { user: userdata, page: 'Resources' })
            })
    } else {
        res.redirect('/')
    }
})

// Routes - Profile
app.get('/profile', (req, res) => {
    if (req.session.userID) {
        r.db(database).table('cv_users').get(req.session.userID).without('password').run()
            .then(function(userdata) {
                req.session.dark_theme = userdata.dark_theme
                userdata.avatar = avatarCheck(userdata.id)
                res.render('profile', { user: userdata, page: `Profile/${userdata.username}` })
            })
    } else {
        res.redirect('/')
    }
})


// Routes - Logout
app.get('/logout', (req, res) => {
            r.db(database).table('cv_users').get(req.session.userID).without('password').run()
                .then(function(userdata) {
                        req.session.dark_theme = userdata.dark_theme

                        var dark = (req.session.dark_theme) ? 1 : 0

                        req.session.destroy((err) => {
                                    if (err) {
                                        return console.log(err)
                                    } else {
                                        res.redirect(`/${(dark == 1) ? `?d=${dark}`: ``}`)
                    }
                })

            
    })

})





/*
█▀▀█ █░░█ ▀▀█▀▀ █░░█ █▀▀ █▀▀▄ ▀▀█▀▀ ░▀░ █▀▀ █▀▀█ ▀▀█▀▀ █▀▀
█▄▄█ █░░█ ░░█░░ █▀▀█ █▀▀ █░░█ ░░█░░ ▀█▀ █░░ █▄▄█ ░░█░░ █▀▀
▀░░▀ ░▀▀▀ ░░▀░░ ▀░░▀ ▀▀▀ ▀░░▀ ░░▀░░ ▀▀▀ ▀▀▀ ▀░░▀ ░░▀░░ ▀▀▀
*/

//Authenticate Login
app.post('/', urlencodedParser, function(req, res) {
    var cvuname = req.body.username
    var cvpassw = req.body.password

    r.db(database).table('cv_users').filter(
        r.row('username').eq(cvuname).or(
            r.row('email').eq(cvuname).or(
                r.row('mobile').eq(cvuname).or(
                    r.row('facebook').eq(cvuname)
                )
            )
        ).and(
            r.row('password').eq(sha256(cvpassw))
        ).and(
            r.row('login').eq(true)
        )
    ).limit(1).run().then(function(data) {
        result = data
        var user = data[0]
        var week = 604800000
        req.session.cookie.expires = new Date(Date.now() + week)
        req.session.cookie.maxAge = week
        req.session.userID = user.id
        req.session.dark_theme = user.dark_theme
        res.redirect('/dashboard')
    })
})







/*
█▀▀▄ █▀▀ █░░ █▀▀ ▀▀█▀▀ █▀▀
█░░█ █▀▀ █░░ █▀▀ ░░█░░ █▀▀
▀▀▀░ ▀▀▀ ▀▀▀ ▀▀▀ ░░▀░░ ▀▀▀
*/





//Handle Errors
app.use((req, res, next) => {
    res.status(404).render('error404');
})








/*
█▀▀ █░░█ █▀▀▄ █▀▀ ▀▀█▀▀ ░▀░ █▀▀█ █▀▀▄ █▀▀
█▀▀ █░░█ █░░█ █░░ ░░█░░ ▀█▀ █░░█ █░░█ ▀▀█
▀░░ ░▀▀▀ ▀░░▀ ▀▀▀ ░░▀░░ ▀▀▀ ▀▀▀▀ ▀░░▀ ▀▀▀
*/



//Functions
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

function checkTodayShoot() {
    r.db(database).table('cv_projects').orderBy('event_date').run()
        .then(function(projects) {

            r.db(database).table('cv_projects_status_list').run()
                .then(function(status_list) {

                    r.db(database).table('cv_partner_suppliers').run()
                .then(function(suppliers) {

                    r.db(database).table('cv_project_types').run()
                        .then(function(types) {

                            var day_in_milliseconds = 86400000 //1 day in milliseconds
                            var now = new Date(dateFormat(new Date(), "yyyy-mm-dd")).getTime()
                            var tom = new Date(dateFormat(new Date(), "yyyy-mm-dd")).getTime() + day_in_milliseconds
                            var events_this_week = []
                            var upcoming_events = []

                            for (var proj of projects) {
                                var event_date = (proj.event_date !== null) ? proj.event_date : null
                                var pre_event_start = (proj.pre_event_dates.start !== null) ? proj.pre_event_dates.start : null
                                var pre_event_end = (proj.pre_event_dates.end !== null) ? proj.pre_event_dates.end : null

                                if (proj.title == null) {
                                    for (var supp of proj.suppliers) {
                                        
                                        for(var s of suppliers){
                                            if(supp === s.id){
                                                supp = s
                                                break
                                            }
                                        }

                                        if (proj.direct) {
                                            proj.title = `[ CV ${proj.type.type} Project ]`
                                            break
                                        } else if (supp.job.includes('Coord') && !proj.direct) {
                                            proj.title = `<span class="text-muted">[ ${supp.name} ]</span>`
                                            break
                                        }
                                    }
                                }

                                for (var t of types) {
                                    if (proj.type == t.id) {
                                        proj.type = t
                                        break
                                    }
                                }


                                for (var s of status_list) {
                                    if (proj.status == s.id) {
                                        proj.status = s
                                        break
                                    }
                                }

                                var stat = proj.status.status.toLowerCase()
                                if (stat == 'confirmed' || stat == 'active' || stat == 'current') {
                                    if (event_date !== null) {
                                        if (now == event_date) {
                                            events_this_week.push({ description: `Today's`, project: proj, type: proj.type.type })
                                        }
                                        if (tom == event_date) {
                                            events_this_week.push({ description: `Tomorrow's`, project: proj, type: proj.type.type })
                                        }

                                        var diff = (event_date - now) / day_in_milliseconds
                                        if (diff <= 7 && diff >= 2) {
                                            events_this_week.push({ description: 'Upcoming', project: proj, type: proj.type.type, date: dateFormat(proj.event_date, 'mmm dd') })
                                        }
                                    }

                                    if (stat == 'confirmed' || stat == 'current') {
                                        if (proj.pre_event_dates.workcation) {
                                            if (now >= pre_event_start && now <= pre_event_end) {
                                                events_this_week.push({ description: `Today's`, project: proj, type: `Pre-${proj.type.type}` })
                                            } else if (tom >= pre_event_start && tom <= pre_event_end) {
                                                events_this_week.push({ description: `Tomorrow's`, project: proj, type: `Pre-${proj.type.type}` })
                                            }
                                        } else {
                                            if (now == pre_event_start) {
                                                events_this_week.push({ description: `Today's`, project: proj, type: `Pre-${proj.type.type}` })
                                            } else if (tom == pre_event_start) {
                                                events_this_week.push({ description: `Tomorrow's`, project: proj, type: `Pre-${proj.type.type}` })
                                            }
                                        }

                                        var diff = (pre_event_start - now) / day_in_milliseconds
                                        if (diff <= 7 && diff >= 2) {
                                            events_this_week.push({ description: 'Upcoming', project: proj, type: `Pre-${proj.type.type}`, date: dateFormat(new Date(proj.pre_event_dates.start), 'mmm dd') })
                                        }
                                    }

                                    if (stat == 'confirmed' || stat == 'current' || stat == 'active' && proj.sub_events.length > 0) {
                                        for (var subevent of proj.sub_events) {
                                            var diff = (subevent.date - now) / day_in_milliseconds
                                            if (diff <= 7 && diff >= 2) {
                                                events_this_week.push({ description: `Upcoming`, project: proj, type: subevent.description.replace("Shoot", ""), date: dateFormat(new Date(subevent.date), 'mmm dd') })
                                            }
                                            if (now == subevent.date) {
                                                events_this_week.push({ description: `Today's`, project: proj, type: subevent.description.replace("Shoot", ""), date: dateFormat(new Date(subevent.date), 'mmm dd') })
                                            } else if (tom == subevent.date) {
                                                events_this_week.push({ description: `Tomorrow's`, project: proj, type: subevent.description.replace("Shoot", ""), date: dateFormat(new Date(subevent.date), 'mmm dd') })
                                            }
                                        }

                                    }

                                }
                            }

                            io.emit("shoot-today", JSON.stringify(events_this_week))
                        })
                })
            })
        })
}

function calendarEventColorStatus(status) {
    status = status.toUpperCase()
    var color = null
    if (status == 'CONFIRMED' || status == 'ACTIVE' || status == 'PENDING' || status == 'SUBMITTED' || status == 'DONE' || status == 'READY') {
        color = '#009ee5'
    } else if (status == 'CANCELLED') {
        color = '#d80000'
    } else if (status == 'TENTATIVE' || status == 'POSTPONED') {
        color = '#616161'
    }
    return color
}

function calendarPreEventColorStatus(status) {
    status = status.toUpperCase()
    var color = null
    if (status == 'CONFIRMED' || status == 'ACTIVE' || status == 'PENDING' || status == 'SUBMITTED' || status == 'DONE' || status == 'READY') {
        color = '#2ab67c'
    } else if (status == 'CANCELLED') {
        color = '#d80000'
    } else if (status == 'TENTATIVE' || status == 'POSTPONED') {
        color = '#616161'
    }
    return color
}

//refreshSuppliersList()

function refreshSuppliersList() {
    r.db(database).table('cv_projects').run()
        .then(function(result1) {

            var suppliers_names = []
            var new_suppliers = []

            var filmmakers = []
            var new_filmmakers = []

            if (result1.length == 0) {
                r.db(database).table('cv_partner_suppliers').delete().run()
                    .then(function(result1) {})
                r.db(database).table('cv_filmmakers').delete().run()
                    .then(function(result1) {})
            }

            r.db(database).table('cv_partner_suppliers').run()
                .then(function(suppliers_list) {

                    for (var s of suppliers_list) {
                        if (!suppliers_names.includes(s.name)) {
                            suppliers_names.push(s.name)
                        }
                    }
                })

            r.db(database).table('cv_filmmakers').run()
                .then(function(flmkrs) {

                    for (var f of flmkrs) {
                        if (!filmmakers.includes(f.name)) {
                            filmmakers.push(f.name)
                        }
                    }
                })


            for (var proj of result1) {
                for (var supp of proj.suppliers) {
                    if (!suppliers_names.includes(supp.name)) {
                        new_suppliers.push(supp)
                        suppliers_names.push(supp.name)
                    }
                }

                for (var pf of proj.manpower) {
                    if (!filmmakers.includes(pf.name)) {
                        new_filmmakers.push(pf)
                    }
                }
            }

            r.db(database).table('cv_partner_suppliers').insert(new_suppliers).run()
                .then(function(r) {})

            r.db(database).table('cv_filmmakers').insert(new_filmmakers).run()
                .then(function(r) {})
        })
}

function titleCase(str) {
    return str.replace(/(?:^|\s)\w/g, function(match) {
        return match.toUpperCase();
    });
}

function avatarCheck(id) {
    var image = `./public/assets/images/${id}.jpg`
    var response = false

    if (fs.existsSync(image)) {
        response = true
    }

    return response
}

function randomRGB() {
    var color = [
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256),
        Math.floor(Math.random() * 256)
    ]
    return color.join(', ')
}


//updateProjectBudget()
function updateProjectBudget(){
    r.db(database).table('cv_projects').run()
        .then(function(projects) {
            
            for(var proj of projects){
                var proj_id = proj.id
                delete(proj.id)

                for(var budg of proj.budget){
                    if(budg.type === 'credit'){
                        budg.type = 'cr'
                    }else if(budg.type === 'debit'){
                        budg.type = 'dr'
                    }
                }

                r.db(database).table('cv_projects').get(proj_id).update(proj).run()
                .then(function(response) {
                    if(response.replaced > 0){
                        console.log(`${proj_id} Updated!`)
                    }
                })
            }

        })
}

function sha256(string){
    return crypto.SHA256(string).toString(crypto.enc.Hex)
}