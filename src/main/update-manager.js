'use strict';

const fs = require('fs');
const path = require('path');

function readConfig(app) {
  try {
    const file = path.join(app.getAppPath(), 'update-config.json');
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    const feed = new URL(String(parsed.feedUrl || ''));
    if (feed.protocol !== 'https:' || feed.hostname !== 'github.com') return null;
    if (!/\/Diego-ops501\/PokeMux-Independent\/releases\/latest\/download\/?$/i.test(feed.pathname)) return null;
    return parsed.enabled === true ? { feedUrl: feed.toString().replace(/\/$/, '') } : null;
  } catch {
    return null;
  }
}

function createUpdateManager({ app, ipcMain, getWindow, log }) {
  let updater = null;
  let downloaded = false;
  let checking = false;
  const send = (status, detail = {}) => {
    const win = getWindow();
    if (win && !win.isDestroyed()) win.webContents.send('update:status', { status, ...detail });
  };

  const config = readConfig(app);
  const supported = !!config && app.isPackaged && process.platform === 'win32';
  const stampFile = path.join(app.getPath('userData'), 'ultima-verificacao-update.txt');

  async function ensureUpdater() {
    if (!supported) return null;
    if (updater) return updater;
    const { autoUpdater } = require('electron-updater');
    updater = autoUpdater;
    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = false;
    updater.allowPrerelease = false;
    updater.setFeedURL({ provider: 'generic', url: config.feedUrl, channel: 'latest' });
    updater.on('checking-for-update', () => send('checking'));
    updater.on('update-not-available', () => send('current'));
    updater.on('update-available', (info) => send('available', {
      version: String(info.version || ''),
      releaseName: String(info.releaseName || ''),
      releaseNotes: typeof info.releaseNotes === 'string' ? info.releaseNotes.slice(0, 4000) : '',
      size: Array.isArray(info.files) && info.files[0] ? Number(info.files[0].size || 0) : 0
    }));
    updater.on('download-progress', (p) => send('downloading', { percent: Math.max(0, Math.min(100, Number(p.percent || 0))) }));
    updater.on('update-downloaded', (info) => { downloaded = true; send('downloaded', { version: String(info.version || '') }); });
    updater.on('error', (error) => { log('update', error && error.message ? error.message : error); send('error', { message: 'Não foi possível verificar ou baixar a atualização.' }); });
    return updater;
  }

  ipcMain.handle('update:check', async () => {
    if (!supported) return { supported: false };
    if (checking) return { supported: true, checking: true };
    checking = true;
    try { await (await ensureUpdater()).checkForUpdates(); return { supported: true }; }
    catch (error) { log('update', error && error.message ? error.message : error); return { supported: true, error: true }; }
    finally { checking = false; }
  });
  ipcMain.handle('update:download', async () => {
    try { const u = await ensureUpdater(); if (!u) return false; await u.downloadUpdate(); return true; }
    catch (error) { log('update-download', error && error.message ? error.message : error); return false; }
  });
  ipcMain.handle('update:install', () => {
    if (!updater || !downloaded) return false;
    setImmediate(() => updater.quitAndInstall(false, true));
    return true;
  });

  async function checkAutomatic() {
    if (!supported) return;
    try {
      const last = Number(fs.readFileSync(stampFile, 'utf8')) || 0;
      if (Date.now() - last < 24 * 60 * 60 * 1000) return;
    } catch {}
    try {
      await fs.promises.mkdir(path.dirname(stampFile), { recursive: true });
      await fs.promises.writeFile(stampFile + '.tmp', String(Date.now()));
      await fs.promises.rename(stampFile + '.tmp', stampFile);
      await (await ensureUpdater()).checkForUpdates();
    } catch (e) { log('update-auto', e && e.message ? e.message : e); }
  }

  return { supported, checkAutomatic };
}

module.exports = { createUpdateManager, readConfig };
