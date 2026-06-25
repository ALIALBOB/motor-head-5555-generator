# MotorHeads Video Plan

The machine does not have local `ffmpeg` installed, so I generated storyboard frames first. These are ready to convert into MP4/WebM once a video encoder is available.

Frames:

`marketing/assets/video-storyboard-frames/`

## 20-Second X Launch Video

Format: 1920x1080, silent or subtle mechanical audio.

Scene 1, 0-4s:
MotorHeads title. Show token #1 full-gold. Text: “5555 interactive machine heads.”

Scene 2, 4-8s:
Show dismantle/assemble behavior. Text: “dismantle, drag, assemble.”

Scene 3, 8-12s:
Show full-gold edition. Text: “55 full-gold editions.”

Scene 4, 12-16s:
Show holder GTD. Text: “old archive holders get GTD access.”

Scene 5, 16-20s:
Show roadmap. Text: “awake layer after mint.”

## OpenSea Banner Loop

Format: wide crop, silent loop.

Use the first 10 full-gold images sliding slowly behind the MotorHeads title. Keep text minimal because OpenSea will crop on different screens.

Suggested text:

MotorHeads  
living archive machines

## Conversion Command Once ffmpeg Is Available

From the project root:

```powershell
ffmpeg -framerate 1 -i marketing/assets/video-storyboard-frames/scene-%02d.jpg -vf "fps=30,format=yuv420p,scale=1920:1080" -t 20 marketing/assets/motorheads-x-launch.mp4
```

For a smoother video, each storyboard image should be duplicated into a frame sequence with crossfades. The current frames are the art direction pack.
