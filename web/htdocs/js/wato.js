// +------------------------------------------------------------------+
// |             ____ _               _        __  __ _  __           |
// |            / ___| |__   ___  ___| | __   |  \/  | |/ /           |
// |           | |   | '_ \ / _ \/ __| |/ /   | |\/| | ' /            |
// |           | |___| | | |  __/ (__|   <    | |  | | . \            |
// |            \____|_| |_|\___|\___|_|\_\___|_|  |_|_|\_\           |
// |                                                                  |
// | Copyright Mathias Kettner 2014             mk@mathias-kettner.de |
// +------------------------------------------------------------------+
//
// This file is part of Check_MK.
// The official homepage is at http://mathias-kettner.de/check_mk.
//
// check_mk is free software;  you can redistribute it and/or modify it
// under the  terms of the  GNU General Public License  as published by
// the Free Software Foundation in version 2.  check_mk is  distributed
// in the hope that it will be useful, but WITHOUT ANY WARRANTY;  with-
// out even the implied warranty of  MERCHANTABILITY  or  FITNESS FOR A
// PARTICULAR PURPOSE. See the  GNU General Public License for more de-
// ails.  You should have  received  a copy of the  GNU  General Public
// License along with GNU Make; see the file  COPYING.  If  not,  write
// to the Free Software Foundation, Inc., 51 Franklin St,  Fifth Floor,
// Boston, MA 02110-1301 USA.

// ----------------------------------------------------------------------------
// General functions for WATO
// ----------------------------------------------------------------------------

function getElementsByClass(cl) {
    var items = new Array();
    var elements = document.getElementsByTagName('*');
    for (var i = 0; i < elements.length; i++)
        if (elements[i].className == cl)
            items.push(elements[i]);
    return items;
}

/* Used to check all checkboxes which have the given class set */
function wato_check_all(css_class) {
    var items = getElementsByClass(css_class);

    // First check if all boxes are checked
    var all_checked = true;
    for(var i = 0; i < items.length && all_checked == true; i++)
        if (items[i].checked == false)
            all_checked = false;

    // Now set the new state
    for(var i = 0; i < items.length; i++)
        items[i].checked = !all_checked;
}

/* Make attributes visible or not when clicked on a checkbox */
function wato_toggle_attribute(oCheckbox, attrname) {
    var oEntry =   document.getElementById("attr_entry_" + attrname);
    var oDefault = document.getElementById("attr_default_" + attrname);

    // Permanent invisible attributes do
    // not have attr_entry / attr_default
    if( !oEntry ){
       return;
    }
    if (oCheckbox.checked) {
        oEntry.style.display = "";
        oDefault.style.display = "none";
    }
    else {
        oEntry.style.display = "none";
        oDefault.style.display = "";
    }
}

/* Switch the visibility of all host attributes during the configuration
   of attributes of a host */
