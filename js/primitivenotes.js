/**
 * Roundcube Notes Plugin
 *
 * @version 2.0.7
 * @author Offerel
 * @copyright Copyright (c) 2022, Offerel
 * @license GNU General Public License, version 3
 */
var mde, tagify;
var filelist = [];
var loader = document.createElement("div");
var ldr = document.createElement("div");
ldr.classList.add('db-spinner');
loader.classList.add("lbg");
loader.appendChild(ldr);

window.rcmail && rcmail.addEventListener("init", function(a) {
	if(new URLSearchParams(window.location.search).get('_task') === 'notes') {
	    if(document.querySelector('.task-menu-button')) document.querySelector('.task-menu-button').classList.add('notes');
	} else {
		if(document.querySelector('.task-menu-button')) document.querySelector('.task-menu-button').classList.remove('notes');
	}
	
	if(document.querySelector('.back-list-button')) document.getElementById('headerTitle').style.width = (window.getComputedStyle(document.querySelector('.back-list-button'), null).display == 'block') ? document.getElementById('headerTitle').style.width = 'calc(100% - 40px)':document.getElementById('headerTitle').style.width = 'calc(100% - 20px)';
	
	mde = new EasyMDE({
		element: document.getElementById("editor1"),
		autoDownloadFontAwesome: false,
		autofocus: true,
		previewImagesInEditor: false,
		spellChecker: false,
		promptURLs: true,
		inputStyle: 'contenteditable',
		nativeSpellcheck: true,
		forceSync: false,
		sideBySideFullscreen: false,
		iconsSet: 'material',
		toolbar: [{
					name: "save",
					action: saveFile,
					title: "Save",
					className: "fa fa-floppy-disk"
				},"|",
					"bold", "italic", "heading", "clean-block", "|",
					"quote", "code", "unordered-list", "ordered-list", "|",
					"link",{
						name: "media",
						action: uplMedia,
						title: "Insert Media",
						className: "fa fa-image"
					},"table", "|",
					{
						name: "preview",
						action: tPreview,
						title: "Toggle Preview",
						className: "preview fa fa-eye no-disable"
					}, "side-by-side",
					{
						name: "meta",
						action: togglemData,
						className: "fa fa-question-circle no-disable",
						title: "Metadata",
					},
					{
						name: "toc",
						action: toggleTOC,
						className: "fa fa-list-alt",
						title: "TOC",
						attributes: {
							disabled: '',
							id: 'test'
						}
					}],
		shortcuts: {
			"save": "Ctrl-S",
			"preview": "Ctrl-P",
		},
		renderingConfig: {
			codeSyntaxHighlighting: true,
			sanitizerFunction: function(renderedHTML) {
				let output = renderedHTML.replaceAll(rcmail.env.mfolder + "/", '?_task=notes&_action=blink&_file=');
				output = output.replaceAll('<pre>', '<pre class="hljs">');
				return output;
			},
		}
	});

	tagify = new Tagify(document.getElementById('ntags'), {
		whitelist: JSON.parse(rcmail.env.taglist),
		dropdown : {
			classname     : "color-blue",
			enabled       : 0,
			maxItems      : 0,
			position      : "text",
			closeOnSelect : false,
			highlightFirst: true
        },
		trim: true,
		duplicates: false,
		enforceWhitelist: false,
		delimiters: ',|;| ',
		placeholder: 'Tags'
	});

	document.getElementById('notessearchform').addEventListener('keyup', searchList, false);
	document.querySelectorAll('#pnlist li a').forEach(function(note){
		note.addEventListener('click',function(){
			showNote(note.parentElement.id, 'show');
		});
	});

	rcmail.addEventListener('plugin.loadNote', loadNote);
	rcmail.addEventListener('plugin.savedNote', savedNote);
	rcmail.addEventListener('plugin.getNote', downloadNote);

	cContextMenu();
	
	rcmail.register_command("cCommand", cCommand, true);
	rcmail.register_command("addnote", add_note, !0);
	rcmail.register_command("newnote", new_note, !0);
	rcmail.register_command("pnoptions", pnoptions, !0);
	if(document.getElementById('upl')) document.getElementById('upl').addEventListener('change', sform, false );
	if(document.getElementById('dropMedia')) document.getElementById('dropMedia').addEventListener('change', mform, false );
	if(window.location.hash == '#pnotes') rcmail.sections_list.select_row('primitivenotes');
	
	if (document.getElementById('notes-list')) {
		var transitioning = false;
		document.getElementById('notes-list').addEventListener("dragenter", function (e) {
			e.preventDefault();
			e.stopPropagation();
			transitioning = true;
			setTimeout(function () {
				transitioning = false;
			}, 1);
			document.getElementById('notes-list').classList.add('highlight');
		});
		document.getElementById('notes-list').addEventListener("dragleave", function (e) {
			e.preventDefault();
			e.stopPropagation();
			if (transitioning === false) {
				document.getElementById('notes-list').classList.remove('highlight');
			}
		});
		document.getElementById('notes-list').addEventListener("dragover", function (e) {
			e.preventDefault();
			e.stopPropagation();
		});
		document.getElementById('notes-list').addEventListener("drop", function (e) {
			e.preventDefault();
			e.stopPropagation();
			document.getElementById('notes-list').classList.remove('highlight');
			manageDropUpload(e.dataTransfer.files);
		});
	}

	document.addEventListener("keyup", event => {
		if(event.key == 'Escape') {
			if(mde.isPreviewActive() === false) {
				tPreview('show');
			}
		}
	});
	document.getElementById('source').addEventListener('click', osource, true);
	document.querySelector('.EasyMDEContainer').addEventListener('paste', pasteParse, true);
});

