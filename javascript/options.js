$(document).ready(function() {
    loadSettings(function(settings) {
        $('#sessionLimit').val(settings.sessionLimit);
        $('#snoozeTime').val(settings.snoozeTime);
    });

    $('#save').click(function(e) {
        var sessionLimit = $('#sessionLimit').val();
        var snoozeTime = $('#snoozeTime').val();

        if(sessionLimit == '' || snoozeTime == '') {
            alert('Both fields are required');
        } else {
            saveSettings({
                "sessionLimit" : parseInt(sessionLimit),
                "snoozeTime" : parseInt(snoozeTime)
            }, function(options) {
                $('#options-form').prepend('<div class="alert alert-success alert-dismissible" role="alert">'
                    + '<button type="button" class="close" data-dismiss="alert"><span aria-hidden="true">&times;</span><span class="sr-only">Close</span></button>'
                    + '<strong>Success!</strong> Settings saved.'
                    + '</div>');
            })
        }
    });
});
