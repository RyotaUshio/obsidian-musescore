# MuseScore integration plugin for Obsidian

This is an [Obsidian.md](https://obsidian.md) plugin for embedding sheet music created by [MuseScore](https://musescore.org) in your notes.
MuseScore is a free, open-source music notation application. This plugin allows you to embed MuseScore's native .mscz/.mscx files directly in your markdown/canvas files with the standard syntax `![[Your sheet music.mscz]]` without having to manually export them into another file format that Obsidian recognizes natively like PDF, PNG, or SVG.

This works by **auto-exporting** into PDF. Whenever a MuseScore file inside your vault is newly created or modified, this plugin automatically converts it into PDF using the [command-line interface](https://musescore.org/en/handbook/4/command-line-usage) of MuseScore.
Then, if an .mscz file is embedded, this plugin tells Obsidian to display the corresponding PDF file instead.

In addition to PDF, this plugin also supports using the [MusicXML](https://www.musicxml.com) format if you have the [OSMD MusicXML Viewer plugin](https://github.com/RyotaUshio/obsidian-osmd-musicxml) installed (that's another plugin by me).
By using MusicXML, you can further control the rendering behavior. For example, you can embed only the first two bars of a song by `![[song.mscz#bar=1-2]]`. See the documentation of the OSMD MusicXML Viewer plugin for more details.
However, that plugin is still in the early development phase, and embedding as MusicXML is typically way slower than embedding as PDF. For the time being, I'd recommend sticking to PDF.

Note:

- Before being able to use this plugin, you have to go to the plugin settings, provide the MuseScore executable path (see [below](#faqs) for some instructions) and then restart Obsidian.
- Auto-export typically takes from a few seconds to ten seconds for each MuseScore file.
- This plugin targets MuseScore files **inside the vault** only and does not handle ones outside the vault. You might want to change MuseScore's default save location (MuseScore > Preferences > Folders > Scores).
- Auto-export works only on desktop. On mobile, however, the embedding feature will still work as long as the exported files (PDF/MusicXML) are synced with the desktop (e.g. using Obsidian sync or iCloud sync).
- This plugin is tested with MuseScore 4. It is likely to be compatible with Version 3 too, but I haven't tested it yet.

## Installation

This plugin is in beta. You can install it using [BRAT](https://github.com/TfTHacker/obsidian42-brat).

## FAQs

- Where do I find the path of the MuseScore executable?
  - It depends on which operation system you are on. See the following pages in the MuseScore handbook: [Command line usage](https://musescore.org/ja/node/329750) & [Revert to factory settings - Via command line](https://musescore.org/ja/%E3%83%8F%E3%83%B3%E3%83%89%E3%83%96%E3%83%83%E3%82%AF/revert-factory-settings#Via_command_line).

## Support development

If you find my plugins useful, please support my work to ensure they continue to work!

<a href="https://github.com/sponsors/RyotaUshio" target="_blank"><img src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86" alt="GitHub Sponsors" style="width: 180px; height:auto;"></a>

<a href="https://www.buymeacoffee.com/ryotaushio" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="width: 180px; height:auto;"></a>

<a href='https://ko-fi.com/E1E6U7CJZ' target='_blank'><img height='36' style='border:0px; width: 180px; height:auto;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