function uplMedia() {
	document.getElementById("dropMedia").click();
}

function osource() {
	let source = document.getElementById('source');
	if(source.readOnly && source.value.length > 1) window.open(source.value, '_blank').focus();
}

function pasteParse(event) {
	event.preventDefault();
	event.stopPropagation();
	
	const pastedString = event.clipboardData.getData('text/html') || event.clipboardData.getData('text/plain');

	for (var i = 0; i < event.clipboardData.items.length ; i++) {
		let item = event.clipboardData.items[i];
		if(item.type.indexOf("image") != -1) {
			let imageT = event.clipboardData.getData('text/html');
			if(imageT.indexOf('alt="') >= 0) {
				let altS = imageT.indexOf('alt="') + 5;
				let altE = imageT.indexOf('"',altS);
				var alt = imageT.substr(altS, altE - altS);
			} else var alt = '';

			if(imageT.indexOf('title="') >= 0) {
				let titleS = imageT.indexOf('title="') + 7;
				let titleE = imageT.indexOf('"',titleS);
				var title = imageT.substr(titleS, titleE - titleS);
			} else var title = '';
			
			document.getElementById("main_area").appendChild(loader);

			uploadFile(item.getAsFile(), alt, title);
			return false;
		}
	}

	function uploadFile(file, alt, title) {
		var xhr = new XMLHttpRequest();
		xhr.onload = function() {
			if (xhr.status == 200) {
				if(title) title = ' "'+title+'"';
				mde.codemirror.replaceSelection('![' + alt + '](' + xhr.responseText + title + ')');
				loader.remove();
			} else {
				let message = "Server Error! Upload failed. Can not connect to server";
				console.error(message);
				rcmail.display_message(message, 'error');
			}
		};
	
		xhr.onerror = function() {
			let message = "Server Error! Upload failed. Can not connect to server";
			console.error(message);
			rcmail.display_message(message, 'error')
		};
	
		var formData = new FormData();
		formData.append("dropFile", file);
		xhr.open('POST', location.href + '&_action=uplMedia');
		xhr.send(formData);
	}

	let options = {
		headingStyle: 'atx',
		hr: '-',
		bulletListMarker: '-',
		codeBlockStyle: 'fenced',
		fence: '```',
		emDelimiter: '*',
		strongDelimiter: '**',
		linkStyle: 'inlined',
		linkReferenceStyle: 'full',
		collapseMultipleWhitespaces: true,
		preformattedCode: true,
	};

	let turndownService = new window.TurndownService(options);

	turndownService.addRule('kbd',{
		filter:['kbd'],
		replacement: function(content) {
			return '<kbd>' + content + '</kbd>';
		}
	});

	let markdownString = pastedString.startsWith('<html>') ? turndownService.turndown(pastedString) : pastedString;

	if(markdownString.startsWith('---')) {
		let mdArr = markdownString.split('\n');
		let cstart = markdownString.indexOf('---',4) + 3;
		for(let i = 1; i < 10; i++) {
			if(mdArr[i] == '---') break;
			let yentry = mdArr[i].split(':');
			if(yentry[0] == 'tags') tagify.addTags(yentry[1]);
			if(yentry[0] == 'author') document.getElementById('author').value = yentry[1].trim();
			if(yentry[0] == 'date') document.getElementById('date').value = yentry.slice(1).join(':').trim();
			if(yentry[0] == 'updated') document.getElementById('updated').value = yentry.slice(1).join(':').trim();
			if(yentry[0] == 'source') document.getElementById('source').value = yentry.slice(1).join(':').trim();
		}
		markdownString = markdownString.substr(cstart).trim();
	}
	
	mde.codemirror.replaceSelection(markdownString);
}

