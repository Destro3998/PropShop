const sendGrid = require("@sendgrid/mail");
sendGrid.setApiKey(process.env.SENDGRID_API_KEY);



async function sendEmail(user){
    let link = "";
    let emailHTML = `
    <!DOCTYPE html>
    <html lang="en">
    	<head>
    		<meta charset="UTF-8">
    		<meta name="viewport" content="width=device-width, initial-scale=1.0">
    		<title>Verification Email</title>
    		<style>
        		html{
            		font-family: 'Noto Sans', sans-serif;
       			}

        		.container{
        		    padding: 2rem;
        		    text-align: center;
        		    border-radius: 0.5rem;
        		    box-shadow: #e3dada 0 0 5px;
        		}

        		.head-text{
        		    background-color: #242323;
        		    padding: 1rem;
        		    border-radius: 0.5rem;
        		    color: white;
        		    box-shadow: black 0 0 10px;
        		}
    		</style>
		</head>

		<body>
			<div class="container">
			    <h1 class="head-text">Verify Your Email</h1>
			    <h3>Thank you for registering</h3>
			    <p>Just one step left</p>
			    <p>Please click on the link below to verify your email.</p>
			    <p><a href="${link}">Verify your Email</a></p>
			</div>    
		</body>

	</html>
    `

    const message = {
        to: `${user.email}`,
        from: "",
        subject: "Verify your email",
        html: emailHTML
    }

    await sendGrid.send(message);

    //for a user. Generate a code. 
    // Create an email with the code. 
    // Send the email to the user. 

    // the user must enter the code at teh verify-email route. 
    // if the code is the same verify the user if the code is not the same do not verify the user
}

function generateCode(length=6){
    // Declare all characters
    let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomCharacters = "";

    for (let i = 0; i < length; i++){
        randomCharacters += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return randomCharacters;
}