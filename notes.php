<?php
/**
 * Roundcube Notes Plugin
 *
 * @version 2.0.0
 * @author Offerel
 * @copyright Copyright (c) 2021, Offerel
 * @license GNU General Public License, version 3
 */
define('INSTALL_PATH', realpath(__DIR__ . '/../../') . '/');
include INSTALL_PATH . 'program/include/iniset.php';
$rcmail = rcmail::get_instance();

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
	$media_folder = $rcmail->config->get('media_folder', false);
	$default_format = $rcmail->config->get('default_format', false);
	$language = $rcmail->get_user_language();
	$yh_begin = $rcmail->config->get('yaml_start', '');
	$yh_end = $rcmail->config->get('yaml_end', '');
	
	if (!is_dir($notes_path)) {
		if(!mkdir($notes_path, 0774, true)) {
			error_log('PrimitiveNotes: Subfolders for $config[\'notes_basepath\'] ($config[\'notes_folder\']) failed. Please check your directory permissions.');
			die();
		}
	}
} else {
	error_log('PrimitiveNotes: Login failed. User is not logged in.');
	http_response_code(403);
	header('location: ../../');
    die('Login failed. User is not logged in.');
}

if(isset($_GET['blink'])) {
	$file = urldecode($_GET['blink']);
	$type = $_GET['t'];
	if(file_exists($notes_path.$media_folder.$file)) {
		$fileh = file_get_contents($notes_path.$media_folder.$file);
		if($type == 'i') {
			$imagev = imagecreatefromstring($fileh);
			list($width, $height, $type, $attr) = getimagesizefromstring($fileh);
			if($width > 860) {
				$imagev = imagescale($imagev, 860);
			}
			header("Content-Type: image/jpeg");
			header("Content-Disposition: inline; filename=\"".pathinfo($file)['filename'].".jpg\"");
			imagejpeg($imagev);
			imagedestroy($imagev);
		}
		elseif($type == 'l') {
			$mime = mime_content_type($notes_path.$media_folder.$file);
			header("Content-type: $mime");
			header("Content-Disposition: inline; filename=\"$file\"");
			echo $fileh;
		}
	}
	die();
}

if($_FILES['localFile'] && $_FILES['localFile']['error'] == 0 ) {
	if (!is_dir($notes_path.$media_folder)) {
		if(!mkdir($notes_path.$media_folder, 0774, true)) {
			error_log('PrimitiveNotes: Subfolders for $config[\'notes_basepath\'] ($config[\'notes_folder\']) (media) failed. Please check your directory permissions.');
			die();
		}
	}
	$fname = time().image_type_to_extension(exif_imagetype($_FILES['localFile']['tmp_name']));
	if(!move_uploaded_file($_FILES['localFile']['tmp_name'], $notes_path.$media_folder.$fname)) {
		$message = "PrimitiveNotes: Can't write from local image to media subfolder.";
		error_log($message);
		die($message);
	}
	die($media_folder.$fname);
}

if(is_dir($notes_path) && !isset($_POST['action']) || $_POST['action'] == 'getTags') {
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
					if($rcmail->config->get('yaml_support', '') && stripos($file,".md")) {
						$contents = file_get_contents($notes_path.$file);
						$yhb_pos = strpos($contents, $yh_begin);
						$yhe_pos = strlen($contents) >= strlen($yh_begin) ? strpos($contents, $yh_end, strlen($yh_begin)) : 0;
						if($yhb_pos == 0 && $yhe_pos > 0) {
							$yaml_arr = preg_split("/\r\n|\n|\r/", substr($contents,0,$yhe_pos + strlen($yh_end)));
							foreach($yaml_arr as $line) {
								if(strpos($line,"tags:") === 0) {
									$tags[1] = substr($line,6);								
								}
							}
						}
					}

					if(is_array($tags) && count($tags) > 0) {
						$ttags = explode(" ", $tags[1]);
						$taglist = array_merge($taglist,$ttags);
					} else {
						$ttags = "";
					}

					$files[] = array(
						'name' => (strpos($name, "[")) ? explode("[", $name)[0] : explode(".", $name)[0],
						'filename' => $name,
						'size' => filesize($notes_path.$file),
						'type' => $ext,
						'time' => filemtime($notes_path.$file),
						'tags' => $ttags,
						'id' => $id
						);
					}	
				$id++;
				}
			}
		closedir($handle);
	}
	$taglist = array_unique($taglist);
}

if(is_array($files) && count($files) > 0  && !isset($_POST['action'])) {
	usort($files, function($a, $b) { return $b['time'] > $a['time']; });
}