function manageDropUpload(files) {
	document.getElementById("main_area").appendChild(loader);
	for (let file of files) {
		if(rcmail.env.aformat.includes(file.name.split('.').slice(-1)[0])) {
			filelist.push(file);
		} else {
			let message = "File '" + file.name + "' not allowed";
			console.error(message);
			rcmail.display_message(message, 'error')
		}
		
	}
	doDropUpload();
}

function doDropUpload() {
	if (filelist.length > 0) {
		let data = new FormData();
		let thisfile = filelist[0];
		filelist.shift();
		data.append('dropFile', thisfile);
		const xhr = new XMLHttpRequest();
		xhr.onload = () => {
			document.getElementById('pnlist').remove();
			const lDom = new DOMParser().parseFromString(xhr.response, "text/html").getElementById('pnlist');
			document.getElementById('notes-list').appendChild(lDom);
			loader.remove();

			document.querySelectorAll('#pnlist li a').forEach(function(note){
				note.addEventListener('click', function(){
					showNote(note.parentElement.id, 'show');
				});
			});

			cContextMenu();
		};
		xhr.open('POST', location.href + '&_action=uplNote');
		xhr.send(data);
	}
}

function cContextMenu() {
	if(rcmail.env.contextmenu) {
		let pnotescmenu = rcmail.contextmenu.init({
			menu_name: 'mymenu',
			menu_source: [
				'#mymenu', {
					label: rcmail.gettext("note_show", "primitivenotes"),
					command: 'cCommand',
					props: 'show',
					classes: 'extwin'
				},{
					label: rcmail.gettext("note_edit", "primitivenotes"),
					command: 'cCommand',
					props: 'edit',
					classes: 'edit'
				},{
					label: rcmail.gettext("note_send", "primitivenotes"),
					command: 'cCommand',
					props: 'send',
					classes: 'send'
				},{
					label: rcmail.gettext("note_download", "primitivenotes"),
					command: 'cCommand',
					props: 'download',
					classes: 'download'
				},{
					label: rcmail.gettext("note_del", "primitivenotes"),
					command: 'cCommand',
					props: 'delete',
					classes: 'delete'
				}
			]}, {'beforeactivate': function(p) {
				document.querySelectorAll('#pnlist li').forEach(function(note) {note.classList.remove('lselected')});
				p.source.classList.add('lselected');
			}}
		);

		$('#pnlist li').each(function() {
			$(this).on("contextmenu", function(e) {
				rcmail.contextmenu.show_one(e, this, this.id, pnotescmenu);
			});
		});
	}
}

