# PrimitiveNotes Plugin (Roundcube)
This is a very simple notes plugin for Roundcube. Primarily notes in HTML format but also images (jpg) and PDF files are supported. The files are stored in a compatible format to TagSpaces, so that you can transfer these notes directly. 

# History
Originally, the idea for a standalone note app came from that I wanted to separate my notes from Evernote. Afterwards I ended up at TagSpaces. As TagSpace was too slow and extensive for me personally, I decided to develop my own app. This resulted in a standalone project and now this plugin for Roundcube.

# Changelog
**v0.0.9**
 - Initial version, converted from a standalone app to a Roundcube plugin
 
# Installation
1. Extract the downloaded archive into Roundcube’s plugin directory `<roundcube>/plugins/` and rename it to `primitivenotes`.
2. Activate the plugin in /config/config.inc.php in the way that you add it to the active plugins array, like $config['plugins'] = array('primitivenotes');

# Remarks
- Markdown is currently only half-heartedly supported because I haven't found a suitable editor yet. I have several candidates, but they still need to be adapted.
