var server_url = "https://bgfxc4.de/squalendar-api/"
var login_hash = "";

var currently_selected_day

window.onload = function() {
	login_hash = get_cookie("login_hash")
	if (login_hash == "") {
		window.location = window.location.href + "login.html"
	}
	render_all_calendar(2010)
}


function render_month_calendar(year, month) {
	var cal = document.getElementById("month-calendar")
	cal.innerHTML = "" 
	var days_in_month = (new Date(year, month + 1, 0)).getDate()
	var day_offset = (new Date(year, month, 1)).getDay() - 1
	if (day_offset == -1) day_offset = 6
	console.log(day_offset)
	var day_names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

	for (var i = 0; i < day_offset; i++) {
		cal.insertAdjacentHTML("beforeend", `<div class="month-calendar-day month-calendar-disabled-day"><div class="month-calendar-name">${day_names[i]}</div></div>`)
	}

	for (var day = 0; day < days_in_month; day++) {
		var name = (day + day_offset < 7) ? `<div class="month-calendar-name">${day_names[day + day_offset]}</div>` : ""
		var is_weekend = (day + day_offset) % 7 == 5 || (day + day_offset) % 7 == 6
		cal.insertAdjacentHTML("beforeend", `<div data="${day} "class="month-calendar-day ${is_weekend ? "month-calendar-weekend" : ""}">${name}${day + 1}</div>`)
	}

	for (var i = 0; i < 42 - days_in_month - day_offset; i++) {
		cal.insertAdjacentHTML("beforeend", `<div class="month-calendar-day month-calendar-disabled-day"></dev>`)
	}

	for (var day of document.getElementsByClassName("month-calendar-day")) {
		day.addEventListener("click", event => {
			if (!event.currentTarget.classList.contains("month-calendar-disabled-day")) {
				load_day_details(year, month, event.currentTarget.getAttribute("data"))
				hide_month_calendar()
			}
		})
	}
}

function render_year_calendar(year) {
	var cal = document.getElementById("year-calendar")
	cal.innerHTML = "" 
	var month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

	for (var i = 0; i < month_names.length; i++) {
		cal.insertAdjacentHTML("beforeend", `<div data="${i} "class="year-calendar-month">${month_names[i]}</div>`)
	}

	for (var month of document.getElementsByClassName("year-calendar-month")) {
		month.addEventListener("click", event => {
			var x = parseInt(event.currentTarget.getAttribute("data"))
			render_month_calendar(year, x)
			show_month_calendar(month_names[x])
			hide_year_calendar()
		})
	}
}

function render_all_calendar(start_year) {
	var cal = document.getElementById("all-calendar")
	cal.innerHTML = "" 

	for (var i = 0; i < 42; i++) {
		cal.insertAdjacentHTML("beforeend", `<div class="all-calendar-year">${i + parseInt(start_year)}</div>`)
	}

	for (var year of document.getElementsByClassName("all-calendar-year")) {
		year.addEventListener("click", event => {
			var x = parseInt(event.currentTarget.innerText)
			render_year_calendar(x)
			show_year_calendar(x)
			hide_all_calendar()
		})
	}
}

function all_tab_clicked() {
	hide_day_details()
	hide_month_calendar()
	hide_year_calendar()

	show_all_calendar()
	document.getElementById("top-bar-day-tab").style.display = "none"
	document.getElementById("top-bar-month-tab").style.display = "none"
	document.getElementById("top-bar-year-tab").style.display = "none"
}

function year_tab_clicked() {
	hide_day_details()
	hide_month_calendar()
	show_year_calendar()
	document.getElementById("top-bar-day-tab").style.display = "none"
	document.getElementById("top-bar-month-tab").style.display = "none"
}

function month_tab_clicked() {
	hide_day_details()
	show_month_calendar()
	document.getElementById("top-bar-day-tab").style.display = "none"
}

function load_day_details(year, month, day) {
	document.getElementById("day-details").style.display = "block"

	document.getElementById("day-details-title").innerText = `${parseInt(day)+1}.${month+1}.${year}`
	document.getElementById("top-bar-day-tab").value = day - (-1)
	document.getElementById("top-bar-day-tab").style.display = "inline-block"
}

function hide_day_details() {
	document.getElementById("day-details").style.display = "none"
}

function hide_month_calendar() {
	document.getElementById("month-calendar").style.display = "none"
}

function show_month_calendar(month_name) {
	document.getElementById("month-calendar").style.display = "grid"

	if (month_name) document.getElementById("top-bar-month-tab").value = month_name
	document.getElementById("top-bar-month-tab").style.display = "inline-block"
}

function hide_year_calendar() {
	document.getElementById("year-calendar").style.display = "none"
}

function show_year_calendar(year) {
	document.getElementById("year-calendar").style.display = "grid"

	if (year) document.getElementById("top-bar-year-tab").value = year
	document.getElementById("top-bar-year-tab").style.display = "inline-block"
}

function hide_all_calendar() {
	document.getElementById("all-calendar").style.display = "none"
}

function show_all_calendar() {
	document.getElementById("all-calendar").style.display = "grid"
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
