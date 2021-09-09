var server_url = "https://bgfxc4.de/squalendar-api/"
var login_hash = "";

window.onload = function() {
	login_hash = get_cookie("login_hash")
	if (login_hash == "") {
		window.location = window.location.href + "login.html"
	}
}

function send_clicked_year() {
	load_year(document.getElementById("yearInput").value)
}
function send_clicked_month() {
	load_month(document.getElementById("yearInput").value, document.getElementById("monthInput").value)
}
function sendcreate() {
	send_create_appointment(document.getElementById("nameInput").value,
		document.getElementById("typeInput").value,
		document.getElementById("descriptionInput").value,
		{
			begin: document.getElementById("timebeginInput").value,
			end: document.getElementById("timeendInput").value
		}, 
		document.getElementById("yearInput").value, 
		document.getElementById("monthInput").value, 
		document.getElementById("dayInput").value)
}
function senddelete() {
	send_delete_appointment(document.getElementById("yearInput").value, document.getElementById("monthInput").value, 
		document.getElementById("dayInput").value, document.getElementById("appmntInput").value)
}
function senddeleteday() {
	send_delete_day(document.getElementById("yearInput").value, document.getElementById("monthInput").value, 
		document.getElementById("dayInput").value)
}
function senddeletemonth() {
	send_delete_month(document.getElementById("yearInput").value, document.getElementById("monthInput").value)
}
function senddeleteyear() {
	send_delete_year(document.getElementById("yearInput").value)
}


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

function get_cookie(cname) {
	let name = cname + "=";
	let decodedCookie = decodeURIComponent(document.cookie);
	let ca = decodedCookie.split(';');
	for(let i = 0; i < ca.length; i++) {
		let c = ca[i];
		while (c.charAt(0) == ' ') {
			c = c.substring(1);
		}
		if (c.indexOf(name) == 0) {
			return c.substring(name.length, c.length);
		}
	}
	return "";
}