function wato_fix_visibility() {
    /* First collect the current selection of all host attributes.
       They are in the same table as we are */
    var currentTags = [];

    var container_ids = [ "wato_host_tags", "data_sources", "address" ];

    for (var a = 0; a < container_ids.length; a++) {
        var container_id = container_ids[a];

        var oHostTags = document.getElementById(container_id);

        if (!oHostTags)
            continue;

        var oTable = oHostTags.childNodes[0]; /* tbody */

        for (var i = 0; i < oTable.childNodes.length; i++) {
            var oTr = oTable.childNodes[i];
            if (oTr.tagName == 'TR') {
                var oTdLegend = oTr.childNodes[0];
                if (oTdLegend.className != "legend") {
                    continue;
                }
                var oTdContent = oTr.childNodes[1];
                /* If the Checkbox is unchecked try to get a value from the inherited_tags */
                var oCheckbox = oTdLegend.getElementsByTagName("input")[0];
                if (oCheckbox.checked == false ){
                    var attrname = 'attr_' + oCheckbox.name.replace(/.*_change_/, '');
                    if (attrname in inherited_tags && inherited_tags[attrname] !== null){
                        currentTags = currentTags.concat(inherited_tags[attrname].split("|"));
                    }
                } else {
                    /* Find the <select>/<checkbox> object in this tr */
                    var elements = oTdContent.getElementsByTagName("input");
                    if (elements.length == 0)
                        elements = oTdContent.getElementsByTagName("select");

                    if (elements.lenght == 0)
                        continue;

                    var oElement = elements[0];
                    if (oElement.type == 'checkbox' && oElement.checked) {
                        currentTags = currentTags.concat(oElement.getAttribute('tags').split("|"));
                    } else if (oElement.tagName == 'SELECT') {
                        currentTags = currentTags.concat(oElement.value.split("|"));
                    }
                }
            }
        }
    }

    // Skip this function when no tags defined
    if (!currentTags)
        return;

    var hide_topics = volatile_topics.slice(0);
    /* Now loop over all attributes that have conditions. Those are
       stored in the global variable wato_depends_on_tags, which is filled
       during the creation of the web page. */

    for (var i = 0; i < wato_check_attributes.length; i++) {
        var attrname = wato_check_attributes[i];
        /* Now comes the tricky part: decide whether that attribute should
           be visible or not: */
        var display = "";

        // Always invisible
        if( hide_attributes.indexOf(attrname) > -1 ){
            display = "none";
        }

        // Visibility depends on roles
        if( display == "" && attrname in wato_depends_on_roles){
            for (var index = 0; index < wato_depends_on_roles[attrname].length; index++) {
                var role = wato_depends_on_roles[attrname][index];
                var negate = role[0] == '!';
                var rolename = negate ? role.substr(1) : role;
                var have_role = user_roles.indexOf(rolename) != -1;
                if (have_role == negate) {
                    display = "none";
                    break;
                }
            }
        }

        // Visibility depends on tags
        if( display == "" && attrname in wato_depends_on_tags){
            for (var index = 0; index < wato_depends_on_tags[attrname].length; index++) {
                var tag = wato_depends_on_tags[attrname][index];
                var negate = tag[0] == '!';
                var tagname = negate ? tag.substr(1) : tag;
                var have_tag = currentTags.indexOf(tagname) != -1;
                if (have_tag == negate) {
                    display = "none";
                    break;
                }
            }
        }


        var oTr = document.getElementById("attr_" + attrname);
        if(oTr) {
            oTr.style.display = display;

            // Prepare current visibility information which is used
            // within the attribut validation in wato
            // Hidden attributes are not validated at all
            var oAttrDisp = document.getElementById("attr_display_" + attrname);
            if (!oAttrDisp) {
                var oAttrDisp = document.createElement("input");
                oAttrDisp.name  = "attr_display_" + attrname;
                oAttrDisp.id  = "attr_display_" + attrname;
                oAttrDisp.type = "hidden";
                oAttrDisp.className = "text";
                oTr.appendChild(oAttrDisp);
            }
            if ( display == "none" ) {
                // Uncheck checkboxes of hidden fields
                var chkbox = oAttrDisp.parentNode.childNodes[0].childNodes[1].childNodes[0];
                chkbox.checked = false;
                wato_toggle_attribute(chkbox, attrname);

                oAttrDisp.value = "0";
            } else {
                oAttrDisp.value = "1";
            }

            // There is at least one item in this topic -> show it
            var topic = oTr.parentNode.childNodes[0].textContent;
            if( display == "" ){
                var index = hide_topics.indexOf(topic);
                if( index != -1 )
                    delete hide_topics[index];
            }
        }
    }

    // FIXME: use generic identifier for each form
    var available_forms = [ "form_edit_host", "form_editfolder" ];
    for (var try_form = 0; try_form < available_forms.length; try_form++) {
        var my_form = document.getElementById(available_forms[try_form]);
        if (my_form != null) {
            for (var child in my_form.childNodes){
                oTr = my_form.childNodes[child];
                if (oTr.className == "nform"){
                    if( hide_topics.indexOf(oTr.childNodes[0].childNodes[0].textContent) > -1 )
                        oTr.style.display = "none";
                    else
                        oTr.style.display = "";
                }
            }
            break;
        }
    }
}

function wato_randomize_secret(id, len)
{
    var secret = "";
    for (var i=0; i<len; i++) {
        var c = parseInt(26 * Math.random() + 64);
        secret += String.fromCharCode(c);
    }
    var oInput = document.getElementById(id);
    oInput.value = secret;
}

function toggle_container(id)
{
    var obj = document.getElementById(id);
    if (has_class(obj, "hidden"))
        remove_class(obj, "hidden");
    else
        add_class(obj, "hidden");
}

// ----------------------------------------------------------------------------
// Interactive progress code
// ----------------------------------------------------------------------------


// WATO mode during progress
var progress_mode      = null;
// WATO url belonging to progress
var progress_url       = null;
// timeout for progress
var progress_timeout   = null;
// Keeps the items to be fetched
var progress_items     = null;
// items failed, needed for retry
var failed_items       = null;
// Number of total items to handle
var progress_total_num = 0;
// Contains the total number of items which have been successfully processed
// This is e.g. used to decide if the dialog needs to redirect to end_url
// or to the term_url
var progress_found = 0;
// The fields which signal that something has been successfully processed.
// this is used together with progress_found to find out the correct redirect url
var progress_success_stats = [];
// The fields which signal that something has failed
var progress_fail_stats = [];
// The URL to redirect to after finish/abort button pressed
var progress_end_url   = '';
// The URL to redirect to after finish/abort button pressed when nothing found
var progress_term_url   = '';
// The text to show in the progress bar after finished processing
var progress_fin_txt   = '';
// Is set to true while one request is waiting for a response
var progress_running = false;
// Is set to true to put the processing to sleep
var progress_paused  = false;
// Is set to true when the user hit aborted/finished
var progress_ended   = false;

