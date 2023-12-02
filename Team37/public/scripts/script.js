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

	// Checking if there is already a cart in local storage
	let previousCart = localStorage.getItem("cart");
	if (previousCart === undefined || previousCart === null) {
		const cart = [];
		// Convert the array to a JSON string
		const cartJson = JSON.stringify(cart);
		localStorage.setItem("cart", cartJson);
	}


	//  getting the two possible alerts
	let alertSuccess = document.getElementById("alert-success");
	let alertDanger = document.getElementById("alert-danger");

	hideAlert(alertSuccess);
	hideAlert(alertDanger);


});

  