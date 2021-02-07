/**
 * Roundcube Notes Plugin
 *
 * @version 2.0.3
 * @author Offerel
 * @copyright Copyright (c) 2021, Offerel
 * @license GNU General Public License, version 3
 */
$(document).ready(function(){
	var tagify = new Tagify(document.querySelector('#ntags'), {
		whitelist:[],
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
	
	$.ajax({
		'type': "POST",
		'url': "notes.php",
		'data': { 'action': "getTags" },
		'success': function(data){
			tagify.settings.whitelist = JSON.parse(data);
		}
	});

	let cookiesArr = document.cookie.split(';');
	var media_folder;
	cookiesArr.forEach(function(element){
		let cookie = element.split('=');
		if(cookie[0].indexOf('pn_') > 0) media_folder = JSON.parse(decodeURIComponent(cookie[1]));
	});
	
    var mde = new EasyMDE({
        element: document.getElementById('editor1'),
        autoDownloadFontAwesome: false,
		autofocus: true,
		previewImagesInEditor: false,
        spellChecker: false,
        autofocus: true,
        status: false,
		promptURLs: true,
		inputStyle: 'contenteditable',
		nativeSpellcheck: true,
		forceSync: true,
		//sideBySideFullscreen: false,
        renderingConfig: {
			codeSyntaxHighlighting: true,
			sanitizerFunction: function(renderedHTML) {
				let output = renderedHTML.replaceAll(media_folder,'notes.php?blink=');
				return output;
			},
        },
        toolbar: 	[{ name: 'Save',
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
                        title: 'Add image from URL',
                    },
                    { name: 'Image',
                        action: uplLocalImage,
                        className: 'fa fa-file-image-o',
                        title: 'Upload and insert local image',
                    },
                    'table', '|',
                    'preview', 'side-by-side', 'fullscreen', 'guide', '|'	],
	});

    document.querySelectorAll('#filelist li a').forEach(function(note){
        note.addEventListener('click',function(){
            showNote(note.parentElement.id);
            tagify.setReadonly(true);
        });
    });

    window.addEventListener('message', (e) => {
        let estate = document.getElementById('estate');
		if('tstate' in e.data) tagify.setReadonly(e.data.tstate);
        if('ttags' in e.data && e.data.ttags == '') tagify.removeAllTags();
        if('editor' in e.data && e.data.editor == 'new') {
            if(estate.value == 's') {
				mde.togglePreview();
				estate.value = 'e';
            }
			mde.value("");
			document.getElementById('fname').value = '';
			let editor1 = document.getElementById('editor1');
			editor1.value = '';

			if(e.data.format == 'md') {
				document.querySelector('#main_area .editor-toolbar').style.display = 'block';
				document.querySelector('.EasyMDEContainer').style = 'display: block';
				mde.value('');
				editor1.style = 'display: none;'
				document.getElementById('author').value = '';
				document.getElementById('date').value = '';
				document.getElementById('source').value = '';
				document.querySelector('#main_area .EasyMDEContainer').addEventListener('paste', pasteParse, false);
			} else {
				let toolbar = document.createElement('div');
				toolbar.id = 'atoolbar';
				let bSave = document.createElement('li');
				bSave.id = 'bSave';
				bSave.classList.add("fa", "fa-floppy-o");
				bSave.addEventListener('click', sbfile, false);
				toolbar.appendChild(bSave);
				let bSeperator = document.createElement('i');
				bSeperator.classList.add("separator");
				toolbar.appendChild(bSeperator);

				editor1.parentNode.insertBefore(toolbar, editor1);
				document.querySelector('.EasyMDEContainer').style = 'display: none';
				editor1.style = 'display: block';
			}
		}
		if('editor' in e.data && e.data.editor == 'edit') {
            if(estate.value == 's') {
				mde.togglePreview();
                estate.value = 'e';
			}

			let file = document.getElementById('fname').value.split('.');
			let format = file[file.length - 1];
			if(document.getElementById('atoolbar')) document.getElementById('atoolbar').remove();

			switch(format){
				case 'md':
					document.querySelector('.EasyMDEContainer').style = 'display: block;';
					document.querySelector('#main_area .editor-toolbar').style.display = 'block';
					document.querySelector('#editor1').style = 'display: none;';
					break;
				default:
					let toolbar = document.createElement('div');
					let editor = document.getElementById('editor1');
					toolbar.id = 'atoolbar';
					let bSave = document.createElement('li');
					bSave.id = 'bSave';
					bSave.classList.add("fa", "fa-floppy-o");
					bSave.addEventListener('click', sbfile, false);
					toolbar.appendChild(bSave);
					let bSeperator = document.createElement('i');
					bSeperator.classList.add("separator");
					toolbar.appendChild(bSeperator);

					editor.parentNode.insertBefore(toolbar, editor);
					document.querySelector('.EasyMDEContainer').style = 'display: none';
					editor.style = 'display: block';

					if(document.getElementById('bcontent')) document.getElementById('editor1').style = 'display: none';
			}
        }
	});
	
	document.addEventListener("keyup", event => {
		if(event.key == 'Escape') {
			if(document.getElementById('estate').value == 'e') {
				mde.togglePreview();
				document.querySelector('#main_area .editor-toolbar').style.display = 'none';
				document.getElementById('estate').value = 's';
				let headerTitle = document.createElement('span');
				headerTitle.id = 'headerTitle';
				headerTitle.classList.add('headerTitle');
				headerTitle.innerText = document.getElementById('note_name').value;
				document.querySelector('#main_header #note_name').replaceWith(headerTitle);
				document.querySelector('tags').classList.remove('edit');
				tagify.setReadonly(true);
			}
		}
	});

	document.getElementById('notesearch').addEventListener('keyup', searchList, false);

	document.getElementById('save_button').addEventListener('click', function() {
		document.getElementById('metah').submit();
	});

	document.getElementById('localimg').addEventListener('change', simage, false);

	new rcube_splitter({ id:'notessplitter', p1:'#sidebar', p2:'#main', orientation:'v', relative:true, start:400, min:250, size:12 }).init();

	function pasteParse(event) {
		const pastedText = event.clipboardData.getData('text');
		const pastedHTML = event.clipboardData.getData('text/html');
		let textArr = pastedText.split('\n');
		if(textArr[0] == '---') {
			let cstart = pastedText.indexOf('---',4) + 3;
			for(var i = 1; i < 10; i++) {
				if(textArr[i] == '---') break;
				let yentry = textArr[i].split(':');
				if(yentry[0] == 'title') document.getElementById('note_name').value = yentry[1].trim();
				if(yentry[0] == 'tags') tagify.addTags(yentry[1]);
				if(yentry[0] == 'author') document.getElementById('author').value = yentry[1].trim();
				if(yentry[0] == 'date') document.getElementById('date').value = yentry.slice(1).join(':').trim();
				if(yentry[0] == 'source') document.getElementById('source').value = yentry.slice(1).join(':').trim();
			}
			mde.value(pastedText.substr(cstart).trim());
		}

		if(pastedHTML) {
			var options = {
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
			var turndownService = new window.TurndownService(options);
			turndownService.keep(['kbd', 'ins']);
			mde.value(turndownService.turndown(pastedHTML));
		}
	}

    function firstNote() {
        showNote(document.getElementById('filelist').firstElementChild.classList[0]);
	}
	
	function sbfile() {
		let tags = tagify.value;
		let tArr = [];
		for (let tag in tags) {
			tArr.push(tags[tag].value);
		}

		$.ajax({
			type: 'POST',
			url: 'notes.php',
			data: {
				action: "sbfile",
				name: document.getElementById('note_name').value,
				fname: document.getElementById('fname').value,
				tags: tArr,
				content: document.getElementById('editor1').value,
			},
			success: function(response){
				if(response == '') {
					console.log('Note saved successfully');
					location.reload();
				}
				else
					alert(response);
			}
		});
	}

    function showNote(id) {
		document.querySelector('#main_area .editor-toolbar').style.display = 'none';
		if(document.getElementById('atoolbar')) document.getElementById('atoolbar').remove();
		if(document.getElementById('tbutton')) document.getElementById('tbutton').remove();

		let loader = document.createElement("div");
		loader.classList.add("db-spinner");
		loader.id = "db-spinner";
		document.getElementById("main").appendChild(loader);
		
        document.getElementById('save_button').style.display = 'none';
        var elements = document.getElementsByClassName('selected');			
        while(elements.length > 0){
            elements[0].classList.remove('selected');
        }			
        document.getElementById(id).classList.add('selected');
        window.parent.document.getElementById("editnote").classList.remove('disabled');
        window.parent.document.getElementById("deletenote").classList.remove('disabled');
        window.parent.document.getElementById("sendnote").classList.remove('disabled');
        var fname = document.getElementById('entry' + id).value;

        $.ajax({
			type: "POST",
            url: "notes.php",
            data: {
                "action": "showNote",
                "filename": fname,
                "id": id
            },
            success: function(data){
				var note = JSON.parse(data);
				if(document.getElementById('bcontent')) document.getElementById('bcontent').remove();
				document.querySelector('.EasyMDEContainer').classList.remove('EasyMDEContainerH');
				if(document.getElementById('tocdiv')) document.getElementById('tocdiv').remove();
				
                let headerTitle = document.createElement('span');
                headerTitle.id = 'headerTitle';
                headerTitle.classList.add('headerTitle');
                if(document.querySelector('#main_header #note_name')) document.querySelector('#main_header #note_name').replaceWith(headerTitle);
                document.querySelector('tags').classList.remove('edit');

                document.getElementById('headerTitle').innerText = note.notename;
				document.getElementById('fname').value = note.filename;
				document.getElementById('author').value = note.author;
				document.getElementById('date').value = note.date;
				document.getElementById('source').value = note.source;
				
                tagify.setReadonly(true);
                tagify.removeAllTags();
				tagify.addTags(note.tags);

				document.querySelector('.EasyMDEContainer').style = 'display: block;';
				document.getElementById('editor1').style = 'display none;';
				
				document.getElementById('editor1').value = note.content;
				mde.value(note.content);
				
				if(note.mime_type.substr(0, 4) == 'text') {
					if(document.getElementById('estate').value == 'e') {
						document.getElementById('estate').value = 's';
						mde.togglePreview();
						//if(mde.isPreviewActive()) mde.togglePreview();
					}
					var headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
					if(headings.length > 0) {
						let tbutton = document.createElement('button');
						tbutton.id = 'tbutton';
						tbutton.innerText = 'ToC';
						document.getElementById('main_header').appendChild(tbutton);

						let tocdiv = document.createElement('div');
						tocdiv.id = 'tocdiv';
						let o = 0;
						let a = 0;
						let list = 'c%';
						headings.forEach(function(element){
							a = element.tagName.substr(1,1);
							if(o < a) {
								list = list.replace('c%','<li><ul><li><a title="'+element.innerText+'" href="#' + element.id + '">' + element.innerText + '</a></li>c%</ul></li>');
							} else if(o > a) {
								list = list.replace('c%','</ul><li><a title="'+element.innerText+'" href="#' + element.id + '">' + element.innerText + '</a></li>c%');
							} else {
								list = list.replace('c%','<li><a title="'+element.innerText+'" href="#' + element.id + '">' + element.innerText + '</a></li>c%');
							}
							o = a;
						});
						list = list.replace('c%</ul>','');
						tocdiv.innerHTML = list;

						tbutton.addEventListener('click', function(e) {
							e.preventDefault();
							tocdiv.classList.toggle('tdhidden');
						});

						document.querySelector('.EasyMDEContainer').appendChild(tocdiv);

						document.querySelectorAll('#tocdiv a').forEach(function(elem) {
							elem.addEventListener('click', function(){
								tocdiv.classList.toggle('tdhidden');
							});
						});
					}
				} else {
					let bcontent = document.createElement('object');
					bcontent.data = 'data:' + note.mime_type + ';base64,' + note.content;
					bcontent.type = note.mime_type;
					bcontent.id = 'bcontent';
					if(note.mime_type.includes('pdf')) bcontent.style = 'width: 100%; height: 100%;';

					document.querySelector('.EasyMDEContainer').classList.add('EasyMDEContainerH');
					document.getElementById('main_area').appendChild(bcontent);
					document.getElementById('editor1').style = 'display: none';
					if(document.getElementById('atoolbar')) document.getElementById('atoolbar').remove();
				}	

				document.getElementById("db-spinner").parentNode.removeChild(loader);
            }
        });
    }

    function simage() {
        var allowed_extensions = new Array('jpg', 'jpeg', 'png');
        var file_extension = document.getElementById('localimg').value.split('.').pop().toLowerCase();
        for(var i = 0; i <= allowed_extensions.length; i++) {
            if(allowed_extensions[i]==file_extension) {
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
                        pos = mde.codemirror.getCursor();
                        mde.codemirror.setSelection(pos, pos);
                        mde.codemirror.replaceSelection('![](' + data + ')');
                    }
                });
                return true;
            }
        }
        alert('Unsupported file format');
        return false;
    }

    function saveFile(editor) {
		let loader = document.createElement("div");
		loader.classList.add("db-spinner");
		loader.id = "db-spinner";
		document.getElementById("main").appendChild(loader);

		let fname = document.getElementById('fname').value;
		let extb = fname.lastIndexOf('.') + 1;

		let tags = tagify.value;
		let tArr = [];
		for (let tag in tags) {
			tArr.push(tags[tag].value);
		}
		
		$.ajax({
			type: 'POST',
			url: 'notes.php',
			data: {
				action: "editNote",
				note_name: document.getElementById('note_name').value,
				fname: fname,
				ntags: tArr,
				editor1: mde.value(),
				ftype: fname.substr(extb),
				author: document.getElementById('author').value,
				date: document.getElementById('date').value,
				source: document.getElementById('source').value,
			},
			success: function(response){
				if(response == '') {
					console.log('Note saved successfully');
					location.reload();
				} else
					alert(response);

				loader.remove();
			}
		});
		
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
                    'action': 'uplImage',
                    'imageURL': imageURL
                }
                ,success: function(data){
                    pos = mde.codemirror.getCursor();
                    mde.codemirror.setSelection(pos, pos);
                    mde.codemirror.replaceSelection('![](' + data + ')');
                }
            });
        } else
            return false;
    }

	function searchList() {
		var input, filter, ul, li, a, i;
		input = document.getElementById('notesearch');
		filter = input.value.toUpperCase();
		ul = document.getElementById("filelist");
		li = ul.getElementsByTagName('li');

		for (i = 0; i < li.length; i++) {
			a = li[i].getElementsByTagName("a")[0];
			if (a.innerHTML.toUpperCase().indexOf(filter) > -1 ) {
				li[i].style.display = "";
			} else {
				li[i].style.display = "none";
			}
		}
	}

	firstNote();
});