function progress_handle_error(data, code, msg) {
    // code contains no parsable response but the http code
    progress_handle_response(data, '', code);
}

function progress_handle_response(data, code, http_code)
{
    var mode = data[0];
    var item = data[1];

    var header = null;
    var body = null;
    if (http_code !== undefined) {
        // If the request failed report the item as failed
        // Note: the item is either a plain item (single-item-mode), or
        // a list of items which are separated with ;. Also it is possible
        // that additional parameters are prefixed to the item separated
        // by pipes. The bulk inventory uses that format for doing a couple
        // of hosts at the same time. So here we detect both variants.

        var parts = data[1].split("|");
        var last_part = parts[parts.length-1];
        var items = last_part.split(";");
        var num_failed = items.length;

        // - Report failed state
        // - Update the total count (item 0 = 1)
        // - Update the failed stats
        header = [ 'failed', num_failed ];
        for (var i = 1; i <= Math.max.apply(Math, progress_fail_stats); i++) {
            if (progress_fail_stats.indexOf(i) !== -1) {
                header.push(num_failed);
            }
            else {
                header.push(0);
            }
        }

        body = '';
        for (var i=0; i < items.length; i++)
        {
            body += items[i] + ' failed: HTTP-Request failed with code ' + http_code + '<br>';
        }
    }
    else {
        // Regular response processing
        try {
            var header = eval(code.split("\n", 1)[0]);
            if (header === null)
                alert('Header is null!');
        }
        catch(err) {
            alert('Invalid response: ' + code);
        }

        // Extract the body from the response
        var body = code.split('\n');
        body.splice(0,1);
        body = body.join('');
    }

    // Process statistics
    update_progress_stats(header);

    // Process the bar
    update_progress_bar(header);

    // Process optional body
    if (typeof(body) !== 'undefined' && body != '')
        progress_attach_log(body);

    if (header[0] === 'pause')
        progress_pause();
    else if (header[0] == 'failed')
        failed_items.push(item);
    else if (header[0] === 'abort')
        return;

    progress_items.shift();
    progress_running = false;
}

/* Is called when the user or the response wants the processing to be paused */
function progress_pause() {
    progress_paused = true;
    //progress_attach_log('+++ PAUSE<br />');
    document.getElementById('progress_pause').style.display = 'none';
    document.getElementById('progress_proceed').style.display = '';
}

/* Is called when the user or the response wants the processing to be proceeded after pause */
function progress_proceed() {
    progress_paused = false;
    //progress_attach_log('+++ PROCEEDING<br />');
    document.getElementById('progress_pause').style.display = '';
    document.getElementById('progress_proceed').style.display = 'none';
}

function progress_retry() {
    document.getElementById('progress_retry').style.display    = 'none';
    document.getElementById('progress_pause').style.display    = '';
    document.getElementById('progress_abort').style.display    = '';
    progress_clean_log();
    clear_progress_stats();
    // Note: no bulksize limit is applied here
    progress_items = failed_items;
    failed_items = Array();
    progress_scheduler(progress_mode, progress_url, progress_timeout, [], "");
}



/* Is called when the processing is completely finished */
function progress_finished() {
    update_progress_title(progress_fin_txt);
    document.getElementById('progress_bar').className = 'finished';

    document.getElementById('progress_finished').style.display = '';
    document.getElementById('progress_pause').style.display    = 'none';
    document.getElementById('progress_proceed').style.display  = 'none';
    document.getElementById('progress_abort').style.display    = 'none';
    if (failed_items.length > 0)
        document.getElementById('progress_retry').style.display = '';

}

/* Is called by the users abort/finish button click */
function progress_end() {
    // Mark as ended to catch currently running requests
    progress_ended = true;
    if(progress_found > 0)
        location.href = progress_end_url;
    else
        location.href = progress_term_url;
}

function clear_progress_stats() {
    progress_found = 0
    for(var i = 1; i < 100; i++) {
        var o = document.getElementById('progress_stat' + (i - 1));
        if (o) {
            o.innerHTML = "0";
        }
        else
            break;
    }
}

function update_progress_stats(header) {
    for(var i = 1; i < header.length; i++) {
        var o = document.getElementById('progress_stat' + (i - 1));
        if (o) {
            for(var a = 0; a < progress_success_stats.length; a++)
                if(progress_success_stats[a] == i)
                    progress_found += parseInt(header[i]);

            o.innerHTML = parseInt(o.innerHTML) + parseInt(header[i]);
        }
    }
}

