<?PHP
/**
 * Roundcube Notes Plugin
 *
 * @version 2.1.3
 * @author Offerel
 * @copyright Copyright (c) 2022, Offerel
 * @license GNU General Public License, version 3
 */
class primitivenotes extends rcube_plugin{
	public $task = '?(?!login|logout).*';

	private $rc;
	private $notes_path;
	private $media_path;
	private $formatter;
	
	function init() {
		$this->rc = rcube::get_instance();
		$this->load_config();
		$this->add_texts('localization/', true);
		$this->register_task('notes');
		if($this->rc->config->get('skin') != 'elastic') $this->include_stylesheet($this->local_skin_path().'/plugin.css');
		$this->add_button(array(
			'label'	=> 'primitivenotes.notes',
			'command'	=> 'notes',
			'id'		=> '201ec534-0cce-4b38-8016-4bcbb405e4b0',
			'class'		=> 'button-notes',
			'classsel'	=> 'button-notes button-selected',
			'innerclass'=> 'button-inner',
			'type'		=> 'link'
		), 'taskbar');

		if ($this->rc->task == 'notes') {
			$this->include_stylesheet('js/highlight/styles/monokai.css');
			$this->include_stylesheet('js/easymde/easymde.min.css');
			$this->include_stylesheet('js/easymde/fontawesome/css/all.css');
			$this->include_stylesheet('js/tagify/tagify.css');
			if($this->rc->config->get('skin') == 'elastic') $this->include_stylesheet($this->local_skin_path().'/plugin.css');
			$this->include_stylesheet('skins/primitivenotes.css');
		
			$this->include_script('js/primitivenotes.js');
			$this->include_script('js/highlight/highlight.min.js');
			$this->include_script('js/easymde/easymde.min.js');
			$this->include_script('js/tagify/tagify.js');
			$this->include_script('js/turndown/turndown.min.js');
			
			$this->register_action('index', array($this, 'action'));
			$this->register_action('displayNote', array($this, 'showNote'));
			$this->register_action('saveNote', array($this, 'editNote'));
			$this->register_action('getNote', array($this, 'getNote'));
			$this->register_action('delNote', array($this, 'deleteNote'));
			$this->register_action('delMedia', array($this, 'deleteMedia'));
			$this->register_action('uplMedia', array($this, 'uploadMedia'));
			$this->register_action('uplNote', array($this, 'uploadNote'));
			$this->register_action('blink', array($this, 'getMedia'));
			$this->rc->output->set_env('refresh_interval', 0);
		}

		if ($this->rc->task == 'settings') {
			$this->add_hook('preferences_sections_list', array($this, 'pmn_preferences_sections_list'));
			$this->add_hook('preferences_list', array($this, 'pmn_preferences_list'));
			$this->add_hook('preferences_save', array($this, 'pmn_preferences_save'));
		}

		$this->add_hook('message_compose', array($this, 'note_mail_compose'));
		$this->register_handler('plugin.notes_list', array($this, 'notes_list'));

		$notes_path = $this->rc->config->get('notes_path', false);
		$notes_path = (strpos($notes_path, '%u') === false) ? $notes_path:str_replace('%u', $this->rc->user->get_username(), $notes_path);
		$this->notes_path = ($notes_path[-1] != '/') ? $notes_path.'/':$notes_path;

		$media_path = $this->notes_path.$this->rc->config->get('media_folder', false);
		$this->media_path = ($media_path[-1] != '/') ? $media_path.'/':$media_path;

		$this->formatter = new IntlDateFormatter($this->rc->get_user_language(), IntlDateFormatter::SHORT, IntlDateFormatter::SHORT);
	}
	
	function getMedia() {
		$mfile = rcube_utils::get_input_value('_file', rcube_utils::INPUT_GET, false);
		$media_path = $this->media_path.$mfile;

		if(file_exists($media_path)) {
			$file = file_get_contents($media_path);
			$hash = sha1($media_path);
			$mime_type = mime_content_type($media_path);
			header("Content-Disposition: inline;filename=\"$mfile\"");
			header("Content-type: $mime_type");
			header("ETag: $hash");
			header("Last-Modified: ".gmdate('D, d M Y H:i:s T', filemtime($media_path)));
			header('Content-Length: '.filesize($media_path));
			die($file);
		}
	}
	
