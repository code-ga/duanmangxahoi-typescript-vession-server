import nodemailer from 'nodemailer'

export const sendEmailWithNodeMailer = async (
	to: string,
	html: string,
	subject = 'Change Password',
) => {
	const testAccount = await nodemailer.createTestAccount()
	// if (!process.env.SEND_EMAIL_USER || !process.env.SEND_EMAIL_PASS) {
	// 	throw new Error('SEND_EMAIL_USER or SEND_EMAIL_PASS is not set')
	// }
	const transporter = nodemailer.createTransport({
		// setting host
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			// for test account
			user: testAccount.user, // generated ethereal user
			pass: testAccount.pass, // generated ethereal password
			// user: process.env.SEND_EMAIL_USER,
			// pass: process.env.SEND_EMAIL_PASS,
		},
		tls: {
			rejectUnauthorized: false,
		},
	})

	// send mail with defined transport object
	const info = await transporter.sendMail({
		from: `"Fred Foo 👻" <${testAccount.user}`, // sender address process.env.SEND_EMAIL_USER
		to, // list of receivers
		subject, // Subject line
		html, // html body
	})

	console.log('Message sent: %s', info.response)

	// Preview only available when sending through an Ethereal account
	console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info))
}
export const sendEmail = async (
	to: string,
	html: string,
	subject = 'Change Password',
) => {
	await sendEmailWithNodeMailer(to, html, subject)
}
