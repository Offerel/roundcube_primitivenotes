<?php
define('INSTALL_PATH', realpath(__DIR__ . '/../../') . '/');
include INSTALL_PATH . 'program/include/iniset.php';
$rcmail = rcmail::get_instance();

// Login
if (!empty($rcmail->user->ID)) {
	$notes_path = $rcmail->config->get('notes_basepath', false).$rcmail->user->get_username().$rcmail->config->get('notes_folder', false);
	$html_editor = $rcmail->config->get('html_editor', false);
	if (!is_dir($notes_path))
	{
		if(!mkdir($notes_path, 0774, true)) {
			error_log('PrimitiveNotes: Subfolders for $config[\'notes_basepath\'] ($config[\'notes_folder\']) failed. Please check your directory permissions.');
			die();
		}
	}
}
else {
	error_log('PrimitiveNotes: Login failed. User is not logged in.');
	die();
}

// ShowNote Header
if(isset($_POST['showHeader'])) {
		$filename = $_POST['filename'];
		if(stripos($filename, "[")) {
			$note_name = substr($filename, 0, stripos($filename, "["));
			$taglist = str_replace(" ", ", ", substr(substr($filename, 0, stripos($filename, "]")), stripos($filename, "[") +1));
		} else {
			$note_name = substr($filename, 0, stripos($filename, "."));
			$taglist = "";
		}

		$note_header = "<span id=\"headerTitle\" class=\"headerTitle\">".$note_name."</span><br />\n\t\t\t<span class=\"headerTags\">".$taglist."</span>\n\t\t\t<input id=\"fname\" name=\"fname\" type=\"hidden\" value=\"".$filename."\">\n";
		die($note_header);
}

// ShowNote Content
if(isset($_POST['showNote'])) {
		$id =  $_POST['id'];
		$filename = $_POST['filename'];
		read_note($id, $filename, null);
		die();
}

// EditNote Header
if(isset($_POST['editHeader'])) {
		$filename = $_POST['filename'];
		if(stripos($filename, "[")) {
			$note_name = substr($filename, 0, stripos($filename, "["));
			$taglist = str_replace(" ", ", ", substr(substr($filename, 0, stripos($filename, "]")), stripos($filename, "[") +1));
		} else {
			$note_name = substr($filename, 0, stripos($filename, "."));
			$taglist = "";
		}
		$format = substr($filename,stripos($filename,".")+1);
		$titleH = $rcmail->gettext('note_title','primitivenotes');
		$tagsH = $rcmail->gettext('note_tags','primitivenotes');
		
		$note_header = "<input id=\"note_name\" name=\"note_name\" type=\"text\" placeholder=\"$titleH\" value=\"$note_name\" style=\"font-size: 2em\" required onInput=\"revealButton()\" /><br />";
		$note_header.= "<input id=\"note_tags\" name=\"note_tags\" type=\"text\" placeholder=\"$tagsH\" value=\"$taglist\" onInput=\"revealButton()\" />";
		$note_header.= "<input id=\"ftype\" name=\"ftype\" type=\"hidden\" value=\"$format\" />";
		$note_header.= "<input id=\"fname\" name=\"fname\" type=\"hidden\" value=\"$filename\" />";
		
		$save_allowed = array("txt", "md", "html");	
		if(!in_array($format,$save_allowed)) {
			$note_header.= "<input type=\"hidden\" name=\"editor1\" value=\"e\" />";
		}
		
		die($note_header);
}

// EditNote Content
if(isset($_POST['editNote'])) {
		$id =  $_POST['id'];
		$filename = $_POST['filename'];
		read_note($id, $filename, 'edit');
		die();
}

// rename a note
if(isset($_POST['mode'])) {
	if($_POST['mode'] === 'p') {
		$oldname = $_POST['fname'];
		$newname = $_POST['note_name'];
		$ext = $_POST['ftype'];
		$tags = explode (",", $_POST['note_tags']);
		$tags_arr = array_map('trim', $tags);
		
		if(count($tags) > 1)
			$tags_str = "[".implode(" ",$tags_arr)."]";
		else
			$tags_str = "";
			
		$newname = $newname.$tags_str.".".$ext;
		if($oldname != $newname)
			rename($notes_path.$oldname, $notes_path.$newname);
	}
	
}