function cCommand(command) {
	let element = document.querySelector('.context-source');
	let postData = null;
	switch (command) {
		case 'show':
			showNote(element.id, 'show');
			break;
		case 'edit':
			showNote(element.id, 'edit');
			break;
		case 'send':
			file = element.dataset.name;
			send_note({message:"done", name:file, type: file.slice(-3), note:""});
			break;
		case 'download':
			postData = {
				_name: element.dataset.name,
			};
			rcmail.http_post('getNote', postData, false);
			break;
		case 'delete':
			let name = document.getElementById('note_' + element.id).title;
			postData = {
				_file: element.dataset.name,
				_name: name
			};
			if(confirm(rcmail.gettext("note_del_note", "primitivenotes").replace("%note%", name)))
				rcmail.http_post('delNote', postData, false);
			break;
		default:
			return false;
	}

}

function downloadNote(args) {
	let blob = new Blob([args.note], {type: args.type});
	let url = window.URL.createObjectURL(blob);
	let dLink = document.createElement('a');
	dLink.style = "display: none";
	dLink.href = url;
	dLink.download = args.file;
	document.body.appendChild(dLink);
	dLink.click();
	window.URL.revokeObjectURL(url);
}

function tPreview(mode = '') {
	if(mode === "show" || mode === "edit") {
		//
	} else {
		mode = (mde.isPreviewActive()) ? 'edit':'show';
	}
	

	if(mde.isPreviewActive()) {
		if(mode == 'edit') mde.togglePreview();
	} else {
		if(mode == 'show') mde.togglePreview();
	}

	setTimeout(() => {
		if (mode == 'show') {
			document.querySelector('.preview').classList.add('active');
			document.getElementById('headerTitle').classList.add('readOnly');
			tagify.setReadonly(true);
			document.querySelector('.tagify').classList.remove('taedit');
			document.getElementById('author').readOnly = true;
			document.getElementById('source').readOnly = true;
			document.querySelector('.toc').classList.add('no-disable');
			document.querySelector('.toc').removeAttribute('disabled');
		} else {
			document.querySelector('.preview').classList.remove('active');
			document.getElementById('headerTitle').classList.remove('readOnly');
			tagify.setReadonly(false);
			document.querySelector('.tagify').classList.add('taedit');
			document.getElementById('author').readOnly = false;
			document.getElementById('source').readOnly = false;
			document.querySelector('.toc').classList.remove('no-disable');
			document.querySelector('.toc').setAttribute('disabled', true);
			if(document.getElementById('tocdiv')) document.getElementById('tocdiv').classList.remove('tocShow');
		}
	}, 50);
}

function saveFile() {
	document.getElementById("main_area").appendChild(loader);

	let tObj = tagify.value;
	let tagsA = [];
	for (let tag in tObj) {
		tagsA.push(tObj[tag].value);
	}

	const data = {
		_oname: document.getElementById('fname').value,
		_content: mde.value(),
		_title: document.getElementById('headerTitle').value,
		_author: document.getElementById('author').value,
		_date: document.getElementById('date').value,
		_updated: document.getElementById('updated').value,
		_source: document.getElementById('source').value,
		_tags: tagsA,
	};
	rcmail.http_post('saveNote', data, false);
}

function togglemData() {
	document.getElementById('ndata').classList.toggle('mtoggle');
}

