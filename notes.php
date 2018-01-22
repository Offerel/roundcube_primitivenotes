<?php
define('INSTALL_PATH', realpath(__DIR__ . '/../../') . '/');
include INSTALL_PATH . 'program/include/iniset.php';
$rcmail = rcmail::get_instance();

// Login
if (!empty($rcmail->user->ID)) {
	$notes_path = $rcmail->config->get('notes_basepath', false).$rcmail->user->get_username().$rcmail->config->get('notes_folder', false);

	if (!is_dir($notes_path))
	{
		if(!mkdir($notes_path, 0774, true))
			error_log('Plugin PrimitiveNotes: Subfolders for $config[\'notes_basepath\'] ($config[\'notes_folder\']) failed. Please check your directory permissions.');
			die();
	}
}
else {
	error_log('Plugin PrimitiveNotes: Login failed. User is not logged in.');
	die();
}

$content = "";
$files = array();
$id = 0;

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
	$note_name = ($_POST['note_name'] != "") ? $_POST['note_name'] : "new note";
	$note_tags = explode(",",$_POST['note_tags']);
	$note_type = ($_POST['ftype'] != "") ? $_POST['ftype'] : 'html';
	
	$note_content = $_POST['editor1'];
	$old_name = $_POST['fname'];

	$tags_arr = array_map('trim', $note_tags);
	$tags_str = implode(' ',$tags_arr);
	$tags_str = ($tags_str != "") ? "[".$tags_str."]" : $tags_str;

	$new_name = $note_name.$tags_str.".".$note_type;
	
	$notes_path = $rcmail->config->get('notes_basepath', false).$rcmail->user->get_username().$rcmail->config->get('notes_folder', false);
	$old_name = $_POST['fname'];
	
	if(file_exists($notes_path.$old_name)) {
		if($old_name != $new_name) {
			rename($notes_path.$old_name, $notes_path.$new_name);
		}
	}
	
	$note_file = fopen ($notes_path.$new_name, "w");
	$content = fwrite($note_file, $note_content);
	fclose ($note_file);
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
					'name' => (strpos($name, "[")) ? explode("[", $name)[0] : explode(".", $name)[0],
					'filename' => $name,
					'size' => filesize($notes_path.$file),
					'type' => pathinfo($notes_path.$file,PATHINFO_EXTENSION),
					'time' => filemtime($notes_path.$file),
					'tags' => $ttags,
					'id' => $id,
					'mime_type' => mime_content_type($notes_path.$file),
					);
				$id++;
				}
			}
		closedir($handle);
	}
}

//usort($files, function($a, $b) { return $b['time'] <=> $a['time']; });
usort($files, function($a, $b) { return $b['time'] > $a['time']; });	// sort by lastmodified time
//usort($files, function($a, $b) { return $b['size'] < $a['size']; });

// Delete a note
if(isset($_POST['delNote'])) {
	$akey = array_search($_POST["fileid"], array_column($files, 'id'));
	$file = $notes_path.$files[$akey]['filename'];
	if(file_exists($file)) {
		unlink($file);
	}
}

// if a note is directly called, read this note
if(isset($_GET["n"])) {
	if($_GET["n"] === 'n') {
		//exit();
	} else {
		$akey = array_search($_GET["n"], array_column($files, 'id'));
		$file = $notes_path.$files[$akey]['filename'];
		if(file_exists($file)) {
			$content = file_get_contents($file);
		}}
} else { // Note, when it's not called directly
	$akey = 0;
	$file = $notes_path.$files[$akey]['filename'];
	if(file_exists($file)) {
		$content = file_get_contents($file);
		$nformat = $files[$akey]['type'];
		$nid = $files[$akey]['id'];
	}
}

// change open mode
if(isset($_GET["m"]))
{
	if($_GET["m"] === "v")
	{
		$mode = "v";
	} elseif ($_GET["m"] === "p"){
		$mode = "p";
	} else {
		$mode = "e";
	}
}

if(count($files[$akey]['tags']) > 1)
	$taglist = implode(", ", $files[$akey]['tags']);
else
	$taglist = "";

