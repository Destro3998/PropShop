
# Myriad Studios E-commerce website

## Team 37 - Fall 2023 CMPT 370 Project

## Project Description

This project is an e-commerce platform that allows users to view items, add them to a shopping cart and make reservations which are fulfilled at Myriad studio's warehouse. The administrators of this website are able to manage their inventory and keep track of who has rented out their merchandise, when they will get it back.

### Technologies Used

* NodeJs + Express (Backend + web framework)
* MongDB (Database)
* Handlebars (templating engine)

## How to install the project

### Step 1

In a terminal shell perform a git clone.

Use:

```bash
git clone https://git.cs.usask.ca/bjf403/370-project-fall-2023.git
```

to clone with HTTPS.

Use:

```bash
git@git.cs.usask.ca:bjf403/370-project-fall-2023.git
```

to clone with SSH.

### Step 2

Install NodeJS to your system. (If you already have nodeJS installed you can safely skip this step.)

Visit <https://nodejs.org/en/download> and choose an installation based on your operating system.
Your installation must at least be the latest LTS Version: 20.10.0 (includes npm 10.2.3).

Once that is installed on your system open a terminal and run.

```bash
node --version
```

if this gives you no errors, then you have successfully installed nodeJS onto your system.

### Step 3

Download all necessary dependencies for the project.

To do this you will need to open up a terminal window in the Team37 directory.

For windows: `370-project-fall-2023\Team37`
For Unix: `370-project-fall-2023/Team37`

Once in this directory run the following command:

```bash
npm install -y
```

Once this is complete you will have all the dependencies necessary to run the project.

### Step 4

Create a `.env` file in the `370-project-fall-2023/Team37` directory.

in this file add the following:

```env
DB_PASSWORD=admin@370
SECRET=5DULGXyMq7zPzuXmGFYuP8rOL0fnWvKoX51GkqMMrdTlnePTeXEO2sCvKjhXpjVw
DB_URI="mongodb+srv://admin:admin@370.16ms14j.mongodb.net/?retryWrites=true&w=majority"
PORT=3000
SENDGRID_KEY=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
NGROK_AUTHTOKEN=2XwkdiCjiBZscmmVEc2TcZDBrhl_5J4AJSpCZkAJfMXpJ3uSE
tokenNGROK = 2XwkdiCjiBZscmmVEc2TcZDBrhl_5J4AJSpCZkAJfMXpJ3uSE node launch.js
STRIPE_SECRET_KEY=sk_test_51OAKPjCUWYKakee9pIKRZMiWhoLnOtrcchprN2KTVab8A05zDhLLJed35Ih9Za5tLNoGAEK3gfLV0FkP9OEVVQMX00tImmsV1e
STRIPE_PUBLISHABLE_KEY=pk_test_51OAKPjCUWYKakee9uqX1PvVQxvgjxne676F0d7c6ujYg3uxu2r5qCUz8y1jlSRDkz73xPtgD7Etpyf0M1RCualDF00L2JYGtbh
```

Once you have this copied into the .env file you are good to start the server.

### Step 5

Start the server

In your terminal window that is in the `370-project-fall-2023/Team37` directory run the command `npm start`. This command will start teh server on port 3000.

In your browser navigate to <locahost:3000> or <http://127.0.0.1:3000/>

### Step 6

You're in.

## Credits

The Team of developers that worked on this project:

* Clinton Claypool
* Dylan Crosby
* Noah Martens
* Shubham Jain
* Sukhman Dhawan
* Theophilus Nenhanga

## Thank you

Thank you to you for taking the time to look at this project.