function loadNote(response) {
	loader.remove();
	
	if( screen.width <= 480 ) {
		document.getElementById('layout-list').classList.toggle('hidden');
		document.getElementById('layout-content').classList.toggle('hidden');
	}

	if(document.getElementById('tocdiv')) document.getElementById('tocdiv').remove();
	if(document.getElementById('binobj')) document.getElementById('binobj').remove();

	tagify.removeAllTags({withoutChangeEvent: true});
	document.getElementById('headerTitle').value = response.note.name;
	document.getElementById('ntags').value = response.note.tags;
	document.getElementById('author').value = response.note.author;

	document.getElementById('date').value = response.note.date;
	document.getElementById('updated').value = response.note.updated;
	
	document.getElementById('source').value = response.note.source;
	document.getElementById('source').title = response.note.source;
	document.getElementById('fname').value = response.note.filename;

	document.querySelectorAll('#pnlist li').forEach(function(note) {note.classList.remove('lselected')});
	document.getElementById(response.note.id).classList.add('lselected');

	if(response.note.mime_type.indexOf('text') === 0) {
		mde.value(response.note.content);
		document.querySelector('.EasyMDEContainer').classList.remove('mdeHide');
		setTimeout(() => {
			let headings = document.querySelector('.CodeMirror').querySelectorAll('h1, h2, h3, h4, h5, h6');
			let toc = document.querySelector('.toc');

			if(headings.length > 0) {
				toc.classList.add('no-disable');
				let tocdiv = document.createElement('div');
				tocdiv.id = 'tocdiv';
				let o = 0;
				let a = 0;
				let list = 'c%';
				headings.forEach(function(element){
					a = element.tagName.substr(1,1);
					if(o < a) {
						list = (o == 0) ? list.replace('c%','<ul><li><a title="'+element.innerText+'" href="#' + element.id + '">' + element.innerText + '</a></li>c%</ul>'):list.replace('c%','<li class="ul"><ul><li><a title="'+element.innerText+'" href="#' + element.id + '">' + element.innerText + '</a></li>c%</ul></li>');
					} else if(o > a) {
						list = list.replace('c%','</ul><li><a title="'+element.innerText+'" href="#' + element.id + '">' + element.innerText + '</a></li>c%');
					} else {
						list = list.replace('c%','<li><a title="'+element.innerText+'" href="#' + element.id + '">' + element.innerText + '</a></li>c%');
					}
					o = a;
				});
				list = list.replace('c%</ul>','');
				tocdiv.innerHTML = '<h3>' + rcmail.gettext("note_toc", "primitivenotes") + '</h3><div>' + list + '</div>';
				document.querySelector('.EasyMDEContainer').appendChild(tocdiv);
				document.querySelectorAll('#tocdiv a').forEach(function(elem) {
					elem.addEventListener('click', function(e){
						tocdiv.classList.toggle('tocShow');
					});
				});
			} else {
				toc.classList.remove('no-disable');
			}
		}, 50);
		
		tagify.addTags(response.note.tags);
		
	} else {
		document.querySelector('.EasyMDEContainer').classList.add('mdeHide');
		
		let objdiv = document.createElement('div');
		let object = document.createElement('object');
		objdiv.id = 'binobj';
		object.type = response.note.mime_type;
		object.data = response.note.content;
		object.classList.add('objcont');
		objdiv.classList.add('objdiv');
		objdiv.appendChild(object);
		document.getElementById('main_area').appendChild(objdiv);
	}

	tPreview(response.mode);

	document.querySelectorAll('.hljs').forEach(function(element) {
		element.addEventListener('click', function() {
			let element = this;
			navigator.clipboard.writeText(element.innerText).then(function() {
				let osp = document.createElement('span');
				osp.classList.add('success');
				osp.innerText = 'copied';
				element.appendChild(osp);
				setTimeout(function () {
					osp.remove();
				}, 1000);
			  }, function() {
			  	console.error('Clipboard error');
			  });
		});
	});
}

function savedNote(response) {
	document.getElementById('ndata').classList.remove('mtoggle');
	loader.remove();
	document.getElementById("notes-list").appendChild(loader);
	let success = ['done', 'saved'];


	if(success.includes(response.message)) {
		document.getElementById('pnlist').remove();
		const lDom = new DOMParser().parseFromString(response.list, "text/html");
		document.getElementById('notes-list').appendChild(lDom.body.children[0]);
	}
	
	document.querySelectorAll('#pnlist li a').forEach(function(note){
		note.addEventListener('click', function(){
			showNote(note.parentElement.id, 'show');
		});
	});
	
	if(response.mfiles) {
		if(confirm(response.mfiles.message)) rcmail.http_post('delMedia', '_media=' + response.mfiles.files, false);
	} else if (response.message == 'saved') {
		tPreview();
	}
	
	cContextMenu();
	loader.remove();
}

