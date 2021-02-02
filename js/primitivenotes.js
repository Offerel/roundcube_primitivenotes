/**
 * Roundcube Notes Plugin
 *
 * @version 2.0.0
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
});

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
    };
    document.getElementById('notescontentframe').contentWindow.postMessage(tstate, location.href);
    $("#notescontentframe").contents().find("#note_name")[0].placeholder = rcmail.gettext("note_title", "primitivenotes");
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