![logo](https://github.com/hakkane84/Decentralizer/blob/master/logo.png)
# D1c (*Decentralizer 1-click*)

Website: https://keops.cc/decentralizer

Simple tool for Sia renters that detects and eliminates dangerous hosting farms among the contracts list of the renter. These dangerous farms are identified by the [alert system of SiaStats.info](htps://siastats.info/hosting_farms)

Ready-to-use binaries for Windows, MacOS and Linux can be downloaded here: https://github.com/hakkane84/D1c/releases

D1c removes contracts with dangerous farms indicated by SiaStats.info, as those that have been proved they are attempting a Sybil attack. In case SiaStats is unavailable (for example during to a DDoS attack to its servers), a local copy of this database is used (`siastats_farms_database.json`). This file can be updated manually: ask in the Sia official Discord in case you require an up-to-date database file.

## Usage of the binaries:

* Enable the app on your AntiVirus and Firewall
* Double-click on the binary
* Confirm you want to remove the listed contracts (press `y`)
* Done!

After canceling contracts, your Sia client will form replacement contracts with new hosts, as long as your wallet is unlocked. Some time after creating these new contracts (this can be accelerated by restarting Sia), Sia's file repair capabilities will upload the pieces of files to the new hosts. If file redundancy does not start recovering a few minutes after removing contracts, then restart Sia. Keep in mind that the **file repair will incur Siacoin expenses**: new contracts will be formed, data will be uploaded to the replacement hosts and if you don't have the files locally anymore, the files will be downloaded first from the rest of available hosts (incurring download expenses).

These binaries were compiled using `pkg` (https://github.com/zeit/pkg)

![screenshot](https://github.com/hakkane84/D1c/blob/master/screenshot.JPG)

## Usage of the non-compiled script

* Install node.js
* Use the same commands mentioned above, as for example `node decentralizer.js remove auto`
* An additional command is available: `test x`, which will remove `x` random contracts from your list. It is meant exclusively for developers testing Sia's file repair

## Dependencies of the non-compiled script

In order to use the node.js script contained in this repository, the following dependencies are required:

* Sia.js
* babel-runtime

## Acknowledgements

I want to thank [tbenz9](https://github.com/tbenz9) for his code contributions to the full Decentralizer script

## Donations

Siacoin: `bde3467039a6d9a563224330ff7578a027205f1f2738e1e0daf134d8ded1878cf5870c41927d`




