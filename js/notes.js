/**
 * Roundcube Notes Plugin
 *
 * @version 2.0.7
 * @author Offerel
 * @copyright Copyright (c) 2021, Offerel
 * @license GNU General Public License, version 3
 */
$(document).ready(function(){
	var tagify = new Tagify(document.getElementById('ntags'), {
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

	var editor1 = document.getElementById("editor1");

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
        element: editor1,
        autoDownloadFontAwesome: false,
		autofocus: true,
		previewImagesInEditor: false,
        spellChecker: false,
        autofocus: true,
        status: false,
		promptURLs: true,
		inputStyle: 'contenteditable',
		nativeSpellcheck: true,
		forceSync: false,
		sideBySideFullscreen: false,
        renderingConfig: {
			codeSyntaxHighlighting: true,
			sanitizerFunction: function(renderedHTML) {
				let output = renderedHTML.replaceAll(media_folder,'notes.php?blink=');
				return output;
			},
        },
        toolbar: 	[{ name: 'Save',
						action: saveFile,
                        title: 'Save',
						icon: '<svg viewBox="0 0 24 24" style="width: 18px"><path fill="currentColor" d="M15 9H5V5h10m-3 14a3 3 0 0 1-3-3 3 3 0 0 1 3-3 3 3 0 0 1 3 3 3 3 0 0 1-3 3m5-16H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4Z"></path></svg>',
                    }, '|',
					{
						name: 'Bold',
						action: EasyMDE.toggleBold,
						title: 'Bold',
						icon: '<svg style="width:20px;height:20px" viewBox="0 0 24 24"><path fill="currentColor" d="M13.5,15.5H10V12.5H13.5A1.5,1.5 0 0,1 15,14A1.5,1.5 0 0,1 13.5,15.5M10,6.5H13A1.5,1.5 0 0,1 14.5,8A1.5,1.5 0 0,1 13,9.5H10M15.6,10.79C16.57,10.11 17.25,9 17.25,8C17.25,5.74 15.5,4 13.25,4H7V18H14.04C16.14,18 17.75,16.3 17.75,14.21C17.75,12.69 16.89,11.39 15.6,10.79Z" /></svg>'
					}, {
						name: 'Italic',
						action: EasyMDE.toggleItalic,
						title: 'Italic',
						icon: '<svg style="width:20px;height:20px" viewBox="0 0 24 24"><path fill="currentColor" d="M10,4V7H12.21L8.79,15H6V18H14V15H11.79L15.21,7H18V4H10Z" /></svg>'
					}, 
					{
						name: 'Striketrough',
						title: 'Striketrough',
						action: EasyMDE.toggleStrikethrough,
						icon: '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" fill="currentColor" width="18px" height="18px"><g><rect fill="none" height="24" width="24"/></g><g><g><g><path d="M6.85,7.08C6.85,4.37,9.45,3,12.24,3c1.64,0,3,0.49,3.9,1.28c0.77,0.65,1.46,1.73,1.46,3.24h-3.01 c0-0.31-0.05-0.59-0.15-0.85c-0.29-0.86-1.2-1.28-2.25-1.28c-1.86,0-2.34,1.02-2.34,1.7c0,0.48,0.25,0.88,0.74,1.21 C10.97,8.55,11.36,8.78,12,9H7.39C7.18,8.66,6.85,8.11,6.85,7.08z M21,12v-2H3v2h9.62c1.15,0.45,1.96,0.75,1.96,1.97 c0,1-0.81,1.67-2.28,1.67c-1.54,0-2.93-0.54-2.93-2.51H6.4c0,0.55,0.08,1.13,0.24,1.58c0.81,2.29,3.29,3.3,5.67,3.3 c2.27,0,5.3-0.89,5.3-4.05c0-0.3-0.01-1.16-0.48-1.94H21V12z"/></g></g></g></svg>'
					},
					{
						name: 'Clean block',
						title: 'Clean block',
						action: EasyMDE.cleanBlock,
						icon: '<svg style="width: 18px;height: 18px;" viewBox="0 0 24 24"><path fill="currentColor" d="M16.24,3.56L21.19,8.5C21.97,9.29 21.97,10.55 21.19,11.34L12,20.53C10.44,22.09 7.91,22.09 6.34,20.53L2.81,17C2.03,16.21 2.03,14.95 2.81,14.16L13.41,3.56C14.2,2.78 15.46,2.78 16.24,3.56M4.22,15.58L7.76,19.11C8.54,19.9 9.8,19.9 10.59,19.11L14.12,15.58L9.17,10.63L4.22,15.58Z"></path></svg>'
					}, '|', 
					{
						name: 'Heading',
						title: 'Heading',
						action: EasyMDE.toggleHeading1,
						icon: '<svg style="width: 20px;height: 20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M5,4V7H10.5V19H13.5V7H19V4H5Z"></path></svg>'
					}, '|',
                    {
						name: 'Code',
						title: 'Code',
						action: EasyMDE.toggleCodeBlock,
						icon: '<svg style="width: 20px;height: 20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M14.6,16.6L19.2,12L14.6,7.4L16,6L22,12L16,18L14.6,16.6M9.4,16.6L4.8,12L9.4,7.4L8,6L2,12L8,18L9.4,16.6Z"></path></svg>'
					}, 
					{
						name: 'Quote',
						title: 'Quote',
						action: EasyMDE.toggleBlockquote,
						icon: '<svg style="width: 20px;height: 20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M10,7L8,11H11V17H5V11L7,7H10M18,7L16,11H19V17H13V11L15,7H18Z"></path></svg>'
					}, 
					{
						name: 'List',
						title: 'List',
						action: EasyMDE.toggleUnorderedList,
						icon: '<svg style="width: 20px;height: 20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z"></path></svg>',
						children: [
							{
								name: 'Generic List',
								title: 'Generic List',
								action: EasyMDE.toggleUnorderedList,
								icon: '<svg style="width: 20px;height: 20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M7,5H21V7H7V5M7,13V11H21V13H7M4,4.5A1.5,1.5 0 0,1 5.5,6A1.5,1.5 0 0,1 4,7.5A1.5,1.5 0 0,1 2.5,6A1.5,1.5 0 0,1 4,4.5M4,10.5A1.5,1.5 0 0,1 5.5,12A1.5,1.5 0 0,1 4,13.5A1.5,1.5 0 0,1 2.5,12A1.5,1.5 0 0,1 4,10.5M7,19V17H21V19H7M4,16.5A1.5,1.5 0 0,1 5.5,18A1.5,1.5 0 0,1 4,19.5A1.5,1.5 0 0,1 2.5,18A1.5,1.5 0 0,1 4,16.5Z"></path></svg>'
							},{
								name: 'Numbered List',
								title: 'Numbered List',
								action: EasyMDE.toggleOrderedList,
								icon: '<svg style="width: 20px;height: 20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M7,13V11H21V13H7M7,19V17H21V19H7M7,7V5H21V7H7M3,8V5H2V4H4V8H3M2,17V16H5V20H2V19H4V18.5H3V17.5H4V17H2M4.25,10A0.75,0.75 0 0,1 5,10.75C5,10.95 4.92,11.14 4.79,11.27L3.12,13H5V14H2V13.08L4,11H2V10H4.25Z"></path></svg>'
							}
						]
					},
					'|',
                    {
						name: 'Link',
						title: 'Create Link',
						action: EasyMDE.drawLink,
						icon: '<svg style="width:20px;height:20px" viewBox="0 0 24 24"><path fill="currentColor" d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z" /></svg>'
					}, 
                    { 
						name: 'Image',
						title: 'Image',
                        icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"></path><path d="M23 18V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zM8.5 12.5l2.5 3.01L14.5 11l4.5 6H5l3.5-4.5z"></path></svg>',
						children: [
							{
								name: 'RImage',
								title: 'Add image from URL',
								action: uplInsertImage,
								icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"></path><path d="M23 18V6c0-1.1-.9-2-2-2H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zM8.5 12.5l2.5 3.01L14.5 11l4.5 6H5l3.5-4.5z"></path></svg>',
							},
							{
								name: 'LImage',
								title: 'Upload and insert local image',
								action: uplLocalImage,
								icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"></path><path d="M19 7v2.99s-1.99.01-2 0V7h-3s.01-1.99 0-2h3V2h2v3h3v2h-3zm-3 4V8h-3V5H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-8h-3zM5 19l3-4 2 3 3-4 4 5H5z"></path></svg>'
							}
						]
                    },
                    {
						name: 'Table',
						title: 'Insert table',
						action: EasyMDE.drawTable,
						icon: '<svg style="width: 18px;height: 20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M4,3H20A2,2 0 0,1 22,5V20A2,2 0 0,1 20,22H4A2,2 0 0,1 2,20V5A2,2 0 0,1 4,3M4,7V10H8V7H4M10,7V10H14V7H10M20,10V7H16V10H20M4,12V15H8V12H4M4,20H8V17H4V20M10,12V15H14V12H10M10,20H14V17H10V20M20,20V17H16V20H20M20,12H16V15H20V12Z"></path></svg>'
					}, '|',
                    {
						name: 'Preview',
						title: 'Toggle Preview',
						action: EasyMDE.togglePreview,
						icon: '<svg style="width: 20px;height: 20px;" viewBox="0 0 24 24"><path fill="currentColor" d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z"></path></svg>'
					}, 
					{
						name: 'SideBySide',
						title: 'Toggle Side by Side',
						action: EasyMDE.toggleSideBySide,
						icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18px" height="18px"><path d="M-74 29h48v48h-48V29zM0 0h24v24H0V0zm0 0h24v24H0V0z" fill="none"></path><path d="M13 12h7v1.5h-7zm0-2.5h7V11h-7zm0 5h7V16h-7zM21 4H3c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 15h-9V6h9v13z"></path></svg>'
					},
					{
						name: 'Guide',
						title: 'Markdown Guide',
						action: 'https://www.markdownguide.org/basic-syntax/',
						icon: '<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" viewBox="0 0 24 24" fill="currentColor" width="18px" height="18px"><g><rect fill="none" height="24" width="24"></rect><path d="M19,3H5C3.9,3,3,3.9,3,5v14c0,1.1,0.9,2,2,2h14c1.1,0,2-0.9,2-2V5C21,3.9,20.1,3,19,3z M12.01,18 c-0.7,0-1.26-0.56-1.26-1.26c0-0.71,0.56-1.25,1.26-1.25c0.71,0,1.25,0.54,1.25,1.25C13.25,17.43,12.72,18,12.01,18z M15.02,10.6 c-0.76,1.11-1.48,1.46-1.87,2.17c-0.16,0.29-0.22,0.48-0.22,1.41h-1.82c0-0.49-0.08-1.29,0.31-1.98c0.49-0.87,1.42-1.39,1.96-2.16 c0.57-0.81,0.25-2.33-1.37-2.33c-1.06,0-1.58,0.8-1.8,1.48L8.56,8.49C9.01,7.15,10.22,6,11.99,6c1.48,0,2.49,0.67,3.01,1.52 C15.44,8.24,15.7,9.59,15.02,10.6z"></path></g></svg>'
					}, 
					{ 
						name: 'Meta',
						action: togglemData,
						title: 'Display Metadata',
						icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18px" height="18px"><path d="M0 0h24v24H0z" fill="none"></path><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>'
					}, '|'
					],
	});

	document.querySelectorAll('#filelist li a').forEach(function(note){
		note.addEventListener('click',function(){
			showNote(note.parentElement.id);
			tagify.setReadonly(true);
		});
	});

    window.addEventListener('message', (e) => {
        let estate = document.getElementById('estate');
		let ntags = document.getElementById('ndata');
		if('tstate' in e.data) tagify.setReadonly(e.data.tstate);
        if('ttags' in e.data && e.data.ttags == '') tagify.removeAllTags({
			withoutChangeEvent: true
		 });

		document.getElementById('author').removeAttribute('readonly');
		document.getElementById('source').removeAttribute('readonly');
		document.getElementById('source').style = 'cursor: inherit';
		ntags.style = "top: 21px;";
		document.getElementById('hd').style = 'display: none;';

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
			} else {
				let toolbar = document.createElement('div');
				toolbar.id = 'atoolbar';
				let bSave = document.createElement('li');
				bSave.id = 'bSave';
				let xmlns = "http://www.w3.org/2000/svg";
				let svgButton = document.createElementNS(xmlns, 'svg');
				svgButton.setAttributeNS(null, "viewBox", '0 0 24 24');
				svgButton.setAttributeNS(null, "width", '18px');
				svgButton.setAttributeNS(null, "height", '18px');
				svgButton.setAttributeNS(null, "fill", 'currentColor');
				let path = document.createElementNS(xmlns, 'path');
				path.setAttributeNS(null, 'd', 'M0 0h24v24H0z');
				path.setAttributeNS(null, 'fill', 'none');
				svgButton.appendChild(path);
				let path2 = document.createElementNS(xmlns, 'path');
				path2.setAttributeNS(null, 'd', 'M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z');
				svgButton.appendChild(path2);
				bSave.addEventListener('click', sbfile, false);
				bSave.appendChild(svgButton);
				toolbar.appendChild(bSave);
				let bSeperator = document.createElement('i');
				bSeperator.classList.add("separator");
				toolbar.appendChild(bSeperator);
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
					let xmlns = "http://www.w3.org/2000/svg";
					let svgButton = document.createElementNS(xmlns, 'svg');
					svgButton.setAttributeNS(null, "viewBox", '0 0 24 24');
					svgButton.setAttributeNS(null, "width", '18px');
					svgButton.setAttributeNS(null, "height", '18px');
					svgButton.setAttributeNS(null, "fill", 'currentColor');
					let path = document.createElementNS(xmlns, 'path');
					path.setAttributeNS(null, 'd', 'M0 0h24v24H0z');
					path.setAttributeNS(null, 'fill', 'none');
					svgButton.appendChild(path);
					let path2 = document.createElementNS(xmlns, 'path');
					path2.setAttributeNS(null, 'd', 'M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z');
					svgButton.appendChild(path2);
					bSave.addEventListener('click', sbfile, false);
					bSave.appendChild(svgButton);
					toolbar.appendChild(bSave);
					let bSeperator = document.createElement('i');
					bSeperator.classList.add("separator");
					toolbar.appendChild(bSeperator);

					if(document.getElementById('cdiv')) 
						document.getElementById('cdiv').appendChild(toolbar);
					else {
						toolbar.style = 'top: 88px;';
						document.getElementById('main_area').parentNode.insertBefore(toolbar,  document.getElementById('main_area'));
					}

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

	document.querySelector('.EasyMDEContainer').addEventListener('paste', pasteParse, true);

	document.getElementById('source').addEventListener('click', osource, true);

	let tooltips = document.querySelectorAll('#filelist li span.taglist');
	document.addEventListener('mousemove', evt => {
		let x = evt.clientX + 10 + 'px';
		let y = evt.clientY - 25 + 'px';
		for (var i = 0; i < tooltips.length; i++) {
			tooltips[i].style.top = y;
			tooltips[i].style.left = x;
		}
	});

	function osource() {
		let source = document.getElementById('source');
		if(source.readOnly && source.value.length > 1) {
			let tget = window.open(source.value, '_blank');
			tget.focus();
		}
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
				let loader = document.createElement("div");

				loader.classList.add("db-spinner");
				loader.id = "db-spinner";
				document.getElementById("main").appendChild(loader);

				uploadFile(item.getAsFile(), alt, title);
				return false;
			}
		}

		function uploadFile(file, alt, title) {
			var xhr = new XMLHttpRequest();
			xhr.onload = function() {
				if (xhr.status == 200) {
					if(title) title = ' "'+title+'"';
					mde.codemirror.replaceSelection('!['+alt+']('+xhr.responseText+title+')');
					document.getElementById("db-spinner").remove();
				} else {
					console.error("Error! Upload failed");
				}
			};
		
			xhr.onerror = function() {
				console.error("Error! Upload failed. Can not connect to server.");
			};
		
			var formData = new FormData();
			formData.append("localFile", file);
			xhr.open('POST', 'notes.php', true);
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
				if(yentry[0] == 'title') document.getElementById('note_name').value = yentry[1].trim();
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

    function firstNote() {
		document.querySelector('tags').classList.add('edit');

		let nname = document.createElement('input');
		nname.id = 'note_name';
		nname.name = nname.id;
		nname.type = 'text';
		nname.style = 'font-size: 2em';
		nname.required = true;
		nname.value = '';

		document.getElementById("headerTitle").replaceWith(nname);
		document.getElementById("note_name").replaceWith(nname);
		document.getElementById('hd').style = 'display: none;';
		document.getElementById("note_name").placeholder = "Enter title";
	}

	function togglemData() {
		document.getElementById('ndata').classList.toggle('mtoggle');
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
					console.info('Note saved successfully');
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
		if(document.getElementById('cdiv')) document.getElementById('cdiv').remove();
		if(document.getElementById('tbutton')) document.getElementById('tbutton').remove();

		document.getElementById('ndata').classList.remove('mtoggle');
		document.getElementById('author').setAttribute('readonly', true);
		document.getElementById('date').setAttribute('readonly', true);
		document.getElementById('source').setAttribute('readonly', true);
		document.getElementById('ndata').style = "top: -22px;";
		document.getElementById('hd').style = 'display: block;';

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

		let xhr = new XMLHttpRequest();
		let formData = 'action=showNote&filename='+fname+'&id='+id;
		xhr.open('POST', 'notes.php', true);
		xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		xhr.onload = function() {
			if (xhr.status == 200) {
				let data = xhr.responseText;
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
				document.getElementById('updated').value = note.updated;
				document.getElementById('ntags').value = note.tags;

				let source = document.getElementById('source');
				source.value = note.source;
				source.style = (source.value.length > 1) ? "cursor: pointer;":"cursor: inherit;";
				
				tagify.setReadonly(true);
				tagify.loadOriginalValues();

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

					let cdiv = document.createElement('div');
					cdiv.id = 'cdiv';
					cdiv.appendChild(bcontent);

					document.querySelector('.EasyMDEContainer').classList.add('EasyMDEContainerH');
					document.getElementById('main_area').appendChild(cdiv);
					document.getElementById('editor1').style = 'display: none';
					if(document.getElementById('atoolbar')) document.getElementById('atoolbar').remove();
				}
				document.getElementById("db-spinner").parentNode.removeChild(loader);
			}
		};
		xhr.onerror = function(e) {
			console.error("Error! Unable to connect to server" + e);
		};
		xhr.send(formData);
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
					console.info('Note saved successfully');
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