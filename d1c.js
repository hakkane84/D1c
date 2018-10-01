var fs = require('fs');
var sia = require('sia.js');
var http = require('request');

// Passing arguments
var argument1 = process.argv[2]
var argument2 = process.argv[3]

console.log()
console.log('\x1b[44m%s\x1b[0m', "*** KEOPS D1c (Decentralizer 1-click) v1.0 ***")
console.log()

siaContracts()


function siaContracts() {
    // Requesting the contracts list with an API call:
    console.log("Connecting to Sia...")
    sia.connect('localhost:9980')
    .then((siad) => {siad.call('/renter/contracts')
        .then((contractsAPI) => {
            var contracts = contractsAPI.contracts
            siastatsQuery(contracts)
        })
        .catch((err) => {
            console.log("Error retrieving data from Sia. Is Sia working, synced and connected to internet? Do you currently have active contracts as a Renter? Try this script again after restarting Sia.")
            console.log()
            stopScript()
        })
    })
    .catch((err) => {
        console.log("Error connecting to Sia. Start the Sia app (either daemon or UI) and try again")
        console.log()
        stopScript()
    })
}


function siastatsQuery(contracts) {
    process.stdout.write("Connecting to SiaStats.info... ")
    http.get("http://siastats.info/dbs/farms_api.json").on('response', function (response) {
        var body4 = '';
        var i4 = 0;
        response.on('data', function (chunk4) {
            i4++;
            body4 += chunk4;
        });
        response.on('end', function () {
            testChar = body4.slice(0,1)
            if (testChar == "[") {
                var siastatsFarms = JSON.parse(body4)
                process.stdout.write("Done\n")
                
                // On success, save the file locally for future access in case SiaStats is unavailable
                var stream = fs.createWriteStream('siastats_farms_database.json')
                var string = JSON.stringify(siastatsFarms)
                stream.write(string)
                
                // Proceed
                siastatsProcess(contracts, siastatsFarms)
            } else {
                siastatsOpenFile(contracts)
            }
        })
        response.on('error', function (chunk4) {
            siastatsOpenFile(contracts)
        });
    })
}

function siastatsOpenFile(contracts) {
    // On failed retrieval, open the local file instead
    process.stdout.write("Failed\n")
    process.stdout.write("Opening the local copy of SiaStats database instead... ")
    var stream2 = fs.createReadStream('siastats_farms_database.json')
    var data2= ''
    var chunk2
    stream2.on('readable', function() { //Function just to read the whole file before proceeding
        while ((chunk2=stream2.read()) != null) {
            data2 += chunk2;}
    });
    stream2.on('end', function() {
        if (data2 != "") {
            var siastatsFarms = JSON.parse(data2)
        } else {
            var siastatsFarms = []
        }
        process.stdout.write("Done\n")
        siastatsProcess(contracts, siastatsFarms)
    })
    stream2.on('error', function() {
        // On error opening the file, just proceed to show the farms on screen
        process.stdout.write("Failed\n")
        console.log("Error: the file 'siastats_farms_database.json' could not be accessed. Download D1c again")
        stopScript()
    })
}


function siastatsProcess(contracts, siastatsFarms) {
    // This function compares the contracts with the list of siastats farms, creating a farm list
    
    // A - initializing the array
    var farmList = []
    for (var i = 0; i < siastatsFarms.length; i++) {
        farmList.push({
            farm: siastatsFarms[i].farm,
            hosts: []
        })
    }

    // B - Adding contracts to farms if they are alerted by SiaStats
    for (var i = 0; i < siastatsFarms.length; i++) {
        if (siastatsFarms[i].alert == true) {
            farmList[i].message = siastatsFarms[i].message // Adding the message
            
            for (var j = 0; j < siastatsFarms[i].hosts.length; j++) { // For each host in the farm
                for (var k = 0; k < contracts.length; k++) { // Iterating on contracts
                    if (siastatsFarms[i].hosts[j].pubkey == contracts[k].hostpublickey.key) {
                        farmList[i].hosts.push({
                            ip: contracts[k].netaddress,
                            contract: contracts[k].hostpublickey.id,
                            cost: parseFloat((contracts[k].totalcost/1000000000000000000000000).toFixed(2)),
                            data: parseFloat((contracts[k].size/1000000000).toFixed(2)), // In GB
                            pubkey: contracts[k].hostpublickey.key
                        })
                    }
                }
            }
        }
    }

    // C - Removing farms without contracts
    for (var i = 0; i < farmList.length; i++) {
        if (farmList[i].hosts.length == 0) {
            farmList.splice(i, 1)
            i--
        }
    }

    showFarms(farmList)
}


