<?PHP
/**
 * Roundcube Notes Plugin
 *
 * @version 1.2.2
 * @author Offerel
 * @copyright Copyright (c) 2018, Offerel
 * @license GNU General Public License, version 3
 */
class primitivenotes extends rcube_plugin
{
	public $task = '?(?!login|logout).*';
	
	public function init()
	{
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
			'classsel'	=> 'button-notes button-notes',
			'innerclass'=> 'button-inner',
			'type'		=> 'link'
		), 'taskbar');

		if ($rcmail->task == 'notes') {
			$this->register_action('index', array($this, 'action'));
		}

		$this->add_hook('message_compose', array($this, 'note_mail_compose'));
	}

	function note_mail_compose($args)
	{
		$rcmail = rcmail::get_instance();

		$filename = $args['param']['note_filename'];

		if(stripos($filename, "[")) {
			$name = substr($filename, 0, stripos($filename, "["));
		} else {
			$name = substr($filename, 0, stripos($filename, "."));
		}

		$type = substr($filename,stripos($filename, ".")+1);
		
		$subject = $this->gettext('note_subject').$name;
		$sublength = strlen($subject);
		if(strlen($subject) > 50 ) {
			$subject = substr($subject,0,47)."...";
		}

		$note_file = $rcmail->config->get('notes_basepath', false).$rcmail->user->get_username().$rcmail->config->get('notes_folder', false).$filename;

		if(file_exists($note_file)) {
			$handle = fopen ($note_file, "r");
			$note_content = fread($handle, filesize($note_file));
			fclose ($handle);
		} else {
			error_log("PrimitiveNotes: Note not found. Attach the note to the mail failed.");
		}

		switch ($type) {
			case 'html': $mimetype = mime_content_type($note_file); break;
			case 'pdf': $mimetype = mime_content_type($note_file); break;
			case 'jpg': $mimetype = mime_content_type($note_file); break;
			case 'png': $mimetype = mime_content_type($note_file); break;
			case 'md': $mimetype = mime_content_type($note_file); break;
			case 'txt': $mimetype = mime_content_type($note_file); break;
			default: error_log("PrimitiveNotes: Unsupported file format. Attach the note to the mail failed."); return false;
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
	
	function action()
	{
		$rcmail = rcmail::get_instance();	
		
		 $rcmail->output->add_handlers(array(
            'notescontent' => array($this, 'content'),
            'tablink' => array($this, 'tablink'),
        ));
        
        $rcmail->output->set_env('npath', $rcmail->config->get('notes_basepath', false).$rcmail->user->get_username().$rcmail->config->get('notes_folder', false));
		
		$rcmail->output->add_handlers(array('notescontent' => array($this, 'content'),));
		$rcmail->output->set_pagetitle($this->gettext('notes'));
		$rcmail->output->send('primitivenotes.template');
	}

	function content($attrib)
	{
		$rcmail = rcmail::get_instance();
		$this->include_script('primitivenotes.js');

		$attrib['src'] = 'plugins/primitivenotes/notes.php';

		if (empty($attrib['id']))
			$attrib['id'] = 'rcmailnotescontent';
		$attrib['name'] = $attrib['id'];

		return $rcmail->output->frame($attrib);
	}
}

if ($_FILES) {
		$test_name = $_FILES['files']['name'];
		$ext_pos = strripos($test_name,".");
		
		$fname = substr($test_name,0,$ext_pos);
		$ext = substr(strrchr($test_name, "."), 1);
		
		if(strlen($fname) > 225)
			$fname = substr($fname, 0, 225 );

		if(file_exists($_POST['path'].$fname.".".$ext))
			$fname = $fname."-".time();
		
		move_uploaded_file($_FILES['files']['tmp_name'], $_POST['path'].$fname.".".$ext);
}
?>