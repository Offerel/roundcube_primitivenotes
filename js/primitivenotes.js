/**
 * Roundcube Notes Plugin
 *
 * @version 2.2.0
 * @author Offerel
 * @copyright Copyright (c) 2024, Offerel
 * @license GNU General Public License, version 3
 */
var mde, tagify, oNote;
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

	document.getElementById('headerTitle').placeholder = rcmail.gettext("note_title", "primitivenotes");
	
	if(document.querySelector('.back-list-button')) document.getElementById('headerTitle').style.width = (window.getComputedStyle(document.querySelector('.back-list-button'), null).display == 'block') ? document.getElementById('headerTitle').style.width = 'calc(100% - 30px)':document.getElementById('headerTitle').style.width = 'calc(100% - 10px)';
	
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
				output = output.replaceAll("a href=\"?_task", "a class=\"intlink\" href=\"?_task");
				output = output.replaceAll("a href=\"http", "a class=\"extlink\" href=\"http"); 
				output = output.replaceAll("a href=\"", "a class=\"dlink\" href=\"");
				output = output.replaceAll('<pre>', '<pre class="hljs">');

				document.querySelectorAll('.intlink').forEach(function(link){
					link.addEventListener('click', function(){
						showNote(119);
					});
				});
				return output;
			},
		}
	});

	let WhiteList = (rcmail.env.taglist != undefined) ?JSON.parse(rcmail.env.taglist):'';
	lcount = document.getElementById('notes-list').children.length;

	if(lcount > 0 ) {
		tagify = new Tagify(document.getElementById('ntags'), {
			whitelist: WhiteList,
			dropdown : {
				classname     : "color-blue",
				trim		: true,
				enabled       : 0,
				maxItems      : WhiteList.length,
				position      : "text",
				closeOnSelect : false,
				highlightFirst: true
			},
			trim: true,
			duplicates: false,
			enforceWhitelist: false,
			delimiters: ',|;| '
		});
	} else {
		document.getElementById('ntags').style.visibility = 'hidden';
	}

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
	
	window.addEventListener("keydown", function(e) {
		if(e.shiftKey && e.ctrlKey && "KeyF" === e.code) {
			document.getElementById("notessearchform").focus();
			return false;
		}
		
		if(e.ctrlKey && "KeyF" === e.code) {
			e.preventDefault();
			searchInNote();
			return false;
		}
	});

	document.addEventListener("keyup", event => {
		if(event.key == 'Escape') {
			if(mde.isPreviewActive() === false && document.getElementById("notessearchform") !== document.activeElement && mde.value() !== '') {
				tPreview('show');
			}

			if(document.getElementById("notessearchform") === document.activeElement) {
				document.getElementById("notessearchform").value = '';
				document.getElementById("notessearchform").dispatchEvent(new KeyboardEvent('keyup', {'key':''}));
			}
		}
	});
	document.getElementById('source').addEventListener('click', osource, true);
	document.querySelector('.EasyMDEContainer').addEventListener('paste', pasteParse, true);

	let unote = new URLSearchParams(document.location.search).get('note');
	if(unote) {
		let nl = null;

		document.querySelectorAll('#pnlist li').forEach((element, index, arr) => {
			if (element.dataset.name == unote) {
				nl = element.id;
				arr.length = index + 1;
			}
		});
		
		let postData = {
			_name: unote,
			_id: nl,
			_mode: 'show',
		};

		rcmail.http_post('displayNote', postData, false);
	}
});

