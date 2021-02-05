const { EzloHub, EzloCloudResolver, discoverEzloHubs,
	UIBroadcastHouseModeChangeDonePredicate, UIBroadcastHouseModeChangePredicate} = require('ezlo-hub-kit');

// Define mapping of House Mode (ids) to Scene Names to execute upon mode change
const defaulSceneMap = {
	'1': "Return",    //Home
	'2': "Leave",     //Away
	'3': "Sleep",     //Night
	'4': "Vacation"   //Vacation
};

// Shutdown in a clean manner
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Track hubs for clean shutdown on exit
const hubs = {};

// Retrieve the MIOS user credentials and optionally, a scene map, from the environment
const miosUser = process.env.miosUser;
const miosPassword = process.env.miosPassword;
const sceneMap = (process.env.sceneMap && JSON.parse(process.env.sceneMap)) || defaulSceneMap;
console.log("Using scene map\n%s", JSON.stringify(sceneMap, null, 2));

// Discover all local Ezlo Hubs and register handlers for each
discoverEzloHubs(new EzloCloudResolver(miosUser, miosPassword), async (hub) => {

	// Log info about the discovered hub
	const info = await hub.info();
	console.log('Managing HouseMode Scenes for: %s, architecture: %s\t, model: %s\t, firmware: %s, uptime: %s',
		info.serial, info.architecture, info.model, info.firmware, info.uptime);

	// Ezlo Hubs default to waiting 30 seconds before switching from one House Mode to another, 
	// so let's register a handler to log an informative message when a hub starts house mode change
	hub.addObserver(UIBroadcastHouseModeChangePredicate, (msg) => {
		console.log(`+ Ezlo ${hub.identity}: Changing from House mode ${msg.result.from} to mode ${msg.result.to} in ${msg.result.switchToDelay} seconds`);
	});

	// Register an observer of the HouseMode change complete broadcast message that will execute the scene upon mode transition
	// Observer will be called everytime the hub finishing changing modes, regardless of the mechanism used to change modes
	hub.addObserver(UIBroadcastHouseModeChangeDonePredicate, async (msg) => {

		// Run scene for this mode transition, if one exists
		const sceneName = sceneMap[msg.result.to]
		console.log(`- Ezlo ${hub.identity}: Transitioned to House Mode ${msg.result.to}.  "${sceneName}" scene in context.`);

		try {
			const scene = await hub.scene(sceneName);
			if ( scene ) {
				console.log(`➔ Ezlo ${hub.identity}: Executing scene ${scene.name}:${scene._id}`);
				await hub.runScene(scene._id);
				console.log(`✓ Ezlo ${hub.identity}: ${scene.name} scene finished`);
			}
		} catch(err) {
		  console.log(`✖ ${hub.identity}: Failed to run scene ${sceneName}:${scene._id} - ${err}`);
		}
	});

	// Track hubs for clean shutdown on exit
	hubs[hub.identity] = hub;
});

function shutdown() {
    console.log('Disconnecting from ezlo hubs and mqtt broker');
    Promise.all(Object.values(hubs).map(hub => hub.disconnect()))
    .then(() => {
        process.exit();
    });
}