function showFarms(farmList) {
    console.log()
    if (farmList.length > 0) {
        console.log("Dangerous farms detected among your contract list:")
        var listNumber = 1
        for (var i = 0; i < farmList.length; i++) {
            console.log("- " + farmList[i].farm + ":")
            console.log('\x1b[32m%s\x1b[0m', "     SiaStats alert: " + farmList[i].message)
            for (var j = 0; j < farmList[i].hosts.length; j++) {
                console.log("     * [" + listNumber + "] " + farmList[i].hosts[j].ip + " - Value: " + farmList[i].hosts[j].cost + "SC - Data: " + farmList[i].hosts[j].data + "GB")
                listNumber++
            }
        }

        // Input for removing contracts
        console.log()
        console.log("The contracts with all the hosts displayed above will be canceled. Proceed? (y/n)")

        var stdin = process.stdin;
        stdin.setRawMode( true );
        stdin.resume();
        stdin.setEncoding( 'utf8' );
        stdin.on( 'data', function( key ){
            if ( key === 'y' ) {
                // Preparing the array of contracts to remove
                contractsToRemove = []
                for (var i = 0; i < farmList.length; i++) {
                    for (var j = 0; j < farmList[i].hosts.length; j++) {
                        contractsToRemove.push({
                            ip: farmList[i].hosts[j].ip,
                            contract: farmList[i].hosts[j].contract
                        })
                    }
                }
                var contractNum = 0
                var attempt = 0
                cancelContract(contractNum, contractsToRemove, attempt)

            } else {
                process.exit()
            }
            process.stdout.write( key );
        });

    } else {
        console.log("No contracts formed with dangerous farms have been detected")
        stopScript()
    }
}


function cancelContract(contractNum, contractsToRemove, attempt) {
    // Iterates on contractsToRemove canceling the contract
    process.stdout.write("\n(" + (contractNum+1) + "/" + contractsToRemove.length + ") Canceling contract with host: " + contractsToRemove[contractNum].ip + " ...")
    
    var contractID = contractsToRemove[contractNum].contract
    var command = "/renter/contract/cancel?id=" + contractID

    sia.connect('localhost:9980')
    .then((siad) => {siad.call({
            url: command,
            method: 'POST'
        })
        .then((API) => {
            process.stdout.write(" Done")
            attempt = 0
            contractNum++
            if (contractNum < contractsToRemove.length) {
                cancelContract(contractNum, contractsToRemove, attempt)
            } else {
                // End script
                console.log("")
                console.log("\nDone!")
                stopScript()
            }

        })
        .catch((err) => {
            attempt++
            process.stdout.write(" RETRYING")
            if (attempt > 3) {
                console.log("Error with command. This contract was not canceled (Are you using Sia 1.3.4 or above?): " + contractsToRemove[contractNum].ip)
                contractNum++
                cancelContract(contractNum, contractsToRemove, attempt)
            } else { // Retry up to 3 times
                cancelContract(contractNum, contractsToRemove, attempt)
            }
        })
    })
    .catch((err) => {
        attempt++
        process.stdout.write(" RETRYING")
        if (attempt > 3) {
            console.log("Error connecting to Sia. This contract was not canceled: " + contractsToRemove[contractNum].ip)
            contractNum++
            cancelContract(contractNum, contractsToRemove, attempt)
        } else { // Retry up to 3 times
            cancelContract(contractNum, contractsToRemove, attempt)
        }
    })

}

function stopScript() {
    // Final imput from user for previntimng the window to close without him reading the logs
    console.log()
    console.log("Press any key to close this program")
    
    // Input form
    var stdin = process.stdin;
    stdin.setRawMode( true );
    stdin.resume();
    stdin.setEncoding( 'utf8' );
    stdin.on( 'data', function( key ){
        if ( key != '' ) {
            process.exit();
        }
        process.stdout.write( key );
    });
}