function searchInNote() {
	let cSearch = document.createElement('div');
	cSearch.id = 'cSearch';
	let iSearch = document.createElement('input');
	iSearch.id = 'iSearch';
	cSearch.appendChild(iSearch);
	let iInfo = document.createElement('div');
	let act = document.createElement('span');
	act.innerText = '0';
	let found = document.createElement('span');
	
	let prev = document.createElement('a');
	prev.id = 'prev';
	prev.innerHTML = '&#10092;'
	prev.addEventListener('click', e => {
		e.preventDefault();
		let fpos = parseInt(act.innerText) - 1;
		fpos = (fpos >= 1) ? fpos:1;
		document.querySelector('[data-pos="' + fpos.toString() + '"]').scrollIntoView();
		document.querySelectorAll('mark').forEach(e => {
			e.classList.remove('fc')
		});
		document.querySelector('[data-pos="' + fpos.toString() + '"]').classList.add('fc');

		if(fpos == 1) {
			prev.classList.add('anone');
			next.classList.remove('anone');
		} else {
			prev.classList.remove('anone');
			next.classList.remove('anone');
		}

		act.innerText = fpos;
	});
	
	let next = document.createElement('a');
	next.id = 'next';
	next.innerHTML = '&#10093;'
	next.addEventListener('click', e => {
		e.preventDefault();
		marks = document.querySelectorAll('mark');
		let fpos = parseInt(act.innerText) + 1;
		fpos = (fpos > marks.length) ? marks.length:fpos;
		document.querySelector('[data-pos="' + fpos.toString() + '"]').scrollIntoView();
		marks.forEach(e => {
			e.classList.remove('fc')
		});
		document.querySelector('[data-pos="' + fpos.toString() + '"]').classList.add('fc');

		if(fpos == marks.length) {
			console.log(fpos);
			next.classList.add('anone');
			prev.classList.remove('anone');
		} else {
			next.classList.remove('anone');
			prev.classList.remove('anone');
		}

		act.innerText = fpos;
	});
	
	let iStatus = document.createElement('span');
	let iText = document.createTextNode(' / ');
	
	found.innerText = '0';
	let iText2 = document.createElement('span');
	iText2.classList.add('sep');
	
	iStatus.appendChild(act);
	iStatus.appendChild(iText);
	iStatus.appendChild(found);
	iStatus.appendChild(iText2);
	
	iInfo.appendChild(iStatus);
	iInfo.appendChild(prev);
	iInfo.appendChild(next);
	
	cSearch.appendChild(iInfo);
	let main_area = document.getElementById('main_area');
	main_area.appendChild(cSearch);
	iSearch.focus();
	iSearch.addEventListener("keyup", e => {
		if(e.key == 'Escape') {
			cSearch.remove();
			iSearch.remove();
		} else {
			let sPos = 1;
			let sTerm = document.getElementById('iSearch').value.trim();
			let text = oNote;
			let re = new RegExp(sTerm,"gi");
			let newText = '';
			let marks;
			
			if(sTerm.length < 3) {
				newText = oNote;
			} else {
				newText = oNote.replace(re, `<mark>${sTerm}</mark>`);
			}
			
			mde.value(newText);
			
			marks = document.querySelectorAll('mark');
			marks.forEach(e => {
				e.dataset.pos = sPos;
				sPos++;
			});
			
			found.innerText = (marks.length) ? marks.length:0;
			
			try {
				document.querySelector('[data-pos="1"]').scrollIntoView(true);
				act.innerText = '1';
				prev.classList.add('anone');
				document.querySelector('[data-pos="1"]').classList.add('fc')
			} catch (e) {
				return null;
			}
		}
	});
}

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
	const pastedTypes = event.clipboardData.types;

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
		let xhr = new XMLHttpRequest();
		xhr.onload = function() {
			if (xhr.status == 200) {
				mde.codemirror.replaceSelection(xhr.responseText);
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
	
		let formData = new FormData();
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

	let markdownString = pastedTypes.includes('text/html') ? turndownService.turndown(pastedString):pastedString;

	if(markdownString.startsWith('---')) {
		let mdArr = markdownString.split('\n');
		let cstart = markdownString.indexOf('---',4) + 3;
		for(let i = 1; i < 10; i++) {
			if(mdArr[i] == '---') break;
			let yentry = mdArr[i].split(':');
			if(yentry[0] == 'tags') tagify.addTags(yentry[1]);
			if(yentry[0] == 'author') document.getElementById('author').value = yentry[1].trim();
			if(yentry[0] == 'created') document.getElementById('created').value = yentry.slice(1).join(':').trim();
			if(yentry[0] == 'modified') document.getElementById('modified').value = yentry.slice(1).join(':').trim();
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
			downloadNote(element.dataset.name);
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

function downloadNote(note) {
	let xhr = new XMLHttpRequest();
	xhr.onload = function() {
		if (xhr.status == 200) {
			let blob = new Blob([xhr.response], {type: xhr.getResponseHeader("content-type")});
			let data = URL.createObjectURL(blob);
			let a = document.createElement('a');
			
			var disposition = xhr.getResponseHeader('Content-Disposition');
			var filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
			var matches = filenameRegex.exec(disposition);
			if (matches != null && matches[1]) filename = matches[1].replace(/['"]/g, '');
			
			a.href = data;
			a.download = filename;
			a.click();
			setTimeout(function() {
				window.URL.revokeObjectURL(data);
			}, 100);
			loader.remove();
		} else {
			let message = "Server Error! Download failed. Can't connect to server";
			console.error(message);
			rcmail.display_message(message, 'error');
		}
	};

	xhr.onerror = function() {
		let message = "Server Error! Download failed. Can't connect to server";
		console.error(message);
		rcmail.display_message(message, 'error')
	};
	xhr.responseType = "blob";
	xhr.open('GET', location.href + '&_action=getNote&_name=' + note);
	xhr.send();
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
			document.querySelectorAll('.editor-preview code').forEach(function(element) {
				element.addEventListener('click', function() {
					console.info('clicked');
					let element = this;
					element.classList.add('success');
					navigator.clipboard.writeText(element.innerText).then(function() {
						setTimeout(function () {
							element.classList.remove('success');
						}, 1000);
					  }, function() {
					  	console.error('Clipboard error');
					  });
				});
			});
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
		_created: document.getElementById('created').dataset.tstamp,
		_modified: document.getElementById('modified').value,
		_source: document.getElementById('source').value,
		_tags: tagsA,
	};
	rcmail.http_post('saveNote', data, false);
}

function togglemData() {
	document.getElementById('ndata').classList.toggle('mtoggle');
}

function loadNote(response) {
	let newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?_task=notes&note=' + response.note.filename;
	window.history.pushState({path:newurl},'',newurl);
	
	loader.remove();
	
	if( screen.width <= 480 ) {
		document.getElementById('layout-list').classList.toggle('hidden');
		document.getElementById('layout-content').classList.toggle('hidden');
	}

	if(document.getElementById('tocdiv')) document.getElementById('tocdiv').remove();
	if(document.getElementById('binobj')) document.getElementById('binobj').remove();

	tagify.removeAllTags();
	document.getElementById('headerTitle').value = response.note.name;
	document.getElementById('ntags').value = response.note.tags;
	document.getElementById('author').value = response.note.author;

	document.getElementById('created').value = response.note.created;
	document.getElementById('created').dataset.tstamp = response.note.tstamp;
	document.getElementById('modified').value = response.note.modified;
	
	document.getElementById('source').value = response.note.source;
	document.getElementById('source').title = response.note.source;
	document.getElementById('fname').value = response.note.filename;

	document.querySelectorAll('#pnlist li').forEach(function(note) {note.classList.remove('lselected')});
	document.getElementById(response.note.id).classList.add('lselected');

	if(response.note.mime_type.indexOf('text') === 0) {
		oNote = response.note.content;
		mde.value(response.note.content);
		document.querySelector('.EasyMDEContainer').classList.remove('mdeHide');
		setTimeout(() => {
			let headings = document.querySelector('.CodeMirror').querySelectorAll('h1, h2, h3, h4, h5, h6');
			let toc = document.querySelector('.toc');

			if(headings.length > 0) {
				toc.classList.add('no-disable');
				let tocdiv = document.createElement('div');
				tocdiv.id = 'tocdiv';
				let thead = document.createElement('h3');
				thead.innerText = rcmail.gettext("note_toc", "primitivenotes");
				tocdiv.appendChild(thead);
				let tdiv = document.createElement('div');
				tdiv.appendChild(buildToc(tocHierarchi(tocArr(headings))));
				tocdiv.appendChild(tdiv);
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

	let intlink = document.querySelectorAll('.editor-preview a.intlink');
	intlink.forEach(function(e) {
		e.addEventListener('click', function(link) {
			if(screen.width > 480) {
				link.preventDefault();
				document.querySelector('.EasyMDEContainer').classList.add('mdeHide');
				let objdiv = document.createElement('div');
				let object = document.createElement('object');
				objdiv.id = 'binobj';
				object.data = link.target.attributes.href.nodeValue;
				object.classList.add('objcont');
				objdiv.classList.add('objdiv');
				objdiv.appendChild(object);
				document.getElementById('main_area').appendChild(objdiv);
			}
		});
	});

	let dlink = document.querySelectorAll('.editor-preview a.dlink');
	dlink.forEach(function(e) {
		e.addEventListener('click', function(link) {
			link.preventDefault();
			showNote(document.querySelectorAll("[data-name='"+link.target.attributes.href.value+"']")[0].id);
			return false;
		});
		return false;
	});
}

function buildToc(headings) {
	let li, a, anchor;
	let ul = document.createElement('ul');
	if(headings && headings.length) {
		for(t of headings) {
			li = document.createElement('li');
			a  = document.createElement('a');
			a.href = '#' + t.el.id;
			a.textContent = t.el.textContent;
			li.append(a);
			if(t.subitems && t.subitems.length) li.append(buildToc(t.subitems));
			ul.append(li);
		}
	}
	return ul;
}

function tocHierarchi(items) {
	let tocHierarchi = Object.create(null);
	items.forEach(item => tocHierarchi[item.idt] = { ...item, subitems : [] });
	let tree = [];
	items.forEach( item => {
		if(item.parent)
			tocHierarchi[item.parent].subitems.push(tocHierarchi[item.idt]);
		else
			tree.push(tocHierarchi[item.idt]);
	});
	return tree;
}

function tocArr(array) {
	let idt, level, t;
	for(let i = 0, n = array.length; i < n; i++) {
		t       = array[i];
		t.el    = t;
		level   = parseInt(t.tagName[1], 10);
		t.level = level;
		t.idt   = i + 1;

		if(level <= 1) t.parent = 0;
		if(i) {
			if(array[i - 1].level < level) t.parent = array[i - 1].idt;
			else if(array[i - 1].level == level) t.parent = array[i - 1].parent;
			else {
				for(let j = i - 1; j >= 0; j--) {
					if(array[j].level == level - 1) {
						t.parent = array[j].idt;
						break;
					}
				}
			}
		}
	}
	return array;
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
	document.getElementById('ndata').classList.remove('mtoggle');
	let postData;
	
	let viewA = ['md', 'txt', 'html', 'jpg'];
	let fA = document.getElementById(id).dataset.format;
	
	if( screen.width > 480 || viewA.indexOf(fA) != -1) {
		document.getElementById("main_area").appendChild(loader);
		postData = {
			_name: document.getElementById(id).dataset.name,
			_id: id,
			_mode: mode,
		};
		rcmail.http_post('displayNote', postData, false);
	} else {
		downloadNote(document.getElementById(id).dataset.name);
	}
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

	document.title = rcmail.env.nnote;
	let newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + '?_task=notes';
	window.history.pushState({path:newurl},'',newurl);
	document.getElementById('headerTitle').placeholder = rcmail.gettext("note_title", "primitivenotes");
	document.querySelector('.tagify__input').dataset.placeholder = 'Tags';

	format = a ? a:rcmail.env.dformat;
	mde.value('');
	tPreview('edit')
	document.getElementById('headerTitle').value = '';
	document.getElementById('headerTitle').classList.remove('readOnly');
	tagify.removeAllTags();
	tagify.setReadonly(false);
	document.querySelector('.tagify').classList.add('taedit');
	document.getElementById('author').readOnly = false;
	document.getElementById('author').value = '';
	document.getElementById('source').readOnly = false;
	document.getElementById('source').value = '';
	document.getElementById('created').value = '';
	document.getElementById('modified').value = '';
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
			mde.codemirror.replaceSelection(xhr.responseText);
			loader.remove();
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