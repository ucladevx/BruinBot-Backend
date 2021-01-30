let { BruinBot } = require('../models/bruinbot.model');

/**
 * Make any changes you need to make to the database here
 */
async function up() {
	// Write migration here
	if (process.env.NODE_ENV != 'production') {
		let bots = await BruinBot.find();

		bots.forEach(async (bot) => {
			bot.inventory.forEach((article) => {
				article.set({
					sales: {
						numSold: 0,
					},
				});
			});

			await bot.save();
		});
	}
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down() {
	// Write migration here
	if (process.env.NODE_ENV != 'production') {
		let bots = await BruinBot.find();

		bots.forEach(async (bot) => {
			bot.inventory.forEach((article) => {
				article.sales = undefined;
			});

			await bot.save();
		});
	}
}

module.exports = { up, down };
