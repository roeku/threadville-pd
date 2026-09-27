import '@fontsource/caveat/700.css';
import './page.css';
import { VisibilityState, World } from '@iwsdk/core';
import projectOptions from 'virtual:iwsdk-project';
import { nightAudio } from './night/audio.js';
import { NightWatchSystem } from './night/night-watch-system.js';
import { loadTagFont } from './night/tags.js';

void loadTagFont();

World.create(document.getElementById('scene-container') as HTMLDivElement, projectOptions).then((world) => {
  world.registerSystem(NightWatchSystem);

  const enter = document.getElementById('enter-button');
  const note = document.getElementById('enter-note');
  const start = () => {
    nightAudio.unlock();
    void world.launchXR();
  };
  if (!world.xrEnabled) {
    enter?.setAttribute('disabled', 'true');
    if (note) note.textContent = 'Open this page in the Meta Quest browser, or run it locally to use the emulator.';
  } else {
    enter?.addEventListener('click', start);
  }
  world.visibilityState.subscribe((state) => {
    document.body.classList.toggle('immersive', state !== VisibilityState.NonImmersive);
  });
});
