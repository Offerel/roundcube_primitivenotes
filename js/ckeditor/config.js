/**
 * @license Copyright (c) 2003-2017, CKSource - Frederico Knabben. All rights reserved.
 * For licensing, see LICENSE.md or http://ckeditor.com/license
 */

CKEDITOR.editorConfig = function( config ) {
	config.toolbarCanCollapse = false;
	config.skin = 'moono-lisa';
	config.fullPage = true;
	config.allowedContent =
    'h1 h2 h3 h4 p blockquote strong em pre code table thead tbody th tr td del p ol ul li b i u br hr kbd strike;' +
    'a[!href];' +
    'img[!src,alt,title];';
	
	config.extraAllowedContent = 'kbd';
	config.removeFormatTags = '';
	config.removeFormatAttributes = '';
	
	config.extraPlugins = 'basicstyles,markdown,format,find,blockquote,';
	//config.removePlugins = 'markdown,richcombo';

	config.toolbar = [
		{ name: 'document', items: [ 'Save', 'DocProps', '-', 'Undo', 'Redo', 'PasteText','-', 'Bold', 'Italic', 'Underline', 'Strike', 'RemoveFormat', '-', 'Format', 'BulletedList', 'NumberedList', 'Blockquote', '-', 'Link', 'Unlink', 'Table', 'base64image', '-', 'Source', 'Markdown', 'Find','Replace','Maximize' ] }
	];
};
