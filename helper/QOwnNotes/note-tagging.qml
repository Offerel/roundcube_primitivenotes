import QtQml 2.0
import QOwnNotesTypes 1.0

QtObject {
    function init() {
        script.registerCustomAction("getTagsFromName", "Get tags from note filename", "Get tags");
		script.registerCustomAction("setTagsToName", "Rename a note with tags", "Set tags");
	}
	
	function customActionInvoked(identifier) {
		var note = script.currentNote();
		var fileName = note.fullNoteFilePath;
		
		switch (identifier) {
			case "getTagsFromName":
				if(fileName.indexOf("[") !== -1) {
					var ftags = fileName.split("[")[1].split("]")[0].split(" ");
					ftags.forEach(function(entry) {
						script.tagCurrentNote(entry);
					});
				} else {
					script.log("No tags in filename of current note found!");
				}
				break;
			case "setTagsToName":
				var tagNameList = note.tagNames();
				if(tagNameList.length > 0) {
					var tagStr = "[" + tagNameList.join(" ") + "]";
					var noteName = note.name.split("[")[0];
					var newName = noteName + tagStr + ".md";
					var path = fileName.substring(0, fileName.lastIndexOf("/") + 1);
					
					var res = script.questionMessageBox("If you click on \"OK\", the currently selected note is renamed according to his tags. As a sideffect, all tags associated with this note, are removed.\n\nYou can run \"Get tags\" afterwards to re-import the tags.", "Rename note",0x00000400|0x00400000, 0x00000400);
					if(res == 1024) {
						if (script.platformIsWindows()) {
							arguments = ["/C","move",script.toNativeDirSeparators(fileName),script.toNativeDirSeparators(path) + newName];
							script.startSynchronousProcess("cmd.exe", arguments, "");
						} else {
							var arguments = [fileName,path + newName];
							script.startSynchronousProcess("mv", arguments, "");
						}
					}
				} else {
					script.log("This note does not have tags.");
				}
				break;
		}
	}
}