function update_progress_bar(header) {
    var num_done  = progress_total_num - progress_items.length + 1;
    var perc_done = num_done / progress_total_num * 100;

    var bar      = document.getElementById('progress_bar');
    var cell = bar.firstChild.firstChild.firstChild;
    cell.style.width = perc_done + "%";
    cell = bar.firstChild.firstChild.childNodes[1];
    cell.style.width = (100 - perc_done) + "%";
    return false;
}

function update_progress_title(t) {
    document.getElementById('progress_title').innerHTML = t;
}

function progress_attach_log(t) {
    var log = document.getElementById('progress_log');
    log.innerHTML += t;
    log.scrollTop = log.scrollHeight;
}

function progress_clean_log() {
    var log = document.getElementById('progress_log');
    log.innerHTML = '';
    log.scrollTop = 0;
}

function progress_scheduler(mode, url_prefix, timeout, items, end_url, success_stats, fail_stats, term_url, finished_txt) {
    // Initialize
    if (progress_items === null) {
        total_num_items        = items.length;
        progress_items         = items;
        failed_items           = Array();
        progress_total_num     = items.length;
        progress_end_url       = end_url;
        progress_term_url      = term_url;
        progress_success_stats = success_stats;
        progress_fail_stats    = fail_stats;
        progress_fin_txt       = finished_txt;
        progress_mode          = mode;
        progress_url           = url_prefix;
        progress_timeout       = timeout;
    }

    // Escape the loop when ended
    if (progress_ended)
        return false;

    // Regular processing when not paused and not already running
    if (!progress_paused && !progress_running) {
        if (progress_items.length > 0) {
            num_items_left = progress_items.length;
            perc = Math.round(100 - (100.0 * num_items_left / total_num_items));
            // title = progress_items.length + " Items, " + progress_success_stats.length + " Stats, " + progress_fail_stats.length + " Failed.";
            title = perc + "%";
            // Progressing
            progress_running = true;
            // Remove leading pipe signs (when having no folder set)
            // update_progress_title(percentage + "%");
            update_progress_title(title);
            get_url(url_prefix + '&_transid=-1&_item=' + encodeURIComponent(progress_items[0]),
                progress_handle_response,    // regular handler (http code 200)
                [ mode, progress_items[0] ], // data to hand over to handlers
                progress_handle_error        // error handler
            );
        } else {
            progress_finished();
            return;
        }
    }

    setTimeout(function() { progress_scheduler(mode, url_prefix, timeout, [], ""); }, timeout);
}

function update_bulk_moveto(val) {
    var fields = getElementsByClass('bulk_moveto');
    for(var i = 0; i < fields.length; i++)
        for(var a = 0; a < fields[i].options.length; a++)
            if(fields[i].options[a].value == val)
                fields[i].options[a].selected = true;
}

//#.
//#   .-Activation---------------------------------------------------------.
//#   |              _        _   _            _   _                       |
//#   |             / \   ___| |_(_)_   ____ _| |_(_) ___  _ __            |
//#   |            / _ \ / __| __| \ \ / / _` | __| |/ _ \| '_ \           |
//#   |           / ___ \ (__| |_| |\ V / (_| | |_| | (_) | | | |          |
//#   |          /_/   \_\___|\__|_| \_/ \__,_|\__|_|\___/|_| |_|          |
//#   |                                                                    |
//#   +--------------------------------------------------------------------+
//#   | The WATO activation works this way:                                |
//#   | a) The user chooses one activation mode (affected sites, selected  |
//#   |    sites or a single site)                                         |
//#   | b) The JS GUI starts a single "worker" which calls the python code |
//#   |    first to locking the sites and creating the sync snapshot(s)    |
//#   | c) Then the snapshot is synced to the sites and activated on the   |
//#   |    sites indidivually.                                             |
//#   | d) Once a site finishes, it's changes are commited and the site is |
//#   |    unlocked individually.                                          |
//#   '--------------------------------------------------------------------'

function activate_changes(mode, site_id)
{
    var sites = [];

    if (mode == "selected") {
        var checkboxes = document.getElementsByClassName("site_checkbox");
        for (var i = 0; i < checkboxes.length; i++) {
            if (checkboxes[i].checked) {
                // strip leading "site_" to get the site id
                sites.push(checkboxes[i].name.substr(5));
            }
        }

        if (sites.length == 0) {
            show_activation_error("You have to select a site.");
            return;
        }

    } else if (mode == "site") {
        sites.push(site_id);
    }

    var activate_until = document.getElementById("activate_until");
    if (!activate_until)
        return;

    var comment = "";
    var comment_field = document.getElementsByName("activate_p_comment")[0];
    if (comment_field.value != "")
        comment = comment_field.value;

    var activate_foreign = 0;
    var foreign_checkbox = document.getElementsByName("activate_p_foreign")[0];
    if (foreign_checkbox && foreign_checkbox.checked)
        activate_foreign = 1;

    start_activation(sites, activate_until.value, comment, activate_foreign);
}

