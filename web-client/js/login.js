var server_url = "http://localhost:5559/"

function try_login() {
	var username = document.getElementById("usernameInput").value
	var password = document.getElementById("passwordInput").value
	var login_hash = sha512("squalender" + username + ":" + password)

	var xhr = new XMLHttpRequest()
	var url = server_url + "authorize"
	xhr.onload = function() {
		if (xhr.status == 200) {
			set_cookie("login_hash", login_hash, 14)
			window.location = window.location.href.replace("login.html", "")
		} else {
			var a = document.getElementById("errorText").hidden = false
		}
	}
	xhr.open("POST", url)
	xhr.setRequestHeader("content-type", "application/json")
	xhr.send(JSON.stringify({login_hash: login_hash}))
}

function set_cookie(cname, cvalue, exdays) {
	const d = new Date();
	d.setTime(d.getTime() + (exdays*24*60*60*1000));
	let expires = "expires="+ d.toUTCString();
	document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