function human_filesize($bytes, $decimals = 2) {
  $sz = 'BKMGTP';
  $factor = round((strlen($bytes) - 1) / 3);
  return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
}
?>
<!DOCTYPE html>
<html>
	<head>
		<title><?PHP echo $files[$akey]['name'] ?></title>
		<meta charset='utf-8'>
		<meta name='viewport' content='width=device-width, initial-scale=1'>
		<!-- <link rel="stylesheet" href="<?PHP //echo $rcmail->config->get('skin_path') . '/primitivenotes.css'; ?>" /> -->
		<link rel="stylesheet" href="skins/primitivenotes.css" />
		<link rel="stylesheet" href="simplemde/simplemde.min.css">
		<script src="simplemde/simplemde.min.js"></script>		
		<script src="ckeditor/ckeditor.js"></script>
		<script>
		function loadnote() {
			var url = new URL(location.href);
			var t = url.searchParams.get("t");
			
			if(t === 'html' || t === 'md' || t === 'txt') {
				window.parent.document.getElementById("editnote").classList.remove('disabled');
			} else {
				window.parent.document.getElementById("editnote").classList.add('disabled');
			}
			window.parent.document.getElementById("rennote").classList.remove('disabled');
			window.parent.document.getElementById("deletenote").classList.remove('disabled');
			window.parent.document.getElementById("sendnote").classList.remove('disabled');
			
		}
		
		function selectEntry() {
			var url = new URL(location.href);
			var id = url.searchParams.get("n")
			if(!isNaN(parseInt(id)) && id > -1) {
				document.getElementById(id).classList.add('selected');
			}
		}
		</script>
	</head>
	<body style="margin: 0; padding: 0;" onLoad="selectEntry(); loadnote();">
		<div id="sidebar">
			<div id="filelist_header">
				<span class="searchbox" style="background: url(./../../skins/larry/images/buttons.png) 0 -316px white no-repeat;"><input type="text" id="notesearch" name="notesearch" onkeyup="searchList()" /></span>				
			</div>
			<div class="filelist">
				<ul id="filelist">
				<?PHP
				foreach ($files as $fentry) {
					if(strlen($fentry['name']) > 0 ) {
						$fsize = human_filesize($fentry['size'], 2);
						if(count($fentry['tags']) > 1)
							$tlist = implode(" ",$fentry['tags']);
						else
							$tlist = "";
						echo "<li id=\"".$fentry['id']."\" class=\"".$fentry['id']." ".$fentry['type']."\"><a  title=\"".$fentry['name']."\" href='".basename($_SERVER['PHP_SELF'])."?n=".$fentry['id']."&t=".$fentry['type']."&m=v'>".$fentry['name']."<br /><span class=\"fsize\">".$fsize."</span><span>".date("d.m.y H:i",$fentry['time'])."</span><span id=\"taglist\">".$tlist."</span></a></li>";
					}
				} 
				?>
				</ul>
			</div>
		</div>
		<div class="main">
		<form method="POST" id="metah">
		<div class="main_header">
			<?php if($mode === 'e' || $mode === 'p') { ?>
				<input id="note_name" name="note_name" type="text" placeholder="Title" value="<?PHP echo $files[$akey]['name']; ?>" style="font-size: 2em" required /><br />
				<input id="note_tags" name="note_tags" type="text" placeholder="Tags" value="<?PHP echo $taglist; ?>" />
				<input id="fname" name="fname" type="hidden" value="<?PHP echo $files[$akey]['filename'] ?>">
				<input id="ftype" name="ftype" type="hidden" value="<?PHP echo $files[$akey]['type'] ?>">
				<input id="mode" name="mode" type="hidden" value="<?php echo $_GET['m'] ?>" />
			<?php } else { 
				echo "<span style=\"margin: 10px; font-size: 2em; font-family: 'Lucida Grande',Verdana,Arial,Helvetica,sans-serif;\">".$files[$akey]['name']."</span><br />\n";
				echo "\t\t\t<span style=\"margin: 10px; font-size: 11px; font-family: 'Lucida Grande',Verdana,Arial,Helvetica,sans-serif;\">".$taglist."</span>\n";
				echo "\t\t\t<input id=\"fname\" name=\"fname\" type=\"hidden\" value=\"".$files[$akey]['filename']."\">\n";
			} ?>
		</div>
		<div id="save_button" class="save_button">
			<a href="#" onClick="document.getElementById('metah').submit();"></a>
		</div>
		<div class="main_area" id="main_area">
		<?PHP
			if(isset($_GET['t'])) {
				$format = $_GET['t'];
			} else {
				$format = $nformat;
			}

			if($mode === "e") {
				echo "<textarea name=\"$format\" id=\"$format\">".$content."</textarea>";
			}
			else {			
				if($format === "html") {
					echo "<div id=\"content\">".$content."</div>";
				} elseif ($format === "txt") {
					echo "<textarea id=\"txt\">".$content."</textarea>";
				} elseif ( $format === "md" ) {
					echo "<textarea id=\"md\">".$content."</textarea>";
				} else {
					$akey = array_search($_GET["n"], array_column($files, 'id'));
					$file = $files[$akey]['filename'];					
					$base64 = base64_encode($content);
					if($_GET['t'] === "pdf") {
						$height = " height: 100%;";
					} else {
						$height = "";
					}
					echo "<div style=\"max-width: 100%; max-height: 100%; overflow: auto; width: inherit;$height object-fit: cover;\"><object style=\"width: inherit; height: 99.2%;\" data=\"data:".$files[$akey]['mime_type'].";base64,$base64\" type=\"".$files[$akey]['mime_type']."\" >alt : <a href=\"Notes/".$file."\">PDF Download</a></object></div>";
				}
			}
		?>
		</div>
		</div>
		</form>
		<script>
		var url = new URL(location.href);
		if(url.searchParams.get("m") === 'p') {
			document.getElementById('save_button').style.display = 'inline';
		}
		
		if(document.getElementById("html")){
			var editorElem = document.getElementById("main_area");
			var editor = CKEDITOR.replace("html", { 
				on : {
					'instanceReady' : function( evt ) {
						evt.editor.resize("100%", editorElem.clientHeight);
						evt.editor.commands.save.disable();
						
						var markdown = evt.editor.plugins.markdown;
						var contents = evt.editor.getData();
						CKEDITOR.scriptLoader.load(markdown.path + 'js/marked.js', function() {
							evt.editor.setData(marked(contents));
						});
						
					},
					
					'change' : function( evt ) {
						if(document.getElementById('note_name').value != "")
						evt.editor.commands.save.enable();
					}
				}
			});
		}
		
		if (document.getElementById("md")) {
			var simplemde = new SimpleMDE({ element: document.getElementById("md") });
			simplemde.togglePreview();
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