![cover](https://user-images.githubusercontent.com/39160563/114103620-75df8a80-9897-11eb-8889-0d6c9fcab604.PNG)
# obs-control
A  NodeCG bundle to control an instance of OBS. 

[![Release](https://img.shields.io/github/v/release/nicnacnic/obs-control?label=Release)](https://github.com/nicnacnic/speedcontrol-layouts/releases)
![License](https://img.shields.io/github/license/nicnacnic/obs-control?label=License)
[![Twitter](https://img.shields.io/twitter/follow/nicnacnic11?style=social)](https://twitter.com/nicnacnic11)
[![Discord](https://img.shields.io/badge/-Join%20the%20Discord!-brightgreen?label=&logo=discord&logoColor=ffffff&color=7389D8&labelColor=6A7EC2)](https://discord.gg/A34Qpfe)

## About
*This is a bundle for [NodeCG](https://github.com/nodecg/nodecg); if you do not understand what that is, we advise you read their website first for more information.*

obs-control is a bundle for NodeCG to enable control of an OBS instance. This bundle is meant for speedrunning marathons, therefore it includes all the features one might need to pull off an online marathon. Gone are the days where you need to use Teamviewer to let other staff/volunteers control your stream.

### Features
- Full compatibility with OBS Websocket: preview/program, scene selection, audio mixer, stats, etc...
- Auto-Record: Record whenever you're not in an intermission
- Compatible with [NodeCG Speedcontrol](https://github.com/speedcontrol/nodecg-speedcontrol), auto-change runner input and layout based on current run

## Requirements
- [NodeCG](https://github.com/nodecg/nodecg)
- [OBS Websocket](https://github.com/Palakis/obs-websocket)

If you would like to use the [NodeCG Speedcontrol](https://github.com/speedcontrol/nodecg-speedcontrol) features, make sure to install that too. You need to use the latest version of the dev branch, the master branch will not work. Please view the [wiki](https://github.com/nicnacnic/obs-control/wiki) for more information.

## Installation
To install, navigate to your root NodeCG directory and run the following command.

```nodecg install twitchcologne/obs-control```

After the installation completes, create a config file by running `nodecg defaultconfig obs-control`. For more information please view the [setup guide](https://github.com/nicnacnic/obs-control/wiki/Setup-Guide).

## Usage
Once the bundle is configured properly, usage is pretty simple. On first load, the bundle will load all scenes and audio sources. Simply press the appropriate buttons to control OBS. A [user guide](https://github.com/nicnacnic/obs-control/wiki/User-Guide) can be found on the wiki.

## Commission Work
Commission work is available! If you don't have any coding experience, or simply don't have time to develop, I can help bring your project or event to life. More information can be found by visiting my website at [https://www.nicnacnic.com/commission-work](https://www.nicnacnic.com/commission-work) or contacting me through Discord.

## Other Bundles
- [speedcontrol-layouts](https://github.com/nicnacnic/speedcontrol-layouts) A pack of simple yet easily customizable layouts, works very well with this bundle!
- [speedcontrol-tweetr](https://github.com/nicnacnic/speedcontrol-tweetr) Control Twitter right from your NodeCG dashboard!
- [nodecg-dacbot](https://github.com/nicnacnic/nodecg-dacbot) A Discord bot to capture and stream voice channel audio to a specified audio device and show VC users.

## Contributing
There is a lot of inefficient code in this bundle. If you can optimize the code, or add new features, submit a pull request! Before you do, please make sure to **test your code**.

Bugs or glitches should first be checked against the list of [known bugs](https://github.com/nicnacnic/obs-control/wiki), then by creating an issue in the [issue tracker](https://github.com/nicnacnic/obs-control/issues). Suggestions are always welcome!

If you're having issues or just want to chat, I can be reached on my [Discord](https://discord.gg/A34Qpfe) server.

## Special Thanks
Zoton2, TBSilver, and everyone else on the NodeCG Discord server for helping me solve my many many issues.

## License
MIT  License

Copyright (c) 2021 nicnacnic

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
