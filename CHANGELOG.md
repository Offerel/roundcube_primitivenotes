### v2.1.3
- Fix auto-copy code
- Fix detect paste data
- Fix for notes folder not available

### v2.1.2
- Fix for ToC
- Fix resizing notes list

### v2.1.1
- Fix for pasting html/markdown
  
### v2.1.0
- Rewrite of most parts
- Added markdown linebreak in YAML
- set JSON response headers
- Empty start note
- Added empty line between YAML and body
- EasyMDE 2.16.1      (https://github.com/Ionaru/easy-markdown-editor)
- Highlight.js 11.5.1 (https://highlightjs.org/)
- Tagify 4.13.1       (https://github.com/yairEO/tagify)
- Turndown 7.1.1      (https://github.com/mixmark-io/turndown)
 
### v2.0.6
- Added contextmenu
- Updated easyMDE to v2.14.0
- Updated tagify to v3.22.3
- Fixed tag tooltips
- Fixed error message with empty noteslist
- Removed fontawesome
- Simplified path configuration

### v2.0.5
- Added function to change YAML metadata
- YAML holds now date(created) and updated dates
- Updated tagify to v3.22.2

### v2.0.4
- Fix pasting markdown and html
- Add pasting of images (with autoupload)

### v2.0.3
- Fixed an issue, where links are converted wrong

### v2.0.2
- Added option button to jump directly to plugin options (thanks to Aleksander Machniak)
- Added function to paste selected text from browser, converted automatically to Markdown with [Turndown](https://github.com/domchristie/turndown)
- Added support for Markdownload [Browser Extension](https://github.com/deathau/markdownload)
  - YAML header autofills all supported fields (title, author, date, source and more)

### v2.0.1
- Remove ToC button in edit mode
- Fix for creating new notes	s
  
### v2.0.0
- Added loader animation
- Added option to remove media
- Added Option to disable displayed formats
- Added automatic ToC creation
- Replaced tag library with [tagify v3.22.1](https://github.com/yairEO/tagify)
- Removed HTML Format
- Reduced http requests to speed up
- Fixed empty response when delete a note
  
### v1.5.8
- Changed Markdown Editor to [EasyMD v2.13.0](https://github.com/ionaru/easy-markdown-editor)
- Removed rarely used code styles
  
### v1.5.7
- Fix for #36
- Updated textext to 1.3.2 [textext Fork](https://github.com/gfunkmonk/jquery-textext)
- Updated highlight to 10.5.0 [Highlight.js](https://www.npmjs.com/package/highlight.js)
  
### v1.5.6
- Fix for searchbar css
- Fix for not visible save button
  
### v1.5.5
- Added Preferences Page
- Removed refresh when plugin is active
  
### v1.5.4
- Added support for Roundcube 1.4 RC2
- Added better changelog
  
### v1.5.3
- Fix for 1f94add0746281896f3b2153213fd5182fb3c8f8
  
### v1.5.2
- fixed rename issue
  
### v1.5.1
- Added Russian Translation (Many thx to allexnew)
- Added warning, if NULL Notes are found in the configured directory
- fixed setting not the correct TXT Format and save button

### v1.5.0
- added config variable for media folder
- removed base64 image functions
- and replaced them with gd functions to speed up performance
- function to link embedded binary files like PDF
- fixed some css

### v1.4.2
- added error message, if a note cant be deleted
- fixed image function for markdown files
- fixed some markdown css code
- other bugfixes

### v1.4.1
- fix for YAML frontmatter header
- removed support for ckeditor
- updated markdown editor
- updated marked

### v1.4.0
- Elastic Skin and RC 1.4 RC1
  
### v1.3.4
- Support for elastic skin

### v1.3.2
- the date in the YAML header is now using a locale aware date format. Make sure that the correct locale is set in your php setup.
- 
### v1.3.1
- fix for wrong eMail subject

### v1.3.0
* added support for yaml header
* added yaml script for QOwnNotes
* changed markdown editor to [inscryb-markdown-editor](https://github.com/Inscryb/inscryb-markdown-editor)
* fixed some small bugs
* css fixes

### v1.2.2
 - Added dragable splitter.

### v1.2.1
 - Added check for trailing slash in paths.

### v1.2.0
 - Added a new tagging system. Tags are suggested from all previous entered tags. Tags for every note are unique.

### v1.1.1
 - Fix for button sometimes disabled in taskbar

### v1.1.0
 - Only supported formats are displayed
 - New drop-down menu for "New" command with option to select other supported formats
 - When clicking on the "New" button itself, the standard format is used
 - Ability to set the default format in config.in.php, if this isnt set, HTML is used
 - CSS tweaked little bit
 - Markdown toolbar adapted and extended

### v1.0.1
 - Fix for saving binary files

### v1.1.0
 - Several speed-up improvements are done with ajax requests.
 - Additionally, you can now choose between CKEditor and the TinyMCE build-in to Roundcube.

### v0.0.9
 - Initial version, converted from a standalone app to a Roundcube plugin