// Save a note, when its changed
if(isset($_POST['editor1'])) {
	$note_name = ($_POST['note_name'] != "") ? $_POST['note_name'] : "new_unknown_note";
	$note_tags = explode(",",$_POST['note_tags']);

	$note_content = $_POST['editor1'];
	$old_name = $_POST['fname'];

	if(!$note_type = substr($old_name,strripos($old_name,".") +1))
		$note_type = 'html';
	
	$tags_arr = array_map('trim', $note_tags);
	$tags_str = implode(' ',$tags_arr);
	$tags_str = ($tags_str != "") ? "[".$tags_str."]" : $tags_str;

	$new_name = $note_name.$tags_str.".".$note_type;
	
	$notes_path = $rcmail->config->get('notes_basepath', false).$rcmail->user->get_username().$rcmail->config->get('notes_folder', false);
	
	if(file_exists($notes_path.$old_name)) {
		if($old_name != $new_name) {
			rename($notes_path.$old_name, $notes_path.$new_name);
		}
	} elseif ($old_name != "") {
		error_log('PrimitiveNotes: Note not found, can`t save note.');
	}

	$save_allowed = array("txt", "md", "html");	
	if(in_array($note_type,$save_allowed)) {
		$note_file = fopen ($notes_path.$new_name, "w");
		$content = fwrite($note_file, $note_content);
		fclose ($note_file);
	}
}

// Delete a note
if(isset($_POST['delNote'])) {
	$file = $notes_path.$_POST["fileid"];

	if(file_exists($file)) {
		unlink($file);
	}
}

// Read the files in the notes folder put them in an array and sort by last edit date
if (is_dir($notes_path)) {
	if ($handle = opendir($notes_path)) {
		while (($file = readdir($handle)) !== false) {
			if (is_file($notes_path.$file)) {
				$name = pathinfo($notes_path.$file,PATHINFO_BASENAME);
				$tags = null;
				$rv = preg_match('"\\[(.*?)\\]"', $name, $tags);
				
				if(count($tags) > 0) {
					$ttags = explode(" ", $tags[1]);
				} else {
					$ttags = "";
				}

				$files[] = array(
					'name' => (strpos($name, "[")) ? explode("[", $name)[0] : explode(".", $name)[0]
					,'filename' => $name
					,'size' => filesize($notes_path.$file)
					,'type' => pathinfo($notes_path.$file,PATHINFO_EXTENSION)
					,'time' => filemtime($notes_path.$file)
					,'tags' => $ttags
					,'id' => $id
					);
				$id++;
				}
			}
		closedir($handle);
	}
}

// sort the files array by lastmodified time
usort($files, function($a, $b) { return $b['time'] > $a['time']; });

// get contents of the note
function read_note($id, $filename, $mode) {
	global $notes_path;
	$file = $notes_path.$filename;
	
	if(file_exists($file)) {
		$note = array(
			'name'		=> substr($filename, 0, stripos($filename, "["))
			,'content'	=> file_get_contents($file)
			,'format'	=> substr($filename,strripos($filename, ".")+1)
			,'id'		=> $id
			,'mime_type'=> mime_content_type($file)
			,'filename'	=> $filename
			,'taglist'	=> substr($filename,stripos($filename, "["),stripos($filename, "]"))
			);
	} elseif($filename != "" ) {
		error_log('PrimitiveNotes: Note not found');
	}
	
	if($mode === 'edit') {
		switch ($note['format']) {
			case 'html':$showNote = editHTML($note); break;
			case 'pdf':	$showNote = showBIN($note); break;
			case 'jpg': $showNote = showBIN($note); break;
			case 'png': $showNote = showBIN($note); break;
			case 'md':	$showNote = editMARKDOWN($note); break;		
			default:	$showNote = editHTML($note);
		}
	} else {
		switch ($note['format']) {
			case 'html':$showNote = showHTML($note); break;
			case 'pdf':	$showNote = showBIN($note); break;
			case 'jpg': $showNote = showBIN($note); break;
			case 'png': $showNote = showBIN($note); break;
			case 'md':	$showNote = showMARKDOWN($note); break;		
			default:	$showNote = showTXT($note);
		}
	}

	die($showNote);
}

