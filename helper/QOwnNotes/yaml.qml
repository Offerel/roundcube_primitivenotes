import QtQml 2.0
/**
 * This script hides YAML headers in the notes preview
 */
QtObject {
	function noteOpenedHook(note) {
		var qon_tags = note.tagNames();
		var note_text = note.noteText;
		var start_yaml = "---";
		var end_yaml = "...";
		
		var yaml_beginn = note_text.indexOf(start_yaml);
		var yaml_end = note_text.indexOf(end_yaml);
		
		
		if (yaml_beginn >= 0 && yaml_end > 0) { // yaml header found, modifying existing header if there are changes
			yaml_beginn = yaml_beginn + start_yaml.length;
			var yaml_length = yaml_end - yaml_beginn;
			var yaml_header = note_text.substr(yaml_beginn, yaml_length);
			var header_arr = yaml_header.split(/\r?\n/); // split the header by newline
			var yaml_changed = false;
			var header_new = ["---"];
			header_arr = header_arr.filter(function(entry) { return entry.trim() != ''; }); // remove empty yaml lines
			header_arr.forEach(function(element) {
				var part = element.substr(0,element.indexOf(":"));
				switch(part) {
					case "tags":
						var md_tags = element.substr(element.indexOf(":") +1).split(" ");
						md_tags = md_tags.filter(function(entry) { return entry.trim() != ''; });
						md_tags.sort();
						qon_tags.forEach(function(nTag) {
							if(md_tags.indexOf(nTag) < 0) {
								header_new.push("tags: " + qon_tags.join(" "));
								yaml_changed = true;
							}
						});
						
						if(yaml_changed == false)
							header_new.push("" + element);
						
						md_tags.forEach(function(mTag) {
							if(qon_tags.indexOf(mTag) < 0) {
								note.addTag(mTag);
							}
						});
						
						break;
					case "title":
						var md_title = element.substr(element.indexOf(":") +1).trim();
						if(note.name.indexOf("[") > 0)
							var nl = note.name.indexOf("[");
						else
							var nl = note.name.length;
						var name = note.name.substr(0,nl);

						if(md_title != name) {
							yaml_changed = true;
							header_new.push("title: " + name);
						}
						break;
					default:
						header_new.push("" + element);
				}
			});
			header_new.push("...");
			
			if(yaml_changed == true) {
				write_yaml(note, header_new, "replace");
			}
		}
		else { // currently no yaml header existing, creating the header
			var header_new = ["---"];
			header_new.push("tags: " + qon_tags.join(" "));
	
			if(note.name.indexOf("[") > 0)
				var nl = note.name.indexOf("[");
			else
				var nl = note.name.length;
			var name = note.name.substr(0,nl);
			
			header_new.push("title: " + name);
			header_new.push("date: " + note.fileCreated.toISOString().slice(0,10));
			header_new.push("...");

			write_yaml(note, header_new, "add");
		}
	}
	
	function write_yaml(note, yaml, mode) {
		var text = note.noteText;
		var yaml_str = yaml.join("\r\n");
		
		if (mode == "add") {
			script.noteTextEditSelectAll();
			text = yaml_str + "\r\n" + text;
			script.noteTextEditWrite(text);
		}
		else {
			var yaml_end = text.indexOf("...") + 3;
			text = yaml_str + "\r\n" + text.substr(yaml_end);
		}
	}
	
    function noteToMarkdownHtmlHook(note, html) {
		html = html.replace("<body><hr","<body><!-- <hr");
		html = html.replace("...</p>","... --> </p>");
		return html;
	}
}