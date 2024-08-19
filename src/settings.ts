import { EXPORT_EXTENSIONS } from './main';
import { PluginSettingTab, Setting } from 'obsidian';
import MuseScorePlugin from 'main';


export interface MuseScoreSettings {
	folderPath: string;
	executablePath: string;
	embedAs: keyof typeof EMBED_METHODS;
	embedSubpathAs: keyof typeof EMBED_METHODS;
}

export const DEFAULT_SETTINGS: MuseScoreSettings = {
	folderPath: 'MuseScore exports',
	executablePath: '',
	embedAs: 'pdf',
	embedSubpathAs: 'mxl',
};

const EMBED_METHODS: Record<typeof EXPORT_EXTENSIONS[number], string> = {
	'pdf': 'PDF',
	'mxl': 'MusicXML',
} as const;

// Inspired by https://stackoverflow.com/a/50851710/13613783
export type KeysOfType<Obj, Type> = NonNullable<{ [k in keyof Obj]: Obj[k] extends Type ? k : never }[keyof Obj]>;


export class MuseScoreSettingTab extends PluginSettingTab {
	constructor(public plugin: MuseScorePlugin) {
		super(plugin.app, plugin);
	}

	addSetting() {
		return new Setting(this.containerEl);
	}

	addHeading(heading: string) {
		return this.addSetting().setName(heading).setHeading();
	}

	addTextSetting(settingName: KeysOfType<MuseScoreSettings, string>) {
		return this.addSetting()
			.addText((text) => {
				text.setValue(this.plugin.settings[settingName])
					.setPlaceholder(DEFAULT_SETTINGS[settingName])
					.onChange(async (value) => {
						// @ts-ignore
						this.plugin.settings[settingName] = value;
						await this.plugin.saveSettings();
					});
			});
	}

	addNumberSetting(settingName: KeysOfType<MuseScoreSettings, number>) {
		return this.addSetting()
			.addText((text) => {
				text.setValue('' + this.plugin.settings[settingName])
					.setPlaceholder('' + DEFAULT_SETTINGS[settingName])
					.then((text) => text.inputEl.type = "number")
					.onChange(async (value) => {
						// @ts-ignore
						this.plugin.settings[settingName] = value === '' ? DEFAULT_SETTINGS[settingName] : +value;
						await this.plugin.saveSettings();
					});
			});
	}

	addToggleSetting(settingName: KeysOfType<MuseScoreSettings, boolean>, extraOnChange?: (value: boolean) => void) {
		return this.addSetting()
			.addToggle((toggle) => {
				toggle.setValue(this.plugin.settings[settingName])
					.onChange(async (value) => {
						// @ts-ignore
						this.plugin.settings[settingName] = value;
						await this.plugin.saveSettings();
						extraOnChange?.(value);
					});
			});
	}

	addDropdownSetting(settingName: KeysOfType<MuseScoreSettings, string>, options: readonly string[], display?: (option: string) => string, extraOnChange?: (value: string) => void): Setting;
	addDropdownSetting(settingName: KeysOfType<MuseScoreSettings, string>, options: Record<string, string>, extraOnChange?: (value: string) => void): Setting;
	addDropdownSetting(settingName: KeysOfType<MuseScoreSettings, string>, ...args: any[]) {
		let options: string[] = [];
		let display = (optionValue: string) => optionValue;
		let extraOnChange = (value: string) => { };
		if (Array.isArray(args[0])) {
			options = args[0];
			if (typeof args[1] === 'function') display = args[1];
			if (typeof args[2] === 'function') extraOnChange = args[2];
		} else {
			options = Object.keys(args[0]);
			display = (optionValue: string) => args[0][optionValue];
			if (typeof args[1] === 'function') extraOnChange = args[1];
		}
		return this.addSetting()
			.addDropdown((dropdown) => {
				for (const option of options) {
					const displayName = display(option) ?? option;
					dropdown.addOption(option, displayName);
				}
				dropdown.setValue(this.plugin.settings[settingName])
					.onChange(async (value) => {
						// @ts-ignore
						this.plugin.settings[settingName] = value;
						await this.plugin.saveSettings();
						extraOnChange?.(value);
					});
			});
	}

	addSliderSetting(settingName: KeysOfType<MuseScoreSettings, number>, min: number, max: number, step: number) {
		return this.addSetting()
			.addSlider((slider) => {
				slider.setLimits(min, max, step)
					.setValue(this.plugin.settings[settingName])
					.setDynamicTooltip()
					.onChange(async (value) => {
						// @ts-ignore
						this.plugin.settings[settingName] = value;
						await this.plugin.saveSettings();
					});
			});
	}

	display(): void {
		this.containerEl.empty();

		this.addTextSetting('executablePath')
			.setName('MuseScore executable path')
			.setDesc('The path to the MuseScore executable. Restart Obsidian after changing this field. See README for more info.');
		this.addTextSetting('folderPath')
			.setName('MuseScore exports folder')
			.setDesc('The path to the folder (relative to the vault root) where files auto-exported from MuseScore will be saved. If it does not exist, it will be automatically created. It is recommended to specify this folder in Obsidian Settings > Files and links > Excluded files so that the exported files do not clutter the link autocomplete.');

		this.addDropdownSetting('embedAs', EMBED_METHODS)
			.setName('Embed .mscz/.mscx link as')
			.setDesc('Embedding as MusicXML requires another plugin; see README for details.');
		this.addDropdownSetting('embedSubpathAs', EMBED_METHODS)
			.setName('Embed .mscz/.mscx link with subpath as')
			.setDesc('MusicXML: Allows you to embed only a specific part of the song etc specified by the subpath. PDF: Ignores the subpath.');
	}
}
