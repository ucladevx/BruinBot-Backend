let { User } = require('../models/user.model');
let { BruinBot } = require('../models/bruinbot.model');
let { Event } = require('../models/event.model');
let { Path, MapNode } = require('../models/map.model');
let { Item } = require('../models/item.model');
const { deleteImageFromS3 } = require('../util/aws');

const stockImageA =
	'https://upload.wikimedia.org/wikipedia/commons/1/18/Classic_bubble_tea.jpg';
const stockImageB =
	'https://www.lindaremedical.co.uk/wp-content/uploads/2020/05/Surgical-Face-Mask.jpg';

/**
 * Make any changes you need to make to the database here
 */
async function up() {
	if (process.env.NODE_ENV != 'production') {
		let item = await Item.create({
			name: 'Boba Tea',
			price: 4.99,
			imgSrc: stockImageA,
			imgKey: 'bobat.jpg',
			weight: 0,
		});

		let freeItem = await Item.create({
			name: 'Mask',
			price: 0,
			imgSrc: stockImageB,
			imgKey: 'mask.jpg',
			weight: 0,
		});

		let bot1 = await BruinBot.create({
			name: 'Bruin Bear',
			location: {
				latitude: 34.06951864116873,
				longitude: -118.44476267506832,
			},
			inventory: [
				{
					item: item.id,
					quantity: 30,
				},
				{
					item: freeItem.id,
					quantity: 20,
				},
			],
		});

		let bot2 = await BruinBot.create({
			name: 'Polar Bear',
			location: {
				latitude: 34.070945411642384,
				longitude: -118.4469310705838,
			},
			inventory: [],
		});

		let event = await Event.create({
			name: 'Bear Gathering',
			items: [item.id, freeItem.id],
			bots: [bot1._id, bot2._id],
		});

		await User.create({
			username: 'Tim Cook',
			isOrganizer: true,
			firebaseId: 'N1EXWNjA7tSCspmewY4BGaCkdGv1',
			eventId: event._id,
		});

		let luskin = await MapNode.create({
			location: {
				latitude: 34.069888506943634,
				longitude: -118.44476926725027,
			},
			name: 'Luskin Turnaround',
		});

		let bruinBearPlaza = await MapNode.create({
			location: {
				latitude: 34.07098147809045,
				longitude: -118.44476449813108,
			},
			name: 'Bruin Bear Plaza',
		});

		let bruinBear = await MapNode.create({
			location: {
				latitude: 34.07099060696262,
				longitude: -118.4450360153614,
			},
			name: 'Bruin Bear Statue',
		});

		let wooden = await MapNode.create({
			location: {
				latitude: 34.071132290087874,
				longitude: -118.44544379215058,
			},
			name: 'John Wooden Center',
		});

		let intermedA = await MapNode.create({
			location: {
				latitude: 34.071016223707254,
				longitude: -118.44576494900431,
			},
		});

		let intermedB = await MapNode.create({
			location: {
				latitude: 34.07097435800472,
				longitude: -118.44608156712803,
			},
		});

		let pauley = await MapNode.create({
			location: {
				latitude: 34.070879622472056,
				longitude: -118.4468128216645,
			},
			name: 'Pauley Pauvilion',
		});

		await Path.create({
			points: [
				{
					latitude: 34.069888506943634,
					longitude: -118.44476926725027,
				},
				{
					latitude: 34.07012685486399,
					longitude: -118.4447756260765,
				},
				{
					latitude: 34.07035203377498,
					longitude: -118.4447835746093,
				},
				{
					latitude: 34.07054429131887,
					longitude: -118.444788343729,
				},
				{
					latitude: 34.07080502346351,
					longitude: -118.44477880549013,
				},
				{
					latitude: 34.07098147809045,
					longitude: -118.44476449813108,
				},
			],
			nodeA: luskin._id,
			nodeB: bruinBearPlaza._id,
		});

		await Path.create({
			points: [
				{
					latitude: 34.07098147809045,
					longitude: -118.44476449813109,
				},
				{
					latitude: 34.07098666454692,
					longitude: -118.44486535710692,
				},
				{
					latitude: 34.07098663052929,
					longitude: -118.44496621187203,
				},
				{
					latitude: 34.07099060696262,
					longitude: -118.4450360153614,
				},
			],
			nodeA: bruinBearPlaza._id,
			nodeB: bruinBear._id,
		});

		await Path.create({
			points: [
				{
					latitude: 34.07098147809045,
					longitude: -118.44476449813108,
				},
				{
					latitude: 34.07115849061695,
					longitude: -118.44477309762779,
				},
				{
					latitude: 34.07125060022866,
					longitude: -118.4448134730377,
				},
				{
					latitude: 34.07125559924502,
					longitude: -118.44486376445447,
				},
				{
					latitude: 34.07116506145869,
					longitude: -118.44496568839241,
				},
				{
					latitude: 34.071139510900274,
					longitude: -118.44500390986913,
				},
				{
					latitude: 34.07114062179325,
					longitude: -118.44521379273796,
				},
				{
					latitude: 34.071145065369116,
					longitude: -118.4453297982726,
				},
				{
					latitude: 34.071132290087874,
					longitude: -118.44544379215058,
				},
			],
			nodeA: bruinBearPlaza._id,
			nodeB: wooden._id,
		});

		await Path.create({
			points: [
				{
					latitude: 34.071132290087874,
					longitude: -118.44544379215058,
				},
				{
					latitude: 34.071097844573245,
					longitude: -118.44549089595908,
				},
				{
					latitude: 34.07109563029365,
					longitude: -118.44563389597036,
				},
				{
					latitude: 34.07109390916463,
					longitude: -118.44579291095665,
				},
				{
					latitude: 34.071016223707254,
					longitude: -118.44576494900431,
				},
			],
			nodeA: wooden._id,
			nodeB: intermedA._id,
		});

		await Path.create({
			points: [
				{
					latitude: 34.071016223707254,
					longitude: -118.44576494900431,
				},
				{
					latitude: 34.07102075756143,
					longitude: -118.4454654116672,
				},
				{
					latitude: 34.07101674571907,
					longitude: -118.44524674240192,
				},
				{
					latitude: 34.07099060696262,
					longitude: -118.4450360153614,
				},
			],
			nodeA: intermedA._id,
			nodeB: bruinBear._id,
		});

		await Path.create({
			points: [
				{
					latitude: 34.071016223707254,
					longitude: -118.44576494900431,
				},
				{
					latitude: 34.07099647710191,
					longitude: -118.4458833128536,
				},
				{
					latitude: 34.07097435800472,
					longitude: -118.44608156712803,
				},
			],
			nodeA: intermedA._id,
			nodeB: intermedB._id,
		});

		await Path.create({
			points: [
				{
					latitude: 34.07097435800472,
					longitude: -118.44608156712803,
				},
				{
					latitude: 34.070975317479814,
					longitude: -118.44618521910529,
				},
				{
					latitude: 34.070940926691755,
					longitude: -118.44639085299089,
				},
				{
					latitude: 34.07087467320068,
					longitude: -118.44640107397927,
				},
				{
					latitude: 34.07086636865083,
					longitude: -118.44657418982258,
				},
				{
					latitude: 34.070867224278444,
					longitude: -118.44664117496886,
				},
				{
					latitude: 34.070873270708695,
					longitude: -118.44669887795772,
				},
				{
					latitude: 34.070873563722294,
					longitude: -118.44669653640281,
				},
				{
					latitude: 34.070879622472056,
					longitude: -118.4468128216645,
				},
			],
			nodeA: intermedB._id,
			nodeB: pauley._id,
		});
	}
}

/**
 * Make any changes that UNDO the up function side effects here (if possible)
 */
async function down() {
	if (process.env.NODE_ENV != 'production') {
		await User.deleteMany({});
		await BruinBot.deleteMany({});
		await Event.deleteMany({});
		await Path.deleteMany({});
		await MapNode.deleteMany({});
		let items = await Item.find({});
		await Item.deleteMany({});
		for (let i = 0; i < items.length; i++) {
			let imgKey = items[i].imgKey;
			if (items[i].imgSrc != stockImageA && items[i].imgSrc != stockImageB) {
				await deleteImageFromS3(imgKey);
			}
		}
	}
}

module.exports = { up, down };
