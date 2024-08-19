import { FileSystemAdapter, normalizePath, Platform, Plugin, TAbstractFile, TFile } from 'obsidian';

import { MuseScoreSettings, DEFAULT_SETTINGS, MuseScoreSettingTab } from 'settings';
import { Embed, EmbedContext, EmbedCreator } from 'typings';


const MUSESCORE_EXTENSIONS = ['mscz', 'mscx'];
export const EXPORT_EXTENSIONS = ['pdf', 'mxl'] as const;

function isMuseScoreFile(file: TAbstractFile): file is TFile {
	return file instanceof TFile && MUSESCORE_EXTENSIONS.includes(file.extension);
}

function parsePath(path: string) {
	const index = path.lastIndexOf('/');
	return {
		path,
		name: index >= 0 ? path.slice(index + 1) : path,
		folder: index >= 0 ? path.slice(0, index) : '/',
	};
}

export default class MuseScorePlugin extends Plugin {
	settings: MuseScoreSettings;

	async onload() {
		await this.loadSettings();
		await this.saveSettings();
		this.addSettingTab(new MuseScoreSettingTab(this));

		if (Platform.isDesktopApp) {
			this.registerEvent(this.app.vault.on('create', this.onCreateOrModify, this));
			this.registerEvent(this.app.vault.on('modify', this.onCreateOrModify, this));
		}
		this.registerEvent(this.app.vault.on('delete', this.onDelete, this));
		this.registerEvent(this.app.vault.on('rename', this.onRename, this));

		this.registerMuseScoreEmbed();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		if (Platform.isMacOS) {
			this.settings.executablePath ||= '/Applications/MuseScore 4.app/Contents/MacOS/mscore';
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onCreateOrModify(file: TAbstractFile) {
		if (!isMuseScoreFile(file)) return;

		await Promise.all(EXPORT_EXTENSIONS.map((extension) => this.createExportedFileFor(file, extension)));
	}

	onDelete(file: TAbstractFile) {
		if (!isMuseScoreFile(file)) return;

		for (const extension of EXPORT_EXTENSIONS) {
			const exportedFile = this.getExportedFileFor(file.path, extension);
			if (exportedFile) {
				this.app.vault.delete(exportedFile);
			}
		}
	}

	async onRename(file: TAbstractFile, oldPath: string) {
		if (!isMuseScoreFile(file)) return;

		for (const extension of EXPORT_EXTENSIONS) {
			const oldFile = this.getExportedFileFor(oldPath, extension);
			if (oldFile) {
				const { path, folder } = this.getExportedFileInfo(file.path, extension);
				if (!this.app.vault.getFolderByPath(folder)) {
					await this.app.vault.createFolder(folder);
				}
				this.app.fileManager.renameFile(oldFile, path);
			}
		}
	}

	registerEmbed(extensions: string[], embedCreator: EmbedCreator) {
		this.app.embedRegistry.registerExtensions(extensions, embedCreator);
		this.register(() => {
			return this.app.embedRegistry.unregisterExtensions(extensions);
		});
	}

	registerMuseScoreEmbed() {
		// @ts-ignore
		this.registerEmbed(MUSESCORE_EXTENSIONS, (ctx, museScoreFile, subpath) => {
			if (subpath && this.settings.embedSubpathAs === 'mxl'
				|| !subpath && this.settings.embedAs === 'mxl'
			) {
				// If OSMD MusicXML Viewer plugin is enabled, use the MusicXML embedder provided by that plugin.
				// It will handle the subpath correctly.
				if (this.app.plugins.plugins['osmd-musicxml']) {
					const musicXmlFile = this.getExportedFileFor(museScoreFile.path, 'mxl');
					if (musicXmlFile) {
						const musicXmlEmbed = this.app.embedRegistry.embedByExtension[musicXmlFile.extension];
						if (musicXmlEmbed) {
							return musicXmlEmbed(ctx, musicXmlFile, subpath);
						}
					}
				}

				// If not, we have to just ignore the subpath and use the built-in PDF embedder.
			}

			// Use the built-in PDF embedder.
			const pdfFile = this.getExportedFileFor(museScoreFile.path, 'pdf');
			if (pdfFile) {
				const pdfEmbed = this.app.embedRegistry.embedByExtension['pdf'];
				return pdfEmbed(ctx, pdfFile, subpath);
			}

			return null;
		});
	}

	postProcessEmbed(embed: Embed, ctx: EmbedContext) {
		ctx.containerEl.addClass('musescore-embed');
	}

	getExportedFileInfo(museScoreFilePath: string, extension: string) {
		const { folder, name } = parsePath(museScoreFilePath);
		const unnormalizedExportFolder = this.settings.folderPath + '/' + folder;
		const exportName = name + '.' + extension;
		return {
			path: normalizePath(unnormalizedExportFolder + '/' + exportName),
			name: exportName,
			folder: normalizePath(unnormalizedExportFolder),
		};
	}

	getExportedFileFor(museScoreFilePath: string, extension: string): TFile | null {
		const { path } = this.getExportedFileInfo(museScoreFilePath, extension);
		return this.app.vault.getFileByPath(path);
	}

	async createExportedFileFor(museScoreFile: TFile, extension: string): Promise<void> {
		const adapter = this.app.vault.adapter;
		if (!(adapter instanceof FileSystemAdapter)) return;

		const cmd = this.settings.executablePath;
		if (!cmd) return;

		const { folder: outputFolderPath, path: outputFilePath } = this.getExportedFileInfo(museScoreFile.path, extension);

		// If the output file exists and is up-to-date (= newer than the MuseScore file), do nothing.
		const outputFile = this.app.vault.getFileByPath(outputFilePath);
		if (outputFile && outputFile.stat.mtime >= museScoreFile.stat.mtime) {
			return;
		}

		// We have to create the output folder if it doesn't exist.
		if (!this.app.vault.getFolderByPath(outputFolderPath)) {
			await this.app.vault.createFolder(outputFolderPath);
		}

		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const { spawn } = require('child_process') as typeof import('child_process');

		// Run the MuseScore CLI to export the file.
		return new Promise<void>((resolve, reject) => {
			const outputFilePathAbsolute = adapter.getFullPath(outputFilePath);
			const inputFilePathAbsolute = adapter.getFullPath(museScoreFile.path);
			const museScoreProcess = spawn(cmd, [
				'-o', outputFilePathAbsolute,
				inputFilePathAbsolute,
			]);
			museScoreProcess.on('error', reject);
			museScoreProcess.on('close', (code) => {
				if (code) {
					return reject(code);
				}

				return resolve();
			});
		});
	}
}
