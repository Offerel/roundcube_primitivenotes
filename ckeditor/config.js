/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	config.toolbarCanCollapse = false;
	config.skin = 'moono-lisa';
	config.fullPage = true;
	config.allowedContent = true;
	
	config.extraPlugins = 'find,font,justify,bidi,blockquote,colorbutton,';

	//,font,justify,bidi,blockquote,colorbutton
	config.toolbar = [
		{ name: 'document', items: [ 'Save', 'DocProps', '-', 'Undo', 'Redo', 'PasteText','-', 'Bold', 'Italic', 'Underline', 'RemoveFormat', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock', '-', 'BulletedList','NumberedList', 'Outdent', 'Indent', 'BidiLtr', 'BidiRtl', 'Blockquote', '-', 'TextColor', 'BGColor', '-', 'Font', 'FontSize', '-', 'Link', 'Unlink', 'Table', 'base64image', '-', 'Source', 'Find','Replace','Maximize' ] }
	];
};
