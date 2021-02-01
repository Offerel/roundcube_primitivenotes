### v2.0.0
- Added loader animation
- Add option to remove media
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