function editMARKDOWN($note) {
	return "<textarea id=\"md\" name=\"editor1\">".$note['content']."</textarea>
	<script>
	var simplemde = new SimpleMDE({ 
		element: document.getElementById('md')
		,autoDownloadFontAwesome: false
		,spellChecker: false
	});
	document.getElementById('save_button').style.display = 'inline';
	</script>";
}

function editTXT($note) {
	return "<textarea id=\"txt\" name=\"editor1\">".$note['content']."</textarea>
	<script>
		document.getElementById('save_button').style.display = 'inline';
	</script>";
}

function editHTML($note) {
	global $html_editor;
	//$user_lang = rcube::get_instance()->get_user_language();
	$format = $note['format'];
	
	if($format == "")
		$format = "html";
	
	$output = "<textarea name=\"editor1\" id=\"$format\">".$note['content']."</textarea>";
	
	if($html_editor === 'tinymce') {
		$output.="<script>
			tinymce.init({
				selector: '#html'
				,plugins : 'fullscreen searchreplace media charmap textcolor directionality lists link image code contextmenu fullpage paste save searchreplace table toc'
				,toolbar: 'save fullpage | undo redo pastetext | bold italic underline removeformat | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent blockquote | forecolor backcolor | fontselect fontsizeselect | link unlink table image | code searchreplace fullscreen'
				,paste_data_images: true
				,menubar: false
				,toolbar_items_size:'small'
		  });
		</script>";
	} else {
		$output.="<script>
		if(document.getElementById('html')){
			var editorElem = document.getElementById('main_area');
			var editor = CKEDITOR.replace('html', { 
				on : {
					'instanceReady' : function(evt) {
						evt.editor.resize('100%', editorElem.clientHeight);
						evt.editor.commands.save.disable();
					},
					'change' : function(evt) {
					if( document.getElementById('note_name').value != '' )
							evt.editor.commands.save.enable();
					}
				}
			});
		}
		</script>";
	}
	return $output;
}

function showHTML($note) {
	return "<div id=\"content\">".$note['content']."</div>";
}

function showBIN($note) {
	$base64 = base64_encode($note['content']);
	if($note['format']==='pdf') $pdf_style = "style=\"width: 100%; height: 100%;\"";

	return "<div style=\"overflow: auto; max-width: 100%; max-height: 100%\"><object $pdf_style data=\"data:".$note['mime_type'].";base64,$base64\" type=\"".$note['mime_type']."\" ></object></div>";
}

function showTXT($note) {
	return "<textarea id=\"".$note['format']."\" readonly=\"readonly\">".$note['content']."</textarea>";
}

function showMARKDOWN($note) {
	return "<textarea id=\"md\">".$note['content']."</textarea>
	<script>
	if (document.getElementById('md')) {
			var simplemde = new SimpleMDE({ 
				element: document.getElementById('md')
				,toolbar: false
				,autoDownloadFontAwesome: false
				,spellChecker: false
			});
			simplemde.togglePreview();
		}
		</script>";
}

