window.doPasswordReset = function() {
	Swal({
		title: 'Are you sure?',
		text: 'This will disable your current password.',
		type: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, reset my password!',
	}).then((result) => {
		if (result.value) {
			setTimeout(function() {
				Swal.showLoading();
			}, 200);
			$.post('/cms/modules/users/json/doPasswordReset.json.php', $('#loginForm').serialize(), function() {
				Swal.hideLoading();
				Swal('', 'If an account was found with that username, you will receive an email with a temporary password. Enter it in the password box to continue.', 'success');
			});
		}
	});
};

$('#loginForm').submit(function(e) {
	if (P.sweetalert.isLoaded) Swal.showLoading();
	e.preventDefault();
	$('.menu-top .dropbtn').hide();
	$('.menu-top a[class*="moduleButton_"]').hide();
	$.post('https://pdrcontractors.com/cms/json/login.json.php', $(this).serialize() + '&version=' + appVersion, function(data) {
		if (P.sweetalert.isLoaded) Swal.hideLoading();
		if (data.message == 'good') {
			//store credentials
			localStorage['username'] = $('#loginForm input[name="username"]').val();
			localStorage['password'] = $('#loginForm input[name="password"]').val();

			//go to the next tab
			$('main')
				.removeClass('active')
				.filter('#app')
				.addClass('active');
			$('#profile').addClass('active');
			window.userId = data.access.id;
			getVendorId();
			initMap();
		} else if (data.message == 'doShowResetPassword') {
			if ($('#loginForm').children().length == 3) {
				Swal({
					title: 'Temporary Password accepted',
					text: 'Please enter a new permanent password below.',
					type: 'success',
				});
				$('#loginForm>label')
					.last()
					.after('<label>New Password<input name="new_password" type="password" autocomplete="current-password"></label>');
			}
		} else if (data.showForgotPasswordButton) {
			Swal({
				title: 'Incorrect Password',
				text: 'Please try again. If the problem persists, use the reset password button below.',
				type: 'error',
			});
			if ($('#loginForm').children().length == 3) {
				$('#loginForm>label')
					.last()
					.after('<input class="button" type="button" onclick="doPasswordReset()" value="Forgot Password" style="width:100%">');
			}
		} else if ($('#loginForm [name="username"]').val() != '') alert(data.message);
	});
	return false;
});
if (typeof localStorage['username'] === 'string') {
	$('#loginForm input[name="username"]').val(localStorage['username']);
	$('#loginForm input[name="password"]').val(localStorage['password']);
	$('#loginForm').trigger('submit');
}
