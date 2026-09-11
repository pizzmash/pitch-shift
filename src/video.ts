// Self-contained: Chrome serializes this function for injection into the active tab.
export function controlVideo(action: string, value = 0) {
  const video = document.querySelector<HTMLVideoElement>('video.html5-main-video') ?? document.querySelector<HTMLVideoElement>('video');
  if (!video) throw new Error('YouTubeで動画を開いてから、もう一度お試しください。');
  if (action === 'speed' || action === 'reset') {
    video.preservesPitch = true;
    video.playbackRate = action === 'reset' ? 1 : Math.min(2, Math.max(0.25, value));
  }
  if (action === 'rewind') {
    if (!video.seekable.length) throw new Error('この動画はまだ巻き戻せません。再生してからお試しください。');
    const desired = video.currentTime - value;
    let target = video.seekable.start(0);
    for (let i = 0; i < video.seekable.length; i++) {
      if (desired >= video.seekable.start(i)) target = Math.min(desired, video.seekable.end(i));
    }
    video.currentTime = target;
  }
  return { speed: video.playbackRate, title: document.title.replace(/ - YouTube$/, '') };
}
