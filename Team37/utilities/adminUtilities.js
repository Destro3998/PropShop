const adminEmails = ["myriadAdmin@team37.ca"]

function isEmailAdmin(email) {
    if (email === null || email === undefined) return false;
    adminEmails.forEach(element => {
        if (email === element){
            return true;
        }
    });
    return false;
}

function addAdmin(email){
    if (adminEmails.includes(email)) return;
    adminEmails.push(email);
}

function removeAdmin(email){
    if (!(adminEmails.includes(email))) return;
    let deleteAt = adminEmails.indexOf(email);
    adminEmails.slice(deleteAt, 1)
}

module.exports = {isEmailAdmin, addAdmin, removeAdmin}