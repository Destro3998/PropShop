const crypto = require("crypto");

/**
 * This function checks if the entered password is the same as the password that we have stored in our database
 * @param password the entered password
 * @param hash the password's hash
 * @param salt the password's salt
 * @returns {boolean} true if the same false otherwise
 */
function validatePassword(password, hash, salt) {
	let hashVerify = crypto.pbkdf2Sync(password, salt, 1000000, 64, "sha512").toString("hex");
	return hash === hashVerify;
}

/**
 * Passwords should never be stored as plain text.
 * So we need to generate strings that we can store in the database.
 * @param {String} password What the user enters into the form.
 */
function generatePassword(password) {
	// A salt is a random value that is generated and added to a user's password before it is hashed for storage.
	// Its purpose is to prevent identical passwords from producing the same hash value.
	let salt = crypto.randomBytes(32).toString("hex");
	let genHash = crypto.pbkdf2Sync(password, salt, 1000000, 64, "sha512").toString("hex");

	return {
		salt: salt,
		hash: genHash
	}
}

module.exports = {
	validatePassword: validatePassword,
	generatePassword: generatePassword
};