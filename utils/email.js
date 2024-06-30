const sendEmail = async (name, email, subject, message, req, res)=> {
    const newUser = new User({
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        username: req.body.email,
        address: req.body.address,
        createdAt: new Date(),
        lastUpdate: new Date()
    });
    const data = JSON.stringify({
        "Messages": [{
        "From": {"Email": process.env.EMAIL_SENDER, "Name": "MosalaPro"},
        "To": [{"Email": email, "Name": name}],
        "Subject": subject,
        "TextPart": message
        }]
    });

    const config = {
        method: 'post',
        url: 'https://api.mailjet.com/v3.1/send',
        data: data,
        headers: {'Content-Type': 'application/json'},
        auth: {username: process.env.MAILJET_API_KEY, password: process.env.MAILJET_API_SECRET},
    };
    req.body.code = code;
    res.render("emailVerification", {usr: newUser, cats: req.cats});
    return axios(config)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
        }).catch(function (error) {console.log(error);});
}