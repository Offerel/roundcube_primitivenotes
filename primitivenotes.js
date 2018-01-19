window.rcmail && rcmail.addEventListener('init', function(evt) {
	rcmail.register_command('newnote', new_note, true);
	rcmail.register_command('editnote', edit_note, true);
	rcmail.register_command('deletenote', delete_note, true);
	rcmail.register_command('sendnote', send_note, true);
	rcmail.register_command('addnote', add_note, true);
	rcmail.register_command('rennote', rename_note, true);
});

function rename_note() {
	var url = new URL(window.frames['notescontentframe'].location.href);
	var note_data = [url.searchParams.get("n"), window.frames['notescontentframe'].document.title, url.searchParams.get("t")];
	document.getElementById('notescontentframe').src = 'plugins/primitivenotes/notes.php?m=p&t=' + note_data[2] + '&n=' + note_data[0];
}

function add_note() {
	document.getElementById('upl').click();
}

function new_note() {
	document.getElementById('notescontentframe').src = 'plugins/primitivenotes/notes.php?m=e&t=html&n=n';
}

function edit_note() {
	var url = new URL(window.frames['notescontentframe'].location.href);
	var note_data = [url.searchParams.get("n"), window.frames['notescontentframe'].document.title, url.searchParams.get("t")];
	document.getElementById('notescontentframe').src = 'plugins/primitivenotes/notes.php?m=e&t=' + note_data[2] + '&n=' + note_data[0];
}

function delete_note() {
	var url = new URL(window.frames['notescontentframe'].location.href);
	var note_data = [url.searchParams.get("n"), window.frames['notescontentframe'].document.title, url.searchParams.get("t")];
	
	if(!isNaN(parseInt(note_data[0])) && note_data[0] > -1) {
		if (confirm(rcmail.gettext('note_del_note', 'primitivenotes'))) {
			$.ajax({
				url: 'plugins/primitivenotes/notes.php',
				type: 'post',
				data: {
					"delNote": "1",
					"mode": "delete",
					"fileid": note_data[0],
				},
				success: function(result){
					document.getElementById('notescontentframe').src='plugins/primitivenotes/notes.php'
				}
			});
		} else {
			// Do nothing!
		}
	}
}

function send_note() {
	var url = new URL(window.frames['notescontentframe'].location.href);
	var note_data = [url.searchParams.get("n"), window.frames['notescontentframe'].document.title, url.searchParams.get("t"), window.frames['notescontentframe'].document.getElementById('fname').value];
	var validtypes = ['html', 'pdf', 'jpg', 'png', 'md', 'txt'];
	
	if(validtypes.indexOf(note_data[2]) > -1){
		rcmail.goto_url('mail/compose', { _note_id: note_data[0], _note_name: note_data[1], _note_type: note_data[2], _note_filename: note_data[3] }, true);
	}
	else {
		alert(rcmail.gettext('note_inv_format', 'primitivenotes'));
	}
}
