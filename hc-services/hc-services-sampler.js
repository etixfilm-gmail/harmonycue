// c•onsole.log(`hc-services/hc-services-sampler.js`);
// hc-services/hc-services-sampler.js gets instantiated in
// hc-routes/hc-routes-index.js by

const path = require(`path`);
const fs = require(`fs`).promises;
module.exports = {
	async getList() {
		// c•onsole.log(`hc-services/hc-services-sampler.js async getList()`);
		const filePath = path.join(__dirname, `../hc-data/hc-data-sampler.json`);
		const data = await fs.readFile(filePath, `utf-8`);
		const json = JSON.parse(data);
		// c•onsole.log(`json: ${JSON.stringify(json)}`);
		return json.samplerList; // return array of sample lines
	},
};