function human_filesize($bytes, $decimals = 2) {
  $sz = 'BKMGTP';
  $factor = round((strlen($bytes) - 1) / 3);
  return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
}
?>
<!DOCTYPE html>
<html>
	<head>
		<title><?PHP echo $note['name'] ?></title>
		<meta charset='utf-8'>
		<meta name='viewport' content='width=device-width, initial-scale=1'>
		<link rel="stylesheet" href="skins/primitivenotes.css" />
		<link rel="stylesheet" href="simplemde/simplemde.min.css">
		<link rel="stylesheet" href="../../program/js/tinymce/skins/lightgray/skin.min.css">
		<link rel="stylesheet" href="skins/font-awesome/css/font-awesome.min.css">
		<script src="../../program/js/jquery.min.js"></script>
		<script src='../../program/js/tinymce/tinymce.min.js'></script>
		<script src="simplemde/simplemde.min.js"></script>
		<script src="ckeditor/ckeditor.js"></script>
	</head>
	<body style="margin: 0; padding: 0;" onload="firstNote();">
		<div id="sidebar">
			<div id="filelist_header">
				<span class="searchbox" style="background: url(./../../skins/larry/images/buttons.png) 0 -316px white no-repeat;"><input type="text" id="notesearch" name="notesearch" onkeyup="searchList()" /></span>				
			</div>
			<div class="filelist" id="entrylist">
				<ul id="filelist">
				<?PHP
				foreach ($files as $fentry) {
					if(strlen($fentry['name']) > 0 ) {
						$fsize = human_filesize($fentry['size'], 2);
						
						if(count($fentry['tags']) > 1)
							$tlist = implode(" ",$fentry['tags']);
						else
							$tlist = "";
						
						$id = ($fentry['id'] != "") ? $fentry['id'] : 0;						
						$filename = $fentry['filename'];
						$format = $fentry['type'];
						
						echo "<li id=\"$id\" class=\"$id $format\"><input value=\"$filename\" id=\"entry$id\" type=\"hidden\"/><a id=\"entry\" onClick=\"showNote($id, '$format');\" title=\"".$fentry['name']."\" href='#'>".$fentry['name']."<br /><span class=\"fsize\">$fsize</span><span>".date("d.m.y H:i",$fentry['time'])."</span><span id=\"taglist\">$tlist</span></a></li>";
					}
				} 
				?>
				</ul>
			</div>
		</div>
		<div class="main">
		<form method="POST" id="metah">
		<div id="main_header" class="main_header">
		</div>
		<div id="save_button" class="save_button">
			<a href="#" onClick="document.getElementById('metah').submit();"></a>
		</div>
		<div class="main_area" id="main_area">
		</div>
		</div>
		</form>
		<script>
		function revealButton() {
			if(document.getElementById('fname').value.indexOf('html') < 0)
				document.getElementById('save_button').style.display = 'inline';
		}

		function firstNote() {
			showNote(document.getElementById('filelist').firstElementChild.classList[0],document.getElementById('filelist').firstElementChild.classList[1]);
		}
		
		function showNote(id, format) {
			document.getElementById('save_button').style.display = 'none';
			
			// mark the correct entry in the sidebar
			var elements = document.getElementsByClassName('selected');			
			while(elements.length > 0){
				elements[0].classList.remove('selected');
			}			
			document.getElementById(id).classList.add('selected');
			
			// change the toolbar button according to the note format	
			window.parent.document.getElementById("editnote").classList.remove('disabled');
			window.parent.document.getElementById("deletenote").classList.remove('disabled');
			window.parent.document.getElementById("sendnote").classList.remove('disabled');
			
			// load note header
			var fname = document.getElementById('entry' + id).value;
			
			$.ajax({
				type: "POST"
				,url: "notes.php"
				,data: {
					"showHeader": "1"
					,"filename": fname
					,"id": id
				}
				,success: function(data){
					$("#main_header").html(data);
					location.href
				}
			});
			
			// load note content
			$.ajax({
				type: "POST"
				,url: "notes.php"
				,data: {
					"showNote": "1"
					,"filename": fname
					,"id": id
				}
				,success: function(data){
					$("#main_area").html(data);
				}
			});
		}
		
		function searchList() {
			// Declare variables
			var input, filter, ul, li, a, i;
			input = document.getElementById('notesearch');
			filter = input.value.toUpperCase();
			ul = document.getElementById("filelist");
			li = ul.getElementsByTagName('li');

			// Loop through all list items, and hide those who don't match the search query
			for (i = 0; i < li.length; i++) {
				a = li[i].getElementsByTagName("a")[0];
				if (a.innerHTML.toUpperCase().indexOf(filter) > -1) {
					li[i].style.display = "";
				} else {
					li[i].style.display = "none";
				}
			}
		}
		</script>
	</body>
</html>