function start_activation(sites, activate_until, comment, activate_foreign)
{
    show_activation_info("Initializing activation...");

    var post_data = "activate_until=" + encodeURIComponent(activate_until)
                  + "&sites=" + encodeURIComponent(sites.join(","))
                  + "&comment=" + encodeURIComponent(comment)
                  + "&activate_foreign=" + encodeURIComponent(activate_foreign);

    call_ajax("ajax_start_activation.py", {
        response_handler : handle_start_activation,
        error_handler    : handle_start_activation_error,
        method           : "POST",
        post_data        : post_data,
        add_ajax_id      : false
    });

    lock_activation_controls(true);
    hide_last_results();
    show_details(false);
}

function handle_start_activation(_unused, response_json)
{
    var response = JSON.parse(response_json);

    if (response.result_code == 1) {
        show_activation_error(response.result);
        lock_activation_controls(false);
    } else {
        monitor_activation_progress(time(), response.result.activation_id);
    }
}

function handle_start_activation_error(_unused, status_code, error_msg)
{
    show_activation_error("Failed to start activation ["+status_code+"]: " + error_msg);
    finish_activation();
}

function show_activation_error(text)
{
    var container = document.getElementById("activation_msg");
    container.style.display = "block";
    var msg = container.childNodes[0];

    add_class(msg, "error");
    remove_class(msg, "success");

    msg.innerHTML = text;
}

function show_activation_info(text)
{
    var container = document.getElementById("activation_msg");
    container.style.display = "block";
    var msg = container.childNodes[0];

    add_class(msg, "success");
    remove_class(msg, "error");

    msg.innerHTML = text;
}

function hide_activation_message()
{
    var msg = document.getElementById("activation_msg");
    if (msg)
        msg.style.display = "none";
}

function lock_activation_controls(lock)
{
    var elements = [];
    elements.push(document.getElementById("activate_affected"));
    elements.push(document.getElementById("activate_selected"));
    // TODO: Remove once new changes mechanism has been implemented
    elements.push(document.getElementById("discard_changes_button"));

    elements = elements.concat(Array.prototype.slice.call(document.getElementsByName("activate_p_comment"), 0));
    elements = elements.concat(Array.prototype.slice.call(document.getElementsByClassName("site_checkbox"), 0));
    elements = elements.concat(Array.prototype.slice.call(document.getElementsByClassName("activate_site"), 0));

    for (var i = 0; i < elements.length; i++) {
        if (!elements[i])
            continue;

        if (lock)
            add_class(elements[i], "disabled");
        else
            remove_class(elements[i], "disabled");

        elements[i].disabled = lock ? "disabled" : false;
    }
}

function hide_last_results()
{
    var elements = [];
    elements = elements.concat(Array.prototype.slice.call(document.getElementsByClassName("last_result"), 0));
    elements = elements.concat(Array.prototype.slice.call(document.getElementsByClassName("header_last_result"), 0));

    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = "none";
    }
}

function show_details(show)
{
    var elements = [];
    elements = elements.concat(Array.prototype.slice.call(document.getElementsByClassName("details"), 0));
    elements = elements.concat(Array.prototype.slice.call(document.getElementsByClassName("header_details"), 0));

    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = show ? "table-cell" : "none";
    }
}

// Make the cells visible which are needed during sync
function show_progress(show)
{
    var elements = [];
    elements = elements.concat(Array.prototype.slice.call(document.getElementsByClassName("repprogress"), 0));
    elements = elements.concat(Array.prototype.slice.call(document.getElementsByClassName("header_repprogress"), 0));

    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = show ? "table-cell" : "none";
    }
}

// Is called after the activation has been started (got the activation_id) and
// then in interval of 500 ms for updating the dialog state
function monitor_activation_progress(start_time, activation_id)
{
    show_activation_info("Activating...");

    call_ajax("ajax_activation_state.py?activation_id=" + encodeURIComponent(activation_id), {
        response_handler : handle_activation_progress,
        error_handler    : handle_activation_progress_error,
        handler_data     : {
            "activation_id" : activation_id,
            "start_time"    : start_time
        },
        method           : "GET",
        add_ajax_id      : false
    });
}

function handle_activation_progress(handler_data, response_json)
{
    var response = JSON.parse(response_json);
    if (response.result_code == 1) {
        show_activation_error(response.result);
        return; // Abort on error!
    } else {
        update_activation_state(response.result);

	if (!activation_progress_finished(response.result)) {
            setTimeout(function() {
		return monitor_activation_progress(handler_data.start_time, handler_data.activation_id);
	    }, 500);
	}
	else {
	    finish_activation();
	}
    }
}

