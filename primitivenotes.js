window.rcmail && rcmail.addEventListener('init', function(evt) {
	rcmail.register_command('newnote', new_note, true);
	rcmail.register_command('editnote', edit_note, true);
	rcmail.register_command('deletenote', delete_note, true);
	rcmail.register_command('sendnote', send_note, true);
	rcmail.register_command('addnote', add_note, true);
	//rcmail.register_command('rennote', rename_note, true);
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
	//document.getElementById('notescontentframe').src = 'plugins/primitivenotes/notes.php?m=e&t=html&n=n';
	$.ajax({
		type: "POST"
		,url: "plugins/primitivenotes/notes.php"
		,data: {
			"editHeader": "1"
			,"filename": ''
		}
		,success: function(data){
			$('#notescontentframe').contents().find("div#main_header").html(data);
		}
	});
	
	//if(editFormats.indexOf(format) >= 0) {
		$.ajax({
			type: "POST"
			,url: "plugins/primitivenotes/notes.php"
			,data: {
				'editNote': "1"
				,'filename': ""
			}
			,success: function(data){
				$('#notescontentframe').contents().find("div#main_area").html(data);
			}
		});
	//}
}

function edit_note() {
	var fname = window.frames['notescontentframe'].document.getElementById('fname').value;
	var editFormats = ['html', 'txt', 'md'];
	
	var format = fname.substr(fname.lastIndexOf('.') + 1);
	
	$.ajax({
		type: "POST"
		,url: "plugins/primitivenotes/notes.php"
		,data: {
			"editHeader": "1"
			,"filename": fname
		}
		,success: function(data){
			$('#notescontentframe').contents().find("div#main_header").html(data);
		}
	});
	
	if(editFormats.indexOf(format) >= 0) {
		$.ajax({
			type: "POST"
			,url: "plugins/primitivenotes/notes.php"
			,data: {
				'editNote': "1"
				,'filename': fname
			}
			,success: function(data){
				$('#notescontentframe').contents().find("div#main_area").html(data);
			}
		});
	}
}

function delete_note() {
	var fname = window.frames['notescontentframe'].document.getElementById('fname').value;
	var nname = window.frames['notescontentframe'].document.getElementById('headerTitle').innerHTML;
	var message = rcmail.gettext('note_del_note', 'primitivenotes').replace('%note%',nname);
	
	if(fname && nname) {
		if (confirm(message)) {
			$.ajax({
				url: 'plugins/primitivenotes/notes.php',
				type: 'post',
				data: {
					"delNote": "1",
					"mode": "delete",
					"fileid": fname,
				},
				success: function(result){
					document.getElementById('notescontentframe').src='plugins/primitivenotes/notes.php'
				}
			});
		} else {
			return false;
		}
	}
}

function send_note() {
	var file = window.frames['notescontentframe'].document.getElementById('fname').value;
	var type = file.substring(file.lastIndexOf('.')+1);
	var validtypes = ['html', 'pdf', 'jpg', 'png', 'md', 'txt'];
	
	if(validtypes.indexOf(type) > -1){
		rcmail.goto_url('mail/compose'
						, { _note_type: type
							, _note_filename: file
						}, true);
	}
	else {
		alert(rcmail.gettext('note_inv_format', 'primitivenotes'));
	}
}