	function uploadMedia() {
		$oname = $_FILES['dropFile']['name'];
		$path_parts = pathinfo($oname);
		$filename = time().'.'.$path_parts['extension'];
		$newname = str_replace($this->notes_path, '', $this->media_path).$filename;
		
		if(move_uploaded_file($_FILES['dropFile']['tmp_name'], $this->media_path.$filename)) {
			$mimetype = mime_content_type($this->media_path.$filename);
			$istr = (strpos($mimetype, 'image') === 0) ? "![$oname]($newname)":"[$oname]($newname)";
			echo($istr);
		} else {
			echo('Media Upload failure. Check server...');
		}
		die();
	}
	
	function uploadNote() {
		$oname = $_FILES['dropFile']['name'];
		$path_parts = pathinfo($oname);
		$filename = (strlen($path_parts['filename']) > 225) ? substr($path_parts['filename'], 0, 225):$path_parts['filename'];
		$note_path = $this->notes_path.$filename.'.'.$path_parts['extension'];
		move_uploaded_file($_FILES['dropFile']['tmp_name'], $note_path);
		echo $this->notes_list();
	}

	function notes_list() {
		$notes_path = $this->notes_path;
		$taglist = array();
		$yh_be = '---';

		if(is_dir($notes_path) && !isset($_POST['action']) || $_POST['action'] == 'getTags') {
			$taglist = array();
			if ($handle = opendir($notes_path)) {
				while (($file = readdir($handle)) !== false) {
					if (is_file($notes_path.$file)) {
						$name = pathinfo($notes_path.$file,PATHINFO_BASENAME);
						$ext = pathinfo($notes_path.$file,PATHINFO_EXTENSION);
						$supported_ext = $this->rc->config->get('list_formats', false);
						if(in_array($ext,$supported_ext)) {				
							$tags = null;
							$rv = preg_match('"\\[(.*?)\\]"', $name, $tags);
							if($this->rc->config->get('yaml_support', '') && stripos($file,".md")) {
								$contents = file_get_contents($notes_path.$file);
								$yhb_pos = strpos($contents, $yh_be);
								$yhe_pos = strlen($contents) >= strlen($yh_be) ? strpos($contents, $yh_be, strlen($yh_be)) : 0;
								if($yhb_pos == 0 && $yhe_pos > 0) {
									$yaml_arr = preg_split("/\r\n|\n|\r/", substr($contents,0,$yhe_pos + strlen($yh_be)));
									foreach($yaml_arr as $line) {
										if(strpos($line,"tags:") === 0) {
											$tags[1] = substr($line,6);								
										}
									}
								}
							}
							
							if(is_array($tags) && count($tags) > 0) {
								$delm = (strpos($tags[1], ', ') === false) ? ' ':', ';
								$ttags = explode($delm, $tags[1]);
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

		if(is_array($files) && $files) {
			foreach ($files as $fentry) {
				if(strlen($fentry['name']) > 0 ) {
					$fsize = $this->human_filesize($fentry['size'], 2);
					if(is_array($fentry['tags'])) {
						$tlist = implode(", ",$fentry['tags']);
					} else
						$tlist = "";
					
					$id = ($fentry['id'] != "") ? $fentry['id'] : 0;						
					$filename = $fentry['filename'];
					$format = $fentry['type'];
					
					$pnlist.="<li id='$id' class='$format' data-format='$format' data-tags='$tlist' data-name='$filename'>
								<a id='note_$id' title='".$fentry['name']."' >
									<div class='subject'>".$fentry['name']."</div>
									<div class='size'>$fsize</div>
									<div class='date'>".$this->formatter->format($fentry['time'])."</div>
								</a>
							</li>";
				}
			}
			asort($taglist, SORT_LOCALE_STRING | SORT_FLAG_CASE );
			$this->rc->output->set_env('taglist', json_encode(array_values($taglist)));
			return html::div(array('id' => 'pnlist', 'class' => 'listing nlist treelist'), $pnlist);
		}
    }

	function getNote() {
		$name = rcube_utils::get_input_value('_name', rcube_utils::INPUT_GPC, false);
		$media_path = $this->notes_path.$name;
		$file = @file_get_contents($media_path);
		$hash = sha1($media_path);
		header('Content-Description: File Transfer');
		$name = utf8_decode(htmlspecialchars_decode($name));
		header("Content-Disposition: attachment; filename=\"$name\"");
		header('Content-Transfer-Encoding: binary');
		header('Content-Type: application/octet-stream');
		header("ETag: $hash");
		header("Last-Modified: ".gmdate('D, d M Y H:i:s T', filemtime($media_path)));
		header('Content-Length: '.filesize($media_path));
		die($file);
	}

	function deleteNote() {
		$file = rcube_utils::get_input_value('_file', rcube_utils::INPUT_POST, false);
		$name = rcube_utils::get_input_value('_name', rcube_utils::INPUT_POST, false);
		$notes_path = $this->notes_path.$file;
		
		if(file_exists($notes_path)) {
			if(substr ($file, -3) == ".md" && boolval($this->rc->config->get('rm_md_media', false))) {
				$fcontent = file_get_contents($notes_path);
				preg_match_all('/(?:!\[(.*?)\]\((.*?)\))/m', $fcontent, $mediaFiles, PREG_SET_ORDER, 0);
				$mfiles = [];
				$mpath = $this->rc->config->get('media_folder', false);
				foreach($mediaFiles as $mKey => $mFile) {
					if(strpos($mFile[2], $mpath) !== false) $mfiles[] = basename($mFile[2]);
				}
			}
			
			if(!unlink($notes_path)) {
				$this->rc->output->show_message("Could not delete '$name'. Please check path and permissions.","error");
			} else {
				if($mfiles) {
					$org = array("%count%", "%note%");
					$rpl = array(count($mfiles), "'$name'");
					$message = str_replace($org, $rpl, $this->gettext('note_media_del'));
					$mArr = [
					    "message" => $message,
					    "files" => $mfiles,
					];
					
					$this->rc->output->command('plugin.savedNote', array('message' => 'done', 'list' => $this->notes_list(), 'mfiles' => $mArr));
				} else {
					$this->rc->output->command('plugin.savedNote', array('message' => 'done', 'list' => $this->notes_list()));
				}
			}
		} else {
			$this->rc->output->show_message("'$name' not found. Please check your path settings","error");
		}
	}

	function pmn_preferences_sections_list($p) {
		$p['list']['primitivenotes'] = array('id' => 'primitivenotes', 'section' => $this->gettext('notes'));
		return $p;
	}

	function pmn_preferences_list($p) {
		if ($p['section'] != 'primitivenotes') {
			return $p;
		}
		
		$p['blocks']['main']['name'] = $this->gettext('mainoptions');
		$field_id='default_format';
		$select   = new html_select(array('name' => 'default_format', 'id' => $field_id));
		foreach (array('md', 'txt') as $m) {$select->add($this->gettext('note_format'.$m), $m);}
		$p['blocks']['main']['options']['default_format'] = array(
														'title'=> html::label($field_id, $this->gettext('note_defaultformat')),
														'content'=> $select->show($this->rc->config->get('default_format')));

		$field_id='list_formats';
		$selectf   = new html_select(array('multiple' => true, 'name' => 'list_formats[]', 'id' => $field_id));
		foreach (array('md', 'html', 'txt', 'pdf', 'jpg', 'png') as $mf) {$selectf->add($this->gettext('note_format'.$mf), $mf);}
		$p['blocks']['main']['options']['list_formats'] = array(
														'title'=> html::label($field_id, $this->gettext('note_listformat')),
														'content'=> $selectf->show($this->rc->config->get('list_formats')));

		$field_id='yaml_support';
		$input = new html_checkbox(array(	'name'	=> 'yaml_support',
											'id'	=> 'yaml_support',
											'value' => 1));
		$p['blocks']['main']['options']['pn_yaml'] = array(	'title'=> html::label($field_id, $this->gettext('note_yamls')),
															'content'=> $input->show(intval($this->rc->config->get('yaml_support'))));

		$field_id='rm_md_media';
		$input = new html_checkbox(array(	'name'	=> 'rm_md_media',
											'id'	=> 'rm_md_media',
											'value' => 1));

		$p['blocks']['main']['options']['pn_rmed'] = array(	'title'=> html::label($field_id, $this->gettext('note_rmedia_md')),
															'content'=> $input->show(intval($this->rc->config->get('rm_md_media'))));
		return $p;
	}
	
	function pmn_preferences_save($p) {
		if ($p['section'] == 'primitivenotes') {
			$p['prefs'] = array(
				'default_format'	=> strval(rcube_utils::get_input_value('default_format', rcube_utils::INPUT_POST)),
				'list_formats'		=> rcube_utils::get_input_value('list_formats', rcube_utils::INPUT_POST),
				'yaml_support'		=> intval(rcube_utils::get_input_value('yaml_support', rcube_utils::INPUT_POST)),
				'rm_md_media'		=> intval(rcube_utils::get_input_value('rm_md_media', rcube_utils::INPUT_POST))
				);
		}
        return $p;
	}

	function note_mail_compose($args) {
		$filename = $args['param']['note_filename'];

		if(stripos($filename, "[")) {
			$name = substr($filename, 0, stripos($filename, "["));
		} else {
			$name = substr($filename, 0, stripos($filename, "."));
		}

		$type = substr($filename,stripos($filename, ".")+1);
		if(strlen($name) > 0) {
			$subject = $this->gettext('note_subject').$name;
			$sublength = strlen($subject);
			if(strlen($subject) > 50 ) {
				$subject = substr($subject,0,47)."...";
			}
		}
		$note_file = $this->notes_path.$filename;

		if(file_exists($note_file)) {
			$handle = fopen ($note_file, "r");
			$note_content = fread($handle, filesize($note_file));
			fclose ($handle);
		} else {
			$this->rc->output->show_message("Note not found. Attach the note to the mail failed.","error");
		}
		if($type != "") {
			switch ($type) {
				case 'html': $mimetype = mime_content_type($note_file); break;
				case 'pdf': $mimetype = mime_content_type($note_file); break;
				case 'jpg': $mimetype = mime_content_type($note_file); break;
				case 'png': $mimetype = mime_content_type($note_file); break;
				case 'md': $mimetype = mime_content_type($note_file); break;
				case 'txt': $mimetype = mime_content_type($note_file); break;
				default: $this->rc->output->show_message("Unsupported file format ($type). Attach the note to the mail failed.","error"); return false;
			}
		}
		
		$args['attachments'][] = array(
			'name'     => $name.".".$type,
			'mimetype' => $mimetype,
			'data'     => $note_content,
			'size'     => filesize($note_file),
		);

		$args['param']['subject'] = $subject;
		return $args;
	}

	function action() {
		$notes_path = $this->notes_path;
		$media_path = $this->media_path;

		if(!is_dir($notes_path)) {
			mkdir($notes_path);
			mkdir($media_path);
		}
		if(!is_dir($media_path)) mkdir($media_path);    

		$this->rc->output->set_env('dformat', $this->rc->config->get('default_format', false));
		$this->rc->output->set_env('aformat', $this->rc->config->get('list_formats', false));
		$this->rc->output->set_env('mfolder', $this->rc->config->get('media_folder', false));
		$this->rc->output->set_env('nnote', $this->gettext('notes'));
		$this->rc->output->set_pagetitle($this->gettext('notes'));
		$this->rc->output->send('primitivenotes.template');
	}

	function showNote($note='') {
		$nname = rcube_utils::get_input_value('_name', rcube_utils::INPUT_POST, false);
		$mode = rcube_utils::get_input_value('_mode', rcube_utils::INPUT_POST, false);
		$id = rcube_utils::get_input_value('_id', rcube_utils::INPUT_POST, false);
		$note = $this->notes_path.$nname;

		if(file_exists($note)) {
			$fcontent = file_get_contents($note);

			if($this->rc->config->get('yaml_support', true)) {
				$ydel = '---';
				$yhb_pos = strpos($fcontent, $ydel);
				$yhe_pos = strlen($fcontent) >= strlen($ydel) ? strpos($fcontent, $ydel, strlen($ydel)):0;
				if($yhb_pos == 0 && $yhe_pos > 0) {
					$yaml = substr($fcontent, 0, $yhe_pos);
					$fcontent = substr($fcontent,$yhe_pos + strlen($ydel));
				}
			}

			foreach(preg_split("/((\r?\n)|(\r\n?))/", $yaml) as $line){
				if(strpos($line, 'tags:') === 0) {
					$res = explode(': ', $line);
					$delm = (strpos($res[1], ', ') === false) ? ' ':', ';
					$ytags = explode($delm, $res[1]);
				}

				if(strpos($line, 'author:') === 0) {
					$author = explode(': ', $line)[1];
				}

				if(strpos($line, 'date:') === 0) {
					$date = $this->formatter->format(strtotime(explode(': ', $line)[1]));
					$tstamp = strtotime(explode(': ', $line)[1]);
				}

				if(strpos($line, 'updated:') === 0) {
					$updated = $this->formatter->format(strtotime(explode(': ', $line)[1]));
				}

				if(strpos($line, 'source:') === 0) {
					$source = explode(': ', $line)[1];
				}
			}

			$path_parts = pathinfo($note);
			$mime_type = mime_content_type($note);
			$fcontent = (substr($mime_type, 0, 4) === 'text') ? $fcontent:base64_encode($fcontent);

			$tagString = substr($filename, stripos($filename, "["), stripos($filename, "]"));
			$tagA = explode(' ', $tagString);

			if(is_array($ytags)) {
				$TagsArray = array_unique(array_merge($tagA, $ytags));
				$TagsArray = array_filter($TagsArray);
				sort($TagsArray, SORT_STRING);
			}

			$noteArr = array(
				'name'		=> substr($nname,0, (stripos($nname,'[')) ? stripos($nname,'['):stripos($nname,'.')),
				'content'	=> (stripos($mime_type, 'text') === 0) ? trim($fcontent):"data:$mime_type;base64,".$fcontent,
				'format'	=> $path_parts['extension'],
				'author'	=> $author,
				'date'		=> $date,
				'tstamp'	=> $tstamp,
				'updated'	=> $updated,
				'source'	=> $source,
				'id'		=> $id,
				'mime_type'	=> $mime_type,
				'filename'	=> $nname,
				'tags'		=> $TagsArray
			);

			$this->rc->output->command('plugin.loadNote', array('message' => 'done.','note' => $noteArr, 'mode' => $mode));
			$this->rc->output->set_pagetitle($this->gettext('notes').' - '.$noteArr['name']);
		} elseif($filename != "" ) {
			$this->rc->output->show_message("Check notes folder (\$config['notes_path']) failed. Please check directory permissions.","error");
		}
	}

	function editNote() {
		$oname = rcube_utils::get_input_value('_oname', rcube_utils::INPUT_POST, false);
		$nname = rcube_utils::get_input_value('_title', rcube_utils::INPUT_POST, false);
		$content = rcube_utils::get_input_value('_content', rcube_utils::INPUT_POST, true);
		$tags = implode(', ', rcube_utils::get_input_value('_tags', rcube_utils::INPUT_POST, false));
		$author = rcube_utils::get_input_value('_author', rcube_utils::INPUT_POST, false);
		$created = rcube_utils::get_input_value('_date', rcube_utils::INPUT_POST, false);
		$updated = rcube_utils::get_input_value('_updated', rcube_utils::INPUT_POST, false);
		$source = rcube_utils::get_input_value('_source', rcube_utils::INPUT_POST, false);

		$ofile = $this->notes_path.$oname;
		$path_parts = pathinfo($ofile);
		$type = explode('.', $path_parts['basename'])[1];

		$type = (strlen($type) > 0) ? $type:$this->rc->config->get('default_format', false);
		$nfile = $this->notes_path.$nname.'.'.$type;

		if($this->rc->config->get('yaml_support', true)) {
			$yaml = "---\n";
			$yaml.= "title: ".$nname."\n";
			if(strlen($tags) > 0) $yaml.= "tags: ".$tags."\n";
			$yaml.= (strlen($created) > 0) ? "date: ".date(DATE_ISO8601, trim($created))."\n":"date: ".date(DATE_ISO8601, time())."\n";
			$yaml.= "updated: ".date(DATE_ISO8601, time())."\n";
			$yaml.= (strlen($author) > 0) ? "author: ".$author."\n":"author: ".$this->rc->user->get_username()."\n";
			if(strlen($source) > 0) $yaml.= "source: ".$source."\n";
			$yaml.= "---\n\n";
		}

		$save_allowed = array("txt", "md");
		
		if(in_array($type, $save_allowed)) {
			if((strlen($oname) > 0) && ($nfile != $ofile)) {
				if(!rename($ofile, $nfile)) {
					$this->rc->output->show_message("Could not move/rename note in (\$config['notes_path']) failed. Please check directory permissions.","error");
				}
			}
			
			if(!file_put_contents($nfile, $yaml.$content, true)) {
				$this->rc->output->show_message("Could not save note to folder (\$config['notes_path']) failed. Please check directory permissions.","error");
			} else {
				$this->rc->output->command('plugin.savedNote', array('message' => 'saved', 'list' => $this->notes_list()));
			}
		}
	}
	
	function deleteMedia() {
		$mfiles = explode(',', rcube_utils::get_input_value('_media', rcube_utils::INPUT_POST, false));
		foreach($mfiles as $key => $file) {
			$rfile = filter_var($file, FILTER_SANITIZE_STRING);
			$rfile = $this->media_path.$rfile;
			if(file_exists($rfile)) {
				if(!unlink($rfile)) $this->rc->output->show_message("'$file' not removed. Please check path/permissions","error");
			} else {
				$this->rc->output->show_message("'$file' does not exist","error");
			}
		}
	}

	function human_filesize($bytes, $decimals = 2) {
		$sz = 'BKMGTP';
		$factor = round((strlen($bytes) - 1) / 3);
		return sprintf("%.{$decimals}f", $bytes / pow(1024, $factor)) . @$sz[$factor];
	}
}
?>