// c•onsole.log("hc-routes/hc-routes-index.js");

const express = require("express");
const router = express.Router();

const nodemailer = require("nodemailer");

router.post("/contact", async (req, res) => {
	const { email, message, mathAnswer, correctAnswer } = req.body;

	if (req.body.address) {
		return res.status(400).send("Bot detected.");
	}

	if (!email || !message || !mathAnswer || !correctAnswer) {
		console.warn("❌ Missing required fields.");
		return res.redirect("/?error=missing#contact-section");
	}

	if (parseInt(mathAnswer) !== parseInt(correctAnswer)) {
		console.warn("❌ Math bot check failed.");
		return res.redirect("/?error=botfail#contact-section");
	}

	const transporter = nodemailer.createTransport({
		host: "secure302.inmotionhosting.com", // your specific server (check cPanel/email setup)
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
			to: "eric@harmonycue.com",
			subject: "New Contact Submission",
			text: `From: ${email}\n\n${message}`,
		});

		// Auto-reply to user
		await transporter.sendMail({
			from: "info@harmonycue.com",
			to: email,
			subject: "Thanks for reaching out!",
			html: `
				<div style="font-family: Tahoma, Geneva, sans-serif; font-size: 16px; line-height: 1.6; color: #333;">
					<img src="https://harmonycue.com/HCLogo_Dark.svg" alt="HarmonyCue Email" style="max-width: 100%; height: auto; display: block; margin-bottom: 20px;">
					<h2 style="color: #460c61; margin-top: 0;">Thanks for reaching out!</h2>
					<p>We got your message. Thank you so much. And apologies for this computer-generated response. It's just to let you know that we heard from you and a real person will reach out just as quickly as <em>humanly</em> possible.</p>
					<p style="margin-top: 20px;">🎵 HarmonyCue.com</p>
				</div>
			`,
		});

		// c•onsole.log("📨 Emails sent successfully.");
		res.redirect("/?sent=true#contact-section"); // show a success message
	} catch (err) {
		console.error("❌ Error sending emails:", err);
		res.status(500).send(`❌ Error sending emails: ${err}`);
		// res.status(500).send("An error occurred while sending your message.");
		return res.redirect("/?error=email#contact-section");
	}
});

module.exports = ({ multimixerService, samplerService }) => {
	router.get("/", async (req, res, next) => {
		try {
			const trackData = await multimixerService.getTracksList();
			const mxrTracksList = trackData[1];
			const songName = trackData[0];
			// c•onsole.log(`mxrTracksList from service:,${JSON.stringify(mxrTracksList, null, 2)} songName: ${songName}`);

			// Extract voice parts from tracks list
			const mxrVoicePartList = mxrTracksList
				.filter((track) => track.descr && track.descr.type === "voice")
				.map((track) => ({
					label: track.descr.btnletter || track.descr.name.charAt(0),
					part: track.descr.name,
				}));
			// c•onsole.log("Extracted voice parts:",JSON.stringify(mxrVoicePartList, null, 2));

			const samplerList = await samplerService.getList();
			// c•onsole.log(`samplerList: ${samplerList}`);

			// Reconstruct the complete JSON object
			const completeJsonData = {
				songname: trackData[0],
				mxrTracks: mxrTracksList,
			};

			res.render("layout/index", {
				sectionList: [
					"splash",
					"intro",
					"explainer",
					"multimixer",
					"contact",
					"sampler",
				],
				trackData,
				mxrTracksList,
				mxrVoicePartList,
				samplerList,
				query: req.query,
			});
		} catch (err) {
			next(err);
		}
	});

	return router;
};
