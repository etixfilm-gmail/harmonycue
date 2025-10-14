// c•onsole.log("hc-services/hc-services-multimixer.js");
// hc-services/hc-services-multimixer.js gets instantiated in
// hc-routes/hc-routes-index.js by

const path = require("path");
const fs = require("fs").promises;

module.exports = {
	async getTracksList() {
		const filePath = path.join(__dirname, "../hc-data/hc-data-multimixer.json");
		const data = await fs.readFile(filePath, "utf-8");
		const json = JSON.parse(data);
		return [json.songname, json.mixtracks]; // returns array of track objects
	},
	async getVoicePartList() {
		const filePath = path.join(__dirname, "../hc-data/hc-data-multimixer.json");
		const data = await fs.readFile(filePath, "utf-8");
		const json = JSON.parse(data);
		return json.voiceparts;
	},
};
