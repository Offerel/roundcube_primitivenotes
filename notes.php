<?php
define('INSTALL_PATH', realpath(__DIR__ . '/../../') . '/');
include INSTALL_PATH . 'program/include/iniset.php';
$rcmail = rcmail::get_instance();

// Login
if (!empty($rcmail->user->ID)) {
	if(substr($rcmail->config->get('notes_basepath', false), -1) != '/') {
		error_log('PrimitiveNotes: check $config[\'notes_basepath\'] the path must end with a backslash.');
		die();
	}
	
	if(substr($rcmail->config->get('notes_folder', false), -1) != '/') {
		error_log('PrimitiveNotes: check $config[\'notes_folder\'] the path must end with a backslash.');
		die();
	}
	
	$notes_path = $rcmail->config->get('notes_basepath', false).$rcmail->user->get_username().$rcmail->config->get('notes_folder', false);
	$html_editor = $rcmail->config->get('html_editor', false);
	$default_format = $rcmail->config->get('default_format', false);
	$language = $rcmail->get_user_language();
	
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

// Get image from URL and save to media folder
if(isset($_POST['uplImage'])) {
	$imageURL = $_POST['imageURL'];
	$filename = basename($imageURL);
	$ext = pathinfo($imageURL, PATHINFO_EXTENSION);
	$fname = time().$ext;
	
	$img = $notes_path."media/".$fname;

	if (!is_dir($notes_path."media/"))
	{
		if(!mkdir($notes_path."media/", 0774, true)) {
			error_log('PrimitiveNotes: Subfolders for $config[\'notes_basepath\'] ($config[\'notes_folder\']) (media) failed. Please check your directory permissions.');
			die();
		}
	}
	if(!file_put_contents($img, file_get_contents($imageURL))) {
		error_log('PrimitiveNotes: Cant write to media subfolder.');
		echo 'PrimitiveNotes: Cant write to media subfolder.';
		die();
	}
	echo "file://media/".$fname;
	die();
}

// Get local image and save to media folder
if($_FILES['localFile'] && $_FILES['localFile']['error'] == 0 ) {
	if (!is_dir($notes_path."media/"))
	{
		if(!mkdir($notes_path."media/", 0774, true)) {
			error_log('PrimitiveNotes: Subfolders for $config[\'notes_basepath\'] ($config[\'notes_folder\']) (media) failed. Please check your directory permissions.');
			die();
		}
	}
	
	$ext = pathinfo($_FILES['localFile']['name'], PATHINFO_EXTENSION);
	$fname = time().$ext;
	
	if(!move_uploaded_file($_FILES['localFile']['tmp_name'], $notes_path.'media/'.$fname)) {
		error_log('PrimitiveNotes: Cant write to media subfolder.');
		echo 'PrimitiveNotes: Cant write to media subfolder.';
		die();
	}
	echo "file://media/".$fname;
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
		read_note($id, $filename, null, null);
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
		
		$note_header = "<input id=\"note_name\" name=\"note_name\" type=\"text\" placeholder=\"$titleH\" value=\"$note_name\" style=\"font-size: 2em\" required /><br />";
		$note_header.= "<textarea id=\"note_tags\" name=\"note_tags\" class=\"example\" rows=\"1\"></textarea>";
		$note_header.= "<input id=\"fname\" name=\"fname\" type=\"hidden\" value=\"$filename\" />";
		$note_header.= "<script>tagsuggest('$taglist');</script>";
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
		$format = $_POST['format'];
		read_note($id, $filename, 'edit', $format);
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
	$note_tags = explode(",",str_replace(['"', '[', ']'], '', $_POST['note_tags']));

	$note_content = $_POST['editor1'];
	$old_name = $_POST['fname'];

	if(!$note_type = $_POST['ftype'])
		$note_type = ($default_format != '') ? $default_format : 'html';
	
	$note_tags = array_unique($note_tags);
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
	$taglist = array();
	if ($handle = opendir($notes_path)) {
		while (($file = readdir($handle)) !== false) {
			if (is_file($notes_path.$file)) {
				$name = pathinfo($notes_path.$file,PATHINFO_BASENAME);
				$ext = pathinfo($notes_path.$file,PATHINFO_EXTENSION);
				
				$supported_ext = array("md", "html", "txt", "pdf", "jpg", "png");	
				if(in_array($ext,$supported_ext)) {				
					$tags = null;
					$rv = preg_match('"\\[(.*?)\\]"', $name, $tags);
					
					if(count($tags) > 0) {
						$ttags = explode(" ", $tags[1]);
						$taglist = array_merge($taglist,$ttags);
					} else {
						$ttags = "";
					}

					// put found files in array
					$files[] = array(
						'name' => (strpos($name, "[")) ? explode("[", $name)[0] : explode(".", $name)[0]
						,'filename' => $name
						,'size' => filesize($notes_path.$file)
						,'type' => $ext
						,'time' => filemtime($notes_path.$file)
						,'tags' => $ttags
						,'id' => $id
						);
					}	
				$id++;
				}
			}
		closedir($handle);
	}
}

// sort the files array by lastmodified time
usort($files, function($a, $b) { return $b['time'] > $a['time']; });
$taglist = array_unique ($taglist);

function getBimage($match) {
	global $notes_path;
	$imagePath = $notes_path.$match[1];
	$imgContent = file_get_contents($imagePath);
	$base64str = base64_encode($imgContent);
	$mime = mime_content_type($imagePath);
	return "(data:$mime;base64,$base64str)";
}

// get contents of the note
function read_note($id, $filename, $mode, $format) {
	global $notes_path;
	$file = $notes_path.$filename;
	if($filename != '')
		$format = substr($filename,strripos($filename, ".")+1);		

	if(file_exists($file)) {
		$content = file_get_contents($file);
		$re = '/\(file:\/\/([^\)]*?)\)/m';

		if($mode != 'edit')
			$inhalt = preg_replace_callback($re, "getBimage", $content);
		else
			$inhalt = $content;

		$note = array(
			'name'		=> substr($filename, 0, stripos($filename, "["))
			,'content'	=> $inhalt
			,'format'	=> $format
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
			case 'pdf':	$showNote = showBIN($note); break;
			case 'jpg': $showNote = showBIN($note); break;
			case 'png': $showNote = showBIN($note); break;	
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

function editTXT($note) {
	return "<textarea id=\"txt\" name=\"editor1\">".$note['content']."</textarea>
	<script>
		document.getElementById('save_button').style.display = 'inline';
	</script>";
}

function editHTML($note) {
	global $html_editor, $language, $default_format;
	$format = $note['format'];
	
	if($format == "")
		$format = ($default_format != '') ? $default_format : 'html';

	$output = "<textarea name=\"editor1\" id=\"$format\">".$note['content']."</textarea><input id=\"ftype\" name=\"ftype\" type=\"hidden\" value=\"$format\" />";
	
	if($language != 'en_US')
		$language = substr($language,0,2);

	if($format == 'html') {
		if($html_editor === 'tinymce') {
			$output.="<script>
				tinymce.init({
					selector: '#html'
					,plugins : 'fullscreen searchreplace media charmap textcolor directionality lists link image code contextmenu fullpage paste save searchreplace table toc'
					,toolbar: 'save fullpage | undo redo pastetext | bold italic underline removeformat | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent blockquote | forecolor backcolor | fontselect fontsizeselect | link unlink table image | code searchreplace fullscreen'
					,paste_data_images: true
					,menubar: false
					,toolbar_items_size:'small'
					,language: '$language'
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
	} else {
		$output.="<form id='imgFile' ><input type='file' id='localimg' name='localimg' style='display: none' onchange='simage();'></form><script>
		var simplemde = new SimpleMDE({ 
		element: document.getElementById('md')
		,autoDownloadFontAwesome: false
		,spellChecker: false
		,autofocus: true
		,status: false
		,promptURLs: true
		,renderingConfig: {
			codeSyntaxHighlighting: true,
		}
		,toolbar: 	[{ name: 'Save',
						action: saveFile,
						className: 'fa fa-floppy-o',
						title: 'Save',
					}, '|',
					'undo', 'redo', '|', 'bold', 'italic', 'strikethrough','clean-block', '|', 'heading', 'heading-smaller', 'heading-bigger', '|',
					'code', 'quote', 'unordered-list', 'ordered-list', '|',
					'link', 
					{ name: 'Image',
						action: uplInsertImage,
						className: 'fa fa-picture-o',
						title: 'Upload and insert Image',
					},
					{ name: 'Image',
						action: uplLocalImage,
						className: 'fa fa-file-image-o',
						title: 'Upload and insert Image',
					},
					'table', '|',
					'preview', 'side-by-side', 'fullscreen', '|'
					
					]
	});
	
	function simage() {
		var allowed_extensions = new Array('jpg', 'jpeg', 'png');
		var file_extension = document.getElementById('localimg').value.split('.').pop().toLowerCase();

		for(var i = 0; i <= allowed_extensions.length; i++)
		{
			if(allowed_extensions[i]==file_extension)
			{
				var file_data = $('#localimg').prop('files')[0];
				var formData = new FormData();
				formData.append('localFile', file_data);
				
				$.ajax({
					type: 'POST'
					,url: 'notes.php'
					,dataType: 'text'
					,cache: false
					,contentType: false
					,processData: false
					,data: formData
					,success: function(data){
						pos = simplemde.codemirror.getCursor();
						simplemde.codemirror.setSelection(pos, pos);
						simplemde.codemirror.replaceSelection('![](' + data + ')');
					}
				});
				return true;
			}
		}
		alert('Unsupported file format');
		return false;
	}
	
	function saveFile(editor) {
		document.getElementById('metah').submit();
	}
	
	function uplLocalImage() {
		document.getElementById('localimg').click();
	}
	
	function uplInsertImage() {
		var imageURL = prompt('URL of the image', '');
		if(imageURL) {
			$.ajax({
				type: 'POST'
				,url: 'notes.php'
				,data: {
					'uplImage': '1'
					,'imageURL': imageURL
				}
				,success: function(data){
					pos = simplemde.codemirror.getCursor();
					simplemde.codemirror.setSelection(pos, pos);
					simplemde.codemirror.replaceSelection('![](' + data + ')');
				}
			});
		} else
			return false;
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
				,status: false
				,toolbar: false
				,autoDownloadFontAwesome: false
				,spellChecker: false
				,renderingConfig: {
					codeSyntaxHighlighting: true,
					highlightingTheme: 'solarized-dark',
				}
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

if ($html_editor == 'ckeditor') {
	$editor_js = '<script src="js/ckeditor/ckeditor.js"></script>';
}
else {
	$editor_js = '<link rel="stylesheet" href="../../program/js/tinymce/skins/lightgray/skin.min.css">\n\t<script src=\"../../program/js/tinymce/tinymce.min.js\"></script>';
}
?>
<!DOCTYPE html>
<html>
	<head>
		<title><?PHP echo $note['name'] ?></title>
		<meta charset='utf-8'>
		<meta name='viewport' content='width=device-width, initial-scale=1'>

		<script type="text/javascript" src="../../program/js/jquery.min.js"></script>
		<script type="text/javascript" src="../../skins/larry/ui.min.js"></script>
		<script type="text/javascript" src="../../program/js/common.min.js"></script>
		<script type="text/javascript" src="../../program/js/app.min.js"></script>
		<link rel="stylesheet" href="../../skins/larry/styles.min.css" />
		
		<link rel="stylesheet" href="skins/primitivenotes.css" />
		<link rel="stylesheet" href="js/highlight/styles/vs.css">
		<script src="js/highlight/highlight.pack.js"></script>
		<link rel="stylesheet" href="js/simplemde/simplemde.css">
		<link rel="stylesheet" href="js/simplemde/font-awesome/css/font-awesome.min.css">
		<script src="js/simplemde/simplemde.min.js"></script>
		<?PHP echo $editor_js ?>
		
		<link rel="stylesheet" href="js/textext/css/textext.core.css" type="text/css" />
		<link rel="stylesheet" href="js/textext/css/textext.plugin.tags.css" type="text/css" />
		<link rel="stylesheet" href="js/textext/css/textext.plugin.autocomplete.css" type="text/css" />
		<link rel="stylesheet" href="js/textext/css/textext.plugin.focus.css" type="text/css" />
		<link rel="stylesheet" href="js/textext/css/textext.plugin.prompt.css" type="text/css" />
		<link rel="stylesheet" href="js/textext/css/textext.plugin.arrow.css" type="text/css" />
		<script src="js/textext/js/textext.core.js" type="text/javascript" charset="utf-8"></script>
		<script src="js/textext/js/textext.plugin.tags.js" type="text/javascript" charset="utf-8"></script>
		<script src="js/textext/js/textext.plugin.autocomplete.js" type="text/javascript" charset="utf-8"></script>
		<script src="js/textext/js/textext.plugin.suggestions.js" type="text/javascript" charset="utf-8"></script>
		<script src="js/textext/js/textext.plugin.filter.js" type="text/javascript" charset="utf-8"></script>
		<script src="js/textext/js/textext.plugin.focus.js" type="text/javascript" charset="utf-8"></script>
		<script src="js/textext/js/textext.plugin.prompt.js" type="text/javascript" charset="utf-8"></script>
		<script src="js/textext/js/textext.plugin.ajax.js" type="text/javascript" charset="utf-8"></script>
		<script src="js/textext/js/textext.plugin.arrow.js" type="text/javascript" charset="utf-8"></script>
		<script type="text/javascript">
			var rcmail = new rcube_webmail();
		</script>
	</head>
	<body style="margin: 0; padding: 0;" onload="firstNote();">
		<div id="sidebar" class="uibox listbox">
			<div id="filelist_header">
				<span class="searchbox" style="background: url(./../../skins/larry/images/buttons.png) 0 -316px white no-repeat;"><input type="text" id="notesearch" name="notesearch" onkeyup="searchList()" /></span>				
			</div>
			<div class="filelist" id="entrylist">
				<ul id="filelist">
				<?PHP
				foreach ($files as $fentry) {
					if(strlen($fentry['name']) > 0 ) {
						$fsize = human_filesize($fentry['size'], 2);
						
						if(is_array($fentry['tags'])) {
							$tlist = implode(" ",$fentry['tags']);
							$tlist = "<span id=\"taglist\">$tlist</span>";
						} else
							$tlist = "";
						
						$id = ($fentry['id'] != "") ? $fentry['id'] : 0;						
						$filename = $fentry['filename'];
						$format = $fentry['type'];
						
						echo "<li id=\"$id\" class=\"$id $format\"><input value=\"$filename\" id=\"entry$id\" type=\"hidden\"/><a id=\"entry\" onClick=\"showNote($id, '$format');\" title=\"".$fentry['name']."\" href='#'>".$fentry['name']."<br /><span class=\"fsize\">$fsize</span><span>".date("d.m.y H:i",$fentry['time'])."</span>$tlist</a></li>";
					}
				} 
				?>
				</ul>
			</div>
		</div>
		<div id="main" class="main uibox contentbox">
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
		new rcube_splitter({ id:'notessplitter', p1:'#sidebar', p2:'#main', orientation:'v', relative:true, start:400, min:250, size:12 }).init();
		
		var suggestList = [<?php echo '"'.implode('", "', $taglist).'"' ?>];
		function tagsuggest(taglist) {
			var tagitemlist = taglist.split(", ");
			$('#note_tags').textext({
				plugins: 'tags,autocomplete,suggestions',
				tagsItems: tagitemlist,
				suggestions: suggestList
			});
		}
		
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
				if (a.innerHTML.toUpperCase().indexOf(filter) > -1 ) {
					li[i].style.display = "";
				} else {
					li[i].style.display = "none";
				}
			}
		}
		</script>
	</body>
</html>