function searchList() {
	var input, filter, ul, li, a, i;
	input = document.getElementById('notessearchform');
	filter = input.value.toUpperCase();
	ul = document.getElementById("pnlist");
	li = ul.getElementsByTagName('li');

	for (i = 0; i < li.length; i++) {
		liTags = li[i].dataset.tags;
		if (liTags.toUpperCase().indexOf(filter) > -1) {
			li[i].style.display = "";
		} else {
			li[i].style.display = "none";
		}
	}
}

function toggleTOC() {
	let tocdiv = document.getElementById('tocdiv');
	if(tocdiv) tocdiv.classList.toggle('tocShow');
}

function showNote(id, mode='show') {
	document.getElementById("main_area").appendChild(loader);

	var postData = {
		_name: document.getElementById(id).dataset.name,
		_id: id,
		_mode: mode,
	};
	rcmail.http_post('displayNote', postData, false);
	document.getElementById('ndata').classList.remove('mtoggle');
}

function pnoptions() {
	location.href = window.location.origin + window.location.pathname + '?_task=settings&_action=preferences#pnotes';
}

function send_note(element) {
	rcmail.goto_url("mail/compose", {
		_note_filename: element.name
	}, !0);
};

function new_note(a) {
	if( screen.width <= 480 ) {
		document.getElementById('layout-list').classList.toggle('hidden');
		document.getElementById('layout-content').classList.toggle('hidden');
	}
	
	format = a ? a:rcmail.env.dformat;
	mde.value('');
	tPreview('edit')
	document.getElementById('headerTitle').value = '';
	document.getElementById('headerTitle').classList.remove('readOnly');
	tagify.removeAllTags({withoutChangeEvent: true});
	tagify.setReadonly(false);
	document.querySelector('.tagify').classList.add('taedit');
	document.getElementById('author').readOnly = false;
	document.getElementById('author').value = '';
	document.getElementById('source').readOnly = false;
	document.getElementById('source').value = '';
	document.getElementById('date').value = '';
	document.getElementById('updated').value = '';
	document.getElementById('fname').value = '';
	document.querySelector('.toc').classList.remove('no-disable');
	document.querySelector('.toc').setAttribute('disabled', true);
	if(document.getElementById('tocdiv')) document.getElementById('tocdiv').classList.remove('tocShow');
}

function add_note() {
	document.getElementById("upl").click();
}

function mform() {
	document.getElementById("main_area").appendChild(loader);
	fileName = this.value;
	let formats = ['pdf','jpg','jpeg','png'];
	if(formats.includes(fileName.split('.').pop().toLowerCase())) {
		let data = new FormData();
		data.append("dropFile", document.getElementById('dropMedia').files[0]);
		var xhr = new XMLHttpRequest();
		xhr.onload = () => {
			loader.remove();
			mde.codemirror.replaceSelection('![](' + xhr.responseText + ')');
		}
		xhr.open('POST', location.href + '&_action=uplMedia');
		xhr.send(data);
	} else {
		alert(rcmail.gettext("note_inv_format", "primitivenotes"));
	}
	
	return false;
}

function sform() {
	fileName = this.value;
	let file_extension = fileName.split('.').pop().toLowerCase();
	if(rcmail.env.aformat.includes(file_extension)) {
		let data = new FormData(document.getElementById("upl_form"));
		const xhr = new XMLHttpRequest();
		xhr.onload = () => {
			document.getElementById('pnlist').remove();
			const lDom = new DOMParser().parseFromString(xhr.response, "text/html").getElementById('pnlist');
			document.getElementById('notes-list').appendChild(lDom);
			loader.remove();

			document.querySelectorAll('#pnlist li a').forEach(function(note){
				note.addEventListener('click', function(){
					showNote(note.parentElement.id, 'show');
				});
			});

			cContextMenu();
		}

		xhr.open('POST', location.href + '&_action=uplNote');
		xhr.send(data);
	} else {
		alert(rcmail.gettext("note_inv_format", "primitivenotes"));
	}
	
	return false;
}