if(isset($_POST['action'])) {
	$action = filter_var($_POST['action'], FILTER_SANITIZE_STRING);
	switch($action) {
		case 'showNote':
			$id =  filter_var($_POST['id'], FILTER_VALIDATE_INT, FILTER_SANITIZE_NUMBER_INT);
			$filename = filter_var($_POST['filename'], FILTER_SANITIZE_STRING);	
			$note = read_note($id, $filename, null, null);
			$delm = (stripos($filename, "[")) ? '[':'.';
			$note_name = substr($filename, 0, stripos($filename, $delm));
			if($delm == "[") {
				$taglist = str_replace(" ", ", ", substr(substr($filename, 0, stripos($filename, "]")), stripos($filename, "[") +1));
			} else {
				$note_name = substr($filename, 0, stripos($filename, "."));
				if($rcmail->config->get('yaml_support', '') && stripos($filename,".md")) {
					$contents = file_get_contents($notes_path.$filename);
					$yhb_pos = strpos($contents, $yh_begin);
					$yhe_pos = strlen($contents) >= strlen($yh_begin) ? strpos($contents, $yh_end, strlen($yh_begin)) : 0;
					if($yhb_pos == 0 && $yhe_pos > 0) {
						$yaml_arr = preg_split("/\r\n|\n|\r/", substr($contents,0,$yhe_pos + strlen($yh_end)));
						foreach($yaml_arr as $line) {
							if(strpos($line,"tags:") === 0) $taglist = str_replace(" ", ", ", substr($line,6));
						}
					}
				} else {
					$taglist = "";
				}
			}

			$noteArr = [
				'notename'	=> $note_name,
				'filename'	=> $filename,
				'id'		=> $note['id'],
				'format'	=> $note['format'],
				'mime_type'	=> $note['mime_type'],
				'tags'		=> $taglist,
				'content'	=> $note['content'],
			];
			die(json_encode($noteArr));
			break;
		case 'getTags':
			$tlist = [];
			asort($taglist, SORT_LOCALE_STRING | SORT_FLAG_CASE );
			foreach($taglist as $key => $value) {
				if($value) $tlist[] = $value;
			}
			die(json_encode($tlist));
			break;
		case 'editNote':
			$note_name = ($_POST['note_name'] != "") ? filter_var($_POST['note_name'], FILTER_SANITIZE_STRING) : "new_unknown_note";
			$tagp = json_decode($_POST['ntags'],true);
			$note_tags = [];
			foreach($tagp as $value) {
				$note_tags[] = $value['value'];
			}
			asort($note_tags, SORT_LOCALE_STRING | SORT_FLAG_CASE );
			$note_content = $_POST['editor1'];
			$old_name = filter_var($_POST['fname'], FILTER_SANITIZE_STRING);
			if(!$note_type = $_POST['ftype']) $note_type = ($default_format != '') ? $default_format : 'txt';
			$note_tags = array_unique($note_tags);
			$tags_arr = array_map('trim', $note_tags);		
			$tags_str = implode(' ',$tags_arr);
			if($rcmail->config->get('yaml_support', '') && $note_type == "md") {
				$tags_str = "tags: ".$tags_str;
				$yhb_pos = strpos($note_content, $yh_begin);
				$yhe_pos = strlen($note_content) >= strlen($yh_begin) ? strpos($note_content, $yh_end, strlen($yh_begin)) : 0;
				$yaml_new = array();
				$tagset = false;
				if($yhb_pos == 0 && $yhe_pos > 0) {
					$yaml_arr = preg_split("/\r\n|\n|\r/", substr($note_content,0,$yhe_pos + strlen(yh_begin)));
					foreach($yaml_arr as $line) {
						if(stripos($line,"tags: ") === 0) {
							$yaml_new[] = $tags_str;
							$tagset = true;
						} elseif(stripos($line,"title: ") === 0) {
							$yaml_new[] = "title: ".$note_name;
						} else {
							$yaml_new[] = $line;
						}
					}
					if(!$tagset && strlen($tags_str) > 6) array_splice($yaml_new, 1, 0, $tags_str);
					$note_content = implode("\r\n", $yaml_new).substr($note_content,$yhe_pos + strlen(yh_end));
				} else {
					$yaml_new[] = $yh_begin;
					if(strlen($tags_str) > 6) $yaml_new[] = $tags_str;
					$yaml_new[] = "title: ".$note_name;
					$yaml_new[] = "date: ".strftime('%x %X');
					$yaml_new[] = "author: ".$rcmail->user->get_username();
					$yaml_new[] = $yh_end;
					$note_content = implode("\r\n", $yaml_new)."\r\n".$note_content;
				}
				$new_name = $note_name.".".$note_type;
			} else {
				$tags_str = ($tags_str != "") ? "[".$tags_str."]" : $tags_str;
				$new_name = $note_name.$tags_str.".".$note_type;
			}
			$notes_path = $rcmail->config->get('notes_basepath', false).$rcmail->user->get_username().$rcmail->config->get('notes_folder', false);
			if(file_exists($notes_path.$old_name)) {
				if($old_name != $new_name) rename($notes_path.$old_name, $notes_path.$new_name);
			} elseif ($old_name != "") {
				error_log('PrimitiveNotes: Note not found, can\`t save note.');
			}

			$save_allowed = array("txt", "md");	
			if(in_array($note_type,$save_allowed)) {
				$note_file = fopen ($notes_path.$new_name, "w");
				$content = fwrite($note_file, $note_content);
				fclose ($note_file);
			}
			break;
		case 'delNote':
			$file = $notes_path.$_POST["fileid"];
			if(file_exists($file)) {
				if(substr ($file, -3) == ".md" && boolval($rcmail->config->get('rm_md_media', false))) {
					$fcontent = file_get_contents($file);
					preg_match_all('/(?:!\[(.*?)\]\((.*?)\))/m', $fcontent, $mediaFiles, PREG_SET_ORDER, 0);
					$mfiles = [];
					$mpath = $rcmail->config->get('media_folder', false);
					foreach($mediaFiles as $mKey => $mFile) {
						if(strpos($mFile[2], $mpath) !== false) $mfiles[] = basename($mFile[2]);
					}
				}
				
				if(!unlink($file)) {
					$message = 'Couldn\'t delete note. Please check your directory permissions.';
					$mArr = array('message' => $message, 'data' => '');
					error_log('PrimitiveNotes: '.$message);
					die(json_encode($mArr));
				} else {
					if($mfiles) {
						$message = 'Found '.count($mfiles).' local media files in the note. Do you want to delete them now?';
						error_log('PrimitiveNotes: '.$message.' Send remove request.');
						$mArr = array('message' => $message, 'data' => $mfiles);
						die(json_encode($mArr));
					}
				}
			}
			die();
			break;
		case 'delMedia':
			$files = json_decode($_POST['files']);
			$mpath = $notes_path = $rcmail->config->get('notes_basepath', false).$rcmail->user->get_username().$rcmail->config->get('notes_folder', false).$rcmail->config->get('media_folder', false);
			foreach($files as $key => $file) {
				$rfile = filter_var($file, FILTER_SANITIZE_STRING);
				$rfile = $mpath.$rfile;
				if(file_exists($rfile)) {
					if(!unlink($rfile)) error_log("PrimitiveNotes: Media file $rfile not removed");
				} else {
					error_log("PrimitiveNotes: Media file $rfile does not exist");
				}
			}
			die();
			break;
		case 'uplImage':
			$imageURL = $_POST['imageURL'];
			$filename = basename($imageURL);
			$fname = time().image_type_to_extension(exif_imagetype($imageURL));
			$img = $notes_path.$media_folder.$fname;
			if (!is_dir($notes_path.$media_folder)) {
				if(!mkdir($notes_path.$media_folder, 0774, true)) {
					error_log('PrimitiveNotes: Subfolders for $config[\'notes_basepath\'] ($config[\'notes_folder\']) (media) failed. Please check your directory permissions.');
					die();
				}
			}
			if(!file_put_contents($img, file_get_contents($imageURL))) {
				$message = "PrimitiveNotes: Can't write from URL image to media subfolder.";
				error_log($message);
				die($message);
			}
			die($media_folder.$fname);
			break;
		case 'sbfile':
			$fname = filter_var($_POST['fname'], FILTER_SANITIZE_STRING);
			$fArr = pathinfo($fname);
			$name = filter_var($_POST['name'], FILTER_SANITIZE_STRING);
			$tArr = $_POST['tags'];
			$ncontent = $_POST['content'];
			
			if($tArr) {
				asort($tArr, SORT_LOCALE_STRING | SORT_FLAG_CASE );
				$tstring = '[';
				foreach($tArr as $tag) {
					$tstring.= $tag.' ';
				}
				$tstring = trim($tstring).']';
			}
			$bname = $name.$tstring.'.'.$fArr['extension'];
			
			if($fname != $bname) {
				if(!rename($notes_path.$fname, $notes_path.$bname)) {
					$message = "PrimitiveNotes: Error saving file.";
					error_log($message);
					
				}
			}

			$mime = mime_content_type($notes_path.$bname);
			if(strpos($mime, 'text') === 0) {
				$ocontent = file_get_contents($notes_path.$bname);
				if($ocontent != $ncontent) {
					if(!file_put_contents($notes_path.$bname,$ncontent,true)) {
						$message = "PrimitiveNotes: Error saving file.";
						error_log($message);
						die($message);
					}
				}
			}
			die();
			break;
		default:
			error_log("PrimitiveNotes: Unknown action, exit process.");
			exit;
	}
}