function activation_progress_finished(response)
{
    for (var site_id in response["sites"]) {
        // skip loop if the property is from prototype
        if (!response["sites"].hasOwnProperty(site_id))
            continue;

        var site_state = response["sites"][site_id];
        if (site_state["_phase"] != "done")
            return false;
    }

    return true;
}

function update_activation_state(response)
{
    for (var site_id in response["sites"]) {
        // skip loop if the property is from prototype
        if (!response["sites"].hasOwnProperty(site_id))
            continue;

        var site_state = response["sites"][site_id];

        // Catch empty site states
        var is_empty = true;
        for (var prop in site_state) {
            if (site_state.hasOwnProperty(prop)) {
                is_empty = false;
                break;
            }
        }

        if (is_empty)
            throw "Empty site state for " + site_id;

        update_site_activation_state(site_state);
    }
}

function update_site_activation_state(site_state)
{
    // Show status text (overlay text on the progress bar)
    var msg = document.getElementById("site_" + site_state["_site_id"] + "_status");
    msg.innerHTML = site_state["_status_text"];

    // Show status details
    if (site_state["_status_details"]) {
        show_details(true);

        var msg = document.getElementById("site_" + site_state["_site_id"] + "_details");
        msg.innerHTML = site_state["_status_details"];
    }

    update_site_progress(site_state);
}

function update_site_progress(site_state)
{
    var max_width = 160;

    var progress = document.getElementById("site_" + site_state["_site_id"] + "_progress");
    show_progress(true);

    if (site_state["_phase"] == "done") {
        progress.style.width = max_width + "px";
        add_class(progress, "state_" + site_state["_state"]);
        return;
    }

    // TODO: Visualize overdue

    var duration = parseFloat(time() - site_state["_time_started"]);

    var expected_duration = site_state["_expected_duration"];
    var duration_percent = duration * 100.0 / expected_duration;
    var width = parseInt(parseFloat(max_width) * duration_percent / 100);

    if (width > max_width)
        width = max_width;

    progress.style.width = width + "px";
}

function handle_activation_progress_error(handler_data, status_code, error_msg)
{
    if (time() - handler_data.start_time <= 10 && status_code == 503) {
        show_activation_info("Failed to fetch activation state. In case you changed site management related " +
                             "global settings this is normal for a period of some seconds.");
    } else {
        show_activation_error("Failed to fetch activation state ["+status_code+"]: " + error_msg + ". " +
                              "Retrying in 1 second." +
                              "<br><br>" +
                              "In case this error persists for more than some seconds, please verify that all " +
                              "processes of the site are running.");
    }

    setTimeout(function() {
        return monitor_activation_progress(handler_data.start_time, handler_data.activation_id);
    }, 1000);
}

function finish_activation()
{
    show_activation_info("Activation has finished. Reloading in 1 second.");
    lock_activation_controls(false);

    // Maybe change this not to make a reload and only update the relevant
    // parts of the activate changes page.
    schedule_reload('', 1000);

    // Trigger a reload of the sidebar (to update changes in WATO snapin)
    reload_sidebar();
}

// .-Profile Repl----------------------------------------------------------.
// |          ____             __ _ _        ____            _             |
// |         |  _ \ _ __ ___  / _(_) | ___  |  _ \ ___ _ __ | |            |
// |         | |_) | '__/ _ \| |_| | |/ _ \ | |_) / _ \ '_ \| |            |
// |         |  __/| | | (_) |  _| | |  __/ |  _ <  __/ |_) | |            |
// |         |_|   |_|  \___/|_| |_|_|\___| |_| \_\___| .__/|_|            |
// |                                                  |_|                  |
// +-----------------------------------------------------------------------+

var profile_replication_progress = new Array();

function wato_do_profile_replication(siteid, est, progress_text) {
    get_url("wato_ajax_profile_repl.py?site=" + siteid,
            wato_profile_replication_result, siteid);
    profile_replication_progress[siteid] = 20; // 10 of 10 10ths
    setTimeout("profile_replication_step('"+siteid+"', "+est+", '"+progress_text+"');", est/20);
}

function profile_replication_set_status(siteid, image, text) {
    var oImg = document.getElementById("site-" + siteid).childNodes[0];
    oImg.title = text;
    oImg.src = 'images/icon_'+image+'.png';
}

