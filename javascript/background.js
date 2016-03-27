var watchList = [],
    runningSessions = [],
    currentSite = '',
    buzz = new Audio(),
    sessionLimit = 10,
    activeSnoozeTime = 2,
    passiveSnoozeTime = 2;

function inWatchList(siteUrl)
{
    return (watchList.indexOf(siteUrl) != -1);
}

function inRunningSessions(siteUrl)
{
    return (runningSessions.indexOf(siteUrl) != -1);
}

function updateWatchList(items)
{
    watchList = items;
    //localStorage.setItem('watchlist', items);
}

function startSession(siteUrl)
{
    runningSessions.push(siteUrl);
    chrome.alarms.create(siteUrl, {"delayInMinutes": sessionLimit});
    //localStorage.setItem('runningSessions', runningSessions);
}

function endSession(siteUrl)
{
    runningSessions.splice(runningSessions.indexOf(siteUrl), 1);
    chrome.alarms.clear(siteUrl);
    //localStorage.setItem('runningSessions', runningSessions);
}

function updateSessions(tab) {
    // console.log(tab);
    currentSite = getSiteUrl(tab.url);

    if(inWatchList(currentSite) && !inRunningSessions(currentSite)) {
        startSession(currentSite);
    }

    if(inRunningSessions(currentSite) && !inWatchList(currentSite)) {
        endSession(currentSite);
    }
}

function clearObsoletedSessions()
{
    for (i = 0; i < runningSessions.length; i++) {
        var tabUrl = runningSessions[i];
        chrome.tabs.query({"url" : tabUrl + '/*' }, function(tabs) {
            if(tabs.length == 0) {
                console.log('Ending session as no tab found for : '+ tabUrl);
                endSession(tabUrl);
            }
        });
    }
}

function reviveMissedAlarms() {
    for (i = 0; i < runningSessions.length; i++) {
        var siteUrl = runningSessions[i];

        chrome.alarms.get(siteUrl, function (alarm) {
            if (alarm == undefined) {
                console.log('Reviving alarm for : ' + siteUrl);
                chrome.alarms.create(siteUrl, {"delayInMinutes": passiveSnoozeTime});
            }
        });
    }
}

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
    if (change.status == "complete") {
        updateSessions(tab);
    }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
    chrome.tabs.get(activeInfo.tabId, function(tab) {
        if(tab.url) {
            updateSessions(tab);
        }
    });
});

chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
    clearObsoletedSessions();
});


chrome.storage.onChanged.addListener(function(changes, namespace) {
    for (key in changes) {
        var storageChange = changes[key];
        //Available info: key, namespace, storageChange.oldValue, storageChange.newValue

        if('ajaxray.session_timer.domains' == key) {
            updateWatchList(storageChange.newValue);
            withCurrentTab(function(tab) {
                updateSessions(tab);
            });
        }

        if('ajaxray.session_timer.settings' == key) {
            settings = storageChange.newValue;
        }
    }
});