function parseLink($match) {
	$target = basename($match[2]);
	if($match[0][0] == '!') {
		return "<img src='notes.php?blink=$target&t=i' title='".$match[1]."'>";
	}
	else {
		return "<a class='tlink' href='notes.php?blink=$target&t=l' title='".$match[1]."'>$match[1]</a>";
	}
}

function read_note($id, $filename, $mode, $format) {
	global $rcmail, $notes_path, $yh_begin, $yh_end;
	$file = $notes_path.$filename;
	if($filename != '') $format = substr($filename,strripos($filename, ".")+1);		

	if(file_exists($file)) {
		$fcontent = file_get_contents($file);
		$re = '/(?:[!]?\[(.*?)\]\((.*?)\))/m';
		if($mode != 'edit') {
			$scontent = preg_replace_callback($re, "parseLink", $fcontent);
			if($rcmail->config->get('yaml_support', '')) {
				$yhb_pos = strpos($scontent, $yh_begin);
				$yhe_pos = strlen($scontent) >= strlen($yh_begin) ? strpos($scontent, $yh_end, strlen($yh_begin)) : 0;
				if($yhb_pos == 0 && $yhe_pos > 0) $scontent = substr($scontent,$yhe_pos + strlen($yh_end));
			}
		} else
			$scontent = $fcontent;

		$mime_type = mime_content_type($file);

		$scontent = (substr($mime_type, 0, 4) == 'text') ? $scontent:base64_encode($scontent);

		$note = array(
			'name'		=> substr($filename, 0, stripos($filename, "[")),
			'content'	=> $scontent,
			'format'	=> $format,
			'id'		=> $id,
			'mime_type'	=> $mime_type,
			'filename'	=> $filename,
			'taglist'	=> substr($filename,stripos($filename, "["),stripos($filename, "]"))
			);
	} elseif($filename != "" ) {
		error_log('PrimitiveNotes: Error - Note not found. Please check your path configuration.');
	}
	return $note;
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
		<script type="text/javascript" src="../../program/js/jquery.min.js"></script>
		<script type="text/javascript" src="../../skins/larry/ui.min.js"></script>
		<script type="text/javascript" src="../../program/js/common.min.js"></script>
		<script type="text/javascript" src="../../program/js/app.min.js"></script>
		<link rel="stylesheet" href="../../skins/larry/styles.min.css" />

		<link rel="stylesheet" href="js/highlight/styles/vs.min.css">
		<script src="js/highlight/highlight.pack.js"></script>

		<link rel="stylesheet" href="font-awesome/css/font-awesome.min.css">
		<link rel="stylesheet" href="js/easymde/easymde.min.css">
		<script src="js/easymde/easymde.min.js"></script>

		<link rel="stylesheet" href="js/tagify/tagify.css" type="text/css" />
		<script src="js/tagify/tagify.min.js" type="text/javascript" charset="utf-8"></script>

		<link rel="stylesheet" href="skins/primitivenotes.min.css" />
		<script src="notes.js" type="text/javascript" charset="utf-8"></script>
	</head>
	<body style="margin: 0; padding: 0;">
		<div id="sidebar" class="uibox listbox">
			<div id="filelist_header">
				<span class="searchbox" style="background: url(./../../skins/larry/images/buttons.png) 0 -316px white no-repeat;"><input type="text" id="notesearch" name="notesearch" /></span>				
			</div>
			<div class="filelist" id="entrylist">
				<ul id="filelist">
				<?PHP
				if(is_array($files) && $files) {
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
							echo "<li id=\"$id\" class=\"$id $format\"><input value=\"$filename\" id=\"entry$id\" type=\"hidden\"/><a id=\"note_$id\" title=\"".$fentry['name']."\" >".$fentry['name']."<br /><span class=\"fsize\">$fsize</span><span>".date("d.m.y H:i",$fentry['time'])."</span>$tlist</a></li>";
						}
					}
				}
				?>
				</ul>
			</div>
		</div>
		<div id="main" class="main uibox contentbox">
		<form method="POST" id="metah">
		<div id="main_header" class="main_header">
			<span id="headerTitle" class="headerTitle"></span><br />
			<input id="fname" name="fname" type="hidden">
		</div>
			<input id="ntags" name="ntags">
		<div id="save_button" class="save_button">
			<a href="#"></a>
		</div>
		<div class="main_area" id="main_area">
			<input id="estate" type="hidden" value="e" /><input type="hidden" id="action" name="action">
			<textarea id="editor1" name="editor1"></textarea>
			<input type="file" id="localimg" name="localimg" style="display: none" />
		</div>
		</div>
		</form>
	</body>
</html>
