var currentUrl;

function renderStatus(status)
{
    $('#status').html(status);
}

function renderSiteList()
{
    withWatchlist(function(items) {
        $('#domains').empty();
        var sessions = localStorage.getItem('runningSessions') || [];
        if(items.length) {
            $.each(items, function (index, value) {
                var className = (sessions.indexOf(value) != -1) ? "list-group-item-warning" : "";
                $('#domains').append('<a href="' + value + '" target="_blank" tabindex="-1" class="list-group-item ' + className + '">' + value + '</a>');
            });
        } else {
            $('#domains').append('<a href="howto.html" target="_blank" tabindex="-1" class="list-group-item">No sites in watchlist. Click me to see how to use.</a>');
        }
    });
}

function setWatchState(state)
{
    if(state) {
        $('#watch-state').bootstrapToggle('on');
    } else {
        $('#watch-state').bootstrapToggle('off');
    }
}


document.addEventListener('DOMContentLoaded', function() {
    withCurrentTab(function(tab) {
        currentUrl = getSiteUrl(tab.url);
        var domain = parseUrl(tab.url).hostname.substr(0, 30);
        domain += (domain.length > 30) ? '&hellip;' : '';
        $('.domain').html(domain);
    });

    renderSiteList();

    // Set watch state of current site
    withWatchlist(function(list) {
        $.each(list, function(i, v) {
            if (v == currentUrl) {
                setWatchState(true);
            }
        });

        // Listne to watch state toggle
        $('#watch-state').change(function() {
            if( $(this).prop('checked') ) {
                addToWatchlist(currentUrl, renderSiteList);
            } else {
                removeFromWatchlist(currentUrl, renderSiteList);
            }
        });
    });
});