function profile_replication_step(siteid, est, progress_text) {
    if (profile_replication_progress[siteid] > 0) {
        profile_replication_progress[siteid]--;
        var perc = (20.0 - profile_replication_progress[siteid]) * 100 / 20;
        var img;
        if (perc >= 75)
            img = 'repl_75';
        else if (perc >= 50)
            img = 'repl_50';
        else if (perc >= 25)
            img = 'repl_25';
        else
            img = 'repl_pending';
        profile_replication_set_status(siteid, img, progress_text);
        setTimeout("profile_replication_step('"+siteid+"',"+est+", '"+progress_text+"');", est/20);
    }
}

// g_num_replsites is set by the page code in wato.py to the number async jobs started
// in total
function wato_profile_replication_result(siteid, code) {
    profile_replication_progress[siteid] = 0;
    var oDiv = document.getElementById("site-" + siteid);
    if (code[0] == "0")
        profile_replication_set_status(siteid, 'repl_success', code.substr(2));
    else
        profile_replication_set_status(siteid, 'repl_failed', code.substr(2));
    g_num_replsites--;

    if (0 == g_num_replsites) {
        setTimeout(wato_profile_replication_finish, 1000);
    }
}

function wato_profile_replication_finish() {
    // check if we have a sidebar-main frame setup
    if (this.parent && parent && parent.frames[1] == this)
        reload_sidebar();
}

// ----------------------------------------------------------------------------
// Folderlist
// ----------------------------------------------------------------------------

function wato_open_folder(event, link) {
    if (!event)
        event = window.event;
    var target = getTarget(event);
    if(target.tagName != 'DIV') {
        // Skip this event on clicks on other elements than the pure div
        return false;
    }

    location.href = link;
}

function wato_toggle_folder(event, oDiv, on) {
    if (!event)
        event = window.event;

    // Skip mouseout event when moving mouse over a child element of the
    // folder element
    if (!on) {
        var node = event.toElement || event.relatedTarget;
        while (node) {
            if (node == oDiv) {
                return false;
            }
            node = node.parentNode;
        }
    }

    var obj = oDiv.parentNode;
    var id = obj.id.substr(7);

    var elements = ['edit', 'popup_trigger_move', 'delete'];
    for(var num in elements) {
        var elem = document.getElementById(elements[num] + '_' + id);
        if(elem) {
            if(on) {
                elem.style.display = 'inline';
            } else {
                elem.style.display = 'none';
            }
        }
    }

    if(on) {
        add_class(obj, "open");
    } else {
        remove_class(obj, "open");

        // Hide the eventual open move dialog
        var move_dialog = document.getElementById('move_dialog_' + id);
        if(move_dialog) {
            move_dialog.style.display = 'none';
        }
    }
}

// .--Host Diag-----------------------------------------------------------.
// |              _   _           _     ____  _                           |
// |             | | | | ___  ___| |_  |  _ \(_) __ _  __ _               |
// |             | |_| |/ _ \/ __| __| | | | | |/ _` |/ _` |              |
// |             |  _  | (_) \__ \ |_  | |_| | | (_| | (_| |              |
// |             |_| |_|\___/|___/\__| |____/|_|\__,_|\__, |              |
// |                                                  |___/               |
// +----------------------------------------------------------------------+

function handle_host_diag_result(data, response_json) {
    var response = JSON.parse(response_json);

    var img   = document.getElementById(data.ident + '_img');
    var log   = document.getElementById(data.ident + '_log');
    var retry = document.getElementById(data.ident + '_retry');
    remove_class(img, "reloading");

    var text = "";
    if (response.result_code == 1) {
        img.src = "images/icon_failed.png";
        log.className = "log diag_failed";
        text = "API Error:" + response.result;

    } else {
        if (response.result.status_code == 1) {
            img.src = "images/icon_failed.png";
            log.className = "log diag_failed";
        } else {
            img.src = "images/icon_success.png";
            log.className = "log diag_success";
        }
        text = response.result.output;
    }

    log.innerText = text;

    retry.src = "images/icon_reload.png";
    retry.style.display = 'inline';
    retry.parentNode.href = "javascript:start_host_diag_test('"+data.ident+"', '"+data.hostname+"', '"+response.result.next_transid+"');";
}

