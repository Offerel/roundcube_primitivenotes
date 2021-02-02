<?PHP
/**
 * Roundcube Notes Plugin
 *
 * @version 2.0.0
 * @author Offerel
 * @copyright Copyright (c) 2021, Offerel
 * @license GNU General Public License, version 3
 */
class primitivenotes extends rcube_plugin
{
	public $task = '?(?!login|logout).*';
	
	public function init() {
		$rcmail = rcmail::get_instance();
		$this->load_config();
		$this->add_texts('localization/', true);
		$this->include_stylesheet($this->local_skin_path() . '/plugin.css');
		$this->register_task('notes');
		
		$this->add_button(array(
			'label'	=> 'primitivenotes.notes',
			'command'	=> 'notes',
			'id'		=> '201ec534-0cce-4b38-8016-4bcbb405e4b0',
			'class'		=> 'button-notes',
			'classsel'	=> 'button-notes button-selected',
			'innerclass'=> 'button-inner',
			'type'		=> 'link'
		), 'taskbar');

		if ($rcmail->task == 'notes') {
			$this->register_action('index', array($this, 'action'));
			$rcmail->output->set_env('refresh_interval', 0);
		}

		if ($rcmail->task == 'settings') {
			$this->add_hook('preferences_sections_list', array($this, 'pmn_preferences_sections_list'));
			$this->add_hook('preferences_list', array($this, 'pmn_preferences_list'));
			$this->add_hook('preferences_save', array($this, 'pmn_preferences_save'));
		}

		$this->add_hook('message_compose', array($this, 'note_mail_compose'));
	}

	function pmn_preferences_sections_list($p) {
		$p['list']['primitivenotes'] = array('id' => 'primitivenotes', 'section' => $this->gettext('notes'));
		return $p;
	}

	function pmn_preferences_list($p) {
		if ($p['section'] != 'primitivenotes') {
			return $p;
		}
		
		$rcmail = rcmail::get_instance();
		$p['blocks']['main']['name'] = $this->gettext('mainoptions');
		$field_id='default_format';
		$select   = new html_select(array('name' => 'default_format', 'id' => $field_id));
		foreach (array('md', 'txt') as $m) {$select->add($this->gettext('note_format'.$m), $m);}
		$p['blocks']['main']['options']['default_format'] = array(
														'title'=> html::label($field_id, $this->gettext('note_defaultformat')),
														'content'=> $select->show($rcmail->config->get('default_format')));

		$field_id='list_formats';
		$selectf   = new html_select(array('multiple' => true, 'name' => 'list_formats[]', 'id' => $field_id));
		foreach (array('md', 'html', 'txt', 'pdf', 'jpg', 'png') as $mf) {$selectf->add($this->gettext('note_format'.$mf), $mf);}
		$p['blocks']['main']['options']['list_formats'] = array(
														'title'=> html::label($field_id, $this->gettext('note_listformat')),
														'content'=> $selectf->show($rcmail->config->get('list_formats')));

		$field_id='yaml_support';
		$input = new html_checkbox(array(	'name'	=> 'yaml_support',
											'id'	=> 'yaml_support',
											'value' => 1));
		$p['blocks']['main']['options']['pn_yaml'] = array(	'title'=> html::label($field_id, $this->gettext('note_yamls')),
															'content'=> $input->show(intval($rcmail->config->get('yaml_support'))));

		$field_id='rm_md_media';
		$input = new html_checkbox(array(	'name'	=> 'rm_md_media',
											'id'	=> 'rm_md_media',
											'value' => 1));

		$p['blocks']['main']['options']['pn_rmed'] = array(	'title'=> html::label($field_id, $this->gettext('note_rmedia_md')),
															'content'=> $input->show(intval($rcmail->config->get('rm_md_media'))));
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
		$rcmail = rcmail::get_instance();
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
		$note_file = $rcmail->config->get('notes_basepath', false).$rcmail->user->get_username().$rcmail->config->get('notes_folder', false).$filename;
		if(file_exists($note_file)) {
			$handle = fopen ($note_file, "r");
			$note_content = fread($handle, filesize($note_file));
			fclose ($handle);
		} else {
			error_log("PrimitiveNotes: Note not found. Attach the note to the mail failed.");
		}
		if($type != "") {
			switch ($type) {
				case 'html': $mimetype = mime_content_type($note_file); break;
				case 'pdf': $mimetype = mime_content_type($note_file); break;
				case 'jpg': $mimetype = mime_content_type($note_file); break;
				case 'png': $mimetype = mime_content_type($note_file); break;
				case 'md': $mimetype = mime_content_type($note_file); break;
				case 'txt': $mimetype = mime_content_type($note_file); break;
				default: error_log("PrimitiveNotes: Unsupported file format ($type). Attach the note to the mail failed."); return false;
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
		$rcmail = rcmail::get_instance();	
		$rcmail->output->add_handlers(array(
        	'notescontent' => array($this, 'content'),
        	'tablink' => array($this, 'tablink'),
        ));

		$rcmail->output->set_env('npath', $rcmail->config->get('notes_basepath', false).$rcmail->user->get_username().$rcmail->config->get('notes_folder', false));
		$rcmail->output->set_env('dformat', $rcmail->config->get('default_format', false));
		$rcmail->output->add_handlers(array('notescontent' => array($this, 'content'),));
		$rcmail->output->set_pagetitle($this->gettext('notes'));
		$rcmail->output->send('primitivenotes.template');
	}

	function content($attrib) {
		$rcmail = rcmail::get_instance();
		$this->include_script('js/primitivenotes.js');
		$attrib['src'] = 'plugins/primitivenotes/notes.php';
		if (empty($attrib['id'])) $attrib['id'] = 'rcmailnotescontent';
		$attrib['name'] = $attrib['id'];
		return $rcmail->output->frame($attrib);
	}
}

if ($_FILES) {
		$test_name = $_FILES['files']['name'];
		$ext_pos = strripos($test_name,".");
		$fname = substr($test_name,0,$ext_pos);
		$ext = substr(strrchr($test_name, "."), 1);
		if(strlen($fname) > 225) $fname = substr($fname, 0, 225 );
		if(file_exists($_POST['path'].$fname.".".$ext)) $fname = $fname."-".time();
		move_uploaded_file($_FILES['files']['tmp_name'], $_POST['path'].$fname.".".$ext);
}
?>