chrome.alarms.onAlarm.addListener(function (alarm) {
    if('reviveMissedAlarms' == alarm.name) {
        reviveMissedAlarms();

    } else {
        var opts = {
            "type" : "basic",
            "iconUrl" : "data:image/png;base64,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",
            "title" : "Times Up!",
            "message" : "Time for "+ alarm.name + " is over! \nGet back to productivity!",
            "buttons" : [
                {"title": "Snooze (Give me "+ activeSnoozeTime +" minutes)", "iconUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADlklEQVRYR8XXd8h2cxgH8M9rk/DaRUjZIdl7i6w3sqJkh1JmSv6REpGkrBAZSUJGyCZ7ZGZkZJYtkZHQ9+06b+c57nOf+/7ruer54z7nun6/7/le43s9c8yyzZnl+00CYFc8jz+nBLsEtsSz4+KGAJyDi3AHjpwCQM69HYfgdFzZF9sHYDFcg2NagWHiqQlB7IFHW75X4zT83Y0fBWAF3I2dyjnUH4fb6ve6CJiNsGI9+w7v4El8VM+OxnXIx8QeK0Z+boPoAtgAD2DtcvoG8/AiDsXZ2GKAhZdwSX3EDrinBfQD7NcCOaMI18SbWLYueLuc/8Ut2HlC+hu3xxEWwsD9xVje/YhN8FV+dBm4FicWC0dgPTyElerUf3BfFWVY+bqer4ZtcXiBXqjF4N74pGL2wVU4tUHZBbAIjq/cJdfPYflyzoV59+4AExvjemxVft9juwJxQr1bUIx9XZAefg0b1iFJwbGjqrgHzKK4GWEx9lbNhL8m6YL4nI8LyvlBHIDQP40tXOnbs4LOxcWTAFgaX2C5KpjUQWhsLEU5ztqsropU/jJ11hr4rR08KgWp3JvKKUxc2LltGgAJDZM5J3ZUa57MfzAKQMbuYRWwetMuLRB537b4bF8P3mvVTeOzFj6tHxnPM0b6KAAfYp2ibv0BupOmCFUG2LfYpnVZO/TjGm7vl++Cd6MAJEdLIcWXqdVnqfSHsRt+xy54ucf5EexV+U+NjQWQHk0F31Wzuw/AjSVW6Y6oXvSjz+7FgdXGAT4WwE/VAU9g954Tz2sV51m4bCBVz2BH/NDShfkho1LwSglOFG4VdKs+wyXKmNjI7CkDl2csp43nVoq2HmLgitLu+GWEvtC54A8sPubS7kfly8NA7HKcMQQge8DT5ZSWa8ZpEzftHEgtHVzBkefoy9gayBe8UZKZy1LdzRcksDsHumREERtLDWURib2OzbvOfWIUCY0Mx6LbScXnA7nuvs5+EQXNOI5lTcuOMMPGLaWR1Kxisc+wP7KkTGKb1t6Q2R/LfnnyqMBxAFJoYSH7Xyy74aXVcmnVUZbd4cz6awo1KdgX/5PiHDC0li+JW3FQ67Z0QTbe0PtlPY8eZCOK9LY75M5ayxIz0oYANEEn1f8H6eVJLH0f/b9hyHlSADknmp6aiJpthmbva+7ISH61hlTG9K9Dl0+Sgr4zsjlHKVeuSRkljNL9MsmlbZ9pGJj27In8Zx3Af4BpryGwIDjGAAAAAElFTkSuQmCC"},
                {"title": "Close tab", "iconUrl": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADWUlEQVRYR8WXWahOURTHf9eQkjEzRZlJJEpeDBkzFDITQl5IGSIv8qgIpZAiQ+gaopB5CA/yQpTZA2UO5cFwjf1va9f+9j37nPN938NdL3ffb6+91n/N61RQy1RRy/opFUA7oDvQAqgDfAKeAq+LNagYAFK4BJgMdI4oegmcAvYC9/OAyQOgLbAJmG3W5pErnjPAVOBn2oMsAKOBQ0BLT8gH4DxwD3gP/AUUkoHAGAvLH2C+vU0FnAZgFnAAqGcSHgPrgZPA74jU+hYigToe8OhuEHDL/z0GQJaf9ZRvAdYBVXn9H/A1AI4C44FpZkQ1SxIAxfyB5/YVwLYSFetZQ1Moo0RvgK7A9xiAg8BcY5blq8pQ3tiScYjJeAuMBB46maEHVGqPLNsV835luL2ZJaviLnoFjACep+XAZs/i6cCxEq1X1VwE+tv7F6ZcfaKAQg+IUU1GpdYhJdvTcKkkLwO9jUkeldsV+xrkA9BDx6TyUx076mGHJxke6QhcsSQTq3qFku9j7J0PYChw3RhXAlvt3Au4CvwDhgMxEF1MeSd7dwcYC3xJA+0DmAKcMOY5wGE77wEW2vkdMCwBRE9T3t74bgITgK9ZOZQHgJqIknGiB0KeUJWI+lrMW9n/l4BJwLcs5brPEwLxxUCozi8AzU3ZaUDV8yNBubyqSSpaanOkAIA6oBqFSM1oXiAkBBHqUKtVA/sVsVytfZzdN3L9JSxDNQklk7JW8QyHTgzEfmARoCmYRFKoyam2fBsY7JhCAJr7q+1yhg2QUGAIYiewzMZyLOy6326XGmobYwC6WXJpzdKKpQRLWigciGcGWCUao6ZWNW3M7SpTVVM1JU3DfV4TEurlEcnaE+TyNOV6WmmJqXMNeUkAWts41l/RGlvJUoyMXvkhVZftEzam2EKiqXUO0BYj2mFDKqm8krQ3AXYB2qpEWmRGATdC5rSVTJuL9kEHQoNqgyVmbDNSbqh8xee6oipJQMIVLZoDPkh1vCOAEsjRZ0Dd7q4lk3JAygbY4JH1jjRVZwLXYkHK2or1TrNdZbMAqJszEbSUqjesTZuEkpUHgNOpPWGxtVMNnyRS6erDZDegkGVSMQB8YfKK+zTT7/o0U0+Izv1yQpBpRTkMpXqgHJ0Fb/8DqKSrIROelWQAAAAASUVORK5CYII="}
            ]
        };
        buzz.play();
        chrome.notifications.create(alarm.name, opts);
    }
});

chrome.notifications.onButtonClicked.addListener(function(notificationId, buttonIndex) {
    //console.log("Clisked " + buttonIndex + " on "+ notificationId);
    if(buttonIndex == 0) {
        // Reset Alerm. notificationId = siteUrl
        chrome.alarms.create(notificationId, {"delayInMinutes": activeSnoozeTime});

    } else {
        chrome.tabs.query({"url" : notificationId + '/*' }, function(tabs) {
            for(key in tabs) {
                var tab = tabs[key];
                chrome.tabs.remove(tab.id);
            }
        });
        endSession(notificationId);
    }
    chrome.notifications.clear(notificationId);
});

//chrome.notifications.onClosed.addListener(function(notificationId, byUser) {
//    if(inRunningSessions(notificationId)) {
//        if(byUser) {
//            console.log('Resetting alerm for user close: '+ notificationId);
//            chrome.alarms.create(notificationId, {"when": Date.now() + (activeSnoozeTime * 1000)});
//        } else {
//            console.log('Resetting alerm for system close: '+ notificationId);
//            chrome.alarms.create(notificationId, {"when": Date.now() + (passiveSnoozeTime * 1000)});
//        }
//    }
//});


// Initial activities
buzz.src = "audio/buzz.mp3";

loadSettings(function(options) {
    sessionLimit = options.sessionLimit;
    activeSnoozeTime = options.snoozeTime;
});
chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    updateSessions(tabs[0]);
});

withWatchlist(function(items) {
    updateWatchList(items);
});

chrome.alarms.create('reviveMissedAlarms', {
    "delayInMinutes": 2,
    "periodInMinutes": 2
});