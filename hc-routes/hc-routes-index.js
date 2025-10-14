console.log(`✅ LOADED hc-routes/hc-routes-index.js`);

const express = require(`express`);
const router = express.Router();

const nodemailer = require(`nodemailer`);

router.post(`/contact`, async (req, res) => {
	const { email, message, mathAnswer, correctAnswer } = req.body;

	if (req.body.address) {
		return res.status(400).send(`Bot detected.`);
	}

	if (!email || !message || !mathAnswer || !correctAnswer) {
		console.warn(`❌ Missing required fields.`);
		return res.redirect(`/?error=missing#contact-section`);
	}

	if (parseInt(mathAnswer) !== parseInt(correctAnswer)) {
		console.warn(`❌ Math bot check failed.`);
		return res.redirect(`/?error=botfail#contact-section`);
	}

	const transporter = nodemailer.createTransport({
		host: `secure302.inmotionhosting.com`, // your specific mail server
		port: 465, // outgoing server
		secure: true, // true for port 465, false for 587
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});

	try {
		// Send email to yourself
		await transporter.sendMail({
			from: email,
			to: `eric@harmonycue.com`,
			subject: `New Contact Submission`,
			text: `From: ${email}\n\n${message}`,
		});

		// Auto-reply to user
		await transporter.sendMail({
			from: `info@harmonycue.com`,
			to: email,
			subject: `Thanks for reaching out!`,
			html: `
				<div style="font-family: Tahoma, Geneva, sans-serif; font-size: 16px; line-height: 1.6; color: #333;">
					<img src="hc-static/hc-static-images-email-banner.jpg" alt="HarmonyCue Email" style="max-width: 100%; height: auto; display: block; margin-bottom: 20px;">
					<h2 style="color: #460c61; margin-top: 0;">Thanks for reaching out!</h2>
					<p>We got your message. Thank you so much. And apologies for this computer-generated response. It's just to let you know that we heard from you and a real person will reach out just as quickly as <em>humanly</em> possible.</p>
					<p style="margin-top: 20px;">🎵 HarmonyCue.com</p>
				</div>
			`,
		});

		// c•onsole.log(`📨 Emails sent successfully.`);
		res.redirect(`/?sent=true#contact-section`); // show a success message
	} catch (err) {
		console.error(`❌ Error sending emails:`, err);
		res.status(500).send(`❌ Error sending emails: ${err}`);
		// res.status(500).send(`An error occurred while sending your message.`);
		return res.redirect(`/?error=email#contact-section`);
	}
});

module.exports = ({ multimixerService, samplerService }) => {
	router.get(`/`, (req, res) => {
		res.set("Cache-Control", "no-cache, max-age=0, must-revalidate"); // or 'no-store'
		res.render(`layout/main-loader`);
	});

	router.get(`/full`, async (req, res) => {
		try {
			const trackData = await multimixerService.getTracksList();
			const mxrTracksList = trackData[1];
			const songName = trackData[0];

			const mxrVoicePartList = mxrTracksList
				.filter((track) => track.descr?.type === `voice`)
				.map((track) => ({
					label: track.descr.btnletter || track.descr.name.charAt(0),
					part: track.descr.name,
				}));

			const samplerList = await samplerService.getList();

			res.set("Cache-Control", "no-cache, max-age=0, must-revalidate"); // or 'no-store'
			res.render(`layout/deferred-html`, {
				sectionList: [
					`splash`,
					`intro`,
					`explainer`,
					`multimixer`,
					`contact`,
					`sampler`,
				],
				trackData,
				mxrTracksList,
				mxrVoicePartList,
				samplerList,
				query: req.query,
			});
		} catch (err) {
			console.error(`❌ Failed to render /full:`, err);
			res.status(500).send(`Internal Server Error`);
		}
	});

	return router;
};
