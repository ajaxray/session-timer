var settings;
var defaultSettings = {
    'sessionLimit' : 10,
    'snoozeTime' : 2
};

function parseUrl(url)
{
    var parser = document.createElement('a');
    parser.href = url;

    return parser;
}

function getSiteUrl(url)
{
    var parsed = parseUrl(url);
    return parsed.protocol + '//' + parsed.hostname;
}

function isEmpty(object) {
    for(var key in object) {
        if(object.hasOwnProperty(key)){
            return false;
        }
    }
    return true;
}

function withWatchlist(callback)
{
    chrome.storage.sync.get('ajaxray.session_timer.domains', function(items) {
        var watchList = isEmpty(items['ajaxray.session_timer.domains']) ? [] : items['ajaxray.session_timer.domains'];
        callback(watchList);
    });
}

function addToWatchlist(url, callback)
{
    withWatchlist(function(items) {
        items.push(url);

        chrome.storage.sync.set({'ajaxray.session_timer.domains': items}, function() {
            if('function' == typeof callback) {
                callback(items, url);
            }
        });
    });
}

function removeFromWatchlist(url, callback)
{
    withWatchlist(function(items) {
        items.splice(items.indexOf(url), 1);

        chrome.storage.sync.set({'ajaxray.session_timer.domains': items}, function() {
            if('function' == typeof callback) {
                callback(items, url);
            }
        });
    });
}

function loadSettings(callback)
{
    chrome.storage.sync.get('ajaxray.session_timer.settings', function(values) {
        settings = values['ajaxray.session_timer.settings'];
        if(isEmpty(settings)) {
            if('function' == typeof callback) {
                saveSettings(defaultSettings, callback);
            } else {
                saveSettings(defaultSettings);
            }
        } else {
            if('function' == typeof callback) {
                callback(settings);
            }
        }
    });
}

function saveSettings(options, callback)
{
    chrome.storage.sync.set({'ajaxray.session_timer.settings': options}, function() {
        settings = options;
        if('function' == typeof callback) {
            callback(options);
        }
    });
}

function withCurrentTab(callback) {
    // https://developer.chrome.com/extensions/tabs#method-query
    var queryInfo = { active: true, currentWindow: true };

    chrome.tabs.query(queryInfo, function(tabs) {
        callback(tabs[0]);
    });
}