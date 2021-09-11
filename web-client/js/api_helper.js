function send_delete_appointment(year, month, day, appointment) {
	var res = make_post_request(`${server_url}delete-appointment/${year}/${month}/${day}/${appointment}`, {login_hash: login_hash})
	if (res.status == 401)
		window.location = window.location.href + "login.html"

	console.log(res.responseText)
}

function send_delete_day(year, month, day) {
	var res = make_post_request(`${server_url}delete-appointment/${year}/${month}/${day}`, {login_hash: login_hash})
	if (res.status == 401)
		window.location = window.location.href + "login.html"

	console.log(res.responseText)
}

function send_delete_month(year, month) {
	var res = make_post_request(`${server_url}delete-appointment/${year}/${month}`, {login_hash: login_hash})
	if (res.status == 401)
		window.location = window.location.href + "login.html"

	console.log(res.responseText)
}

function send_delete_year(year) {
	var res = make_post_request(`${server_url}delete-appointment/${year}`, {login_hash: login_hash})
	if (res.status == 401)
		window.location = window.location.href + "login.html"

	console.log(res.responseText)
}

function send_create_appointment(name, type, description, time, year, month, day) {
	var data = {
		login_hash: login_hash,
		name: name,
		type: type,
		description: description,
		time: time
	}
	var res = make_post_request(`${server_url}new-appointment/${year}/${month}/${day}`, data)
	console.log(res.responseText)
}

function load_year(year) {
	var res = make_post_request(`${server_url}get-appointments/${year}`, {login_hash: login_hash})
	if (res.status == 401)
		window.location = window.location.href + "login.html"

	console.log(res.responseText)
}

function load_month(year, month) {
	var res = make_post_request(`${server_url}get-appointments/${year}/${month}`, {login_hash: login_hash})
	if (res.status == 401)
		window.location = window.location.href + "login.html"

	console.log(res.responseText)
}

function make_post_request(url, content) {
	var xhr = new XMLHttpRequest()
    xhr.open("POST", url, false)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.send(JSON.stringify(content))
    return {responseText: xhr.responseText, status: xhr.status}
}
