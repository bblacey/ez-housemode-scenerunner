# EZ-HouseMode-SceneRunner
![Continuous Integration](https://github.com/bblacey/ez-housemode-scenerunner/workflows/Continuous%20Integration/badge.svg)![Docker to ghcr.io](https://github.com/bblacey/ez-housemode-scenerunner/workflows/Docker%20to%20ghcr.io/badge.svg)

Easy (EZ) Node.js app that runs a scene on Ezlo Hub(s) whenever the hub transitions to a new House Mode.  For convenience, the app is deployed as a dockerized app for Intel/AMD and ARM platforms.

## Motivation
This EZ-App illustrates the simplicity of using [Ezlo-Hub-Kit](https://github.com/bblacey/ezlo-hub-kit) to discover hubs, register observers to asynchronously act on House Mode changes and execute scenes on Ezlo Hubs. This EZ-App will appeal to Vera Users who have grown accustomed to employing scenes triggered by House Mode changes because, as of this writing, Ezlo Hub scenes can not use House Mode changes as a trigger. [EZ-HouseMode-SceneRunner](https://github.com/bblacey/ez-housemode-scenerunner) bridges this obvious gap until Ezlo implements the feature to trigger scenes by a House Mode change.

## How it works
Easy HouseMode-SceneRunner registers House Mode change observers for each hub that it discovers on the local network.  Because Ezlo Hubs default to waiting 30 seconds to change to House Modes "Night", "Away" and "Vacation", it demonstrates how to use multiple hub observers. One Observer triggers when a hub starts to change House Modes and one another Observer triggers when the hub completes the House Mode change.  The former is simply used to log the fact that a hub has initiated a house mode change and the later is used to execute a scene for that mode.  For convenience, EZ-HouseMode-SceneRunner includes a default scene map but users are able to override it by providing a custom map as a JSON file that maps a scene to a scene name.  EZ-HouseMode-SceneRunner is intentionally limited to using a single scene name for each mode, meaning that multible Ezlo hubs need to use the same scene name for a given mode (e.g. Home => Return, Night => Sleep, Away => Leave, etc.).

## Usage
1. Start the dockerized EZ-HouseMode-SceneRunner app
```shell
$ docker run -it --network host \
             --name ez-mode-scenerunner \
             -e miosUser=<MIOS Portal User> \
             -e miosPassword=<MIOS Password> \
             ghcr.io/bblacey/ez-housemode-scenerunner
```
3. Verify that the application starts successfully, discovers the local Ezlo hubs and acts upon Ezlo hub House Mode changes.  You can verify the behavior by changing the House Mode on one or more of your Ezlo Hubs.  

The log snippet below shows the Easy HouseMode-SceneRunner app starting, reporting the discovered Ezlo Hubs and executing a scene for a given mode change. For this case, the mode was changed to Night on the Vera that the compainion app EZ-HouseMode-Synchronizer propogated to each Ezlo Hub which in turn was detected by EZ-HouseMode-SceneRunner to run the appropriate scene, if the named scene for the transition mode exists on the hub.
```
Using scene map
{
  "1": "Return",
  "2": "Leave",
  "3": "Sleep",
  "4": "Vacation"
}
Managing HouseMode Scenes for: 92000014, architecture: armv7l	, model: h2_secure.1	, firmware: 2.0.7.1313.16, uptime: 3d 8h 1m 57s
Managing HouseMode Scenes for: 90000369, architecture: armv7l	, model: h2.1	, firmware: 2.0.7.1313.16, uptime: 1d 19h 12m 22s
Managing HouseMode Scenes for: 90000330, architecture: armv7l	, model: h2.1	, firmware: 2.0.7.1313.16, uptime: 3d 22h 23m 28s
Managing HouseMode Scenes for: 70060017, architecture: esp32	, model: ATOM32	, firmware: 0.8.528, uptime: 3d 23h 39m 47s
Managing HouseMode Scenes for: 76002425, architecture: esp32	, model: ATOM32	, firmware: 0.8.528, uptime: 0d 21h 39m 17s
Managing HouseMode Scenes for: 70060095, architecture: esp32	, model: ATOM32	, firmware: 0.8.528, uptime: 0d 9h 8m 15s
+ Ezlo 90000369: Changing from House mode 1 to mode 3 in 10 seconds
+ Ezlo 92000014: Changing from House mode 1 to mode 3 in 30 seconds
+ Ezlo 90000330: Changing from House mode 1 to mode 3 in 1 seconds
+ Ezlo 70060017: Changing from House mode 1 to mode 3 in 20 seconds
+ Ezlo 76002425: Changing from House mode 1 to mode 3 in 30 seconds
+ Ezlo 70060095: Changing from House mode 1 to mode 3 in 1 seconds
+ Ezlo 90000330: Changing from House mode 1 to mode 3 in 0 seconds
- Ezlo 90000330: Transitioned to House Mode 3.  "Sleep" scene in context.
+ Ezlo 70060095: Changing from House mode 1 to mode 3 in 0 seconds
- Ezlo 70060095: Transitioned to House Mode 3.  "Sleep" scene in context.
➔ Ezlo 70060095: Executing scene Sleep:scene_679E756306322DFC
✓ Ezlo 70060095: Sleep scene finished
+ Ezlo 90000369: Changing from House mode 1 to mode 3 in 0 seconds
- Ezlo 90000369: Transitioned to House Mode 3.  "Sleep" scene in context.
+ Ezlo 70060017: Changing from House mode 1 to mode 3 in 0 seconds
- Ezlo 70060017: Transitioned to House Mode 3.  "Sleep" scene in context.
+ Ezlo 92000014: Changing from House mode 1 to mode 3 in 0 seconds
- Ezlo 92000014: Transitioned to House Mode 3.  "Sleep" scene in context.
+ Ezlo 76002425: Changing from House mode 1 to mode 3 in 0 seconds
- Ezlo 76002425: Transitioned to House Mode 3.  "Sleep" scene in context.
```
There are a few take-aways from the log snippet above.  First, six hubs are discovered. Second, several hubs are configured with a different scene transition time that EZ-HouseMode-SceneRunner reports when it detects that a hub is starting the transition to a new mode.  Third, only one of the six hubs (hub 70060095) has a scene named "Sleep" mapped to the Night House Mode so only that hub was instructed to execute the Sleep scene.  Finally, the hubs complete their house mode transition in ascending "switch-delay" order even though they initiated the mode change in reverse order - this demonstrates Ezlo-Hub-Kit waiting for a hub to acknowlege a successful transition that clients can use to trigger the next step which in this case, is executing a scene.  Each of the events happens asynchronously as a result of a hub broadcasting updates in response to actions.

### Scene Map
The default scene map provides general scene names for each house mode.  EZ-HouseMode-SceneRunner will execute the named scene when a hub transitions to a new mode if that scene name exists on the hub.  So, if a user wants all their hubs to run a scene whenever they return home, they can either create a "Return" scene on each hub or create a custom name and provide a custom scene map to the app.
```JSON
{
  "1": "Return",
  "2": "Leave",
  "3": "Sleep",
  "4": "Vacation"
}
```
For example, if a user wanted the scene that is run their hubs transition to Night Mode (3) to be call "Boo-yah", they would create a file with the contents above and change the name to "Boo-yah" for the corresponding mode.

To pass the custom scene map to the app, the user will either specify it when running `docker run` or include it in the `docker-compose` file. For example:
```shell
docker run "sceneMap=$(<scene-map.json)" ...
```

### Production use
To run the dockerized Easy House-Mode-Synchronizer as a persistent process you can use docker-compose (recommended) or run the docker container 'detached' as a background process.

First, for either option, create or download [config.env](config.env) and edit the file to to use your MIOS portal username and password.

#### *docker-compose* (recommended)
For those users who prefer to use `docker-compose`, you can download the [docker-compose.yml](docker-compose.yml) and start the relay with.
```shell
docker-compose up -d .
```
Compose users may find the [EZ-Apps](https://github.com/bblacey/ez-apps) github project useful.  It comprises a docker-compose file with unified config files need to run the EZ-App suite with a simple `docker-compose up -d`.

#### *docker run --detatch* (alternative)
Start the relay in detached mode.
```shell
$ docker run --detach --network host \
             --name ez-mode-sync \
             --env-file config.env \
             ghcr.io/bblacey/ez-housemode-synchronizer
```
