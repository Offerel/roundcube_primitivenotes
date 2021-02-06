/**
 * Roundcube Notes Plugin
 *
 * @version 2.0.2
 * @author Offerel
 * @copyright Copyright (c) 2021, Offerel
 * @license GNU General Public License, version 3
 */
window.rcmail && rcmail.addEventListener("init", function(a) {
    rcmail.register_command("newnote", new_note, !0);
    rcmail.register_command("editnote", edit_note, !0);
    rcmail.register_command("deletenote", delete_note, !0);
    rcmail.register_command("sendnote", send_note, !0);
    rcmail.register_command("addnote", add_note, !0);
    rcmail.register_command("mdnote", new_note, !0);
	rcmail.register_command("txtnote", new_note, !0);
	rcmail.register_command("pnoptions", pnoptions, !0);
	if(document.getElementById('upl')) document.getElementById('upl').addEventListener('change', sform, false );
	if(window.location.hash == '#pnotes')rcmail.sections_list.select_row('primitivenotes');	
});

function pnoptions() {
	location.href = window.location.origin + window.location.pathname + '?_task=settings&_action=preferences#pnotes';
}

function add_note() {
    document.getElementById("upl").click()
}

function new_note(a) {
	format = a ? a : rcmail.env.dformat;
	let nname = document.createElement('input');
	nname.id = 'note_name';
	nname.name = nname.id;
	nname.type = 'text';
	nname.style = 'font-size: 2em';
	nname.required = true;
	nname.value = '';
	$("#notescontentframe").contents().find("#headerTitle").replaceWith(nname);
	$("#notescontentframe").contents().find("#note_name").replaceWith(nname);
	$("#notescontentframe").contents().find("tags").addClass('edit');
	$("#notescontentframe").contents().find("#tbutton").remove();
   
    let tstate = {
        tstate:false,
        ttags:'',
		    editor:'new',
		    format:format,
    };
    document.getElementById('notescontentframe').contentWindow.postMessage(tstate, location.href);
	$("#notescontentframe").contents().find("#note_name")[0].placeholder = rcmail.gettext("note_title", "primitivenotes");
	document.getElementById('editnote').classList.add('disabled');
	document.getElementById('deletenote').classList.add('disabled');
	document.getElementById('sendnote').classList.add('disabled');
}

function edit_note() {
	let nTitel = $("#notescontentframe").contents().find("#headerTitle");
	$("#notescontentframe").contents().find("#tbutton").remove();
	let nname = document.createElement('input');
	nname.id = 'note_name';
	nname.name = nname.id;
	nname.type = 'text';
	nname.style = 'font-size: 2em';
	nname.required = true;
	nname.value = nTitel[0].innerText;
	nTitel.replaceWith(nname);

	let tstate = {
		tstate:false,
		editor:'edit',
    };
	document.getElementById('notescontentframe').contentWindow.postMessage(tstate, location.href);
	$("#notescontentframe").contents().find("tags").addClass('edit');
}

function delete_note() {
    var a = window.frames.notescontentframe.document.getElementById("fname").value,
        b = window.frames.notescontentframe.document.getElementById("headerTitle").innerText,
        c = rcmail.gettext("note_del_note", "primitivenotes").replace("%note%", b);
    if (a && b)
		if (confirm(c)) 
			$.ajax({
				url: "plugins/primitivenotes/notes.php",
				type: "post",
				data: {
					action: "delNote",
					mode: "delete",
					fileid: a
				},
				success: function(a) {
					if(a != '') {
						var result = JSON.parse(a);
						if(result.data != "") {
							if(confirm(result.message)) $.ajax({
								url: "plugins/primitivenotes/notes.php",
								type: "post",
								data: {
									action: "delMedia",
									files: JSON.stringify(result.data)
								}
							});
						}
					}

					document.getElementById("notescontentframe").src = "plugins/primitivenotes/notes.php"
				}
			});
			else return !1
}

function send_note() {
    var a = window.frames.notescontentframe.document.getElementById("fname").value,
        b = a.substring(a.lastIndexOf(".") + 1); - 1 < "html pdf jpg png md txt".split(" ").indexOf(b) ? rcmail.goto_url("mail/compose", {
        _note_type: b,
        _note_filename: a
    }, !0) : alert(rcmail.gettext("note_inv_format", "primitivenotes"))
};

function sform() {
	fileName = this.value;
	var allowed_extensions = new Array('html', 'pdf', 'jpg', 'png', 'md', 'txt');
	var file_extension = fileName.split('.').pop().toLowerCase(); 
	for(var i = 0; i <= allowed_extensions.length; i++) {
		if(allowed_extensions[i]==file_extension) {
			document.getElementById("upl_form").submit();
			return true;
		}
	}
	alert('<roundcube:label name=\"primitivenotes.note_inv_format\" />');
	return false;
}