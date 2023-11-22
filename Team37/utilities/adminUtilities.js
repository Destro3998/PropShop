const adminEmails = ["myriadAdmin@team37.ca"]
const adminPasswordHash = "69cdba6c11d2fd64a4e9291cfaff693eeeadbdfc1321d815a2b4c0677d9435efda70beab96316575c2ae9d15bbe49d751c0e9b89cf5c62945cc7106b81df7522";
const adminPasswordSalt = "f2d72ec23b6280f434c2abc90cefd4d217f4182283a11e6dade5ef641a3461e3";
// When the server starts for the very first time the admin user must be created with this hash and salt.
// The admin user must not register - they will log in with a certain password
// they will be the first admin and can make other accounts admin if they want to.

function isEmailAdmin(email) {
    if (email === null || email === undefined) return false;
    adminEmails.forEach(element => {
        if (email === element) {
            return true;
        }
    });
    return false;
}

// these functions are for adding and removing super admins.
// I cannot find a use case for these which is why they have no usages.
function addAdmin(email) {
    if (adminEmails.includes(email)) return;
    adminEmails.push(email);
}

function removeAdmin(email) {
    if (!(adminEmails.includes(email))) return;
    let deleteAt = adminEmails.indexOf(email);
    adminEmails.slice(deleteAt, 1)
}

module.exports = {
    isEmailAdmin,
    addAdmin: addAdmin,
    removeAdmin: removeAdmin,
    adminEmails: adminEmails,
    adminPasswordHash: adminPasswordHash,
    adminPasswordSalt: adminPasswordSalt
}