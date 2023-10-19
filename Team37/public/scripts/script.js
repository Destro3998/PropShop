/**
 * This function makes alerts disappear from the screen after a period of time
 * @param alert The alert that will be on the screen
 */
function hideAlert(alert) {
	if (alert) {
		setTimeout(function () {
			alert.style.opacity = "0"; // Make the alert fade away
		}, 2500);
		setTimeout(function () {
			alert.style.display = "none"; // Remove the alert from the screen
		}, 3000);
	}
}

// This event listener listens for the entire page to load
window.addEventListener("DOMContentLoaded", () => {

	//  getting the two possible alerts
	let alertSuccess = document.getElementById("alert-success");
	let alertDanger = document.getElementById("alert-danger");

	hideAlert(alertSuccess);
	hideAlert(alertDanger);

	// getting values from the passoword fields
	const passwordInput = document.getElementById("password");
	const passwordReEnterInput = document.getElementById("passwordReEnter");
	const submitButton = document.getElementById("submit-button");

	// Every time a keypress ends, run the functions
	passwordInput.addEventListener("keyup", validatePassword);
	passwordReEnterInput.addEventListener("keyup", validatePasswordReEntry);

	function validatePassword() {
		const password = passwordInput.value;
		const lengthRule = document.getElementById("rule-length");
		const uppercaseRule = document.getElementById("rule-uppercase");
		const numberRule = document.getElementById("rule-number");
		const specialRule = document.getElementById("rule-special");

		// These if statements change the styles of the password rules based on whether the password conforms

		if (password.length >= 8) {
			lengthRule.style.textDecoration = "line-through";
			lengthRule.style.color = "green";
		} else {
			lengthRule.style.textDecoration = "none";
			lengthRule.style.color = "red";
		}

		if (/[A-Z]/.test(password)) {
			uppercaseRule.style.textDecoration = "line-through";
			uppercaseRule.style.color = "green";
		} else {
			uppercaseRule.style.textDecoration = "none";
			uppercaseRule.style.color = "red";
		}

		if (/[0-9]/.test(password)) {
			numberRule.style.textDecoration = "line-through";
			numberRule.style.color = "green";
		} else {
			numberRule.style.textDecoration = "none";
			numberRule.style.color = "red";
		}

		if (/[!@#$%^&*]/.test(password)) {
			specialRule.style.textDecoration = "line-through";
			specialRule.style.color = "green";
		} else {
			specialRule.style.textDecoration = "none";
			specialRule.style.color = "red";
		}

		// Enable or disable the submit button based on password validation and matching passwords
		validatePasswordReEntry();
	}

	/**
	 * This function checks if the password and the re-entered password are the same
	 */
	function validatePasswordReEntry() {
		const password = passwordInput.value;
		const passwordReEnter = passwordReEnterInput.value;

		if (password === passwordReEnter && password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[!@#$%^&*]/.test(password)) {
			submitButton.disabled = false;
		} else {
			submitButton.disabled = true;
		}
	}
});
  