function start_host_diag_test(ident, hostname, transid) {
    var log   = document.getElementById(ident + '_log');
    var img   = document.getElementById(ident + '_img');
    var retry = document.getElementById(ident + '_retry');

    retry.style.display = 'none';

    var vars = '';
    vars = '&_transid=' + encodeURIComponent(transid);
    vars += '&ipaddress=' + encodeURIComponent(document.getElementsByName('vs_host_p_ipaddress')[0].value);


    if (document.getElementsByName("vs_host_p_snmp_community_USE")[0].checked)
        vars += '&snmp_community=' + encodeURIComponent(document.getElementsByName('vs_host_p_snmp_community')[0].value);

    if (document.getElementsByName("vs_host_p_snmp_v3_credentials_USE")[0].checked) {
        v3_use = encodeURIComponent(document.getElementsByName('vs_host_p_snmp_v3_credentials_use')[0].value);
        vars += '&snmpv3_use=' + v3_use;
        if (v3_use == "0") {
            vars += '&snmpv3_security_name=' + encodeURIComponent(document.getElementsByName('vs_host_p_snmp_v3_credentials_0_1')[0].value);
        }
        else if (v3_use == "1") {
            vars += '&snmpv3_auth_proto=' + encodeURIComponent(document.getElementsByName('vs_host_p_snmp_v3_credentials_1_1')[0].value);
            vars += '&snmpv3_security_name=' + encodeURIComponent(document.getElementsByName('vs_host_p_snmp_v3_credentials_1_2')[0].value);
            vars += '&snmpv3_security_password=' + encodeURIComponent(document.getElementsByName('vs_host_p_snmp_v3_credentials_1_3')[0].value);
        }
        else if (v3_use == "2") {
            vars += '&snmpv3_auth_proto=' + encodeURIComponent(document.getElementsByName('vs_host_p_snmp_v3_credentials_2_1')[0].value);
            vars += '&snmpv3_security_name=' + encodeURIComponent(document.getElementsByName('vs_host_p_snmp_v3_credentials_2_2')[0].value);
            vars += '&snmpv3_security_password=' + encodeURIComponent(document.getElementsByName('vs_host_p_snmp_v3_credentials_2_3')[0].value);
            vars += '&snmpv3_privacy_proto=' + encodeURIComponent(document.getElementsByName('vs_host_p_snmp_v3_credentials_2_4')[0].value);
            vars += '&snmpv3_privacy_password=' + encodeURIComponent(document.getElementsByName('vs_host_p_snmp_v3_credentials_2_5')[0].value);
        }
    }

    vars += '&agent_port=' + encodeURIComponent(document.getElementsByName('vs_rules_p_agent_port')[0].value);
    vars += '&tcp_connect_timeout=' + encodeURIComponent(document.getElementsByName('vs_rules_p_tcp_connect_timeout')[0].value);
    vars += '&snmp_timeout=' + encodeURIComponent(document.getElementsByName('vs_rules_p_snmp_timeout')[0].value);
    vars += '&snmp_retries=' + encodeURIComponent(document.getElementsByName('vs_rules_p_snmp_retries')[0].value);
    if (document.getElementsByName('vs_rules_p_datasource_program').length > 0) {
        vars += '&datasource_program=' + encodeURIComponent(document.getElementsByName('vs_rules_p_datasource_program')[0].value);
    }

    img.src = "images/icon_reload.png";
    add_class(img, "reloading");

    log.innerHTML = "...";
    get_url("wato_ajax_diag_host.py?host=" + encodeURIComponent(hostname)
            + "&_test=" + encodeURIComponent(ident) + vars,
              handle_host_diag_result, { "hostname": hostname, "ident": ident });
}

// .-Active Checks---------------------------------------------------------.
// |       _        _   _              ____ _               _              |
// |      / \   ___| |_(_)_   _____   / ___| |__   ___  ___| | _____       |
// |     / _ \ / __| __| \ \ / / _ \ | |   | '_ \ / _ \/ __| |/ / __|      |
// |    / ___ \ (__| |_| |\ V /  __/ | |___| | | |  __/ (__|   <\__ \      |
// |   /_/   \_\___|\__|_| \_/ \___|  \____|_| |_|\___|\___|_|\_\___/      |
// |                                                                       |
// '-----------------------------------------------------------------------'

function execute_active_check(site, hostname, checktype, item, divid)
{
    var oDiv = document.getElementById(divid);
    var url = "wato_ajax_execute_check.py?" +
           "site="       + encodeURIComponent(site) +
           "&host="      + encodeURIComponent(hostname)  +
           "&checktype=" + encodeURIComponent(checktype) +
           "&item="      + encodeURIComponent(item);
    get_url(url, handle_execute_active_check, oDiv);
}


function handle_execute_active_check(oDiv, response_json)
{
    var response = JSON.parse(response_json);

    if (response.result_code == 1) {
        var state     = 3;
        var statename = "UNKN";
        var output    = response.result;
    } else {
        var state     = response.result.state;
        if (state == -1)
            state = "p"; // Pending
        var statename = response.result.state_name;
        var output    = response.result.output;
    }

    oDiv.innerHTML = output;

    // Change name and class of status columns
    var oTr = oDiv.parentNode.parentNode;
    if (has_class(oTr, "even0"))
        add_class(oTr, "even" + state);
    else
        add_class(oTr, "odd" + state);

    var oTdState = oTr.getElementsByClassName("state")[0];
    remove_class(oTdState, "statep");
    add_class(oTdState, "state" + state);

    oTdState.innerHTML = statename;
}