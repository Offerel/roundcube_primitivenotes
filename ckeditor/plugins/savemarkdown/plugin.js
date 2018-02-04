/**
 * By SMRSAN
 * Github Repo:
 * https://github.com/smrsan76/CKEditor-Save-Markdown-Plugin
 */

/**
 * @fileOverview The Save-Markdown plugin.
 */

( function() {

    var pluginName = 'savemarkdown';
	var saveCmd = {
		readOnly: 1,
		modes: { wysiwyg: 1,source: 1 },

		exec: function( editor ) {
			if ( editor.fire( 'save' ) ) {

				var $form = editor.element.$.form;
                var form_copy = document.createElement("form");
                form_copy.setAttribute( "style", "display: none !important;visibility: hidden !important" );

				var body = document.getElementsByTagName("body")[0];
                var rootPath = CKEDITOR.basePath + "plugins/" + pluginName + "/";
                var htmlData = editor.getData(1).replace(/(\r\n|\n|\r)/gm,""); // remove all linebreaks to prevent some parsing issues

                convertToMarkdown(htmlData)
					.then(function(markdownData){

						if( $form ){

							var form_copy_forbiddenAttrs = [
								"class",
								"id",
								"style"
							];

							// Copy All Attributes
							for(var i=0; i<$form.attributes.length; i++){
								var thisAttr = $form.attributes[i];
								if( form_copy_forbiddenAttrs.indexOf( thisAttr.name ) !== -1 )
									continue;
								form_copy.setAttribute( thisAttr.name, thisAttr.value );
							}

							// Copy All Input Elements
							for(var i=0; i<$form.elements.length; i++){
								var thisElem = $form.elements[i].cloneNode();
								if( thisElem.getAttribute("id") === editor.name ){
                                    thisElem.setAttribute( "id", "" );
                                    thisElem.value = markdownData;
                                    thisElem.innerHTML = markdownData;
								}
								form_copy.appendChild(thisElem);
							}

							body.appendChild(form_copy); // Append The Copied Form to Body

                            // Submit The Copied Form
                            try {
                                form_copy.submit();
                            } catch ( e ) {
                                // If there's a button named "submit" then the form.submit
                                // function is masked and can't be called in IE/FF, so we
                                // call the click() method of that button.
                                if ( form_copy.submit.click )
                                    form_copy.submit.click();
                            }

						}

					}).then(function(){ body.removeChild(form_copy) });

                /*
                 *  HTML to MARKDOWN converter
                 *  @param (htmlData) It's a string
                 *	@return A promise that resolves with a passed markdownData argument
                 */
				function convertToMarkdown(htmlData){
                	return new Promise(function(resolve){
                        // Convert htmlData to Markdown.
                        if (typeof(toMarkdown) === 'undefined') {
                        	console.log(rootPath + 'js/to-markdown.js');
                            CKEDITOR.scriptLoader.load(rootPath + 'js/to-markdown.js', function() {
                            	resolve(toMarkdown(htmlData));
                            });
                        } else {
                        	resolve(toMarkdown(htmlData));
                        }
					});
				}// END convertToMarkdown()

			}
		}
	};

	// Register a plugin named "save".
	CKEDITOR.plugins.add( pluginName, {
		// jscs:disable maximumLineLength
		lang: 'af,ar,az,bg,bn,bs,ca,cs,cy,da,de,de-ch,el,en,en-au,en-ca,en-gb,eo,es,es-mx,et,eu,fa,fi,fo,fr,fr-ca,gl,gu,he,hi,hr,hu,id,is,it,ja,ka,km,ko,ku,lt,lv,mk,mn,ms,nb,nl,no,oc,pl,pt,pt-br,ro,ru,si,sk,sl,sq,sr,sr-latn,sv,th,tr,tt,ug,uk,vi,zh,zh-cn', // %REMOVE_LINE_CORE%
		// jscs:enable maximumLineLength
		icons: 'savemarkdown', // %REMOVE_LINE_CORE%
		hidpi: true, // %REMOVE_LINE_CORE%
		init: function( editor ) {
			// Save plugin is for replace mode only.
			if ( editor.elementMode != CKEDITOR.ELEMENT_MODE_REPLACE )
				return;

			var command = editor.addCommand( pluginName, saveCmd );
			command.startDisabled = !( editor.element.$.form );

			editor.ui.addButton && editor.ui.addButton( 'SaveMarkdown', {
				label: editor.lang.savemarkdown.toolbar,
				command: pluginName,
				toolbar: 'document,10'
			} );
		}
	} );

} )();

/**
 * Fired when the user clicks the Save button on the editor toolbar.
 * This event allows to overwrite the default Save button behavior.
 *
 * @since 4.7.3
 * @event save
 * @member CKEDITOR.editor
 * @param {CKEDITOR.editor} editor This editor instance.
 */
